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
import { 
  UserModel, 
  ProjectModel, 
  FileModel, 
  AiConversationModel, 
  CollaboratorModel 
} from "./mongodb";
import { nanoid } from "nanoid";
import { type IStorage } from "./storage";

// MongoDB implementation of storage interface
export class MongoStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findById(id);
      if (!user) return undefined;
      
      return {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      console.error('MongoDB getUser failed:', error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const userId = userData.id || nanoid();
      
      const user = await UserModel.findByIdAndUpdate(
        userId,
        {
          $set: {
            email: userData.email || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            profileImageUrl: userData.profileImageUrl || null,
            updatedAt: new Date()
          }
        },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true 
        }
      );

      return {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      console.error('MongoDB upsertUser failed:', error);
      throw error;
    }
  }

  // Project operations
  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      const projects = await ProjectModel.find({ ownerId: userId })
        .sort({ updatedAt: -1 });
      
      return projects.map((p: any) => ({
        id: p._id,
        name: p.name,
        description: p.description,
        ownerId: p.ownerId,
        isPublic: p.isPublic,
        language: p.language,
        template: p.template,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));
    } catch (error) {
      console.error('MongoDB getUserProjects failed:', error);
      return [];
    }
  }

  async getProject(id: string): Promise<Project | undefined> {
    try {
      const project = await ProjectModel.findById(id);
      if (!project) return undefined;
      
      return {
        id: project._id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        isPublic: project.isPublic,
        language: project.language,
        template: project.template,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      };
    } catch (error) {
      console.error('MongoDB getProject failed:', error);
      return undefined;
    }
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    try {
      const projectId = nanoid();
      const project = new ProjectModel({
        _id: projectId,
        ...projectData
      });
      
      await project.save();
      
      return {
        id: project._id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        isPublic: project.isPublic,
        language: project.language,
        template: project.template,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      };
    } catch (error) {
      console.error('MongoDB createProject failed:', error);
      throw error;
    }
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project> {
    try {
      const project = await ProjectModel.findByIdAndUpdate(
        id,
        { $set: { ...data, updatedAt: new Date() } },
        { new: true }
      );
      
      if (!project) throw new Error('Project not found');
      
      return {
        id: project._id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        isPublic: project.isPublic,
        language: project.language,
        template: project.template,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      };
    } catch (error) {
      console.error('MongoDB updateProject failed:', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      // Delete all related data
      await Promise.all([
        FileModel.deleteMany({ projectId: id }),
        AiConversationModel.deleteMany({ projectId: id }),
        CollaboratorModel.deleteMany({ projectId: id }),
        ProjectModel.findByIdAndDelete(id)
      ]);
    } catch (error) {
      console.error('MongoDB deleteProject failed:', error);
      throw error;
    }
  }

  // File operations
  async getProjectFiles(projectId: string): Promise<File[]> {
    try {
      const files = await FileModel.find({ projectId }).sort({ name: 1 });
      
      return files.map((f: any) => ({
        id: f._id,
        projectId: f.projectId,
        name: f.name,
        path: f.path,
        content: f.content,
        isFolder: f.isFolder,
        parentId: f.parentId,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt
      }));
    } catch (error) {
      console.error('MongoDB getProjectFiles failed:', error);
      return [];
    }
  }

  async getFile(id: string): Promise<File | undefined> {
    try {
      const file = await FileModel.findById(id);
      if (!file) return undefined;
      
      return {
        id: file._id,
        projectId: file.projectId,
        name: file.name,
        path: file.path,
        content: file.content,
        isFolder: file.isFolder,
        parentId: file.parentId,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      };
    } catch (error) {
      console.error('MongoDB getFile failed:', error);
      return undefined;
    }
  }

  async createFile(fileData: InsertFile): Promise<File> {
    try {
      const fileId = nanoid();
      const file = new FileModel({
        _id: fileId,
        ...fileData
      });
      
      await file.save();
      
      return {
        id: file._id,
        projectId: file.projectId,
        name: file.name,
        path: file.path,
        content: file.content,
        isFolder: file.isFolder,
        parentId: file.parentId,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      };
    } catch (error) {
      console.error('MongoDB createFile failed:', error);
      throw error;
    }
  }

  async updateFile(id: string, data: Partial<InsertFile>): Promise<File> {
    try {
      const file = await FileModel.findByIdAndUpdate(
        id,
        { $set: { ...data, updatedAt: new Date() } },
        { new: true }
      );
      
      if (!file) throw new Error('File not found');
      
      return {
        id: file._id,
        projectId: file.projectId,
        name: file.name,
        path: file.path,
        content: file.content,
        isFolder: file.isFolder,
        parentId: file.parentId,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      };
    } catch (error) {
      console.error('MongoDB updateFile failed:', error);
      throw error;
    }
  }

  async deleteFile(id: string): Promise<void> {
    try {
      // Delete recursively for folders
      const file = await FileModel.findById(id);
      if (file?.isFolder) {
        const childFiles = await FileModel.find({ parentId: id });
        for (const child of childFiles) {
          await this.deleteFile(child._id);
        }
      }
      
      await FileModel.findByIdAndDelete(id);
    } catch (error) {
      console.error('MongoDB deleteFile failed:', error);
      throw error;
    }
  }

  // AI Conversation operations
  async getAiConversation(projectId: string, userId: string): Promise<AiConversation | undefined> {
    try {
      const conversation = await AiConversationModel.findOne({ projectId, userId });
      if (!conversation) return undefined;
      
      return {
        id: conversation._id,
        projectId: conversation.projectId,
        userId: conversation.userId,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      };
    } catch (error) {
      console.error('MongoDB getAiConversation failed:', error);
      return undefined;
    }
  }

  async createAiConversation(conversationData: InsertAiConversation): Promise<AiConversation> {
    try {
      const conversationId = nanoid();
      const conversation = new AiConversationModel({
        _id: conversationId,
        ...conversationData
      });
      
      await conversation.save();
      
      return {
        id: conversation._id,
        projectId: conversation.projectId,
        userId: conversation.userId,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      };
    } catch (error) {
      console.error('MongoDB createAiConversation failed:', error);
      throw error;
    }
  }

  async updateAiConversation(id: string, data: Partial<InsertAiConversation>): Promise<AiConversation> {
    try {
      const conversation = await AiConversationModel.findByIdAndUpdate(
        id,
        { $set: { ...data, updatedAt: new Date() } },
        { new: true }
      );
      
      if (!conversation) throw new Error('Conversation not found');
      
      return {
        id: conversation._id,
        projectId: conversation.projectId,
        userId: conversation.userId,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      };
    } catch (error) {
      console.error('MongoDB updateAiConversation failed:', error);
      throw error;
    }
  }

  // Collaboration operations
  async getCollaboration(projectId: string, userId: string): Promise<ProjectCollaborator | undefined> {
    try {
      const collaboration = await CollaboratorModel.findOne({ projectId, userId });
      if (!collaboration) return undefined;
      
      return {
        id: collaboration._id,
        projectId: collaboration.projectId,
        userId: collaboration.userId,
        role: collaboration.role,
        createdAt: collaboration.createdAt
      };
    } catch (error) {
      console.error('MongoDB getCollaboration failed:', error);
      return undefined;
    }
  }

  async addCollaborator(collaborationData: InsertProjectCollaborator): Promise<ProjectCollaborator> {
    try {
      const collaborationId = nanoid();
      const collaboration = new CollaboratorModel({
        _id: collaborationId,
        ...collaborationData
      });
      
      await collaboration.save();
      
      return {
        id: collaboration._id,
        projectId: collaboration.projectId,
        userId: collaboration.userId,
        role: collaboration.role,
        createdAt: collaboration.createdAt
      };
    } catch (error) {
      console.error('MongoDB addCollaborator failed:', error);
      throw error;
    }
  }
}