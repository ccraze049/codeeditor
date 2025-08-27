import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bot,
  Sparkles,
  Zap,
  Loader2
} from "lucide-react";

interface AIProjectCreatorProps {
  onProjectCreated?: (projectId: string) => void;
}

export default function AIProjectCreator({ onProjectCreated }: AIProjectCreatorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProjectName, setAiProjectName] = useState("");

  const createAIProjectMutation = useMutation({
    mutationFn: async (data: { prompt: string; name?: string }) => {
      const response = await apiRequest("POST", "/api/projects/ai-create", data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsOpen(false);
      setAiPrompt("");
      setAiProjectName("");
      toast({
        title: "AI Project Created!",
        description: "Your project has been generated with AI assistance.",
      });
      // Navigate to the new project or call callback
      if (onProjectCreated) {
        onProjectCreated(data.project.id);
      } else {
        window.location.href = `/editor/${data.project.id}`;
      }
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
        description: "Failed to create AI project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateAIProject = () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "AI prompt is required.",
        variant: "destructive",
      });
      return;
    }
    
    createAIProjectMutation.mutate({
      prompt: aiPrompt,
      name: aiProjectName || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          data-testid="button-ai-create"
        >
          <Bot className="mr-2 h-4 w-4" />
          AI Create
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-ide-bg-secondary border-ide-border text-ide-text-primary max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Create with AI
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="ai-prompt">Describe your project</Label>
            <Textarea
              id="ai-prompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Create a todo app in React with add, edit, and delete functionality"
              className="min-h-[100px] bg-ide-bg-tertiary border-ide-border"
              data-testid="textarea-ai-prompt"
            />
          </div>
          <div>
            <Label htmlFor="ai-project-name">Project Name (optional)</Label>
            <Input
              id="ai-project-name"
              value={aiProjectName}
              onChange={(e) => setAiProjectName(e.target.value)}
              placeholder="Leave empty for auto-generated name"
              className="bg-ide-bg-tertiary border-ide-border"
              data-testid="input-ai-project-name"
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-ide-border hover:bg-ide-bg-tertiary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAIProject}
              disabled={createAIProjectMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              data-testid="button-create-ai-project"
            >
              {createAIProjectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Project
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}