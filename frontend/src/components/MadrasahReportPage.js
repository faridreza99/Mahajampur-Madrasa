import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  Users, 
  Calendar, 
  Award, 
  FileText, 
  Printer, 
  Download,
  ArrowLeft,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

const MadrasahReportPage = () => {
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedSession, setSelectedSession] = useState('2025');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [resultData, setResultData] = useState([]);
  const [schoolBranding, setSchoolBranding] = useState({});
  
  const printRef = useRef();

  const fetchClasses = useCallback(async () => {
    try {
      const response = await axios.get('/api/classes');
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  }, []);

  const fetchSections = useCallback(async (classId) => {
    if (!classId || classId === 'all') {
      setSections([]);
      return;
    }
    try {
      const response = await axios.get(`/api/sections?class_id=${classId}`);
      setSections(response.data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  }, []);

  const fetchBranding = useCallback(async () => {
    try {
      const response = await axios.get('/api/institution');
      setSchoolBranding(response.data || {});
    } catch (error) {
      console.error('Error fetching branding:', error);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchBranding();
  }, [fetchClasses, fetchBranding]);

  useEffect(() => {
    fetchSections(selectedClass);
  }, [selectedClass, fetchSections]);

  const fetchStudentReport = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/students?';
      if (selectedClass !== 'all') url += `class_id=${selectedClass}&`;
      if (selectedSection !== 'all') url += `section_id=${selectedSection}&`;
      const response = await axios.get(url);
      setStudents(response.data?.students || response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('ছাত্র তথ্য লোড করতে সমস্যা হয়েছে');
    }
    setLoading(false);
  }, [selectedClass, selectedSection]);

  const fetchAttendanceReport = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/attendance?type=student&';
      if (selectedClass !== 'all') url += `class_id=${selectedClass}&`;
      if (dateFrom) url += `date_from=${dateFrom}&`;
      if (dateTo) url += `date_to=${dateTo}&`;
      const response = await axios.get(url);
      setAttendanceData(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('হাজিরা তথ্য লোড করতে সমস্যা হয়েছে');
    }
    setLoading(false);
  }, [selectedClass, dateFrom, dateTo]);

  const fetchResultReport = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/results?';
      if (selectedClass !== 'all') url += `class_id=${selectedClass}&`;
      url += `session=${selectedSession}&`;
      const response = await axios.get(url);
      setResultData(response.data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('ফলাফল তথ্য লোড করতে সমস্যা হয়েছে');
    }
    setLoading(false);
  }, [selectedClass, selectedSession]);

  useEffect(() => {
    if (activeReport === 'student') fetchStudentReport();
    if (activeReport === 'attendance') fetchAttendanceReport();
    if (activeReport === 'result') fetchResultReport();
  }, [activeReport, fetchStudentReport, fetchAttendanceReport, fetchResultReport]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>রিপোর্ট - ${schoolBranding.school_name || 'মাদ্রাসা'}</title>
        <style>
          body { font-family: 'Noto Sans Bengali', sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #166534; color: white; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #166534; }
          .header p { margin: 5px 0; color: #666; }
          .summary { margin: 20px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${schoolBranding.school_name || 'মাদ্রাসা'}</h1>
          <p>${schoolBranding.address || ''}</p>
          <p>প্রিন্ট তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p>
        </div>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId || c._id === classId);
    return cls?.name || cls?.class_name || classId;
  };

  const reportCards = [
    {
      id: 'student',
      title: 'বিদ্যার্থী প্রতিবেদন',
      icon: Users,
      description: 'সকল ছাত্রের তালিকা ও তথ্য',
      color: 'bg-blue-500'
    },
    {
      id: 'attendance',
      title: 'হাজিরা প্রতিবেদন',
      icon: Calendar,
      description: 'উপস্থিতি ও অনুপস্থিতির হিসাব',
      color: 'bg-emerald-500'
    },
    {
      id: 'result',
      title: 'ফলাফল প্রতিবেদন',
      icon: Award,
      description: 'পরীক্ষার ফলাফল ও গ্রেড',
      color: 'bg-purple-500'
    }
  ];

  if (!activeReport) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-emerald-600" />
            রিপোর্ট
          </h1>
          <p className="text-gray-500 mt-2">প্রয়োজনীয় রিপোর্ট নির্বাচন করুন</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportCards.map((report) => (
            <Card 
              key={report.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-emerald-500"
              onClick={() => setActiveReport(report.id)}
            >
              <CardContent className="p-6 text-center">
                <div className={`${report.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <report.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{report.title}</h3>
                <p className="text-gray-500 text-sm">{report.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setActiveReport(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            পেছনে যান
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {reportCards.find(r => r.id === activeReport)?.title}
          </h1>
        </div>
        <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
          <Printer className="h-4 w-4 mr-2" />
          প্রিন্ট করুন
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 mb-1 block">মারহালা</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="মারহালা নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল মারহালা</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id || cls._id} value={cls.id || cls._id}>
                      {cls.name || cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeReport === 'student' && (
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-1 block">শাখা</label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger>
                    <SelectValue placeholder="শাখা নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল শাখা</SelectItem>
                    {sections.map(sec => (
                      <SelectItem key={sec.id || sec._id} value={sec.id || sec._id}>
                        {sec.name || sec.section_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeReport === 'attendance' && (
              <>
                <div className="flex-1 min-w-[150px]">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">তারিখ থেকে</label>
                  <input 
                    type="date" 
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">তারিখ পর্যন্ত</label>
                  <input 
                    type="date" 
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </>
            )}

            {activeReport === 'result' && (
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium text-gray-700 mb-1 block">শিক্ষাবর্ষ</label>
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">২০২৫</SelectItem>
                    <SelectItem value="2024">২০২৪</SelectItem>
                    <SelectItem value="2023">২০২৩</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div ref={printRef}>
        {activeReport === 'student' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                বিদ্যার্থী তালিকা
                <Badge className="ml-2 bg-blue-100 text-blue-700">মোট: {students.length} জন</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">লোড হচ্ছে...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">কোনো ছাত্র পাওয়া যায়নি</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-emerald-600 text-white">
                        <th className="border p-2 text-center">ক্রম</th>
                        <th className="border p-2 text-left">নাম</th>
                        <th className="border p-2 text-center">রোল</th>
                        <th className="border p-2 text-center">মারহালা</th>
                        <th className="border p-2 text-center">অভিভাবক</th>
                        <th className="border p-2 text-center">মোবাইল</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, idx) => (
                        <tr key={student.id || student._id} className="hover:bg-gray-50">
                          <td className="border p-2 text-center">{idx + 1}</td>
                          <td className="border p-2">{student.name}</td>
                          <td className="border p-2 text-center">{student.roll_no || '-'}</td>
                          <td className="border p-2 text-center">{student.class_name || getClassName(student.class_id)}</td>
                          <td className="border p-2 text-center">{student.father_name || student.guardian_name || '-'}</td>
                          <td className="border p-2 text-center">{student.phone || student.guardian_phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeReport === 'attendance' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                হাজিরা প্রতিবেদন
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">লোড হচ্ছে...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">
                        {attendanceData.filter(a => a.status === 'present').length}
                      </p>
                      <p className="text-sm text-gray-600">উপস্থিত</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-600">
                        {attendanceData.filter(a => a.status === 'absent').length}
                      </p>
                      <p className="text-sm text-gray-600">অনুপস্থিত</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-600">
                        {attendanceData.filter(a => a.status === 'late').length}
                      </p>
                      <p className="text-sm text-gray-600">দেরিতে</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">
                        {attendanceData.length > 0 
                          ? Math.round((attendanceData.filter(a => a.status === 'present').length / attendanceData.length) * 100) 
                          : 0}%
                      </p>
                      <p className="text-sm text-gray-600">উপস্থিতি হার</p>
                    </div>
                  </div>
                  
                  {attendanceData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      তারিখ নির্বাচন করে হাজিরা দেখুন
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-emerald-600 text-white">
                            <th className="border p-2">তারিখ</th>
                            <th className="border p-2">ছাত্রের নাম</th>
                            <th className="border p-2">অবস্থা</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceData.slice(0, 50).map((att, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="border p-2 text-center">{att.date}</td>
                              <td className="border p-2">{att.student_name || att.name}</td>
                              <td className="border p-2 text-center">
                                <Badge className={
                                  att.status === 'present' ? 'bg-green-100 text-green-700' :
                                  att.status === 'absent' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }>
                                  {att.status === 'present' ? 'উপস্থিত' : 
                                   att.status === 'absent' ? 'অনুপস্থিত' : 'দেরি'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {activeReport === 'result' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                ফলাফল প্রতিবেদন - {selectedSession}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">লোড হচ্ছে...</div>
              ) : resultData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">কোনো ফলাফল পাওয়া যায়নি</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    {['মুমতাজ', 'জায়্যিদ জিদ্দান', 'জায়্যিদ', 'মাকবুল', 'রাসেব'].map((grade, idx) => (
                      <div key={grade} className={`p-4 rounded-lg text-center ${
                        idx === 0 ? 'bg-green-50' : 
                        idx === 1 ? 'bg-blue-50' : 
                        idx === 2 ? 'bg-cyan-50' : 
                        idx === 3 ? 'bg-yellow-50' : 'bg-red-50'
                      }`}>
                        <p className="text-xl font-bold">{resultData.filter(r => r.grade === grade).length}</p>
                        <p className="text-sm">{grade}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-emerald-600 text-white">
                          <th className="border p-2">ক্রম</th>
                          <th className="border p-2">ছাত্রের নাম</th>
                          <th className="border p-2">রোল</th>
                          <th className="border p-2">মারহালা</th>
                          <th className="border p-2">ফলাফল</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultData.map((result, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border p-2 text-center">{idx + 1}</td>
                            <td className="border p-2">{result.student_name || result.name}</td>
                            <td className="border p-2 text-center">{result.roll_no || '-'}</td>
                            <td className="border p-2 text-center">{result.class_name || getClassName(result.class_id)}</td>
                            <td className="border p-2 text-center">
                              <Badge className={
                                result.grade === 'মুমতাজ' ? 'bg-green-500 text-white' :
                                result.grade === 'জায়্যিদ জিদ্দান' ? 'bg-blue-500 text-white' :
                                result.grade === 'জায়্যিদ' ? 'bg-cyan-500 text-white' :
                                result.grade === 'মাকবুল' ? 'bg-yellow-500 text-white' :
                                'bg-red-500 text-white'
                              }>
                                {result.grade || '-'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MadrasahReportPage;
