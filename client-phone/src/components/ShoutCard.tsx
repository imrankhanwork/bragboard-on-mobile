// src/components/ShoutCard.tsx
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { MessageCircle, MoreVertical, X, Heart, ThumbsUp, Sparkles } from "lucide-react";
import CommentsWidget from "./CommentsWidget";
import api from "../api/api";

/* =======================
   Helpers (FROM OLD FILE)
======================= */

function tryParseJSON(s: string | null) {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function decodeJwtPayload(token?: string | null) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return tryParseJSON(decoded);
  } catch {
    return null;
  }
}

function timeAgo(date: string | Date) {
  const now = new Date().getTime();
  const past = new Date(date).getTime();
  const diff = Math.floor((now - past) / 1000); // seconds

  if (diff < 60) return "Just now";

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

/* =======================
   Types
======================= */

interface Sender {
  id?: number | string;
  name: string;
  avatar?: string;
}

export interface Shout {
  id: number | string;
  sender: Sender;
  message: string;
  timestamp: string;
  imageUrl?: string | null;
  recipients?: string[];
  taggedUsers?: string[];
  reactions?: Record<string, number>;
}

interface Props {
  shout: Shout;
  currentUserId?: number | string;
  currentUserIsAdmin?: boolean;
  onViewProfile?: (userId: number | string) => void;
}

/* =======================
   Component
======================= */

export default function ShoutCard({
  shout,
  currentUserId,
  currentUserIsAdmin,
  onViewProfile,
}: Props) {
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  /* ---------- Report Modal ---------- */
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState("");

  const [reactions, setReactions] = useState<{ [k: string]: number }>({
    clap: 0,
    star: 0,
    heart: 0,
  });

  const [myReaction, setMyReaction] = useState<string | null>(null);


  /* =======================
     OWNER / ADMIN RESOLUTION
     (EXACT OLD BEHAVIOR)
  ======================= */

  const [resolvedUserId, setResolvedUserId] = useState<number | string | undefined>(currentUserId);
  const [resolvedIsAdmin, setResolvedIsAdmin] = useState<boolean | undefined>(currentUserIsAdmin);


  useEffect(() => {
    if (resolvedUserId !== undefined) return;

    const storedUser =
      tryParseJSON(localStorage.getItem("user")) ||
      tryParseJSON(localStorage.getItem("currentUser"));

    if (storedUser) {
      setResolvedUserId(
        storedUser.id ?? storedUser.user_id ?? storedUser.pk ?? storedUser._id
      );
      setResolvedIsAdmin(
        Boolean(storedUser.is_admin ?? storedUser.isAdmin ?? storedUser.admin)
      );
      return;
    }

    const lsId =
      localStorage.getItem("userId") ||
      localStorage.getItem("currentUserId");

    if (lsId) {
      setResolvedUserId(lsId);
      return;
    }

    const payload = decodeJwtPayload(localStorage.getItem("token"));
    if (payload) {
      setResolvedUserId(
        payload.sub ?? payload.user_id ?? payload.id ?? payload.uid
      );
      setResolvedIsAdmin(
        Boolean(payload.is_admin ?? payload.admin ?? payload.role === "admin")
      );
    }
  }, []);


  useEffect(() => {
    if (!resolvedUserId || !shout?.id) return;

    const loadReactions = async () => {
      try {
        const data = await api.getReactions(Number(shout.id));

        const counts: Record<string, number> = {
          clap: 0,
          star: 0,
          heart: 0,
        };

        let mine: string | null = null;

        for (const r of data) {
          counts[r.reaction_type] =
            (counts[r.reaction_type] ?? 0) + 1;

          if (String(r.user_id) === String(resolvedUserId)) {
            mine = r.reaction_type;
          }
        }

        setReactions(counts);
        setMyReaction(mine);
      } catch (err) {
        console.error("Failed to load reactions", err);
      }
    };

    loadReactions();
  }, [shout.id, resolvedUserId]);



  if (deleted) return null;

  const senderId = shout.sender?.id;

  const isOwner =
    senderId !== undefined &&
    resolvedUserId !== undefined &&
    String(senderId) === String(resolvedUserId);

  const canDelete = Boolean(isOwner || resolvedIsAdmin);

  const initials = shout.sender.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  /* =======================
     Actions
  ======================= */

  const handleDelete = async () => {
    if (!confirm("Delete this shout?")) return;
    try {
      await api.deletePost(Number(shout.id));
      setDeleted(true);
    } catch {
      alert("Failed to delete post");
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      setReportError("Please provide a reason.");
      return;
    }

    setReporting(true);
    try {
      await api.reportShout({
        shoutId: Number(shout.id),
        reason: reportReason.trim(),
      });
      setShowReport(false);
      setReportReason("");
      alert("Report submitted");
    } catch {
      setReportError("Failed to submit report");
    } finally {
      setReporting(false);
    }
  };

  const react = async (type: string) => {
    try {
      const res = await api.toggleReaction(Number(shout.id), type);

      if (res.active) {
        setMyReaction(type);
      } else {
        setMyReaction(null);
      }

      const data = await api.getReactions(Number(shout.id));

      const counts: any = { clap: 0, star: 0, heart: 0 };
      data.forEach((r: any) => {
        counts[r.reaction_type] = (counts[r.reaction_type] ?? 0) + 1;
      });

      setReactions(counts);
    } catch {}
  };


  /* ======================= */

  return (
    <>
      <div className="px-4 py-3 hover:bg-gray-50 transition rounded-xl border-b border-gray-100 last:border-none">
        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          <Avatar
            className="w-9 h-9 ring-2 ring-gray-100 cursor-pointer"
            onClick={() => onViewProfile?.(shout.sender.id!)}
          >
            <AvatarImage src={shout.sender.avatar} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-900 truncate">
                {shout.sender.name}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 text-sm">
                {timeAgo(shout.timestamp)}
              </span>
            </div>

            {(shout.recipients?.length || shout.taggedUsers?.length) && (
              <div className="flex flex-wrap gap-1 mt-1">
                {shout.recipients?.map(r => (
                  <Badge
                    key={r}
                    className="text-xs bg-sky-50 text-sky-700 border-0 px-2 py-0.5 rounded-md"
                  >
                    {r}
                  </Badge>
                ))}
                {shout.taggedUsers?.map(u => (
                  <Badge
                    key={u}
                    className="text-xs bg-blue-50 text-blue-700 border-0 px-2 py-0.5 rounded-md"
                  >
                    @{u}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Menu */}
          <div className="relative ml-auto">
            <button onClick={() => setMenuOpen(v => !v)}>
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 bg-white border rounded-lg shadow-md z-10 overflow-hidden">
                {!isOwner && (
                  <button
                    className="block w-full px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setShowReport(true);
                      setMenuOpen(false);
                    }}
                  >
                    Report
                  </button>
                )}

                {canDelete && (
                  <button
                    className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        <p className="mb-3 text-gray-700 leading-relaxed text-sm">
          {shout.message}
        </p>

        {/* Optional Image */}
        {shout.imageUrl && (
          <div className="mb-3 rounded-xl overflow-hidden">
            <img
              src={shout.imageUrl}
              alt=""
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Reactions */}
        <div className="flex items-center gap-1 pt-2 border-t border-gray-100 ">
          {["clap", "star", "heart"].map(type => {
            const Icon =
              type === "clap" ? ThumbsUp : type === "star" ? Sparkles : Heart;

            const active = myReaction === type;

            return (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                className={`gap-1 h-7 px-2 ${
                  active
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-900"
                }`}
                onClick={() => react(type)}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {reactions[type] ?? 0}
                </span>
              </Button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-7 px-2 ml-auto text-gray-600 hover:bg-gray-900"
            onClick={() => setShowComments(v => !v)}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Comments</span>
          </Button>
        </div>

        {showComments && (
          <div className="mt-3">
            <CommentsWidget postId={Number(shout.id)} />
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setShowReport(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Report post
                  </h3>
                  <p className="text-sm text-gray-600">
                    Tell us why you're reporting this post. Our moderators will review it.
                  </p>
                </div>

                <button
                  onClick={() => setShowReport(false)}
                  aria-label="Close"
                  className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Shout preview */}
              <div className="border border-gray-100 rounded-xl p-3 mb-4 bg-gray-50">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 ring-2 ring-gray-100">
                    <AvatarImage src={shout.sender.avatar} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-900">
                        {shout.sender.name}
                      </div>
                      <div className="text-xs text-gray-400">•</div>
                      <span className="text-gray-500 text-sm">
                        {timeAgo(shout.timestamp)}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                      {shout.message}
                    </div>

                    {shout.imageUrl && (
                      <div className="mt-3 rounded-md overflow-hidden">
                        <img
                          src={shout.imageUrl}
                          alt="attachment"
                          className="w-full h-20 object-cover rounded-md"
                        />
                      </div>
                    )}

                    {shout.recipients?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {shout.recipients.map((r) => (
                          <Badge
                            key={r}
                            variant="secondary"
                            className="text-xs bg-sky-50 text-sky-700 border-0 px-2 py-0.5"
                          >
                            {r}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Reason for reporting
                  </label>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Please explain why you're reporting this post (required)"
                    className="w-full mt-2 p-3 rounded-md border border-gray-200 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {reportError && (
                    <p className="text-sm text-red-600 mt-1">{reportError}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowReport(false)}
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitReport}
                    disabled={reporting}
                    className="h-11 px-6 bg-gradient-to-r from-sky-500 to-blue-600 text-white"
                  >
                    {reporting ? "Sending..." : "Send report"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
