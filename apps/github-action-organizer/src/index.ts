import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

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

Based on this content, suggest a short, relevant directory path where this should be saved (e.g., docs/tech, docs/marketing, docs/product/features).
Only respond with the directory path, nothing else. No formatting, no quotes. It must start with 'docs/'.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  let dirPath = response.text?.trim() || 'docs/uncategorized';
  
  // Clean up any potential markdown formatting in the response
  dirPath = dirPath.replace(/`/g, '');
  
  if (!dirPath.startsWith('docs/')) {
    dirPath = path.join('docs', dirPath.replace(/^\//, ''));
  }

  console.log("Gemini suggests directory:", dirPath);

  // Sanitize title for filename
  const safeFilename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '.md';
  const fullPath = path.join(process.cwd(), dirPath, safeFilename);

  // Ensure directory exists
  fs.mkdirSync(path.join(process.cwd(), dirPath), { recursive: true });

  // Write file
  fs.writeFileSync(fullPath, markdown, 'utf8');
  console.log(`Successfully saved idea to ${fullPath}`);
}

run().catch(console.error);
