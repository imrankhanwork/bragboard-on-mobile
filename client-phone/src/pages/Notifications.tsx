import { useState, useEffect } from "react";
import { TopContributors } from "../components/TopContributors";
import { QuickLinks } from "../components/QuickLinks";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Check } from "lucide-react";
import api from "../api/api";
import { DepartmentPerformance } from "@/components/DepartmentPerformance";



export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [notificationList, setNotificationList] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await api.getNotifications();
      setNotificationList(data);
    };
    load();
  }, []);

  const filteredNotifications =
    activeTab === "unread"
      ? notificationList.filter((n) => !n.is_read)
      : notificationList;

  const markAllAsRead = async () => {
    await api.markNotificationsRead();
    setNotificationList((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notificationList.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-2">
          <Card className="shadow-soft-lg border border-gray-200 bg-white rounded-xl shadow-sm">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="px-4 py-2 border-b border-gray-100 px-4 py-2 border-b border-gray-100 flex items-start justify-between gap-4 ">
                <TabsList className="bg-gray-100 rounded-xl shadow-sm">
                  <TabsTrigger value="all" className="rounded-2xl">
                    All
                  </TabsTrigger>

                  <TabsTrigger value="unread" className="rounded-2xl">
                    Unread {unreadCount > 0 && `(${unreadCount})`}
                  </TabsTrigger>
                </TabsList>
                <p className="text-gray-600 mt-2 text-sm">
                  {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "You're all caught up!"}
                </p>
                <div className="ml-auto">
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      className="w-40 border-gray-200 rounded-xl shadow-soft-lg"
                      onClick={markAllAsRead}
                    >
                      <Check className="w-4 h-4" />
                      Mark all as read
                    </Button>
                  )}
                </div>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                {filteredNotifications.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Check className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-600">
                      {activeTab === "unread"
                        ? "You have no unread notifications"
                        : "You have no notifications"}
                    </p>
                  </div>
                ) : (
                  <div>
                    {filteredNotifications.map((notification, index) => (
                      <div
                        key={notification.notification_id}
                        className={`px-6 py-5 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.is_read ? "bg-sky-50/30" : ""
                        } ${index !== filteredNotifications.length - 1 ? "border-b border-gray-100" : ""}`}
                      >
                        <div className="flex gap-4">
                          <Avatar className="w-12 h-12 ring-2 ring-gray-100 flex-shrink-0">
                            <AvatarImage src={notification.avatar} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <p className="font-semibold text-gray-900">
                                {notification.content}
                              </p>
                              {!notification.is_read && (
                                <span className="w-2.5 h-2.5 bg-sky-500 rounded-full flex-shrink-0 mt-1.5"></span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{new Date(notification.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
        {/* RIGHT SIDE */}
        <div className="space-y-2">
          <TopContributors />
          <DepartmentPerformance />
          <QuickLinks />
        </div>
      </div>
    </div>
  );
}
