import express, { type Request, Response, NextFunction } from "express";
import { Server as SocketServer } from "socket.io";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      // Only log response body in development to avoid sensitive data exposure
      if (capturedJsonResponse && process.env.NODE_ENV === "development") {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {

  const server = await registerRoutes(app);
  
  // Setup WebSocket for real-time collaboration and live preview
  const io = new SocketServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Handle WebSocket connections for live preview and collaboration
  io.on('connection', (socket) => {
    log(`WebSocket client connected: ${socket.id}`, 'websocket');

    // Handle file changes for live preview
    socket.on('file-change', (data) => {
      socket.broadcast.emit('file-updated', data);
    });

    // Handle cursor position sharing
    socket.on('cursor-position', (data) => {
      socket.broadcast.emit('cursor-update', {
        ...data,
        userId: socket.id
      });
    });

    // Handle user joining a project room
    socket.on('join-project', (projectId) => {
      socket.join(`project-${projectId}`);
      socket.to(`project-${projectId}`).emit('user-joined', {
        userId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Handle user leaving
    socket.on('disconnect', () => {
      log(`WebSocket client disconnected: ${socket.id}`, 'websocket');
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
