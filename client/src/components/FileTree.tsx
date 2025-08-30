import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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
  Edit2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { File as FileType } from "@shared/schema";

interface TreeNode {
  id: string;
  name: string;
  isFolder: boolean;
  children: TreeNode[];
  file: FileType;
}

interface FileTreeProps {
  files: FileType[];
  onFileClick: (fileId: string) => void;
  activeFileId: string | null;
  isReadOnly?: boolean;
}

export default function FileTree({ files, onFileClick, activeFileId, isReadOnly }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newItemParent, setNewItemParent] = useState<string | null>(null);
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file');
  const [newItemName, setNewItemName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Convert flat file list to tree structure
  const fileTree = useMemo(() => {
    const buildTree = (): TreeNode[] => {
      // Group files by path structure
      const pathMap = new Map<string, TreeNode>();
      
      // First, create all nodes
      files.forEach(file => {
        pathMap.set(file.id, {
          id: file.id,
          name: file.name,
          isFolder: file.isFolder,
          children: [],
          file: file
        });
      });

      // Build the tree structure
      const rootNodes: TreeNode[] = [];
      
      files.forEach(file => {
        const node = pathMap.get(file.id)!;
        
        if (!file.parentId || !pathMap.has(file.parentId)) {
          // Root level file/folder
          rootNodes.push(node);
        } else {
          // Child file/folder
          const parent = pathMap.get(file.parentId)!;
          parent.children.push(node);
        }
      });

      // Sort function
      const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.sort((a, b) => {
          // Folders first, then files
          if (a.isFolder !== b.isFolder) {
            return a.isFolder ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        }).map(node => ({
          ...node,
          children: sortNodes(node.children)
        }));
      };

      return sortNodes(rootNodes);
    };

    return buildTree();
  }, [files]);

  const createFileMutation = useMutation({
    mutationFn: async (data: { name: string; path: string; isFolder: boolean; parentId?: string }) => {
      const projectId = files[0]?.projectId;
      if (!projectId) throw new Error("Project ID not found");
      
      const response = await apiRequest("POST", `/api/projects/${projectId}/files`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setNewItemParent(null);
      setNewItemName("");
      toast({ title: "File created successfully" });
    },
    onError: (error) => {
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
      toast({
        title: "Error",
        description: "Failed to create file",
        variant: "destructive",
      });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await apiRequest("DELETE", `/api/files/${fileId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "File deleted successfully" });
    },
    onError: (error) => {
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
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
  });

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

  // Render a tree node recursively
  const renderTreeNode = (node: TreeNode, level: number = 0): JSX.Element => {
    const isExpanded = expandedFolders.has(node.id);
    const isActive = activeFileId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center hover:bg-ide-bg-tertiary px-2 py-1 rounded cursor-pointer group ${
            isActive ? 'bg-ide-bg-tertiary' : ''
          }`}
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => {
            if (node.isFolder) {
              toggleFolder(node.id);
            } else {
              onFileClick(node.id);
            }
          }}
          data-testid={`file-${node.name}`}
        >
          {node.isFolder && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-4 w-4 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          
          {!node.isFolder && <span className="w-4 mr-1" />}
          
          {getFileIcon(node.file)}
          
          <span className="text-sm ml-2 flex-1 truncate">{node.name}</span>
          
          {node.file.content !== undefined && node.file.content !== files.find(f => f.id === node.id)?.content && (
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
                <DropdownMenuItem
                  onClick={() => deleteFileMutation.mutate(node.id)}
                  className="text-ide-error hover:bg-ide-bg-tertiary"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* CRITICAL: Only render children if folder is expanded */}
        {node.isFolder && isExpanded && node.children.length > 0 && (
          <div className="folder-children">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
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
                setNewItemType('file');
                setNewItemParent(null);
                setNewItemName("");
              }}
              title="New File"
              data-testid="button-new-file"
            >
              <FilePlus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6"
              onClick={() => {
                setNewItemType('folder');
                setNewItemParent(null);
                setNewItemName("");
              }}
              title="New Folder"
              data-testid="button-new-folder"
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* File tree */}
      <div className="space-y-1">
        {fileTree.map(node => renderTreeNode(node))}
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
              onClick={() => {
                setNewItemType('file');
                setNewItemParent(null);
                setNewItemName("");
              }}
            >
              Create your first file
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
