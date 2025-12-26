import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { format } from "date-fns";

interface VitalData {
  date: string;
  systolic?: number | null;
  diastolic?: number | null;
  weight?: number | null;
}

interface VitalsChartProps {
  data: VitalData[];
}

export function VitalsChart({ data }: VitalsChartProps) {
  // Process data for the chart - reverse to show oldest first
  const chartData = [...data]
    .reverse()
    .filter(d => d.systolic || d.diastolic || d.weight)
    .map((d) => ({
      date: format(new Date(d.date), "MMM d"),
      fullDate: d.date,
      systolic: d.systolic || undefined,
      diastolic: d.diastolic || undefined,
      weight: d.weight || undefined,
    }));

  if (chartData.length < 2) {
    return null; // Need at least 2 data points for a meaningful chart
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-500" />
          Vitals Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="bp" 
                orientation="left"
                domain={[60, 200]}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'BP (mmHg)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="weight" 
                orientation="right"
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Weight (kg)', angle: 90, position: 'insideRight', fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line
                yAxisId="bp"
                type="monotone"
                dataKey="systolic"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Systolic BP"
                connectNulls
              />
              <Line
                yAxisId="bp"
                type="monotone"
                dataKey="diastolic"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Diastolic BP"
                connectNulls
              />
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="weight"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Weight"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
