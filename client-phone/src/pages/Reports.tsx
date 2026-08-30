import api from "../api/api";
import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { QuickLinks } from "@/components/QuickLinks";
import { DepartmentPerformance } from "@/components/DepartmentPerformance";
import { TopContributors } from "@/components/TopContributors";
import ExportReportsCard from "../components/ExportReport";


interface ReportItem {
  report_id: number;
  report_reason: string;
  created_at: string;
  reported_by: {
    name: string;
    avatar?: string;
    department?: string;
  };
  post: {
    post_id: number;
    description: string;
    image_url?: string;
    author: {
      name: string;
      avatar?: string;
    };
  };
  report_count: number;
  image_url?: string;
}

type ModerationItem = {
  id: string;
  user: { name: string; avatar?: string };       // reporter
  postUser: { name: string; avatar?: string };   // post owner
  content: string;        // report reason
  postContent: string;    // post text
  imageUrl?: string;
  reported: number;
  time: string;
  postId: number;
  status: string;
};



export default function ReportPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [range, setRange] = useState("7");
  const [department, setDepartment] = useState("all");
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const moderationQueue: ModerationItem[] = reports.map((r) => ({
    id: String(r.report_id),

    // Reporter (shown in queue)
    user: {
      name: r.reported_by.name,
      avatar: r.reported_by.avatar,
    },

    // Post info (for modal)
    postUser: {
      name: r.post.author.name,
      avatar: r.post.author.avatar,
    },

    postContent: r.post.description,
    imageUrl: r.post.image_url,

    // Report info
    content: r.report_reason,
    reported: r.report_count,
    time: new Date(r.created_at).toLocaleTimeString(),
    postId: r.post.post_id,
    status: "pending",
  }));

  const [activeReport, setActiveReport] = useState<ModerationItem | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setReports(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range, department]);

  const dismiss = async (id: number) => {
    await api.dismissReport(id);
    fetchReports();
  };

  const removePost = async (id: number) => {
    if (!confirm("Remove this post permanently?")) return;
    await api.removeReportedPost(id);
    fetchReports();
  };

  const exportCSV = async () => {
    const res = await api.exportReports();
    const blob = new Blob([res.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bragboard_reports.csv";
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
      {/* LEFT SIDE */}  
      <div className="lg:col-span-2 space-y-2">
        {/* Moderation Queue */}
        <Card className="p-2 shadow-soft-lg border border-gray-200 bg-white rounded-xl">
          <div className="p-2 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Moderation Queue</h3>
              <p className="text-sm text-gray-500 mt-1">
                Moderate reported content.
              </p>
            </div>
            <Badge className="bg-blue-50 text-blue-700">
              {moderationQueue.length} pending
            </Badge>
          </div>
          <div className="space-y-2">
            {moderationQueue.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                <Avatar className="w-12 h-12 ring-2 ring-gray-100 flex-shrink-0">
                  <AvatarImage src={item.user.avatar} alt={item.user.name} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{item.user.name}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-500">{item.time}</span>
                    <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 ml-auto rounded-xl">
                      {item.reported} reports
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{item.content}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                        className="btn-primary-glow rounded-xl"                      
                        onClick={async () => {
                        await api.removeReportedPost(Number(item.id));
                        fetchReports();
                      }}
                    >
                      Approve
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 rounded-xl shadow-md"
                      onClick={async () => {
                        await api.dismissReport(Number(item.id));
                        fetchReports();
                      }}
                    >
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="border border-gray-100 rounded-xl shadow-md"
                      onClick={() => {
                        setActiveReport(item);
                        setShowDetails(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div>
          <ExportReportsCard />
        </div>
        {showDetails && activeReport && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-lg mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-4">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Report details
                    </h3>
                    <p className="text-sm text-gray-600">
                      This report has been submitted and is under moderation.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowDetails(false)}
                    aria-label="Close"
                    className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>

                {/* Shout preview */}
                <div className="border border-gray-100 rounded-xl p-3 mb-4 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 ring-2 ring-gray-100">
                      <AvatarImage src={activeReport.postUser.avatar} />
                      <AvatarFallback>{activeReport.postUser.name[0]}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-gray-900">
                          {activeReport.postUser.name}
                        </div>
                        <div className="text-xs text-gray-400">•</div>
                        <div className="text-xs text-gray-500">{activeReport.time}</div>
                      </div>

                      <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                        {activeReport.postContent}
                      </div>

                      {activeReport.imageUrl && (
                        <div className="mt-3 rounded-md overflow-hidden">
                          <img
                            src={activeReport.imageUrl}
                            alt="attachment"
                            className="w-full h-40 object-cover rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Report message (read-only) */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Reason for reporting
                    </label>
                    <textarea
                      value={activeReport.content}
                      readOnly
                      className="w-full mt-2 p-3 rounded-md border border-gray-200 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 ">
                    <Button
                      variant="ghost"
                      onClick={() => setShowDetails(false)}
                      className="px-4 py-2 rounded-xl border border-gray-100 shadow-lg"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* RIGHT SIDE */}
      <div className="space-y-2">
        <TopContributors />
        <DepartmentPerformance />
        <QuickLinks />
      </div>      
    </div>
  );
}
