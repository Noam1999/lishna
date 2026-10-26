import { createOpenAI } from "npm:@ai-sdk/openai@2";
import { streamText } from "npm:ai@5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `אתה מומחה לארמית בבלית (ארמית של התלמוד הבבלי) ומלמד אותה לדוברי עברית.
המשתמש יזין מילה, ביטוי או משפט בארמית בבלית (לעיתים עם הקשר).
ענה בעברית בלבד, בפורמט Markdown, במבנה הבא:
## תרגום
תרגום מדויק לעברית לפי ההקשר התלמודי.
## פירוק מילה במילה
רשימה: כל מילה בארמית — תרגומה — חלק דיבר (פועל/שם עצם/מילת קישור וכו').
## הסבר דקדוקי
שורש, בניין, זמן, גוף, תחיליות וסיומות (כגון ד־, ק־, ־א הידיעה), ותופעות דקדוקיות בולטות.
## הקשר בגמרא
היכן ואיך הביטוי משמש בדרך כלל בסוגיות (בקצרה).
אם הקלט אינו ארמית, ציין זאת בעדינות ונסה לעזור. היה תמציתי וברור.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
  try {
    const { text, context } = await req.json();
    if (!text || typeof text !== "string" || text.length > 1000) return json({ error: "קלט לא תקין" }, 400);
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "שירות ה-AI לא מוגדר" }, 500);

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
    const userMsg = context ? `טקסט: ${text}\nהקשר: ${context}` : text;
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
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
        : "שגיאה בשירות ה-AI";
      console.error("gateway", g.status, g.message);
      return json({ error: msg }, g.status);
    }
    if (!out.trim()) return json({ error: "לא התקבלה תשובה" }, 502);
    return json({ result: out });
  } catch (e) {
    console.error(e);
    return json({ error: "שגיאה בעיבוד הבקשה" }, 500);
  }
});
