import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface DataVisualizationProps {
  reports: Array<{
    id: string;
    report_name: string;
    created_at: string;
    summary?: string;
  }>;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

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

  const chartConfig = {
    reports: {
      label: "Reports",
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