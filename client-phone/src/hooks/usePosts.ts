// src/hooks/usePosts.ts
import { useCallback, useEffect, useState } from "react";
import api from "../api/api";

export type PostAuthor = {
  id: number | string;
  username?: string;
  full_name?: string;
  email?: string;
  profile_picture_url?: string;
};

export type Post = {
  id: number | string;
  description: string;
  image_url?: string | null;
  author: PostAuthor;
  created_at: string;
  reactions_count?: Record<string, number> | number;
  recipients?: Array<number | string> | string[];
  taggedUsers?: string[];
};

type CreatePostPayload = {
  description: string;
  image_url?: string | null;
  recipients?: Array<number | string>;
  tags?: string[];
};

export default function usePosts(initial: Post[] = []) {
  const [posts, setPosts] = useState<Post[]>(initial);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false); 
  const [error, setError] = useState<string | null>(null);

  const recipientsToNumberArray = (
    rec?: Array<number | string>
  ): number[] | undefined => {
    if (!rec || !Array.isArray(rec)) return undefined;

    const mapped = rec
      .map((r) => {
        if (typeof r === "number") return r;
        if (typeof r === "string") {
          const n = parseInt(r, 10);
          return Number.isFinite(n) ? n : undefined;
        }
        return undefined;
      })
      .filter((v): v is number => typeof v === "number");

    return mapped.length ? mapped : undefined;
  };

  const normalize = useCallback((raw: any): Post => {
    if (!raw) raw = {};

    const id = raw.id ?? raw.post_id ?? raw.postId ?? raw._id ?? "";
    const description = raw.description ?? raw.body ?? "";
    const image_url = raw.image_url ?? raw.imageUrl ?? raw.image ?? null;
    const created_at =
      raw.created_at ?? raw.createdAt ?? raw.timestamp ?? new Date().toISOString();

    let author: PostAuthor;
    if (raw.author || raw.user || raw.user_detail) {
      const u = raw.author ?? raw.user ?? raw.user_detail;
      author = {
        id: u.id ?? u.user_id ?? 0,
        username: u.username ?? u.user_name,
        full_name: u.full_name ?? u.fullName ?? u.name,
        email: u.email ?? "",
        profile_picture_url: u.profile_picture_url ?? u.avatar ?? u.image,
      };
    } else {
      author = {
        id: raw.user_id ?? 0,
        username: raw.user_name,
        full_name: raw.user_full_name ?? raw.user_name,
      };
    }

    const recipients =
      raw.recipients ??
      raw.reciepients ??
      raw.to ??
      raw.receiver ??
      raw.receivers ??
      [];

    const reactions_count =
      raw.reactions_count ?? raw.reactions ?? raw.reactionCount ?? {};

    const taggedUsersRaw =
      raw.tagged_users ??
      raw.taggedUsers ??
      raw.tagged ??
      raw.mentionedUsers ??
      [];

    const taggedUsers: string[] = (taggedUsersRaw || [])
      .map((t: any) => {
        if (typeof t === "string") return t.trim().replace(/^@+/, "");
        if (typeof t === "number") return String(t);
        return (t?.username ?? t?.name ?? String(t))
          .trim()
          .replace(/^@+/, "");
      })
      .filter(Boolean);

    return {
      ...raw,
      id,
      description,
      image_url,
      author,
      created_at,
      reactions_count,
      recipients,
      taggedUsers,
      tagged_users: taggedUsers,
    };

  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.getPosts();
      const resAny = res as any;

      let items: any[] = [];

      if (Array.isArray(resAny)) {
        items = resAny;
      } else if (resAny && Array.isArray(resAny.posts)) {
        items = resAny.posts;
      } else if (resAny && Array.isArray(resAny.items)) {
        items = resAny.items;
      } else if (resAny && Array.isArray(resAny.data?.posts)) {
        items = resAny.data.posts;
      } else if (resAny && Array.isArray(resAny.data?.items)) {
        items = resAny.data.items;
      } else if (resAny && resAny.post) {
        items = [resAny.post];
      }

      const normalized = items.map((p) => normalize(p));
      setPosts(normalized);
      setLoaded(true);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [normalize]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = useCallback(
    async (payload: CreatePostPayload): Promise<Post> => {
      setLoading(true);
      setError(null);

      try {
        const recNums = recipientsToNumberArray(payload.recipients);

        const payloadForApi: any = {
          description: payload.description,
          image_url: payload.image_url ?? null,
        };

        if (recNums) payloadForApi.recipients = recNums;

        if (payload.tags) {
          payloadForApi.tags = payload.tags.map((t) =>
            t.trim().replace(/^@+/, "")
          );
        }

        const createdRaw = await api.createPost(payloadForApi);
        const crAny = createdRaw as any;

        const created =
          crAny?.post ??
          crAny?.data ??
          crAny?.data?.post ??
          crAny ??
          null;

        const normalized = normalize(created);
        setPosts((prev) => [normalized, ...prev]);

        return normalized;
      } catch (err: any) {
        setError(err?.message ?? "Failed to create post");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [normalize]
  );

  const updatePost = useCallback(
    async (postId: string | number, patch: Partial<CreatePostPayload>) => {
      setLoading(true);
      setError(null);

      try {
        const payloadForApi: any = { ...patch };

        if (patch.recipients)
          payloadForApi.recipients = recipientsToNumberArray(patch.recipients);

        if (patch.tags)
          payloadForApi.tags = patch.tags.map((t) =>
            String(t).trim().replace(/^@+/, "")
          );

        const updatedRaw = await (api as any).updatePost(postId, payloadForApi);
        const normalized = normalize(updatedRaw);

        setPosts((prev) =>
          prev.map((p) => (p.id === normalized.id ? normalized : p))
        );

        return normalized;
      } catch (err: any) {
        setError(err?.message ?? "Failed to update post");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [normalize]
  );

  const deletePost = useCallback(async (postId: string | number) => {
    setLoading(true);
    setError(null);

    try {
      await (api as any).deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      return true;
    } catch (err: any) {
      setError(err?.message ?? "Failed to delete post");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    posts,
    loading,
    loaded,
    error,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    setPosts,
  };
}
