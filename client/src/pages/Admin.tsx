import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Users, FolderOpen, Settings, Edit2, Save, X, ArrowLeft, Eye, Code } from "lucide-react";
import { useLocation } from "wouter";

interface User {
  _id: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
  isActive?: boolean;
  createdAt: string;
}

interface Project {
  _id: string;
  id: string;
  name: string;
  description?: string;
  language: string;
  template: string;
  isPublic: boolean;
  ownerId: any;
  createdAt: string;
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [view, setView] = useState<'users' | 'user-projects'>('users');

  // Fetch all users (admin only)
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  // Fetch selected user's projects
  const { data: userProjects, isLoading: userProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "projects"],
    enabled: !!selectedUser,
    retry: false,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { id: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userData.id}`, userData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (projectData: Partial<Project> & { id: string }) => {
      const response = await apiRequest("PUT", `/api/admin/projects/${projectData.id}`, projectData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Project Updated", 
        description: "Project has been updated successfully.",
      });
      // Invalidate both admin projects and current user's projects view
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      if (selectedUser) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUser.id, "projects"] });
      }
      setEditingProject(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUserSave = (userData: User) => {
    updateUserMutation.mutate(userData);
  };

  const handleProjectSave = (projectData: Project) => {
    updateProjectMutation.mutate(projectData);
  };

  if (!user || !(user as any).isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">You need admin privileges to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-400">Manage users and projects</p>
        </div>

        {/* Navigation Header */}
        <div className="flex items-center space-x-4 mb-6">
          {view === 'user-projects' && selectedUser && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setView('users');
                  setSelectedUser(null);
                }}
                className="flex items-center space-x-2"
                data-testid="button-back-to-users"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Users</span>
              </Button>
              <div className="text-xl font-semibold text-white">
                {selectedUser.firstName} {selectedUser.lastName} के Projects
              </div>
            </>
          )}
          {view === 'users' && (
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-xl font-semibold text-white">All Users</span>
            </div>
          )}
        </div>

        {/* Users List */}
        {view === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow 
                        key={user.id} 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => {
                          setSelectedUser(user);
                          setView('user-projects');
                        }}
                        data-testid={`row-user-${user.id}`}
                      >
                        <TableCell className="font-medium" data-testid={`text-email-${user.id}`}>{user.email}</TableCell>
                        <TableCell data-testid={`text-name-${user.id}`}>{user.firstName} {user.lastName}</TableCell>
                        <TableCell>
                          <Badge variant={(user as any).isActive ? "default" : "secondary"}>
                            {(user as any).isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={(user as any).isAdmin ? "destructive" : "outline"}>
                            {(user as any).isAdmin ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUser(user)}
                              data-testid={`button-edit-user-${user.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedUser(user);
                                setView('user-projects');
                              }}
                              data-testid={`button-view-projects-${user.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Projects */}
        {view === 'user-projects' && selectedUser && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5" />
                <span>{selectedUser.firstName} {selectedUser.lastName} के Projects</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userProjectsLoading ? (
                <div className="text-center py-8">Loading projects...</div>
              ) : userProjects?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>इस user का कोई project नहीं है</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userProjects?.map((project) => (
                      <TableRow 
                        key={project.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => navigate(`/editor/${project.id}`)}
                        data-testid={`row-project-${project.id}`}
                      >
                        <TableCell className="font-medium" data-testid={`text-project-name-${project.id}`}>{project.name}</TableCell>
                        <TableCell className="max-w-xs truncate" data-testid={`text-project-description-${project.id}`}>
                          {project.description || "No description"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{project.language}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{project.template}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={project.isPublic ? "default" : "outline"}>
                            {project.isPublic ? "Public" : "Private"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingProject(project)}
                              data-testid={`button-edit-project-${project.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => navigate(`/editor/${project.id}`)}
                              data-testid={`button-open-editor-${project.id}`}
                            >
                              <Code className="h-4 w-4" />
                              <span className="ml-1 hidden sm:inline">Open</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <EditUserForm
                user={editingUser}
                onSave={handleUserSave}
                onCancel={() => setEditingUser(null)}
                isLoading={updateUserMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            {editingProject && (
              <EditProjectForm
                project={editingProject}
                onSave={handleProjectSave}
                onCancel={() => setEditingProject(null)}
                isLoading={updateProjectMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Edit User Form Component
function EditUserForm({
  user,
  onSave,
  onCancel,
  isLoading
}: {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState(user);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="isActive">Status</Label>
          <Select
            value={formData.isActive ? "active" : "inactive"}
            onValueChange={(value) => setFormData({ ...formData, isActive: value === "active" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="isAdmin">Role</Label>
          <Select
            value={formData.isAdmin ? "admin" : "user"}
            onValueChange={(value) => setFormData({ ...formData, isAdmin: value === "admin" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

// Edit Project Form Component
function EditProjectForm({
  project,
  onSave,
  onCancel,
  isLoading
}: {
  project: Project;
  onSave: (project: Project) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState(project);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="language">Language</Label>
          <Select
            value={formData.language}
            onValueChange={(value) => setFormData({ ...formData, language: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="template">Template</Label>
          <Select
            value={formData.template}
            onValueChange={(value) => setFormData({ ...formData, template: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="node">Node.js</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="vanilla">Vanilla</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="isPublic">Visibility</Label>
        <Select
          value={formData.isPublic ? "public" : "private"}
          onValueChange={(value) => setFormData({ ...formData, isPublic: value === "public" })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}