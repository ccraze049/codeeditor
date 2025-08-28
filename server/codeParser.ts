// AI Code Parser - Separates different languages from generated code into appropriate files
import { generateCode } from './openrouter-ai.js';

export interface ParsedCodeFile {
  name: string;
  path: string;
  content: string;
  language: string;
}

export interface ParsedProject {
  files: ParsedCodeFile[];
  projectStructure: {
    hasReact: boolean;
    hasCSS: boolean;
    hasHTML: boolean;
    hasTypeScript: boolean;
    hasJSON: boolean;
  };
}

/**
 * Parse AI-generated code and separate into appropriate files
 */
export async function parseAndCreateProjectFiles(prompt: string, projectName: string): Promise<ParsedProject> {
  console.log('Parsing AI generated code for multi-file structure:', prompt);
  
  // Enhanced prompt for better multi-file generation
  const enhancedPrompt = `Create a complete web application for: "${prompt}"

Generate separate code blocks for each file type needed:

1. **React Component (.jsx)**: Main component with state management and functionality
2. **CSS Styles (.css)**: Complete styling with responsive design
3. **Additional Components**: If needed, create separate components
4. **Package.json**: Dependencies and scripts
5. **HTML Template**: If needed for standalone HTML version

Format your response with clear file separators like:
=== FILENAME: App.jsx ===
[React component code here]

=== FILENAME: App.css ===
[CSS styles here]

=== FILENAME: package.json ===
[Package.json content here]

Make each file complete and production-ready. Use modern React patterns and responsive CSS.`;

  let generatedCode = '';
  try {
    // Generate code using enhanced prompt
    generatedCode = await generateCode(enhancedPrompt, 'javascript');
    
    // Parse the generated code into separate files
    const parsedFiles = parseCodeBlocks(generatedCode, prompt, projectName);
    
    // Ensure we have at least basic files
    const ensuredFiles = await ensureBasicFiles(parsedFiles, prompt, projectName);
    
    return {
      files: ensuredFiles,
      projectStructure: analyzeProjectStructure(ensuredFiles)
    };
    
  } catch (error) {
    console.error('Error parsing AI generated code:', error);
    
    // Fallback to creating basic files separately with better separation
    return createSeparatedFallbackFiles(prompt, projectName, generatedCode);
  }
}

/**
 * Parse code blocks from AI response
 */
function parseCodeBlocks(generatedCode: string, prompt: string, projectName: string): ParsedCodeFile[] {
  const files: ParsedCodeFile[] = [];
  
  // Regex patterns to detect file separators and code blocks
  const fileSeparatorRegex = /===\s*FILENAME:\s*([^\s]+)\s*===/gi;
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  
  // Try to parse with file separators first
  const fileMatches = Array.from(generatedCode.matchAll(fileSeparatorRegex));
  
  if (fileMatches.length > 0) {
    // Split by file separators
    const sections = generatedCode.split(fileSeparatorRegex);
    
    for (let i = 1; i < sections.length; i += 2) {
      const fileName = sections[i].trim();
      const content = sections[i + 1]?.trim() || '';
      
      if (fileName && content) {
        const cleanContent = cleanCodeContent(content);
        const language = detectLanguageFromFilename(fileName);
        
        files.push({
          name: fileName,
          path: `/${fileName}`,
          content: cleanContent,
          language
        });
      }
    }
  }
  
  // If no file separators found, try to extract code blocks
  if (files.length === 0) {
    const codeMatches = Array.from(generatedCode.matchAll(codeBlockRegex));
    
    for (const match of codeMatches) {
      const language = match[1] || 'javascript';
      const content = match[2].trim();
      
      if (content) {
        const fileName = generateFileName(language, content);
        
        files.push({
          name: fileName,
          path: `/${fileName}`,
          content: cleanCodeContent(content),
          language
        });
      }
    }
  }
  
  // If still no files, treat entire response as main component
  if (files.length === 0) {
    const cleanContent = cleanCodeContent(generatedCode);
    files.push({
      name: 'App.jsx',
      path: '/App.jsx',
      content: cleanContent,
      language: 'javascript'
    });
  }
  
  return files;
}

/**
 * Ensure we have all basic files needed for a React project
 */
async function ensureBasicFiles(existingFiles: ParsedCodeFile[], prompt: string, projectName: string): Promise<ParsedCodeFile[]> {
  const files = [...existingFiles];
  
  // Check what files we have
  const hasMainComponent = files.some(f => f.name.includes('App.') && (f.name.endsWith('.js') || f.name.endsWith('.jsx')));
  const hasCSS = files.some(f => f.name.endsWith('.css'));
  const hasPackageJson = files.some(f => f.name === 'package.json');
  
  // Create missing main component with enhanced modular prompt
  if (!hasMainComponent) {
    const mainContent = await generateCode(`Create a modular React application for: ${prompt}. Break it into separate reusable components with proper file structure.`, 'javascript');
    const extractedFiles = extractComponentsFromCode(mainContent, prompt);
    files.push(...extractedFiles);
  }
  
  // Create missing CSS
  if (!hasCSS) {
    const cssContent = await generateCode(`Create modular CSS styles for: ${prompt}. Create separate CSS files for different components.`, 'css');
    files.push({
      name: 'styles/App.css',
      path: '/styles/App.css',
      content: cleanCodeContent(cssContent),
      language: 'css'
    });
  }
  
  // Create package.json if missing
  if (!hasPackageJson) {
    files.push({
      name: 'package.json',
      path: '/package.json',
      content: createPackageJson(projectName),
      language: 'json'
    });
  }
  
  // Ensure proper folder structure
  return ensureProperStructure(files);
}

