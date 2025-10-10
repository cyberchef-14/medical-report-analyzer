import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, ScatterChart, Scatter, CartesianGrid } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DataVisualizationProps {
  reports: Array<{
    id: string;
    report_name: string;
    created_at: string;
    summary?: string;
  }>;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const extractDiseases = (report: any): string[] => {
  const text = (report.summary || report.extracted_text || "").toLowerCase();
  const commonDiseases = [
    "diabetes", "hypertension", "asthma", "arthritis", "migraine",
    "anemia", "thyroid", "cholesterol", "infection", "allergy",
    "covid", "flu", "pneumonia", "bronchitis", "cancer"
  ];
  
  return commonDiseases.filter(disease => text.includes(disease));
};

const extractNumericValue = (text: string, parameter: string): number | null => {
  const lowerText = text.toLowerCase();
  const patterns = [
    new RegExp(`${parameter}[:\\s]+([0-9.]+)`, 'i'),
    new RegExp(`${parameter}[\\s]*:[\\s]*([0-9.]+)`, 'i'),
    new RegExp(`([0-9.]+)[\\s]*${parameter}`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      const value = parseFloat(match[1]);
      if (!isNaN(value)) return value;
    }
  }
  return null;
};

const extractLabValues = (report: any) => {
  const text = (report.summary || report.extracted_text || "").toLowerCase();
  return {
    hemoglobin: extractNumericValue(text, 'hemoglobin|hb'),
    iron: extractNumericValue(text, 'iron|fe'),
    bloodSugar: extractNumericValue(text, 'glucose|blood sugar|sugar'),
    cholesterol: extractNumericValue(text, 'cholesterol'),
    bmi: extractNumericValue(text, 'bmi|body mass index'),
    weight: extractNumericValue(text, 'weight'),
  };
};

const DataVisualization = ({ reports }: DataVisualizationProps) => {
  const [criticalWarnings, setCriticalWarnings] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (reports.length > 0) {
      analyzeCriticalResults();
    }
  }, [reports]);

  const analyzeCriticalResults = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-critical-results', {
        body: { reports }
      });

      if (error) throw error;
      setCriticalWarnings(data?.warnings || []);
    } catch (error) {
      console.error('Error analyzing critical results:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  // Group reports by month
  const reportsByMonth = reports.reduce((acc: Record<string, number>, report) => {
    const month = new Date(report.created_at).toLocaleDateString("en-US", { month: "short" });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const monthlyData = Object.entries(reportsByMonth).map(([month, count]) => ({
    month,
    reports: count,
  }));

  // Calculate report statistics
  const totalReports = reports.length;
  const reportsWithSummary = reports.filter((r) => r.summary).length;
  const reportsWithoutSummary = totalReports - reportsWithSummary;

  const summaryData = [
    { name: "With Summary", value: reportsWithSummary },
    { name: "Without Summary", value: reportsWithoutSummary },
  ];

  // Extract and count diseases across all reports
  const diseaseCount: Record<string, number> = {};
  const diseaseTimeline: Record<string, { month: string; count: number }[]> = {};

  reports.forEach(report => {
    const diseases = extractDiseases(report);
    const month = new Date(report.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    
    diseases.forEach(disease => {
      diseaseCount[disease] = (diseaseCount[disease] || 0) + 1;
      
      if (!diseaseTimeline[disease]) {
        diseaseTimeline[disease] = [];
      }
      const existing = diseaseTimeline[disease].find(d => d.month === month);
      if (existing) {
        existing.count += 1;
      } else {
        diseaseTimeline[disease].push({ month, count: 1 });
      }
    });
  });

  const diseaseData = Object.entries(diseaseCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Extract correlation data
  const correlationData = reports.map(report => {
    const values = extractLabValues(report);
    const date = new Date(report.created_at);
    return {
      date: date.toLocaleDateString(),
      ...values,
      reportName: report.report_name,
    };
  }).filter(d => d.hemoglobin !== null || d.iron !== null || d.bloodSugar !== null);

  const hemoglobinIronData = correlationData.filter(d => d.hemoglobin !== null && d.iron !== null);
  const bloodSugarBMIData = correlationData.filter(d => d.bloodSugar !== null && d.bmi !== null);

  const chartConfig = {
    reports: {
      label: "Reports",
      color: "hsl(var(--primary))",
    },
    count: {
      label: "Count",
      color: "hsl(var(--primary))",
    },
    hemoglobin: {
      label: "Hemoglobin",
      color: "hsl(var(--chart-1))",
    },
    iron: {
      label: "Iron",
      color: "hsl(var(--chart-2))",
    },
    bloodSugar: {
      label: "Blood Sugar",
      color: "hsl(var(--chart-3))",
    },
    bmi: {
      label: "BMI",
      color: "hsl(var(--chart-4))",
    },
  };

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Visualization</CardTitle>
          <CardDescription>No reports to visualize yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Upload and process your first medical report to see visualizations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Warnings */}
      {criticalWarnings.length > 0 && (
        <div className="space-y-3">
          {criticalWarnings.map((warning, index) => (
            <Alert 
              key={index} 
              variant={warning.severity === 'critical' ? 'destructive' : 'default'}
              className="border-2"
            >
              {warning.severity === 'critical' ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <AlertTitle className="font-bold">
                {warning.parameter}: {warning.value}
              </AlertTitle>
              <AlertDescription>
                <p className="font-medium">{warning.message}</p>
                <p className="text-sm mt-1 opacity-80">
                  From: {warning.reportName} ({new Date(warning.date).toLocaleDateString()})
                </p>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Reports Over Time</CardTitle>
          <CardDescription>Number of reports processed each month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="reports" fill="var(--color-reports)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disease Comparison</CardTitle>
          <CardDescription>Most common conditions found in your reports</CardDescription>
        </CardHeader>
        <CardContent>
          {diseaseData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diseaseData} layout="horizontal">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No disease data available yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Correlation: Hemoglobin vs Iron */}
      {hemoglobinIronData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Hemoglobin vs Iron Correlation</CardTitle>
            <CardDescription>Relationship between hemoglobin and iron levels across reports</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="hemoglobin" 
                    name="Hemoglobin" 
                    unit=" g/dL"
                    label={{ value: 'Hemoglobin (g/dL)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="iron" 
                    name="Iron" 
                    unit=" μg/dL"
                    label={{ value: 'Iron (μg/dL)', angle: -90, position: 'insideLeft' }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
                  <Scatter 
                    data={hemoglobinIronData} 
                    fill="var(--color-hemoglobin)"
                    name="Reports"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Correlation: Blood Sugar vs BMI */}
      {bloodSugarBMIData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Blood Sugar vs BMI Correlation</CardTitle>
            <CardDescription>Relationship between blood sugar and BMI across reports</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="bloodSugar" 
                    name="Blood Sugar" 
                    unit=" mg/dL"
                    label={{ value: 'Blood Sugar (mg/dL)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="bmi" 
                    name="BMI"
                    label={{ value: 'BMI', angle: -90, position: 'insideLeft' }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
                  <Scatter 
                    data={bloodSugarBMIData} 
                    fill="var(--color-bloodSugar)"
                    name="Reports"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
          <CardDescription>Reports with and without AI summaries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summaryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataVisualization;