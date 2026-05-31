import 'dotenv/config';
import { generateMarkdown } from '@brainstormd/core-logic';
import { GoogleGenAI } from '@google/genai';

async function run() {
  console.log("Running Brainstormd Organizer...");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No GEMINI_API_KEY provided.");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  // Example payload parsing, usually passed via process.env or file
  const ideaTitle = process.env.IDEA_TITLE || "Untitled Idea";
  const ideaContent = process.env.IDEA_CONTENT || "Content goes here";

  console.log(`Organizing idea: ${ideaTitle}`);

  // In a real scenario we'd use Gemini to determine the correct folder path
  const prompt = `Classify this idea into a directory structure: ${ideaContent}`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  console.log("Gemini suggests directory:", response.text);

  // Generate markdown and save to disk (simulated)
  const markdown = generateMarkdown({
    title: ideaTitle,
    content: ideaContent,
    source: 'web-app',
    timestamp: new Date().toISOString()
  });

  console.log("Generated Markdown:");
  console.log(markdown);
}

run().catch(console.error);
