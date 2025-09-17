import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Monaco from "../components/Monaco";
import FileTree from "../components/FileTree";
import AIAssistant from "../components/AIAssistant";
import Terminal from "../components/Terminal";
import EditorTabs from "../components/EditorTabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
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
  X,
  Folder,
  ChevronUp,
  ChevronDown,
  Monitor
} from "lucide-react";
import type { Project, File } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Editor() {
  const [, params] = useRoute("/editor/:projectId");
  const [, sharedParams] = useRoute("/shared/:projectId");
  const projectId = params?.projectId || sharedParams?.projectId;
  const isSharedView = !!sharedParams?.projectId;
  
  // Disable auth for shared views to prevent repeated 401 errors
  const { user, isAuthenticated } = useAuth(!isSharedView);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileFileTreeOpen, setIsMobileFileTreeOpen] = useState(false);
  const [isMobileTerminalOpen, setIsMobileTerminalOpen] = useState(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [isMobileAIOpen, setIsMobileAIOpen] = useState(false);
  const isMobile = useIsMobile();
  const [activeBottomTab, setActiveBottomTab] = useState("terminal");
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [lastSaveTime, setLastSaveTime] = useState(Date.now());
  
  // Auto-collapse sidebar on mobile but keep AI assistant functional
  useEffect(() => {
    if (isMobile) {
      if (!isSidebarCollapsed) {
        setIsSidebarCollapsed(true);
      }
      // On mobile, AI assistant will be shown in drawer instead of sidebar
      if (isAIAssistantOpen) {
        setIsAIAssistantOpen(false);
        setIsMobileAIOpen(true);
      }
    } else {
      // On desktop, close mobile AI drawer if open
      if (isMobileAIOpen) {
        setIsMobileAIOpen(false);
      }
    }
  }, [isMobile, isSidebarCollapsed, isAIAssistantOpen, isMobileAIOpen]);
  
  // Query for project data
  const { data: projectData, isLoading: projectLoading } = useQuery<any>({
    queryKey: isSharedView ? ["/api/shared", projectId] : ["/api/projects", projectId],
    retry: false,
    enabled: !!projectId,
  });

  // Query for files with optimized refresh settings for smooth coding
  const { data: files, isLoading: filesLoading } = useQuery<File[]>({
    queryKey: ["/api/projects", projectId, "files"],
    retry: false,
    enabled: !!projectId && !isSharedView,
    staleTime: 0, // Set to 0 for instant updates after file operations
    refetchOnWindowFocus: false, // Don't refresh on focus to avoid interruption while coding  
    refetchInterval: false, // Disable auto-refresh to prevent coding disruption - manual refresh when needed
  });

  const project = isSharedView ? projectData?.project : projectData;
  const projectFiles = isSharedView ? projectData?.files : files;

  // Mutation to make project public and get share URL
  const makeProjectPublicMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/make-public`);
      return await response.json();
    },
    onSuccess: (data) => {
      setShareUrl(data.shareUrl);
      // Invalidate project cache to update isPublic status
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "Project Shared",
        description: "Your project is now public and can be shared!",
      });
    },
    onError: (error) => {
      if (handleUnauthorizedError(error)) return;
      toast({
        title: "Error",
        description: "Failed to make project public. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const handleRunProject = async () => {
    try {
      // Call the smart run API to detect project language and get appropriate command
      const response = await apiRequest("POST", `/api/projects/${projectId}/run`);
      const runData = await response.json();
      
      if (runData.type === 'preview') {
        toast({
          title: "Opening Preview",
          description: runData.description,
        });
        if (isMobile) {
          // Show mobile preview drawer for web projects
          setIsMobilePreviewOpen(true);
        } else {
          // Show preview panel for web projects
          setActiveBottomTab("preview");
          setIsBottomPanelOpen(true);
        }
      } else if (runData.type === 'terminal') {
        toast({
          title: "Running Project",
          description: runData.description,
        });
        if (isMobile) {
          // Show mobile terminal drawer for Python/other projects
          setIsMobileTerminalOpen(true);
        } else {
          // Show terminal and auto-execute the command for Python/other projects
          setActiveBottomTab("terminal");
          setIsBottomPanelOpen(true);
        }
        
        // Auto-execute the detected command
        setTimeout(() => {
          // Find terminal component and execute command
          const terminalEvent = new CustomEvent('autoExecuteCommand', {
            detail: { command: runData.command, projectId }
          });
          window.dispatchEvent(terminalEvent);
        }, 500);
      }
    } catch (error) {
      toast({
        title: "Run Failed",
        description: "Failed to run project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareProject = () => {
    // If project is already public and we have a share URL, just open dialog
    if (project?.isPublic && shareUrl) {
      setIsShareDialogOpen(true);
    } else {
      // Make project public first, then open dialog
      if (projectId) {
        makeProjectPublicMutation.mutate(projectId);
        setIsShareDialogOpen(true);
      }
    }
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
    
    // Refresh files list when opening a file
    queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
  };

  const closeFile = (fileId: string) => {
    const newOpenFiles = openFiles.filter(id => id !== fileId);
    setOpenFiles(newOpenFiles);
    
    if (activeFileId === fileId) {
      setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
    
    // Refresh files list when closing a file
    queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
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
      <nav className="h-14 bg-ide-bg-secondary border-b border-ide-border flex items-center justify-between px-2 sm:px-4 flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg hidden sm:block">CodeSpace</span>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3 ml-2 sm:ml-6">
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
                  <Play className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Run</span>
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleShareProject}
                  className="text-xs bg-primary hover:bg-primary/90"
                  data-testid="button-share"
                >
                  <Share className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleDeployProject}
                  className="text-xs bg-purple-600 hover:bg-purple-700 hidden sm:flex"
                  data-testid="button-deploy"
                >
                  <Rocket className="h-3 w-3 mr-1" />
                  Deploy
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Collaboration indicators */}
          {!isSharedView && (
            <div className="flex items-center space-x-2 hidden md:flex">
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
            onClick={() => {
              if (isMobile) {
                setIsMobileAIOpen(!isMobileAIOpen);
              } else {
                setIsAIAssistantOpen(!isAIAssistantOpen);
              }
            }}
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
              <span className="text-sm font-medium hidden sm:block" data-testid="text-user-name">
                {user.firstName || user.email?.split("@")[0] || "User"}
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Toolbar */}
      {isMobile && (
        <div className="h-12 bg-ide-bg-secondary border-b border-ide-border flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Sheet open={isMobileFileTreeOpen} onOpenChange={setIsMobileFileTreeOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  data-testid="button-mobile-files"
                >
                  <Folder className="h-4 w-4" />
                  <span className="ml-1 text-xs">Files</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-ide-bg-secondary border-ide-border p-0">
                <SheetHeader className="p-3 border-b border-ide-border">
                  <SheetTitle className="text-sm font-medium">Explorer</SheetTitle>
                </SheetHeader>
                <FileTree 
                  files={projectFiles || []} 
                  onFileClick={(fileId) => {
                    openFile(fileId);
                    setIsMobileFileTreeOpen(false);
                  }}
                  activeFileId={activeFileId}
                  isReadOnly={isSharedView}
                  projectId={projectId!}
                />
              </SheetContent>
            </Sheet>

            <Drawer open={isMobileTerminalOpen} onOpenChange={setIsMobileTerminalOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  data-testid="button-mobile-terminal"
                >
                  <TerminalIcon className="h-4 w-4" />
                  <span className="ml-1 text-xs">Terminal</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[85vh] max-h-[85vh] bg-ide-bg-secondary border-ide-border">
                <DrawerHeader className="p-3 border-b border-ide-border">
                  <DrawerTitle className="text-sm font-medium">Terminal</DrawerTitle>
                </DrawerHeader>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <Terminal projectId={projectId!} />
                </div>
              </DrawerContent>
            </Drawer>

            <Drawer open={isMobilePreviewOpen} onOpenChange={setIsMobilePreviewOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  data-testid="button-mobile-preview"
                >
                  <Monitor className="h-4 w-4" />
                  <span className="ml-1 text-xs">Preview</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[70vh] bg-ide-bg-secondary border-ide-border">
                <DrawerHeader className="p-3 border-b border-ide-border">
                  <DrawerTitle className="text-sm font-medium flex items-center justify-between">
                    <span>Live Preview</span>
                    <Button
                      size="sm"
                      onClick={() => window.open(`/api/projects/${projectId}/preview-html`, '_blank')}
                      className="text-xs bg-blue-600 hover:bg-blue-700 touch-manipulation h-8"
                      data-testid="button-mobile-open-preview"
                    >
                      Open in Tab
                    </Button>
                  </DrawerTitle>
                </DrawerHeader>
                <div className="flex-1 bg-white overflow-hidden">
                  <iframe
                    key={lastSaveTime}
                    src={`/api/projects/${projectId}/preview-html?t=${Date.now()}`}
                    className="w-full h-full border-0"
                    title="Live Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </DrawerContent>
            </Drawer>

            {/* Mobile AI Assistant Drawer - controlled by toolbar button */}
            <Drawer open={isMobileAIOpen} onOpenChange={setIsMobileAIOpen}>
              <DrawerContent className="h-[80vh] max-h-[80vh] bg-ide-bg-secondary border-ide-border">
                <DrawerHeader className="p-3 border-b border-ide-border flex-shrink-0">
                  <DrawerTitle className="text-sm font-medium flex items-center">
                    <Settings className="h-4 w-4 text-purple-400 mr-2" />
                    AI Assistant
                  </DrawerTitle>
                </DrawerHeader>
                <div className="flex-1 min-h-0 w-full">
                  <AIAssistant
                    projectId={projectId!}
                    onClose={() => setIsMobileAIOpen(false)}
                    activeFile={activeFile}
                  />
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRunProject()}
              className="p-2"
              data-testid="button-mobile-run"
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsShareDialogOpen(true)}
              className="p-2"
              data-testid="button-mobile-share"
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        {!isMobile && (
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
                  projectId={projectId!}
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
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          <EditorTabs
            files={projectFiles || []}
            openFileIds={openFiles}
            activeFileId={activeFileId}
            onFileClick={openFile}
            onFileClose={closeFile}
          />

          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-hidden">
              <Monaco
                onSave={() => setLastSaveTime(Date.now())}
                file={activeFile}
                projectId={projectId!}
                isReadOnly={isSharedView}
              />
            </div>

            {isAIAssistantOpen && !isMobile && (
              <div className="w-96 h-full flex flex-col border-l border-ide-border bg-ide-bg-secondary">
                <AIAssistant
                  projectId={projectId!}
                  onClose={() => setIsAIAssistantOpen(false)}
                  activeFile={activeFile}
                />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Desktop Bottom Panel */}
      {!isMobile && isBottomPanelOpen && (
        <div className="flex-none h-2/5 bg-ide-bg-secondary border-t border-ide-border flex flex-col">
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
                <Button
                  variant={activeBottomTab === "preview" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveBottomTab("preview")}
                  className="px-4 py-2 text-sm rounded-none"
                  data-testid="tab-preview"
                >
                  Preview
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
                {/* Keep Terminal always mounted to preserve state, just control visibility */}
                <div className={activeBottomTab === "terminal" ? "block h-full" : "hidden"}>
                  <Terminal projectId={projectId!} />
                </div>
                
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
                {activeBottomTab === "preview" && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-2 bg-ide-bg-tertiary border-b border-ide-border">
                      <span className="text-sm text-ide-text-secondary">Live Preview</span>
                      <Button
                        size="sm"
                        onClick={() => window.open(`/api/projects/${projectId}/preview-html`, '_blank')}
                        className="text-xs bg-blue-600 hover:bg-blue-700"
                        data-testid="button-open-preview"
                      >
                        Open in New Tab
                      </Button>
                    </div>
                    <div className="flex-1 bg-white overflow-hidden">
                      <iframe
                        key={lastSaveTime} // Force refresh when file is saved
                        src={`/api/projects/${projectId}/preview-html?t=${Date.now()}`}
                        className="w-full h-full border-0"
                        title="Live Preview"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                  value={shareUrl || (project?.isPublic ? `${window.location.origin}/shared/${projectId}` : "Making project public...")}
                  readOnly
                  className="bg-ide-bg-tertiary border-ide-border"
                  data-testid="input-share-link"
                />
                <Button
                  onClick={() => {
                    const linkToCopy = shareUrl || `${window.location.origin}/shared/${projectId}`;
                    navigator.clipboard.writeText(linkToCopy);
                    toast({ title: "Link copied to clipboard!" });
                  }}
                  className="bg-primary hover:bg-primary/90"
                  disabled={makeProjectPublicMutation.isPending || !shareUrl}
                  data-testid="button-copy-link"
                >
                  {makeProjectPublicMutation.isPending ? "..." : "Copy"}
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
                onClick={() => {
                  if (!project?.isPublic && projectId) {
                    makeProjectPublicMutation.mutate(projectId);
                  } else {
                    setIsShareDialogOpen(false);
                  }
                }}
                disabled={makeProjectPublicMutation.isPending}
                data-testid="button-share-confirm"
              >
                {makeProjectPublicMutation.isPending ? "Making Public..." : (project?.isPublic ? "Done" : "Make Public & Share")}
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
