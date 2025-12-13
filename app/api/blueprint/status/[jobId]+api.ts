/**
 * Blueprint Status API - HANDSOME CLAUDE 🎩
 * 
 * GET /api/blueprint/status/[jobId]
 */

// Import jobs store from generate endpoint
// Note: In production, use Redis or a real database
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

  return Response.json({
    jobId,
    status: job.status,
    ...(job.error && { error: job.error }),
    elapsedSeconds: Math.floor((Date.now() - job.createdAt) / 1000),
  });
}
