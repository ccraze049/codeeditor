import mongoose from 'mongoose';

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

// Connect to MongoDB Atlas
export async function connectMongoDB() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// MongoDB Models for CodeSpace IDE
const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  profileImageUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  ownerId: { type: String, required: true },
  isPublic: { type: Boolean, default: false },
  language: { type: String, default: 'javascript' },
  template: { type: String, default: 'react' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const fileSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, required: true },
  name: { type: String, required: true },
  path: { type: String, required: true },
  content: { type: String, default: '' },
  isFolder: { type: Boolean, default: false },
  parentId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const aiConversationSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, required: true },
  userId: { type: String, required: true },
  messages: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const collaboratorSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, required: true },
  userId: { type: String, required: true },
  role: { type: String, default: 'viewer' },
  createdAt: { type: Date, default: Date.now }
});

// Export models
export const UserModel = mongoose.model('User', userSchema);
export const ProjectModel = mongoose.model('Project', projectSchema);
export const FileModel = mongoose.model('File', fileSchema);
export const AiConversationModel = mongoose.model('AiConversation', aiConversationSchema);
export const CollaboratorModel = mongoose.model('Collaborator', collaboratorSchema);