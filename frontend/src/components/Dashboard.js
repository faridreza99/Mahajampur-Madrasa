import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Users, 
  UserCheck, 
  BookOpen, 
  TrendingUp,
  UserX,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Bell,
  MessageSquare,
  BarChart3,
  Brain,
  FileQuestion,
  FileText,
  ListChecks,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_API_URL;
const API = BACKEND_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_students: 0,
    total_staff: 0,
    total_teachers: 0,
    total_classes: 0,
    present_today: 0,
    absent_today: 0,
    not_taken: 0,
    out_pass: 0
  });
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [giniAnalytics, setGiniAnalytics] = useState(null);
  const [giniPeriod, setGiniPeriod] = useState(7); // 7 or 30 days
  const [giniLoading, setGiniLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchGiniAnalytics(giniPeriod);
  }, []);

  useEffect(() => {
    fetchGiniAnalytics(giniPeriod);
  }, [giniPeriod]);

  const fetchDashboardData = async () => {
    console.log('🔄 Fetching dashboard data...');
    console.log('📍 API Base URL:', API);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      console.log('📡 Calling API endpoints...');
      const [statsResponse, admissionsResponse] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { headers }),
        axios.get(`${API}/dashboard/recent-admissions?limit=5`, { headers })
      ]);
      
      console.log('✅ Stats received:', statsResponse.data);
      console.log('✅ Admissions received:', admissionsResponse.data);
      
      setStats(statsResponse.data);
      setRecentAdmissions(admissionsResponse.data.admissions || []);
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      console.error('Error details:', error.response || error.message);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchGiniAnalytics = async (days) => {
    setGiniLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/gini/usage/analytics?days=${days}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setGiniAnalytics(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch GiNi analytics:', error);
      // Silently fail - GiNi analytics is optional
    } finally {
      setGiniLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description, trend }) => (
    <Card className="stats-card card-hover">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600">{title}</p>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {trend && (
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {trend}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-full ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AttendanceCard = ({ title, value, icon: Icon, color, percentage }) => (
    <Card className="card-hover">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            <p className="text-xs text-gray-500">{percentage}% of total</p>
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalStudents = stats.total_students || 0;
  const presentPercentage = totalStudents > 0 ? ((stats.present_today / totalStudents) * 100).toFixed(1) : 0;
  const absentPercentage = totalStudents > 0 ? ((stats.absent_today / totalStudents) * 100).toFixed(1) : 0;
  const notTakenPercentage = totalStudents > 0 ? ((stats.not_taken / totalStudents) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4 fade-in pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Welcome back! Here's what's happening at your school today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Button>
          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
            <Bell className="h-4 w-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.total_students}
          icon={Users}
          color="bg-blue-500"
          description="Active enrollments"
          trend="+12%"
        />
        <StatCard
          title="Total Teachers"
          value={stats.total_teachers}
          icon={UserCheck}
          color="bg-emerald-500"
          description="Active faculty"
          trend="+5%"
        />
        <StatCard
          title="Total Staff"
          value={stats.total_staff}
          icon={UserCheck}
          color="bg-purple-500"
          description="All employees"
          trend="+8%"
        />
        <StatCard
          title="Total Classes"
          value={stats.total_classes}
          icon={BookOpen}
          color="bg-orange-500"
          description="Active sections"
          trend="+2%"
        />
      </div>

      {/* Attendance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              <span>Today's Attendance</span>
            </CardTitle>
            <CardDescription>
              Real-time attendance tracking for {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AttendanceCard
                title="Present"
                value={stats.present_today}
                icon={CheckCircle}
                color="bg-emerald-500"
                percentage={presentPercentage}
              />
              <AttendanceCard
                title="Absent"
                value={stats.absent_today}
                icon={UserX}
                color="bg-red-500"
                percentage={absentPercentage}
              />
              <AttendanceCard
                title="Not Taken"
                value={stats.not_taken}
                icon={Clock}
                color="bg-orange-500"
                percentage={notTakenPercentage}
              />
              <AttendanceCard
                title="Out Pass"
                value={stats.out_pass}
                icon={AlertTriangle}
                color="bg-purple-500"
                percentage="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used features and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-500 transition-colors"
                onClick={() => navigate('/students')}
              >
                <Users className="h-6 w-6" />
                <span className="text-sm">Add Student</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 transition-colors"
                onClick={() => navigate('/attendance')}
              >
                <UserCheck className="h-6 w-6" />
                <span className="text-sm">Mark Attendance</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-500 transition-colors"
                onClick={() => toast.info('Message feature coming soon!')}
              >
                <MessageSquare className="h-6 w-6" />
                <span className="text-sm">Send Message</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col space-y-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-500 transition-colors"
                onClick={() => navigate('/reports')}
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest student admissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentAdmissions.length > 0 ? (
                recentAdmissions.map((admission) => (
                  <div key={admission.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="bg-emerald-500 p-2 rounded-full">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium dark:text-gray-100">New student admission</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {admission.name} admitted to {admission.class_section}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{admission.time_ago}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent admissions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Important updates and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Fee Payment Overdue</p>
                  <p className="text-xs text-red-600 dark:text-red-400">15 students have overdue fee payments</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-orange-500 dark:text-orange-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Attendance Pending</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Class 12-B attendance not marked yet</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Backup Completed</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Daily database backup successful</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GiNi Module Usage Analytics */}
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <span>Dashboard (GiNi) - AI Module Usage Analytics</span>
              </CardTitle>
              <CardDescription>
                Weekly and monthly usage statistics for all GiNi AI modules
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={giniPeriod === 7 ? "default" : "outline"}
                onClick={() => setGiniPeriod(7)}
                className={giniPeriod === 7 ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                7 Days
              </Button>
              <Button
                size="sm"
                variant={giniPeriod === 30 ? "default" : "outline"}
                onClick={() => setGiniPeriod(30)}
                className={giniPeriod === 30 ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                30 Days
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {giniLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : giniAnalytics && giniAnalytics.analytics ? (
            <>
              {/* Module Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {/* AI Assistant */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Brain className="h-6 w-6 text-purple-600" />
                      <span className="text-2xl font-bold text-purple-700">
                        {giniAnalytics.analytics.ai_assistant.total_interactions}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-purple-900">AI Assistant (GiNi)</h4>
                    <p className="text-xs text-purple-600 mt-1">Total interactions</p>
                  </CardContent>
                </Card>

                {/* Quiz */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <FileQuestion className="h-6 w-6 text-blue-600" />
                      <span className="text-2xl font-bold text-blue-700">
                        {giniAnalytics.analytics.quiz.total_interactions}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-blue-900">GiNi Quiz</h4>
                    <p className="text-xs text-blue-600 mt-1">Total quiz attempts</p>
                  </CardContent>
                </Card>

                {/* Test Generator */}
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <ListChecks className="h-6 w-6 text-emerald-600" />
                      <span className="text-2xl font-bold text-emerald-700">
                        {giniAnalytics.analytics.test_generator.total_interactions}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-emerald-900">GiNi Test Generator</h4>
                    <p className="text-xs text-emerald-600 mt-1">Tests generated</p>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <FileText className="h-6 w-6 text-orange-600" />
                      <span className="text-2xl font-bold text-orange-700">
                        {giniAnalytics.analytics.summary.total_interactions}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-orange-900">GiNi Summary</h4>
                    <p className="text-xs text-orange-600 mt-1">Summaries generated</p>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Lightbulb className="h-6 w-6 text-pink-600" />
                      <span className="text-2xl font-bold text-pink-700">
                        {giniAnalytics.analytics.notes.total_interactions}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-pink-900">GiNi Notes</h4>
                    <p className="text-xs text-pink-600 mt-1">Notes generated</p>
                  </CardContent>
                </Card>
              </div>

              {/* Class-wise and Subject-wise Breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Class-wise Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Class-wise Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(
                        Object.values(giniAnalytics.analytics).reduce((acc, module) => {
                          Object.entries(module.class_wise || {}).forEach(([cls, count]) => {
                            acc[cls] = (acc[cls] || 0) + count;
                          });
                          return acc;
                        }, {})
                      ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cls, count]) => (
                        <div key={cls} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 font-medium text-sm">Class {cls}</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${Math.min(100, (count / Math.max(...Object.values(
                                  Object.values(giniAnalytics.analytics).reduce((acc, module) => {
                                    Object.entries(module.class_wise || {}).forEach(([c, cnt]) => {
                                      acc[c] = (acc[c] || 0) + cnt;
                                    });
                                    return acc;
                                  }, {})
                                ))) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{count}</span>
                        </div>
                      ))}
                      {Object.keys(
                        Object.values(giniAnalytics.analytics).reduce((acc, module) => {
                          Object.entries(module.class_wise || {}).forEach(([cls, count]) => {
                            acc[cls] = (acc[cls] || 0) + count;
                          });
                          return acc;
                        }, {})
                      ).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No class data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Subject-wise Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Subject-wise Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(
                        Object.values(giniAnalytics.analytics).reduce((acc, module) => {
                          Object.entries(module.subject_wise || {}).forEach(([subj, count]) => {
                            acc[subj] = (acc[subj] || 0) + count;
                          });
                          return acc;
                        }, {})
                      ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([subj, count]) => (
                        <div key={subj} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-24 font-medium text-sm truncate">{subj}</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                              <div
                                className="bg-emerald-600 h-2 rounded-full"
                                style={{ width: `${Math.min(100, (count / Math.max(...Object.values(
                                  Object.values(giniAnalytics.analytics).reduce((acc, module) => {
                                    Object.entries(module.subject_wise || {}).forEach(([s, cnt]) => {
                                      acc[s] = (acc[s] || 0) + cnt;
                                    });
                                    return acc;
                                  }, {})
                                ))) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{count}</span>
                        </div>
                      ))}
                      {Object.keys(
                        Object.values(giniAnalytics.analytics).reduce((acc, module) => {
                          Object.entries(module.subject_wise || {}).forEach(([subj, count]) => {
                            acc[subj] = (acc[subj] || 0) + count;
                          });
                          return acc;
                        }, {})
                      ).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No subject data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No GiNi usage data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;