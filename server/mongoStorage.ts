import mongoose from 'mongoose';
import {
  User,
  Project,
  File,
  AiConversation,
  CodingSession,
  Session,
  type IUser,
  type IProject,
  type IFile,
  type IAiConversation,
  type ICodingSession,
  connectMongoDB
} from './mongodb';
import { nanoid } from 'nanoid';

// MongoDB-based storage implementation
export class MongoStorage {
  constructor() {
    this.init();
  }

  private async init() {
    try {
      await connectMongoDB();
      console.log('MongoDB storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MongoDB storage:', error);
    }
  }

  // User operations
  async getUser(id: string): Promise<IUser | undefined> {
    try {
      // Try to find by MongoDB _id first
      let user = await User.findById(id).lean();
      
      // If not found and id is not a valid ObjectId format, try to find by email or create
      if (!user && !id.match(/^[0-9a-fA-F]{24}$/)) {
        // This might be a legacy UUID, try to find user by email or other means
        // For now, return undefined and let the system handle it
        return undefined;
      }
      
      return user ? {
        ...user,
        id: user._id?.toString()
      } : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  // Helper method to get user by ID or create if needed
  async getUserByIdOrCreate(id: string): Promise<IUser> {
    try {
      // Try to find existing user
      let user = await User.findById(id).lean();
      
      if (!user && !id.match(/^[0-9a-fA-F]{24}$/)) {
        // If it's not a valid ObjectId (like a UUID), create a new user
        const newUser = new User({
          email: `user-${id}@temp.com`,
          firstName: 'User',
          lastName: id.substring(0, 8)
        });
        const savedUser = await newUser.save();
        return savedUser.toObject();
      }
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      console.error('Error getting or creating user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<IUser | undefined> {
    try {
      const user = await User.findOne({ email }).lean();
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async upsertUser(userData: Partial<IUser> & { email: string }): Promise<IUser> {
    try {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        // Update existing user - preserve critical security fields unless explicitly overriding
        const updateData: any = { ...userData, updatedAt: new Date() };
        
        // Security: Only allow isAdmin to be set if explicitly provided in userData
        // If isAdmin is not provided in userData, preserve existing value
        if (userData.isAdmin === undefined && existingUser.isAdmin) {
          updateData.isAdmin = existingUser.isAdmin;
        }
        
        const updatedUser = await User.findByIdAndUpdate(
          existingUser._id,
          updateData,
          { new: true }
        ).lean();
        return updatedUser!;
      } else {
        // Create new user
        const newUser = new User(userData);
        const savedUser = await newUser.save();
        return savedUser.toObject();
      }
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  // Project operations
  async getUserProjects(userId: string): Promise<IProject[]> {
    try {
      // Handle both ObjectId and UUID formats
      let objectId: mongoose.Types.ObjectId;
      
      if (userId.match(/^[0-9a-fA-F]{24}$/)) {
        objectId = new mongoose.Types.ObjectId(userId);
      } else {
        // This is likely a UUID, try to find the user first
        const user = await this.getUserByIdOrCreate(userId);
        objectId = user._id as mongoose.Types.ObjectId;
      }
      
      // Get projects owned by user
      const ownedProjects = await Project.find({ ownerId: objectId })
        .populate('ownerId', 'firstName lastName email')
        .sort({ updatedAt: -1 })
        .lean();

      // Get projects shared with user
      const sharedProjects = await Project.find({
        $or: [
          { 'collaborators.userId': objectId },
          { sharedWith: objectId }
        ]
      })
        .populate('ownerId', 'firstName lastName email')
        .sort({ updatedAt: -1 })
        .lean();

      // Combine and deduplicate
      const allProjects = [...ownedProjects, ...sharedProjects];
      const uniqueProjects = allProjects.filter((project, index, self) => 
        index === self.findIndex(p => p._id!.toString() === project._id!.toString())
      );

      // Add id field for compatibility
      return uniqueProjects.map(project => ({
        ...project,
        id: project._id?.toString()
      }));
    } catch (error) {
      console.error('Error getting user projects:', error);
      return [];
    }
  }

  async getProject(id: string): Promise<IProject | undefined> {
    try {
      const project = await Project.findById(id)
        .populate('ownerId', 'firstName lastName email')
        .populate('collaborators.userId', 'firstName lastName email')
        .lean();
      
      if (!project) return undefined;
      
      return {
        ...project,
        id: project._id?.toString()
      };
    } catch (error) {
      console.error('Error getting project:', error);
      return undefined;
    }
  }

  async createProject(projectData: any): Promise<IProject> {
    try {
      // Convert string IDs to ObjectIds if needed
      let processedData = { ...projectData };
      
      // Handle ownerId conversion - if it's a valid ObjectId string, convert it, otherwise create new one
      if (typeof projectData.ownerId === 'string') {
        try {
          // Try to convert if it's a valid 24-char hex string
          if (projectData.ownerId.match(/^[0-9a-fA-F]{24}$/)) {
            processedData.ownerId = new mongoose.Types.ObjectId(projectData.ownerId);
          } else {
            // If it's not a valid ObjectId format (like UUID), create a new ObjectId and store mapping
            const existingUser = await this.getUserByIdOrCreate(projectData.ownerId);
            processedData.ownerId = existingUser._id;
          }
        } catch (error) {
          // If conversion fails, create new ObjectId
          const existingUser = await this.getUserByIdOrCreate(projectData.ownerId);
          processedData.ownerId = existingUser._id;
        }
      }
      
      const newProject = new Project(processedData);
      const savedProject = await newProject.save();
      const result = savedProject.toObject();
      return {
        ...result,
        id: result._id?.toString() // Add id field for compatibility
      };
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async updateProject(id: string, data: Partial<IProject>): Promise<IProject | undefined> {
    try {
      const updatedProject = await Project.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true }
      )
        .populate('ownerId', 'firstName lastName email')
        .lean();
      return updatedProject || undefined;
    } catch (error) {
      console.error('Error updating project:', error);
      return undefined;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      // Delete all related files
      await File.deleteMany({ projectId: id });
      // Delete all related conversations
      await AiConversation.deleteMany({ projectId: id });
      // Delete all coding sessions
      await CodingSession.deleteMany({ projectId: id });
      // Delete the project
      await Project.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  // Project sharing operations
  async shareProject(projectId: string, userId: string, role: 'editor' | 'viewer' = 'viewer'): Promise<boolean> {
    try {
      const project = await Project.findById(projectId);
      if (!project) return false;

      const userObjectId = new mongoose.Types.ObjectId(userId);
      
      // Check if user is already a collaborator
      const existingCollaborator = project.collaborators?.find(
        (collab: any) => collab.userId.toString() === userId
      );

      if (existingCollaborator) {
        // Update existing collaborator role
        existingCollaborator.role = role;
      } else {
        // Add new collaborator
        if (!project.collaborators) project.collaborators = [];
        (project.collaborators as any).push({
          userId: userObjectId,
          role,
          addedAt: new Date()
        });

        // Also add to sharedWith array for quick lookup
        if (!project.sharedWith) project.sharedWith = [];
        if (!project.sharedWith.includes(userObjectId)) {
          project.sharedWith.push(userObjectId);
        }
      }

      await project.save();
      return true;
    } catch (error) {
      console.error('Error sharing project:', error);
      return false;
    }
  }

  async removeProjectAccess(projectId: string, userId: string): Promise<boolean> {
    try {
      const project = await Project.findById(projectId);
      if (!project) return false;

      // Remove from collaborators
      if (project.collaborators) {
        project.collaborators = project.collaborators.filter(
          (collab: any) => collab.userId.toString() !== userId
        );
      }

      // Remove from sharedWith
      if (project.sharedWith) {
        project.sharedWith = project.sharedWith.filter(
          id => id.toString() !== userId
        );
      }

      await project.save();
      return true;
    } catch (error) {
      console.error('Error removing project access:', error);
      return false;
    }
  }

  async getSharedProjects(userId: string): Promise<IProject[]> {
    try {
      const objectId = new mongoose.Types.ObjectId(userId);
      
      const sharedProjects = await Project.find({
        $or: [
          { 'collaborators.userId': objectId },
          { sharedWith: objectId }
        ]
      })
        .populate('ownerId', 'firstName lastName email')
        .sort({ updatedAt: -1 })
        .lean();

      return sharedProjects;
    } catch (error) {
      console.error('Error getting shared projects:', error);
      return [];
    }
  }

  // File operations
  async getProjectFiles(projectId: string): Promise<IFile[]> {
    try {
      const files = await File.find({ projectId })
        .sort({ name: 1 })
        .lean();
      
      // Add id field for compatibility
      return files.map(file => ({
        ...file,
        id: file._id?.toString()
      }));
    } catch (error) {
      console.error('Error getting project files:', error);
      return [];
    }
  }

  async getFile(id: string): Promise<IFile | undefined> {
    try {
      const file = await File.findById(id).lean();
      
      if (!file) return undefined;
      
      return {
        ...file,
        id: file._id?.toString()
      };
    } catch (error) {
      console.error('Error getting file:', error);
      return undefined;
    }
  }

  async createFile(fileData: any): Promise<IFile> {
    try {
      // Convert string IDs to ObjectIds if needed
      const processedData = {
        ...fileData,
        projectId: typeof fileData.projectId === 'string' ? 
          new mongoose.Types.ObjectId(fileData.projectId) : fileData.projectId,
        parentId: fileData.parentId && typeof fileData.parentId === 'string' ? 
          new mongoose.Types.ObjectId(fileData.parentId) : fileData.parentId,
        size: fileData.content ? fileData.content.length : 0
      };
      
      const newFile = new File(processedData);
      const savedFile = await newFile.save();
      const result = savedFile.toObject();
      return {
        ...result,
        id: result._id?.toString() // Add id field for compatibility
      };
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  }

  async updateFile(id: string, data: Partial<IFile>): Promise<IFile | undefined> {
    try {
      // Update file size if content is being updated
      if (data.content !== undefined) {
        data.size = data.content.length;
      }

      const updatedFile = await File.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();
      return updatedFile || undefined;
    } catch (error) {
      console.error('Error updating file:', error);
      return undefined;
    }
  }

  async deleteFile(id: string): Promise<void> {
    try {
      // Delete all child files recursively if it's a folder
      const file = await File.findById(id);
      if (file && file.isFolder) {
        const childFiles = await File.find({ parentId: id });
        for (const child of childFiles) {
          await this.deleteFile(child._id!.toString());
        }
      }
      
      await File.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // AI Conversation operations
  async getAiConversation(projectId: string, userId: string): Promise<IAiConversation | undefined> {
    try {
      const conversation = await AiConversation.findOne({ projectId, userId }).lean();
      return conversation || undefined;
    } catch (error) {
      console.error('Error getting AI conversation:', error);
      return undefined;
    }
  }

  async createAiConversation(conversationData: Omit<IAiConversation, '_id' | 'createdAt' | 'updatedAt'>): Promise<IAiConversation> {
    try {
      const newConversation = new AiConversation(conversationData);
      const savedConversation = await newConversation.save();
      return savedConversation.toObject();
    } catch (error) {
      console.error('Error creating AI conversation:', error);
      throw error;
    }
  }

  async updateAiConversation(id: string, data: Partial<IAiConversation>): Promise<IAiConversation | undefined> {
    try {
      const updatedConversation = await AiConversation.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();
      return updatedConversation || undefined;
    } catch (error) {
      console.error('Error updating AI conversation:', error);
      return undefined;
    }
  }

  // Collaboration operations - compatibility layer
  async getCollaboration(projectId: string, userId: string): Promise<any | undefined> {
    try {
      const project = await Project.findById(projectId);
      if (!project || !project.collaborators) return undefined;
      
      const collaboration = project.collaborators.find(
        (collab: any) => collab.userId.toString() === userId
      );
      
      return collaboration ? {
        id: collaboration._id?.toString(),
        projectId,
        userId,
        role: collaboration.role,
        createdAt: collaboration.addedAt
      } : undefined;
    } catch (error) {
      console.error('Error getting collaboration:', error);
      return undefined;
    }
  }

  async addCollaborator(collaborationData: any): Promise<any> {
    try {
      return await this.shareProject(
        collaborationData.projectId, 
        collaborationData.userId, 
        collaborationData.role || 'viewer'
      );
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw error;
    }
  }

  // Coding Session operations
  async createCodingSession(sessionData: Omit<ICodingSession, '_id' | 'createdAt' | 'updatedAt'>): Promise<ICodingSession> {
    try {
      const newSession = new CodingSession(sessionData);
      const savedSession = await newSession.save();
      return savedSession.toObject();
    } catch (error) {
      console.error('Error creating coding session:', error);
      throw error;
    }
  }

  async updateCodingSession(id: string, data: Partial<ICodingSession>): Promise<ICodingSession | undefined> {
    try {
      const updatedSession = await CodingSession.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();
      return updatedSession || undefined;
    } catch (error) {
      console.error('Error updating coding session:', error);
      return undefined;
    }
  }

  async getUserCodingSessions(userId: string, projectId?: string): Promise<ICodingSession[]> {
    try {
      const query: any = { userId };
      if (projectId) query.projectId = projectId;

      const sessions = await CodingSession.find(query)
        .sort({ createdAt: -1 })
        .lean();
      return sessions;
    } catch (error) {
      console.error('Error getting user coding sessions:', error);
      return [];
    }
  }

  // User preferences operations (missing methods)
  async getUserPreferences(userId: string): Promise<any | undefined> {
    try {
      // Return default preferences for now since we don't have a UserPreferences schema
      return {
        userId,
        theme: 'dark',
        sidebarState: true,
        preferences: {}
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return undefined;
    }
  }

  async upsertUserPreferences(preferencesData: any): Promise<any> {
    try {
      // For now, just return the data as-is since we don't have a UserPreferences schema
      return preferencesData;
    } catch (error) {
      console.error('Error upserting user preferences:', error);
      throw error;
    }
  }

  // Project data operations (missing methods)
  async getProjectData(projectId: string, userId: string, dataType: string): Promise<any | undefined> {
    try {
      // Return empty data for now since we don't have a ProjectData schema
      return {
        projectId,
        userId,
        dataType,
        data: {}
      };
    } catch (error) {
      console.error('Error getting project data:', error);
      return undefined;
    }
  }

  async upsertProjectData(projectDataInfo: any): Promise<any> {
    try {
      // For now, just return the data as-is since we don't have a ProjectData schema
      return projectDataInfo;
    } catch (error) {
      console.error('Error upserting project data:', error);
      throw error;
    }
  }

  // Admin operations
  async getAllUsers(): Promise<IUser[]> {
    try {
      const users = await User.find()
        .sort({ createdAt: -1 })
        .lean();
      
      return users.map(user => ({
        ...user,
        id: user._id?.toString()
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getAllProjects(): Promise<IProject[]> {
    try {
      const projects = await Project.find()
        .populate('ownerId', 'firstName lastName email')
        .sort({ updatedAt: -1 })
        .lean();
      
      return projects.map(project => ({
        ...project,
        id: project._id?.toString()
      }));
    } catch (error) {
      console.error('Error getting all projects:', error);
      return [];
    }
  }

  async updateUser(id: string, data: Partial<IUser>): Promise<IUser | undefined> {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      return updatedUser ? {
        ...updatedUser,
        id: updatedUser._id?.toString()
      } : undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }
}

// Export singleton instance
export const mongoStorage = new MongoStorage();

// Legacy compatibility exports
export type User = IUser;
export type Project = IProject;
export type FileType = IFile;
export type AiConversationType = IAiConversation;
export type CodingSessionType = ICodingSession;