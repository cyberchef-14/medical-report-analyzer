import { FileText, Sparkles, Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadAsPDF } from "@/lib/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

interface SummaryDisplayProps {
  extractedText: string;
  summary: string;
  isProcessing: boolean;
}

const SummaryDisplay = ({ extractedText, summary, isProcessing }: SummaryDisplayProps) => {
  const { toast } = useToast();

  const downloadSummaryTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([summary], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "medical-report-summary.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Downloaded!",
      description: "Summary saved as TXT file",
    });
  };

  const downloadSummaryPdf = async () => {
    try {
      await downloadAsPDF(summary);
      toast({
        title: "Downloaded!",
        description: "Summary saved as PDF file",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-primary" />
              Report Analysis
            </CardTitle>
            <CardDescription>Your medical report summary and extracted text</CardDescription>
          </div>
          {summary && !isProcessing && (
            <div className="flex gap-2">
              <Button onClick={downloadSummaryTxt} variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">TXT</span>
              </Button>
              <Button onClick={downloadSummaryPdf} variant="outline" size="sm" className="gap-2">
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">AI Summary</TabsTrigger>
            <TabsTrigger value="extracted">Extracted Text</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            {isProcessing ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/6" />
              </div>
            ) : summary ? (
              <div className="prose prose-sm max-w-none">
                <div className="bg-primary/5 border-l-4 border-primary p-4 rounded">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {summary}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Summary will appear here after processing
              </p>
            )}
          </TabsContent>

          <TabsContent value="extracted" className="mt-4">
            {extractedText ? (
              <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap font-mono">
                  {extractedText}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Extracted text will appear here after upload
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SummaryDisplay;
