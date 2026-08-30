// src/components/CommentsWidget.tsx
import React, { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { refreshNotifications } from "./NotificationDropdown";
import api from "../api/api";

type Comment = {
  id?: number | string;
  author: string;
  product?: string;
  time?: string;
  text: string;
  avatar?: string;
  canDelete?: boolean;
};

interface Props {
  postId?: number;
  headerTitle?: string;
}

export default function CommentsWidget({
  postId,
  headerTitle = "Top Comments",
}: Props) {
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Convert backend comment → UI comment
  const normalize = (c: any): Comment => ({
    id: c.id ?? c.comment_id,
    author: c.author?.full_name || c.author?.username || "User",
    text: c.content,
    time: c.created_at
      ? new Date(c.created_at).toLocaleString()
      : "just now",
    avatar: c.author?.profile_picture_url,
    canDelete: c.can_delete,
  });

  // Load comments
  const loadComments = async () => {
    if (!postId) return;
    try {
      const data = await api.getComments(postId);
      if (Array.isArray(data)) {
        setLocalComments(data.map(normalize));
      }
    } catch (e) {
      console.error("Failed to load comments", e);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  // Post comment
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !postId) return;

    setSubmitting(true);
    try {
      await api.createComment(postId, trimmed);
      setText("");
      await loadComments();
      refreshNotifications();
    } catch (e) {
      console.error("Failed to add comment", e);
    } finally {
      setSubmitting(false);
    }
  };
  // Delete Comment
  const handleDelete = async (commentId?: number | string) => {
    if (!commentId) return;
    if (!confirm("Delete this comment?")) return;

    try {
      await api.deleteComment(Number(commentId));
      await loadComments();
      refreshNotifications();
    } catch (e) {
      console.error("Failed to delete comment", e);
    }
  };

  return (
    <Card
      className="rounded-xl p-3 shadow-xl shadow-gray-200/50 border border-gray-100 bg-gray-50 hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-300 "
    >
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900 font-semibold text-sm">{headerTitle}</h3>
        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
          {localComments.length} new
        </span>
      </div>

      <div className="space-y-4 max-h-64 overflow-y-auto mt-2">
        {localComments.length === 0 ? (
          <div className="text-xs text-gray-500">No comments yet.</div>
        ) : (
          localComments.map((comment, index) => (
            <div
              key={comment.id ?? index}
              className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all group cursor-pointer"
            >
              <Avatar className="w-10 h-10 ring-2 ring-white shadow-md group-hover:ring-indigo-100 transition-all">
                {comment.avatar ? (
                  <AvatarImage src={comment.avatar} alt={comment.author} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                    {(comment.author || "U")[0]}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1 min-w-0 ">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                      {comment.author}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500 text-sm whitespace-nowrap">
                      {comment.time}
                    </span>
                  </div>

                  {comment.canDelete && (
                    <Button
                      onClick={() => handleDelete(comment.id)}
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 h-7"
                      style={{borderRadius: "999px",}}
                    >
                      Remove
                    </Button>
                  )}

                </div>

                <p className="text-sm text-gray-600 leading-relaxed">
                  {comment.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 rounded-md border px-2 py-1 text-sm"
          style={{
            borderRadius: "999px",
          }}          
          placeholder="Write a comment..."
        />
        <Button
          type="submit"
          disabled={submitting}
          className="btn-primary-glow"
          style={{
            borderRadius: "999px",
          }}
        >
          {submitting ? "Posting..." : "Post"}
        </Button>
      </form>
    </Card>
  );
}
