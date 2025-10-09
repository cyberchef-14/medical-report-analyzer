import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataVisualization from "@/components/DataVisualization";
import ThemeToggle from "@/components/ThemeToggle";
import ChatBot from "@/components/ChatBot";
import { FileText, LogOut, BarChart3, FileStack } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface MedicalReport {
  id: string;
  report_name: string;
  summary: string | null;
  created_at: string;
  extracted_text: string | null;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadReports(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadReports(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadReports = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("medical_reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/")}>
                <FileStack className="w-4 h-4 mr-2" />
                New Report
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports">
              <FileStack className="w-4 h-4 mr-2" />
              My Reports
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4 mt-6">
            {reports.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Reports Yet</CardTitle>
                  <CardDescription>Start by uploading your first medical report</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/")}>Upload Report</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <CardTitle>{report.report_name}</CardTitle>
                      <CardDescription>
                        {new Date(report.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {report.summary && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Summary:</h4>
                          <p className="text-sm text-muted-foreground">{report.summary}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <DataVisualization reports={reports} />
          </TabsContent>
        </Tabs>
      </main>
      <ChatBot />
    </div>
  );
};

export default Dashboard;