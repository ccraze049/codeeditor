import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { File } from "@shared/schema";

interface MonacoProps {
  file?: File;
  projectId: string;
  isReadOnly?: boolean;
}

export default function Monaco({ file, projectId, isReadOnly }: MonacoProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const editorInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateFileMutation = useMutation({
    mutationFn: async ({ fileId, content }: { fileId: string; content: string }) => {
      const response = await apiRequest("PUT", `/api/files/${fileId}`, { content });
      return await response.json();
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
        description: "Failed to save file changes.",
        variant: "destructive",
      });
    },
  });

  // Load Monaco Editor
  useEffect(() => {
    const loadMonaco = async () => {
      try {
        // Load Monaco Editor from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
        document.head.appendChild(script);

        script.onload = () => {
          (window as any).require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
          (window as any).require(['vs/editor/editor.main'], (monaco: any) => {
            monacoRef.current = monaco;

            // Configure Monaco theme
            monaco.editor.defineTheme('codespace-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [
                { token: 'keyword', foreground: 'C586C0' },
                { token: 'string', foreground: '9CDCFE' },
                { token: 'number', foreground: 'B5CEA8' },
                { token: 'comment', foreground: '6A9955' },
                { token: 'function', foreground: 'DCDCAA' },
                { token: 'variable', foreground: '9CDCFE' },
              ],
              colors: {
                'editor.background': '#0f172a',
                'editor.foreground': '#f1f5f9',
                'editor.lineHighlightBackground': '#1e293b',
                'editor.selectionBackground': '#374151',
                'editorLineNumber.foreground': '#64748b',
                'editorLineNumber.activeForeground': '#3b82f6',
              }
            });

            monaco.editor.setTheme('codespace-dark');
            setIsLoading(false);
          });
        };
      } catch (error) {
        console.error('Failed to load Monaco Editor:', error);
        setIsLoading(false);
      }
    };

    loadMonaco();
  }, []);

  // Create editor instance
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current || isLoading) return;

    const monaco = monacoRef.current;

    // Dispose existing editor
    if (editorInstanceRef.current) {
      editorInstanceRef.current.dispose();
    }

    // Create new editor
    const editor = monaco.editor.create(editorRef.current, {
      value: file?.content || '',
      language: getLanguageFromFileName(file?.name || ''),
      theme: 'codespace-dark',
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
      lineNumbers: 'on',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      readOnly: isReadOnly,
      wordWrap: 'on',
      lineNumbersMinChars: 3,
      glyphMargin: true,
      folding: true,
      renderLineHighlight: 'line',
      selectOnLineNumbers: true,
      contextmenu: true,
      mouseWheelZoom: true,
      cursorBlinking: 'blink',
      cursorStyle: 'line',
      renderWhitespace: 'selection',
      tabSize: 2,
      insertSpaces: true,
    });

    editorInstanceRef.current = editor;
    setContent(file?.content || '');

    // Add change listener for auto-save
    if (!isReadOnly) {
      let saveTimeout: NodeJS.Timeout;
      const changeListener = editor.onDidChangeModelContent(() => {
        const newContent = editor.getValue();
        setContent(newContent);
        
        // Auto-save after 2 seconds of inactivity
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          if (file && newContent !== file.content) {
            updateFileMutation.mutate({ fileId: file.id, content: newContent });
          }
        }, 2000);
      });

      return () => {
        changeListener.dispose();
        clearTimeout(saveTimeout);
        editor.dispose();
      };
    }

    return () => {
      editor.dispose();
    };
  }, [file, monacoRef.current, isLoading, isReadOnly]);

  const getLanguageFromFileName = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c':
        return 'cpp';
      default:
        return 'plaintext';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-ide-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-ide-text-secondary">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="h-full bg-ide-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No File Selected</h3>
          <p className="text-ide-text-secondary">Select a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Editor Header */}
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
        <div className="bg-ide-bg-secondary rounded px-2 py-1 text-xs border border-ide-border">
          <span className="text-ide-text-secondary">Language:</span>
          <span className="text-primary ml-1 capitalize">
            {getLanguageFromFileName(file.name)}
          </span>
        </div>
        <div className="bg-ide-bg-secondary rounded px-2 py-1 text-xs border border-ide-border">
          <span className="text-ide-text-secondary">
            {content.split('\n').length} lines
          </span>
        </div>
        {updateFileMutation.isPending && (
          <div className="bg-ide-bg-secondary rounded px-2 py-1 text-xs border border-ide-border">
            <span className="text-ide-warning">Saving...</span>
          </div>
        )}
        {file.content !== content && !updateFileMutation.isPending && (
          <div className="bg-ide-bg-secondary rounded px-2 py-1 text-xs border border-ide-border">
            <span className="text-ide-error">Unsaved</span>
          </div>
        )}
      </div>

      {/* Monaco Editor Container */}
      <div 
        ref={editorRef} 
        className="h-full w-full"
        data-testid="monaco-editor"
      />
    </div>
  );
}
