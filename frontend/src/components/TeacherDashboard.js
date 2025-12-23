import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Users,
  BookOpen,
  Calendar,
  Bell,
  CheckCircle,
  AlertCircle,
  BookMarked,
  ClipboardList,
  FileText,
  GraduationCap,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_API_URL || '/api';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch teacher dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
            Unable to load dashboard. Please try again later.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { teacher, today, assigned, attendance_summary, pending_tasks, notifications } = dashboardData;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, {teacher?.name || 'Teacher'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {teacher?.designation || 'Teacher'} | {today?.day}, {new Date(today?.date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/attendance')} className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Take Attendance
          </Button>
          <Button variant="outline" onClick={() => navigate('/homework')} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Add Homework
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Classes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{today?.total_periods || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{assigned?.total_students || 0}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned Classes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{assigned?.classes?.length || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Subjects</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{assigned?.subjects?.length || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <BookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {attendance_summary && attendance_summary.total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Today's Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Present:</span>
                <span className="font-semibold text-green-600">{attendance_summary.present}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Absent:</span>
                <span className="font-semibold text-red-600">{attendance_summary.absent}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Late:</span>
                <span className="font-semibold text-orange-600">{attendance_summary.late}</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                <span className="font-semibold">{attendance_summary.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your classes for {today?.day}</CardDescription>
          </CardHeader>
          <CardContent>
            {today?.classes && today.classes.length > 0 ? (
              <div className="space-y-3">
                {today.classes.map((cls, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Period</p>
                        <p className="text-lg font-bold text-blue-600">{cls.period_number}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {cls.class_name} {cls.section && `- ${cls.section}`}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{cls.subject}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {cls.start_time} - {cls.end_time}
                      </p>
                      {cls.room_number && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Room: {cls.room_number}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No classes scheduled for today</p>
                <p className="text-sm">Enjoy your day off!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Pending Tasks
            </CardTitle>
            <CardDescription>Tasks that need your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {pending_tasks && pending_tasks.length > 0 ? (
              <div className="space-y-3">
                {pending_tasks.map((task, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      {task.type === 'marks_entry' ? (
                        <BookMarked className="h-5 w-5 text-blue-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-green-600" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                        {task.class_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{task.class_name}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm">No pending tasks at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              My Classes & Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Classes</p>
                <div className="flex flex-wrap gap-2">
                  {assigned?.classes?.map((cls, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {cls}
                    </Badge>
                  ))}
                  {(!assigned?.classes || assigned.classes.length === 0) && (
                    <span className="text-sm text-gray-500">No classes assigned</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {assigned?.subjects?.map((subject, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {subject}
                    </Badge>
                  ))}
                  {(!assigned?.subjects || assigned.subjects.length === 0) && (
                    <span className="text-sm text-gray-500">No subjects assigned</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-600" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications && notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notif, index) => (
                  <div 
                    key={notif.id || index}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700"
                  >
                    <Bell className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{notif.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No new notifications</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/attendance')}
            >
              <ClipboardList className="h-6 w-6 text-blue-600" />
              <span>Take Attendance</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/homework')}
            >
              <FileText className="h-6 w-6 text-green-600" />
              <span>Homework</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/lesson-plans')}
            >
              <BookMarked className="h-6 w-6 text-purple-600" />
              <span>Lesson Plans</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/results')}
            >
              <GraduationCap className="h-6 w-6 text-orange-600" />
              <span>Enter Marks</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
