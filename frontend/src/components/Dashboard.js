import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Brain,
  FileQuestion,
  FileText,
  ListChecks,
  Lightbulb,
  TrendingUp,
  Users,
  Activity,
  GraduationCap,
  Download,
  Share2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

// NOTE: This file uses jspdf and html2canvas for PDF export.
// Install them if you don't have them already:
// npm i jspdf html2canvas
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const BACKEND_URL = process.env.REACT_APP_API_URL;
const API = BACKEND_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [giniAnalytics, setGiniAnalytics] = useState(null);
  const [timePeriod, setTimePeriod] = useState(7); // 7 or 30 days
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [activeModule, setActiveModule] = useState("all");
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchGiniAnalytics();
    fetchClassesAndSubjects();
  }, [timePeriod, selectedClass, selectedSubject]);

  const fetchGiniAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API}/gini/usage/analytics?days=${timePeriod}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setGiniAnalytics(response.data);
      // console.log("Analytics module keys:", Object.keys(response.data.analytics || {}));
    } catch (error) {
      console.error("❌ Failed to fetch GiNi analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesAndSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const [classesRes, subjectsRes] = await Promise.all([
        axios.get(`${API}/classes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch classes/subjects:", error);
    }
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (!giniAnalytics || !giniAnalytics.analytics) {
      return {
        totalStudents: 0,
        totalInteractions: 0,
        activeClasses: 0,
        weeklyGrowth: 0,
      };
    }

    const modules = giniAnalytics.analytics;
    const totalInteractions = Object.values(modules).reduce(
      (sum, module) => sum + (module.total_interactions || 0),
      0,
    );

    const uniqueClasses = new Set();
    Object.values(modules).forEach((module) => {
      if (module.class_wise) {
        Object.keys(module.class_wise).forEach((cls) => uniqueClasses.add(cls));
      }
    });

    // Calculate growth (mock calculation - should be from backend)
    const weeklyGrowth = timePeriod === 7 ? 18 : 24;

    return {
      totalStudents: 256,
      totalInteractions,
      activeClasses: uniqueClasses.size,
      weeklyGrowth,
    };
  };

  // Prepare chart data for usage trend
  const getUsageTrendData = () => {
    if (!giniAnalytics || !giniAnalytics.analytics) return [];

    const dateLabels = giniAnalytics.date_labels || [];
    const modules = giniAnalytics.analytics;

    return dateLabels.map((date, index) => {
      const dataPoint = { date };

      if (activeModule === "all") {
        Object.entries(modules).forEach(([moduleName, moduleData]) => {
          const dailyData = moduleData.daily || [];
          dataPoint[moduleName] = dailyData[index] || 0;
        });
        dataPoint.total = Object.values(dataPoint).reduce(
          (sum, val) => (typeof val === "number" ? sum + val : sum),
          0,
        );
      } else {
        const moduleData = modules[activeModule];
        if (moduleData && moduleData.daily) {
          dataPoint.interactions = moduleData.daily[index] || 0;
        } else {
          dataPoint.interactions = 0;
        }
      }

      return dataPoint;
    });
  };

  // Prepare class-wise data (respects activeModule)
  const getClassWiseData = () => {
    if (!giniAnalytics || !giniAnalytics.analytics) return [];

    const classData = {};

    Object.entries(giniAnalytics.analytics).forEach(([moduleId, module]) => {
      // Filter by active module (except "all")
      if (activeModule !== "all" && moduleId !== activeModule) return;

      if (module.class_wise) {
        Object.entries(module.class_wise).forEach(([cls, count]) => {
          if (selectedClass === "all" || cls === selectedClass) {
            classData[cls] = (classData[cls] || 0) + (count || 0);
          }
        });
      }
    });

    return Object.entries(classData)
      .map(([name, value]) => ({ name: `Class ${name}`, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  // Prepare subject-wise data (respects activeModule)
  const getSubjectWiseData = () => {
    if (!giniAnalytics || !giniAnalytics.analytics) return [];

    const subjectData = {};

    Object.entries(giniAnalytics.analytics).forEach(([moduleId, module]) => {
      // Filter by active module (except "all")
      if (activeModule !== "all" && moduleId !== activeModule) return;

      if (module.subject_wise) {
        Object.entries(module.subject_wise).forEach(([subject, count]) => {
          if (selectedSubject === "all" || subject === selectedSubject) {
            subjectData[subject] = (subjectData[subject] || 0) + (count || 0);
          }
        });
      }
    });

    return Object.entries(subjectData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  // Prepare table data (respects activeModule)
  const getTableData = () => {
    if (!giniAnalytics || !giniAnalytics.analytics) return [];

    const tableRows = [];
    const modules = giniAnalytics.analytics;

    Object.entries(modules).forEach(([moduleId, module]) => {
      // Filter by active module (except "all")
      if (activeModule !== "all" && moduleId !== activeModule) return;

      if (module.class_wise && module.subject_wise) {
        Object.entries(module.class_wise).forEach(([cls]) => {
          Object.entries(module.subject_wise).forEach(
            ([subject, interactions]) => {
              if (
                (selectedClass === "all" || cls === selectedClass) &&
                (selectedSubject === "all" || subject === selectedSubject)
              ) {
                const total = interactions || 0;
                tableRows.push({
                  class: cls,
                  subject,
                  totalInteractions: total,
                  activeStudents: Math.floor(total / 3), // Mock calculation
                });
              }
            },
          );
        });
      }
    });

    return tableRows.slice(0, 20);
  };

  // Utility: download a blob
  const downloadBlob = (filename, blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Export as PDF: capture the table area and create PDF
  const exportPDF = async () => {
    try {
      const element = document.getElementById("dashboard-export-area");
      if (!element) {
        toast.error("No report area found to export");
        return null;
      }

      // Use a higher scale to improve quality
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      // A4 size calculation
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate image dimensions while preserving aspect ratio
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let position = 0;
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      } else {
        // If taller than page, add multiple pages
        let remainingHeight = imgHeight;
        const pageCanvas = document.createElement("canvas");
        const ctx = pageCanvas.getContext("2d");

        const ratio = canvas.width / imgProps.width;
        const pagePxWidth = Math.floor(pageWidth * ratio);
        const pagePxHeight = Math.floor(pageHeight * ratio);

        pageCanvas.width = pagePxWidth;
        pageCanvas.height = pagePxHeight;

        let srcY = 0;
        while (remainingHeight > 0) {
          ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            srcY,
            pagePxWidth,
            pagePxHeight,
            0,
            0,
            pagePxWidth,
            pagePxHeight,
          );
          const pageData = pageCanvas.toDataURL("image/png");
          pdf.addImage(pageData, "PNG", 0, 0, pageWidth, pageHeight);
          remainingHeight -= pagePxHeight;
          srcY += pagePxHeight;
          if (remainingHeight > 0) pdf.addPage();
        }
      }

      // Save PDF locally
      pdf.save(`gini_report_${new Date().toISOString().slice(0, 10)}.pdf`);

      toast.success("PDF exported");
      // Return blob for potential sharing
      try {
        const pdfBlob = pdf.output("blob");
        return pdfBlob;
      } catch (err) {
        return null;
      }
    } catch (error) {
      console.error("PDF export failed", error);
      toast.error("Failed to export PDF");
      return null;
    }
  };

  // Export CSV (Excel-friendly)
  const exportCSV = () => {
    const rows = getTableData();

    if (!rows || rows.length === 0) {
      toast.error("No table data to export");
      return;
    }

    const header = [
      "Class",
      "Subject",
      "Total Interactions",
      "Active Students",
    ];

    const csvRows = [header.join(",")]
      .concat(
        rows.map((r) =>
          [
            r.class,
            `"${r.subject.replace(/"/g, '""')}"`,
            r.totalInteractions,
            r.activeStudents,
          ].join(","),
        ),
      )
      .join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    downloadBlob(
      `gini_report_${new Date().toISOString().slice(0, 10)}.csv`,
      blob,
    );
    toast.success("CSV exported (open with Excel)");
  };

  // Share report: try Web Share API with a generated PDF if supported, otherwise fallback to download
  const shareReport = async () => {
    try {
      const pdfBlob = await exportPDF();
      if (pdfBlob && navigator.canShare) {
        const file = new File(
          [pdfBlob],
          `gini_report_${new Date().toISOString().slice(0, 10)}.pdf`,
          { type: "application/pdf" },
        );
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "GiNi Report",
            text: "GiNi analytics report",
          });
          toast.success("Report shared");
          return;
        }
      }

      // Fallback: if can't share, download PDF and instruct user
      toast("Sharing not supported in this browser. PDF downloaded instead.");
    } catch (error) {
      console.error("Share failed", error);
      toast.error("Failed to share report");
    }
  };

  const handleExport = (format) => {
    if (format === "PDF") exportPDF();
    else if (format === "Excel") exportCSV();
    else if (format === "Share") shareReport();
  };

  const stats = getSummaryStats();
  const usageTrendData = getUsageTrendData();
  const classWiseData = getClassWiseData();
  const subjectWiseData = getSubjectWiseData();
  const tableData = getTableData();

  // IMPORTANT: make sure these IDs match backend analytics keys
  const modulesConfig = [
    {
      id: "all",
      name: "All Modules",
      icon: Activity,
      color: "bg-gray-100 text-gray-700",
    },
    {
      id: "ai_assistant", // must match giniAnalytics.analytics key
      name: "AI Assistant",
      icon: Brain,
      color: "bg-purple-100 text-purple-700",
    },
    {
      id: "quiz", // must match giniAnalytics.analytics key
      name: "Quiz",
      icon: FileQuestion,
      color: "bg-blue-100 text-blue-700",
    },
    {
      id: "test_generator", // must match giniAnalytics.analytics key
      name: "Test Generator",
      icon: ListChecks,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      id: "summary", // must match giniAnalytics.analytics key
      name: "Summary",
      icon: FileText,
      color: "bg-orange-100 text-orange-700",
    },
    {
      id: "notes", // must match giniAnalytics.analytics key
      name: "Notes",
      icon: Lightbulb,
      color: "bg-pink-100 text-pink-700",
    },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            GiNi School Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Academic Year 2024-25 | Admin Profile
          </p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Time Period:
          </label>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={timePeriod}
            onChange={(e) => setTimePeriod(Number(e.target.value))}
          >
            <option value={7}>Week</option>
            <option value={30}>Month</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Class:</label>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">All Classes</option>

            {classes.map((cls) => (
              <option key={cls.id} value={cls.standard}>
                {cls.name} {/* e.g. "Class 7" from your screenshot */}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Subject:</label>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {[
              "Mathematics",
              "Science",
              "English",
              "Physics",
              "Chemistry",
              "Biology",
            ].map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Students Using AI
                </p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total AI Interactions
                </p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stats.totalInteractions.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Classes
                </p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stats.activeClasses}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <GraduationCap className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Weekly Growth
                </p>
                <p className="text-4xl font-bold text-emerald-600 mt-2">
                  +{stats.weeklyGrowth}%
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Tabs */}
      <div className="flex flex-wrap gap-2">
        {modulesConfig.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule === module.id;
          return (
            <Button
              key={module.id}
              variant={isActive ? "default" : "outline"}
              className={`font-medium ${isActive ? module.color : "bg-white"}`}
              onClick={() => setActiveModule(module.id)}
            >
              <Icon className="h-4 w-4 mr-2" />
              {module.name}
            </Button>
          );
        })}
      </div>

      {/* Charts Section */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart - Usage Trend */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Usage Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={usageTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  {activeModule === "all" ? (
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                    />
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="interactions"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Class-wise Chart */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Class-wise Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={classWiseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subject-wise Chart */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Subject-wise Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectWiseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div id="dashboard-export-area">
            {/* <-- area captured for PDF export */}
            <div className="overflow-x-auto">
              <table id="gini-report-table" className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Class
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Subject
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Total Interactions
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      Active Students
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.length > 0 ? (
                    tableData.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">Class {row.class}</td>
                        <td className="p-3">{row.subject}</td>
                        <td className="p-3 font-medium">
                          {row.totalInteractions}
                        </td>
                        <td className="p-3">{row.activeStudents}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-500">
                        No data available for the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => handleExport("PDF")}
        >
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => handleExport("Excel")}
        >
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => handleExport("Share")}
        >
          <Share2 className="h-4 w-4" />
          Share Report
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
