// Simple Authentication System for CodeSpace IDE
import { storage } from "./storage";
import { nanoid } from "nanoid";
import session from "express-session";
import type { Express, RequestHandler } from "express";

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  return session({
    secret: process.env.SESSION_SECRET || 'codespace-dev-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

// Simple authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = (req as any).session?.user;

  if (!user || !user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify user exists in database
  try {
    const dbUser = await storage.getUser(user.id);
    if (!dbUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    req.user = dbUser;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Setup simple authentication routes
export async function setupSimpleAuth(app: Express) {
  app.use(getSession());

  // Login endpoint - creates a simple user session
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Create or get user
      const userId = nanoid();
      const user = await storage.upsertUser({
        id: userId,
        email: email,
        firstName: name || email.split('@')[0],
        lastName: '',
        profileImageUrl: null
      });

      // Store user in session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName
      };

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get('/api/auth/user', async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      
      if (!sessionUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(sessionUser.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Simple signup - same as login for demo purposes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, name, firstName, lastName } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Create new user
      const userId = nanoid();
      const user = await storage.upsertUser({
        id: userId,
        email: email,
        firstName: firstName || name || email.split('@')[0],
        lastName: lastName || '',
        profileImageUrl: null
      });

      // Store user in session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName
      };

      res.json({
        message: "Signup successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        }
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });
}