import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { buildProvider } from '@/lib/ai/providers';
import { buildTools } from '@/lib/ai/tools';
import type { ProviderId } from '@/types/provider';

export const maxDuration = 120;

const DEFAULT_SYSTEM_PROMPT = `You are a helpful, knowledgeable assistant. Follow these rules strictly:

- Do NOT use emojis in your responses. Ever. No emoticons either.
- Be direct, concise, and precise in your answers.
- When writing code, always use proper syntax highlighting by specifying the language in fenced code blocks (e.g. \`\`\`python, \`\`\`typescript, \`\`\`bash, etc.).
- Use markdown formatting where appropriate: headings, lists, bold, inline code, and code blocks.
- Provide well-structured, readable responses.`;

export async function POST(req: Request) {
  try {
    const {
      messages,
      providerId,
      modelId,
      apiKey,
      tavilyKey,
      e2bKey,
      enabledTools = [],
      systemPrompt,
      thinking = false,
      maxSteps = 10,
      ollamaBaseUrl,
    }: {
      messages: UIMessage[];
      providerId: ProviderId;
      modelId: string;
      apiKey?: string;
      tavilyKey?: string;
      e2bKey?: string;
      enabledTools?: string[];
      systemPrompt?: string;
      thinking?: boolean;
      maxSteps?: number;
      ollamaBaseUrl?: string;
    } = await req.json();

    if (!providerId || !modelId) {
      return new Response('Missing providerId or modelId', { status: 400 });
    }

    const model = buildProvider({ providerId, modelId, apiKey, ollamaBaseUrl });
    const tools = buildTools({ enabledTools, tavilyKey, e2bKey });
    const hasTools = Object.keys(tools).length > 0;
    const useThinking = thinking && providerId === 'anthropic';

    console.log('[chat] enabledTools:', enabledTools, '| built tools:', Object.keys(tools), '| tavilyKey present:', !!tavilyKey);

    // Use custom persona prompt if provided, otherwise fall back to default.
    // Always prepend the base instructions.
    let finalSystemPrompt = systemPrompt
      ? `${DEFAULT_SYSTEM_PROMPT}\n\n---\n\nAdditional instructions from persona:\n${systemPrompt}`
      : DEFAULT_SYSTEM_PROMPT;

    // If tools are available, instruct the model to use them
    if (hasTools) {
      const toolNames = Object.keys(tools);
      finalSystemPrompt += `\n\n---\n\nYou have access to the following tools: ${toolNames.join(', ')}. When the user asks you to search the web, use the webSearch tool. When they ask for deep research, use the deepResearch tool. When they ask to generate a PDF, use the generatePdf tool. When they ask to run code, use the codeInterpreter tool. Always use the appropriate tool when available rather than saying you cannot do something.`;
    }

    // Strip display-only file parts (url === '') — these are PDF/text attachments
    // whose content is already included as a text part with <attachment> tags.
    const cleanedMessages: UIMessage[] = messages.map((msg) => ({
      ...msg,
      parts: msg.parts.filter(
        (p) => !(p.type === 'file' && (p as { type: 'file'; url?: string }).url === '')
      ),
    }));

    const result = streamText({
      model,
      system: finalSystemPrompt,
      messages: await convertToModelMessages(cleanedMessages),
      tools: hasTools ? tools : undefined,
      stopWhen: hasTools ? stepCountIs(maxSteps) : undefined,
      ...(useThinking
        ? {
            providerOptions: {
              anthropic: { thinking: { type: 'enabled', budgetTokens: 10000 } },
            },
          }
        : {}),
      ...(providerId === 'nvidia'
        ? {
            providerOptions: {
              openai: { chat_template_kwargs: { thinking: false } },
            },
          }
        : {}),
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      originalMessages: messages,
      messageMetadata: ({ part }) => {
        if (part.type === 'finish-step') {
          return { usage: part.usage };
        }
      },
    });
  } catch (error) {
    console.error('Chat route error:', JSON.stringify(error, null, 2), error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
