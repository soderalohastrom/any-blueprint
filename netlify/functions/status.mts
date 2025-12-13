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

  return new Response(JSON.stringify({
    status: job.status,
    elapsed: Math.floor((Date.now() - job.createdAt) / 1000),
    error: job.error,
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config: Config = {
  path: "/api/status/*"
};
