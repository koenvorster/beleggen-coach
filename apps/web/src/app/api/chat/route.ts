import { NextRequest } from "next/server";

export const runtime = "edge";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface FastApiChatResponse {
  response: string;
  agent: string;
  interaction_id: string;
}

const MOCK_RESPONSES = {
  etf: "Een ETF is een mandje van aandelen dat je op de beurs kunt kopen. Het grote voordeel is spreiding: je belegt meteen in honderden bedrijven tegelijk. Voor beginners zijn ETF's ideaal omdat ze goedkoop, eenvoudig en breed gespreid zijn. Dit is educatieve informatie, geen financieel advies. 💡",
  kosten:
    "De kosten van een ETF worden uitgedrukt als TER (Total Expense Ratio). Een goede ETF voor beginners heeft een TER onder de 0,25%. Bij VWCE is dat 0,22%, bij IWDA 0,20%. Op lange termijn maakt dit een significant verschil door het rente-op-rente effect. Dit is educatieve informatie, geen financieel advies. 💡",
  risico:
    "Risico in beleggen betekent dat de waarde van je investering kan schommelen. Hoe langer je tijdshorizon, hoe minder het dagelijkse risico telt — de markt heeft historisch altijd hersteld. Jouw risicoprofiel bepaalt de juiste mix: voorzichtig (meer obligaties), evenwichtig (mix), of groeigericht (meer aandelen-ETF's). Dit is educatieve informatie, geen financieel advies. 💡",
  beginnen:
    "De beste tijd om te beginnen is vandaag, ook met een klein bedrag. €50/maand in een brede ETF zoals VWCE of IWDA is een uitstekend startpunt. Stel een automatische maandelijkse overschrijving in zodat je het niet vergeet. Kijk niet elke dag naar koersen — dat verhoogt stress zonder nut. Dit is educatieve informatie, geen financieel advies. 💡",
  default:
    "Dat is een goede vraag! Voor beginners raad ik aan te focussen op brede, laaggekostende ETF's zoals VWCE (wereldwijd gespreid) of IWDA (ontwikkelde landen). Begin met een bedrag dat je maandelijks kunt missen, en laat het rente-op-rente effect zijn werk doen. Heb je een specifiekere vraag over ETF's, kosten of risico? Dit is educatieve informatie, geen financieel advies. 💡",
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("etf") || lower.includes("fonds")) return MOCK_RESPONSES.etf;
  if (lower.includes("kost") || lower.includes("ter") || lower.includes("goedkoop")) return MOCK_RESPONSES.kosten;
  if (lower.includes("risico") || lower.includes("schommel") || lower.includes("daling")) return MOCK_RESPONSES.risico;
  if (lower.includes("begin") || lower.includes("start") || lower.includes("eerste")) return MOCK_RESPONSES.beginnen;
  return MOCK_RESPONSES.default;
}

function streamText(text: string, delayMs: number): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const words = text.split(" ");
      for (const word of words) {
        controller.enqueue(new TextEncoder().encode(word + " "));
        await new Promise((r) => setTimeout(r, delayMs));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { messages: ChatMessage[]; userId?: string };
  const { messages, userId } = body;
  const lastMessage = messages[messages.length - 1]?.content ?? "";

  try {
    const backendResp = await fetch(`${API_BASE}/api/v1/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userId ? { "X-User-Id": userId } : {}),
      },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        agent: "gedragscoach",
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!backendResp.ok) {
      throw new Error(`Backend ${backendResp.status}`);
    }

    const data = (await backendResp.json()) as FastApiChatResponse;
    const text = data.response ?? "Geen antwoord van de coach.";
    return streamText(text, 20);
  } catch (err) {
    // Fallback naar mock als FastAPI niet bereikbaar is
    console.warn("FastAPI chat niet bereikbaar, gebruik mock:", err);
    return streamText(getMockResponse(lastMessage), 30);
  }
}
