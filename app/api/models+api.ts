/**
 * Models API - HANDSOME CLAUDE 🎩
 * 
 * GET /api/models
 * 
 * Returns available LLM models based on configured API keys
 */

import { getAvailableModels } from '../../lib/prompt-enrichment';

export async function GET() {
  try {
    const models = getAvailableModels();
    
    return Response.json({
      models,
      default: process.env.DEFAULT_MODEL || 'gpt-4o',
    });
  } catch (error) {
    console.error('Models error:', error);
    return Response.json(
      { error: 'Failed to get models' },
      { status: 500 }
    );
  }
}
