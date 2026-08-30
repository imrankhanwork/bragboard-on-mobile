import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import api from "../api/api";

interface NotificationDropdownProps {
  onClose: () => void;
  onViewAll: () => void;
}

let externalRefresh: (() => void) | null = null;

export function refreshNotifications() {
  externalRefresh?.();
}


export function NotificationDropdown({ onClose, onViewAll }: NotificationDropdownProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState<any[]>([]);

  const loadNotifications = async () => {
    const data = await api.getNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    externalRefresh = loadNotifications;
    loadNotifications();

    return () => {
      externalRefresh = null;
    };
  }, []);

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  return (
    <div
      className="absolute right-0 top-12 w-96 bg-white shadow-soft-lg border border-gray-200 z-50 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-gray-900">Notifications</h3>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-2">
          <TabsList className="w-full grid grid-cols-2 bg-gray-100 rounded-xl shadow-sm">
            <TabsTrigger value="all" className="rounded-xl">All</TabsTrigger>
            <TabsTrigger value="unread" className="rounded-xl">Unread</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                No {activeTab === "unread" ? "unread " : ""}notifications
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`px-6 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.is_read ? "bg-sky-50/30" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10 ring-2 ring-gray-100 flex-shrink-0">
                      <AvatarImage src={notification.avatar} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                            {notification.type === "comment" && "💬 "}
                            {notification.type === "reaction" && "❤️ "}
                            {notification.type === "tag" && "🏷️ "}
                            {notification.content}
                        </p>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100">
        <Button
          variant="ghost"
          className="w-full text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl"
          onClick={onViewAll}
        >
          View All Notifications
        </Button>
      </div>
    </div>
  );
}
