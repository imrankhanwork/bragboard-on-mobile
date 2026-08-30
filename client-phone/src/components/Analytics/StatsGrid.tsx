import { useEffect, useState } from "react";
import api from "@/api/api";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, Flag, Heart, Users, Building2, LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: number;
  change: string;
  icon: LucideIcon;
  color: string;
}

export default function StatsGrid() {
  const [stats, setStats] = useState<StatItem[]>([]);

  useEffect(() => {
    async function loadStats() {
      const data = await api.getAllStats();

      setStats([
        {
          label: "Total Reactions",
          value: Object.values(data.reactions).reduce((a: number, b: number) => a + b, 0),
          change: "+12%",
          icon: Heart,
          color: "from-pink-500 to-fuchsia-600",
        },
        {
          label: "Active Users",
          value: data.active_users,
          change: "+8%",
          icon: Users,
          color: "from-emerald-400 via-teal-500 to-cyan-500",
        },
        {
          label: "Departments",
          value: Object.keys(data.reactions).length,
          change: "+2%",
          icon: Building2,
          color: "from-amber-400 via-orange-500 to-red-500",
        },
        {
          label: "Reported Posts",
          value: data.reported_posts,
          change: "-3%",
          icon: Flag,
          color: "from-fuchsia-500 via-rose-500 to-orange-400",
        },
      ]);
    }

    loadStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <Card
            key={stat.label}
            className="p-4 card-hover border-0 shadow-sm bg-card"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>

                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-500">
                    {stat.change}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    vs last month
                  </span>
                </div>
              </div>

              <div
                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-button`}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
