import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Code, 
  MessageSquare, 
  Copy,
  Check,
  Loader2
} from "lucide-react";
import type { File } from "@shared/schema";

interface PackageInstallation {
  packages: string[];
  command: string;
  language: string;
}

interface AIAssistantProps {
  projectId: string;
  onClose: () => void;
  activeFile?: File;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'text' | 'code' | 'package-install';
  packageInfo?: PackageInstallation;
}

export default function AIAssistant({ projectId, onClose, activeFile }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI coding assistant. I can help you with code generation, debugging, optimization, and explanations. What would you like to work on?',
      timestamp: new Date().toISOString(),
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const generateCodeMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai/generate", {
        prompt,
        language: getLanguageFromFile(activeFile),
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.code,
        timestamp: new Date().toISOString(),
        type: 'code'
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: handleError,
  });

  const explainCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/ai/explain", {
        code,
        language: getLanguageFromFile(activeFile),
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.explanation,
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: handleError,
  });

  const debugCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/ai/debug", {
        code,
        language: getLanguageFromFile(activeFile),
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.suggestions,
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: handleError,
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
        projectId,
        message,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      // Check if response contains package installation requirements
      const packageInfo = detectPackageRequirements(data.response);
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        type: packageInfo ? 'package-install' : (data.response.includes('```') ? 'code' : 'text'),
        packageInfo: packageInfo || undefined
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-execute package installation if detected
      if (packageInfo) {
        executePackageInstallation(packageInfo);
      }
    },
    onError: handleError,
  });

  const applyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/ai/apply-code", {
        projectId,
        code,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Code Applied!",
        description: data.message,
      });
      // Refresh the file tree by invalidating queries
      window.location.reload();
    },
    onError: handleError,
  });

  function handleError(error: Error) {
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
      description: "Failed to get AI response. Please try again.",
      variant: "destructive",
    });
  }

  function getLanguageFromFile(file?: File): string {
    if (!file) return 'javascript';
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c':
        return 'cpp';
      default:
        return 'javascript';
    }
  }

  function detectPackageRequirements(content: string): PackageInstallation | null {
    const lowerContent = content.toLowerCase();
    
    // Detect various package installation patterns
    const npmPackages: string[] = [];
    const pipPackages: string[] = [];
    
    // Common npm packages mentioned in responses
    const npmPatterns = [
      /npm install ([\w\s\-@\/\.]+)/gi,
      /yarn add ([\w\s\-@\/\.]+)/gi,
      /install.*packages?[:\s]*([\w\s\-@\/\.,]+)/gi,
      /dependencies?[:\s]*([\w\s\-@\/\.,]+)/gi
    ];
    
    // Common pip packages
    const pipPatterns = [
      /pip install ([\w\s\-\.]+)/gi,
      /python.*packages?[:\s]*([\w\s\-\.]+)/gi
    ];
    
    // Check for specific frameworks/libraries mentions
    const frameworks = {
      'react': ['react', 'react-dom'],
      'express': ['express'],
      'vue': ['vue'],
      'angular': ['@angular/core', '@angular/cli'],
      'bootstrap': ['bootstrap'],
      'tailwind': ['tailwindcss'],
      'axios': ['axios'],
      'lodash': ['lodash'],
      'moment': ['moment'],
      'socket.io': ['socket.io'],
      'mongoose': ['mongoose'],
      'nodemon': ['nodemon']
    };
    
    // Detect framework mentions
    Object.entries(frameworks).forEach(([framework, packages]) => {
      if (lowerContent.includes(framework)) {
        npmPackages.push(...packages);
      }
    });
    
    // Extract packages from patterns
    npmPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const packages = match.replace(/npm install|yarn add|install.*packages?[:\s]*|dependencies?[:\s]*/gi, '')
            .split(/[,\s]+/)
            .filter(pkg => pkg && !pkg.match(/^(and|or|with|using)$/i));
          npmPackages.push(...packages);
        });
      }
    });
    
    pipPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const packages = match.replace(/pip install|python.*packages?[:\s]*/gi, '')
            .split(/[,\s]+/)
            .filter(pkg => pkg && !pkg.match(/^(and|or|with|using)$/i));
          pipPackages.push(...packages);
        });
      }
    });
    
    // Return package info if any packages detected
    if (npmPackages.length > 0) {
      return {
        packages: Array.from(new Set(npmPackages)), // Remove duplicates
        command: `npm install ${Array.from(new Set(npmPackages)).join(' ')}`,
        language: 'javascript'
      };
    }
    
    if (pipPackages.length > 0) {
      return {
        packages: Array.from(new Set(pipPackages)),
        command: `pip install ${Array.from(new Set(pipPackages)).join(' ')}`,
        language: 'python'
      };
    }
    
    return null;
  }
  
  function executePackageInstallation(packageInfo: PackageInstallation) {
    // Dispatch custom event to terminal for auto-execution
    const event = new CustomEvent('autoExecuteCommand', {
      detail: {
        command: packageInfo.command,
        projectId: projectId
      }
    });
    window.dispatchEvent(event);
    
    toast({
      title: "पैकेज इंस्टॉलेशन शुरू हो गया",
      description: `${packageInfo.packages.join(', ')} install हो रहे हैं...`,
    });
  }

  const sendMessage = () => {
    if (!inputValue.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputValue);
    setInputValue("");
  };

  const handleQuickAction = (action: string) => {
    if (!activeFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to use AI features.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `${action} the current file`,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);

    switch (action) {
      case 'Explain':
        explainCodeMutation.mutate(activeFile.content || '');
        break;
      case 'Debug':
        debugCodeMutation.mutate(activeFile.content || '');
        break;
      case 'Generate':
        generateCodeMutation.mutate(`Improve this ${getLanguageFromFile(activeFile)} code: ${activeFile.content}`);
        break;
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast({ title: "Copied to clipboard!" });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isLoading = generateCodeMutation.isPending || 
                   explainCodeMutation.isPending || 
                   debugCodeMutation.isPending || 
                   chatMutation.isPending ||
                   applyCodeMutation.isPending;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="w-full md:w-80 bg-ide-bg-secondary border-l border-ide-border flex flex-col h-full overflow-hidden" data-testid="ai-assistant">
      {/* Header */}
      <div className="p-3 border-b border-ide-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-purple-400" />
          <h3 className="font-medium text-sm">AI Assistant</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-1 h-6 w-6"
          data-testid="button-close-ai"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
        <div className="space-y-4 min-h-0">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex space-x-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
            >
              {message.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3 w-3 text-white" />
                </div>
              )}
              
              <div className={`flex-1 min-w-0 ${message.role === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`rounded-lg p-3 text-sm group relative break-words ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground inline-block max-w-[85%] ml-auto'
                      : 'bg-ide-bg-tertiary text-ide-text-primary w-full'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm prose-slate dark:prose-invert w-full overflow-hidden break-words
                      prose-headings:text-ide-text-primary prose-p:text-ide-text-primary prose-p:break-words prose-p:w-full
                      prose-strong:text-ide-text-primary prose-code:text-ide-text-secondary
                      prose-code:bg-ide-bg-primary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:break-all
                      prose-pre:bg-ide-bg-primary prose-pre:border prose-pre:border-ide-border prose-pre:overflow-x-auto prose-pre:w-full
                      prose-blockquote:border-l-4 prose-blockquote:border-purple-400 prose-blockquote:bg-ide-bg-primary prose-blockquote:break-words prose-blockquote:w-full
                      prose-ul:text-ide-text-primary prose-ol:text-ide-text-primary prose-li:text-ide-text-primary prose-li:break-words prose-li:w-full">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code: ({ children, className, inline, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || '');
                            
                            if (inline) {
                              // Inline code
                              return (
                                <code 
                                  className="bg-ide-bg-primary text-ide-text-secondary px-1 py-0.5 rounded text-xs font-mono"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            }
                            
                            // Block code
                            return (
                              <div className="space-y-2 w-full">
                                <div className="relative group w-full">
                                  <pre className="bg-ide-bg-primary border border-ide-border rounded p-3 overflow-x-auto w-full">
                                    <code className="text-xs font-mono text-ide-text-primary block w-full" {...props}>
                                      {children}
                                    </code>
                                  </pre>
                                  <div className="flex space-x-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), message.id)}
                                      className="text-xs h-6 bg-ide-bg-secondary border-ide-border"
                                      data-testid={`button-copy-code-${message.id}`}
                                    >
                                      {copiedMessageId === message.id ? (
                                        <Check className="h-3 w-3 mr-1" />
                                      ) : (
                                        <Copy className="h-3 w-3 mr-1" />
                                      )}
                                      Copy
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => applyCodeMutation.mutate(String(children).replace(/\n$/, ''))}
                                      disabled={applyCodeMutation.isPending}
                                      className="text-xs h-6 bg-ide-bg-secondary border-ide-border"
                                      data-testid={`button-apply-code-${message.id}`}
                                    >
                                      <Code className="h-3 w-3 mr-1" />
                                      {applyCodeMutation.isPending ? 'Applying...' : 'Apply'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        }}
                      >
                        {message.type === 'code' && !message.content.includes('```') 
                          ? `\`\`\`${getLanguageFromFile(activeFile)}\n${message.content}\n\`\`\``
                          : message.content
                        }
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  
                  {message.role === 'assistant' && message.type !== 'code' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                      data-testid={`button-copy-message-${message.id}`}
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                <div className="text-xs text-ide-text-secondary mt-1">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex space-x-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <div className="bg-ide-bg-tertiary rounded-lg p-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="p-3 border-t border-ide-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
          <div className="flex flex-wrap space-x-1 sm:space-x-2 text-xs gap-y-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction('Generate')}
              disabled={!activeFile || isLoading}
              className="text-xs h-6 bg-ide-bg-tertiary border-ide-border"
              data-testid="button-generate-code"
            >
              Generate Code
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction('Explain')}
              disabled={!activeFile || isLoading}
              className="text-xs h-6 bg-ide-bg-tertiary border-ide-border"
              data-testid="button-explain-code"
            >
              Explain Code
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction('Debug')}
              disabled={!activeFile || isLoading}
              className="text-xs h-6 bg-ide-bg-tertiary border-ide-border"
              data-testid="button-debug-code"
            >
              Debug
            </Button>
          </div>
        </div>

        {/* Chat Input */}
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask AI for help..."
            className="flex-1 bg-ide-bg-tertiary border-ide-border text-sm h-8"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isLoading}
            data-testid="input-ai-message"
          />
          <Button
            size="sm"
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 h-8 w-8 p-0"
            data-testid="button-send-message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center justify-center mt-2">
          <span className="text-xs text-ide-text-secondary">Powered by Moonshot AI</span>
        </div>
      </div>
    </div>
  );
}
