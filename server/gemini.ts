import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export async function generateCode(prompt: string, language: string = "javascript"): Promise<string> {
  try {
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
    return "// Error generating code. Please try again.";
  }
}

export async function explainCode(code: string, language: string = "javascript"): Promise<string> {
  try {
    const prompt = `Explain this ${language} code in simple terms, including what it does and how it works:\n\n${code}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return response.text || "Unable to explain code";
  } catch (error) {
    console.error("Error explaining code:", error);
    return "Error explaining code. Please try again.";
  }
}

export async function debugCode(code: string, language: string = "javascript", errorMessage?: string): Promise<string> {
  try {
    let prompt = `Debug this ${language} code and provide suggestions for fixes:\n\n${code}`;
    
    if (errorMessage) {
      prompt += `\n\nError message: ${errorMessage}`;
    }

    prompt += "\n\nProvide specific suggestions for fixing any issues you find.";

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return response.text || "Unable to debug code";
  } catch (error) {
    console.error("Error debugging code:", error);
    return "Error debugging code. Please try again.";
  }
}

export async function optimizeCode(code: string, language: string = "javascript"): Promise<string> {
  try {
    const prompt = `Optimize this ${language} code for better performance and readability:\n\n${code}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return response.text || "Unable to optimize code";
  } catch (error) {
    console.error("Error optimizing code:", error);
    return "Error optimizing code. Please try again.";
  }
}

export async function suggestImprovements(code: string, language: string = "javascript"): Promise<string> {
  try {
    const prompt = `Analyze this ${language} code and suggest improvements for best practices, security, and maintainability:\n\n${code}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return response.text || "Unable to suggest improvements";
  } catch (error) {
    console.error("Error suggesting improvements:", error);
    return "Error suggesting improvements. Please try again.";
  }
}
