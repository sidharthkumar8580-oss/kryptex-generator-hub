import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const TIMEOUT_MS = 45000;

async function requestProvider(
  provider: string,
  url: string,
  key: string,
  model: string,
  messages: ChatMessage[]
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
      }),
      signal: controller.signal,
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`${provider} HTTP ${response.status}`);
    }

    const data = JSON.parse(text);
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error(`${provider} returned no reply`);
    }

    return {
      reply: String(reply),
      provider,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runChat(body: {
  messages?: ChatMessage[];
  message?: string;
}) {
  const messages: ChatMessage[] =
    Array.isArray(body.messages) && body.messages.length
      ? body.messages
      : body.message
        ? [{ role: 'user', content: body.message }]
        : [];

  if (!messages.length) {
    throw new Error('No chat message provided');
  }

  const providers = [
    {
      name: 'GROQ',
      key: process.env.GROQ_API_KEY?.trim(),
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: process.env.GROQ_CHAT_MODEL || 'llama-3.1-8b-instant',
    },
    {
      name: 'OPENAI',
      key: process.env.OPENAI_API_KEY?.trim(),
      url: 'https://api.openai.com/v1/chat/completions',
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
    },
    {
      name: 'HUGGINGFACE',
      key: process.env.HF_TOKEN?.trim(),
      url: 'https://router.huggingface.co/v1/chat/completions',
      model: process.env.HF_TEXT_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
    },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    if (!provider.key) continue;

    try {
      return await requestProvider(
        provider.name,
        provider.url,
        provider.key,
        provider.model,
        messages
      );
    } catch (error) {
      console.error(
        `${provider.name} failed:`,
        error instanceof Error ? error.message : 'unknown error'
      );
      errors.push(provider.name);
    }
  }

  throw new Error(
    errors.length
      ? `All AI chat providers failed: ${errors.join(', ')}`
      : 'No AI chat provider is configured'
  );
}
