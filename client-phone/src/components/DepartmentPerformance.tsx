import { useEffect, useState } from "react";
import api from "../api/api";
import { Card } from "./ui/card";

type Stat = {
  department: string;
  reactions: number;
};

export function DepartmentPerformance() {
  const [data, setData] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await api.getDepartmentEngagement();
        if (mounted) setData(res ?? []);
      } catch (e) {
        console.error("Failed to load department performance", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const max = Math.max(...data.map(d => d.reactions), 1);

  return (
    <Card className="p-4 card-elevated">
      <h2 className="text-base font-semibold text-foreground mb-4">
        Department Performance
      </h2>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data available</p>
      ) : (
        <div className="space-y-3">
          {data.map(d => {
            const percent = (d.reactions / max) * 100;

            return (
              <div key={d.department} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{d.department}</span>
                  <span className="text-muted-foreground">
                    {d.reactions} shoutouts
                  </span>
                </div>

                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(percent, 6)}%`,
                      minWidth: "6%",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
