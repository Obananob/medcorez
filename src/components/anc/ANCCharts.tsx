import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Activity, Scale, TrendingUp } from "lucide-react";

interface ANCVisitData {
  visit_date: string;
  gestational_age_weeks: number | null;
  gestational_age_days: number | null;
  fundal_height_cm: number | null;
  weight_kg: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
}

interface ANCChartsProps {
  visits: ANCVisitData[];
}

export function ANCCharts({ visits }: ANCChartsProps) {
  // Sort visits by date for proper charting
  const sortedVisits = [...visits].sort((a, b) => 
    new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
  );

  // Prepare growth chart data (GA vs Fundal Height)
  const growthData = sortedVisits
    .filter(v => v.gestational_age_weeks && v.fundal_height_cm)
    .map(v => ({
      ga: `${v.gestational_age_weeks}w`,
      gaNum: v.gestational_age_weeks,
      fundalHeight: v.fundal_height_cm,
    }));

  // Prepare vitals chart data (Weight and BP over time)
  const vitalsData = sortedVisits
    .filter(v => v.weight_kg || v.blood_pressure_systolic)
    .map(v => ({
      date: new Date(v.visit_date).toLocaleDateString("en-GB", { 
        day: "2-digit", 
        month: "short" 
      }),
      weight: v.weight_kg,
      systolic: v.blood_pressure_systolic,
      diastolic: v.blood_pressure_diastolic,
    }));

  if (growthData.length === 0 && vitalsData.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Growth Chart - Fundal Height vs Gestational Age */}
      {growthData.length > 0 && (
        <Card className="border-pink-200 dark:border-pink-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-pink-700 dark:text-pink-300">
              <TrendingUp className="h-4 w-4" />
              Fundal Height Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="ga" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    domain={['auto', 'auto']}
                    unit=" cm"
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${value} cm`, 'Fundal Height']}
                    labelFormatter={(label) => `Gestational Age: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fundalHeight" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Ideal: Fundal Height ≈ Gestational Age (±2cm)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Vitals Chart - Weight and BP over time */}
      {vitalsData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-500" />
              <Scale className="h-4 w-4 text-blue-500" />
              Weight & Blood Pressure Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vitalsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 11 }}
                    domain={['auto', 'auto']}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    domain={['auto', 'auto']}
                    className="text-muted-foreground"
                    hide
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="weight" 
                    name="Weight (kg)"
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                    connectNulls
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="systolic" 
                    name="Systolic"
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                    connectNulls
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="diastolic" 
                    name="Diastolic"
                    stroke="#f97316" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}