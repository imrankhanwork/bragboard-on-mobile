// src/hooks/useUsers.ts
import { useCallback, useEffect, useState } from "react";
import api from "../api/api";
import { User } from "../types";

export default function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ==================================
    Fetch users (admin only)
  ================================== */
  const fetchUsers = useCallback(
    async (opts?: { page?: number; limit?: number; search?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getPublicUsers();
        setUsers(Array.isArray(data) ? data : []);
        setLoaded(true); 
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Failed to fetch users"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* ==================================
    Create user (admin)
  ================================== */
  const create = useCallback(
    async (payload: Partial<User> & { password?: string }) => {
      const created = await api.createUser(payload);
      await fetchUsers();
      return created;
    },
    [fetchUsers]
  );

  /* ==================================
    Update user (admin)
  ================================== */
  const update = useCallback(
    async (userId: number, updates: Partial<User>) => {
      const updated = await api.updateUser(userId, updates);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, ...updated } : u))
      );
      return updated;
    },
    []
  );


  /* ==================================
    Delete user (admin)
  ================================== */
  const remove = useCallback(
    async (userId: number) => {
      await api.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    },
    []
  );


  /* ==================================
    Suspend / Unsuspend user (admin)
  ================================== */
  const suspend = useCallback(
    async (userId: number, suspend: boolean = true) => {
      const res = await api.suspendUser(userId, suspend);
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? ({ ...u, is_suspended: suspend } as any) : u
        )
      );
      return res;
    },
    []
  );

  /* ==================================
    auto-load users on mount
  ================================== */
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    loaded,
    error,

    fetchUsers,
    create,
    update,
    remove,
    suspend,
  };
}
