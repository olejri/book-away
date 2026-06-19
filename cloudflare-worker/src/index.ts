export interface Env {
  GOOGLE_SPEECH_API_KEY: string;
  WORKER_API_KEY: string;
  ALLOWED_ORIGIN: string;
}

interface GoogleSpeechResult {
  results?: Array<{
    alternatives?: Array<{
      transcript?: string;
      confidence?: number;
    }>;
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/** Safe base64 encoding that handles large buffers without stack overflow */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function corsHeaders(allowedOrigin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(env.ALLOWED_ORIGIN);

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, cors);
    }

    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${env.WORKER_API_KEY}`) {
      return jsonResponse({ error: "Unauthorized" }, 401, cors);
    }

    // ── Parse form data ───────────────────────────────────────────────────────
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return jsonResponse({ error: "Invalid multipart form data" }, 400, cors);
    }

    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "en-US";

    if (!audioFile) {
      return jsonResponse({ error: "No audio file provided" }, 400, cors);
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    if (arrayBuffer.byteLength < 100) {
      return jsonResponse({ error: "Audio file is too small or empty" }, 400, cors);
    }

    // ── Call Google Speech-to-Text V1 ─────────────────────────────────────────
    const base64Audio = arrayBufferToBase64(arrayBuffer);
    const googleUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${env.GOOGLE_SPEECH_API_KEY}`;

    let googleResponse: Response;
    try {
      googleResponse = await fetch(googleUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            encoding: "WEBM_OPUS",
            sampleRateHertz: 48000,
            languageCode: language,
            enableAutomaticPunctuation: true,
            model: "latest_long",
          },
          audio: {
            content: base64Audio,
          },
        }),
      });
    } catch (err) {
      console.error("Failed to reach Google Speech API:", err);
      return jsonResponse({ error: "Failed to reach Google Speech API" }, 502, cors);
    }

    const googleBody = (await googleResponse.json()) as GoogleSpeechResult;

    if (!googleResponse.ok) {
      console.error(
        `Google Speech API error ${googleResponse.status}:`,
        JSON.stringify(googleBody),
      );
      return jsonResponse(
        {
          error: "Speech recognition failed",
          details: googleBody.error?.message ?? "Unknown error",
        },
        502,
        cors,
      );
    }

    // ── Extract transcript ────────────────────────────────────────────────────
    const transcript = (googleBody.results ?? [])
      .flatMap((r) => r.alternatives?.[0]?.transcript ?? "")
      .join(" ")
      .trim();

    return jsonResponse({ transcript }, 200, cors);
  },
};
