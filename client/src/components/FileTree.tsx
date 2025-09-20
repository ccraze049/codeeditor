import { useState, useMemo, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  ChevronDown, 
  ChevronRight, 
  File, 
  Folder, 
  FolderOpen,
  FilePlus,
  FolderPlus,
  MoreHorizontal,
  Trash2,
  Edit2,
  RefreshCw
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { File as FileType } from "@shared/schema";


interface FileTreeProps {
  files: FileType[];
  onFileClick: (fileId: string) => void;
  activeFileId: string | null;
  isReadOnly?: boolean;
  projectId: string;
}

export default function FileTree({ files, onFileClick, activeFileId, isReadOnly, projectId }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newItemParent, setNewItemParent] = useState<string | null>(null);
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file');
  const [newItemName, setNewItemName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPressRef = useRef(false);


  const createFileMutation = useMutation({
    mutationFn: async (data: { name: string; path: string; isFolder: boolean; parentId?: string }) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/files`, data);
      return await response.json();
    },
    onMutate: async (newFileData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/projects", projectId, "files"] });
      
      // Snapshot the previous value
      const previousFiles = queryClient.getQueryData(["/api/projects", projectId, "files"]);
      
      // Optimistically update to the new value - using ObjectId compatible format
      const tempId = `000000000000000000000000`; // Temporary valid ObjectId format
      const optimisticFile = {
        id: tempId,
        projectId,
        name: newFileData.name,
        path: newFileData.path,
        content: newFileData.isFolder ? null : "",
        isFolder: newFileData.isFolder,
        parentId: newFileData.parentId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(["/api/projects", projectId, "files"], (old: any) => {
        return old ? [...old, optimisticFile] : [optimisticFile];
      });
      
      // Return context with the snapshot and temp ID
      return { previousFiles, tempId };
    },
    onSuccess: (serverFile, variables, context) => {
      // Replace temp file with server file before invalidation
      if (context?.tempId) {
        queryClient.setQueryData(["/api/projects", projectId, "files"], (old: any) => {
          if (!old) return [serverFile];
          return old.map((file: any) => file.id === context.tempId ? serverFile : file);
        });
      }
      setNewItemParent(null);
      setNewItemName("");
      setIsCreating(false);
      toast({ title: "File created successfully" });
    },
    onError: (error, newFileData, context) => {
      // Handle unauthorized errors first
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      // Rollback to previous state on error
      if (context?.previousFiles) {
        queryClient.setQueryData(["/api/projects", projectId, "files"], context.previousFiles);
      }
      
      toast({
        title: "Error",
        description: "Failed to create file",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refresh to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await apiRequest("DELETE", `/api/files/${fileId}`);
      return await response.json();
    },
    onMutate: async (fileId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/projects", projectId, "files"] });
      
      // Snapshot the previous value
      const previousFiles = queryClient.getQueryData(["/api/projects", projectId, "files"]);
      
      // Find the file being deleted to handle folder subtrees
      const fileToDelete = (previousFiles as any[])?.find(f => f.id === fileId);
      
      // Optimistically remove the file and its children from UI
      queryClient.setQueryData(["/api/projects", projectId, "files"], (old: any) => {
        if (!old) return [];
        
        // If deleting a folder, also remove all its children
        if (fileToDelete?.isFolder) {
          return old.filter((file: any) => 
            file.id !== fileId && !file.path.startsWith(fileToDelete.path + '/')
          );
        }
        
        return old.filter((file: any) => file.id !== fileId);
      });
      
      // Return context with the snapshot
      return { previousFiles };
    },
    onSuccess: () => {
      toast({ title: "File deleted successfully" });
    },
    onError: (error, fileId, context) => {
      // Handle unauthorized errors first
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      // Rollback to previous state on error
      if (context?.previousFiles) {
        queryClient.setQueryData(["/api/projects", projectId, "files"], context.previousFiles);
      }
      
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refresh to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const renameFileMutation = useMutation({
    mutationFn: async (data: { fileId: string; newName: string }) => {
      const response = await apiRequest("PUT", `/api/files/${data.fileId}/rename`, { 
        newName: data.newName 
      });
      return await response.json();
    },
    onMutate: async ({ fileId, newName }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/projects", projectId, "files"] });
      
      // Snapshot the previous value
      const previousFiles = queryClient.getQueryData(["/api/projects", projectId, "files"]);
      
      // Optimistically update the file name and path
      queryClient.setQueryData(["/api/projects", projectId, "files"], (old: any) => {
        if (!old) return [];
        
        return old.map((file: any) => {
          if (file.id === fileId) {
            const pathParts = file.path.split('/');
            pathParts[pathParts.length - 1] = newName;
            const newPath = pathParts.join('/');
            
            return {
              ...file,
              name: newName,
              path: newPath
            };
          }
          
          // If it's a folder being renamed, update child paths too
          const renamingFile = old.find((f: any) => f.id === fileId);
          if (renamingFile?.isFolder && file.path.startsWith(renamingFile.path + '/')) {
            const pathParts = renamingFile.path.split('/');
            pathParts[pathParts.length - 1] = newName;
            const newParentPath = pathParts.join('/');
            const updatedChildPath = file.path.replace(renamingFile.path + '/', newParentPath + '/');
            
            return {
              ...file,
              path: updatedChildPath
            };
          }
          
          return file;
        });
      });
      
      return { previousFiles };
    },
    onSuccess: () => {
      setRenamingFileId(null);
      setRenameValue("");
      toast({ title: "File renamed successfully" });
    },
    onError: (error, variables, context) => {
      // Handle unauthorized errors first
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      // Rollback to previous state on error
      if (context?.previousFiles) {
        queryClient.setQueryData(["/api/projects", projectId, "files"], context.previousFiles);
      }
      
      // Check for specific error messages
      let errorMessage = "Failed to rename file";
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refresh to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const handleCreateItem = async () => {
    if (!newItemName.trim()) return;
    
    const parentPath = newItemParent ? 
      files.find(f => f.id === newItemParent)?.path || "/" : 
      "/";
    
    const itemPath = parentPath === "/" ? 
      `/${newItemName}` : 
      `${parentPath}/${newItemName}`;
    
    createFileMutation.mutate({
      name: newItemName,
      path: itemPath,
      isFolder: newItemType === 'folder',
      parentId: newItemParent || undefined
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateItem();
    } else if (e.key === 'Escape') {
      setNewItemParent(null);
      setNewItemName("");
      setIsCreating(false);
    }
  };

  const startCreatingItem = (type: 'file' | 'folder', parentId?: string) => {
    setNewItemType(type);
    setNewItemParent(parentId || null);
    setNewItemName("");
    setIsCreating(true);
    
    // Expand parent folder if creating inside one
    if (parentId) {
      const newExpanded = new Set(expandedFolders);
      newExpanded.add(parentId);
      setExpandedFolders(newExpanded);
    }
  };

  const startRenaming = (fileId: string, currentName: string) => {
    setRenamingFileId(fileId);
    setRenameValue(currentName);
    // Cancel any ongoing creation
    setIsCreating(false);
    setNewItemParent(null);
    setNewItemName("");
  };

  const handleRename = () => {
    if (!renameValue.trim() || !renamingFileId) return;
    
    renameFileMutation.mutate({
      fileId: renamingFileId,
      newName: renameValue.trim()
    });
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setRenamingFileId(null);
      setRenameValue("");
    }
  };

  const cancelRename = () => {
    setRenamingFileId(null);
    setRenameValue("");
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Mobile long-press functionality for file renaming (files only)
  const handleTouchStart = (fileId: string, fileName: string, isFolder: boolean) => {
    if (!isMobile || isReadOnly || isFolder) return; // Only files, not folders
    
    wasLongPressRef.current = false;
    longPressTimer.current = setTimeout(() => {
      wasLongPressRef.current = true;
      startRenaming(fileId, fileName);
    }, 500); // 500ms long press
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // Prevent ghost click if long press occurred
    if (wasLongPressRef.current) {
      e.preventDefault();
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const toggleFolder = (fileId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (file: FileType) => {
    if (file.isFolder) {
      return expandedFolders.has(file.id) ? (
        <FolderOpen className="h-4 w-4 text-ide-warning" />
      ) : (
        <Folder className="h-4 w-4 text-ide-warning" />
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return <div className="h-4 w-4 text-ide-yellow">🟨</div>;
      case 'ts':
      case 'tsx':
        return <div className="h-4 w-4 text-ide-blue">🔷</div>;
      case 'css':
        return <div className="h-4 w-4 text-ide-blue">🎨</div>;
      case 'html':
        return <div className="h-4 w-4 text-ide-orange">🌐</div>;
      case 'json':
        return <div className="h-4 w-4 text-ide-text-secondary">📋</div>;
      case 'md':
        return <div className="h-4 w-4 text-ide-text-secondary">📝</div>;
      case 'py':
        return <div className="h-4 w-4 text-ide-green">🐍</div>;
      default:
        return <File className="h-4 w-4 text-ide-text-secondary" />;
    }
  };

  // Build file tree with proper folder structure and collapse functionality
  const buildFileTree = () => {
    // Type-safe file structure
    interface FileTreeNode extends FileType {
      children: FileTreeNode[];
    }
    
    // If files don't have proper parentId relationships, build them from path structure
    const fileMap = new Map<string, FileTreeNode>();
    const rootFiles: FileTreeNode[] = [];
    const pathToFileMap = new Map<string, FileTreeNode>();

    // First, create all file nodes
    files.forEach(file => {
      const node: FileTreeNode = { ...file, children: [] };
      fileMap.set(file.id, node);
      pathToFileMap.set(file.path, node);
    });

    // Build parent-child relationships using path structure as fallback
    files.forEach(file => {
      const fileObj = fileMap.get(file.id);
      if (!fileObj) return;
      
      // Check if we have a proper parentId relationship
      if (file.parentId && fileMap.has(file.parentId)) {
        const parent = fileMap.get(file.parentId);
        if (parent && !parent.children.find(c => c.id === file.id)) {
          parent.children.push(fileObj);
        }
      } else {
        // Fallback: build relationships from path structure
        const pathParts = file.path.split('/').filter(Boolean);
        
        if (pathParts.length === 1) {
          // Root level file
          if (!rootFiles.find(f => f.id === file.id)) {
            rootFiles.push(fileObj);
          }
        } else {
          // Find parent by path
          const parentPath = '/' + pathParts.slice(0, -1).join('/');
          const parent = pathToFileMap.get(parentPath);
          
          if (parent && parent.isFolder && !parent.children.find(c => c.id === file.id)) {
            parent.children.push(fileObj);
          } else {
            // If no parent folder found, add to root
            if (!rootFiles.find(f => f.id === file.id)) {
              rootFiles.push(fileObj);
            }
          }
        }
      }
    });

    // For files that weren't added to any parent due to missing relationships, add to root
    files.forEach(file => {
      const fileObj = fileMap.get(file.id);
      if (!fileObj) return;
      
      const isInRoot = rootFiles.find(f => f.id === file.id);
      const hasParent = Array.from(fileMap.values()).some(parent => 
        parent.isFolder && parent.children.find((c: FileTreeNode) => c.id === file.id)
      );
      
      if (!isInRoot && !hasParent) {
        rootFiles.push(fileObj);
      }
    });

    // Sort function for files
    const sortFiles = (fileList: FileTreeNode[]): FileTreeNode[] => {
      return fileList.sort((a, b) => {
        // Folders first, then files
        if (a.isFolder !== b.isFolder) {
          return a.isFolder ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    };

    // Recursive function to render each file/folder
    const renderFile = (file: FileTreeNode, level = 0): React.ReactNode => {
      const isExpanded = expandedFolders.has(file.id);
      const isActive = activeFileId === file.id;

      return (
        <div key={file.id} className="select-none">
          <div
            className={`flex items-center hover:bg-ide-bg-tertiary px-2 py-1 rounded cursor-pointer group ${
              isActive ? 'bg-ide-bg-tertiary' : ''
            }`}
            style={{ 
              paddingLeft: `${8 + level * 16}px`,
              touchAction: isMobile ? 'manipulation' : 'auto'
            }}
            onClick={() => {
              // Suppress ghost click after long press
              if (wasLongPressRef.current) {
                wasLongPressRef.current = false;
                return;
              }
              if (file.isFolder) {
                toggleFolder(file.id);
              } else if (file.id !== '000000000000000000000000') {
                // Don't allow clicking on temporary files during creation
                onFileClick(file.id);
              }
            }}
            onTouchStart={() => handleTouchStart(file.id, file.name, file.isFolder)}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            data-testid={`file-${file.name}`}
          >
            {file.isFolder && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-4 w-4 mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(file.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
            
            {!file.isFolder && <span className="w-4 mr-1" />}
            
            {getFileIcon(file)}
            
            {renamingFileId === file.id ? (
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={cancelRename}
                onClick={(e) => e.stopPropagation()}
                className="h-6 text-sm ml-2 flex-1 bg-ide-bg-primary border-ide-border focus:border-primary"
                autoFocus
                data-testid={`input-rename-${file.id}`}
              />
            ) : (
              <span className="text-sm ml-2 flex-1 truncate">{file.name}</span>
            )}
            
            {file.content !== undefined && file.content !== files.find(f => f.id === file.id)?.content && (
              <div className="w-2 h-2 bg-ide-warning rounded-full ml-2" title="Unsaved changes" />
            )}

            {!isReadOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-4 w-4 ml-1 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-ide-bg-secondary border-ide-border">
                  {file.isFolder && (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          startCreatingItem('file', file.id);
                        }}
                        className="hover:bg-ide-bg-tertiary"
                      >
                        <FilePlus className="h-3 w-3 mr-2" />
                        New File
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          startCreatingItem('folder', file.id);
                        }}
                        className="hover:bg-ide-bg-tertiary"
                      >
                        <FolderPlus className="h-3 w-3 mr-2" />
                        New Folder
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      startRenaming(file.id, file.name);
                    }}
                    className="hover:bg-ide-bg-tertiary"
                  >
                    <Edit2 className="h-3 w-3 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFileMutation.mutate(file.id);
                    }}
                    className="text-ide-error hover:bg-ide-bg-tertiary"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* CRITICAL: Only render children when folder is expanded and has children */}
          {file.isFolder && isExpanded && file.children.length > 0 && (
            <div className="folder-children">
              {sortFiles(file.children).map((child: FileTreeNode) => renderFile(child, level + 1))}
            </div>
          )}
        </div>
      );
    };

    return sortFiles(rootFiles).map((file: FileTreeNode) => renderFile(file));
  };

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {/* Action buttons */}
      {!isReadOnly && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-ide-text-secondary">FILES</span>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
              }}
              title="Refresh Files"
              data-testid="button-refresh-files"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6"
              onClick={() => startCreatingItem('file')}
              title="New File"
              data-testid="button-new-file"
            >
              <FilePlus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6"
              onClick={() => startCreatingItem('folder')}
              title="New Folder"
              data-testid="button-new-folder"
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* New item input field */}
      {isCreating && (
        <div className="mb-2 px-2 py-1 bg-ide-bg-tertiary rounded border border-ide-border">
          <div className="text-xs text-ide-text-secondary mb-1">
            {newItemType === 'file' ? 'New File' : 'New Folder'}
            {newItemParent && (
              <span className="text-ide-text-tertiary">
                {' in ' + files.find(f => f.id === newItemParent)?.name}
              </span>
            )}
          </div>
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Enter ${newItemType} name...`}
            className="h-7 text-sm bg-ide-bg-primary border-ide-border focus:border-primary"
            autoFocus
            data-testid="input-new-item-name"
          />
          <div className="flex justify-end space-x-1 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => {
                setNewItemParent(null);
                setNewItemName("");
                setIsCreating(false);
              }}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-6 px-2 text-xs bg-primary hover:bg-primary/90"
              onClick={handleCreateItem}
              disabled={!newItemName.trim()}
              data-testid="button-confirm-create"
            >
              Create
            </Button>
          </div>
        </div>
      )}

      {/* File tree */}
      <div className="space-y-1">
        {buildFileTree()}
      </div>

      {files.length === 0 && (
        <div className="text-center py-8 text-ide-text-secondary">
          <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No files yet</p>
          {!isReadOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs"
              onClick={() => startCreatingItem('file')}
            >
              Create your first file
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
