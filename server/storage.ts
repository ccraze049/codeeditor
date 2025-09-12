import {
  users,
  projects,
  files,
  aiConversations,
  projectCollaborators,
  userPreferences,
  projectData,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type File,
  type InsertFile,
  type AiConversation,
  type InsertAiConversation,
  type ProjectCollaborator,
  type InsertProjectCollaborator,
  type UserPreferences,
  type InsertUserPreferences,
  type ProjectData,
  type InsertProjectData,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// In-memory fallback store for when database is unavailable
let memoryStore = {
  users: new Map<string, User>(),
  projects: new Map<string, Project>(), 
  files: new Map<string, File>(),
  aiConversations: new Map<string, AiConversation>(),
  collaborations: new Map<string, ProjectCollaborator>()
};

// Helper function to create default entities with IDs
function withId<T extends Record<string, any>>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T {
  const now = new Date();
  return {
    ...data,
    id: nanoid(),
    createdAt: now,
    updatedAt: now
  } as unknown as T;
}

// Helper to get all memory projects for a user
function getMemoryProjectsForUser(userId: string): Project[] {
  return Array.from(memoryStore.projects.values()).filter(p => p.ownerId === userId);
}

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getUserProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // File operations
  getProjectFiles(projectId: string): Promise<File[]>;
  getFile(id: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: string, data: Partial<InsertFile>): Promise<File>;
  deleteFile(id: string): Promise<void>;
  
  // AI Conversation operations
  getAiConversation(projectId: string, userId: string): Promise<AiConversation | undefined>;
  createAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  updateAiConversation(id: string, data: Partial<InsertAiConversation>): Promise<AiConversation>;
  
  // Collaboration operations
  getCollaboration(projectId: string, userId: string): Promise<ProjectCollaborator | undefined>;
  addCollaborator(collaboration: InsertProjectCollaborator): Promise<ProjectCollaborator>;
  
  // User preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  
  // Project data operations (todos, notes, etc.)
  getProjectData(projectId: string, userId: string, dataType: string): Promise<ProjectData | undefined>;
  upsertProjectData(data: InsertProjectData): Promise<ProjectData>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Database getUser failed, using memory store:', error);
      return memoryStore.users.get(id);
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // First try to find existing user by email
      if (userData.email) {
        const [existingUser] = await db.select().from(users).where(eq(users.email, userData.email));
        if (existingUser) {
          // Update existing user
          const [updatedUser] = await db
            .update(users)
            .set({
              ...userData,
              updatedAt: new Date(),
            })
            .where(eq(users.email, userData.email))
            .returning();
          return updatedUser;
        }
      }
      
      // Create new user if doesn't exist
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    } catch (error) {
      console.error('Database upsertUser failed, using memory store:', error);
      
      // Check memory store for existing user by email
      if (userData.email) {
        const existingUser = Array.from(memoryStore.users.values()).find(u => u.email === userData.email);
        if (existingUser) {
          // Update existing user in memory
          const updatedUser = {
            ...existingUser,
            ...userData,
            updatedAt: new Date()
          };
          memoryStore.users.set(existingUser.id, updatedUser);
          return updatedUser;
        }
      }
      
      // Create new user in memory
      const userId = userData.id || nanoid();
      const resultUser: User = {
        id: userId,
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        profileImageUrl: userData.profileImageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryStore.users.set(userId, resultUser);
      return resultUser;
    }
  }

  // Project operations
  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      return await db
        .select()
        .from(projects)
        .where(eq(projects.ownerId, userId))
        .orderBy(desc(projects.updatedAt));
    } catch (error) {
      console.error('Database getUserProjects failed, using memory store:', error);
      
      // Get existing projects from memory store first
      const userProjects = getMemoryProjectsForUser(userId);
      
      // If no projects in memory, create sample projects
      if (userProjects.length === 0) {
        const sampleProjects: Project[] = [
          withId({
            name: "My First Project",
            description: "A sample React application",
            ownerId: userId,
            isPublic: false,
            language: "javascript",
            template: "react"
          }),
          withId({
            name: "Todo App",
            description: "A simple todo application with React",
            ownerId: userId,
            isPublic: true,
            language: "javascript",
            template: "react"
          })
        ];
        
        sampleProjects.forEach(project => {
          memoryStore.projects.set(project.id, project);
        });
        
        return sampleProjects;
      }
      
      // Return existing projects from memory store
      return userProjects.sort((a, b) => (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0));
    }
  }

  async getProject(id: string): Promise<Project | undefined> {
    try {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id));
      return project;
    } catch (error) {
      console.error('Database getProject failed, using memory store:', error);
      return memoryStore.projects.get(id);
    }
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    try {
      const [project] = await db
        .insert(projects)
        .values(projectData)
        .returning();
      return project;
    } catch (error) {
      console.error('Database createProject failed, using memory store:', error);
      
      const project: Project = withId({
        name: projectData.name,
        description: projectData.description || null,
        ownerId: projectData.ownerId,
        isPublic: projectData.isPublic || null,
        language: projectData.language || "javascript",
        template: projectData.template || "react"
      });
      memoryStore.projects.set(project.id, project);
      return project;
    }
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    // Delete all related files first
    await db.delete(files).where(eq(files.projectId, id));
    // Delete all related conversations
    await db.delete(aiConversations).where(eq(aiConversations.projectId, id));
    // Delete all collaborators
    await db.delete(projectCollaborators).where(eq(projectCollaborators.projectId, id));
    // Delete the project
    await db.delete(projects).where(eq(projects.id, id));
  }

  // File operations
  async getProjectFiles(projectId: string): Promise<File[]> {
    try {
      return await db
        .select()
        .from(files)
        .where(eq(files.projectId, projectId))
        .orderBy(files.name);
    } catch (error) {
      console.error('Database getProjectFiles failed, using memory store:', error);
      return Array.from(memoryStore.files.values()).filter(f => f.projectId === projectId);
    }
  }

  async getFile(id: string): Promise<File | undefined> {
    try {
      const [file] = await db
        .select()
        .from(files)
        .where(eq(files.id, id));
      return file;
    } catch (error) {
      console.error('Database getFile failed, using memory store:', error);
      return memoryStore.files.get(id);
    }
  }

  async createFile(fileData: InsertFile): Promise<File> {
    try {
      const [file] = await db
        .insert(files)
        .values(fileData)
        .returning();
      return file;
    } catch (error) {
      console.error('Database createFile failed, using memory store:', error);
      
      const file: File = withId({
        name: fileData.name,
        path: fileData.path,
        content: fileData.content || null,
        projectId: fileData.projectId,
        parentId: fileData.parentId || null,
        isFolder: fileData.isFolder || false
      });
      memoryStore.files.set(file.id, file);
      return file;
    }
  }

  async updateFile(id: string, data: Partial<InsertFile>): Promise<File> {
    try {
      const [file] = await db
        .update(files)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(files.id, id))
        .returning();
      return file;
    } catch (error) {
      console.error('Database updateFile failed, using memory store:', error);
      
      const existingFile = memoryStore.files.get(id);
      if (!existingFile) {
        throw new Error(`File with id ${id} not found in memory store`);
      }
      
      const updatedFile: File = {
        ...existingFile,
        ...data,
        updatedAt: new Date()
      };
      memoryStore.files.set(id, updatedFile);
      return updatedFile;
    }
  }

  async deleteFile(id: string): Promise<void> {
    try {
      // Delete all child files/folders recursively
      const childFiles = await db
        .select()
        .from(files)
        .where(eq(files.parentId, id));
      
      for (const child of childFiles) {
        await this.deleteFile(child.id);
      }
      
      // Delete the file itself
      await db.delete(files).where(eq(files.id, id));
    } catch (error) {
      console.error('Database deleteFile failed, using memory store:', error);
      
      // Delete all child files/folders recursively from memory store
      const allFiles = Array.from(memoryStore.files.values());
      const childFiles = allFiles.filter(f => f.parentId === id);
      
      for (const child of childFiles) {
        await this.deleteFile(child.id);
      }
      
      // Delete the file itself from memory store
      memoryStore.files.delete(id);
    }
  }

  // AI Conversation operations
  async getAiConversation(projectId: string, userId: string): Promise<AiConversation | undefined> {
    try {
      const [conversation] = await db
        .select()
        .from(aiConversations)
        .where(
          and(
            eq(aiConversations.projectId, projectId),
            eq(aiConversations.userId, userId)
          )
        );
      return conversation;
    } catch (error) {
      console.error('Database getAiConversation failed, using memory store:', error);
      return Array.from(memoryStore.aiConversations.values())
        .find(c => c.projectId === projectId && c.userId === userId);
    }
  }

  async createAiConversation(conversationData: InsertAiConversation): Promise<AiConversation> {
    try {
      const [conversation] = await db
        .insert(aiConversations)
        .values(conversationData)
        .returning();
      return conversation;
    } catch (error) {
      console.error('Database createAiConversation failed, using memory store:', error);
      
      const conversation: AiConversation = withId({
        projectId: conversationData.projectId,
        userId: conversationData.userId,
        messages: conversationData.messages || []
      });
      memoryStore.aiConversations.set(conversation.id, conversation);
      return conversation;
    }
  }

  async updateAiConversation(id: string, data: Partial<InsertAiConversation>): Promise<AiConversation> {
    try {
      const [conversation] = await db
        .update(aiConversations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(aiConversations.id, id))
        .returning();
      return conversation;
    } catch (error) {
      console.error('Database updateAiConversation failed, using memory store:', error);
      
      const existing = memoryStore.aiConversations.get(id);
      if (!existing) {
        throw new Error('Conversation not found');
      }
      
      const updated: AiConversation = {
        ...existing,
        ...data,
        updatedAt: new Date()
      };
      memoryStore.aiConversations.set(id, updated);
      return updated;
    }
  }

  // Collaboration operations
  async getCollaboration(projectId: string, userId: string): Promise<ProjectCollaborator | undefined> {
    const [collaboration] = await db
      .select()
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId)
        )
      );
    return collaboration;
  }

  async addCollaborator(collaborationData: InsertProjectCollaborator): Promise<ProjectCollaborator> {
    const [collaboration] = await db
      .insert(projectCollaborators)
      .values(collaborationData)
      .returning();
    return collaboration;
  }

  // User preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    try {
      const [preferences] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));
      return preferences;
    } catch (error) {
      console.error('Database getUserPreferences failed:', error);
      // Return default preferences if error
      return {
        id: '',
        userId,
        theme: 'dark',
        sidebarState: true,
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  async upsertUserPreferences(preferencesData: InsertUserPreferences): Promise<UserPreferences> {
    try {
      // Try to find existing preferences
      const [existing] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, preferencesData.userId));

      if (existing) {
        // Update existing preferences
        const [updated] = await db
          .update(userPreferences)
          .set({ ...preferencesData, updatedAt: new Date() })
          .where(eq(userPreferences.userId, preferencesData.userId))
          .returning();
        return updated;
      } else {
        // Create new preferences
        const [created] = await db
          .insert(userPreferences)
          .values(preferencesData)
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Database upsertUserPreferences failed:', error);
      throw error;
    }
  }

  // Project data operations (todos, notes, etc.)
  async getProjectData(projectId: string, userId: string, dataType: string): Promise<ProjectData | undefined> {
    try {
      const [data] = await db
        .select()
        .from(projectData)
        .where(
          and(
            eq(projectData.projectId, projectId),
            eq(projectData.userId, userId),
            eq(projectData.dataType, dataType)
          )
        );
      return data;
    } catch (error) {
      console.error('Database getProjectData failed:', error);
      return undefined;
    }
  }

  async upsertProjectData(data: InsertProjectData): Promise<ProjectData> {
    try {
      // Try to find existing data
      const [existing] = await db
        .select()
        .from(projectData)
        .where(
          and(
            eq(projectData.projectId, data.projectId),
            eq(projectData.userId, data.userId),
            eq(projectData.dataType, data.dataType)
          )
        );

      if (existing) {
        // Update existing data
        const [updated] = await db
          .update(projectData)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(projectData.id, existing.id))
          .returning();
        return updated;
      } else {
        // Create new data
        const [created] = await db
          .insert(projectData)
          .values(data)
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Database upsertProjectData failed:', error);
      throw error;
    }
  }
}

// Use PostgreSQL storage (DatabaseStorage) as the primary storage implementation
export const storage = new DatabaseStorage();
