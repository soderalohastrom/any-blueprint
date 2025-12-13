/**
 * Blueprint Download API - HANDSOME CLAUDE 🎩
 * 
 * GET /api/blueprint/download/[jobId]
 */

import { jobs } from '../generate+api';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  if (!jobId) {
    return Response.json(
      { error: 'jobId is required' },
      { status: 400 }
    );
  }

  const job = jobs.get(jobId);

  if (!job) {
    return Response.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  if (job.status !== 'complete') {
    return Response.json(
      { error: 'Blueprint not ready', status: job.status },
      { status: 400 }
    );
  }

  if (!job.imageUrl) {
    return Response.json(
      { error: 'No image URL available' },
      { status: 500 }
    );
  }

  return Response.json({
    jobId,
    imageUrl: job.imageUrl,
    enrichedPrompt: job.enrichedPrompt,
    dimensions: {
      width: 1920,
      height: 1080,
    },
  });
}
