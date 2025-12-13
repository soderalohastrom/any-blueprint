/**
 * Blueprint Generation API - HANDSOME CLAUDE 🎩
 * 
 * POST /api/blueprint/generate
 * 
 * Takes user input, enriches it with selected LLM, and starts blueprint generation.
 */

import { enrichPrompt } from '../../../lib/prompt-enrichment';

// In-memory job store (replace with Redis/DB for production)
const jobs = new Map<string, {
  status: 'pending' | 'enriching' | 'generating' | 'complete' | 'failed';
  enrichedPrompt?: string;
  imageUrl?: string;
  error?: string;
  model?: string;
  createdAt: number;
}>();

// Generate a simple job ID
function generateJobId(): string {
  return `bp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userInput, model, diagram_type, aspect_ratio, resolution } = body;

    if (!userInput || typeof userInput !== 'string') {
      return Response.json(
        { error: 'userInput is required' },
        { status: 400 }
      );
    }

    // Create job
    const jobId = generateJobId();
    jobs.set(jobId, {
      status: 'pending',
      model: model || 'gpt-4o',
      createdAt: Date.now(),
    });

    // Start async processing
    processBlueprint(jobId, userInput, model || 'gpt-4o', { diagram_type, aspect_ratio, resolution });

    return Response.json({
      jobId,
      status: 'pending',
      message: 'Blueprint generation started',
    });

  } catch (error) {
    console.error('Generate error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Async blueprint processing
 */
async function processBlueprint(
  jobId: string,
  userInput: string,
  model: string,
  options: { diagram_type?: string; aspect_ratio?: string; resolution?: string }
) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    // Step 1: Enrich the prompt with selected model
    console.log(`[${jobId}] Enriching prompt with ${model}...`);
    job.status = 'enriching';
    
    const { enrichedPrompt } = await enrichPrompt(userInput, model);
    job.enrichedPrompt = enrichedPrompt;
    console.log(`[${jobId}] Enriched prompt (${enrichedPrompt.length} chars)`);

    // Step 2: Call Blueprint MCP
    job.status = 'generating';
    console.log(`[${jobId}] Calling Blueprint MCP...`);
    const imageUrl = await callBlueprintMCP(enrichedPrompt, options);
    
    job.imageUrl = imageUrl;
    job.status = 'complete';
    console.log(`[${jobId}] Complete! Image: ${imageUrl}`);

  } catch (error) {
    console.error(`[${jobId}] Error:`, error);
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
  }
}

/**
 * Call the Blueprint MCP service
 */
async function callBlueprintMCP(
  description: string,
  options: { diagram_type?: string; aspect_ratio?: string; resolution?: string }
): Promise<string> {
  const mcpUrl = process.env.BLUEPRINT_MCP_URL;
  
  if (mcpUrl && mcpUrl.length > 0) {
    // Real MCP call - implement when we have the endpoint
    throw new Error('Blueprint MCP integration pending - need endpoint URL');
  }
  
  // Mock implementation for testing the flow
  console.log(`[MOCK] Would generate blueprint with ${description.length} char prompt`);
  await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 3000));
  
  // Return placeholder blueprint images
  const placeholders = [
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&q=80',
    'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1920&q=80',
    'https://images.unsplash.com/photo-1545670723-196ed0954986?w=1920&q=80',
  ];
  
  return placeholders[Math.floor(Math.random() * placeholders.length)];
}

// Export job store for status endpoint
export { jobs };
