// src/pages/UserManagementPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../components/ui/select";
import { Trash, Edit, Plus, UserPlus } from "lucide-react";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";

import useUsers from "../hooks/useUsers";
import api from "@/api/api";

type UserType = "User" | "Moderator" | "Admin";

type LocalUser = {
  id?: string | number;
  fullName?: string;
  username?: string;
  email?: string;
  department?: string;
  type?: UserType;
  active?: boolean;
  avatar?: string;
  full_name?: string;
  user_type?: string;
  user_id?: number;
};

const DEPARTMENTS = [
  "Design",
  "Engineering",
  "Marketing",
  "Sales",
  "Product",
  "Leadership",
  "Customer Success",
  "Finance",
  "HR",
  "QA",
];

export function UserManagementPage() {
  const { users, fetchUsers, create, update, remove } = useUsers();
  console.debug("UserManagementPage: users from hook:", users);

  // local UI state (search/filters)
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<LocalUser | null>(null);

  // form state for modal
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState<UserType>("User");
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  //Deactivated users
  const [deactivatedUsers, setDeactivatedUsers] = useState<LocalUser[]>([]);
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);

  // normalize user object for UI usage
  const normalize = (u: any): LocalUser => {
    if (!u) return {};
    const fullName = u.fullName ?? u.full_name ?? u.full_name_display ?? u.name ?? "";
    const username = u.username ?? u.user_name ?? (typeof u.email === "string" ? u.email.split("@")[0] : "");
    const email = u.email ?? u.email_address ?? "";
    const department = u.department ?? u.dept ?? "";
    const typeRaw = (u.type ?? u.user_type ?? u.userType ?? "").toString();
    const type =
      typeRaw.toLowerCase() === "admin"
        ? "Admin"
        : typeRaw.toLowerCase() === "moderator"
        ? "Moderator"
        : "User";
    const avatar = u.avatar ?? u.avatar_url ?? u.profile_picture ?? "";
    const id = u.id ?? u.user_id ?? u.uid ?? "";
    return {
      id,
      fullName,
      username,
      email,
      department,
      type,
      active: u.is_active ?? u.active ?? true,
      avatar,
      full_name: u.full_name,
      user_type: u.user_type,
      user_id: u.user_id,
    };
  };

  // Build a normalized list for consistent UI fields
  const normalizedUsers = useMemo(() => {
    try {
      return (users || []).map(normalize);
    } catch (e) {
      console.error("Failed to normalize users:", e);
      return [];
    }
  }, [users]);

  const filtered = useMemo(() => {
    const list = normalizedUsers as LocalUser[];
    return list.filter((u) => {
      if (departmentFilter !== "All" && u.department !== departmentFilter) return false;
      if (typeFilter !== "All" && u.type !== typeFilter) return false;
      if (
        query &&
        !(
          `${u.fullName ?? ""} ${u.username ?? ""} ${u.email ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
      )
        return false;
      return true;
    });
  }, [normalizedUsers, departmentFilter, typeFilter, query]);

  function openCreateModal() {
    setEditingUser(null);
    setFullName("");
    setUsername("");
    setUserType("User");
    setDepartment(DEPARTMENTS[0]);
    setEmail("");
    setPassword("");
    setIsModalOpen(true);
  }

  function openEditModal(u: LocalUser) {
    setEditingUser(u);
    setFullName(u.fullName ?? "");
    setUsername(u.username ?? "");
    setUserType(u.type ?? "User");
    setDepartment(u.department ?? DEPARTMENTS[0]);
    setEmail(u.email ?? "");
    setPassword("");
    setIsModalOpen(true);
  }

  async function handleSave() {
    if (!fullName.trim() || !username.trim() || !email.trim()) {
      alert("Please provide full name, username and email.");
      return;
    }

    try {
      if (editingUser) {
        await update(Number(editingUser.id as any), {
          full_name: fullName,
          username,
          email,
          department,
          user_type: userType.toLowerCase(),
        } as any);
      } else {
        await create({
          full_name: fullName,
          username,
          email,
          password: password || "changeme123",
          department,
          user_type: userType.toLowerCase(),
        } as any);
      }
      // refresh list
      await fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      console.error("User save error", err);
      alert("Failed to save user.");
    }
  }

  async function handleDelete(id: string | number | undefined) {
    if (!id) {
      alert("Invalid user id");
      return;
    }
    if (!confirm("Delete this user?")) return;
    try {
      await remove(Number(id as any));
      // optionally refresh list
      await fetchUsers();
    } catch (err) {
      console.error("Delete user error", err);
      alert("Failed to delete user.");
    }
  }
  async function loadDeactivated() {
    const data = await api.getDeactivatedUsers();
    setDeactivatedUsers(data.map(normalize));
  }
  useEffect(() => {
    fetchUsers();
    loadDeactivated();
  }, [fetchUsers]);
  

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">

      </div>

      <Card className="shadow-soft-lg border border-gray-200 bg-white overflow-hidden rounded-xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-gray-900">All Users</h3>
            <p className="text-sm text-gray-500 mt-1">Users Table— edit, delete and review status</p>
          </div>

          <div className="flex items-center gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="h-9 px-3 rounded-xl shadow-sm border border-gray-200 bg-white text-sm"
              style={{ borderRadius: "999px", minWidth: 180 }}
            />

            <Select value={departmentFilter} onValueChange={(v) => setDepartmentFilter(v)}>
              <SelectTrigger className="w-36 h-9 text-sm bg-gray-50 border-gray-200 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="overflow-y-auto rounded-xl shadow-sm">
                <SelectItem value="All">Departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v)}>
              <SelectTrigger className="w-36 h-9 text-sm bg-gray-50 border-gray-200 rounded-xl shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="All">Roles</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Moderator">Moderator</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="h-9 shadow-lg btn-primary-glow pl-10 pr-10 rounded-xl"
              onClick={openCreateModal}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="p-6 text-center text-gray-500">No users found for selected filters.</div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u, idx) => {
                const displayName = (u.fullName ?? u.full_name ?? u.username ?? "Unknown").trim();
                const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "?";
                return (
                  <TableRow key={String(u.id ?? idx)} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="text-sm text-gray-600">{idx + 1}</div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 ring-2 ring-gray-100">
                          {u.avatar ? (
                            <AvatarImage src={u.avatar} alt={displayName} />
                          ) : (
                            <AvatarFallback>{displayInitial}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{displayName || "Unknown"}</div>
                          <div className="text-xs text-gray-500">@{u.username ?? (u.email ? (u.email.split("@")[0]) : "unknown")}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-gray-600 truncate">{u.email ?? "-"}</TableCell>

                    <TableCell className="text-sm text-gray-700">
                      <div className="inline-flex items-center gap-2">
                        <span className="text-sm">{u.department ?? "-"}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={u.type === "Admin" ? "default" : "outline"}
                        className={
                          u.type === "Admin"
                            ? "bg-sky-100 text-sky-700 border-0"
                            : u.type === "Moderator"
                            ? "bg-purple-100 text-purple-700 border-0"
                            : "border-gray-200"
                        }
                        style={{ borderRadius: "rounded-xl" }}
                      >
                        {u.type ?? "User"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-start gap-2">
                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl" onClick={() => openEditModal(u)}>
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>

                        <Button variant="destructive" className="h-8 w-8 p-0 btn-primary-glow rounded-xl" onClick={() => handleDelete(u.id)}>
                          <Trash className=" w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6 rounded-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{editingUser ? "Edit User" : "Create New User"}</h3>
                  <p className="text-sm text-gray-600">{editingUser ? "Update user details" : "Fill details to create user"}</p>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close"
                  className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Full name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-gray-100 bg-gray-50 mt-1 h-11 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Username</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border-gray-100 bg-gray-50 mt-1 h-11 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">User type</Label>
                    <Select value={userType} onValueChange={(v) => setUserType(v as UserType)}>
                      <SelectTrigger
                        className="w-full h-11 border-gray-200 bg-gray-100 text-gray-800 px-4 flex items-center justify-between rounded-xl"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="User">User</SelectItem>
                        <SelectItem value="Moderator">Moderator</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Department</Label>

                    <Select value={department} onValueChange={(v) => setDepartment(v)}>
                      <SelectTrigger
                        className="w-full h-11 border-gray-200 bg-gray-100 text-gray-800 px-4 flex items-center justify-between rounded-xl"
                      >
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent
                        className="w-full overflow-y-auto"
                      >
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-gray-100 bg-gray-50 mt-1 h-11 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Password</Label>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder={editingUser ? "Leave blank to keep existing" : "Choose a password"}
                    className="border-gray-100 bg-gray-50 mt-1 h-11 rounded-xl"
                  />
                </div>

                <div className="md:col-span-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 h-11 rounded-xl"
                    >
                      Cancel
                    </Button>

                    <Button
                      onClick={handleSave}
                      className="h-11 px-6 btn-primary-glow rounded-xl"
                    >
                      {editingUser ? "Save changes" : "Create user"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Card className="shadow-soft-lg border border-red-200 bg-red-50/40 rounded-xl">
        <div className="p-6 border-b border-red-200">
          <h3 className="text-red-700 font-semibold">Deactivated Users</h3>
          <p className="text-sm text-red-600">Restore suspended accounts</p>
        </div>

        {deactivatedUsers.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No deactivated users</div>
        ) : (
          <div className="divide-y">
            {deactivatedUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    {u.avatar ? <AvatarImage src={u.avatar} /> : <AvatarFallback>{u.fullName?.[0]}</AvatarFallback>}
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{u.fullName}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </div>
                </div>
                <Button
                  disabled={reactivatingId === Number(u.id)}
                  className="btn-primary-glow rounded-xl"
                  onClick={async () => {
                    const id = Number(u.id);
                    setReactivatingId(id);
                    await api.reactivateUser(id);
                    await fetchUsers();
                    await loadDeactivated();
                    setReactivatingId(null);
                  }}
                >
                  {reactivatingId === Number(u.id) ? "Reactivating..." : "Reactivate"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default UserManagementPage;
