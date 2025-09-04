# replit.md

## Overview

CodeSpace is a comprehensive browser-based integrated development environment (IDE) that combines code editing, AI assistance, and project management capabilities. The application enables developers to create, edit, and manage coding projects entirely within the browser, featuring real-time collaboration, AI-powered code generation, and seamless file management. Built as a full-stack web application, it provides an experience similar to desktop IDEs like VS Code but runs entirely in the browser.

## User Preferences

Preferred communication style: Simple, everyday language.
Data storage: MongoDB Atlas for important data storage with hardcoded connection.
Authentication: Simple email-based authentication system (fixed sign up/sign in errors).

## System Architecture

### Frontend Architecture
The client-side is built with React 18 and TypeScript, utilizing Vite for development and bundling. The application follows a component-based architecture with:

- **UI Framework**: Radix UI components with shadcn/ui design system for consistent, accessible interface elements
- **Styling**: Tailwind CSS with custom CSS variables for theming, including dark mode support optimized for IDE usage
- **State Management**: TanStack Query (React Query) for server state management and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Code Editor**: Monaco Editor integration for syntax highlighting and code editing features
- **Authentication Flow**: Protected routes with authentication state management

### Backend Architecture
The server is built with Node.js and Express, following RESTful API principles:

- **Framework**: Express.js with TypeScript for type safety
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: express-session with PostgreSQL storage for user sessions
- **Authentication**: Replit Auth integration using OpenID Connect for secure user authentication
- **API Structure**: Organized route handlers with middleware for authentication and error handling

### Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM:

- **User Management**: Stores user profiles, authentication data, and preferences
- **Project Structure**: Hierarchical file system with projects, files, and folders
- **Collaboration**: Project ownership and sharing capabilities
- **AI Conversations**: Persistent storage of AI assistant interactions per project
- **Session Storage**: Secure session management for authentication state

### Authentication and Authorization
Implements Replit's authentication system:

- **OpenID Connect**: Integration with Replit's identity provider for seamless authentication
- **Session-based Auth**: Server-side session management with PostgreSQL storage
- **Route Protection**: Middleware-based authentication checks for API endpoints
- **User Context**: Consistent user identity across the application

### External Dependencies

**Third-party Services:**
- **Google Gemini AI**: Integrated for code generation, explanation, and debugging assistance
- **Replit Auth**: OAuth-based authentication and user management
- **Neon Database**: PostgreSQL hosting with serverless capabilities

**Key Frontend Libraries:**
- **Monaco Editor**: Browser-based code editor with syntax highlighting
- **Radix UI**: Headless UI components for accessibility
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form state management and validation

**Key Backend Libraries:**
- **Drizzle ORM**: Type-safe database operations
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store
- **@neondatabase/serverless**: Database connection pooling

The architecture supports real-time code editing, project collaboration, AI-assisted development, and scalable file management while maintaining security and performance standards suitable for a production coding environment.