import { tool, zodSchema } from 'ai';
import { z } from 'zod';

export function createCodeInterpreterTool(e2bApiKey: string) {
  return tool({
    description:
      'Execute Python code in a secure sandbox. Useful for data analysis, calculations, generating charts, and running scripts. Returns stdout, stderr, and any generated files.',
    inputSchema: zodSchema(
      z.object({
        code: z.string().describe('The Python code to execute'),
        language: z
          .enum(['python'])
          .optional()
          .default('python')
          .describe('Programming language (currently only Python supported)'),
      })
    ),
    execute: async ({ code }) => {
      const { Sandbox } = await import('@e2b/code-interpreter');

      const sandbox = await Sandbox.create({ apiKey: e2bApiKey });
      try {
        const result = await sandbox.runCode(code);

        const output: {
          stdout: string;
          stderr: string;
          results: Array<{ type: string; data?: string; text?: string }>;
          error?: string;
        } = {
          stdout: result.logs.stdout.join('\n'),
          stderr: result.logs.stderr.join('\n'),
          results: result.results.map((r) => ({
            type: r.png ? 'image' : 'text',
            data: r.png ? `data:image/png;base64,${r.png}` : undefined,
            text: r.text ?? undefined,
          })),
        };

        if (result.error) {
          output.error = result.error.value;
        }

        return output;
      } finally {
        await sandbox.kill();
      }
    },
  });
}
