import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

/**
 * Generate endpoint - creates job and triggers background worker
 * Returns immediately with jobId for client to poll
 */
export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { userInput, model = 'gpt-4o' } = await req.json();
    
    if (!userInput) {
      return new Response(JSON.stringify({ error: 'userInput required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create unique job ID
    const jobId = `bp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    // Store initial job state
    const store = getStore("blueprint-jobs");
    await store.setJSON(jobId, {
      status: 'queued',
      userInput,
      model,
      createdAt: Date.now(),
    });

    // Trigger background worker (fire and forget)
    // The worker will update the job status in Blobs
    const workerUrl = new URL('/api/worker', req.url).toString();
    
    fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, userInput, model }),
    }).catch(err => {
      console.error('Failed to trigger worker:', err);
    });

    // Return immediately - client will poll /api/status
    return new Response(JSON.stringify({ 
      jobId,
      status: 'queued',
      message: 'Blueprint generation started. Poll /api/status?jobId=' + jobId,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Generate error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/generate"
};
