import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Monaco from "@/components/Monaco";
import FileTree from "@/components/FileTree";
import AIAssistant from "@/components/AIAssistant";
import Terminal from "@/components/Terminal";
import EditorTabs from "@/components/EditorTabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Code, 
  Play, 
  Share, 
  Rocket, 
  Star, 
  Users,
  Settings,
  Terminal as TerminalIcon,
  Bug,
  FileText,
  AlertTriangle,
  Menu,
  X
} from "lucide-react";
import type { Project, File } from "@shared/schema";

export default function Editor() {
  const [, params] = useRoute("/editor/:projectId");
  const [, sharedParams] = useRoute("/shared/:projectId");
  const projectId = params?.projectId || sharedParams?.projectId;
  const isSharedView = !!sharedParams?.projectId;
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState("terminal");
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  
  // Query for project data
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: isSharedView ? ["/api/shared", projectId] : ["/api/projects", projectId],
    retry: false,
    enabled: !!projectId,
  });

  // Query for files
  const { data: files, isLoading: filesLoading } = useQuery<File[]>({
    queryKey: ["/api/projects", projectId, "files"],
    retry: false,
    enabled: !!projectId && !isSharedView,
  });

  const project = isSharedView ? projectData?.project : projectData;
  const projectFiles = isSharedView ? projectData?.files : files;

  // Set initial active file
  useEffect(() => {
    if (projectFiles && projectFiles.length > 0 && !activeFileId) {
      const mainFile = projectFiles.find((f: any) => f.name === "App.js") || projectFiles[0];
      setActiveFileId(mainFile.id);
      setOpenFiles([mainFile.id]);
    }
  }, [projectFiles, activeFileId]);

  // Handle unauthorized access
  const handleUnauthorizedError = (error: Error) => {
    if (isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return true;
    }
    return false;
  };

  const handleRunProject = () => {
    toast({
      title: "Running Project",
      description: "Starting development server...",
    });
  };

  const handleShareProject = () => {
    setIsShareDialogOpen(true);
  };

  const handleDeployProject = () => {
    toast({
      title: "Deploy Project",
      description: "Deployment feature coming soon!",
    });
  };

  const openFile = (fileId: string) => {
    if (!openFiles.includes(fileId)) {
      setOpenFiles([...openFiles, fileId]);
    }
    setActiveFileId(fileId);
  };

  const closeFile = (fileId: string) => {
    const newOpenFiles = openFiles.filter(id => id !== fileId);
    setOpenFiles(newOpenFiles);
    
    if (activeFileId === fileId) {
      setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
  };

  const getFileIcon = (fileName: string, isFolder: boolean) => {
    if (isFolder) return "📁";
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': case 'jsx': return "🟨";
      case 'ts': case 'tsx': return "🔷";
      case 'css': return "🎨";
      case 'html': return "🌐";
      case 'json': return "📋";
      case 'md': return "📝";
      case 'py': return "🐍";
      default: return "📄";
    }
  };

  if (projectLoading || filesLoading) {
    return (
      <div className="h-screen bg-ide-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-ide-text-secondary">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen bg-ide-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-ide-text-secondary mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => window.location.href = "/"} className="bg-primary hover:bg-primary/90">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const activeFile = projectFiles?.find((f: any) => f.id === activeFileId);

  return (
    <div className="h-screen bg-ide-bg-primary text-ide-text-primary flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <nav className="h-14 bg-ide-bg-secondary border-b border-ide-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">CodeSpace</span>
          </div>
          
          <div className="flex items-center space-x-3 ml-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm">{getFileIcon("", true)}</span>
              <span className="font-medium" data-testid="text-project-name">{project.name}</span>
              {!isSharedView && <Star className="h-3 w-3 text-yellow-400" />}
            </div>
            
            {!isSharedView && (
              <div className="flex items-center space-x-1">
                <Button 
                  size="sm" 
                  onClick={handleRunProject}
                  className="text-xs bg-green-600 hover:bg-green-700"
                  data-testid="button-run"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Run
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleShareProject}
                  className="text-xs bg-primary hover:bg-primary/90"
                  data-testid="button-share"
                >
                  <Share className="h-3 w-3 mr-1" />
                  Share
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleDeployProject}
                  className="text-xs bg-purple-600 hover:bg-purple-700"
                  data-testid="button-deploy"
                >
                  <Rocket className="h-3 w-3 mr-1" />
                  Deploy
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Collaboration indicators */}
          {!isSharedView && (
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-primary border-2 border-ide-bg-secondary flex items-center justify-center text-xs font-medium">
                  {user?.firstName?.[0] || "U"}
                </div>
              </div>
              <span className="text-xs text-ide-text-secondary">1 online</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
            className="p-2 hover:bg-ide-bg-tertiary"
            data-testid="button-toggle-ai"
          >
            <Settings className="h-4 w-4 text-purple-400" />
          </Button>

          {user && (
            <div className="flex items-center space-x-2">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName || "User"}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-medium">
                  {user.firstName?.[0] || user.email?.[0] || "U"}
                </div>
              )}
              <span className="text-sm font-medium" data-testid="text-user-name">
                {user.firstName || user.email?.split("@")[0] || "User"}
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${isSidebarCollapsed ? 'w-12' : 'w-64'} bg-ide-bg-secondary border-r border-ide-border flex flex-col transition-all duration-300`}>
          {!isSidebarCollapsed ? (
            <>
              <div className="p-3 border-b border-ide-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Explorer</h3>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSidebarCollapsed(true)}
                      className="p-1 h-6 w-6"
                      data-testid="button-collapse-sidebar"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <FileTree 
                files={projectFiles || []} 
                onFileClick={openFile}
                activeFileId={activeFileId}
                isReadOnly={isSharedView}
              />
            </>
          ) : (
            <div className="p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1 h-6 w-6"
                data-testid="button-expand-sidebar"
              >
                <Menu className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Bottom Panel Toggles */}
          {!isSidebarCollapsed && (
            <div className="border-t border-ide-border p-2 mt-auto">
              <div className="flex items-center justify-around">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveBottomTab("terminal");
                    setIsBottomPanelOpen(true);
                  }}
                  className="p-2 text-xs"
                  data-testid="button-terminal"
                >
                  <TerminalIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveBottomTab("problems");
                    setIsBottomPanelOpen(true);
                  }}
                  className="p-2 text-xs"
                  data-testid="button-problems"
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveBottomTab("output");
                    setIsBottomPanelOpen(true);
                  }}
                  className="p-2 text-xs"
                  data-testid="button-output"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveBottomTab("debug");
                    setIsBottomPanelOpen(true);
                  }}
                  className="p-2 text-xs"
                  data-testid="button-debug"
                >
                  <Bug className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          <EditorTabs
            files={projectFiles || []}
            openFileIds={openFiles}
            activeFileId={activeFileId}
            onFileClick={setActiveFileId}
            onFileClose={closeFile}
          />

          <div className="flex flex-1 overflow-hidden">
            <div className={`flex-1 ${isBottomPanelOpen ? 'h-3/5' : 'h-full'}`}>
              <Monaco
                file={activeFile}
                projectId={projectId!}
                isReadOnly={isSharedView}
              />
            </div>

            {isAIAssistantOpen && (
              <AIAssistant
                projectId={projectId!}
                onClose={() => setIsAIAssistantOpen(false)}
                activeFile={activeFile}
              />
            )}
          </div>

          {/* Bottom Panel */}
          {isBottomPanelOpen && (
            <div className="h-2/5 bg-ide-bg-secondary border-t border-ide-border flex flex-col">
              <div className="h-10 flex items-center border-b border-ide-border">
                <Button
                  variant={activeBottomTab === "terminal" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveBottomTab("terminal")}
                  className="px-4 py-2 text-sm rounded-none"
                  data-testid="tab-terminal"
                >
                  Terminal
                </Button>
                <Button
                  variant={activeBottomTab === "problems" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveBottomTab("problems")}
                  className="px-4 py-2 text-sm rounded-none"
                  data-testid="tab-problems"
                >
                  Problems (0)
                </Button>
                <Button
                  variant={activeBottomTab === "output" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveBottomTab("output")}
                  className="px-4 py-2 text-sm rounded-none"
                  data-testid="tab-output"
                >
                  Output
                </Button>
                <Button
                  variant={activeBottomTab === "debug" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveBottomTab("debug")}
                  className="px-4 py-2 text-sm rounded-none"
                  data-testid="tab-debug"
                >
                  Debug Console
                </Button>
                
                <div className="ml-auto pr-4 flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsBottomPanelOpen(false)}
                    className="p-1 text-xs"
                    data-testid="button-close-bottom-panel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {activeBottomTab === "terminal" && <Terminal projectId={projectId!} />}
                {activeBottomTab === "problems" && (
                  <div className="p-4 text-ide-text-secondary">
                    No problems detected.
                  </div>
                )}
                {activeBottomTab === "output" && (
                  <div className="p-4 text-ide-text-secondary">
                    Output console ready.
                  </div>
                )}
                {activeBottomTab === "debug" && (
                  <div className="p-4 text-ide-text-secondary">
                    Debug console ready.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="bg-ide-bg-secondary border-ide-border text-ide-text-primary">
          <DialogHeader>
            <DialogTitle>Share Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project Link</label>
              <div className="flex items-center space-x-2">
                <Input
                  value={`${window.location.origin}/shared/${projectId}`}
                  readOnly
                  className="bg-ide-bg-tertiary border-ide-border"
                  data-testid="input-share-link"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/shared/${projectId}`);
                    toast({ title: "Link copied to clipboard!" });
                  }}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="button-copy-link"
                >
                  Copy
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Access Level</label>
              <Select defaultValue="view">
                <SelectTrigger className="bg-ide-bg-tertiary border-ide-border" data-testid="select-access-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-ide-bg-secondary border-ide-border">
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="edit">Can Edit</SelectItem>
                  <SelectItem value="fork">Can Fork</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-3">
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => setIsShareDialogOpen(false)}
                data-testid="button-share-confirm"
              >
                Share Project
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsShareDialogOpen(false)}
                className="border-ide-border hover:bg-ide-bg-tertiary"
                data-testid="button-share-cancel"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
