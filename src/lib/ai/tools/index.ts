import type { ToolSet } from 'ai';
import { createWebSearchTool } from './webSearch';
import { createCodeInterpreterTool } from './codeInterpreter';
import { generatePdfTool } from './generatePdf';
import { createDeepResearchTool } from './deepResearch';

interface BuildToolsOptions {
  enabledTools: string[];
  tavilyKey?: string;
  e2bKey?: string;
}

export function buildTools({ enabledTools, tavilyKey, e2bKey }: BuildToolsOptions): ToolSet {
  const tools: ToolSet = {};

  if (enabledTools.includes('webSearch') && tavilyKey) {
    tools.webSearch = createWebSearchTool(tavilyKey);
  }

  if (enabledTools.includes('codeInterpreter') && e2bKey) {
    tools.codeInterpreter = createCodeInterpreterTool(e2bKey);
  }

  if (enabledTools.includes('generatePdf')) {
    tools.generatePdf = generatePdfTool;
  }

  if (enabledTools.includes('deepResearch') && tavilyKey) {
    tools.deepResearch = createDeepResearchTool(tavilyKey);
  }

  return tools;
}
