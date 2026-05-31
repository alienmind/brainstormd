import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// Recursive function to find a file by name
function findFileRecursively(dir: string, filename: string): string | null {
  if (!fs.existsSync(dir)) return null;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const found = findFileRecursively(fullPath, filename);
      if (found) return found;
    } else if (file === filename) {
      return fullPath;
    }
  }
  return null;
}

async function run() {
  const payloadFile = process.argv[2];
  if (!payloadFile || !fs.existsSync(payloadFile)) {
    console.error("Payload file not found:", payloadFile);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(payloadFile, 'utf8'));
  const { title, markdown } = payload;

  console.log(`Organizing idea: ${title}`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No GEMINI_API_KEY provided.");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert knowledge base organizer. 
I have an idea titled "${title}".
The content is:
${markdown}

Based on this content, determine the lifecycle stage of this idea. The three stages are:
1. "ideation" - Brainstorming, early concepts, rough drafts.
2. "devtest" - Actively being built, tested, or experimented on.
3. "production" - Completed, deployed, or fully validated.

Suggest a short, relevant directory path where this should be saved. The path MUST start with exactly one of these roots:
- docs/ideation/
- docs/devtest/
- docs/production/

You can append a thematic subfolder if it makes sense (e.g., docs/ideation/tech, docs/devtest/hardware).
Only respond with the directory path, nothing else. No formatting, no quotes.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  let dirPath = response.text?.trim() || 'docs/ideation/uncategorized';
  
  // Clean up any potential markdown formatting in the response
  dirPath = dirPath.replace(/`/g, '');
  dirPath = dirPath.toLowerCase(); // Enforce lowercase paths
  
  if (!dirPath.startsWith('docs/')) {
    dirPath = path.join('docs/ideation', dirPath.replace(/^\//, ''));
  }

  console.log("Gemini suggests directory:", dirPath);

  // Sanitize title for filename
  const safeFilename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '.md';
  
  // Check if this file already exists somewhere in docs/ (state transition)
  const docsRoot = path.join(process.cwd(), 'docs');
  const existingPath = findFileRecursively(docsRoot, safeFilename);
  
  const fullPath = path.join(process.cwd(), dirPath, safeFilename);

  if (existingPath && existingPath !== fullPath) {
    console.log(`Idea transitioned! Moving from ${existingPath} to ${fullPath}`);
    fs.unlinkSync(existingPath);
  }

  // Ensure directory exists
  fs.mkdirSync(path.join(process.cwd(), dirPath), { recursive: true });

  // Write file
  fs.writeFileSync(fullPath, markdown, 'utf8');
  console.log(`Successfully saved idea to ${fullPath}`);
}

run().catch(console.error);
