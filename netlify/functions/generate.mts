import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

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

CRITICAL: Do NOT include any preamble or explanation - just the raw visual description.`;

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

    const jobId = `bp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    // Store initial job state
    const store = getStore("blueprint-jobs");
    await store.setJSON(jobId, {
      status: 'enriching',
      createdAt: Date.now(),
      userInput,
      model,
    });

    // Call OpenAI for enrichment
    const openaiKey = Netlify.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const enrichResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Transform this concept into a detailed blueprint specification:\n\n"${userInput}"` }
        ],
        max_tokens: 1500,
        temperature: 0.8,
      }),
    });

    const enrichData = await enrichResponse.json();
    const enrichedPrompt = enrichData.choices?.[0]?.message?.content;

    if (!enrichedPrompt) {
      throw new Error("Failed to enrich prompt");
    }

    // Update job with enriched prompt
    await store.setJSON(jobId, {
      status: 'generating',
      createdAt: Date.now(),
      userInput,
      model,
      enrichedPrompt,
    });

    // For now: use demo images (MCP integration would go here)
    // In production, this would call Blueprint MCP
    const demoImages = [
      'https://i.ibb.co/7xBQpL80/diagram-infographic-20251213-120207-png.png',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&q=80',
    ];
    const imageUrl = demoImages[Math.floor(Math.random() * demoImages.length)];

    // Store completed job
    await store.setJSON(jobId, {
      status: 'complete',
      createdAt: Date.now(),
      userInput,
      model,
      enrichedPrompt,
      imageUrl,
    });

    return new Response(JSON.stringify({ 
      jobId, 
      status: 'complete',
      imageUrl,
      enrichedPrompt,
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
