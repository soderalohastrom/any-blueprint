import type { Context, Config } from "@netlify/functions";

const MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Fast & capable' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Quick & affordable' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'Most capable' },
];

export default async (req: Request, context: Context) => {
  return new Response(JSON.stringify({ models: MODELS, default: 'gpt-4o' }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config: Config = {
  path: "/api/models"
};
