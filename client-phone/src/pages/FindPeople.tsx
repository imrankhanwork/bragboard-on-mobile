// src/pages/FindPeople.tsx
import useUsers from "../hooks/useUsers";
import { useMemo, useState, useEffect } from "react";
import { TopContributors } from "../components/TopContributors";
import { TrendingTags } from "../components/TrendingTags";
import { DepartmentPerformance } from "../components/DepartmentPerformance";
import { QuickLinks } from "../components/QuickLinks";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import api from "../api/api";

import { Card } from "@/components/ui/card";
import { CheckCircle, Plus, Award, Sparkles, Users, TrendingUp, MessageCircle } from "lucide-react";



const DEPARTMENTS = [
  "All",
  "Design",
  "Engineering",
  "Product",
  "Marketing",
  "Sales",
  "Leadership",
  "Customer Success",
  "QA",
  "Finance",
];

interface FindPeoplePageProps {
  onViewProfile?: (userId?: number) => void;
  onBack?: () => void;
}

export function FindPeoplePage({ onViewProfile }: FindPeoplePageProps) {
  const { users, loading } = useUsers();

  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [followMap, setFollowMap] = useState<Record<number, boolean>>({});

  // Convert backend users → UI shape
  const filtered = useMemo(() => {
    return users
      .filter((u) => {
        if (deptFilter !== "All" && u.department !== deptFilter) return false;
        if (
          query &&
          !(
            u.full_name?.toLowerCase().includes(query.toLowerCase()) ||
            u.username?.toLowerCase().includes(query.toLowerCase())
          )
        )
          return false;
        return true;
      })
      .slice(0, 10);
  }, [users, deptFilter, query]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        <Card className="lg:col-span-2 p-6 card-elevated">
          <div className="flex justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">All Employees</h2>
            <div className="flex items-center justify-end mb-4">
              <div className="flex items-center gap-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="h-9 px-3 rounded-full border border-gray-200 bg-white text-sm"
                  style={{ borderRadius: "999px" }}
                />

                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger
                    className="w-40 h-9 text-sm bg-gray-50 border-gray-200"
                    style={{ borderRadius: "999px" }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ borderRadius: "var(--radius-2xl)" }}>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {/* People Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((u) => (
              <div
                key={u.user_id}
                className="bg-white rounded-3xl overflow-hidden shadow-soft-lg border border-gray-100"
                style={{ borderRadius: "1.5rem" }}
              >
                {/* top image */}
                <div className="w-full h-40 bg-gray-100 overflow-hidden">
                  <img
                    src={u.profile_picture_url}
                    alt={u.full_name || u.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* body */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="pr-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900 leading-tight">
                          {u.full_name || u.username}
                        </h3>
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 rounded-full">
                          <CheckCircle className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        @{u.username ?? (u.email ? u.email.split("@")[0] : "unknown")}
                      </div>
                      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                        {u.bio || "No bio provided"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        className={`h-9 px-4 flex items-center gap-2 shadow-sm ${
                          followMap[u.user_id]
                            ? "bg-white border border-gray-200 text-gray-800"
                            : "bg-white text-gray-900"
                        }`}
                        style={{
                          borderRadius: "999px",
                          boxShadow: "0 4px 10px rgba(8,10,15,0.06)",
                        }}
                        onClick={() =>
                          setFollowMap((s) => ({
                            ...s,
                            [u.user_id]: !s[u.user_id],
                          }))
                        }
                      >
                        <span className="text-sm">
                          {followMap[u.user_id] ? "Following" : "Follow"}
                        </span>
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        className="btn-primary-glow"
                        style={{
                          borderRadius: "999px",
                        }}
                        onClick={() => onViewProfile?.(u.user_id)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div className="flex flex-col gap-3">
          <TopContributors />
          <DepartmentPerformance />
          <QuickLinks />
        </div>       
      </div>
    </div>
  );
}
export default FindPeoplePage ;