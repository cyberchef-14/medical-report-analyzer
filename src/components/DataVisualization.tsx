import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";

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

const DataVisualization = ({ reports }: DataVisualizationProps) => {
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

  const chartConfig = {
    reports: {
      label: "Reports",
      color: "hsl(var(--primary))",
    },
    count: {
      label: "Count",
      color: "hsl(var(--primary))",
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