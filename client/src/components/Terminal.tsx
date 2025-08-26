import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
}

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export default function Terminal({ projectId }: TerminalProps) {
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
      content: 'Type "help" for available commands',
      timestamp: new Date()
    }
  ]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input and scroll to bottom
  useEffect(() => {
    if (inputRef.current && !isRunning) {
      inputRef.current.focus();
    }
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [lines, isRunning]);

  const addLine = (content: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setLines(prev => [...prev, newLine]);
  };

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Add command line
    addLine(`$ ${command}`, 'command');

    setIsRunning(true);

    // Simulate command execution with realistic responses
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time

      const cmd = command.toLowerCase().trim();

      switch (cmd) {
        case 'help':
          addLine('Available commands:', 'output');
          addLine('  npm start       - Start development server', 'output');
          addLine('  npm install     - Install dependencies', 'output');
          addLine('  npm run build   - Build for production', 'output');
          addLine('  npm test        - Run tests', 'output');
          addLine('  ls              - List files', 'output');
          addLine('  clear           - Clear terminal', 'output');
          addLine('  pwd             - Show current directory', 'output');
          addLine('  node --version  - Show Node.js version', 'output');
          addLine('  help            - Show this help', 'output');
          break;

        case 'npm start':
          addLine('Starting the development server...', 'output');
          await new Promise(resolve => setTimeout(resolve, 1000));
          addLine('Compiled successfully!', 'output');
          addLine('', 'output');
          addLine('Local:            http://localhost:3000', 'output');
          addLine('On Your Network:  http://192.168.1.100:3000', 'output');
          addLine('', 'output');
          addLine('Note that the development build is not optimized.', 'output');
          addLine('To create a production build, use npm run build.', 'output');
          break;

        case 'npm install':
          addLine('Installing dependencies...', 'output');
          await new Promise(resolve => setTimeout(resolve, 2000));
          addLine('npm WARN deprecated package@1.0.0: Package deprecated', 'output');
          addLine('added 1247 packages in 8.32s', 'output');
          break;

        case 'npm run build':
          addLine('Creating an optimized production build...', 'output');
          await new Promise(resolve => setTimeout(resolve, 3000));
          addLine('Compiled successfully.', 'output');
          addLine('', 'output');
          addLine('File sizes after gzip:', 'output');
          addLine('  41.25 KB  build/static/js/main.js', 'output');
          addLine('  1.62 KB   build/static/css/main.css', 'output');
          break;

        case 'npm test':
          addLine('Running tests...', 'output');
          await new Promise(resolve => setTimeout(resolve, 1500));
          addLine('PASS src/App.test.js', 'output');
          addLine('✓ renders learn react link (23 ms)', 'output');
          addLine('', 'output');
          addLine('Test Suites: 1 passed, 1 total', 'output');
          addLine('Tests:       1 passed, 1 total', 'output');
          addLine('Snapshots:   0 total', 'output');
          addLine('Time:        2.145 s', 'output');
          break;

        case 'ls':
          addLine('App.js', 'output');
          addLine('App.css', 'output');
          addLine('index.js', 'output');
          addLine('package.json', 'output');
          addLine('README.md', 'output');
          addLine('node_modules/', 'output');
          addLine('public/', 'output');
          addLine('src/', 'output');
          break;

        case 'pwd':
          addLine('/home/user/projects/my-react-app', 'output');
          break;

        case 'node --version':
          addLine('v18.17.0', 'output');
          break;

        case 'clear':
          setLines([]);
          break;

        case 'whoami':
          addLine('codespace-user', 'output');
          break;

        case 'date':
          addLine(new Date().toString(), 'output');
          break;

        default:
          if (cmd.startsWith('echo ')) {
            addLine(command.slice(5), 'output');
          } else if (cmd.startsWith('cd ')) {
            addLine(`Changed directory to ${command.slice(3)}`, 'output');
          } else {
            addLine(`bash: ${cmd}: command not found`, 'error');
          }
      }
    } catch (error) {
      addLine(`Error executing command: ${error}`, 'error');
    } finally {
      setIsRunning(false);
      setCurrentCommand("");
    }
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
