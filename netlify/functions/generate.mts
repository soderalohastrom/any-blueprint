import type { Context, Config } from "@netlify/functions";

const SYSTEM_PROMPT = `You are a Blueprint Poet - you transform concepts into technical blueprints that reveal hidden truths through clever engineering metaphors.

YOUR MISSION: Find the WIT in every concept. A blueprint of "procrastination" isn't just task delays - it's a "TEMPORAL REDISTRIBUTION ENGINE" with a "Future Self Loading Dock" and a gauge reading "Urgency: INSUFFICIENT".

CREATIVE REQUIREMENTS:

1. FIND THE CORE PARADOX
   - What's ironic, funny, or deeply true about this concept?
   - What would make someone laugh AND think?
   - Example: "Imposter Syndrome" → "COMPETENCE INVISIBILITY SYSTEM - Model IS-2024"

2. INVENT CLEVER COMPONENT NAMES
   - Never generic ("Input Module") - always specific and witty
   - Components should reveal insight about the concept
   - Example: For "difficult conversations" → "Elephant Acknowledgment Sensor", "Emotional Armor Removal Chamber"

3. STRUCTURE AS TRANSFORMATION SYSTEM
   - LEFT (Inputs): What feeds into this process? Name them cleverly.
   - CENTER (Engine): The core transformation - what's REALLY happening?
   - RIGHT (Outputs): Results both intended AND unintended
   - BOTTOM: Operating principles that reveal deeper wisdom

4. ADD PERSONALITY THROUGH DETAILS
   - Gauge readings with attitude ("Denial: MAXIMUM", "Growth: INEVITABLE")
   - Warning labels with real insight ("CAUTION: May cause temporary discomfort followed by lasting relief")
   - Revision history that tells a story ("Rev 1: Added feelings. Rev 2: Removed ego. Rev 3: Ego snuck back in.")
   - "Approved by" stamps with contextually perfect names

5. STYLE: Technical blueprint aesthetic, 16:9 ratio, all text must be crystal clear and perfectly legible.

OUTPUT: A single detailed visual description (400-600 words). No preamble. Start with the title in format: "CLEVER NAME - Model XX-YYYY"

Remember: You're not just DESCRIBING the concept - you're REVEALING its hidden truth through the lens of engineering absurdism.`;

/**
 * Upload base64 image to imgBB
 */
async function uploadToImgBB(base64Image: string, apiKey: string, filename: string): Promise<{ url: string; thumbUrl: string }> {
  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      key: apiKey,
      image: base64Image,
      name: filename,
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
 * Generate image using Google Gemini
 */
async function generateWithGemini(prompt: string, apiKey: string): Promise<string> {
  console.log('Calling Gemini API...');
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
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
    console.error('Gemini error:', errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('Gemini response received');
  
  // Extract base64 image from response
  const parts = data.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }

  throw new Error('No image data in Gemini response');
}

/**
 * SYNCHRONOUS generate - does everything in one request
 * Netlify has 26 second timeout - might be tight but let's try
 */
export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const startTime = Date.now();

  try {
    const { userInput, model = 'gpt-4o' } = await req.json();
    
    if (!userInput) {
      return new Response(JSON.stringify({ error: 'userInput required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get API keys
    const openaiKey = Netlify.env.get("OPENAI_API_KEY");
    const geminiKey = Netlify.env.get("GEMINI_API_KEY");
    const imgbbKey = Netlify.env.get("IMGBB_API_KEY");

    if (!openaiKey || !geminiKey || !imgbbKey) {
      const missing = [];
      if (!openaiKey) missing.push('OPENAI_API_KEY');
      if (!geminiKey) missing.push('GEMINI_API_KEY');
      if (!imgbbKey) missing.push('IMGBB_API_KEY');
      return new Response(JSON.stringify({ error: `Missing API keys: ${missing.join(', ')}` }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${Date.now() - startTime}ms] Starting blueprint generation...`);

    // STEP 1: Enrich prompt with OpenAI
    console.log(`[${Date.now() - startTime}ms] Step 1: Enriching prompt...`);
    
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
        max_tokens: 1000,
        temperature: 0.8,
      }),
    });

    const enrichData = await enrichResponse.json();
    const enrichedPrompt = enrichData.choices?.[0]?.message?.content;

    if (!enrichedPrompt) {
      throw new Error("Failed to enrich prompt");
    }

    console.log(`[${Date.now() - startTime}ms] Step 1 complete`);

    // STEP 2: Generate image with Gemini
    console.log(`[${Date.now() - startTime}ms] Step 2: Generating image with Gemini...`);
    
    const base64Image = await generateWithGemini(enrichedPrompt, geminiKey);
    
    console.log(`[${Date.now() - startTime}ms] Step 2 complete (${base64Image.length} chars)`);

    // STEP 3: Upload to imgBB
    console.log(`[${Date.now() - startTime}ms] Step 3: Uploading to imgBB...`);
    
    const jobId = `bp_${Date.now()}`;
    const { url: imageUrl, thumbUrl } = await uploadToImgBB(base64Image, imgbbKey, `blueprint_${jobId}`);
    
    console.log(`[${Date.now() - startTime}ms] DONE: ${imageUrl}`);

    return new Response(JSON.stringify({ 
      success: true,
      imageUrl,
      thumbUrl,
      enrichedPrompt,
      elapsed: Date.now() - startTime,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Generate error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      elapsed: Date.now() - startTime,
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/generate"
};
