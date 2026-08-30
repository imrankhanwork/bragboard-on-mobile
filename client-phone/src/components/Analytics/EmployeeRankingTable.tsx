import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Props = {
  employees: any[];
};

export default function EmployeeRankingTable({ employees }: Props) {

  // 🔧 MUST be inside the component
  const [rankFilter, setRankFilter] = useState<"all" | "5" | "10">("all");

  const visibleEmployees =
    rankFilter === "all"
      ? employees
      : employees.slice(0, Number(rankFilter));

  return (
    <section className="w-full">
      <div className="bg-white rounded-xl border shadow-soft-lg w-full p-2 overflow-x-auto">

        <div className="px-4 py-3 border-b flex items-center">
          <h2 className="font-medium text-foreground">
            Employee Rankings
          </h2>

          <div className="ml-auto">
            <Select value={rankFilter} onValueChange={(v) => setRankFilter(v as any)}>
              <SelectTrigger className="w-36 h-9 rounded-xl border-gray-200">
                <SelectValue />
              </SelectTrigger>

              <SelectContent className="rounded-lg">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-2 py-4 text-left">Rank</th>
              <th className="px-2 py-4 text-left">Employee</th>
              <th className="px-2 py-4 text-left">Department</th>
              <th className="px-2 py-4 text-right">Points</th>
              <th className="px-2 py-4 text-right">Shouts</th>
              <th className="px-2 py-4 text-right">Reactions</th>
              <th className="px-2 py-4 text-right">Comments</th>
              <th className="px-2 py-4 text-right">Tagged</th>
              <th className="px-2 py-4 text-right">Performance</th>
            </tr>
          </thead>

          <tbody>
            {visibleEmployees.map((u, i) => (
              <tr key={u.id} className="border-t hover:bg-gray-50 transition">
                <td className="px-3 py-2">#{i + 1}</td>
                <td className="px-3 py-2 font-medium">{u.name}</td>
                <td className="px-3 py-2">{u.department}</td>
                <td className="px-3 py-2 text-right">{u.points}</td>
                <td className="px-3 py-2 text-right">{u.shouts}</td>
                <td className="px-3 py-2 text-right">{u.reactions}</td>
                <td className="px-3 py-2 text-right">{u.comments}</td>
                <td className="px-3 py-2 text-right">{u.tagged}</td>
                <td className="px-3 py-2 text-right text-emerald-600 font-medium">
                  +{Math.floor(u.points / 2)}%
                  <ArrowUpRight className="inline ml-1" size={14} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </section>
  );
}
