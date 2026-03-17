import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Setup Google Gen AI SDK
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is missing.');
  process.exit(1);
}

const ai = new GoogleGenerativeAI(apiKey);

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'assets', 'images', 'pronunciation');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Common Style Prompts
const STYLE_PREFIX = "Vector educational illustration for kids, clean flat design, pastel background. MUST INCLUDE clear, bold alphabet text labels (e.g., 'f', 'v', 'r') directly in the image.";

// Seed Images Paths
const FRONT_SEED_PATH = 'c:\\Users\\origi\\.gemini\\antigravity\\brain\\b09a9bf9-3f07-40a2-bac0-258f7e54e1c0\\base_style_seed_front_v2_1773738734323.png';
const SAGITTAL_SEED_PATH = 'c:\\Users\\origi\\.gemini\\antigravity\\brain\\b09a9bf9-3f07-40a2-bac0-258f7e54e1c0\\base_style_seed_sagittal_v2_1773751139509.png';

// Prompt Data
interface ImageDef {
  filename: string;
  prompt: string;
  seedType: 'front' | 'sagittal';
}

const imagesToGenerate: ImageDef[] = [
  // Very Hard
  {
    filename: 'th_voiceless',
    prompt: "Front view of a child's mouth blowing a small bubble. Tongue tip is clearly sticking gently between the upper and lower teeth. A gust of wind symbol (💨) coming from the mouth. Text label: 'th'",
    seedType: 'front',
  },
  {
    filename: 'th_voiced',
    prompt: "Front view of a child's mouth. Tongue tip sticking gently between the upper and lower teeth. A vibrating bee icon or vibration lines (〰️) explicitly glowing at the throat area. Text label: 'th'",
    seedType: 'front',
  },
  {
    filename: 'r_sound',
    prompt: "Split comparison: Sagittal side-profile cross-sections of a human head. LEFT: Lips rounded, tongue bunched and curled back (not touching the roof). RIGHT: Tongue tip pressing sharply up against the bumpy alveolar ridge behind the top teeth. Text labels: LEFT 'r', RIGHT 'l'",
    seedType: 'sagittal',
  },
  {
    filename: 'l_sound',
    prompt: "Sagittal side-profile cross-section of a human head. Tongue tip pressing sharply up against the bumpy alveolar ridge (roof of the mouth just behind top teeth). Arrow highlighting the tongue-to-ridge contact. Text label: 'l'",
    seedType: 'sagittal',
  },
  {
    filename: 'f_sound',
    prompt: "Split comparison front view. LEFT: Child resting top teeth gently on bottom lip (like cute bunny teeth), with wind blowing out. RIGHT: Both lips pressed tightly together. Text labels: LEFT 'f', RIGHT 'p'",
    seedType: 'front',
  },
  {
    filename: 'v_sound',
    prompt: "Split comparison front view. LEFT: Child resting top teeth on bottom lip (bunny teeth) + heavy vibration lines at throat. RIGHT: Both lips pressed tightly together + heavy vibration lines at throat. Text labels: LEFT 'v', RIGHT 'b'",
    seedType: 'front',
  },
  {
    filename: 'z_sound',
    prompt: "Split comparison front view. LEFT: Teeth closed together, throat vibrating with zigzag lines. RIGHT: Teeth closed together, wind coming out, a small hissing snake icon, NO vibration. Text labels: LEFT 'z', RIGHT 's'",
    seedType: 'front',
  },
  // Hard
  {
    filename: 'vowel_ae',
    prompt: "Split comparison: Sagittal side-profile cross-sections. LEFT: Jaw dropped wide open (2-finger height). RIGHT: Jaw dropped only moderately (1-finger height). Provide a visual measuring block holding the jaws open to contrast the height. Text labels: LEFT 'a', RIGHT 'e'",
    seedType: 'sagittal',
  },
  {
    filename: 'vowel_e',
    prompt: "Split comparison front view. LEFT: A slight, relaxed, almost flat horizontal grin (jaw barely open). RIGHT: Jaw dropped open downwards (chin pointing lower). Text labels: LEFT 'i', RIGHT 'e'",
    seedType: 'front',
  },
  {
    filename: 'vowel_i',
    prompt: "Front view. Child's mouth forming a slight, relaxed, lazy horizontal grin. Lips barely parted. Text label: 'i'",
    seedType: 'front',
  },
  {
    filename: 'vowel_o',
    prompt: "Front view. Child's mouth opened wide in a tall, surprised oval 'O' shape. Very exaggerated open mouth. Text label: 'o'",
    seedType: 'front',
  },
  {
    filename: 'vowel_u',
    prompt: "Front view. Completely relaxed, deadpan, neutral mouth shape barely open. Minimal effort. Text label: 'u'",
    seedType: 'front',
  },
  // Moderate
  {
    filename: 'sh_sound',
    prompt: "Split comparison front view. LEFT: Lips pushed far forward into a tight round trumpet/kiss shape ('shh'). RIGHT: Lips pulled flat back into a tense smile showing clenched teeth. Text labels: LEFT 'sh', RIGHT 's'",
    seedType: 'front',
  },
  {
    filename: 'ch_sound',
    prompt: "Front view. Lips pushed forward in a round trumpet shape, but with an explosive bursting star graphic (💥) indicating a sudden stop and release of air. Text label: 'ch'",
    seedType: 'front',
  },
  {
    filename: 'vowel_ay',
    prompt: "Sequential wide image showing a mouth transitioning. First mouth: medium open drop. Arrow pointing to -> Second mouth: wide pulling horizontal smile. Indicates active jaw and lip movement. Text label: 'a_e'",
    seedType: 'front',
  },
  // Easy
  {
    filename: 'vowel_ee',
    prompt: "Split comparison front view. LEFT: Exaggerated, tight, extremely wide stretched smile revealing teeth ('cheese!'). RIGHT: Soft, lazy, slightly open neutral grin. Text labels: LEFT 'ee', RIGHT 'i'",
    seedType: 'front',
  },
  {
    filename: 'b_p_compare',
    prompt: "Split comparison front view. Both sides having lips locked tightly together. LEFT: Glowing zig-zag vibration icon on the throat. RIGHT: No throat vibration, but a bursting puff of wind symbol on the lips. Text labels: LEFT 'b', RIGHT 'p'",
    seedType: 'front',
  },
];

