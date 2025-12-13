/**
 * Blueprint MCP Client - HANDSOME CLAUDE IMPLEMENTATION 🎩
 * 
 * Connects to the Blueprint MCP for generating stunning technical blueprints.
 * Supports multiple backends: Arcade SSE, direct API, or mock for testing.
 */

export type DiagramType = 
  | 'architecture' 
  | 'flowchart' 
  | 'data_flow' 
  | 'sequence' 
  | 'infographic' 
  | 'generic';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9';
export type Resolution = '1K' | '2K';

export interface BlueprintJob {
  jobId: string;
  status: 'pending' | 'generating' | 'complete' | 'failed';
  progress?: number;
  message?: string;
  elapsedSeconds?: number;
}

export interface BlueprintResult {
  imageUrl: string;
  jobId: string;
  dimensions?: { width: number; height: number };
}

export interface GenerateBlueprintParams {
  description: string;
  diagramType?: DiagramType;
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
}

// ============================================================================
// Blueprint API Service - calls our server-side API routes
// ============================================================================

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

/**
 * Start a blueprint generation job via our API
 */
export async function startBlueprintJob(params: GenerateBlueprintParams): Promise<BlueprintJob> {
  const response = await fetch(`${API_BASE}/api/blueprint/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: params.description,
      diagram_type: params.diagramType || 'infographic',
      aspect_ratio: params.aspectRatio || '16:9',
      resolution: params.resolution || '2K',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Failed to start blueprint job: ${response.status}`);
  }

  return response.json();
}

/**
 * Check the status of a blueprint generation job
 */
export async function checkJobStatus(jobId: string): Promise<BlueprintJob> {
  const response = await fetch(`${API_BASE}/api/blueprint/status/${jobId}`);

  if (!response.ok) {
    throw new Error(`Failed to check job status: ${response.status}`);
  }

  return response.json();
}

/**
 * Download/get the completed blueprint result
 */
export async function downloadBlueprint(jobId: string): Promise<BlueprintResult> {
  const response = await fetch(`${API_BASE}/api/blueprint/download/${jobId}`);

  if (!response.ok) {
    throw new Error(`Failed to download blueprint: ${response.status}`);
  }

  return response.json();
}

/**
 * Poll for job completion with progress callbacks
 */
export async function waitForCompletion(
  jobId: string,
  onProgress?: (job: BlueprintJob) => void,
  pollIntervalMs = 3000,
  maxWaitMs = 180000 // 3 minutes max
): Promise<BlueprintResult> {
  const startTime = Date.now();
  let lastStatus = '';

  while (Date.now() - startTime < maxWaitMs) {
    const job = await checkJobStatus(jobId);
    
    // Calculate elapsed time
    job.elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    // Call progress callback if status changed
    if (onProgress && job.status !== lastStatus) {
      onProgress(job);
      lastStatus = job.status;
    }
    
    if (job.status === 'complete') {
      return downloadBlueprint(jobId);
    }
    
    if (job.status === 'failed') {
      throw new Error(job.message || 'Blueprint generation failed');
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  
  throw new Error('Blueprint generation timed out - please try again');
}

// ============================================================================
// Full generation flow - enrichment + MCP in one call
// ============================================================================

export interface GenerateFullBlueprintParams {
  userInput: string;
  diagramType?: DiagramType;
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
  onProgress?: (status: string, detail?: string) => void;
}

/**
 * Full blueprint generation flow:
 * 1. Enrich user input with LLM
 * 2. Start blueprint job
 * 3. Wait for completion
 * 4. Return result
 */
export async function generateFullBlueprint(
  params: GenerateFullBlueprintParams
): Promise<BlueprintResult> {
  const { userInput, diagramType, aspectRatio, resolution, onProgress } = params;

  // Step 1: Call the combined generate endpoint
  onProgress?.('enriching', 'Transforming your vision into blueprint specifications...');
  
  const response = await fetch(`${API_BASE}/api/blueprint/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userInput,
      diagram_type: diagramType || 'infographic',
      aspect_ratio: aspectRatio || '16:9',
      resolution: resolution || '2K',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Generation failed' }));
    throw new Error(error.message);
  }

  const job: BlueprintJob = await response.json();
  
  // Step 2: Poll for completion
  onProgress?.('generating', 'Rendering your blueprint...');
  
  const result = await waitForCompletion(
    job.jobId,
    (status) => {
      if (status.status === 'generating') {
        onProgress?.('generating', `Rendering... ${status.elapsedSeconds || 0}s`);
      }
    }
  );

  onProgress?.('complete', 'Blueprint ready!');
  return result;
}
