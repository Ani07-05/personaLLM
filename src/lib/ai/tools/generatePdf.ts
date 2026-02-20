import { tool, zodSchema } from 'ai';
import { z } from 'zod';

export const generatePdfTool = tool({
  description:
    "Generate a PDF document with the provided content. The PDF will be downloaded in the user's browser. Use markdown formatting in the content.",
  inputSchema: zodSchema(
    z.object({
      title: z.string().describe('The title of the PDF document'),
      content: z.string().describe('The content of the PDF in markdown format'),
      filename: z
        .string()
        .optional()
        .describe('Optional filename for the download (without .pdf extension)'),
    })
  ),
  execute: async ({ title, content, filename }) => {
    return {
      action: 'generate-pdf',
      title,
      content,
      filename: filename ?? title.toLowerCase().replace(/\s+/g, '-'),
    };
  },
});
