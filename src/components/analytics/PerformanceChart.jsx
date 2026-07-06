import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function PerformanceChart({ data, type = 'line', title, dataKey, color = '#8b3dff' }) {
  const ChartComponent = type === 'line' ? LineChart : BarChart;
  const DataComponent = type === 'line' ? Line : Bar;

  return (
    <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip
              contentStyle={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <DataComponent type="monotone" dataKey={dataKey} stroke={color} fill={color} strokeWidth={2} />
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}