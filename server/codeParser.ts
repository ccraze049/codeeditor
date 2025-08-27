// AI Code Parser - Separates different languages from generated code into appropriate files
import { generateCode } from './gemini.js';

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

  try {
    // Generate code using enhanced prompt
    const generatedCode = await generateCode(enhancedPrompt, 'javascript');
    
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
    
    // Fallback to creating basic files separately
    return await createFallbackFiles(prompt, projectName);
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
  
  // Create missing main component
  if (!hasMainComponent) {
    const mainContent = await generateCode(`Create a React component for: ${prompt}`, 'javascript');
    files.push({
      name: 'App.jsx',
      path: '/App.jsx',
      content: cleanCodeContent(mainContent),
      language: 'javascript'
    });
  }
  
  // Create missing CSS
  if (!hasCSS) {
    const cssContent = await generateCode(`Create CSS styles for: ${prompt}`, 'css');
    files.push({
      name: 'App.css',
      path: '/App.css',
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
  
  return files;
}

/**
 * Create fallback files when parsing fails
 */
async function createFallbackFiles(prompt: string, projectName: string): Promise<ParsedProject> {
  console.log('Creating fallback files for project:', projectName);
  
  const files: ParsedCodeFile[] = [];
  
  // Generate React component
  const reactCode = await generateCode(`Create a React component for: ${prompt}`, 'javascript');
  files.push({
    name: 'App.jsx',
    path: '/App.jsx',
    content: cleanCodeContent(reactCode),
    language: 'javascript'
  });
  
  // Generate CSS
  const cssCode = await generateCode(`Create CSS styles for: ${prompt}`, 'css');
  files.push({
    name: 'App.css',
    path: '/App.css',
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
    files,
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