async function generateImage(imageDef: ImageDef) {
  const outputPath = path.join(OUTPUT_DIR, `${imageDef.filename}.webp`);

  if (fs.existsSync(outputPath)) {
    console.log(`Skipping ${imageDef.filename}.webp, already exists.`);
    return;
  }

  console.log(`Generating ${imageDef.filename}...`);
  
  const fullPrompt = `${STYLE_PREFIX} ${imageDef.prompt}`;

  try {
    // Note: Imagen 3 generation is typically accessed via Vertex AI. 
    // If using Google AI Studio (generativelanguage), the endpoint is different or unavailable without whitelist.
    // Let's try the v1beta endpoint for imagen.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: fullPrompt
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          outputOptions: {
            mimeType: "image/jpeg"
          }
        }
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API responded with status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    
    if (!data.predictions || data.predictions.length === 0) {
        throw new Error(`No image data returned from API for ${imageDef.filename}`);
    }

    const base64Image = data.predictions[0].bytesBase64Encoded;

    // Since imagen API returns base64 string, we write it as a buffer. 
    // We will save as jpeg first, then user can convert to webp if needed later
    const tempJpgPath = path.join(OUTPUT_DIR, `${imageDef.filename}.jpeg`);
    fs.writeFileSync(tempJpgPath, Buffer.from(base64Image, 'base64'));
    console.log(`Saved ${imageDef.filename}.jpeg`);
  } catch (error) {
    console.error(`Error generating ${imageDef.filename}:`, error);
  }
}

async function main() {
  console.log(`Starting generation of ${imagesToGenerate.length} images...`);
  
  for (const img of imagesToGenerate) {
    await generateImage(img);
    // Add a small delay to respect rate limits
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('Finished generating images.');
}

main().catch(console.error);
