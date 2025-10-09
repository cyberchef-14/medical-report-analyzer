import { FileText, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  preview?: string;
}

const FilePreview = ({ file, onRemove, preview }: FilePreviewProps) => {
  const isPDF = file.type === "application/pdf";
  const isImage = file.type.startsWith("image/");

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-soft">
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="flex-shrink-0">
          {isImage && preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-20 h-20 object-cover rounded-lg border border-border"
            />
          ) : isPDF ? (
            <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-10 h-10 text-primary" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isPDF ? "PDF Document" : isImage ? "Image File" : "Unknown"}
          </p>
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="flex-shrink-0"
          aria-label="Remove file"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default FilePreview;
