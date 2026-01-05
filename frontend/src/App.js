import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  lazy,
  Suspense,
} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import "./App.css";

import { CurrencyProvider } from "./context/CurrencyContext";
import { InstitutionProvider } from "./context/InstitutionContext";
import { LoadingProvider } from "./context/LoadingContext";

import LoginPage from "./components/LoginPage";
import DashboardLayout from "./components/DashboardLayout";

import { Toaster } from "./components/ui/sonner";
import { useInstitution } from "./context/InstitutionContext";

const Dashboard = lazy(() => import("./components/Dashboard"));
const MadrasahDashboard = lazy(() => import("./components/MadrasahDashboard"));
const StudentList = lazy(() => import("./components/StudentList"));
const StaffList = lazy(() => import("./components/StaffList"));
const ClassManagement = lazy(() => import("./components/ClassManagement"));
const AdmissionSummary = lazy(() => import("./components/AdmissionSummary"));
const HSS = lazy(() => import("./components/HSS"));
const Fees = lazy(() => import("./components/Fees"));
const Accounts = lazy(() => import("./components/Accounts"));
const Certificates = lazy(() => import("./components/Certificates"));
const Vehicle = lazy(() => import("./components/Vehicle"));
const Reports = lazy(() => import("./components/Reports"));
const Payroll = lazy(() => import("./components/Payroll"));
const BiometricDevices = lazy(() => import("./components/BiometricDevices"));
const OnlineAdmission = lazy(() => import("./components/OnlineAdmission"));
const Attendance = lazy(() => import("./components/Attendance"));
const StudentAttendance = lazy(() => import("./components/StudentAttendance"));
const Calendar = lazy(() => import("./components/Calendar"));
const Settings = lazy(() => import("./components/Settings"));
const AIAssistant = lazy(() => import("./components/AIAssistant"));
const AILogs = lazy(() => import("./components/AILogs"));
const AcademicCMS = lazy(() => import("./components/AcademicCMS"));
const QuizTool = lazy(() => import("./components/QuizTool"));
const TestGenerator = lazy(() => import("./components/TestGenerator"));
const QuestionPaperBuilder = lazy(
  () => import("./components/QuestionPaperBuilder"),
);
const SchoolBranding = lazy(() => import("./components/SchoolBranding"));
const AISummary = lazy(() => import("./components/AISummary"));
const AINotes = lazy(() => import("./components/AINotes"));
const Notifications = lazy(() => import("./components/Notifications"));
const RatingSurveys = lazy(() => import("./components/RatingSurveys"));
const Results = lazy(() => import("./components/Results"));
const StudentResults = lazy(() => import("./components/StudentResults"));
const ParentResults = lazy(() => import("./components/ParentResults"));
const MadrasahSimpleResult = lazy(
  () => import("./components/MadrasahSimpleResult"),
);
const MadrasahSimpleRoutine = lazy(
  () => import("./components/MadrasahSimpleRoutine"),
);
const MadrasahReportPage = lazy(
  () => import("./components/MadrasahReportPage"),
);
const MadrasahSimpleSettings = lazy(
  () => import("./components/MadrasahSimpleSettings"),
);
const ResultConfiguration = lazy(
  () => import("./components/ResultConfiguration"),
);
const TenantManagement = lazy(() => import("./components/TenantManagement"));
const SubscriptionManagement = lazy(
  () => import("./components/SubscriptionManagement"),
);
const SubscriptionHistory = lazy(
  () => import("./components/SubscriptionHistory"),
);
const SystemSettings = lazy(() => import("./components/SystemSettings"));
const StudentDashboard = lazy(() => import("./components/StudentDashboard"));
const StudentProfile = lazy(() => import("./components/StudentProfile"));
const StudentFees = lazy(() => import("./components/StudentFees"));
const StudentAdmitCard = lazy(() => import("./components/StudentAdmitCard"));
const StudentAttendanceView = lazy(
  () => import("./components/StudentAttendanceView"),
);
const StudentIDCard = lazy(() => import("./components/StudentIDCard"));
const StaffIDCard = lazy(() => import("./components/StaffIDCard"));
const TeacherDashboard = lazy(() => import("./components/TeacherDashboard"));
const Homework = lazy(() => import("./components/Homework"));
const LessonPlans = lazy(() => import("./components/LessonPlans"));
const Search = lazy(() => import("./components/Search"));
const AdmissionFees = lazy(() => import("./components/AdmissionFees"));
const FeeSetup = lazy(() => import("./components/FeeSetup"));
const CommitteeDonation = lazy(() => import("./components/CommitteeDonation"));
const FinancialSummary = lazy(
  () => import("./components/reports/FinancialSummary"),
);
const AdmissionFeeReport = lazy(
  () => import("./components/reports/AdmissionFeeReport"),
);
const MonthlyFeeReport = lazy(
  () => import("./components/reports/MonthlyFeeReport"),
);
const DonationReport = lazy(
  () => import("./components/reports/DonationReport"),
);
const DateWiseReport = lazy(
  () => import("./components/reports/DateWiseReport"),
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
  </div>
);

const API = process.env.REACT_APP_API_URL || "/api";
console.log("API URL - ", API);

