export type ToolId = 'webSearch' | 'codeInterpreter' | 'generatePdf' | 'deepResearch';

export interface ToolDefinition {
  id: ToolId;
  name: string;
  description: string;
  icon: string;
  requiresKey?: 'tavily' | 'e2b';
}

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    id: 'webSearch',
    name: 'Web Search',
    description: 'Search the web for current information',
    icon: 'Search',
    requiresKey: 'tavily',
  },
  {
    id: 'codeInterpreter',
    name: 'Code Interpreter',
    description: 'Execute Python code in a secure sandbox',
    icon: 'Code2',
    requiresKey: 'e2b',
  },
  {
    id: 'generatePdf',
    name: 'PDF Generator',
    description: 'Generate and download PDF documents',
    icon: 'FileText',
  },
  {
    id: 'deepResearch',
    name: 'Deep Research',
    description: 'Conduct multi-step research with synthesis',
    icon: 'BookOpen',
    requiresKey: 'tavily',
  },
];
