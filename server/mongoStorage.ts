import {
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
} from "@shared/schema";
import { type IStorage, DatabaseStorage } from "./storage";

// MongoDB storage with fallback to DatabaseStorage when MongoDB is unavailable
export class MongoStorage implements IStorage {
  private fallbackStorage: DatabaseStorage;
  
  constructor() {
    this.fallbackStorage = new DatabaseStorage();
  }

  // Delegate all methods to fallback storage for now
  async getUser(id: string) { return this.fallbackStorage.getUser(id); }
  async upsertUser(userData: any) { return this.fallbackStorage.upsertUser(userData); }
  async getUserProjects(userId: string) { return this.fallbackStorage.getUserProjects(userId); }
  async getProject(id: string) { return this.fallbackStorage.getProject(id); }
  async createProject(projectData: any) { return this.fallbackStorage.createProject(projectData); }
  async updateProject(id: string, projectData: any) { return this.fallbackStorage.updateProject(id, projectData); }
  async deleteProject(id: string) { return this.fallbackStorage.deleteProject(id); }
  async getProjectFiles(projectId: string) { return this.fallbackStorage.getProjectFiles(projectId); }
  async getFile(id: string) { return this.fallbackStorage.getFile(id); }
  async createFile(fileData: any) { return this.fallbackStorage.createFile(fileData); }
  async updateFile(id: string, fileData: any) { return this.fallbackStorage.updateFile(id, fileData); }
  async deleteFile(id: string) { return this.fallbackStorage.deleteFile(id); }
  async getProjectAiConversations(projectId: string) { return this.fallbackStorage.getProjectAiConversations(projectId); }
  async createAiConversation(conversationData: any) { return this.fallbackStorage.createAiConversation(conversationData); }
  async updateAiConversation(id: string, conversationData: any) { return this.fallbackStorage.updateAiConversation(id, conversationData); }
  async deleteAiConversation(id: string) { return this.fallbackStorage.deleteAiConversation(id); }
  async getProjectCollaborators(projectId: string) { return this.fallbackStorage.getProjectCollaborators(projectId); }
  async addCollaborator(collaboratorData: any) { return this.fallbackStorage.addCollaborator(collaboratorData); }
  async removeCollaborator(projectId: string, userId: string) { return this.fallbackStorage.removeCollaborator(projectId, userId); }
}