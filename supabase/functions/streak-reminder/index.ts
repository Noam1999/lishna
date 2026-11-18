// Scheduled: sends daily-streak push reminders at 17:00/19:00/22:00 Israel time
// only to users who have not completed a regular Aramaic word quiz today.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const israelDate = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
const israelHour = () => Number(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem", hour: "2-digit", hourCycle: "h23" }));

const MESSAGES: Record<number, (s: number) => { title: string; body: string }> = {
  17: (s) => ({ title: "🔥 הלהבה שלך מחכה!", body: s > 0 ? `${s} ימי רצף — מבחן קצר בארמית ישמור עליה.` : "מבחן קצר בארמית ומתחילים רצף חדש!" }),
  19: (s) => ({ title: "⏳ עוד לא שמרת על הרצף היום", body: s > 0 ? `אל תיתן ל־${s} ימים להיעלם. 2 דקות וזה סגור!` : "כמה מילים בארמית — וזה יום ראשון ברצף." }),
  22: (s) => ({ title: "🚨 הזדמנות אחרונה להיום!", body: s > 0 ? `הרצף של ${s} ימים נגמר בחצות. בוא נציל אותו!` : "עוד אפשר להתחיל רצף לפני חצות 🔥" }),
};

Deno.serve(async (req) => {
  const denied = authenticateCronRequest(req);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const hour = [17, 19, 22].includes(Number(body?.hour)) ? Number(body.hour) : israelHour();
    const msg = MESSAGES[hour] ?? MESSAGES[19];
    // DST: cron fires at both UTC offsets; only act at the real Israel hour.
    if (!body?.force && israelHour() !== hour) return Response.json({ skipped: "not this hour" });

    const today = israelDate(new Date());
    const { data: subs, error } = await admin.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth");
    if (error) throw error;
    const userIds = [...new Set((subs || []).map((s) => s.user_id))];
    const { data: profiles } = userIds.length
      ? await admin.from("profiles").select("user_id, streak, last_quiz_date").in("user_id", userIds)
      : { data: [] };
    const pending = new Map<string, number>();
    for (const p of profiles || []) {
      const done = p.last_quiz_date && israelDate(new Date(p.last_quiz_date)) === today;
      if (!done) pending.set(p.user_id, p.streak ?? 0);
    }
    let sent = 0;
    await Promise.allSettled((subs || []).filter((s) => pending.has(s.user_id)).map(async (s) => {
      const m = msg(pending.get(s.user_id)!);
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ ...m, url: "/quiz" }), { TTL: 60 * 60 * 2 });
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) await admin.from("push_subscriptions").delete().eq("id", s.id);
      }
    }));
    return Response.json({ hour, sent, pendingUsers: pending.size });
  } catch (e) {
    console.error("streak-reminder error", e);
    return Response.json({ error: "internal error" }, { status: 500 });
  }
});
