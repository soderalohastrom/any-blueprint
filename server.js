/**
 * Blueprint Vision - Backend Server with MCP Integration
 * HANDSOME CLAUDE IMPLEMENTATION 🎩
 * 
 * Express server that:
 * 1. Uses OpenAI for prompt enrichment
 * 2. Calls Blueprint MCP for image generation (via Vercel AI SDK)
 */

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Models
const MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Fast & capable' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Quick & affordable' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'Most capable' },
];

// Blueprint Architect System Prompt
const SYSTEM_PROMPT = `You are a Blueprint Architect - you transform abstract human concepts into detailed technical blueprint specifications for AI image generation.

When a user describes a concept, you must:

1. UNDERSTAND the core metaphor or idea deeply - what is the essence they're trying to visualize?

2. EXPAND it into rich visual components:
   - Primary structures and shapes (geometric forms, architectural elements)
   - Relationships and connections (nodes, arrows, flows, pathways)
   - Layering (foreground, midground, background depth)
   - Annotations and labels with clever, contextually relevant text
   - Technical styling elements (measurements, revision blocks, cross-sections)
   
3. ADD blueprint authenticity with creative flourishes:
   - Title blocks with imaginative project names
   - Revision history that tells a micro-story ("Rev 3: Added existential crisis module")
   - "Approved by" / "Checked by" with contextually relevant names
   - Scale indicators, dimension lines with playful measurements
   - Engineering stamps and certification marks

4. INCLUDE precise style guidance:
   - Classic blueprint aesthetic: white/light cyan lines on deep navy blue background
   - Architectural precision meets conceptual abstraction
   - Include impossible geometries or Escher-like elements where appropriate

5. OUTPUT a single detailed description (500-1000 words) for image generation.

CRITICAL: Do NOT include any preamble or explanation - just the raw visual description.
The output will be sent directly to an image generation model.`;

// In-memory job store
const jobs = new Map();

// GET /api/models
app.get('/api/models', (req, res) => {
  res.json({ models: MODELS, default: 'gpt-4o' });
});

// POST /api/generate - Start blueprint generation
app.post('/api/generate', async (req, res) => {
  const { userInput, model = 'gpt-4o' } = req.body;
  
  if (!userInput) {
    return res.status(400).json({ error: 'userInput required' });
  }

  const jobId = `bp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  jobs.set(jobId, { 
    status: 'enriching', 
    createdAt: Date.now(),
    userInput,
    model,
  });
  
  res.json({ jobId, status: 'enriching' });
  
  // Process async
  processJob(jobId, userInput, model);
});

// GET /api/status/:jobId
app.get('/api/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  
  res.json({
    status: job.status,
    elapsed: Math.floor((Date.now() - job.createdAt) / 1000),
    error: job.error,
  });
});

// GET /api/result/:jobId
app.get('/api/result/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'complete') return res.status(400).json({ error: 'Not ready' });
  
  res.json({
    imageUrl: job.imageUrl,
    enrichedPrompt: job.enrichedPrompt,
  });
});

// POST /api/mcp-callback - Receive MCP results (webhook style)
app.post('/api/mcp-callback', (req, res) => {
  const { jobId, imageUrl, error } = req.body;
  const job = jobs.get(jobId);
  
  if (!job) return res.status(404).json({ error: 'Job not found' });
  
  if (error) {
    job.status = 'failed';
    job.error = error;
  } else {
    job.imageUrl = imageUrl;
    job.status = 'complete';
  }
  
  res.json({ success: true });
});

async function processJob(jobId, userInput, model) {
  const job = jobs.get(jobId);
  
  try {
    // Step 1: Enrich prompt with OpenAI
    console.log(`[${jobId}] 🧠 Enriching with ${model}...`);
    
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Transform this concept into a detailed blueprint specification:\n\n"${userInput}"` }
      ],
      max_tokens: 1500,
      temperature: 0.8,
    });
    
    const enrichedPrompt = completion.choices[0].message.content;
    job.enrichedPrompt = enrichedPrompt;
    job.status = 'generating';
    console.log(`[${jobId}] ✅ Enriched (${enrichedPrompt.length} chars)`);
    console.log(`[${jobId}] 📝 Preview: ${enrichedPrompt.substring(0, 200)}...`);

    // Step 2: Call Blueprint MCP for image generation
    console.log(`[${jobId}] 🎨 Calling Blueprint MCP...`);
    
    const imageUrl = await generateBlueprintImage(enrichedPrompt, jobId);
    
    job.imageUrl = imageUrl;
    job.status = 'complete';
    console.log(`[${jobId}] 🎉 Complete! Image: ${imageUrl}`);
    
  } catch (err) {
    console.error(`[${jobId}] ❌ Error:`, err.message);
    job.status = 'failed';
    job.error = err.message;
  }
}

/**
 * Generate blueprint image using Blueprint MCP
 * 
 * For production: Use Vercel AI SDK's experimental_createMCPClient
 * For demo: Use a direct API call or placeholder
 */
async function generateBlueprintImage(description, jobId) {
  // Check for MCP endpoint configuration
  const mcpUrl = process.env.BLUEPRINT_MCP_URL;
  
  if (mcpUrl) {
    // Production mode: Call MCP server directly
    console.log(`[${jobId}] Using MCP at ${mcpUrl}`);
    
    // Start the job
    const startRes = await fetch(`${mcpUrl}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        diagram_type: 'infographic',
        aspect_ratio: '16:9',
        resolution: '2K',
      }),
    });
    
    const { job_id: mcpJobId } = await startRes.json();
    
    // Poll for completion (max 2 minutes)
    const maxAttempts = 24;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 5000));
      
      const statusRes = await fetch(`${mcpUrl}/status/${mcpJobId}`);
      const status = await statusRes.json();
      
      if (status.complete) {
        const downloadRes = await fetch(`${mcpUrl}/download/${mcpJobId}`);
        const { url } = await downloadRes.json();
        return url;
      }
    }
    
    throw new Error('MCP generation timed out');
  }
  
  // Demo mode: Simulate generation with placeholder
  console.log(`[${jobId}] 🎭 DEMO MODE - Using placeholder images`);
  console.log(`[${jobId}] 💡 Set BLUEPRINT_MCP_URL in .env for real generation`);
  
  await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
  
  // Demo: Return a real blueprint we generated earlier
  // In production, this would be the MCP-generated image
  const demoImages = [
    // Real blueprint generated by MCP (7 year itch)
    'https://i.ibb.co/7xBQpL80/diagram-infographic-20251213-120207-png.png',
    // Architectural placeholders
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&q=80',
    'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1920&q=80',
  ];
  
  return demoImages[Math.floor(Math.random() * demoImages.length)];
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('🎩 ═══════════════════════════════════════════════════');
  console.log('   BLUEPRINT VISION API - HANDSOME CLAUDE BUILD');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   Server:     http://localhost:${PORT}`);
  console.log(`   OpenAI:     ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   MCP:        ${process.env.BLUEPRINT_MCP_URL || '🎭 Demo Mode'}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
});
