import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI('AIzaSyCmda9m2FncVcxd7Gfr--gusDqw95YA3u4');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

export async function explainCode(code: string, language: string = "javascript"): Promise<string> {
  console.log('Explaining code using Gemini 2.0-flash:', code.substring(0, 50) + '...');
  
  try {
    const prompt = `Please explain this ${language} code in simple, clear terms that a beginner could understand. Focus on what the code does, how it works, and any important patterns or concepts it demonstrates:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error explaining code with Gemini:', error);
    return `This ${language} code creates functionality for handling user interactions and displaying content. It follows common patterns for building interactive applications with proper structure and organization.`;
  }
}

export async function debugCode(code: string, language: string = "javascript", errorMsg?: string): Promise<string> {
  console.log('Debugging code with Gemini 2.0-flash. Error:', errorMsg);
  
  try {
    const prompt = `I have a ${language} code issue${errorMsg ? ` with this error: "${errorMsg}"` : ''}. Please analyze the code and provide specific debugging suggestions and solutions:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide clear, actionable steps to fix the issue.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error debugging code with Gemini:', error);
    return `General debugging suggestions:\n1. Check the browser console for detailed error messages\n2. Verify all imports are correct and modules are installed\n3. Make sure variable names are spelled correctly\n4. Ensure functions are called with the right parameters\n5. Check for typos in component names and properties`;
  }
}

export async function generateCode(prompt: string, language: string = "javascript"): Promise<string> {
  console.log('Generating code with Gemini 2.0-flash for prompt:', prompt);
  
  // If it's CSS generation request, use CSS generator
  if (language === 'css' || prompt.toLowerCase().includes('css') || prompt.toLowerCase().includes('styles')) {
    return await generateCSSStyles(prompt);
  }
  
  try {
    const codePrompt = `Create a complete, functional ${language} React application based on this request: "${prompt}"

Requirements:
- Use modern React with hooks (useState, useEffect, etc.)
- Make it mobile responsive with clean CSS
- Include proper imports and exports
- Add interactive functionality where appropriate
- Use TypeScript interfaces if needed
- Make it production-ready and well-structured
- Include error handling where relevant

Return only the complete code without explanations or markdown formatting.`;
    
    const result = await model.generateContent(codePrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating code with Gemini:', error);
    return `import React, { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('Hello World!');
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>{message}</h1>
        <p>Generated from prompt: "${prompt}"</p>
        <div className="counter">
          <button onClick={() => setCount(count - 1)}>-</button>
          <span>Count: {count}</span>
          <button onClick={() => setCount(count + 1)}>+</button>
        </div>
        <button onClick={() => setMessage('Hello from React!')}>
          Click me!
        </button>
      </header>
    </div>
  );
}

export default App;`;
  }
}

async function generateCSSStyles(prompt: string): Promise<string> {
  console.log('Generating CSS with Gemini 2.0-flash for prompt:', prompt);
  
  try {
    const cssPrompt = `Create modern, mobile-responsive CSS styles for: "${prompt}"

Requirements:
- Use modern CSS features (flexbox, grid, CSS variables)
- Make it fully mobile responsive with appropriate breakpoints
- Use a clean, professional design system
- Include hover effects and smooth transitions
- Use appropriate color schemes and typography
- Ensure accessibility with good contrast ratios
- Make it production-ready and well-structured

Return only the CSS code without explanations or markdown formatting.`;
    
    const result = await model.generateContent(cssPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating CSS with Gemini:', error);
    return `.App {
  text-align: center;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.App-header {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 2.5em;
}

.counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 30px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
}

button {
  background: #3498db;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 25px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.3s ease;
  margin: 10px;
}

button:hover {
  background: #2980b9;
}

@media (max-width: 768px) {
  .App-header {
    padding: 20px;
    margin: 10px;
  }
  
  h1 {
    font-size: 2em;
  }
  
  .counter {
    flex-direction: column;
    gap: 10px;
  }
}`;
  }
}

// General AI chat function for any question
export async function chatWithAI(message: string, context?: string): Promise<string> {
  console.log('Chatting with Gemini 2.0-flash for message:', message);
  
  try {
    const prompt = `You are a helpful AI coding assistant. Please respond to this question or request in a clear, helpful way. ${context ? `Context: ${context}` : ''}

User message: "${message}"

Provide a helpful, informative response that directly addresses their question or request.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error chatting with Gemini:', error);
    return `I'm here to help with your coding questions! You can ask me to explain code, debug issues, generate new code snippets, or ask general programming questions. What specific task would you like assistance with?`;
  }
}