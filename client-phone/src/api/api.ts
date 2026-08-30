// client/src/api/api.ts
import axios from "axios";

/* =======================
   Axios instance
======================= */

const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

/* =======================
   Token handling
======================= */

export function setTokenForApp(token: string | null) {
  if (token) {
    localStorage.setItem("token", token);
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    delete apiClient.defaults.headers.common["Authorization"];
  }
}

const existingToken = localStorage.getItem("token");
if (existingToken) {
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${existingToken}`;
}

/* ======================
   AUTH
====================== */
async function login(email: string, password: string) {
  const res = await apiClient.post("/auth/login", {
    email,
    password,
  });

  const { access_token, user } = res.data;
  setTokenForApp(access_token);

  localStorage.setItem("user", JSON.stringify(user));

  return res.data;
}

function logout() {
  setTokenForApp(null);
  localStorage.removeItem("user");
}

async function getCurrentUser() {
  const res = await apiClient.get("/users/me");
  return res.data;
}

/* ======================
   USERS (admin)
====================== */

async function getPublicUsers() {
  const res = await apiClient.get("/users/public");
  return res.data;
}


async function getUserById(id: number | string) {
  const res = await apiClient.get(`/users/${id}`);
  return res.data;
}

async function createUser(payload: any) {
  const res = await apiClient.post("/users", payload);
  return res.data;
}

async function updateUser(id: number | string, updates: any) {
  const res = await apiClient.put(`/users/${id}`, updates);
  return res.data;
}

async function deleteUser(id: number | string) {
  const res = await apiClient.delete(`/users/${id}`);
  return res.data;
}

async function suspendUser(userId: number | string, suspend: boolean = true) {
  const res = await apiClient.post(`/users/${userId}/suspend`, null, {
    params: { suspend },
  });
  return res.data;
}

async function updateMe(payload: any) {
  const res = await apiClient.put("/users/me", payload);
  return res.data;
}

async function changeMyPassword(payload: { current_password: string; new_password: string }) {
  return apiClient.post("/users/me/change-password", payload);
}

async function deactivateMe() {
  return apiClient.post("/users/me/deactivate");
}

async function getDeactivatedUsers() {
  const res = await apiClient.get("/users/deactivated");
  return res.data;
}

async function reactivateUser(userId: number) {
  return apiClient.post(`/users/${userId}/reactivate`);
}

/* ======================
  POSTS / SHOUTS
======================*/

async function getPosts(params?: { limit?: number; offset?: number }) {
  const res = await apiClient.get("/posts", { params });
  return res.data;
}

async function createPost(payload: any) {
  const res = await apiClient.post("/posts", payload);
  return res.data;
}

async function deletePost(postId: number | string) {
  const res = await apiClient.delete(`/posts/${postId}`);
  return res.data;
}

/* ======================
    COMMENTS
====================== */

async function getComments(postId: number | string) {
  const res = await apiClient.get(`/comments/${postId}`);
  return res.data;
}

async function createComment(postId: number | string, content: string) {
  const res = await apiClient.post("/comments", {
    post_id: Number(postId),
    content,
  });
  return res.data;
}

async function deleteComment(commentId: number) {
  return apiClient.delete(`/comments/${commentId}`);
}

/* ======================
    REACTIONS
====================== */
async function reactToPost(postId: number | string, reactionType: string) {
  const res = await apiClient.post("/reactions", {
    post_id: Number(postId),
    reaction_type: reactionType,
  });
  return res.data;
}
async function getReactions(postId: number) {
  const res = await apiClient.get(`/reactions/${postId}`);
  return res.data;
}

async function toggleReaction(postId: number, type: string) {
  const res = await apiClient.post(`/reactions/${postId}/${type}`);
  return res.data;
}


/* ======================
  REPORTS
====================== */
async function reportShout(payload: { shoutId: number | string; reason: string }) {
  const res = await apiClient.post(
    `/reports/posts/${Number(payload.shoutId)}`,
    { comment: payload.reason }
  );
  return res.data;
}
// -------- Admin Moderation / Reports --------

async function getReports(params?: { range?: string; department?: string }) {
  const res = await apiClient.get("/reports", { params });
  return res.data;
}


async function dismissReport(id: number) {
  return apiClient.post(`/reports/admin/${id}/dismiss`);
}

async function removeReportedPost(id: number) {
  return apiClient.post(`/reports/admin/${id}/approve`);
}


async function exportReports() {
  const res = await apiClient.get("/admin/reports/export", {
    responseType: "blob",
  });
  return res;
}

async function getExportReports(params?: any) {
  const res = await apiClient.get("/reports/export", { params });
  return res.data;
}


/* ======================
  NOTIFICATIONS
====================== */

async function getNotifications() {
  const res = await apiClient.get("/notifications");
  return res.data;
}

async function getUnreadCount() {
  const res = await apiClient.get("/notifications/unread-count");
  return res.data.unread;
}

async function markNotificationsRead(ids?: number[]) {
  const res = await apiClient.post("/notifications/mark-read", {
    notification_ids: ids,
  });
  return res.data;
}


/* ======================
  ANALYTICS
====================== */
async function getTopContributors(limit: number = 10) {
  const res = await apiClient.get("/analytics/top-contributors", {
    params: { limit },
  });
  return res.data;
}

async function getLeaderboard() {
  const res = await apiClient.get("/analytics/leaderboard");
  return res.data;
}

async function getDepartmentEngagement() {
  const res = await apiClient.get("/analytics/department-engagement");
  return res.data;
}

async function getAllStats() {
  const res = await apiClient.get("/analytics/all-stats");
  return res.data;
}

async function getChartData() {
  const res = await apiClient.get("/analytics/charts");
  return res.data;
}

/* =============================
    EXPORT (SINGLE CONTRACT)
============================= */
const api = {
  // auth
  login,
  logout,
  setTokenForApp,
  getCurrentUser,

  // users
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  suspendUser,
  changeMyPassword,
  updateMe,
  getPublicUsers,
  deactivateMe,
  getDeactivatedUsers,
  reactivateUser,

  // posts
  getPosts,
  createPost,
  deletePost,

  // comments
  getComments,
  createComment,
  deleteComment,

  // reactions
  reactToPost,
  getReactions,
  toggleReaction,

  // reports
  reportShout,
  getReports,
  dismissReport,
  removeReportedPost,
  exportReports,
  getExportReports,
  
  // notifications
  getNotifications,
  getUnreadCount,
  markNotificationsRead,

  // analytics
  getTopContributors,
  getLeaderboard,
  getDepartmentEngagement,
  getAllStats,
  getChartData,
};

export default api;
