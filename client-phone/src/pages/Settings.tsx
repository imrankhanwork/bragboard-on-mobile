// src/pages/SettingsPage.tsx

import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { TopContributors } from "../components/TopContributors";
import { DepartmentPerformance  } from "../components/DepartmentPerformance";
import { QuickLinks } from "../components/QuickLinks";
import { User, Lock, Bell, Upload, UserRoundX, ChartNoAxesGantt, AtSign } from "lucide-react";
import api from "../api/api";
import { User as UserType } from "../types";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  const [avatar, setAvatar] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = async () => {
    if (!currentPassword || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await api.changeMyPassword({
        current_password: currentPassword,
        new_password: password
      });

      alert("Password updated successfully");

      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");

    } catch (e: any) {
      alert(e?.response?.data?.detail || "Current password is incorrect");
    }
  };

  const handleDeactivateAccount = async () => {
    if (!confirm("Are you sure? This will deactivate your account.")) return;

    try {
      await api.deactivateMe();
      localStorage.clear();
      window.location.href = "/login";
    } catch {
      alert("Failed to deactivate account");
    }
  };
  
  useEffect(() => {
    api.getCurrentUser().then((u) => {
      setCurrentUser(u);
      const parts = (u.full_name || "").split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" "));
      setEmail(u.email || "");
      setRole(u.user_type || "");
      setLocation(u.department || "");
      setBio(u.bio || "");
      setAvatar(u.profile_picture_url || "");
    });
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!currentUser) return;

    const payload: any = {
      full_name: `${firstName} ${lastName}`.trim(),
      email,
      department: location,
      bio,
      profile_picture_url: avatar,
    };

    if (password) {
      if (password !== confirmPassword) return alert("Passwords do not match");
      payload.password = password;
    }

    const updatedUser = await api.updateMe(payload);
    setCurrentUser(updatedUser);
    localStorage.setItem("bragboard_user", JSON.stringify(updatedUser));
    alert("Profile updated successfully");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-2">

          <Card className="p-4 shadow-soft-lg border border-border bg-card rounded-2xl">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-foreground">Account Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your account preferences
              </p>
            </div>

              {/* PROFILE */}
                <div className="flex items-center gap-6 bg-muted/30 p-4 rounded-xl">
                  <Avatar className="w-24 h-24 ring-4 ring-primary/10">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>{firstName[0]}{lastName[0]}</AvatarFallback>
                  </Avatar>

                  <Button variant="outline" onClick={() => document.getElementById("avatar-upload")?.click()}>
                    <Upload className="w-4 h-4 mr-2" /> Upload Photo
                  </Button>
                  <input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarUpload} />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>First Name</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                  <div><Label>Last Name</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} /></div>
                </div>

                <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label>Department</Label><Input value={location} onChange={e => setLocation(e.target.value)} /></div>
                <div><Label>Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} /></div>
                <div className="flex justify-end space-y-2 mt-4">
                  <Button onClick={handleSave} className="btn-primary-glow">
                    Save Changes
                  </Button>
                </div>             
          </Card>
          <Card className="p-4 shadow-soft-lg border border-border bg-card rounded-2xl">
            {/* SECURITY */}
            <div>
              <Label>Current Password</Label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)}/>
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <div className="flex justify-end space-y-2 mt-4">
              <Button onClick={handlePasswordChange} className="btn-primary-glow">
                  Save Changes
              </Button>
            </div>
          </Card>
            
            {/* MANAGE */}
          <Card className="p-4 shadow-soft-lg border border-border bg-card rounded-2xl">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-red-200 bg-red-50 space-y-2">
                <p className="text-sm text-red-700 font-medium">Danger Zone</p>
                <p className="text-xs text-red-600">
                  Deactivating your account will hide your profile and disable access.
                  You can contact support to restore it.
                </p>
                <Button
                  variant="destructive"
                  className="mt-2"
                  onClick={handleDeactivateAccount}
                >
                  Deactivate My Account
                </Button>
              </div>
            </div>
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
