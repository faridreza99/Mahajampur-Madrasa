import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Download, Printer, Search, CreditCard, Users, Eye, RefreshCw, UserCheck } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || '/api';

const StaffIDCard = () => {
  const { t } = useTranslation();
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState({});

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API}/id-cards/staff/list`;
      if (selectedDepartment && selectedDepartment !== 'all') {
        url += `?department=${encodeURIComponent(selectedDepartment)}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaff(response.data || []);
      
      const depts = [...new Set(response.data.map(s => s.department).filter(Boolean))];
      setDepartments(depts);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const generateIDCard = async (staffId, staffName) => {
    setGenerating(prev => ({ ...prev, [staffId]: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/id-cards/staff/${staffId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `StaffID-${staffName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate ID card:', error);
      alert(t('idCard.generateError') || 'Failed to generate ID card');
    } finally {
      setGenerating(prev => ({ ...prev, [staffId]: false }));
    }
  };

  const previewIDCard = async (staffId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/id-cards/staff/${staffId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to preview ID card:', error);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-xl dark:text-white">
                {t('idCard.staffTitle') || 'Staff ID Cards'}
              </CardTitle>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchStaff}
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
                {t('common.department') || 'Department'}
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">{t('common.allDepartments') || 'All Departments'}</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
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
                  placeholder={t('idCard.searchStaffPlaceholder') || 'Search by name, designation...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
            <UserCheck className="h-4 w-4" />
            <span>
              {t('idCard.totalStaff') || 'Total Staff'}: {filteredStaff.length}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('idCard.noStaff') || 'No staff found'}</p>
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
                      {t('common.designation') || 'Designation'}
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.department') || 'Department'}
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.employeeId') || 'Employee ID'}
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {filteredStaff.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        {member.photo_url ? (
                          <img 
                            src={member.photo_url} 
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-white font-medium">
                        {member.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {member.designation}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {member.department || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {member.employee_id || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => previewIDCard(member.id)}
                            title={t('common.preview') || 'Preview'}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => generateIDCard(member.id, member.name)}
                            disabled={generating[member.id]}
                            title={t('common.download') || 'Download'}
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                          >
                            {generating[member.id] ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              previewIDCard(member.id);
                              setTimeout(() => window.print(), 1000);
                            }}
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

export default StaffIDCard;
