import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { toast } from 'sonner';
import {
  Wallet,
  Users,
  FileText,
  Download,
  Check,
  Lock,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Loader2,
  Settings,
  CreditCard,
  Gift,
  PiggyBank,
  BarChart3,
  Eye,
  Plus,
  RefreshCw,
  Building2,
  Printer,
} from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : null;
};

const currencySymbols = {
  'BDT': '৳', 'USD': '$', 'EUR': '€', 'GBP': '£',
  'INR': '₹', 'JPY': '¥', 'CNY': '¥', 'AUD': 'A$', 'CAD': 'C$'
};

const Payroll = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('BDT');
  
  const [dashboard, setDashboard] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState(null);
  
  const [processYear, setProcessYear] = useState(new Date().getFullYear());
  const [processMonth, setProcessMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [showBonusForm, setShowBonusForm] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const formatCurrency = useCallback((amount) => {
    const symbol = currencySymbols[currency] || currency + ' ';
    return `${symbol}${Number(amount || 0).toLocaleString()}`;
  }, [currency]);

  const months = [
    { value: 1, label: 'January / জানুয়ারি' },
    { value: 2, label: 'February / ফেব্রুয়ারি' },
    { value: 3, label: 'March / মার্চ' },
    { value: 4, label: 'April / এপ্রিল' },
    { value: 5, label: 'May / মে' },
    { value: 6, label: 'June / জুন' },
    { value: 7, label: 'July / জুলাই' },
    { value: 8, label: 'August / আগস্ট' },
    { value: 9, label: 'September / সেপ্টেম্বর' },
    { value: 10, label: 'October / অক্টোবর' },
    { value: 11, label: 'November / নভেম্বর' },
    { value: 12, label: 'December / ডিসেম্বর' }
  ];

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/payroll/dashboard`, {
        headers: { Authorization: getAuthToken() }
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }, []);

  const fetchPayrolls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/payroll/list`, {
        params: { year: filterYear },
        headers: { Authorization: getAuthToken() }
      });
      setPayrolls(response.data);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      toast.error('Failed to fetch payrolls');
    } finally {
      setLoading(false);
    }
  }, [filterYear]);

  const fetchPayrollDetails = useCallback(async (payrollId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/payroll/${payrollId}`, {
        headers: { Authorization: getAuthToken() }
      });
      setSelectedPayroll(response.data);
    } catch (error) {
      toast.error('Failed to fetch payroll details');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSalaryStructures = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/payroll/salary-structures`, {
        headers: { Authorization: getAuthToken() }
      });
      setSalaryStructures(response.data);
    } catch (error) {
      console.error('Error fetching salary structures:', error);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/staff`, {
        headers: { Authorization: getAuthToken() }
      });
      setEmployees(response.data.filter(e => e.status === 'Active'));
      const depts = [...new Set(response.data.map(e => e.department).filter(Boolean))];
      setDepartments(depts);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, []);

  const fetchBonuses = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/payroll/bonuses`, {
        params: { year: filterYear },
        headers: { Authorization: getAuthToken() }
      });
      setBonuses(response.data);
    } catch (error) {
      console.error('Error fetching bonuses:', error);
    }
  }, [filterYear]);

  const fetchAdvances = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/payroll/advances`, {
        headers: { Authorization: getAuthToken() }
      });
      setAdvances(response.data);
    } catch (error) {
      console.error('Error fetching advances:', error);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/payroll/payments`, {
        params: { year: filterYear },
        headers: { Authorization: getAuthToken() }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  }, [filterYear]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/payroll/settings`, {
        headers: { Authorization: getAuthToken() }
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, []);

  const fetchInstitution = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/institution`, {
        headers: { Authorization: getAuthToken() }
      });
      setCurrency(response.data.currency || 'BDT');
    } catch (error) {
      console.error('Error fetching institution:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchPayrolls();
    fetchEmployees();
    fetchInstitution();
  }, [fetchDashboard, fetchPayrolls, fetchEmployees, fetchInstitution]);

  useEffect(() => {
    if (activeTab === 'salary-structures') fetchSalaryStructures();
    if (activeTab === 'bonuses') fetchBonuses();
    if (activeTab === 'advances') fetchAdvances();
    if (activeTab === 'payments') fetchPayments();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab, fetchSalaryStructures, fetchBonuses, fetchAdvances, fetchPayments, fetchSettings]);

  const handleProcessPayroll = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/payroll/process`, {
        year: processYear,
        month: processMonth
      }, {
        headers: { Authorization: getAuthToken() }
      });
      toast.success(response.data.message);
      fetchPayrolls();
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayroll = async (payrollId, action) => {
    try {
      setLoading(true);
      await axios.post(`${API}/payroll/${payrollId}/approve`, { action }, {
        headers: { Authorization: getAuthToken() }
      });
      toast.success(`Payroll ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      fetchPayrolls();
      if (selectedPayroll?.id === payrollId) {
        fetchPayrollDetails(payrollId);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleLockPayroll = async (payrollId) => {
    try {
      setLoading(true);
      await axios.post(`${API}/payroll/${payrollId}/lock`, {}, {
        headers: { Authorization: getAuthToken() }
      });
      toast.success('Payroll locked successfully');
      fetchPayrolls();
      if (selectedPayroll?.id === payrollId) {
        fetchPayrollDetails(payrollId);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to lock payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPayslip = async (payrollId, itemId, employeeName, monthName, year) => {
    try {
      const response = await axios.get(`${API}/payroll/${payrollId}/items/${itemId}/payslip/pdf`, {
        headers: { Authorization: getAuthToken() },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${employeeName}_${monthName}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Payslip downloaded');
    } catch (error) {
      toast.error('Failed to download payslip');
    }
  };

  const handleDownloadReport = async (format) => {
    try {
      const response = await axios.get(`${API}/payroll/reports/monthly`, {
        params: { year: selectedPayroll.year, month: selectedPayroll.month, format },
        headers: { Authorization: getAuthToken() },
        responseType: format === 'excel' ? 'blob' : 'json'
      });
      
      if (format === 'excel') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Payroll_Report_${selectedPayroll.month_name}_${selectedPayroll.year}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Report downloaded');
      }
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const handleRecordPayment = async (payrollId, itemId, paymentData) => {
    try {
      await axios.post(`${API}/payroll/${payrollId}/items/${itemId}/payment`, paymentData, {
        headers: { Authorization: getAuthToken() }
      });
      toast.success('Payment recorded');
      fetchPayrollDetails(payrollId);
      setShowPaymentForm(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      locked: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      unpaid: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      not_processed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    
    const statusLabels = {
      draft: 'Draft / খসড়া',
      approved: 'Approved / অনুমোদিত',
      locked: 'Locked / লক',
      rejected: 'Rejected / প্রত্যাখ্যাত',
      paid: 'Paid / পরিশোধিত',
      unpaid: 'Unpaid / অপরিশোধিত',
      not_processed: 'Not Processed / প্রক্রিয়াকৃত নয়'
    };

    return (
      <Badge className={statusStyles[status] || statusStyles.draft}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="h-8 w-8 text-emerald-600" />
            Payroll Management / বেতন ব্যবস্থাপনা
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage employee salaries, bonuses, and payments
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-7 gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="payrolls" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Payrolls
          </TabsTrigger>
          <TabsTrigger value="salary-structures" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Salary
          </TabsTrigger>
          <TabsTrigger value="bonuses" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Bonuses
          </TabsTrigger>
          <TabsTrigger value="advances" className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Advances
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">Current Month / চলতি মাস</p>
                    <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                      {formatCurrency(dashboard?.current_month?.total_net || 0)}
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {dashboard?.current_month?.month_name} {dashboard?.current_month?.year}
                    </p>
                  </div>
                  <Wallet className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="mt-2">
                  {getStatusBadge(dashboard?.current_month?.status || 'not_processed')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Active Employees / সক্রিয় কর্মচারী</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                      {dashboard?.active_employees || 0}
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Year to Date / বছর পর্যন্ত</p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                      {formatCurrency(dashboard?.year_to_date_total || 0)}
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      {dashboard?.processed_months || 0} months processed
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400">Pending Advances / বকেয়া অগ্রিম</p>
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                      {dashboard?.pending_advances || 0}
                    </p>
                  </div>
                  <AlertCircle className="h-10 w-10 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Process Payroll / বেতন প্রক্রিয়া
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <Label>Year / বছর</Label>
                  <Select value={String(processYear)} onValueChange={(v) => setProcessYear(Number(v))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2023, 2024, 2025, 2026].map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Month / মাস</Label>
                  <Select value={String(processMonth)} onValueChange={(v) => setProcessMonth(Number(v))}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleProcessPayroll}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Process Payroll / বেতন প্রক্রিয়া করুন
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payrolls">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Payroll List / বেতনের তালিকা</CardTitle>
                <div className="flex gap-2 items-center">
                  <Label>Year:</Label>
                  <Select value={String(filterYear)} onValueChange={(v) => setFilterYear(Number(v))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2023, 2024, 2025, 2026].map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedPayroll ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedPayroll.month_name} {selectedPayroll.year}
                      </h3>
                      {getStatusBadge(selectedPayroll.status)}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setSelectedPayroll(null)}>
                        Back / ফিরে যান
                      </Button>
                      {selectedPayroll.status === 'draft' && (
                        <>
                          <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprovePayroll(selectedPayroll.id, 'approve')}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve / অনুমোদন
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleApprovePayroll(selectedPayroll.id, 'reject')}
                          >
                            Reject / প্রত্যাখ্যান
                          </Button>
                        </>
                      )}
                      {selectedPayroll.status === 'approved' && (
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleLockPayroll(selectedPayroll.id)}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Lock / লক করুন
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        onClick={() => handleDownloadReport('excel')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Card className="bg-gray-50 dark:bg-gray-700">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Gross</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(selectedPayroll.total_gross_salary)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-50 dark:bg-gray-700">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Deductions</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(selectedPayroll.total_deductions)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-50 dark:bg-gray-700">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Net</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(selectedPayroll.total_net_salary)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee / কর্মচারী</TableHead>
                        <TableHead>Department / বিভাগ</TableHead>
                        <TableHead className="text-right">Gross / মোট</TableHead>
                        <TableHead className="text-right">Deductions / কর্তন</TableHead>
                        <TableHead className="text-right">Net / নিট</TableHead>
                        <TableHead>Payment / পরিশোধ</TableHead>
                        <TableHead>Actions / কার্যক্রম</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPayroll.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.employee_name}</p>
                              <p className="text-sm text-gray-500">{item.employee_employee_id}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{item.department}</p>
                              <p className="text-sm text-gray-500">{item.designation}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.gross_salary)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(item.total_deductions)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">
                            {formatCurrency(item.net_salary)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(item.payment?.status || 'unpaid')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDownloadPayslip(
                                  selectedPayroll.id, 
                                  item.id, 
                                  item.employee_name,
                                  selectedPayroll.month_name,
                                  selectedPayroll.year
                                )}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              {selectedPayroll.status === 'approved' && item.payment?.status !== 'paid' && (
                                <Button 
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setShowPaymentForm(true);
                                  }}
                                >
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month / মাস</TableHead>
                      <TableHead>Status / অবস্থা</TableHead>
                      <TableHead className="text-right">Employees / কর্মচারী</TableHead>
                      <TableHead className="text-right">Gross / মোট</TableHead>
                      <TableHead className="text-right">Net / নিট</TableHead>
                      <TableHead>Actions / কার্যক্রম</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                        </TableCell>
                      </TableRow>
                    ) : payrolls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No payrolls found for {filterYear}
                        </TableCell>
                      </TableRow>
                    ) : (
                      payrolls.map((payroll) => (
                        <TableRow key={payroll.id}>
                          <TableCell className="font-medium">
                            {payroll.month_name} {payroll.year}
                          </TableCell>
                          <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                          <TableCell className="text-right">{payroll.total_employees}</TableCell>
                          <TableCell className="text-right">{formatCurrency(payroll.total_gross_salary)}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">
                            {formatCurrency(payroll.total_net_salary)}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => fetchPayrollDetails(payroll.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary-structures">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Salary Structures / বেতন কাঠামো</CardTitle>
                <Button onClick={() => setShowSalaryForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Structure
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee / কর্মচারী</TableHead>
                    <TableHead>Department / বিভাগ</TableHead>
                    <TableHead className="text-right">Basic / মূল</TableHead>
                    <TableHead className="text-right">HRA</TableHead>
                    <TableHead className="text-right">Food / খাবার</TableHead>
                    <TableHead className="text-right">Transport / পরিবহন</TableHead>
                    <TableHead className="text-right">Total / মোট</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryStructures.map((struct) => (
                    <TableRow key={struct.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{struct.employee_name}</p>
                          <p className="text-sm text-gray-500">{struct.employee_designation}</p>
                        </div>
                      </TableCell>
                      <TableCell>{struct.employee_department}</TableCell>
                      <TableCell className="text-right">{formatCurrency(struct.basic_salary)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(struct.house_rent_allowance)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(struct.food_allowance)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(struct.transport_allowance)}</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(
                          (struct.basic_salary || 0) +
                          (struct.house_rent_allowance || 0) +
                          (struct.food_allowance || 0) +
                          (struct.transport_allowance || 0) +
                          (struct.medical_allowance || 0) +
                          (struct.other_allowance || 0)
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={struct.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {struct.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonuses">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Bonuses / বোনাস</CardTitle>
                <Button onClick={() => setShowBonusForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bonus
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bonus Name / বোনাসের নাম</TableHead>
                    <TableHead>Type / ধরন</TableHead>
                    <TableHead>Applicable To / প্রযোজ্য</TableHead>
                    <TableHead className="text-right">Amount / পরিমাণ</TableHead>
                    <TableHead>Month / মাস</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonuses.map((bonus) => (
                    <TableRow key={bonus.id}>
                      <TableCell className="font-medium">{bonus.bonus_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {bonus.bonus_type === 'percentage' ? 'Percentage' : 'Fixed'}
                        </Badge>
                      </TableCell>
                      <TableCell>{bonus.applicable_to}</TableCell>
                      <TableCell className="text-right">
                        {bonus.bonus_type === 'percentage' 
                          ? `${bonus.percentage}%` 
                          : formatCurrency(bonus.amount)}
                      </TableCell>
                      <TableCell>
                        {months.find(m => m.value === bonus.effective_month)?.label.split(' / ')[0]} {bonus.effective_year}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advances">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Advances & Loans / অগ্রিম ও ঋণ</CardTitle>
                <Button onClick={() => setShowAdvanceForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Advance
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee / কর্মচারী</TableHead>
                    <TableHead>Reason / কারণ</TableHead>
                    <TableHead className="text-right">Amount / পরিমাণ</TableHead>
                    <TableHead className="text-right">Monthly Deduction / মাসিক কর্তন</TableHead>
                    <TableHead className="text-right">Remaining / বাকি</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advances.map((advance) => (
                    <TableRow key={advance.id}>
                      <TableCell className="font-medium">{advance.employee_name}</TableCell>
                      <TableCell>{advance.reason}</TableCell>
                      <TableCell className="text-right">{formatCurrency(advance.amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(advance.monthly_deduction)}</TableCell>
                      <TableCell className="text-right font-bold text-orange-600">
                        {formatCurrency(advance.remaining_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={advance.is_active ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                          {advance.is_active ? 'Active' : 'Settled'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Payment Records / পেমেন্ট রেকর্ড</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee / কর্মচারী</TableHead>
                    <TableHead>Month / মাস</TableHead>
                    <TableHead className="text-right">Net Salary / নিট বেতন</TableHead>
                    <TableHead>Method / পদ্ধতি</TableHead>
                    <TableHead>Reference / রেফারেন্স</TableHead>
                    <TableHead>Date / তারিখ</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{payment.employee_name}</TableCell>
                      <TableCell>
                        {months.find(m => m.value === payment.month)?.label.split(' / ')[0]} {payment.year}
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(payment.net_salary)}</TableCell>
                      <TableCell>{payment.payment_method || '-'}</TableCell>
                      <TableCell>{payment.payment_reference || '-'}</TableCell>
                      <TableCell>{payment.payment_date || '-'}</TableCell>
                      <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Payroll Settings / বেতন সেটিংস</CardTitle>
            </CardHeader>
            <CardContent>
              {settings ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Attendance Rules / উপস্থিতি নিয়ম</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span>Working Days/Month</span>
                        <span className="font-bold">{settings.working_days_per_month}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span>Late Deduction Enabled</span>
                        <Badge className={settings.late_deduction_enabled ? 'bg-green-100' : 'bg-gray-100'}>
                          {settings.late_deduction_enabled ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span>Late Days Threshold</span>
                        <span className="font-bold">{settings.late_days_threshold} days</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span>Late Deduction Amount</span>
                        <span className="font-bold">{formatCurrency(settings.late_deduction_amount)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Deduction Rules / কর্তন নিয়ম</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span>Absent Deduction/Day</span>
                        <span className="font-bold">
                          {settings.absent_deduction_per_day > 0 
                            ? formatCurrency(settings.absent_deduction_per_day)
                            : 'Daily Rate'}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span>Half-day Deduction Rate</span>
                        <span className="font-bold">{(settings.half_day_deduction_rate * 100)}%</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span>Overtime Enabled</span>
                        <Badge className={settings.overtime_enabled ? 'bg-green-100' : 'bg-gray-100'}>
                          {settings.overtime_enabled ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span>Overtime Rate/Hour</span>
                        <span className="font-bold">{formatCurrency(settings.overtime_rate_per_hour)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No payroll settings configured yet</p>
                  <Button className="mt-4" onClick={() => setShowSettingsForm(true)}>
                    Configure Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showPaymentForm && selectedItem && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Record Payment / পেমেন্ট রেকর্ড</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentForm
                item={selectedItem}
                onSubmit={(data) => handleRecordPayment(selectedPayroll.id, selectedItem.id, data)}
                onCancel={() => {
                  setShowPaymentForm(false);
                  setSelectedItem(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const PaymentForm = ({ item, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    payment_method: 'Bank',
    payment_reference: '',
    payment_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="font-medium">{item.employee_name}</p>
        <p className="text-lg font-bold text-emerald-600">Net: ৳{item.net_salary?.toLocaleString()}</p>
      </div>
      
      <div className="space-y-2">
        <Label>Payment Method / পদ্ধতি</Label>
        <Select 
          value={formData.payment_method} 
          onValueChange={(v) => setFormData({...formData, payment_method: v})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Bank">Bank Transfer</SelectItem>
            <SelectItem value="bKash">bKash</SelectItem>
            <SelectItem value="Nagad">Nagad</SelectItem>
            <SelectItem value="Rocket">Rocket</SelectItem>
            <SelectItem value="Cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Reference Number / রেফারেন্স</Label>
        <Input
          value={formData.payment_reference}
          onChange={(e) => setFormData({...formData, payment_reference: e.target.value})}
          placeholder="Transaction ID or reference"
        />
      </div>

      <div className="space-y-2">
        <Label>Payment Date / তারিখ</Label>
        <Input
          type="date"
          value={formData.payment_date}
          onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
        />
      </div>

      <div className="space-y-2">
        <Label>Remarks / মন্তব্য</Label>
        <Input
          value={formData.remarks}
          onChange={(e) => setFormData({...formData, remarks: e.target.value})}
          placeholder="Optional remarks"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          Record Payment
        </Button>
      </div>
    </form>
  );
};

export default Payroll;
