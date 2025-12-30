import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Download, Printer, Search, CreditCard, Users, Eye, RefreshCw } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || '/api';

const StudentIDCard = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState({});

  const fetchClasses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  }, []);

  const fetchSections = useCallback(async (classId) => {
    try {
      const token = localStorage.getItem('token');
      const url = classId && classId !== 'all' 
        ? `${API}/sections?class_id=${classId}`
        : `${API}/sections`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSections(response.data || []);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API}/id-cards/students/list`;
      const params = [];
      if (selectedClass && selectedClass !== 'all') {
        params.push(`class_id=${selectedClass}`);
      }
      if (selectedSection && selectedSection !== 'all') {
        params.push(`section_id=${selectedSection}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchSections(selectedClass);
  }, [selectedClass, fetchSections]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const generateIDCard = async (studentId, studentName) => {
    setGenerating(prev => ({ ...prev, [studentId]: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/id-cards/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `StudentID-${studentName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate ID card:', error);
      alert(t('idCard.generateError') || 'Failed to generate ID card');
    } finally {
      setGenerating(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const previewIDCard = async (studentId, printAfterLoad = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/id-cards/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const previewWindow = window.open(url, '_blank');
      
      if (printAfterLoad && previewWindow) {
        previewWindow.onload = () => {
          previewWindow.focus();
          previewWindow.print();
        };
      }
      
      return previewWindow;
    } catch (error) {
      console.error('Failed to preview ID card:', error);
      return null;
    }
  };

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.father_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roll_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admission_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-xl dark:text-white">
                {t('idCard.studentTitle') || 'Student ID Cards'}
              </CardTitle>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchStudents}
              disabled={loading}
              className="dark:border-gray-600 dark:text-gray-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh') || 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.class') || 'Class'}
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection('all');
                }}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">{t('common.allClasses') || 'All Classes'}</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.display_name || cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.section') || 'Section'}
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">{t('common.allSections') || 'All Sections'}</option>
                {sections
                  .filter(s => !selectedClass || selectedClass === 'all' || s.class_id === selectedClass)
                  .map(section => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.search') || 'Search'}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('idCard.searchPlaceholder') || 'Search by name, roll no...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span>
              {t('idCard.totalStudents') || 'Total Students'}: {filteredStudents.length}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('idCard.noStudents') || 'No students found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.photo') || 'Photo'}
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.name') || 'Name'}
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.fatherName') || "Father's Name"}
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.class') || 'Class'}
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.section') || 'Section'}
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.rollNo') || 'Roll No'}
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        {student.photo_url ? (
                          <img 
                            src={student.photo_url} 
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-white font-medium">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {student.father_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {student.class_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {student.section_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {student.roll_no || student.admission_no || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => previewIDCard(student.id)}
                            title={t('common.preview') || 'Preview'}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => generateIDCard(student.id, student.name)}
                            disabled={generating[student.id]}
                            title={t('common.download') || 'Download'}
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                          >
                            {generating[student.id] ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => previewIDCard(student.id, true)}
                            title={t('common.print') || 'Print'}
                            className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentIDCard;
