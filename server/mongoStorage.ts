// Re-export the DatabaseStorage as the primary storage implementation
// This maintains compatibility while using PostgreSQL instead of MongoDB
export { DatabaseStorage as Storage, type IStorage } from './storage';
export {
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