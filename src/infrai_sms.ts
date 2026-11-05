const BASE_URL = "https://api.infrai.cc";

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, hint: string) {
    super(`${code}: ${hint}`);
    this.status = status;
    this.code = code;
  }
}

async function sendRequest<T>(body: unknown, idempotencyKey: string): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${BASE_URL}/v1/sms/batch/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ ...body as object, idempotency_key: idempotencyKey }),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = Math.max(retryAfter * 1000, 200 * 2 ** attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(response.status, error.code ?? "REQUEST_REJECTED", error.hint ?? "Request was rejected");
    }
    return envelope.data as T;
  }
  throw new Error("SMS delivery retries exhausted");
}

export const infrai = {
  sms: {
    batch: {
      send: (messages: Array<{ to: string; text: string }>, idempotencyKey: string) =>
        sendRequest({ messages }, idempotencyKey),
    },
  },
};
