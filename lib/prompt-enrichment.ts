/**
 * Prompt Enrichment Service
 * 
 * Takes casual user input and transforms it into a detailed
 * blueprint specification for the image generator.
 * 
 * This is THE differentiator - the better the prompt, the better the output.
 */

/**
 * System prompt for the LLM that enriches user input
 */
export const BLUEPRINT_ARCHITECT_SYSTEM_PROMPT = `You are a Blueprint Architect - you transform abstract human concepts into detailed technical blueprint specifications for AI image generation.

When a user describes a concept, you must:

1. UNDERSTAND the core metaphor or idea

2. EXPAND it into visual components:
   - Primary structures and shapes
   - Relationships and connections (nodes, arrows, flows)
   - Layering (foreground, midground, background)
   - Annotations and labels with clever, relevant text
   - Technical styling elements (measurements, revision blocks, cross-sections)
   
3. ADD blueprint authenticity:
   - Title blocks with creative project names
   - Revision history that tells a story
   - "Approved by" / "Checked by" with contextually relevant names
   - Scale indicators, dimension lines, section markers
   - Grid paper or technical drawing aesthetics

4. INCLUDE style guidance:
   - Classic blueprint: white/light lines on deep blue
   - Architectural precision meets conceptual abstraction
   - Balance between technical and artistic

5. OUTPUT a single detailed description (500-1000 words) that serves as the prompt for the image generation system. Do NOT include any preamble or explanation - just the description.

Remember: You are translating CONCEPTS into VISUAL ENGINEERING SPECIFICATIONS.
The more specific and vivid your description, the more stunning the output.`;

/**
 * Enrich a user's simple idea into a detailed blueprint prompt
 */
export async function enrichPrompt(userInput: string): Promise<string> {
  // TODO: Implement with your LLM provider of choice
  //
  // Example with Vercel AI SDK + Anthropic:
  // import { generateText } from 'ai';
  // import { anthropic } from '@ai-sdk/anthropic';
  //
  // const { text } = await generateText({
  //   model: anthropic('claude-sonnet-4-20250514'),
  //   system: BLUEPRINT_ARCHITECT_SYSTEM_PROMPT,
  //   prompt: userInput,
  // });
  // return text;
  //
  // Example with OpenAI:
  // import { openai } from '@ai-sdk/openai';
  // const { text } = await generateText({
  //   model: openai('gpt-4o'),
  //   system: BLUEPRINT_ARCHITECT_SYSTEM_PROMPT,
  //   prompt: userInput,
  // });
  // return text;

  throw new Error('Not implemented - add your LLM provider!');
}

/**
 * Example of what enrichment looks like:
 * 
 * Input: "the complexity of a project, like an iceberg"
 * 
 * Output: "An iceberg diagram representing project complexity and limited 
 * observer perspective. BELOW THE WATERLINE (majority of image, darker blue 
 * tones): An immense, intricate network graph with hundreds of interconnected 
 * nodes - representing the true complexity of a project. Dense clusters of 
 * nodes connected by countless edges, some nodes larger (key dependencies), 
 * branching sub-networks, the full sprawling architecture hidden beneath 
 * the surface. Labels include: 'Technical Debt', 'Legacy Integrations', 
 * 'Stakeholder Conflicts', 'Critical Path Dependencies'..."
 * 
 * (continues for 500-1000 words with full visual specification)
 */
