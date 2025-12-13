import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const jobId = url.pathname.split('/').pop();
  
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'Job ID required' }), { status: 400 });
  }

  const store = getStore("blueprint-jobs");
  const job = await store.get(jobId, { type: 'json' });
  
  if (!job) {
    return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
  }
  
  if (job.status !== 'complete') {
    return new Response(JSON.stringify({ error: 'Not ready' }), { status: 400 });
  }

  return new Response(JSON.stringify({
    imageUrl: job.imageUrl,
    enrichedPrompt: job.enrichedPrompt,
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config: Config = {
  path: "/api/result/*"
};
