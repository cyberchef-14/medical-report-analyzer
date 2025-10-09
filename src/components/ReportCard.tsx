import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Share2, Trash2, Star } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface ReportCardProps {
  report: {
    id: string;
    report_name: string;
    summary: string;
    created_at: string;
    extracted_text: string;
    is_favorite?: boolean;
  };
  onDelete: (id: string) => void;
  onExport: (report: any) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

const ReportCard = ({ report, onDelete, onExport, onToggleFavorite }: ReportCardProps) => {
  const [isFavorite, setIsFavorite] = useState(report.is_favorite || false);

  const handleToggleFavorite = () => {
    const newFavorite = !isFavorite;
    setIsFavorite(newFavorite);
    onToggleFavorite(report.id, newFavorite);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: report.report_name,
        text: report.summary,
      }).catch(() => {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(report.summary);
      });
    } else {
      navigator.clipboard.writeText(report.summary);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              {report.report_name}
            </CardTitle>
            <CardDescription>
              {format(new Date(report.created_at), "PPP")}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            className="flex-shrink-0"
          >
            <Star className={`w-5 h-5 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {report.summary || "No summary available"}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExport(report)}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(report.id)}
          className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground ml-auto"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReportCard;
