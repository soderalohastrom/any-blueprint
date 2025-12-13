/**
 * Prompt Enrichment Service - HANDSOME CLAUDE IMPLEMENTATION 🎩
 * 
 * Takes casual user input and transforms it into a detailed
 * blueprint specification using OpenRouter (Claude, GPT-4, etc.)
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

/**
 * System prompt for the Blueprint Architect
 * This is THE SECRET SAUCE - refined through real blueprint generation experience
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
 * Initialize OpenRouter client (OpenAI-compatible)
 */
function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set. Add it to your .env file.');
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

/**
 * Enrich a user's simple idea into a detailed blueprint prompt
 * 
 * @param userInput - The user's casual description of what they want to visualize
 * @returns A detailed 500-1000 word blueprint specification
 */
export async function enrichPrompt(userInput: string): Promise<string> {
  const openrouter = getOpenRouterClient();
  
  // Using Claude Sonnet for best creative + instruction following balance
  // Can also try: 'anthropic/claude-3-opus', 'openai/gpt-4o', 'google/gemini-pro-1.5'
  const model = process.env.ENRICHMENT_MODEL || 'anthropic/claude-sonnet-4-20250514';
  
  const { text } = await generateText({
    model: openrouter(model),
    system: BLUEPRINT_ARCHITECT_SYSTEM_PROMPT,
    prompt: `Transform this concept into a detailed blueprint specification:\n\n"${userInput}"`,
    maxTokens: 1500,
    temperature: 0.8, // A bit of creativity for the enrichment
  });
  
  return text;
}

/**
 * Quick validation - is the enriched prompt good enough?
 */
export function validateEnrichedPrompt(prompt: string): boolean {
  // Should be at least 300 words for a good blueprint spec
  const wordCount = prompt.split(/\s+/).length;
  return wordCount >= 200;
}

/**
 * Example transformations for reference:
 * 
 * INPUT: "the complexity of a project, like an iceberg"
 * OUTPUT: [500-1000 words describing underwater complexity, surface simplicity,
 *          hidden dependencies, title block "PROJECT ICEBERG - SURFACE ASSESSMENT",
 *          approved by "Captain Smith (Titanic)", revision history showing scope creep, etc.]
 * 
 * INPUT: "how the subconscious processes dreams"  
 * OUTPUT: [Detailed dream logic schematic with impossible geometries, Escher staircases,
 *          melting clocks, symbol processors, title block approved by Freud/Jung/Morpheus,
 *          revision history from "REM CYCLE 847", etc.]
 */
