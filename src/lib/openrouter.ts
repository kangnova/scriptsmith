const MODELS = [
  "deepseek/deepseek-chat",
  "meta-llama/llama-3.3-70b-instruct",
  "qwen/qwen-2.5-72b-instruct",
];

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CompleteOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Calls OpenRouter with an ordered list of models. If a model is rate-limited,
 * errored, or returns empty, it falls through to the next one.
 */
export async function complete(
  messages: ChatMessage[],
  opts: CompleteOptions = {}
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");

  let lastError = "";
  for (const model of MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost",
          "X-Title": "scriptsmith",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.9,
          max_tokens: opts.maxTokens ?? 1800,
        }),
      });

      const data = await res.json().catch(() => null);

      const text: string | undefined = data?.choices?.[0]?.message?.content;
      if (text) return text;

      lastError =
        data?.error?.message ||
        (res.ok ? "empty response from model" : `OpenRouter ${res.status}`);
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`all models failed: ${lastError}`);
}
