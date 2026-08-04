// Send Web Push notifications to a list of users' subscriptions.
// Requires a valid signed-in caller. Regular users may only notify people they
// actually interact with (chat partners / friends); admins and teachers may
// notify broader audiences.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TARGETS = 500;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // --- Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await admin.auth.getUser(token);
    const caller = userData?.user;
    if (authError || !caller) return json({ error: "Unauthorized" }, 401);

    // --- Input validation ---
    const payloadIn = await req.json().catch(() => null);
    const rawIds = payloadIn?.user_ids;
    const title = typeof payloadIn?.title === "string" ? payloadIn.title.trim() : "";
    const bodyText = typeof payloadIn?.body === "string" ? payloadIn.body : "";
    const url = typeof payloadIn?.url === "string" && payloadIn.url.startsWith("/") ? payloadIn.url : "/";

    if (!Array.isArray(rawIds) || rawIds.length === 0 || rawIds.length > MAX_TARGETS || !title) {
      return json({ error: "invalid payload" }, 400);
    }
    const userIds: string[] = [...new Set(rawIds.filter((i: unknown) =>
      typeof i === "string" && UUID_RE.test(i)))] as string[];
    if (userIds.length === 0) return json({ error: "invalid payload" }, 400);

    // --- Authorization ---
    const { data: roles } = await admin
      .from("user_roles").select("role").eq("user_id", caller.id);
    const roleList = (roles || []).map((r: { role: string }) => r.role);
    const privileged = roleList.includes("admin") || roleList.includes("teacher");

    let allowed = userIds;
    if (!privileged) {
      const others = userIds.filter((id) => id !== caller.id);
      if (others.length > 0) {
        const [{ data: msgs }, { data: friends }] = await Promise.all([
          admin.from("direct_messages")
            .select("recipient_id").eq("sender_id", caller.id).in("recipient_id", others),
          admin.from("friendships")
            .select("user_id, friend_id")
            .or(`user_id.eq.${caller.id},friend_id.eq.${caller.id}`)
            .eq("status", "accepted"),
        ]);
        const related = new Set<string>([caller.id]);
        for (const m of msgs || []) related.add((m as { recipient_id: string }).recipient_id);
        for (const f of friends || []) {
          const row = f as { user_id: string; friend_id: string };
          related.add(row.user_id === caller.id ? row.friend_id : row.user_id);
        }
        allowed = userIds.filter((id) => related.has(id));
      }
      if (allowed.length === 0) return json({ error: "forbidden" }, 403);
    }

    const { data: subs, error } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", allowed);
    if (error) throw error;

    const payload = JSON.stringify({
      title: title.slice(0, 120),
      body: String(bodyText).slice(0, 240),
      url,
    });

    const results = await Promise.allSettled(
      (subs || []).map(async (s: any) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 60 * 60 * 24 }
          );
          await admin.from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", s.id);
        } catch (e: any) {
          const code = e?.statusCode;
          if (code === 404 || code === 410) {
            await admin.from("push_subscriptions").delete().eq("id", s.id);
          }
          throw e;
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return json({ sent, total: subs?.length || 0 });
  } catch (e) {
    console.error("send-push error", e);
    return json({ error: "internal error" }, 500);
  }
});
