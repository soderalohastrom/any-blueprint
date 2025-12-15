import type { Config } from "@netlify/functions";
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
   - Title blocks with imaginative project names (format: "SYSTEM NAME - Model XX-YYYY")
   - Revision history that tells a micro-story ("Rev 1: Initial concept", "Rev 2: Added crisis module", etc.)
   - "Approved by" / "Certified by" stamps with contextually relevant authority names
   - Scale indicators, dimension lines with playful measurements
   - Warning labels and cautionary notes with key insights
   - Small placard with a memorable quote from the concept

4. STRUCTURE as engineering schematic with sections:
   - LEFT SECTION: Inputs, sources, origins
   - CENTER SECTION: Main transformation/process (the core insight)
   - RIGHT SECTION: Outputs, results, liberation
   - BOTTOM: Annotations, operating principles, revision history

5. INCLUDE precise style guidance:
   - Classic technical blueprint/schematic aesthetic
   - Clean lines, readable labels, professional engineering drawing style
   - All text must be crystal clear and perfectly legible
   - Use 16:9 aspect ratio composition

6. OUTPUT a single detailed description (500-800 words) for image generation.

CRITICAL: Do NOT include any preamble or explanation - just the raw visual description starting with the title.`;

/**
 * Upload base64 image to imgBB and return public URL
 */
async function uploadToImgBB(base64Image: string, apiKey: string, filename: string): Promise<{ url: string; thumbUrl: string }> {
  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      key: apiKey,
      image: base64Image,
      name: filename,
      expiration: String(86400 * 7), // 7 days
    }),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`imgBB upload failed: ${data.error?.message || 'Unknown error'}`);
  }

  return {
    url: data.data.url,
    thumbUrl: data.data.thumb?.url || data.data.url,
  };
}

/**
 * Generate image using Google Gemini's image generation
 */
async function generateWithGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Extract base64 image from response
  const parts = data.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data; // base64 image
    }
  }

  throw new Error('No image data in Gemini response');
}

/**
 * Background function - does the heavy lifting
 * This runs for up to 15 minutes without blocking the client
 */
export default async (req: Request) => {
  try {
    const { jobId, userInput, model } = await req.json();
    
    console.log(`[${jobId}] Background worker started`);
    
    const store = getStore("blueprint-jobs");
    
    // Get API keys
    const openaiKey = Netlify.env.get("OPENAI_API_KEY");
    const geminiKey = Netlify.env.get("GEMINI_API_KEY");
    const imgbbKey = Netlify.env.get("IMGBB_API_KEY");

    if (!openaiKey || !geminiKey || !imgbbKey) {
      await store.setJSON(jobId, {
        status: 'error',
        error: 'Missing API keys',
        updatedAt: Date.now(),
      });
      return new Response('Missing API keys', { status: 500 });
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Enrich prompt with OpenAI
    // ═══════════════════════════════════════════════════════════════
    console.log(`[${jobId}] Step 1: Enriching prompt...`);
    
    await store.setJSON(jobId, {
      status: 'enriching',
      userInput,
      model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

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

    console.log(`[${jobId}] Step 1 complete`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Generate image with Gemini
    // ═══════════════════════════════════════════════════════════════
    console.log(`[${jobId}] Step 2: Generating image with Gemini...`);
    
    await store.setJSON(jobId, {
      status: 'generating',
      userInput,
      model,
      enrichedPrompt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const base64Image = await generateWithGemini(enrichedPrompt, geminiKey);
    
    console.log(`[${jobId}] Step 2 complete (${base64Image.length} chars)`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Upload to imgBB
    // ═══════════════════════════════════════════════════════════════
    console.log(`[${jobId}] Step 3: Uploading to imgBB...`);
    
    await store.setJSON(jobId, {
      status: 'uploading',
      userInput,
      model,
      enrichedPrompt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const filename = `blueprint_${jobId}`;
    const { url: imageUrl, thumbUrl } = await uploadToImgBB(base64Image, imgbbKey, filename);
    
    console.log(`[${jobId}] Step 3 complete: ${imageUrl}`);

    // ═══════════════════════════════════════════════════════════════
    // DONE: Store final result
    // ═══════════════════════════════════════════════════════════════
    await store.setJSON(jobId, {
      status: 'complete',
      userInput,
      model,
      enrichedPrompt,
      imageUrl,
      thumbUrl,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    console.log(`[${jobId}] Job complete!`);
    
    return new Response('OK', { status: 200 });

  } catch (error: any) {
    console.error('Background worker error:', error);
    
    // Try to update job status with error
    try {
      const { jobId } = await req.clone().json();
      const store = getStore("blueprint-jobs");
      await store.setJSON(jobId, {
        status: 'error',
        error: error.message,
        updatedAt: Date.now(),
      });
    } catch (e) {
      // Couldn't update job status
    }
    
    return new Response(error.message, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/worker",
  // This makes it a background function with 15 min timeout
  backgroundRequest: true,
};
