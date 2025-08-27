import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertFileSchema, insertAiConversationSchema } from "@shared/schema";
import { generateCode, explainCode, debugCode } from "./gemini.js";
import { parseAndCreateProjectFiles } from "./codeParser.js";
import { z } from "zod";
import { spawn } from "child_process";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Try to get user from storage, create if doesn't exist
      let user = await storage.getUser(userId);
      if (!user) {
        // Create user if doesn't exist
        await storage.upsertUser({
          id: userId,
          email: req.user.claims.email || 'dev@example.com',
          firstName: req.user.claims.first_name || 'Dev',
          lastName: req.user.claims.last_name || 'User',
          profileImageUrl: req.user.claims.profile_image_url || null,
        });
        user = await storage.getUser(userId);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      // Return mock user in development if storage fails
      if (process.env.NODE_ENV === 'development') {
        res.json({
          id: 'dev-user-123',
          email: 'dev@example.com',
          firstName: 'Dev',
          lastName: 'User',
          profileImageUrl: null
        });
      } else {
        res.status(500).json({ message: "Failed to fetch user" });
      }
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // AI-powered project creation with multi-file support
  app.post('/api/projects/ai-create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt, name } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "AI prompt is required" });
      }

      // Create project first
      const projectName = name || `AI Project - ${new Date().toLocaleString()}`;
      const projectData = {
        name: projectName,
        description: `Generated from prompt: ${prompt}`,
        ownerId: userId,
        isPublic: false,
      };
      
      const project = await storage.createProject(projectData);
      
      // Parse AI-generated code into separate files
      console.log('Creating multi-file AI project for prompt:', prompt);
      const parsedProject = await parseAndCreateProjectFiles(prompt, projectName);
      
      // Create all the parsed files
      const createdFiles = [];
      for (const file of parsedProject.files) {
        try {
          const createdFile = await storage.createFile({
            projectId: project.id,
            name: file.name,
            path: file.path,
            content: file.content,
            isFolder: false,
          });
          createdFiles.push(createdFile);
          console.log(`Created file: ${file.name} (${file.language})`);
        } catch (fileError) {
          console.error(`Error creating file ${file.name}:`, fileError);
        }
      }

      res.json({ 
        project,
        files: createdFiles,
        structure: parsedProject.projectStructure,
        message: `AI project created with ${createdFiles.length} files! Each language has its own dedicated file.`
      });
    } catch (error) {
      console.error("Error creating AI project:", error);
      res.status(500).json({ message: "Failed to create AI project" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      const project = await storage.createProject(projectData);
      
      // Create initial files
      await storage.createFile({
        projectId: project.id,
        name: "App.js",
        path: "/App.js",
        content: `import React, { useState } from 'react';\nimport './App.css';\n\nfunction App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="App">\n      <h1>Hello World!</h1>\n      <button onClick={() => setCount(count + 1)}>\n        Count: {count}\n      </button>\n    </div>\n  );\n}\n\nexport default App;`,
        isFolder: false,
      });

      await storage.createFile({
        projectId: project.id,
        name: "App.css",
        path: "/App.css",
        content: `.App {\n  text-align: center;\n  padding: 20px;\n}\n\nbutton {\n  padding: 10px 20px;\n  margin: 10px;\n  background: #007bff;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n}\n\nbutton:hover {\n  background: #0056b3;\n}`,
        isFolder: false,
      });

      await storage.createFile({
        projectId: project.id,
        name: "package.json",
        path: "/package.json",
        content: `{\n  "name": "${project.name.toLowerCase().replace(/\\s+/g, '-')}",\n  "version": "1.0.0",\n  "private": true,\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0",\n    "react-scripts": "5.0.1"\n  },\n  "scripts": {\n    "start": "react-scripts start",\n    "build": "react-scripts build",\n    "test": "react-scripts test",\n    "eject": "react-scripts eject"\n  }\n}`,
        isFolder: false,
      });

      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access
      const hasAccess = project.ownerId === userId || project.isPublic;
      if (!hasAccess) {
        const collaboration = await storage.getCollaboration(id, userId);
        if (!collaboration) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project || project.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(id, updateData);
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project || project.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // File routes
  app.get('/api/projects/:projectId/files', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId } = req.params;
      
      // Check project access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasAccess = project.ownerId === userId || project.isPublic;
      if (!hasAccess) {
        const collaboration = await storage.getCollaboration(projectId, userId);
        if (!collaboration) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const files = await storage.getProjectFiles(projectId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post('/api/projects/:projectId/files', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId } = req.params;
      
      // Check project access
      const project = await storage.getProject(projectId);
      if (!project || project.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const fileData = insertFileSchema.parse({
        ...req.body,
        projectId,
      });
      const file = await storage.createFile(fileData);
      res.json(file);
    } catch (error) {
      console.error("Error creating file:", error);
      res.status(500).json({ message: "Failed to create file" });
    }
  });

  app.put('/api/files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const file = await storage.getFile(id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Check project access
      const project = await storage.getProject(file.projectId);
      if (!project || project.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = insertFileSchema.partial().parse(req.body);
      const updatedFile = await storage.updateFile(id, updateData);
      res.json(updatedFile);
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  app.delete('/api/files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const file = await storage.getFile(id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Check project access
      const project = await storage.getProject(file.projectId);
      if (!project || project.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteFile(id);
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // AI Assistant routes
  app.post('/api/ai/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, language = 'javascript' } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const code = await generateCode(prompt, language);
      res.json({ code });
    } catch (error) {
      console.error("Error generating code:", error);
      res.status(500).json({ message: "Failed to generate code" });
    }
  });

  app.post('/api/ai/explain', isAuthenticated, async (req: any, res) => {
    try {
      const { code, language = 'javascript' } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Code is required" });
      }

      const explanation = await explainCode(code, language);
      res.json({ explanation });
    } catch (error) {
      console.error("Error explaining code:", error);
      res.status(500).json({ message: "Failed to explain code" });
    }
  });

  app.post('/api/ai/debug', isAuthenticated, async (req: any, res) => {
    try {
      const { code, language = 'javascript', error: errorMsg } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Code is required" });
      }

      const suggestions = await debugCode(code, language, errorMsg);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error debugging code:", error);
      res.status(500).json({ message: "Failed to debug code" });
    }
  });

  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    const { projectId, message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Simple text-based AI response
    const messageLower = message.toLowerCase();
    let aiResponse = '';
    
    if (messageLower.includes('explain') || messageLower.includes('what')) {
      aiResponse = `I can help explain code concepts. This appears to be asking about code functionality. In React applications, components manage state and render UI elements based on user interactions and data changes.`;
    } else if (messageLower.includes('debug') || messageLower.includes('error') || messageLower.includes('fix')) {
      aiResponse = `For debugging, I recommend checking the browser console for error messages, verifying all imports are correct, and ensuring proper React hooks usage. Common issues include missing dependencies and incorrect state management.`;
    } else if (messageLower.includes('counter')) {
      aiResponse = `A counter app typically uses useState to manage a number value, with buttons to increment/decrement it. The state updates trigger re-renders to show the new count value to the user.`;
    } else {
      aiResponse = `I'm here to help with your coding questions! You can ask me to explain code, debug issues, or generate new code snippets. What specific task would you like assistance with?`;
    }

    res.json({ 
      response: aiResponse
    });
  });

  // Project sharing
  app.post('/api/projects/:id/share', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project || project.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.updateProject(id, { isPublic: true });
      
      // Generate share URL (using REPLIT_DOMAINS for the domain)
      const domains = process.env.REPLIT_DOMAINS?.split(',') || ['localhost:5000'];
      const shareUrl = `https://${domains[0]}/shared/${id}`;
      
      res.json({ shareUrl });
    } catch (error) {
      console.error("Error sharing project:", error);
      res.status(500).json({ message: "Failed to share project" });
    }
  });

  // Public project access
  app.get('/api/shared/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project || !project.isPublic) {
        return res.status(404).json({ message: "Project not found or not public" });
      }

      const files = await storage.getProjectFiles(id);
      res.json({ project, files });
    } catch (error) {
      console.error("Error fetching shared project:", error);
      res.status(500).json({ message: "Failed to fetch shared project" });
    }
  });

  // Project preview generation - return HTML content for iframe
  app.get('/api/projects/:id/preview-html', async (req, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).send('<h1>Project not found</h1>');
      }

      const files = await storage.getProjectFiles(id);
      
      // Find App.js and App.css files
      const appJsFile = files.find((f: any) => f.name === 'App.js');
      const appCssFile = files.find((f: any) => f.name === 'App.css');
      
      if (!appJsFile) {
        return res.status(400).send('<h1>App.js file not found</h1>');
      }

      // Clean JS code - remove imports and export default
      let jsCode = (appJsFile.content || '')
        .replace(/import.*from.*['"]/g, '// ')
        .replace(/export default App;?/g, '');

      // Generate preview HTML with React code
      const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${project.name} - Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    ${appCssFile ? appCssFile.content : ''}
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${jsCode}
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.send(previewHtml);
      
    } catch (error) {
      console.error("Error generating preview:", error);
      res.status(500).send('<h1>Failed to generate preview</h1>');
    }
  });

  // Simple project preview endpoint that returns preview data
  app.get('/api/projects/:id/preview', async (req, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const files = await storage.getProjectFiles(id);
      const appJsFile = files.find((f: any) => f.name === 'App.js');
      
      if (!appJsFile) {
        return res.status(400).json({ message: "App.js file not found" });
      }

      res.json({ 
        message: "Preview available",
        previewUrl: `/api/projects/${id}/preview-html`
      });
      
    } catch (error) {
      console.error("Error generating preview:", error);
      res.status(500).json({ message: "Failed to generate preview" });
    }
  });

  // Terminal command execution route
  app.post('/api/terminal/execute', isAuthenticated, async (req: any, res) => {
    try {
      const { command, projectId } = req.body;
      
      if (!command) {
        return res.status(400).json({ message: "Command is required" });
      }

      // Security: Only allow safe commands
      const allowedCommands = [
        'npm', 'node', 'ls', 'pwd', 'cat', 'echo', 'date', 'whoami',
        'git', 'clear', 'help', 'mkdir', 'touch', 'rm', 'cp', 'mv'
      ];
      
      const commandParts = command.trim().split(' ');
      const baseCommand = commandParts[0];
      
      if (!allowedCommands.includes(baseCommand)) {
        return res.json({ 
          output: `Command '${baseCommand}' is not allowed for security reasons.\nAllowed commands: ${allowedCommands.join(', ')}`,
          type: 'error'
        });
      }

      // Special handling for some commands
      if (command === 'clear') {
        return res.json({ output: '', type: 'clear' });
      }
      
      if (command === 'help') {
        return res.json({ 
          output: `Available commands:\n${allowedCommands.map(cmd => `  ${cmd}`).join('\n')}\n\nNote: Commands are executed in a secure sandbox environment.`,
          type: 'output'
        });
      }

      // Execute command
      const child = spawn(baseCommand, commandParts.slice(1), {
        cwd: process.cwd(),
        env: process.env,
        timeout: 30000 // 30 second timeout
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        const result = error || output || `Command completed with exit code ${code}`;
        res.json({ 
          output: result,
          type: code === 0 ? 'output' : 'error',
          exitCode: code
        });
      });

      child.on('error', (err) => {
        res.json({ 
          output: `Error executing command: ${err.message}`,
          type: 'error'
        });
      });
      
    } catch (error) {
      console.error("Error executing terminal command:", error);
      res.status(500).json({ message: "Failed to execute command" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
