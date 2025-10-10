import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FileUpload from "@/components/FileUpload";
import SummaryDisplay from "@/components/SummaryDisplay";
import ThemeToggle from "@/components/ThemeToggle";
import ChatBot from "@/components/ChatBot";
import { FileText, Sparkles, RotateCcw, LogIn, LayoutDashboard, LogOut, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import Footer from "@/components/Footer";

const Index = () => {
  const [extractedText, setExtractedText] = useState("");
  const [summary, setSummary] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = () => {
    setExtractedText("");
    setSummary("");
    setUploadedFile(null);
    setIsDemoMode(false);
    setIsProcessing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  const handleSummaryGenerated = async (newSummary: string) => {
    setSummary(newSummary);

    // Save to database if user is logged in
    if (user && uploadedFile) {
      try {
        const { error } = await (supabase as any).from("medical_reports").insert([{
          user_id: user.id,
          report_name: uploadedFile.name,
          extracted_text: extractedText,
          summary: newSummary,
        }]);

        if (error) throw error;

        toast({
          title: "Report Saved",
          description: "Your report has been saved to your dashboard",
        });
      } catch (error) {
        console.error("Error saving report:", error);
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
                Medical Report Summarizer
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/analytics")} className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-2">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              )}
              {(extractedText || summary || uploadedFile) && (
                <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* Intro Section */}
        <div className="text-center mb-10 animate-fade-in">
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your medical report (PDF or JPG) and get an AI-powered summary in simple language
          </p>
        </div>

        {/* File Upload Section */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <FileUpload
            onTextExtracted={setExtractedText}
            onSummary={handleSummaryGenerated}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            isDemoMode={isDemoMode}
            setIsDemoMode={setIsDemoMode}
          />
        </div>

        {/* Summary Display */}
        {(extractedText || summary) && (
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <SummaryDisplay
              extractedText={extractedText}
              summary={summary}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {/* Features */}
        <div className="mt-16 grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="bg-card p-5 md:p-6 rounded-xl border border-border shadow-soft hover:shadow-medium transition-all duration-300">
            <Sparkles className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-base md:text-lg mb-2">AI-Powered</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Uses Google's Gemini API to provide accurate, easy-to-understand summaries
            </p>
          </div>
          <div className="bg-card p-5 md:p-6 rounded-xl border border-border shadow-soft hover:shadow-medium transition-all duration-300">
            <FileText className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-base md:text-lg mb-2">Multiple Formats</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Supports both PDF documents and JPG/PNG images with OCR technology
            </p>
          </div>
          <div className="bg-card p-5 md:p-6 rounded-xl border border-border shadow-soft hover:shadow-medium transition-all duration-300 sm:col-span-2 md:col-span-1">
            <svg className="w-8 h-8 text-primary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="font-semibold text-base md:text-lg mb-2">Private & Secure</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              All processing happens in your browser. Your data never leaves your device
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Index;
