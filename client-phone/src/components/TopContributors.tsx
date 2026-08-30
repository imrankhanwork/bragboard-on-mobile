import { useEffect, useState } from "react";
import api from "../api/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card } from "./ui/card";
import { Trophy, Award } from "lucide-react";

interface Contributor {
  full_name: string;
  avatar?: string;
  reactions: number;
}

export function TopContributors() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await api.getTopContributors(5);
        if (mounted) setContributors(data ?? []);
      } catch (e) {
        console.error("Failed to load top contributors", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();

  return (
    <Card className="p-4 card-elevated">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-yellow-600" />
        <h2 className="text-base font-semibold text-foreground">
          Top Contributors
        </h2>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : contributors.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data available</p>
      ) : (
        <div className="space-y-3">
          {contributors.map((c, index) => (
            <div key={c.full_name} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-medium text-primary-foreground">
                {index + 1}
              </div>

              <Avatar className="w-8 h-8 ring-2 ring-gray-100">
                <AvatarImage src={c.avatar} />
                <AvatarFallback>{getInitials(c.full_name)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">
                  {c.full_name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {c.reactions} shout outs
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium text-foreground">
                  #{index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
