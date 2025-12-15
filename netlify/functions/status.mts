import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  
  // Support both /api/status/jobId and /api/status?jobId=xxx
  let jobId = url.pathname.split('/').pop();
  if (jobId === 'status') {
    jobId = url.searchParams.get('jobId') || '';
  }
  
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'Job ID required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const store = getStore("blueprint-jobs");
  const job = await store.get(jobId, { type: 'json' }) as any;
  
  if (!job) {
    return new Response(JSON.stringify({ error: 'Job not found' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const elapsed = Math.floor((Date.now() - job.createdAt) / 1000);

  // Return different data based on status
  const response: any = {
    jobId,
    status: job.status,
    elapsed,
  };

  // Add status-specific messaging
  switch (job.status) {
    case 'queued':
      response.message = 'Waiting to start...';
      break;
    case 'enriching':
      response.message = 'Crafting blueprint specification...';
      break;
    case 'generating':
      response.message = 'Generating image with AI (this takes 30-60 seconds)...';
      break;
    case 'uploading':
      response.message = 'Uploading image...';
      break;
    case 'complete':
      response.message = 'Blueprint complete!';
      response.imageUrl = job.imageUrl;
      response.thumbUrl = job.thumbUrl;
      response.enrichedPrompt = job.enrichedPrompt;
      break;
    case 'error':
      response.message = 'Generation failed';
      response.error = job.error;
      break;
  }

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config: Config = {
  path: "/api/status/*"
};
