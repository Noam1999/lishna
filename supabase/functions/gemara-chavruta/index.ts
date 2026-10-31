import { createOpenAI } from "npm:@ai-sdk/openai@2";
import { streamText } from "npm:ai@5";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `אתה "חברותא" — חברותא ישיבתית סבלנית, חמה ובקיאה בתלמוד, שלומדת יחד עם תלמיד דובר עברית.
לפניך טקסט הסוגיה שהתלמיד לומד כרגע (מתוך ספריא). ענה על שאלותיו על הסוגיה.
כללים:
- ענה בעברית פשוטה וברורה, בפורמט Markdown (הדגשות, רשימות, כותרות קצרות לפי הצורך).
- היה ממוקד וקצר: עד כ-150 מילים, אלא אם התלמיד ביקש פירוט.
- כשמסבירים מהלך סוגיה — פרק לשלבים: משנה/מימרא, קושיא, תירוץ, ראיה, מסקנה. ציין מי אומר מה.
- צטט מילים קצרות מהטקסט בארמית ותרגם אותן.
- אל תמציא טקסט, אמוראים או דעות שאינם מופיעים בסוגיה. אם משהו לא ברור מהטקסט — אמור זאת בכנות.
- בסוף התשובה אפשר להציע שאלת המשך קצרה אחת כדי לעודד חשיבה.
- אם השאלה אינה קשורה ללימוד, החזר בעדינות את השיחה לסוגיה.`;

type Msg = { role: "user" | "assistant"; content: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
  try {
    const body = await req.json().catch(() => null);
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "יש להתחבר כדי להשתמש בחברותא", reason: "auth" }, 401);

    const messages: Msg[] = Array.isArray(body?.messages) ? body.messages : [];
    const title = typeof body?.title === "string" ? body.title.slice(0, 200) : "";
    const pageText = typeof body?.text === "string" ? body.text.slice(0, 8000) : "";
    const clean = messages
      .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
    if (!clean.length || clean[clean.length - 1].role !== "user") return json({ error: "קלט לא תקין" }, 400);
    if (clean[clean.length - 1].content.length > 1000) return json({ error: "השאלה ארוכה מדי" }, 400);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "שירות ה-AI לא מוגדר" }, 500);

    const { data: use, error: useErr } = await sb.rpc("consume_ai_use", { _pay: !!body?.pay });
    if (useErr) return json({ error: "שגיאה בבדיקת מכסה" }, 500);
    if (!use?.ok) {
      return json({
        error: use?.reason === "diamonds" ? "אין לך מספיק יהלומים" : "נגמרו השימושים החינמיים",
        reason: use?.reason,
      }, 200);
    }

    let gatewayError: { status: number; message: string } | null = null;
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: async (input, init) => {
        const r = await fetch(input, init);
        if (!r.ok) gatewayError = { status: r.status, message: await r.clone().text() };
        return r;
      },
    });

    const system = `${SYSTEM}\n\n## הסוגיה הנלמדת: ${title || "לא צוין"}\n${pageText || "(הטקסט לא זמין)"}`;
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system,
      messages: clean,
      abortSignal: req.signal,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    let out = "";
    try {
      for await (const chunk of result.textStream) out += chunk;
    } catch (_) { /* handled below */ }
    if (gatewayError) {
      const g = gatewayError as { status: number; message: string };
      const msg = g.status === 429 ? "יותר מדי בקשות, נסה שוב בעוד רגע"
        : g.status === 402 ? "נגמרו קרדיטי ה-AI של האפליקציה"
        : (() => { try { return JSON.parse(g.message)?.error?.message || JSON.parse(g.message)?.message || "שגיאה בשירות ה-AI"; } catch { return "שגיאה בשירות ה-AI"; } })();
      console.error("gateway", g.status, g.message);
      return json({ error: msg }, g.status);
    }
    if (!out.trim()) return json({ error: "לא התקבלה תשובה" }, 502);
    return json({ result: out, usage: use });
  } catch (e) {
    console.error(e);
    return json({ error: "שגיאה בעיבוד הבקשה" }, 500);
  }
});
