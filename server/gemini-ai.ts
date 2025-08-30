import axios from 'axios';

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const API_KEY = "AIzaSyCmda9m2FncVcxd7Gfr--gusDqw95YA3u4";

if (!API_KEY) {
  console.error('GEMINI_API_KEY environment variable is not set');
}

async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    console.log('Making request to Gemini API:', GEMINI_API_URL);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      GEMINI_API_URL,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': API_KEY,
        }
      }
    );

    console.log('Gemini API response:', JSON.stringify(response.data, null, 2));

    if (response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Unexpected response format from Gemini API');
    }
  } catch (err: any) {
    console.error("Gemini AI Error:", err.response?.data || err.message);
    
    // Handle rate limiting specifically
    if (err.response?.status === 429) {
      console.log("Rate limited by Gemini, using fallback generation");
      throw new Error("Rate limited - using fallback");
    }
    
    throw err;
  }
}

export async function explainCode(code: string, language: string = "javascript"): Promise<string> {
  console.log('Explaining code using Gemini AI:', code.substring(0, 50) + '...');
  
  try {
    const prompt = `Please explain this ${language} code in simple, clear terms that a beginner could understand. Focus on what the code does, how it works, and any important patterns or concepts it demonstrates:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Error explaining code with Gemini AI:', error);
    return `This ${language} code creates functionality for handling user interactions and displaying content. It follows common patterns for building interactive applications with proper structure and organization.`;
  }
}

export async function debugCode(code: string, language: string = "javascript", errorMsg?: string): Promise<string> {
  console.log('Debugging code with Gemini AI. Error:', errorMsg);
  
  try {
    const prompt = `I have a ${language} code issue${errorMsg ? ` with this error: "${errorMsg}"` : ''}. Please analyze the code and provide specific debugging suggestions and solutions:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide clear, actionable steps to fix the issue.`;
    
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Error debugging code with Gemini AI:', error);
    return `General debugging suggestions:\n1. Check the browser console for detailed error messages\n2. Verify all imports are correct and modules are installed\n3. Make sure variable names are spelled correctly\n4. Ensure functions are called with the right parameters\n5. Check for typos in component names and properties`;
  }
}

export async function generateCode(prompt: string, language: string = "javascript"): Promise<string> {
  console.log('Generating code with Gemini AI for prompt:', prompt);
  
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
    
    return await callGeminiAPI(codePrompt);
  } catch (error) {
    console.error('Error generating code with Gemini AI:', error);
    return generateFallbackCode(prompt);
  }
}

export async function chatWithAI(message: string, context?: string): Promise<string> {
  console.log('Chatting with Gemini AI:', message);
  
  try {
    const contextPrefix = context ? `Context: ${context}\n\n` : '';
    const prompt = `${contextPrefix}User: ${message}\n\nAs a helpful coding assistant, please provide a clear and helpful response.`;
    
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Error chatting with Gemini AI:', error);
    return "I'm having trouble connecting to the AI service right now. Please try again in a moment.";
  }
}

async function generateCSSStyles(prompt: string): Promise<string> {
  console.log('Generating CSS with Gemini AI for prompt:', prompt);
  
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
    
    return await callGeminiAPI(cssPrompt);
  } catch (error) {
    console.error('Error generating CSS with Gemini AI:', error);
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

function generateFallbackCode(prompt: string): string {
  return `// Generated React App for: ${prompt}
import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Your App</h1>
        <p>This is a basic React application generated for: ${prompt}</p>
        <div className="counter">
          <button onClick={() => setCount(count - 1)}>-</button>
          <span>Count: {count}</span>
          <button onClick={() => setCount(count + 1)}>+</button>
        </div>
      </header>
    </div>
  );
}

export default App;`;
}