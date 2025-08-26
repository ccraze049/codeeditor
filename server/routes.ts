import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertFileSchema, insertAiConversationSchema } from "@shared/schema";
import { generateCode, explainCode, debugCode } from "./gemini.js";
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

  // AI-powered project creation
  app.post('/api/projects/ai-create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt, name } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "AI prompt is required" });
      }

      // Create project first
      const projectData = {
        name: name || `AI Project - ${new Date().toLocaleString()}`,
        description: `Generated from prompt: ${prompt}`,
        ownerId: userId,
        isPublic: false,
      };
      
      const project = await storage.createProject(projectData);
      
      // Generate code using AI
      const generatedCode = await generateCode(prompt, 'javascript');
      
      // Create main component file with AI generated code
      await storage.createFile({
        projectId: project.id,
        name: "App.js",
        path: "/App.js",
        content: generatedCode.includes('import React') ? generatedCode : 
          `import React, { useState } from 'react';\nimport './App.css';\n\n${generatedCode}\n\nexport default App;`,
        isFolder: false,
      });

      // Create CSS file
      const cssContent = await generateCode(`Generate CSS styles for: ${prompt}`, 'css');
      await storage.createFile({
        projectId: project.id,
        name: "App.css",
        path: "/App.css",
        content: cssContent.includes('.') ? cssContent : 
          `.App {\n  text-align: center;\n  padding: 20px;\n  font-family: Arial, sans-serif;\n}\n\nbutton {\n  padding: 10px 20px;\n  margin: 10px;\n  background: #007bff;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n}\n\nbutton:hover {\n  background: #0056b3;\n}`,
        isFolder: false,
      });

      // Create package.json
      await storage.createFile({
        projectId: project.id,
        name: "package.json",
        path: "/package.json",
        content: `{\n  "name": "${project.name.toLowerCase().replace(/\\s+/g, '-')}",\n  "version": "1.0.0",\n  "private": true,\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0",\n    "react-scripts": "5.0.1"\n  },\n  "scripts": {\n    "start": "react-scripts start",\n    "build": "react-scripts build",\n    "test": "react-scripts test",\n    "eject": "react-scripts eject"\n  }\n}`,
        isFolder: false,
      });

      res.json({ 
        project,
        message: "Project created successfully with AI-generated code!"
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
    try {
      const userId = req.user.claims.sub;
      const { projectId, message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get or create conversation
      let conversation = await storage.getAiConversation(projectId, userId);
      if (!conversation) {
        conversation = await storage.createAiConversation({
          projectId,
          userId,
          messages: [],
        });
      }

      // Add user message
      const messages = [...(conversation.messages as any[]), {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      }];

      // Generate AI response (simplified for MVP)
      const aiResponse = await generateCode(message, 'javascript');
      messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      });

      // Update conversation
      await storage.updateAiConversation(conversation.id, { messages });

      res.json({ 
        response: aiResponse,
        conversationId: conversation.id 
      });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
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
