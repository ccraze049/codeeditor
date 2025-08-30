import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Play,
  Square,
  RotateCcw,
  Copy,
  Trash2,
  Terminal as TerminalIcon,
  Loader2
} from "lucide-react";

interface TerminalProps {
  projectId: string;
  onFilesChanged?: () => void;
}

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export default function Terminal({ projectId, onFilesChanged }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'system',
      content: 'CodeSpace Terminal - Ready',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'system',
      content: 'Real terminal with command execution. Type "help" for available commands',
      timestamp: new Date()
    }
  ]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-focus input and scroll to bottom
  useEffect(() => {
    if (inputRef.current && !isRunning) {
      inputRef.current.focus();
    }
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [lines, isRunning]);

  // Listen for auto-execute command events from run button
  useEffect(() => {
    const handleAutoExecute = (event: CustomEvent) => {
      const { command, projectId: eventProjectId } = event.detail;
      if (eventProjectId === projectId) {
        setCurrentCommand(command);
        addLine(`$ ${command}`, 'command');
        executeCommandMutation.mutate(command);
      }
    };
    
    window.addEventListener('autoExecuteCommand', handleAutoExecute as EventListener);
    
    return () => {
      window.removeEventListener('autoExecuteCommand', handleAutoExecute as EventListener);
    };
  }, [projectId, executeCommandMutation]);

  const addLine = (content: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setLines(prev => [...prev, newLine]);
  };

  // Real command execution using backend API
  const executeCommandMutation = useMutation({
    mutationFn: async (command: string) => {
      const response = await apiRequest("POST", "/api/terminal/execute", {
        command,
        projectId
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.type === 'clear') {
        setLines([]);
      } else {
        // Split output into lines and add each line
        const outputLines = data.output.split('\n');
        outputLines.forEach((line: string, index: number) => {
          if (line.trim() || index === 0) { // Always show first line even if empty
            addLine(line, data.type === 'error' ? 'error' : 'output');
          }
        });
        
        // If files were updated (npm command), refresh file list
        if (data.filesUpdated) {
          console.log('Files updated after npm command, refreshing file list');
          // Invalidate file queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
          // Also call onFilesChanged callback if provided
          if (onFilesChanged) {
            onFilesChanged();
          }
          // Add a system message
          addLine('Files updated - package.json and dependencies synced', 'system');
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Terminal Error",
        description: "Failed to execute command. Please try again.",
        variant: "destructive",
      });
      addLine(`Error: Failed to execute command`, 'error');
    },
    onSettled: () => {
      setIsRunning(false);
      setCurrentCommand("");
    }
  });

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Add command line
    addLine(`$ ${command}`, 'command');

    setIsRunning(true);

    // Execute command through backend API
    executeCommandMutation.mutate(command);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
        if (newIndex === commandHistory.length - 1) {
          setHistoryIndex(-1);
          setCurrentCommand("");
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion for common commands
      const commands = ['npm start', 'npm install', 'npm run build', 'npm test', 'help', 'clear', 'ls', 'pwd'];
      const matches = commands.filter(cmd => cmd.startsWith(currentCommand));
      if (matches.length === 1) {
        setCurrentCommand(matches[0]);
      }
    }
  };

  const clearTerminal = () => {
    setLines([]);
  };

  const copyTerminalContent = async () => {
    const content = lines.map(line => {
      const prefix = line.type === 'command' ? '' : 
                    line.type === 'error' ? '[ERROR] ' : '';
      return prefix + line.content;
    }).join('\n');

    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy terminal content:', error);
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command':
        return 'text-ide-text-accent';
      case 'error':
        return 'text-ide-error';
      case 'system':
        return 'text-ide-text-secondary';
      default:
        return 'text-ide-text-primary';
    }
  };

  return (
    <div className="flex flex-col h-full bg-ide-bg-primary" data-testid="terminal">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-ide-bg-secondary border-b border-ide-border">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Terminal</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('npm start')}
            disabled={isRunning}
            className="p-1 h-6 w-6"
            title="Start Development Server"
            data-testid="button-start-server"
          >
            <Play className="h-3 w-3 text-ide-success" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyTerminalContent}
            className="p-1 h-6 w-6"
            title="Copy Terminal Content"
            data-testid="button-copy-terminal"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            className="p-1 h-6 w-6"
            title="Clear Terminal"
            data-testid="button-clear-terminal"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
        <div className="font-mono text-sm space-y-1">
          {lines.map((line) => (
            <div
              key={line.id}
              className={`${getLineColor(line.type)} leading-relaxed`}
              data-testid={`terminal-line-${line.type}`}
            >
              {line.content}
            </div>
          ))}
          
          {/* Command Input Line */}
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-ide-success">$</span>
            <Input
              ref={inputRef}
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isRunning}
              className="flex-1 bg-transparent border-none p-0 font-mono text-sm text-ide-text-primary focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder={isRunning ? "Command running..." : "Type a command..."}
              data-testid="input-terminal-command"
            />
            {isRunning && (
              <Loader2 className="h-4 w-4 animate-spin text-ide-text-secondary" />
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Terminal Status */}
      <div className="px-3 py-1 bg-ide-bg-secondary border-t border-ide-border text-xs text-ide-text-secondary">
        <div className="flex items-center justify-between">
          <span>Ready - {lines.length} lines</span>
          <span>Use ↑/↓ for command history, Tab for completion</span>
        </div>
      </div>
    </div>
  );
}
