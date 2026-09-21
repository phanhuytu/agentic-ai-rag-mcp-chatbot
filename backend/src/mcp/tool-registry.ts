export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

export type RegisteredTool = ToolDefinition & {
  handler: ToolHandler;
};

const tools = new Map<string, RegisteredTool>();

export function registerTool(tool: RegisteredTool): void {
  tools.set(tool.name, tool);
}

export function listTools(): ToolDefinition[] {
  return [...tools.values()].map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  }));
}

export async function callTool(name: string, input: Record<string, unknown> = {}): Promise<unknown> {
  const tool = tools.get(name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return tool.handler(input);
}
