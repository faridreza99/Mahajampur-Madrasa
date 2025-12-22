import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import i18n from "../i18n";
import {
  Home,
  Users,
  UserCheck,
  BookOpen,
  GraduationCap,
  DollarSign,
  Calculator,
  Award,
  Car,
  BarChart3,
  Fingerprint,
  UserPlus,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
  Sparkles,
  Target,
  FileText,
  Bell,
  Star,
  MessageSquare,
  Calendar,
  Clock,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { ScrollArea } from "./ui/scroll-area";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState({});
  const [, forceUpdate] = useState(0);
  const [allowedModules, setAllowedModules] = useState(null);
  const [modulesLoaded, setModulesLoaded] = useState(false);

  useEffect(() => {
    const handleLanguageChange = () => forceUpdate((n) => n + 1);
    i18n.on("languageChanged", handleLanguageChange);
    return () => i18n.off("languageChanged", handleLanguageChange);
  }, []);

  useEffect(() => {
    const fetchAllowedModules = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setModulesLoaded(true);
          return;
        }

        const response = await fetch("/api/tenant/allowed-modules", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setAllowedModules(data.allowed_modules || []);
        }
      } catch (error) {
        console.error("Error fetching allowed modules:", error);
      } finally {
        setModulesLoaded(true);
      }
    };

    fetchAllowedModules();
  }, [user, location.pathname]);

  const t = (key) => i18n.t(key);

  const toggleMenu = (menuKey) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const menuItems = [
    {
      key: "home",
      title: "Dashboard",
      icon: Home,
      path: "/dashboard",
      roles: ["super_admin", "admin", "teacher", "student", "parent"],
    },
    {
      key: "academic",
      title: "Academic",
      icon: GraduationCap,
      roles: ["super_admin", "admin", "teacher", "student", "parent", "principal"],
      subItems: [
        {
          title: "Attendance",
          path: "/attendance",
          roles: ["super_admin", "admin", "teacher", "student"],
        },
        {
          title: "Results",
          path: "/results",
          roles: ["super_admin", "admin", "principal", "teacher", "student", "parent"],
        },
        {
          title: "TimeTable",
          path: "/settings/timetable",
          roles: ["super_admin", "admin", "teacher", "student"],
        },
        {
          title: "Calendar",
          path: "/calendar",
          roles: ["super_admin", "admin", "teacher", "student"],
        },
        {
          title: "Classes",
          path: "/classes",
          roles: ["super_admin", "admin", "teacher"],
        },
      ],
    },
    {
      key: "students",
      title: "Students",
      icon: Users,
      roles: ["super_admin", "admin", "teacher"],
      subItems: [
        {
          title: "Student List",
          path: "/students",
          roles: ["super_admin", "admin", "teacher"],
        },
        {
          title: "Admission Summary",
          path: "/admission-summary",
          roles: ["super_admin", "admin"],
        },
      ],
    },
    {
      key: "staff",
      title: "Staff",
      icon: UserCheck,
      roles: ["super_admin", "admin", "teacher", "student"],
      subItems: [
        {
          title: "Staff List",
          path: "/staff",
          roles: ["super_admin", "admin", "teacher", "student"],
        },
        {
          title: "Add Staff",
          path: "/staff/add",
          roles: ["super_admin", "admin"],
        },
      ],
    },
    {
      key: "finance",
      title: "Finance",
      icon: DollarSign,
      roles: ["super_admin", "admin"],
      subItems: [
        {
          title: "Fees",
          path: "/fees/collection",
          roles: ["super_admin", "admin"],
        },
        {
          title: "Fee Structure",
          path: "/fees/structure",
          roles: ["super_admin", "admin"],
        },
        {
          title: "Fee Reports",
          path: "/fees/reports",
          roles: ["super_admin", "admin"],
        },
        {
          title: "Accounts",
          path: "/accounts",
          roles: ["super_admin", "admin"],
        },
        {
          title: "Certificates",
          path: "/certificates",
          roles: ["super_admin", "admin"],
        },
      ],
    },
    {
      key: "content",
      title: "Content",
      icon: BookOpen,
      roles: ["super_admin", "admin", "teacher", "student"],
      subItems: [
        {
          title: "Academic CMS",
          path: "/cms",
          roles: ["super_admin", "admin"],
        },
        {
          title: "View Content",
          path: "/cms/view",
          roles: ["teacher", "student"],
        },
      ],
    },
    {
      key: "ai-tools",
      title: "AI Tools",
      icon: Sparkles,
      roles: ["super_admin", "admin", "teacher", "student"],
      subItems: [
        {
          title: "AI Assistant",
          path: "/ai-assistant",
          roles: ["super_admin", "admin", "teacher", "student"],
        },
        {
          title: "Quiz Tool",
          path: "/quiz-tool",
          roles: ["super_admin", "admin", "teacher", "student"],
        },
        {
          title: "Test Generator",
          path: "/test-generator",
          roles: ["super_admin", "admin", "teacher"],
        },
        {
          title: "AI Summary",
          path: "/ai-summary",
          roles: ["super_admin", "admin", "teacher", "student"],
        },
        {
          title: "AI Notes",
          path: "/ai-notes",
          roles: ["super_admin", "admin", "teacher", "student"],
        },
        {
          title: "AI Activity Logs",
          path: "/ai-assistant/logs",
          roles: ["super_admin", "admin"],
        },
      ],
    },
    {
      key: "reports",
      title: "Reports",
      icon: BarChart3,
      path: "/reports",
      roles: ["super_admin", "admin"],
    },
    {
      key: "communication",
      title: "Communication",
      icon: MessageSquare,
      roles: ["super_admin", "admin", "teacher", "student"],
      subItems: [
        {
          title: "Notifications",
          path: "/notifications",
          roles: ["super_admin", "admin", "teacher", "student"],
        },
        {
          title: "Rating & Reviews",
          path: "/rating-surveys",
          roles: ["super_admin", "admin"],
        },
      ],
    },
    {
      key: "settings",
      title: "Settings",
      icon: Settings,
      roles: ["super_admin", "admin"],
      subItems: [
        {
          title: "School Settings",
          path: "/settings",
          roles: ["super_admin", "admin"],
        },
        {
          title: "Tenant Management",
          path: "/tenant-management",
          roles: ["super_admin"],
        },
        {
          title: "Vehicle/Transport",
          path: "/transport/routes",
          roles: ["super_admin", "admin"],
        },
        {
          title: "Biometric Devices",
          path: "/biometric",
          roles: ["super_admin", "admin"],
        },
        {
          title: "Online Admission",
          path: "/online-admission",
          roles: ["super_admin", "admin"],
        },
        {
          title: "HSS Module",
          path: "/hss/students",
          roles: ["super_admin", "admin"],
        },
      ],
    },
  ];

  // Module key mapping: sidebar keys to backend module names (match exact backend format)
  const moduleKeyMapping = {
    home: ["home", "dashboard"],
    academic: ["attendance", "results", "timetable", "calendar", "class", "classes"],
    students: ["students", "admission-summary", "admission_summary"],
    staff: ["staff"],
    finance: ["fees", "accounts"],
    aitools: ["cms", "academic_cms", "ai-assistant", "ai_assistant", "quiz-tool", "quiz_tool", "test-generator", "test_generator", "ai-summary", "ai_summary", "ai-notes", "ai_notes"],
    reports: ["reports"],
    certificates: ["certificates"],
    communication: ["communication", "notifications"],
    settings: ["settings", "vehicle", "vehicle_transport", "biometric", "biometric_devices", "online-admission", "online_admission", "hss-module", "hss_module", "tenant_management"],
  };

  // Don't show any menu items until modules are loaded (except for super_admin who sees all)
  const filteredMenuItems = menuItems.filter((item) => {
    const hasRole = item.roles.includes(user?.role);

    // Super admin always sees all modules they have role access to
    if (user?.role === "super_admin") {
      return hasRole;
    }

    // For other users, don't show anything until modules are loaded
    if (!modulesLoaded) {
      return false;
    }

    // If no module restrictions set (empty array or null), show all role-allowed items
    if (!allowedModules || allowedModules.length === 0) {
      return hasRole;
    }

    // Check if any of the mapped modules for this menu item are allowed
    const mappedModules = moduleKeyMapping[item.key] || [item.key];
    const hasAllowedModule = mappedModules.some(mod => allowedModules.includes(mod));
    
    return hasRole && hasAllowedModule;
  });

  // Flag to show loading state for non-super_admin users
  const isLoadingModules = user?.role !== "super_admin" && !modulesLoaded;

  const isActiveMenu = (item) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.subItems) {
      return item.subItems.some(
        (subItem) => location.pathname === subItem.path,
      );
    }
    return false;
  };

  const handleNavigation = (path) => {
    if (path) {
      navigate(path);
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">School ERP</h1>
            <p className="text-gray-300 text-xs">{user?.full_name}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4">
        <nav className="py-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveMenu(item);
            const isOpen = openMenus[item.key];

            if (item.subItems) {
              return (
                <Collapsible
                  key={item.key}
                  open={isOpen}
                  onOpenChange={() => toggleMenu(item.key)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all hover:bg-white/10 ${
                        isActive
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-2 ml-8">
                    {item.subItems
                      .filter(
                        (subItem) =>
                          !subItem.roles || subItem.roles.includes(user?.role),
                      )
                      .map((subItem, index) => (
                        <button
                          key={index}
                          onClick={() => handleNavigation(subItem.path)}
                          className={`w-full text-left p-2 rounded-md text-sm transition-all hover:bg-white/10 ${
                            location.pathname === subItem.path
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {subItem.title}
                        </button>
                      ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all hover:bg-white/10 ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10"
        >
          <LogOut className="h-5 w-5 mr-3" />
          {t("common.logout")}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40 overflow-y-auto">
        <div className="glass-sidebar min-h-full">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative flex w-64 h-full glass-sidebar overflow-y-auto">
            <div className="flex flex-col w-full min-h-full">
              {/* Close button only - no duplicate header */}
              <div className="absolute top-4 right-4 z-10">
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
