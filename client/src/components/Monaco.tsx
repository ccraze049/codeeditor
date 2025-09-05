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
  onSave?: () => void;
}

export default function Monaco({ file, projectId, isReadOnly, onSave }: MonacoProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const editorInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const cursorPositionRef = useRef<any>(null);
  const scrollPositionRef = useRef<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateFileMutation = useMutation({
    mutationFn: async ({ fileId, content }: { fileId: string; content: string }) => {
      const response = await apiRequest("PUT", `/api/files/${fileId}`, { content });
      return await response.json();
    },
    onSuccess: () => {
      // Show success notification
      toast({
        title: "File Saved",
        description: "Changes saved to MongoDB successfully",
        variant: "default",
      });
      
      // Trigger preview refresh when file is saved
      if (onSave) {
        onSave();
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

    // Store cursor and scroll position before disposing editor
    if (editorInstanceRef.current) {
      try {
        cursorPositionRef.current = editorInstanceRef.current.getPosition();
        scrollPositionRef.current = editorInstanceRef.current.getScrollTop();
      } catch (e) {
        // Ignore errors if editor is already disposed
      }
      editorInstanceRef.current.dispose();
    }

    // Configure TypeScript compiler options for better IntelliSense
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types']
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types']
    });

    // Add React and common libraries type definitions
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      `declare module 'react' {
        export default React;
        export interface FC<P = {}> {
          (props: P): JSX.Element | null;
        }
        export function useState<T>(initialState: T): [T, (value: T) => void];
        export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
        export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
        export function useMemo<T>(factory: () => T, deps: any[]): T;
        export function useRef<T>(initialValue: T): { current: T };
      }`,
      'react.d.ts'
    );

    // Mobile detection for responsive editor settings
    const isMobile = window.innerWidth < 768;
    
    // Create new editor with enhanced settings
    const editor = monaco.editor.create(editorRef.current, {
      value: file?.content || '',
      language: getLanguageFromFileName(file?.name || ''),
      theme: 'codespace-dark',
      fontSize: isMobile ? 12 : 16,
      fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
      lineNumbers: isMobile ? 'off' : 'on',
      minimap: { enabled: !isMobile },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      readOnly: isReadOnly,
      wordWrap: 'on',
      lineNumbersMinChars: isMobile ? 2 : 3,
      glyphMargin: !isMobile,
      folding: !isMobile,
      renderLineHighlight: 'line',
      selectOnLineNumbers: true,
      contextmenu: !isMobile,
      mouseWheelZoom: !isMobile,
      cursorBlinking: 'blink',
      cursorStyle: 'line',
      renderWhitespace: isMobile ? 'none' : 'selection',
      tabSize: 2,
      insertSpaces: true,
      // Enhanced IntelliSense and autocomplete settings
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'on',
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      quickSuggestionsDelay: 100,
      parameterHints: {
        enabled: true,
        cycle: true
      },
      suggest: {
        showKeywords: true,
        showSnippets: true,
        showFunctions: true,
        showVariables: true,
        showClasses: true,
        showModules: true,
        showProperties: true,
        showMethods: true,
        showConstructors: true,
        showFields: true,
        showValues: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showEvents: true,
        showOperators: true,
        showUnits: true,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeParameters: true,
        showIssues: true,
        showUsers: true,
        showStructs: true
      },
      // Enable hover information
      hover: {
        enabled: true,
        delay: 300
      },
      // Better bracket matching
      matchBrackets: 'always',
      // Auto-indentation
      autoIndent: 'full',
      // Format on paste
      formatOnPaste: true,
      // Format on type
      formatOnType: true
    });

    editorInstanceRef.current = editor;
    setContent(file?.content || '');

    // Restore cursor and scroll position after editor creation
    if (cursorPositionRef.current) {
      setTimeout(() => {
        try {
          editor.setPosition(cursorPositionRef.current);
          if (scrollPositionRef.current) {
            editor.setScrollTop(scrollPositionRef.current);
          }
          editor.focus();
        } catch (e) {
          // Ignore errors during position restoration
        }
      }, 100);
    }

    // Add change listener for auto-save
    if (!isReadOnly) {
      let saveTimeout: NodeJS.Timeout;
      const changeListener = editor.onDidChangeModelContent(() => {
        const newContent = editor.getValue();
        setContent(newContent);
        
        // Auto-save after 1 second of inactivity (reduced for better UX)
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          if (file && newContent !== file.content) {
            console.log('Frontend: Auto-saving file:', file.name);
            console.log('Frontend: File ID:', file.id);
            console.log('Frontend: Content length:', newContent.length);
            console.log('Frontend: Previous content length:', file.content ? file.content.length : 'null');
            updateFileMutation.mutate({ fileId: file.id, content: newContent });
          }
        }, 1000);
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
  }, [file?.id, file?.name, monacoRef.current, isLoading, isReadOnly]);

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
            <span className="text-ide-warning">💾 Auto-saving...</span>
          </div>
        )}
        {file.content !== content && !updateFileMutation.isPending && (
          <div className="bg-ide-bg-secondary rounded px-2 py-1 text-xs border border-ide-border">
            <span className="text-ide-error">⏳ Will save in 1s</span>
          </div>
        )}
        {file.content === content && !updateFileMutation.isPending && (
          <div className="bg-ide-bg-secondary rounded px-2 py-1 text-xs border border-ide-border">
            <span className="text-green-400">✅ Auto-saved</span>
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
