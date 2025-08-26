import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export async function explainCode(code: string, language: string = "javascript"): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return "Error: AI service not configured. Please add GEMINI_API_KEY to environment variables.";
    }

    const systemPrompt = `You are an expert ${language} developer. Explain the provided code in simple, clear terms.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: `Explain this ${language} code:\n\n${code}`,
    });

    return response.text || "Unable to explain code";
  } catch (error) {
    console.error("Error explaining code:", error);
    return "Error explaining code. Please check your API key and try again.";
  }
}

export async function debugCode(code: string, language: string = "javascript", errorMsg?: string): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return "Error: AI service not configured. Please add GEMINI_API_KEY to environment variables.";
    }

    const systemPrompt = `You are an expert ${language} developer. Help debug the provided code and suggest fixes.`;
    const errorContext = errorMsg ? `\n\nError message: ${errorMsg}` : '';

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: `Debug this ${language} code and suggest fixes:\n\n${code}${errorContext}`,
    });

    return response.text || "Unable to debug code";
  } catch (error) {
    console.error("Error debugging code:", error);
    return "Error debugging code. Please check your API key and try again.";
  }
}

export async function generateCode(prompt: string, language: string = "javascript"): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return "// Error: AI service not configured. Please add GEMINI_API_KEY to environment variables.";
    }

    const systemPrompt = `You are an expert ${language} developer. Generate clean, well-commented code based on the user's request. 
    Only return the code without explanations unless specifically asked.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: `Generate ${language} code for: ${prompt}`,
    });

    return response.text || "// Unable to generate code";
  } catch (error) {
    console.error("Error generating code:", error);
    return "// Error generating code. Please check your API key and try again.";
  }
}

