import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = "BAXFQQOWYC3sAhOyXmKtoPH2lIeId1_qZXZ-RLx-nrP7RvycVY5h95D0BxXQEsm9qKVJK2znuynyS5QUT64xgD4";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function toBase64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.error("SW register failed", e);
    return null;
  }
}

export async function enableWebPush(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "denied" };

  const reg = await ensureServiceWorker();
  if (!reg) return { ok: false, reason: "no-sw" };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false, reason: "no-user" };

  const json: any = sub.toJSON();
  const endpoint = json.endpoint || sub.endpoint;
  const p256dh = json.keys?.p256dh || toBase64(sub.getKey("p256dh"));
  const auth = json.keys?.auth || toBase64(sub.getKey("auth"));

  await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent.slice(0, 200),
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  try { localStorage.setItem("lishna:webpush", "1"); } catch {}
  return { ok: true };
}

export async function disableWebPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    try { await sub.unsubscribe(); } catch {}
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  }
  try { localStorage.removeItem("lishna:webpush"); } catch {}
}

export async function sendPushTo(userIds: string[], title: string, body: string, url = "/") {
  if (!userIds?.length) return;
  try {
    await supabase.functions.invoke("send-push", {
      body: { user_ids: userIds, title, body, url },
    });
  } catch (e) {
    console.warn("sendPushTo failed", e);
  }
}

export async function maybeAutoEnable() {
  if (!isPushSupported()) return;
  if (Notification.permission !== "granted") return;
  if (localStorage.getItem("lishna:webpush:optout") === "1") return;
  await enableWebPush();
}
