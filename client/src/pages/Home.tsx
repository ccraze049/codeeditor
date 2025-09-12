import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Code, Plus, Star, Users, Calendar, Settings, LogOut, Folder, Globe, Bot, Sparkles } from "lucide-react";
import type { Project } from "@shared/schema";
import AIProjectCreator from "@/components/AIProjectCreator";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    language: "javascript",
    template: "react",
  });

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    retry: false,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: typeof newProject) => {
      const response = await apiRequest("POST", "/api/projects", projectData);
      return await response.json();
    },
    onSuccess: (project) => {
      toast({
        title: "Project Created",
        description: `${project.name} has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
      setNewProject({
        name: "",
        description: "",
        language: "javascript",
        template: "react",
      });
      // Navigate to the editor
      window.location.href = `/editor/${project.id}`;
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
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  const getLanguageIcon = (language: string) => {
    switch (language) {
      case "javascript":
        return "🟨";
      case "typescript":
        return "🔷";
      case "python":
        return "🐍";
      case "java":
        return "☕";
      case "cpp":
        return "⚡";
      default:
        return "📄";
    }
  };

  return (
    <div className="min-h-screen bg-ide-bg-primary text-ide-text-primary" style={{paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)"}}>
      {/* Header */}
      <header className="h-14 bg-ide-bg-secondary border-b border-ide-border flex items-center justify-between px-2 sm:px-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Code className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">CodeSpace</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            variant="outline"
            size="sm"
            className="border-ide-border hover:bg-ide-bg-tertiary hidden sm:flex"
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
          
          {/* Mobile Settings Button */}
          <Button
            variant="outline"
            size="sm"
            className="border-ide-border hover:bg-ide-bg-tertiary sm:hidden p-2"
            aria-label="Settings"
            data-testid="button-settings-mobile"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-2">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.firstName || "User"}
                className="w-8 h-8 rounded-full object-cover"
                data-testid="img-user-avatar"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium">
                {user?.firstName?.[0] || user?.email?.[0] || "U"}
              </div>
            )}
            <span className="text-sm font-medium hidden sm:block" data-testid="text-user-name">
              {user?.firstName || user?.email?.split("@")[0] || "User"}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = "/api/logout"}
            className="hover:bg-ide-bg-tertiary"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 pb-20 sm:pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-welcome-title">
            Welcome back, {user?.firstName || "Developer"}!
          </h1>
          <p className="text-ide-text-secondary" data-testid="text-welcome-subtitle">
            Continue working on your projects or create something new with AI assistance.
          </p>
          
          {/* AI Feature Highlight */}
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-800 dark:text-purple-200">AI-Powered Development</span>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Describe your project idea and let AI generate complete code, styling, and project structure for you instantly.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* AI Project Creator */}
            <AIProjectCreator onProjectCreated={(projectId) => {
              // Refresh projects and navigate to editor
              queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
              window.location.href = `/editor/${projectId}`;
            }} />
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" data-testid="button-create-project">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-ide-bg-secondary border-ide-border text-ide-text-primary max-w-[85vw] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto ml-px mr-4 mt-4 mb-4 sm:m-0 rounded-xl shadow-xl">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      placeholder="my-awesome-project"
                      className="bg-ide-bg-tertiary border-ide-border"
                      data-testid="input-project-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="What does your project do?"
                      className="bg-ide-bg-tertiary border-ide-border"
                      data-testid="input-project-description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template">Template</Label>
                    <Select 
                      value={newProject.template} 
                      onValueChange={(value) => setNewProject({ ...newProject, template: value })}
                    >
                      <SelectTrigger className="bg-ide-bg-tertiary border-ide-border" data-testid="select-template">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-ide-bg-secondary border-ide-border">
                        <SelectItem value="react">React App</SelectItem>
                        <SelectItem value="node">Node.js</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="vanilla">Vanilla JavaScript</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Primary Language</Label>
                    <Select 
                      value={newProject.language} 
                      onValueChange={(value) => setNewProject({ ...newProject, language: value })}
                    >
                      <SelectTrigger className="bg-ide-bg-tertiary border-ide-border" data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-ide-bg-secondary border-ide-border">
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={() => createProjectMutation.mutate(newProject)}
                      disabled={!newProject.name || createProjectMutation.isPending}
                      className="flex-1 bg-primary hover:bg-primary/90"
                      data-testid="button-create-project-submit"
                    >
                      {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="border-ide-border hover:bg-ide-bg-tertiary"
                      data-testid="button-cancel-create"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="border-ide-border hover:bg-ide-bg-secondary" data-testid="button-import-project">
              <Folder className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Import Project</span>
              <span className="sm:hidden">Import</span>
            </Button>
            
            <Button variant="outline" className="border-ide-border hover:bg-ide-bg-secondary" data-testid="button-explore-public">
              <Globe className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Explore Public Projects</span>
              <span className="sm:hidden">Explore</span>
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold" data-testid="text-projects-title">Your Projects</h2>
            {projects && projects.length > 0 && (
              <p className="text-sm text-ide-text-secondary" data-testid="text-project-count">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-ide-bg-secondary border-ide-border">
                  <CardHeader className="space-y-3">
                    <div className="h-4 bg-ide-bg-tertiary rounded animate-pulse"></div>
                    <div className="h-3 bg-ide-bg-tertiary rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-ide-bg-tertiary rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {projects.map((project) => (
                <Link key={project.id} href={`/editor/${project.id}`} className="block group">
                  <Card 
                    className="bg-ide-bg-secondary border-ide-border hover:border-primary/50 transition-colors cursor-pointer"
                    data-testid={`card-project-${project.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg" role="img" aria-label={project.language || "javascript"}>
                            {getLanguageIcon(project.language || "javascript")}
                          </span>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors" data-testid={`text-project-name-${project.id}`}>
                            {project.name}
                          </CardTitle>
                        </div>
                        {project.isPublic && (
                          <Globe className="h-4 w-4 text-ide-text-secondary" />
                        )}
                      </div>
                      {project.description && (
                        <p className="text-sm text-ide-text-secondary line-clamp-2" data-testid={`text-project-description-${project.id}`}>
                          {project.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-ide-text-secondary">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(project.updatedAt?.toString())}
                          </span>
                          <span className="capitalize bg-ide-bg-tertiary px-2 py-1 rounded">
                            {project.template}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Code className="h-16 w-16 text-ide-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-no-projects-title">No Projects Yet</h3>
              <p className="text-ide-text-secondary mb-4" data-testid="text-no-projects-description">
                Create your first project to get started coding!
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-create-first-project"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB for Create Project */}
      {isMobile && (
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50 p-0"
          aria-label="Create Project"
          data-testid="button-fab-create-project"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Create Project</span>
        </Button>
      )}
    </div>
  );
}