/**
 * Create fallback files when parsing fails
 */
async function createFallbackFiles(prompt: string, projectName: string): Promise<ParsedProject> {
  console.log('Creating fallback files for project:', projectName);
  
  const files: ParsedCodeFile[] = [];
  
  // Generate modular React component
  const reactCode = await generateCode(`Create a modular React application with separate components for: ${prompt}`, 'javascript');
  const extractedFiles = extractComponentsFromCode(reactCode, prompt);
  files.push(...extractedFiles);
  
  // Generate CSS with proper structure
  const cssCode = await generateCode(`Create modern CSS styles for: ${prompt}`, 'css');
  files.push({
    name: 'styles/App.css',
    path: '/styles/App.css',
    content: cleanCodeContent(cssCode),
    language: 'css'
  });
  
  // Create package.json
  files.push({
    name: 'package.json',
    path: '/package.json',
    content: createPackageJson(projectName),
    language: 'json'
  });
  
  return {
    files: ensureProperStructure(files),
    projectStructure: analyzeProjectStructure(files)
  };
}

/**
 * Clean code content by removing markdown formatting and extra whitespace
 */
function cleanCodeContent(content: string): string {
  return content
    .replace(/^```[\w]*\n?/gm, '') // Remove opening code blocks
    .replace(/\n?```$/gm, '') // Remove closing code blocks
    .replace(/^\s*=== FILENAME:.*===\s*\n?/gm, '') // Remove file separators
    .trim();
}

/**
 * Detect programming language from filename
 */
function detectLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    default:
      return 'text';
  }
}

/**
 * Generate appropriate filename based on language and content
 */
function generateFileName(language: string, content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (language === 'css' || lowerContent.includes('background') || lowerContent.includes('color:')) {
    return 'App.css';
  }
  
  if (language === 'html' || lowerContent.includes('<!doctype') || lowerContent.includes('<html')) {
    return 'index.html';
  }
  
  if (lowerContent.includes('"name"') && lowerContent.includes('"version"')) {
    return 'package.json';
  }
  
  if (language === 'typescript' || lowerContent.includes('interface ') || lowerContent.includes('type ')) {
    return 'App.tsx';
  }
  
  // Default to React component
  return 'App.jsx';
}

/**
 * Analyze project structure
 */
function analyzeProjectStructure(files: ParsedCodeFile[]): ParsedProject['projectStructure'] {
  return {
    hasReact: files.some(f => f.content.includes('React') || f.content.includes('useState') || f.name.endsWith('.jsx')),
    hasCSS: files.some(f => f.name.endsWith('.css')),
    hasHTML: files.some(f => f.name.endsWith('.html')),
    hasTypeScript: files.some(f => f.name.endsWith('.ts') || f.name.endsWith('.tsx')),
    hasJSON: files.some(f => f.name.endsWith('.json'))
  };
}

/**
 * Extract React components from generated code into separate files
 */
