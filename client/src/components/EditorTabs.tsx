import { Button } from "@/components/ui/button";
import { X, File } from "lucide-react";
import type { File as FileType } from "@shared/schema";

interface EditorTabsProps {
  files: FileType[];
  openFileIds: string[];
  activeFileId: string | null;
  onFileClick: (fileId: string) => void;
  onFileClose: (fileId: string) => void;
}

export default function EditorTabs({ 
  files, 
  openFileIds, 
  activeFileId, 
  onFileClick, 
  onFileClose 
}: EditorTabsProps) {
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return "🟨";
      case 'ts':
      case 'tsx':
        return "🔷";
      case 'css':
        return "🎨";
      case 'html':
        return "🌐";
      case 'json':
        return "📋";
      case 'md':
        return "📝";
      case 'py':
        return "🐍";
      default:
        return "📄";
    }
  };

  const openFiles = files.filter(file => openFileIds.includes(file.id) && !file.isFolder);

  return (
    <div className="h-10 bg-ide-bg-secondary border-b border-ide-border flex items-center overflow-x-auto">
      <div className="flex items-center">
        {openFiles.map((file) => {
          const isActive = activeFileId === file.id;
          const hasUnsavedChanges = false; // TODO: Track unsaved changes
          
          return (
            <div
              key={file.id}
              className={`flex items-center px-3 py-2 border-r border-ide-border cursor-pointer group min-w-0 ${
                isActive 
                  ? 'bg-ide-bg-primary text-ide-text-primary' 
                  : 'hover:bg-ide-bg-tertiary text-ide-text-secondary'
              }`}
              onClick={() => onFileClick(file.id)}
              data-testid={`tab-${file.name}`}
            >
              <span className="mr-2 text-sm flex-shrink-0">
                {getFileIcon(file.name)}
              </span>
              <span className="text-sm truncate max-w-32">
                {file.name}
              </span>
              {hasUnsavedChanges && (
                <div className="w-2 h-2 bg-ide-warning rounded-full ml-2 flex-shrink-0" title="Unsaved changes" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className={`ml-2 p-1 h-5 w-5 flex-shrink-0 ${
                  isActive 
                    ? 'opacity-100 hover:bg-ide-bg-secondary' 
                    : 'opacity-0 group-hover:opacity-100 hover:bg-ide-bg-primary'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onFileClose(file.id);
                }}
                data-testid={`button-close-${file.name}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>

      {openFiles.length === 0 && (
        <div className="flex items-center px-4 text-ide-text-secondary">
          <File className="h-4 w-4 mr-2" />
          <span className="text-sm">No files open</span>
        </div>
      )}
    </div>
  );
}
