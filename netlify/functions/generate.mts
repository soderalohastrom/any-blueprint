import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import OpenAI from "openai";

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
   - Revision history that tells a micro-story
   - "Approved by" / "Checked by" with contextually relevant names
   - Scale indicators, dimension lines with playful measurements
   - Engineering stamps and certification marks

4. INCLUDE precise style guidance:
   - Classic blueprint aesthetic: white/light cyan lines on deep navy blue background
   - Architectural precision meets conceptual abstraction

5. OUTPUT a single detailed description (500-1000 words) for image generation.

CRITICAL: Do NOT include any preamble - just the raw visual description.`;

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { userInput, model = 'gpt-4o' } = await req.json();
  
  if (!userInput) {
    return new Response(JSON.stringify({ error: 'userInput required' }), { status: 400 });
  }

  const jobId = `bp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const store = getStore("blueprint-jobs");
  
  // Store initial job state
  await store.setJSON(jobId, {
    status: 'enriching',
    createdAt: Date.now(),
    userInput,
    model,
  });

  // Process in background (Netlify will handle this)
  processJob(jobId, userInput, model, store).catch(console.error);

  return new Response(JSON.stringify({ jobId, status: 'enriching' }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

async function processJob(jobId: string, userInput: string, model: string, store: any) {
  try {
    const openai = new OpenAI({ apiKey: Netlify.env.get("OPENAI_API_KEY") });
    
    // Step 1: Enrich prompt
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Transform this concept into a detailed blueprint specification:\n\n"${userInput}"` }
      ],
      max_tokens: 1500,
      temperature: 0.8,
    });
    
    const enrichedPrompt = completion.choices[0].message.content || '';
    
    await store.setJSON(jobId, {
      status: 'generating',
      createdAt: Date.now(),
      userInput,
      model,
      enrichedPrompt,
    });

    // Step 2: Generate image (demo mode - use placeholder)
    await new Promise(r => setTimeout(r, 2000));
    
    const demoImages = [
      'https://i.ibb.co/7xBQpL80/diagram-infographic-20251213-120207-png.png',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&q=80',
    ];
    
    const imageUrl = demoImages[Math.floor(Math.random() * demoImages.length)];
    
    await store.setJSON(jobId, {
      status: 'complete',
      createdAt: Date.now(),
      userInput,
      model,
      enrichedPrompt,
      imageUrl,
    });
    
  } catch (err: any) {
    await store.setJSON(jobId, {
      status: 'failed',
      error: err.message,
    });
  }
}

export const config: Config = {
  path: "/api/generate"
};
