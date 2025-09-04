import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true, // Allow creating table if missing
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Use environment variable or generate a development secret
  const sessionSecret = process.env.SESSION_SECRET || 
    (isProduction ? (() => { throw new Error("SESSION_SECRET is required in production") })() : 
     'dev-session-secret-' + Math.random().toString(36).substring(2, 15));
  
  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction, // Only secure in production (HTTPS)
      maxAge: sessionTtl,
      sameSite: isProduction ? 'none' : 'lax',
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    try {
      const hostname = req.hostname || req.get('host') || 'localhost';
      console.log(`Login attempt for hostname: ${hostname}`);
      
      passport.authenticate(`replitauth:${hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Authentication setup error' });
    }
  });

  app.get("/api/callback", (req, res, next) => {
    try {
      const hostname = req.hostname || req.get('host') || 'localhost';
      console.log(`Callback for hostname: ${hostname}`);
      
      passport.authenticate(`replitauth:${hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/login-error",
        failureFlash: false
      })(req, res, (err: any) => {
        if (err) {
          console.error('Authentication callback error:', err);
          // In development, create a mock successful login
          if (process.env.NODE_ENV === 'development') {
            req.login({ 
              claims: {
                sub: 'dev-user-123',
                email: 'dev@example.com',
                first_name: 'Dev',
                last_name: 'User'
              },
              expires_at: Math.floor(Date.now() / 1000) + 3600
            }, () => {
              res.redirect('/');
            });
            return;
          }
          res.redirect('/login-error');
        }
      });
    } catch (error) {
      console.error('Callback error:', error);
      res.redirect('/login-error');
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      try {
        const hostname = req.hostname || req.get('host') || 'localhost';
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${hostname}`,
          }).href
        );
      } catch (error) {
        console.error('Logout error:', error);
        res.redirect('/');
      }
    });
  });
  
  // Add error route for failed logins
  app.get("/login-error", (req, res) => {
    if (process.env.NODE_ENV === 'development') {
      // In development, provide a simple bypass
      res.send(`
        <html>
          <body>
            <h2>Development Mode - Authentication Bypass</h2>
            <p>Authentication failed, but you can continue in development mode.</p>
            <button onclick="window.location.href='/'">Continue to App</button>
            <script>
              // Auto-redirect after 3 seconds
              setTimeout(() => {
                window.location.href = '/';
              }, 3000);
            </script>
          </body>
        </html>
      `);
    } else {
      res.status(401).json({ 
        message: "Authentication failed",
        error: "Please try logging in again",
        loginUrl: "/api/login"
      });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Skip auth in development mode for easier testing
  if (process.env.NODE_ENV === 'development') {
    // Create a mock user for development
    (req as any).user = {
      claims: {
        sub: 'dev-user-123',
        email: 'dev@example.com',
        first_name: 'Dev',
        last_name: 'User'
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };
    return next();
  }
  
  const user = req.user as any;

  if (!req.isAuthenticated() || !user || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
