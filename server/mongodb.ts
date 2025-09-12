import mongoose from 'mongoose';

// MongoDB connection setup
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Codeyogi:oqZhnpSgOGVyYvco@codeeditor.pmsiorb.mongodb.net/?retryWrites=true&w=majority&appName=Codeeditor";

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

// Connect to MongoDB
export const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  profileImageUrl: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // This creates createdAt and updatedAt automatically
});

// Project Schema
const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 255
  },
  description: {
    type: String,
    default: null
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'javascript',
    maxlength: 50
  },
  template: {
    type: String,
    default: 'react',
    maxlength: 100
  },
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// File Schema
const fileSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 255
  },
  path: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  isFolder: {
    type: Boolean,
    default: false
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
  },
  size: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// AI Conversation Schema
const aiConversationSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Session Schema for user sessions
const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  data: {
    type: Object,
    default: {}
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic cleanup
  }
}, {
  timestamps: true
});

// Coding Session Schema (for tracking active coding sessions)
const codingSessionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  filesModified: [{
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File'
    },
    changes: {
      type: Number,
      default: 0
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for better performance
// Email index is automatically created by unique: true constraint
projectSchema.index({ ownerId: 1, createdAt: -1 });
projectSchema.index({ 'collaborators.userId': 1 });
fileSchema.index({ projectId: 1, parentId: 1 });
aiConversationSchema.index({ projectId: 1, userId: 1 });
codingSessionSchema.index({ projectId: 1, userId: 1, createdAt: -1 });

// Export models
export const User = mongoose.model('User', userSchema);
export const Project = mongoose.model('Project', projectSchema);
export const File = mongoose.model('File', fileSchema);
export const AiConversation = mongoose.model('AiConversation', aiConversationSchema);
export const Session = mongoose.model('Session', sessionSchema);
export const CodingSession = mongoose.model('CodingSession', codingSessionSchema);

// Types for TypeScript
export interface IUser {
  _id?: mongoose.Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProject {
  _id?: mongoose.Types.ObjectId;
  id?: string; // Compatible with existing code
  name: string;
  description?: string | null;
  ownerId: mongoose.Types.ObjectId | string;
  isPublic?: boolean;
  language?: string;
  template?: string;
  collaborators?: any[];
  sharedWith?: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFile {
  _id?: mongoose.Types.ObjectId;
  id?: string; // Compatible with existing code
  projectId: mongoose.Types.ObjectId | string;
  name: string;
  path: string;
  content?: string | null;
  isFolder?: boolean;
  parentId?: mongoose.Types.ObjectId | string | null;
  size?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAiConversation {
  _id?: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
  }>;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICodingSession {
  _id?: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  filesModified?: any[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}