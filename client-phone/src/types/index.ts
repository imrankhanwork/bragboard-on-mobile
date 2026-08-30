// src/types/index.css

// --------------------
// App pages / routing
// --------------------
export type Page =
  | "login"
  | "Dashboard"
  | "findpeople"
  | "profile"
  | "notifications"
  | "settings"
  | "leaderboard"
  | "reports"
  | "Analytics"
  | "userManagement";

// --------------------
// Domain models
// --------------------
export type UserRole = "user" | "admin" | "moderator";

export interface User {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  user_type: UserRole;
  department?: string;
  bio?: string;
  profile_picture_url?: string;
}

export interface CurrentUser {
  id?: string | number;
  username?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  avatar?: string;
  role?: string;
  [k: string]: unknown;
}