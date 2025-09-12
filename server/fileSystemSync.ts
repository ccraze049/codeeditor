// File System Synchronization Utility
// Syncs actual filesystem files with database storage for accurate project representation

import fs from 'fs/promises';
import path from 'path';
import { mongoStorage } from './mongoStorage';
import type { File, InsertFile } from '@shared/schema';

export interface FileSystemSyncOptions {
  projectId: string;
  projectPath: string;
  includeNodeModules?: boolean;
  maxDepth?: number;
}

export interface SyncResult {
  filesAdded: number;
  filesUpdated: number;
  filesRemoved: number;
  errors: string[];
}

/**
 * Main file system synchronization class
 */
export class FileSystemSync {
  private readonly DEFAULT_MAX_DEPTH = 10;
  private readonly IGNORE_PATTERNS = [
    '.git',
    '.env',
    '.env.local', 
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    'dist',
    'build'
  ];

  /**
   * Sync filesystem files with database
   */
  async syncProjectFiles(options: FileSystemSyncOptions): Promise<SyncResult> {
    const result: SyncResult = {
      filesAdded: 0,
      filesUpdated: 0,
      filesRemoved: 0,
      errors: []
    };

    try {
      console.log(`Starting file sync for project ${options.projectId} at ${options.projectPath}`);
      
      // Check if project directory exists
      try {
        await fs.access(options.projectPath);
      } catch (error) {
        result.errors.push(`Project directory does not exist: ${options.projectPath}`);
        return result;
      }

      // Get current database files
      const dbFiles = await mongoStorage.getProjectFiles(options.projectId);
      const dbFileMap = new Map(dbFiles.map(f => [f.path, f]));

      // Scan filesystem with proper parent-child relationships
      const fsFiles = await this.scanDirectoryWithParents(
        options.projectPath,
        '/',
        0,
        options.maxDepth || this.DEFAULT_MAX_DEPTH,
        options.includeNodeModules || false,
        options.projectId,
        null // No parent for root level
      );

      // Process filesystem files in order (folders first, then files)
      const sortedFiles = this.sortFilesByDependency(fsFiles);
      const createdFileMap = new Map<string, string>(); // path -> id mapping

      for (const fsFile of sortedFiles) {
        try {
          const dbFile = dbFileMap.get(fsFile.path);
          
          if (!dbFile) {
            // File exists in filesystem but not in database - add it
            // Set parentId if this file has a parent
            if (fsFile.parentPath && createdFileMap.has(fsFile.parentPath)) {
              fsFile.parentId = createdFileMap.get(fsFile.parentPath);
            }
            
            const newFile = await mongoStorage.createFile(fsFile);
            createdFileMap.set(fsFile.path, newFile.id);
            result.filesAdded++;
            console.log(`Added file: ${fsFile.path} with parent: ${fsFile.parentPath || 'root'}`);
          } else {
            // File exists in both - check if content differs
            const needsUpdate = await this.shouldUpdateFile(dbFile, fsFile, options.projectPath);
            if (needsUpdate) {
              await mongoStorage.updateFile(dbFile.id, {
                content: fsFile.content
              });
              result.filesUpdated++;
              console.log(`Updated file: ${fsFile.path}`);
            }
            createdFileMap.set(fsFile.path, dbFile.id);
            // Remove from dbFileMap to track which files still exist
            dbFileMap.delete(fsFile.path);
          }
        } catch (error) {
          result.errors.push(`Error processing file ${fsFile.path}: ${error}`);
        }
      }

      // Remove files that exist in database but not in filesystem
      const dbFileEntries = Array.from(dbFileMap.entries());
      for (const [filePath, dbFile] of dbFileEntries) {
        try {
          if (!this.isIgnoredFile(filePath)) {
            await mongoStorage.deleteFile(dbFile.id);
            result.filesRemoved++;
            console.log(`Removed file: ${filePath}`);
          }
        } catch (error) {
          result.errors.push(`Error removing file ${filePath}: ${error}`);
        }
      }

      console.log(`File sync completed. Added: ${result.filesAdded}, Updated: ${result.filesUpdated}, Removed: ${result.filesRemoved}`);
      
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
    }

    return result;
  }

