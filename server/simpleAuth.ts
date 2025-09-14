// Simple Authentication System for CodeSpace IDE
import { mongoStorage } from "./mongoStorage";
import { nanoid } from "nanoid";
import session from "express-session";
import MongoStore from "connect-mongo";
import type { Express, RequestHandler } from "express";

// Session configuration with MongoDB store
export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  return session({
    secret: process.env.SESSION_SECRET || 'codespace-dev-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb+srv://Codeyogi:oqZhnpSgOGVyYvco@codeeditor.pmsiorb.mongodb.net/codespace",
      touchAfter: 24 * 3600, // lazy session update
      ttl: sessionTtl / 1000, // convert to seconds
    }),
    cookie: {
      httpOnly: true, // Prevent client-side access for security
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
    name: 'codespace.sid', // Custom session name
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
    const dbUser = await mongoStorage.getUser(user.id);
    if (!dbUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    req.user = {
      ...dbUser,
      id: dbUser._id?.toString() || (dbUser as any).id
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Admin authentication middleware
export const isAdmin: RequestHandler = async (req, res, next) => {
  const user = (req as any).session?.user;

  if (!user || !user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify user exists in database and is admin
  try {
    const dbUser = await mongoStorage.getUser(user.id);
    if (!dbUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user is admin
    if (!dbUser.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    req.user = {
      ...dbUser,
      id: dbUser._id?.toString() || (dbUser as any).id
    };
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
      const { email, password, name } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check for admin credentials
      const isValidAdminLogin = email === 'aaryankumar13084@gmail.com' && password === 'hk1234';
      
      // Get existing user first to preserve admin status
      const existingUser = await mongoStorage.getUserByEmail(email);
      
      // Determine admin status: promote to admin only with valid credentials, preserve existing admin status otherwise
      let adminStatus;
      if (isValidAdminLogin) {
        adminStatus = true; // Promote to admin with valid credentials
      } else if (existingUser && existingUser.isAdmin) {
        adminStatus = true; // Preserve existing admin status
      } else {
        adminStatus = undefined; // Don't set admin status for new non-admin users
      }
      
      // Login or create user with secure admin status handling
      const userData: any = {
        email: email,
        firstName: name || email.split('@')[0],
        lastName: '',
        profileImageUrl: undefined
      };
      
      // Only set isAdmin if we have a valid reason to (promotion or preservation)
      if (adminStatus !== undefined) {
        userData.isAdmin = adminStatus;
      }
      
      const user = await mongoStorage.upsertUser(userData);

      // Store user in session
      (req as any).session.user = {
        id: user._id?.toString() || (user as any).id,
        email: user.email,
        firstName: user.firstName
      };
      
      // Save session explicitly for login
      await new Promise((resolve, reject) => {
        (req as any).session.save((err: any) => {
          if (err) reject(err);
          else resolve(null);
        });
      });

      res.json({
        message: "Login successful",
        user: {
          id: user._id?.toString() || (user as any).id,
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

      const user = await mongoStorage.getUser(sessionUser.id);
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
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Get existing user first to preserve admin status
      const existingUser = await mongoStorage.getUserByEmail(email);
      
      // Signup or get existing user - preserve admin status if exists
      const userData: any = {
        email: email,
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
        profileImageUrl: undefined
      };
      
      // Preserve existing admin status if user already exists
      if (existingUser && existingUser.isAdmin) {
        userData.isAdmin = true;
      }
      
      const user = await mongoStorage.upsertUser(userData);

      // Store user in session
      (req as any).session.user = {
        id: user._id?.toString() || (user as any).id,
        email: user.email,
        firstName: user.firstName
      };
      
      // Save session explicitly for signup
      await new Promise((resolve, reject) => {
        (req as any).session.save((err: any) => {
          if (err) reject(err);
          else resolve(null);
        });
      });

      res.json({
        message: "Signup successful",
        user: {
          id: user._id?.toString() || (user as any).id,
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