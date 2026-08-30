import { useEffect, useState } from "react";
import api from "../api/api";
import TopPerformerCard from "../components/Analytics/TopPerformerCard";
import EmployeeRankingTable from "../components/Analytics/EmployeeRankingTable";
import StatsGrid from "@/components/Analytics/StatsGrid";
import { TopContributors } from "../components/TopContributors";
import { QuickLinks } from "../components/QuickLinks";
import { DepartmentPerformance } from "@/components/DepartmentPerformance";

export default function LeaderboardPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await api.getCurrentUser();
        const admin = user.user_type === "admin" || user.user_type === "moderator";
        setIsAdmin(admin);

        if (!admin) {
          const data = await api.getLeaderboard();
          data.sort((a: any, b: any) => b.points - a.points);
          setEmployees(data);
        }
      } catch (err) {
        console.error("Leaderboard init error:", err);
        setIsAdmin(true); // Fail-safe: hide leaderboard if something goes wrong
      }
    };

    init();
  }, []);


  // Loading state
  if (isAdmin === null) {
    return <div className="p-6 text-sm text-gray-500">Loading leaderboard...</div>;
  }

  // Block Admins & Moderators
  if (isAdmin) {
    return (
      <div className="p-10 text-center text-gray-600">
        Leaderboard is available only for employees.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Stats Grid */}
      <StatsGrid />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

      {/* LEFT SIDE */}
      <div className="lg:col-span-2 space-y-2">
        {/* Top Performer */}
        {employees.length > 0 && <TopPerformerCard user={employees[0]} />}    
        <EmployeeRankingTable employees={employees} />
      </div>

        {/* RIGHT SIDE */}
        <div className="space-y-2">
          <TopContributors />
          <DepartmentPerformance />
          <QuickLinks />
        </div>

      </div>
    </div>
  );
}
