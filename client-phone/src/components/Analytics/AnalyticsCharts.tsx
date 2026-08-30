import { useEffect, useState } from "react";
import api from "@/api/api";
import { Card } from "@/components/ui/card";

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function AnalyticsCharts() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await api.getChartData();
      setData(res.weekly);
    }
    load();
  }, []);

  if (!data.length) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">

      <Card className="p-4 rounded-xl bg-gradient-to-br from-card via-card to-muted/40 border border-border/40">
        <h3 className="text-gray-900 mb-6">Shout-outs Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="shouts" fill="#860ee9d5" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4 rounded-xl bg-gradient-to-br from-card via-card to-muted/40 border border-border/40">
        <h3 className="text-gray-900 mb-6">Reactions Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="reactions" stroke="#A855F7" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

    </div>
  );
}
