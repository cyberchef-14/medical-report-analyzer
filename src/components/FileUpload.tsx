import { useState, useCallback, useEffect } from "react";
import { Upload, FileText, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import { extractTextFromPdf, extractTextFromImage } from "@/lib/textExtractor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import FilePreview from "@/components/FilePreview";

interface FileUploadProps {
  onTextExtracted: (text: string) => void;
  onSummary: (summary: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  isDemoMode: boolean;
  setIsDemoMode: (demo: boolean) => void;
}

const FileUpload = ({ 
  onTextExtracted, 
  onSummary, 
  isProcessing, 
  setIsProcessing,
  uploadedFile,
  setUploadedFile,
  isDemoMode,
  setIsDemoMode
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [filePreview, setFilePreview] = useState<string>("");
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [tempExtractedText, setTempExtractedText] = useState("");
  const { toast } = useToast();

  // Load demo mode
  useEffect(() => {
    if (isDemoMode && !uploadedFile) {
      loadDemoFile();
    }
  }, [isDemoMode]);

  const loadDemoFile = async () => {
    setIsProcessing(true);
    setUploadProgress("Loading demo report...");
    
    // Simulate demo data
    setTimeout(() => {
      const demoText = `MEDICAL REPORT - DEMO

Patient: Demo Patient
Date: ${new Date().toLocaleDateString()}
Doctor: Dr. Smith

CHIEF COMPLAINT:
Patient presents with recurring headaches and mild fatigue over the past two weeks.

EXAMINATION FINDINGS:
- Blood Pressure: 120/80 mmHg (Normal)
- Heart Rate: 72 bpm (Normal)
- Temperature: 98.6°F (Normal)
- General appearance: Alert and oriented

ASSESSMENT:
Based on the examination and reported symptoms, the patient appears to be experiencing tension-type headaches, likely related to stress and inadequate sleep.

RECOMMENDATIONS:
1. Increase daily water intake to 8 glasses
2. Establish regular sleep schedule (7-8 hours)
3. Practice stress management techniques
4. Follow up in 2 weeks if symptoms persist
5. Over-the-counter pain relief as needed

PROGNOSIS:
Excellent with lifestyle modifications. No serious underlying conditions detected.`;
      
      setTempExtractedText(demoText);
      setShowExtractedText(true);
      setIsProcessing(false);
      setUploadProgress("");
      
      toast({
        title: "Demo Mode Active",
        description: "Sample medical report loaded for demonstration",
      });
    }, 1500);
  };

  const handleFile = useCallback(async (file: File) => {
    const fileType = file.type;
    const fileSize = file.size / 1024 / 1024; // Convert to MB

    // Validate file type
    if (!fileType.includes("pdf") && !fileType.includes("image")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or image file (JPG, PNG)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (fileSize > 10) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    
    // Generate preview for images
    if (fileType.includes("image")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    setIsProcessing(true);
    onTextExtracted("");
    onSummary("");

    try {
      let extractedText = "";

      if (fileType.includes("pdf")) {
        setUploadProgress("Extracting text from PDF...");
        extractedText = await extractTextFromPdf(file);
      } else {
        setUploadProgress("Performing OCR on image...");
        extractedText = await extractTextFromImage(file);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("No text could be extracted from the file");
      }

      setTempExtractedText(extractedText);
      setShowExtractedText(true);

      toast({
        title: "Text Extracted!",
        description: "Review the extracted text and click 'Summarize' to continue",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
      console.error("Error processing file:", error);
      setUploadedFile(null);
      setFilePreview("");
    } finally {
      setIsProcessing(false);
      setUploadProgress("");
    }
  }, [onTextExtracted, onSummary, setIsProcessing, setUploadedFile, toast]);

  const handleSummarize = async () => {
    if (!tempExtractedText) return;
    
    setIsProcessing(true);
    setUploadProgress("Generating summary with AI...");
    
    try {
      onTextExtracted(tempExtractedText);
      
      const { data, error } = await supabase.functions.invoke('summarize-report', {
        body: { text: tempExtractedText }
      });

      if (error) {
        throw error;
      }

      if (!data?.summary) {
        throw new Error("No summary received from AI");
      }

      onSummary(data.summary);
      
      toast({
        title: "Success!",
        description: "Your medical report has been summarized",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate summary",
        variant: "destructive",
      });
      console.error("Error generating summary:", error);
    } finally {
      setIsProcessing(false);
      setUploadProgress("");
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFilePreview("");
    setShowExtractedText(false);
    setTempExtractedText("");
    onTextExtracted("");
    onSummary("");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="space-y-6">
      {/* Demo Mode Button */}
      {!uploadedFile && !showExtractedText && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setIsDemoMode(true)}
            className="gap-2"
            disabled={isProcessing}
          >
            <Sparkles className="w-4 h-4" />
            Try Demo Mode
          </Button>
        </div>
      )}

      {/* File Preview */}
      {uploadedFile && !showExtractedText && (
        <FilePreview 
          file={uploadedFile} 
          onRemove={handleRemoveFile}
          preview={filePreview}
        />
      )}

      {/* Upload Area */}
      {!uploadedFile && !showExtractedText && (
        <div className="bg-card rounded-2xl border-2 border-dashed border-border shadow-medium hover:shadow-glow transition-all duration-300">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`p-8 md:p-12 rounded-2xl transition-all duration-300 ${
              isDragging ? "bg-primary/10 border-primary scale-[1.02]" : ""
            }`}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              disabled={isProcessing}
            />
            
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center ${
                !isProcessing ? "cursor-pointer" : "cursor-not-allowed"
              }`}
            >
              {isProcessing ? (
                <div className="text-center py-4">
                  <div className="relative mb-6">
                    <Loader2 className="w-16 h-16 md:w-20 md:h-20 text-primary animate-spin mx-auto" />
                    <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full"></div>
                  </div>
                  <p className="text-xl md:text-2xl font-semibold text-foreground mb-3">Processing...</p>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 max-w-md mx-auto">
                    <p className="text-sm md:text-base text-foreground font-medium">{uploadProgress}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="relative mb-6">
                    <Upload className="w-16 h-16 md:w-20 md:h-20 text-primary mx-auto" />
                    <div className="absolute inset-0 blur-2xl bg-primary/10 rounded-full"></div>
                  </div>
                  <p className="text-lg md:text-xl font-semibold text-foreground mb-2">
                    Drop your medical report here
                  </p>
                  <p className="text-base md:text-lg text-foreground mb-1">
                    or <span className="text-primary font-medium underline">click to browse</span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Maximum file size: 10MB
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">PDF</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">JPG/PNG</span>
                    </div>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>
      )}

      {/* Extracted Text Review */}
      {showExtractedText && tempExtractedText && (
        <div className="bg-card border border-border rounded-xl shadow-medium p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Extracted Text
            </h3>
            {uploadedFile && (
              <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                Change File
              </Button>
            )}
          </div>
          <Textarea
            value={tempExtractedText}
            onChange={(e) => setTempExtractedText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder="Extracted text will appear here..."
          />
          <div className="flex justify-center">
            <Button
              onClick={handleSummarize}
              disabled={isProcessing || !tempExtractedText.trim()}
              size="lg"
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Summarizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Summarize with AI
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