  /**
   * Scan directory recursively with parent-child relationships
   */
  private async scanDirectoryWithParents(
    fullPath: string, 
    relativePath: string, 
    depth: number, 
    maxDepth: number,
    includeNodeModules: boolean,
    projectId: string,
    parentPath: string | null
  ): Promise<Array<InsertFile & { parentPath?: string }>> {
    const files: Array<InsertFile & { parentPath?: string }> = [];

    if (depth > maxDepth) {
      return files;
    }

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(fullPath, entry.name);
        const entryRelativePath = path.posix.join(relativePath, entry.name);

        // Skip ignored files and patterns
        if (this.isIgnoredFile(entry.name)) {
          continue;
        }

        // Handle node_modules specially
        if (entry.name === 'node_modules') {
          // Always show node_modules folder if it exists, regardless of includeNodeModules flag
          files.push({
            projectId,
            name: entry.name,
            path: entryRelativePath,
            content: null,
            isFolder: true,
            parentPath
          });
          
          if (includeNodeModules) {
            // Only scan first level of node_modules for important files
            const nodeModulesFiles = await this.scanNodeModulesLimited(entryPath, entryRelativePath, projectId);
            files.push(...nodeModulesFiles.map(f => ({ ...f, parentPath: entryRelativePath })));
          }
          continue;
        }

        if (entry.isDirectory()) {
          // Add folder
          files.push({
            projectId,
            name: entry.name,
            path: entryRelativePath,
            content: null,
            isFolder: true,
            parentPath
          });

          // Recursively scan subdirectory
          const subFiles = await this.scanDirectoryWithParents(
            entryPath, 
            entryRelativePath, 
            depth + 1, 
            maxDepth, 
            includeNodeModules,
            projectId,
            entryRelativePath // This folder becomes the parent for its children
          );
          files.push(...subFiles);
        } else {
          // Add file with content
          try {
            const content = await this.readFileContent(entryPath, entry.name);
            files.push({
              projectId,
              name: entry.name,
              path: entryRelativePath,
              content,
              isFolder: false,
              parentPath
            });
          } catch (error) {
            console.warn(`Could not read file ${entryPath}:`, error);
            // Add file without content
            files.push({
              projectId,
              name: entry.name,
              path: entryRelativePath,
              content: null,
              isFolder: false,
              parentPath
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${fullPath}:`, error);
    }

    return files;
  }

  /**
   * Sort files by dependency order (folders first, then their children)
   */
  private sortFilesByDependency(files: Array<InsertFile & { parentPath?: string }>): Array<InsertFile & { parentPath?: string }> {
    const sorted: Array<InsertFile & { parentPath?: string }> = [];
    const processed = new Set<string>();
    
    // Helper function to add file and its dependencies
    const addFile = (file: InsertFile & { parentPath?: string }) => {
      if (processed.has(file.path)) {
        return;
      }
      
      // If this file has a parent, make sure parent is processed first
      if (file.parentPath && !processed.has(file.parentPath)) {
        const parent = files.find(f => f.path === file.parentPath);
        if (parent) {
          addFile(parent);
        }
      }
      
      sorted.push(file);
      processed.add(file.path);
    };
    
    // Process all folders first (in dependency order)
    files.filter(f => f.isFolder).forEach(addFile);
    
    // Then process all files (in dependency order)
    files.filter(f => !f.isFolder).forEach(addFile);
    
    return sorted;
  }

  /**
   * Scan directory recursively and return file information (legacy method)
   */
  private async scanDirectory(
    fullPath: string, 
    relativePath: string, 
    depth: number, 
    maxDepth: number,
    includeNodeModules: boolean,
    projectId: string
  ): Promise<InsertFile[]> {
    const files: InsertFile[] = [];

    if (depth > maxDepth) {
      return files;
    }

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(fullPath, entry.name);
        const entryRelativePath = path.posix.join(relativePath, entry.name);

        // Skip ignored files and patterns
        if (this.isIgnoredFile(entry.name)) {
          continue;
        }

        // Handle node_modules specially
        if (entry.name === 'node_modules') {
          // Always show node_modules folder if it exists, regardless of includeNodeModules flag
          files.push({
            projectId,
            name: entry.name,
            path: entryRelativePath,
            content: null,
            isFolder: true
          });
          
          if (includeNodeModules) {
            // Only scan first level of node_modules for important files
            const nodeModulesFiles = await this.scanNodeModulesLimited(entryPath, entryRelativePath, projectId);
            files.push(...nodeModulesFiles);
          }
          continue;
        }

        if (entry.isDirectory()) {
          // Add folder
          files.push({
            projectId,
            name: entry.name,
            path: entryRelativePath,
            content: null,
            isFolder: true
          });

          // Recursively scan subdirectory
          const subFiles = await this.scanDirectory(
            entryPath, 
            entryRelativePath, 
            depth + 1, 
            maxDepth, 
            includeNodeModules,
            projectId
          );
          files.push(...subFiles);
        } else {
          // Add file with content
          try {
            const content = await this.readFileContent(entryPath, entry.name);
            files.push({
              projectId,
              name: entry.name,
              path: entryRelativePath,
              content,
              isFolder: false
            });
          } catch (error) {
            console.warn(`Could not read file ${entryPath}:`, error);
            // Add file without content
            files.push({
              projectId,
              name: entry.name,
              path: entryRelativePath,
              content: null,
              isFolder: false
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${fullPath}:`, error);
    }

    return files;
  }

  /**
   * Scan node_modules with limited depth for performance
   */
  private async scanNodeModulesLimited(nodeModulesPath: string, relativePath: string, projectId: string): Promise<InsertFile[]> {
    const files: InsertFile[] = [];
    
    try {
      const packages = await fs.readdir(nodeModulesPath, { withFileTypes: true });
      
      // Limit to first 50 packages to avoid performance issues
      const limitedPackages = packages.slice(0, 50);
      
      for (const pkg of limitedPackages) {
        if (pkg.isDirectory()) {
          const pkgPath = path.posix.join(relativePath, pkg.name);
          files.push({
            projectId,
            name: pkg.name,
            path: pkgPath,
            content: null,
            isFolder: true
          });

          // Only include package.json from each package
          try {
            const packageJsonPath = path.join(nodeModulesPath, pkg.name, 'package.json');
            const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
            files.push({
              projectId,
              name: 'package.json',
              path: path.posix.join(pkgPath, 'package.json'),
              content: packageJsonContent,
              isFolder: false
            });
          } catch (error) {
            // package.json doesn't exist, skip
          }
        }
      }
    } catch (error) {
      console.warn(`Error scanning node_modules:`, error);
    }

    return files;
  }

  /**
   * Read file content with appropriate handling for different file types
   */
  private async readFileContent(filePath: string, fileName: string): Promise<string | null> {
    try {
      const stats = await fs.stat(filePath);
      
      // Skip very large files (>1MB)
      if (stats.size > 1024 * 1024) {
        return `[File too large to display: ${(stats.size / 1024 / 1024).toFixed(2)}MB]`;
      }

      // Check if file is binary
      if (this.isBinaryFile(fileName)) {
        return `[Binary file: ${fileName}]`;
      }

      // Read text content
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      return `[Error reading file: ${error}]`;
    }
  }

  /**
   * Check if file content should be updated
   */
  private async shouldUpdateFile(dbFile: File, fsFile: InsertFile, projectPath: string): Promise<boolean> {
    if (fsFile.isFolder) {
      return false; // Don't update folders
    }

    // For package.json, always update to ensure dependencies are current
    if (fsFile.path === '/package.json') {
      console.log('Package.json detected, forcing update to ensure dependencies are current');
      return true;
    }

    // If database has no content but filesystem does, update
    if (!dbFile.content && fsFile.content) {
      return true;
    }

    // If contents are different, update
    return dbFile.content !== fsFile.content;
  }

  /**
   * Check if file should be ignored
   */
  private isIgnoredFile(fileName: string): boolean {
    return this.IGNORE_PATTERNS.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(fileName);
      }
      return fileName === pattern;
    });
  }

  /**
   * Check if file is binary based on extension
   */
  private isBinaryFile(fileName: string): boolean {
    const binaryExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
      '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
      '.exe', '.dll', '.so', '.dylib',
      '.mp3', '.mp4', '.wav', '.avi', '.mov',
      '.ttf', '.otf', '.woff', '.woff2'
    ];
    
    const ext = path.extname(fileName).toLowerCase();
    return binaryExtensions.includes(ext);
  }

  /**
   * Sync a specific file immediately
   */
  async syncSingleFile(projectId: string, projectPath: string, filePath: string): Promise<void> {
    try {
      const fullPath = path.join(projectPath, filePath);
      const stats = await fs.stat(fullPath);
      
      if (stats.isFile()) {
        const content = await this.readFileContent(fullPath, path.basename(filePath));
        const fileName = path.basename(filePath);
        
        // Check if file exists in database
        const projectFiles = await mongoStorage.getProjectFiles(projectId);
        const existingFile = projectFiles.find(f => f.path === filePath);
        
        if (existingFile) {
          // Update existing file
          try {
            await mongoStorage.updateFile(existingFile.id, {
              content
            });
            console.log(`Synced file update: ${filePath}`);
          } catch (updateError) {
            console.error(`Failed to update file ${filePath} in database:`, updateError);
            // Force recreate if update fails
            try {
              await mongoStorage.deleteFile(existingFile.id);
              await mongoStorage.createFile({
                projectId,
                name: fileName,
                path: filePath,
                content,
                isFolder: false
              });
              console.log(`Recreated file after update failure: ${filePath}`);
            } catch (recreateError) {
              console.error(`Failed to recreate file ${filePath}:`, recreateError);
            }
          }
        } else {
          // Create new file
          try {
            await mongoStorage.createFile({
              projectId,
              name: fileName,
              path: filePath,
              content,
              isFolder: false
            });
            console.log(`Synced new file: ${filePath}`);
          } catch (createError) {
            console.error(`Failed to create file ${filePath} in database:`, createError);
          }
        }
      }
    } catch (error) {
      console.error(`Error syncing single file ${filePath}:`, error);
    }
  }
}

export const fileSystemSync = new FileSystemSync();