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
  Loader2,
  Filter,
  RefreshCw,
  ArrowDown
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
  const [hideWarnings, setHideWarnings] = useState(true); // Hide warnings by default
  const [currentWorkingDir, setCurrentWorkingDir] = useState('/');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Fixed scroll to bottom function for mobile and desktop
  const scrollToBottom = () => {
    const currentIsMobile = window.innerWidth <= 768;
    
    setTimeout(() => {
      if (scrollAreaRef.current) {
        if (currentIsMobile) {
          // Mobile: Direct scroll on native container - much simpler
          const scrollContainer = scrollAreaRef.current;
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
          
          // Force smooth scroll with fallback
          try {
            scrollContainer.scrollTo({ 
              top: scrollContainer.scrollHeight, 
              behavior: 'smooth' 
            });
          } catch (e) {
            // Fallback for older browsers
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        } else {
          // Desktop: Find and scroll the Radix ScrollArea viewport
          const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          } else {
            // Fallback to container itself
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
          }
        }
      }
    }, currentIsMobile ? 200 : 50); // Longer delay for mobile
  };

  // Auto-focus input and scroll to bottom - improved for mobile and desktop
  useEffect(() => {
    // Enhanced mobile focus handling
    if (inputRef.current && !isRunning) {
      const terminalElement = inputRef.current.closest('[data-testid="terminal"]');
      const isVisible = terminalElement && !terminalElement.closest('.hidden');
      if (isVisible) {
        // For mobile devices, use a slight delay to ensure proper focusing
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        } else {
          inputRef.current.focus();
        }
      }
    }
    
    // Always scroll to bottom when new lines are added
    scrollToBottom();
  }, [lines, isRunning]);


  const addLine = (content: string, type: TerminalLine['type'] = 'output') => {
    // Filter out npm warnings if hideWarnings is enabled
    if (hideWarnings && type === 'output' && 
        (content.includes('npm warn') || 
         content.includes('deprecated') ||
         content.startsWith('npm warn'))) {
      return; // Don't add warning lines
    }
    
    // Determine if this is actually an error that should be red
    let finalType = type;
    if (type === 'output') {
      // Only mark as error if it contains actual error keywords
      const isActualError = content.toLowerCase().includes('error:') || 
                           content.toLowerCase().includes('failed:') ||
                           content.toLowerCase().includes('cannot find') ||
                           content.toLowerCase().includes('module not found') ||
                           content.toLowerCase().includes('syntax error') ||
                           content.toLowerCase().startsWith('error ');
      
      // Things that should NOT be red (normal npm output)
      const isNormalOutput = content.includes('changed') ||
                           content.includes('packages') ||
                           content.includes('audited') ||
                           content.includes('vulnerabilities') ||
                           content.includes('funding') ||
                           content.includes('up to date') ||
                           content.includes('react-scripts start') ||
                           content.includes('found 0 vulnerabilities') ||
                           content.startsWith('Searching in:') ||
                           content.startsWith('Could not find a required file') ||
                           content.startsWith('Name: ') ||
                           content.includes('To address all issues');
      
      if (isNormalOutput) {
        finalType = 'output'; // Keep as normal output
      } else if (isActualError) {
        finalType = 'error'; // Mark as red error
      }
    }
    
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type: finalType,
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
      // Remove auto-clearing behavior - only clear when user manually clicks clear button
      // Note: Previously this would auto-clear on 'clear' command type, now it persists outputs
      
      // Split output into lines and add each line
      const outputLines = data.output.split('\n');
      outputLines.forEach((line: string, index: number) => {
        if (line.trim() || index === 0) { // Always show first line even if empty
          addLine(line, data.type === 'error' ? 'error' : 'output');
        }
      });
        
        // Always refresh file list after any command execution
        console.log('Command executed, refreshing file list');
        
        // Multiple refresh attempts to ensure files show up
        const refreshFiles = () => {
          queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
          queryClient.refetchQueries({ queryKey: ["/api/projects", projectId, "files"] });
          if (onFilesChanged) {
            onFilesChanged();
          }
        };
        
        // Immediate refresh
        refreshFiles();
        
        // Additional refreshes with delays to handle sync timing
        setTimeout(refreshFiles, 500);
        setTimeout(refreshFiles, 1500);
        setTimeout(refreshFiles, 3000);
        
        // If files were updated (npm command), add system message
        if (data.filesUpdated) {
          addLine('Files updated - package.json and dependencies synced', 'system');
        }
        
        // Update working directory if cd command was used
        if (data.workingDirectory) {
          const relativePath = data.workingDirectory.split('/projects/')[1]?.split('/').slice(1).join('/') || '/';
          setCurrentWorkingDir(relativePath || '/');
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
      const commands = ['npm start', 'npm install', 'npm run build', 'npm test', 'help', 'clear', 'ls', 'pwd', 'cd', 'mkdir', 'touch', 'cat'];
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
      {/* Terminal Header - Mobile optimized */}
      <div className="flex items-center justify-between px-3 py-2 bg-ide-bg-secondary border-b border-ide-border">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Terminal</span>
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-1 space-x-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHideWarnings(!hideWarnings)}
            className={`p-1 h-8 w-8 md:h-6 md:w-6 touch-manipulation ${hideWarnings ? 'text-ide-success' : 'text-ide-text-secondary'}`}
            title={hideWarnings ? "Show Warnings" : "Hide Warnings"}
            data-testid="button-toggle-warnings"
          >
            <Filter className="h-4 w-4 md:h-3 md:w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              addLine('Force refreshing file list...', 'system');
              // Clear all cache first
              queryClient.clear();
              // Force fresh fetch
              await queryClient.refetchQueries({ queryKey: ["/api/projects", projectId, "files"] });
              queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
              if (onFilesChanged) {
                onFilesChanged();
              }
              addLine('File list refreshed manually', 'system');
            }}
            className="p-1 h-8 w-8 md:h-6 md:w-6 touch-manipulation"
            title="Force Refresh File List"
            data-testid="button-refresh-files"
          >
            <RefreshCw className="h-4 w-4 md:h-3 md:w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('npm start')}
            disabled={isRunning}
            className="p-1 h-8 w-8 md:h-6 md:w-6 touch-manipulation"
            title="Start Development Server"
            data-testid="button-start-server"
          >
            <Play className="h-4 w-4 md:h-3 md:w-3 text-ide-success" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyTerminalContent}
            className="p-1 h-8 w-8 md:h-6 md:w-6 touch-manipulation"
            title="Copy Terminal Content"
            data-testid="button-copy-terminal"
          >
            <Copy className="h-4 w-4 md:h-3 md:w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollToBottom}
            className="p-1 h-8 w-8 md:h-6 md:w-6 touch-manipulation"
            title="Scroll to Bottom"
            data-testid="button-scroll-bottom"
          >
            <ArrowDown className="h-4 w-4 md:h-3 md:w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            className="p-1 h-8 w-8 md:h-6 md:w-6 touch-manipulation"
            title="Clear Terminal"
            data-testid="button-clear-terminal"
          >
            <Trash2 className="h-4 w-4 md:h-3 md:w-3" />
          </Button>
        </div>
      </div>

      {/* Terminal Content - Fixed scrolling for all devices */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div 
          ref={scrollAreaRef}
          className={`h-full w-full p-3 ${isMobile ? 'overflow-y-auto overscroll-contain' : ''}`}
          style={{ 
            WebkitOverflowScrolling: 'touch',
            height: '100%',
            scrollBehavior: 'smooth',
            /* Prevent black box overlay on mobile */
            position: 'relative',
            zIndex: 1,
            /* Better mobile viewport handling */
            ...(isMobile && {
              maxHeight: '100%',
              overflowY: 'auto',
              touchAction: 'pan-y'
            })
          }}
        >
          {!isMobile && (
            <ScrollArea className="h-full w-full">
              <div className="font-mono text-sm space-y-1 pb-4">
                {lines.map((line) => (
                  <div
                    key={line.id}
                    className={`${getLineColor(line.type)} leading-relaxed`}
                    data-testid={`terminal-line-${line.type}`}
                  >
                    {line.content}
                  </div>
                ))}
                
                {/* Command Input Line - Desktop */}
                <div className="flex items-center space-x-2 mt-2 sticky bottom-0 bg-ide-bg-primary py-2">
                  <span className="text-ide-success text-sm">{currentWorkingDir}$</span>
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
          )}
          
          {isMobile && (
            <div 
              className="font-mono text-sm space-y-1"
              style={{
                /* Fix mobile layout issues */
                minHeight: '100%',
                paddingBottom: '80px', /* Extra space for mobile keyboard */
                position: 'relative'
              }}
            >
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={`${getLineColor(line.type)} leading-relaxed break-words`}
                  data-testid={`terminal-line-${line.type}`}
                  style={{
                    /* Prevent text overflow causing layout issues */
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  {line.content}
                </div>
              ))}
              
              {/* Command Input Line - Mobile Fixed */}
              <div 
                className="flex items-center space-x-2 mt-4 py-3 bg-ide-bg-primary"
                style={{
                  /* Fix mobile input area */
                  position: 'sticky',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  zIndex: 10,
                  borderTop: '1px solid var(--ide-border)',
                  margin: '0 -12px',
                  padding: '12px'
                }}
              >
                <span className="text-ide-success text-sm flex-shrink-0">{currentWorkingDir}$</span>
                <Input
                  ref={inputRef}
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isRunning}
                  className="flex-1 bg-transparent border-none p-2 font-mono text-sm text-ide-text-primary focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px]"
                  placeholder={isRunning ? "Command running..." : "Type a command..."}
                  data-testid="input-terminal-command"
                  style={{ 
                    fontSize: 'max(16px, 1rem)', /* Prevents zoom on mobile */
                    backgroundColor: 'transparent'
                  }}
                />
                {isRunning && (
                  <Loader2 className="h-4 w-4 animate-spin text-ide-text-secondary flex-shrink-0" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terminal Status - Mobile responsive */}
      <div className="px-3 py-1 bg-ide-bg-secondary border-t border-ide-border text-xs text-ide-text-secondary">
        <div className="flex items-center justify-between">
          <span>Ready - {lines.length} lines</span>
          <span className="hidden md:inline">Use ↑/↓ for command history, Tab for completion</span>
          <span className="md:hidden">↑/↓ history, Tab complete</span>
        </div>
      </div>
    </div>
  );
}
