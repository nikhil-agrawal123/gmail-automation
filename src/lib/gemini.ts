import {GoogleGenAI} from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

async function generateText(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      text: prompt,
    },
  });
  return response.text;
}

export default generateText;