const useDynamicBranding = () => {
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const token = localStorage.getItem("token");
        let response;

        if (token) {
          response = await axios.get(`${API}/institution`, {
            headers: { Authorization: `Bearer ${token}`, skipLoader: "true" },
          });
        } else {
          response = await axios.get(`${API}/institution/public/mham5678`, {
            headers: { skipLoader: "true" },
          });
        }

        if (response.data) {
          if (response.data.site_title) {
            document.title = response.data.site_title;
          }
          if (response.data.favicon_url) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement("link");
              link.rel = "icon";
              document.head.appendChild(link);
            }
            link.href = response.data.favicon_url;
          }
        }
      } catch (error) {
        console.log("Could not load branding settings");
      }
    };

    fetchBranding();
  }, []);
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
          delete axios.defaults.headers.common["Authorization"];
          window.location.href = "/login";
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password, tenantId = null) => {
    console.log("Login function called with:", {
      username,
      password: "***",
      tenantId,
    });
    try {
      console.log("Making API request to:", `${API}/auth/login`);
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password,
        tenant_id: tenantId,
      });

      console.log("Login API response:", response.data);
      const { access_token, user: userData } = response.data;

      localStorage.setItem("token", access_token);
      window.dispatchEvent(new Event("userLoggedIn"));
      localStorage.setItem("user", JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);

      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      return { success: true };
    } catch (error) {
      console.error("Login API failed:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

const ResultsRouter = () => {
  const { user } = useAuth();

  if (user?.role === "student") {
    return <StudentResults />;
  } else if (user?.role === "parent") {
    return <ParentResults />;
  } else {
    return <Results />;
  }
};

const DashboardWrapper = () => {
  const { isMadrasahSimpleUI } = useInstitution();
  return isMadrasahSimpleUI ? <MadrasahDashboard /> : <Dashboard />;
};

const BrandingLoader = () => {
  useDynamicBranding();
  return null;
};

const ProtectedDashboardLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return user ? <DashboardLayout /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <LoadingProvider>
      <CurrencyProvider>
        <AuthProvider>
          <InstitutionProvider>
            <Router>
              <BrandingLoader />
              <div className="App">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    
                    <Route element={<ProtectedDashboardLayout />}>
                      <Route path="/" element={<DashboardWrapper />} />
                      <Route path="/dashboard" element={<DashboardWrapper />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/admission-summary" element={<AdmissionSummary />} />
                      <Route path="/students/attendance/*" element={<StudentAttendance />} />
                      <Route path="/students/id-cards" element={<StudentIDCard />} />
                      <Route path="/students/*" element={<StudentList />} />
                      <Route path="/staff/id-cards" element={<StaffIDCard />} />
                      <Route path="/staff/*" element={<StaffList />} />
                      <Route path="/classes" element={<ClassManagement />} />
                      <Route path="/attendance/*" element={<Attendance />} />
                      <Route path="/results" element={<ResultsRouter />} />
                      <Route path="/result-configuration" element={<ResultConfiguration />} />
                      <Route path="/madrasah/simple-result" element={<MadrasahSimpleResult />} />
                      <Route path="/madrasah/simple-routine" element={<MadrasahSimpleRoutine />} />
                      <Route path="/madrasah/simple-settings" element={<MadrasahSimpleSettings />} />
                      <Route path="/madrasah/reports" element={<MadrasahReportPage />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/rating-surveys" element={<RatingSurveys />} />
                      <Route path="/hss/*" element={<HSS />} />
                      <Route path="/fees/*" element={<Fees />} />
                      <Route path="/fees/setup" element={<FeeSetup />} />
                      <Route path="/admission-fees" element={<AdmissionFees />} />
                      <Route path="/committee-donation" element={<CommitteeDonation />} />
                      <Route path="/payroll/*" element={<Payroll />} />
                      <Route path="/accounts" element={<Accounts />} />
                      <Route path="/certificates/*" element={<Certificates />} />
                      <Route path="/vehicle/*" element={<Vehicle />} />
                      <Route path="/reports/*" element={<Reports />} />
                      <Route path="/biometric/*" element={<BiometricDevices />} />
                      <Route path="/online-admission/*" element={<OnlineAdmission />} />
                      <Route path="/settings/*" element={<Settings />} />
                      <Route path="/tenant-management" element={<TenantManagement />} />
                      <Route path="/subscription-management" element={<SubscriptionManagement />} />
                      <Route path="/system-settings" element={<SystemSettings />} />
                      <Route path="/school-branding" element={<SchoolBranding />} />
                      <Route path="/subscription-history" element={<SubscriptionHistory />} />
                      <Route path="/cms" element={<AcademicCMS />} />
                      <Route path="/ai-assistant" element={<AIAssistant />} />
                      <Route path="/ai-assistant/logs" element={<AILogs />} />
                      <Route path="/quiz-tool" element={<QuizTool />} />
                      <Route path="/test-generator" element={<TestGenerator />} />
                      <Route path="/question-paper-builder" element={<QuestionPaperBuilder />} />
                      <Route path="/ai-summary" element={<AISummary />} />
                      <Route path="/ai-notes" element={<AINotes />} />
                      <Route path="/student/dashboard" element={<StudentDashboard />} />
                      <Route path="/student/profile" element={<StudentProfile />} />
                      <Route path="/student/fees" element={<StudentFees />} />
                      <Route path="/student/admit-card" element={<StudentAdmitCard />} />
                      <Route path="/student/attendance" element={<StudentAttendanceView />} />
                      <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                      <Route path="/homework" element={<Homework />} />
                      <Route path="/lesson-plans" element={<LessonPlans />} />
                      <Route path="/reports/financial-summary" element={<FinancialSummary />} />
                      <Route path="/reports/admission-fees" element={<AdmissionFeeReport />} />
                      <Route path="/reports/monthly-fees" element={<MonthlyFeeReport />} />
                      <Route path="/reports/donations" element={<DonationReport />} />
                      <Route path="/reports/date-wise" element={<DateWiseReport />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                  </Routes>
                </Suspense>
                <Toaster />
              </div>
            </Router>
          </InstitutionProvider>
        </AuthProvider>
      </CurrencyProvider>
    </LoadingProvider>
  );
}

export default App;
