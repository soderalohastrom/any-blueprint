import type { Context, Config } from "@netlify/functions";

type DiagramType = 'architecture' | 'flowchart' | 'infographic' | 'generic';
type ImageModel = 'gemini-3-pro' | 'gpt-image-1.5';

// Diagram-type specific vocabulary (inspired by Trae's approach)
const DIAGRAM_VOCABULARY: Record<DiagramType, string> = {
  architecture: `
DIAGRAM STYLE: ARCHITECTURAL/STRUCTURAL
- Use sectional views, cutaway perspectives, load-bearing visual metaphors
- Show rooms, chambers, structural supports as concept components
- Include CAD-style annotations, measurement lines, material callouts
- Cross-sections revealing internal workings
- Foundation → Structure → Roof hierarchy`,
  
  flowchart: `
DIAGRAM STYLE: FLOWCHART/PROCESS
- Decision diamonds with YES/NO paths
- Process rectangles connected by directional arrows
- Start/End terminals, loop-back flows
- Parallel process lanes, merge points
- Logic gates, conditional branches
- Clear left-to-right or top-to-bottom flow`,
  
  infographic: `
DIAGRAM STYLE: INFOGRAPHIC/DATA VISUALIZATION
- Exploded views with callout labels
- Statistical gauges, percentage wheels, progress bars
- Icon-rich visual hierarchy
- Numbered steps with connecting lines
- Comparison panels, before/after sections
- Visual metaphors (funnels, pyramids, cycles)`,
  
  generic: `
DIAGRAM STYLE: TECHNICAL SCHEMATIC
- Patent illustration aesthetic with labeled parts (A, B, C)
- Isometric or exploded component views
- Input → Process → Output flow
- Cross-hatching, technical stippling
- Modular interconnected systems`
};

const SYSTEM_PROMPT_BASE = `You are a Blueprint Poet - you transform concepts into technical blueprints that reveal hidden truths through clever engineering metaphors.

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

5. STYLE: Technical blueprint aesthetic, all text must be crystal clear and perfectly legible.

OUTPUT: A single detailed visual description (400-600 words). No preamble. Start with the title in format: "CLEVER NAME - Model XX-YYYY"

Remember: You're not just DESCRIBING the concept - you're REVEALING its hidden truth through the lens of engineering absurdism.`;

function buildSystemPrompt(diagramType: DiagramType): string {
  const diagramGuidance = DIAGRAM_VOCABULARY[diagramType] || DIAGRAM_VOCABULARY.generic;
  return `${SYSTEM_PROMPT_BASE}
${diagramGuidance}
`;
}

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
 * Generate image using OpenAI GPT-Image 1.5 (latest Dec 2024)
 */
async function generateWithOpenAI(prompt: string, apiKey: string): Promise<string> {
  console.log('Calling OpenAI gpt-image-1.5 API...');
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1.5',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
      response_format: 'b64_json',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI gpt-image-1.5 error:', errorText);
    throw new Error(`OpenAI gpt-image-1.5 API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('OpenAI gpt-image-1.5 response received');
  
  const base64Image = data.data?.[0]?.b64_json;
  
  if (!base64Image) {
    console.error('Unexpected gpt-image-1.5 response:', JSON.stringify(data).slice(0, 500));
    throw new Error('No image data in gpt-image-1.5 response');
  }

  return base64Image;
}

/**
 * Generate image using Google Gemini 3 Pro (latest Dec 2024)
 */
async function generateWithGemini(prompt: string, apiKey: string): Promise<string> {
  console.log('Calling Gemini 3 Pro Image API...');
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Generate a technical blueprint image: ${prompt}` }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini 3 Pro error:', errorText);
    throw new Error(`Gemini 3 Pro API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Gemini 3 Pro response structure:', JSON.stringify(data).slice(0, 500));
  
  // Extract base64 image from response
  const parts = data.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      console.log('Found image data in Gemini response');
      return part.inlineData.data;
    }
  }

  // Log what we got for debugging
  console.error('No image found. Parts received:', JSON.stringify(parts).slice(0, 500));
  throw new Error('No image data in Gemini response - model may have returned text only');
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
    const { userInput, model = 'gpt-4o', diagramType = 'generic', imageModel = 'gemini-3-pro' } = await req.json();
    
    if (!userInput) {
      return new Response(JSON.stringify({ error: 'userInput required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate diagramType
    const validTypes: DiagramType[] = ['architecture', 'flowchart', 'infographic', 'generic'];
    const selectedType: DiagramType = validTypes.includes(diagramType) ? diagramType : 'generic';
    
    // Validate imageModel
    const validImageModels: ImageModel[] = ['gemini-3-pro', 'gpt-image-1.5'];
    const selectedImageModel: ImageModel = validImageModels.includes(imageModel) ? imageModel : 'gemini-3-pro';

    // Get API keys
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const imgbbKey = process.env.IMGBB_API_KEY;

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

    console.log(`[${Date.now() - startTime}ms] Starting blueprint generation (type: ${selectedType}, imageModel: ${selectedImageModel})...`);

    // STEP 1: Enrich prompt with OpenAI
    console.log(`[${Date.now() - startTime}ms] Step 1: Enriching prompt...`);
    
    const systemPrompt = buildSystemPrompt(selectedType);
    
    const enrichResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Transform this concept into a detailed ${selectedType} blueprint specification:\n\n"${userInput}"` }
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

    // STEP 2: Generate image with selected model
    console.log(`[${Date.now() - startTime}ms] Step 2: Generating image with ${selectedImageModel}...`);
    
    let base64Image: string;
    
    if (selectedImageModel === 'gemini-3-pro') {
      base64Image = await generateWithGemini(enrichedPrompt, geminiKey);
    } else {
      // gpt-image-1.5
      base64Image = await generateWithOpenAI(enrichedPrompt, openaiKey);
    }
    
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
      diagramType: selectedType,
      imageModel: selectedImageModel,
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
