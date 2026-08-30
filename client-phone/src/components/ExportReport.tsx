import { useEffect, useState } from "react";
import api from "../api/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FileText, Download, Calendar, Filter } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";

type Report = {
  _id: number;
  department: string;
  reason: string;
  created_at: string;
  reported_user: { name: string };
  post: { content: string };
};

const DEPARTMENTS = [
  "All Departments",
  "Design",
  "Engineering",
  "Marketing",
  "Sales",
  "Product",
  "HR",
  "Finance",
  "QA",
];

export default function ExportReportsCard() {
  const [department, setDepartment] = useState("All Departments");
  const [timeRange, setTimeRange] = useState("7");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  function buildParams() {
    if (timeRange === "custom") {
      return { department, from_date: from, to_date: to };
    }
    return { department, range: timeRange };
  }


  async function loadReports() {
    setLoading(true);
    const params = buildParams();

    const data = await api.getExportReports(params);
    setReports(data);
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, [department, timeRange, from, to]);

  function exportCSV() {
    if (!reports.length) return alert("No reports to export.");

    const rows = [
      ["User", "Department", "Post", "Reason", "Date"],
      ...reports.map(r => [
        r.reported_user?.name,
        r.department,
        r.post?.content,
        r.reason,
        new Date(r.created_at).toLocaleString(),
      ]),
    ];

    const csv = rows.map(row =>
      row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "bragboard-reports.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <Card className="shadow-xl border border-gray-200 bg-white overflow-hidden rounded-xl">
      <div className="p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Export Reports</h3>
          <p className="text-sm text-gray-500 mt-1">
            Filter & export shoutout reports
          </p>
        </div>
        <Badge className="bg-blue-50 text-blue-700">
          {reports.length} records
        </Badge>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Department</p>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-36 h-10 bg-gray-50 w-44 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Time</p>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36 h-10 bg-gray-50 w-44 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {timeRange === "custom" && (
            <>
              <div>
                <p className="text-xs text-gray-500 mb-1">From</p>
                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">To</p>
                <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
              </div>
            </>
          )}
          <div className="w-36 h-9 w-44">
            <p className="text-xs text-gray-500 mb-1">.Csv file</p>
            <Button
              size="sm"
              className="btn-primary-glow flex items-center gap-2 rounded-xl h-10 w-full"
              onClick={exportCSV}
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </div><br/>

        <div className="border rounded-xl divide-y overflow-hidden">
          {loading && <p className="p-4 text-sm text-gray-500">Loading...</p>}
          {!loading && !reports.length && (
            <p className="p-4 text-sm text-gray-500">No reports found.</p>
          )}

          {reports.map(r => (
            <div key={r._id} className="p-4 flex justify-between text-sm hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-800">{r.reported_user?.name}</p>
                <p className="text-xs text-gray-500">{r.department}</p>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(r.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
