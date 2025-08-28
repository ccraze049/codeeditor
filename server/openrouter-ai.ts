import axios from "axios";

const API_KEY = "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";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

if (!API_KEY) {
  console.warn('OPENROUTER_API_KEY not found in environment variables');
}

// Helper function to make OpenRouter API calls
async function callOpenRouterAPI(prompt: string): Promise<string> {
  try {
    const res = await axios.post(
      ENDPOINT,
      {
        model: "moonshotai/kimi-dev-72b:free",
        messages: [
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        }
      }
    );

    return res.data.choices[0].message.content;
  } catch (err: any) {
    console.error("OpenRouter AI Error:", err.response?.data || err.message);
    
    // Handle rate limiting specifically
    if (err.response?.status === 429) {
      console.log("Rate limited by OpenRouter, using fallback generation");
      throw new Error("Rate limited - using fallback");
    }
    
    throw err;
  }
}

export async function explainCode(code: string, language: string = "javascript"): Promise<string> {
  console.log('Explaining code using OpenRouter AI:', code.substring(0, 50) + '...');
  
  try {
    const prompt = `Please explain this ${language} code in simple, clear terms that a beginner could understand. Focus on what the code does, how it works, and any important patterns or concepts it demonstrates:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    
    return await callOpenRouterAPI(prompt);
  } catch (error) {
    console.error('Error explaining code with OpenRouter AI:', error);
    return `This ${language} code creates functionality for handling user interactions and displaying content. It follows common patterns for building interactive applications with proper structure and organization.`;
  }
}

export async function debugCode(code: string, language: string = "javascript", errorMsg?: string): Promise<string> {
  console.log('Debugging code with OpenRouter AI. Error:', errorMsg);
  
  try {
    const prompt = `I have a ${language} code issue${errorMsg ? ` with this error: "${errorMsg}"` : ''}. Please analyze the code and provide specific debugging suggestions and solutions:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide clear, actionable steps to fix the issue.`;
    
    return await callOpenRouterAPI(prompt);
  } catch (error) {
    console.error('Error debugging code with OpenRouter AI:', error);
    return `General debugging suggestions:\n1. Check the browser console for detailed error messages\n2. Verify all imports are correct and modules are installed\n3. Make sure variable names are spelled correctly\n4. Ensure functions are called with the right parameters\n5. Check for typos in component names and properties`;
  }
}

export async function generateCode(prompt: string, language: string = "javascript"): Promise<string> {
  console.log('Generating code with OpenRouter AI for prompt:', prompt);
  
  // If it's CSS generation request, use CSS generator
  if (language === 'css' || prompt.toLowerCase().includes('css') || prompt.toLowerCase().includes('styles')) {
    return await generateCSSStyles(prompt);
  }
  
  try {
    const codePrompt = `Create a complete, functional ${language} React application for: "${prompt}"

IMPORTANT REQUIREMENTS:
1. Create MULTIPLE React components (at least 3-4 components)
2. Break down into: Header, Main Content, Footer, and Feature components
3. Use CORRECT import paths: './styles/ComponentName.css' for CSS
4. Each component should have its own CSS file
5. Use modern React hooks (useState, useEffect)
6. Make it mobile responsive
7. Include proper imports and exports

Component Structure Example:
- Header component (navigation, title)
- Main content component (core functionality) 
- Footer component (footer info)
- Feature components (buttons, forms, lists, etc.)

Format with file separators:
=== FILENAME: App.jsx ===
import React from 'react';
import './styles/App.css';
import Header from './components/Header';
import MainContent from './components/MainContent';
import Footer from './components/Footer';

function App() {
  return (
    <div className="App">
      <Header />
      <MainContent />
      <Footer />
    </div>
  );
}

export default App;

=== FILENAME: components/Header.jsx ===
import React from 'react';
import '../styles/Header.css';

function Header() {
  return (
    <header className="header">
      <h1>App Title</h1>
    </header>
  );
}

export default Header;

=== FILENAME: styles/App.css ===
.App { /* styles */ }

=== FILENAME: styles/Header.css ===
.header { /* styles */ }

Return complete modular code with proper imports/exports.`;
    
    return await callOpenRouterAPI(codePrompt);
  } catch (error) {
    console.error('Error generating code with OpenRouter AI:', error);
    return generateFallbackCode(prompt);
  }
}

function generateFallbackCode(prompt: string): string {
  return `import React, { useState } from 'react';
import './styles/App.css';

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

async function generateCSSStyles(prompt: string): Promise<string> {
  console.log('Generating CSS with OpenRouter AI for prompt:', prompt);
  
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
    
    return await callOpenRouterAPI(cssPrompt);
  } catch (error) {
    console.error('Error generating CSS with OpenRouter AI:', error);
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
  console.log('Chatting with OpenRouter AI for message:', message);
  
  try {
    let prompt = `You are a helpful AI coding assistant. Please respond to this question or request in a clear, helpful way.`;
    
    // Check if this is a UI improvement request with code context
    if (context && (message.toLowerCase().includes('ui') || message.toLowerCase().includes('improve') || message.toLowerCase().includes('app.jsx'))) {
      prompt = `You are a helpful AI coding assistant. The user is asking for UI improvements to their React application. 

${context}

User request: "${message}"

Please provide specific, actionable suggestions for improving the UI. Include:
1. Specific code improvements or modifications
2. Modern UI/UX best practices
3. CSS styling suggestions
4. Component structure improvements
5. Accessibility enhancements

Give concrete examples and code snippets where helpful.`;
    } else {
      prompt += ` ${context ? `Context: ${context}` : ''}

User message: "${message}"

Provide a helpful, informative response that directly addresses their question or request.`;
    }
    
    return await callOpenRouterAPI(prompt);
  } catch (error) {
    console.error('Error chatting with OpenRouter AI:', error);
    return `I'm here to help with your coding questions! You can ask me to explain code, debug issues, generate new code snippets, or ask general programming questions. What specific task would you like assistance with?`;
  }
}