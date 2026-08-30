import { Trophy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Props = {
  user: any;
};

export default function TopPerformerCard({ user }: Props) {
  if (!user) return null;

  return (
    <section className="p-8 shadow-lg border border-gray-200 bg-gradient-to-br from-indigo-50 to-transparent mb-4 rounded-xl"
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-600">
          {user.name.charAt(0)}
        </div>

        <div>
          <p className="text-sm text-indigo-600 font-medium">
            Top Performer This Month
          </p>

          <h1 className="text-2xl font-semibold mt-1">{user.name}</h1>

          <div className="flex items-center gap-1 mt-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <p className="text-2xl font-semibold">{user.points}</p>
            <p className="text-sm text-gray-600">Points</p>
          </div>

          <div className="mt-2 flex gap-6 text-sm">
            <Metric label="Shouts" value={user.shouts} />
            <Metric label="Tagged" value={user.tagged} />
            <Metric label="Reactions" value={user.reactions} />
            <Metric label="Comments" value={user.comments} />
          </div>
        </div>
        <div className="ml-auto ml-2 md:mr-0">
          <Select defaultValue="30days">
            <SelectTrigger className="m-0 w-36 h-9 border-gray-200 rounded-xl bg-gray-100 ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7days">Last Week</SelectItem>
              <SelectItem value="30days">Last Month</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
