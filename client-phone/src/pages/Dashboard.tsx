// src/pages/DashboardPage.tsx
import usePosts from "../hooks/usePosts";
import useUsers from "../hooks/useUsers";
import { buildUserMap } from "../hooks/userMap";
import { useMemo, useState, useEffect } from "react";
import ShoutCard from "../components/ShoutCard";
import { TopContributors } from "../components/TopContributors";
import { TrendingTags } from "../components/TrendingTags";
import { DepartmentPerformance } from "../components/DepartmentPerformance";
import { QuickLinks } from "../components/QuickLinks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import api from "../api/api";



import { MainLayout } from "@/components/layout/MainLayout";
import type { Page, CurrentUser } from "@/types/index";

const DEPARTMENTS = [
  "All Departments",
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



interface DashboardPageProps {
  onViewShout?: () => void;
  onViewFindPeople?: () => void;
}


export function DashboardPage({
  onViewShout,
  onViewFindPeople,
}: DashboardPageProps) {
  const [departmentFilter, setDepartmentFilter] = useState<string>("All Departments");
  const [timeFilter, setTimeFilter] = useState<string>("7days");
  const [reactionSort, setReactionSort] = useState<string>("All Departments");

  const {
    posts: apiPosts,
    loading: postsLoading,
    fetchPosts,
    deletePost,
  } = usePosts();

  const { users } = useUsers();
  const userMap = useMemo(() => buildUserMap(users), [users]);

  const [currentUserId, setCurrentUserId] = useState<
    number | string | undefined
  >(undefined);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] =
    useState<boolean>(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await api.getCurrentUser();
        if (u) {
          setCurrentUserId(u.user_id);
          setCurrentUserIsAdmin(
            u.user_type === "admin" || u.user_type === "moderator"
          );
        }
      } catch {
      }
    };
    loadUser();
  }, []);

  // Map API posts into the shape used by ShoutCard
  const apiShouts = useMemo(() => {
    if (!Array.isArray(apiPosts) || apiPosts.length === 0) return [];

    return apiPosts.map((p: any) => {
      console.log("RAW POST FROM API:", p);
      console.log("tagged_users:", p.tagged_users);
      console.log("taggedUsers:", p.taggedUsers);

      const id = p.id ?? p.post_id ?? p.postId;

      // USE AUTHOR FROM POST FIRST (FIX)
      const author = p.author;
      const fallbackUser =
        author?.id !== undefined ? userMap[author.id] : undefined;

      const sender = author
        ? {
            id: author.id,
            name:
              author.full_name ||
              author.username ||
              fallbackUser?.full_name ||
              fallbackUser?.username ||
              "Unknown",
            avatar:
              author.profile_picture_url ||
              fallbackUser?.profile_picture_url,
          }
        : fallbackUser
        ? {
            id: fallbackUser.user_id,
            name: fallbackUser.full_name || fallbackUser.username,
            avatar: fallbackUser.profile_picture_url,
          }
        : {
            id: 0,
            name: "Unknown",
            avatar: undefined,
          };

      const recipients = Array.isArray(p.recipients)
        ? p.recipients.map((r: any) =>
            typeof r === "string"
              ? r
              : r?.name ?? r?.username ?? String(r)
          )
        : [];

      const message = p.description ?? "";
      const timestamp = p.created_at ?? "";
      const imageUrl = p.image_url ?? undefined;

      const reactions =
        p.reactions_count ??
        p.reactions ??
        p.reactionCount ?? {
          clap: 0,
          star: 0,
          heart: 0,
          comment: 0,
        };

      const department =
        (fallbackUser?.department ?? "General") as string;

      const ageDays = p.created_at
        ? Math.floor(
            (Date.now() - new Date(p.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      const rawTags =
        Array.isArray(p.tagged_users) ? p.tagged_users :
        Array.isArray(p.taggedUsers) ? p.taggedUsers : [];

      const taggedUsers = rawTags
        .map((u: any) =>
          typeof u === "string"
            ? u
            : u?.username ?? u?.name ?? u?.full_name ?? String(u)
        )
        .filter(Boolean);



      return {
        id,
        sender,
        message,
        timestamp,
        imageUrl,
        reactions,
        ageDays,
        department,
        taggedUsers,
      };
    });
  }, [apiPosts, userMap]);

  const departments = useMemo(() => {
    const set = new Set<string>(
      apiShouts.map((s) => s.department || "General")
    );
    return ["All Departments", ...Array.from(set)];
  }, [apiShouts]);

  const filteredShouts = useMemo(() => {
    const maxDays =
      timeFilter === "7days"
        ? 7
        : timeFilter === "30days"
        ? 30
        : 90;

    let list = apiShouts.filter((s) => {
      const passDept =
        departmentFilter === "All Departments" ||
        s.department === departmentFilter;
      const passTime = (s.ageDays ?? 0) <= maxDays;
      return passDept && passTime;
    });

    if (reactionSort !== "All Departments") {
      list = list.sort((a, b) => {
        const ra = (a.reactions as any)[reactionSort] ?? 0;
        const rb = (b.reactions as any)[reactionSort] ?? 0;
        return rb - ra;
      });
    } else {
      list = list.sort((a, b) => {
        const ta =
          (a.reactions?.clap ?? 0) +
          (a.reactions?.star ?? 0) +
          (a.reactions?.heart ?? 0) +
          (a.reactions?.comment ?? 0);
        const tb =
          (b.reactions?.clap ?? 0) +
          (b.reactions?.star ?? 0) +
          (b.reactions?.heart ?? 0) +
          (b.reactions?.comment ?? 0);
        return tb - ta;
      });
    }

    return list;
  }, [departmentFilter, timeFilter, reactionSort, apiShouts]);

  useEffect(() => {
    fetchPosts().catch(() => {});
  }, []);

  return (
    <div className="space-y-3">

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2">            
              <h2 className="text-ml font-semibold text-gray-500 ml-2">Recent Shout Outs</h2>
              <div className="flex items-center gap-3">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger
                    className="w-40 h-9 text-sm bg-gray-50 border-gray-200 rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select defaultValue="lastmonth">
                  <SelectTrigger
                    className="w-40 h-9 text-sm bg-gray-50 border-gray-200 rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="lastmonth">Last month</SelectItem>
                    <SelectItem value="last3months">Last 3 months</SelectItem>
                    <SelectItem value="last6months">Last 6 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          <div className="space-y-4">
              {postsLoading ? (
                <div className="p-4 text-sm text-gray-500">
                  Loading posts...
                </div>
              ) : filteredShouts.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No shout-outs found.
                </div>
              ) : (
                filteredShouts.map((s: any) => (
                  <ShoutCard
                    key={s.id}
                    shout={s}
                    currentUserId={
                      currentUserId !== undefined
                        ? Number(currentUserId)
                        : undefined
                    }
                    currentUserIsAdmin={currentUserIsAdmin}
                  />
                ))
              )}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <TopContributors />
          <DepartmentPerformance />
          <QuickLinks />
        </div>       
      </div>
    </div>
  );
}
export default DashboardPage;
