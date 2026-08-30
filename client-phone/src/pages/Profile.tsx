// src/pages/UserProfilePage.tsx

import { useEffect, useState } from "react";
import { TopContributors } from "../components/TopContributors";
import { TrendingTags } from "../components/TrendingTags";
import { QuickLinks } from "../components/QuickLinks";
import type { Page } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Mail, Calendar, Award, Star, ThumbsUp } from "lucide-react";
import api from "../api/api";
import { User } from "../types";
import { DepartmentPerformance } from "@/components/DepartmentPerformance";

interface UserProfilePageProps {
  userId?: number | null;
  onNavigate: (page: Page) => void;
}

export function UserProfilePage({ userId, onNavigate }: UserProfilePageProps) {
  const [activeTab, setActiveTab] = useState("activity");
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const me = await api.getCurrentUser();
        setCurrentUserId(me.user_id);

        if (!userId || String(userId) === String(me.user_id)) {
          setProfileUser(me);
        } else {
          const other = await api.getUserById(userId);
          setProfileUser(other);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  if (loading || !profileUser) {
    return <div className="text-sm text-muted-foreground">Loading profile…</div>;
  }

  const profileData = {
    name: profileUser.full_name || profileUser.username,
    role: profileUser.user_type,
    email: profileUser.email,
    department: profileUser.department || "—",
    joinedDate: "—",
    avatar: profileUser.profile_picture_url,
    bio: profileUser.bio || "No bio provided.",
    stats: { totalShouts: 0, reactionsReceived: 0, badges: 0 },
  };

  const initials = profileData.name.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">

          {/* Profile Header */}
          <Card className="p-8 rounded-2xl shadow-soft-lg bg-card border border-border">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="w-28 h-28 ring-4 ring-primary/10">
                <AvatarImage src={profileData.avatar} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{profileData.name}</h1>
                    <p className="text-muted-foreground">{profileData.role}</p>
                  </div>

                  {profileUser.user_id === currentUserId && (
                    <Button variant="outline" onClick={() => onNavigate("settings")}>
                      Edit Profile
                    </Button>
                  )}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {profileData.bio}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail size={14} /> {profileData.email}</span>
                  <span className="flex items-center gap-1"><Award size={14} /> {profileData.department}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> Joined {profileData.joinedDate}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border">
              <Stat label="Total Shouts" value={profileData.stats.totalShouts} icon={<ThumbsUp />} color="text-sky-600 bg-sky-50" />
              <Stat label="Reactions" value={profileData.stats.reactionsReceived} icon={<Star />} color="text-purple-600 bg-purple-50" />
              <Stat label="Badges" value={profileData.stats.badges} icon={<Award />} color="text-emerald-600 bg-emerald-50" />
            </div>
          </Card>

          {/* Tabs */}
          <Card className="p-6 rounded-2xl shadow-soft-lg bg-card border border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 bg-muted/40 rounded-xl p-1">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="activity">Posts</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
                <TabsTrigger value="report">Report</TabsTrigger>
              </TabsList>

              <TabsContent value="about">
                <Section title="About" text={profileData.bio} />
              </TabsContent>

              <TabsContent value="activity">
                <Section title="Posts" text="User posts will appear here." />
              </TabsContent>

              <TabsContent value="badges">
                <Section title="Badges" text="Badges coming soon." />
              </TabsContent>

              <TabsContent value="report">
                <Section title="Report User" text="Report functionality coming soon." />
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-2">
          <TopContributors />
          <DepartmentPerformance />
          <QuickLinks />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, color }: any) {
  return (
    <div className={`p-4 rounded-xl text-center ${color}`}>
      <div className="flex justify-center items-center gap-2 text-xl font-semibold">
        {icon}
        {value}
      </div>
      <p className="text-xs mt-1 text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div className="p-6 rounded-xl bg-muted/20">
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

export default UserProfilePage;
