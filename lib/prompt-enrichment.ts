/**
 * Prompt Enrichment Service - HANDSOME CLAUDE IMPLEMENTATION 🎩
 * 
 * Supports multiple LLM providers: OpenAI (direct) and OpenRouter (multi-model)
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

/**
 * Available models for prompt enrichment
 */
export const AVAILABLE_MODELS = [
  // OpenAI Models
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Fast & capable' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Quick & affordable' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'Most capable' },
  // OpenRouter Models (requires OPENROUTER_API_KEY)
  { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet', provider: 'openrouter', description: 'Creative & precise' },
  { id: 'anthropic/claude-3-opus', name: 'Claude Opus', provider: 'openrouter', description: 'Most capable Claude' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'openrouter', description: 'Google\'s best' },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];

/**
 * System prompt for the Blueprint Architect
 */
export const BLUEPRINT_ARCHITECT_SYSTEM_PROMPT = `You are a Blueprint Architect - you transform abstract human concepts into detailed technical blueprint specifications for AI image generation.

When a user describes a concept, you must:

1. UNDERSTAND the core metaphor or idea deeply - what is the essence they're trying to visualize?

2. EXPAND it into rich visual components:
   - Primary structures and shapes (geometric forms, architectural elements)
   - Relationships and connections (nodes, arrows, flows, pathways)
   - Layering (foreground, midground, background depth)
   - Annotations and labels with clever, contextually relevant text
   - Technical styling elements (measurements, revision blocks, cross-sections, detail callouts)
   
3. ADD blueprint authenticity with creative flourishes:
   - Title blocks with imaginative project names
   - Revision history that tells a micro-story ("Rev 3: Added existential crisis module")
   - "Approved by" / "Checked by" with contextually relevant names (historical figures, fictional characters, ironic experts)
   - Scale indicators, dimension lines, section markers with playful measurements
   - Grid paper or technical drawing aesthetics
   - Engineering stamps and certification marks

4. INCLUDE precise style guidance:
   - Classic blueprint aesthetic: white/light cyan lines on deep navy blue background
   - Architectural precision meets conceptual abstraction
   - Balance between technical accuracy and artistic whimsy
   - Include impossible geometries or Escher-like elements where conceptually appropriate

5. OUTPUT a single detailed description (500-1000 words) that serves as the prompt for the image generation system. 

CRITICAL: 
- Do NOT include any preamble, explanation, or meta-commentary
- Just output the raw visual description
- Be specific about colors, positions, text content, and relationships
- The more vivid and specific, the more stunning the output

Remember: You are translating CONCEPTS into VISUAL ENGINEERING SPECIFICATIONS.
Think like an architect who dreams in impossible blueprints.`;

/**
 * Get the appropriate LLM client based on model selection
 */
function getLLMClient(modelId: string) {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  const provider = model?.provider || 'openai';

  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY required for this model. Switch to an OpenAI model or add your OpenRouter key.');
    }
    return createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      headers: {
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:8081',
        'X-Title': 'Blueprint Vision',
      },
    });
  }

  // Default: OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set. Add it to your .env file.');
  }
  return createOpenAI({ apiKey });
}

/**
 * Enrich a user's simple idea into a detailed blueprint prompt
 */
export async function enrichPrompt(
  userInput: string, 
  modelId: string = 'gpt-4o'
): Promise<{ enrichedPrompt: string; model: string }> {
  const client = getLLMClient(modelId);
  
  const { text } = await generateText({
    model: client(modelId),
    system: BLUEPRINT_ARCHITECT_SYSTEM_PROMPT,
    prompt: `Transform this concept into a detailed blueprint specification:\n\n"${userInput}"`,
    maxTokens: 1500,
    temperature: 0.8,
  });
  
  return {
    enrichedPrompt: text,
    model: modelId,
  };
}

/**
 * Get available models based on configured API keys
 */
export function getAvailableModels() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

  return AVAILABLE_MODELS.filter(model => {
    if (model.provider === 'openai') return hasOpenAI;
    if (model.provider === 'openrouter') return hasOpenRouter;
    return false;
  });
}