function extractComponentsFromCode(generatedCode: string, prompt: string): ParsedCodeFile[] {
  const files: ParsedCodeFile[] = [];
  
  // Fix common import path issues in the generated code
  let cleanedCode = generatedCode
    .replace(/import\s+['"]style\//g, "import './styles/")
    .replace(/import\s+['"]style/g, "import './styles")
    .replace(/import\s+['"]components\//g, "import './components/")
    .replace(/import\s+['"]\.\.?\/style/g, "import './styles")
    .replace(/from\s+['"]style/g, "from './styles")
    .replace(/from\s+['"]components\//g, "from './components/");
  
  // Look for function components with better regex
  const componentRegex = /(?:function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]*?\n\}|const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\n\})/g;
  const components = Array.from(cleanedCode.matchAll(componentRegex));
  
  // Extract individual components if found
  if (components.length > 0) {
    for (const component of components) {
      const componentName = component[1] || component[2];
      const componentCode = component[0];
      
      // Skip if this is the main App component or too small
      if (componentName === 'App' || componentCode.length < 50) continue;
      
      // Create full component with proper imports
      const fullComponent = `import React from 'react';
import '../styles/${componentName}.css';

${componentCode}

export default ${componentName};`;
      
      files.push({
        name: `components/${componentName}.jsx`,
        path: `/components/${componentName}.jsx`,
        content: fullComponent,
        language: 'javascript'
      });
      
      // Create corresponding CSS file with proper styles
      files.push({
        name: `styles/${componentName}.css`,
        path: `/styles/${componentName}.css`,
        content: `/* Styles for ${componentName} component */\n.${componentName.toLowerCase()}-container {\n  padding: 20px;\n}\n\n.${componentName.toLowerCase()}-title {\n  font-size: 1.5rem;\n  margin-bottom: 10px;\n}`,
        language: 'css'
      });
    }
  }
  
  // Always create main App component with fixed imports
  const componentImports = components
    .filter(c => (c[1] || c[2]) !== 'App' && c[0].length >= 50)
    .map(c => `import ${c[1] || c[2]} from './components/${c[1] || c[2]}';`)
    .join('\n');
  
  const hasMainApp = cleanedCode.includes('function App') || cleanedCode.includes('const App');
  
  let appComponent;
  if (hasMainApp && componentImports) {
    // Extract main App component and add imports
    const appMatch = cleanedCode.match(/(function\s+App\s*\([^)]*\)\s*\{[\s\S]*?\n\}|const\s+App\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\n\})/)?.[0];
    appComponent = `import React from 'react';
import './styles/App.css';
${componentImports}

${appMatch || `function App() {
  return (
    <div className="App">
      <h1>Welcome to your React App</h1>
      <p>Generated from: ${prompt}</p>
    </div>
  );
}`}

export default App;`;
  } else {
    // Use cleaned code or create basic component
    appComponent = cleanedCode.includes('function') || cleanedCode.includes('const') 
      ? `import React from 'react';
import './styles/App.css';

${cleanedCode}

export default App;`
      : generateBasicAppComponent(prompt);
  }
  
  files.push({
    name: 'App.jsx',
    path: '/App.jsx',
    content: appComponent,
    language: 'javascript'
  });
  
  return files;
}

function generateBasicAppComponent(prompt: string): string {
  return `import React, { useState } from 'react';
import './styles/App.css';

function App() {
  const [message, setMessage] = useState('Hello World!');
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>{message}</h1>
        <p>Generated from: ${prompt}</p>
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

/**
 * Ensure proper folder structure for the project
 */
function ensureProperStructure(files: ParsedCodeFile[]): ParsedCodeFile[] {
  const structuredFiles: ParsedCodeFile[] = [];
  
  for (const file of files) {
    let newFile = { ...file };
    
    // Organize components into components/ folder
    if (file.name.endsWith('.jsx') && !file.name.includes('App.jsx') && !file.path.includes('/components/')) {
      newFile.name = `components/${file.name}`;
      newFile.path = `/components/${file.name}`;
    }
    
    // Organize CSS into styles/ folder
    if (file.name.endsWith('.css') && !file.path.includes('/styles/')) {
      newFile.name = `styles/${file.name}`;
      newFile.path = `/styles/${file.name}`;
    }
    
    // Organize utilities into utils/ folder if any
    if (file.name.includes('util') || file.name.includes('helper')) {
      newFile.name = `utils/${file.name}`;
      newFile.path = `/utils/${file.name}`;
    }
    
    structuredFiles.push(newFile);
  }
  
  return structuredFiles;
}

/**
 * Create package.json content
 */
function createPackageJson(projectName: string): string {
  const safeName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
  return JSON.stringify({
    name: safeName,
    version: "1.0.0",
    private: true,
    dependencies: {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-scripts": "5.0.1"
    },
    scripts: {
      "start": "react-scripts start",
      "build": "react-scripts build",
      "test": "react-scripts test",
      "eject": "react-scripts eject"
    },
    browserslist: {
      "production": [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      "development": [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version"
      ]
    }
  }, null, 2);
}

/**
 * Create fallback files with proper content separation
 */
function createSeparatedFallbackFiles(prompt: string, projectName: string, generatedCode: string): ParsedProject {
  console.log('Creating separated fallback files');
  
  const files: ParsedCodeFile[] = [];
  
  // Separate CSS and JS content
  const cssRegex = /\.[\w-]+\s*\{[^{}]*\}/g;
  const cssMatches = generatedCode.match(cssRegex);
  
  // Extract CSS content
  let cssContent = '';
  if (cssMatches) {
    cssContent = cssMatches.join('\n\n');
  } else {
    // Default CSS for the app
    cssContent = `.App {
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
}`;
  }
  
  // Create JSX content without CSS
  let jsxContent = generatedCode.replace(cssRegex, '').trim();
  
  // If content doesn't look like React, create a basic component
  if (!jsxContent.includes('import React') && !jsxContent.includes('function ') && !jsxContent.includes('const ')) {
    jsxContent = `import React, { useState } from 'react';
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
  
  // Add files
  files.push({
    name: 'App.jsx',
    path: '/App.jsx',
    content: jsxContent,
    language: 'javascript'
  });
  
  files.push({
    name: 'styles/App.css',
    path: '/styles/App.css',
    content: cssContent,
    language: 'css'
  });
  
  // Add package.json
  files.push({
    name: 'package.json',
    path: '/package.json',
    content: createPackageJson(projectName),
    language: 'json'
  });
  
  return {
    files,
    projectStructure: analyzeProjectStructure(files)
  };
}