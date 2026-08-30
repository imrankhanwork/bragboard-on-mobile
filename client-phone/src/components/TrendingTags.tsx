import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { TrendingUp } from "lucide-react";

const tags = [
  { name: "Q4Launch", count: 45 },
  { name: "TeamWin", count: 38 },
  { name: "CustomerSuccess", count: 32 },
  { name: "Innovation", count: 28 },
  { name: "Milestone", count: 24 },
  { name: "BehindTheScenes", count: 21 },
  { name: "ProductUpdate", count: 19 },
  { name: "Collaboration", count: 17 },
];

export function TrendingTags() {
  return (
    <Card className="p-3 shadow-soft-lg border border-gray-200 bg-white" style={{ borderRadius: 'var(--radius-2xl)' }}>
      <div className="flex items-center gap-1.5 mb-0">
        <TrendingUp className="w-4 h-4 text-blue-600" />
        <h3 className="text-gray-900">Trending Tags</h3>
      </div>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, index) => (
          <Badge
            key={index}
            variant="outline"
            className="cursor-pointer hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 transition-colors border-gray-200"
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            #{tag.name} <span className="ml-1 text-gray-500">({tag.count})</span>
          </Badge>
        ))}
      </div>
    </Card>
  );
}