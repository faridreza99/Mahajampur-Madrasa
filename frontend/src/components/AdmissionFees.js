import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCurrency } from '../context/CurrencyContext';
import { useInstitution } from '../context/InstitutionContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { 
  DollarSign,
  Receipt,
  Users,
  Calendar,
  Search,
  Plus,
  Trash2,
  Printer,
  Download,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { toBengaliNumeral, toBanglaDate } from '../i18n';

const API = process.env.REACT_APP_API_URL || '/api';

const AdmissionFees = () => {
  const { t, i18n } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { isMadrasahSimpleUI } = useInstitution();
  const isBangla = i18n.language === 'bn';
  
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({
    total_collected: 0,
    today_collection: 0,
    total_admissions: 0,
    today_admissions: 0
  });
  
  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '',
    class_name: '',
    amount: '',
    payment_mode: 'Cash',
    remarks: ''
  });
  
  const [lastReceipt, setLastReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  const paymentModes = [
    { value: 'Cash', label: isBangla ? 'নগদ' : 'Cash' },
    { value: 'Bank', label: isBangla ? 'ব্যাংক' : 'Bank' },
    { value: 'Mobile Banking', label: isBangla ? 'মোবাইল ব্যাংকিং' : 'Mobile Banking' },
    { value: 'Cheque', label: isBangla ? 'চেক' : 'Cheque' }
  ];

  useEffect(() => {
    fetchFees();
    fetchClasses();
    fetchStudents();
  }, [searchTerm, selectedClass]);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedClass !== 'all') params.append('class_name', selectedClass);
      
      const response = await axios.get(`${API}/admission-fees?${params}`);
      setFees(response.data.fees || []);
      setSummary(response.data.summary || {});
    } catch (error) {
      console.error('Error fetching admission fees:', error);
      toast.error(isBangla ? 'ভর্তি ফি লোড করতে ব্যর্থ' : 'Failed to load admission fees');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API}/classes`);
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/students`);
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.student_name || !formData.class_name || !formData.amount) {
      toast.error(isBangla ? 'সকল প্রয়োজনীয় তথ্য পূরণ করুন' : 'Please fill all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post(`${API}/admission-fees`, {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      toast.success(isBangla ? 'ভর্তি ফি সফলভাবে সংরক্ষিত হয়েছে' : 'Admission fee saved successfully');
      setLastReceipt(response.data);
      setShowAddModal(false);
      setShowReceiptModal(true);
      setFormData({
        student_id: '',
        student_name: '',
        class_name: '',
        amount: '',
        payment_mode: 'Cash',
        remarks: ''
      });
      fetchFees();
    } catch (error) {
      console.error('Error creating admission fee:', error);
      toast.error(isBangla ? 'ভর্তি ফি সংরক্ষণ করতে ব্যর্থ' : 'Failed to save admission fee');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feeId) => {
    if (!window.confirm(isBangla ? 'আপনি কি নিশ্চিত এই ভর্তি ফি মুছে ফেলতে চান?' : 'Are you sure you want to delete this admission fee?')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/admission-fees/${feeId}`);
      toast.success(isBangla ? 'ভর্তি ফি মুছে ফেলা হয়েছে' : 'Admission fee deleted');
      fetchFees();
    } catch (error) {
      console.error('Error deleting admission fee:', error);
      toast.error(isBangla ? 'ভর্তি ফি মুছে ফেলতে ব্যর্থ' : 'Failed to delete admission fee');
    }
  };

  const handleStudentSelect = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      const className = classes.find(c => c.id === student.class_id)?.name || '';
      setFormData({
        ...formData,
        student_id: student.id,
        student_name: student.name,
        class_name: className
      });
    }
  };

  const formatAmount = (amount) => {
    if (isBangla) {
      return `৳${toBengaliNumeral(amount.toLocaleString())}`;
    }
    return formatCurrency(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    if (isBangla) {
      return toBanglaDate(dateString);
    }
    return new Date(dateString).toLocaleDateString();
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isBangla ? 'ভর্তি ফি আদায়' : 'Admission Fee Collection'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isBangla ? 'নতুন শিক্ষার্থী ভর্তি ফি আদায় ও রসিদ' : 'Collect admission fees for new students'}
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          {isBangla ? 'ভর্তি ফি আদায়' : 'Collect Admission Fee'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{isBangla ? 'মোট আদায়' : 'Total Collected'}</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(summary.total_collected || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{isBangla ? 'আজকের আদায়' : "Today's Collection"}</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(summary.today_collection || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{isBangla ? 'মোট ভর্তি' : 'Total Admissions'}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isBangla ? toBengaliNumeral(summary.total_admissions || 0) : summary.total_admissions || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{isBangla ? 'আজকের ভর্তি' : "Today's Admissions"}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isBangla ? toBengaliNumeral(summary.today_admissions || 0) : summary.today_admissions || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>{isBangla ? 'ভর্তি ফি তালিকা' : 'Admission Fee Records'}</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={isBangla ? 'অনুসন্ধান...' : 'Search...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={isBangla ? 'সকল জামাত' : 'All Classes'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isBangla ? 'সকল জামাত' : 'All Classes'}</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isBangla ? 'রসিদ নং' : 'Receipt No'}</TableHead>
                <TableHead>{isBangla ? 'শিক্ষার্থীর নাম' : 'Student Name'}</TableHead>
                <TableHead>{isBangla ? 'জামাত/মারহালা' : 'Class'}</TableHead>
                <TableHead>{isBangla ? 'টাকা' : 'Amount'}</TableHead>
                <TableHead>{isBangla ? 'পেমেন্ট মোড' : 'Payment Mode'}</TableHead>
                <TableHead>{isBangla ? 'তারিখ' : 'Date'}</TableHead>
                <TableHead>{isBangla ? 'কার্যক্রম' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {isBangla ? 'লোড হচ্ছে...' : 'Loading...'}
                  </TableCell>
                </TableRow>
              ) : fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {isBangla ? 'কোন ভর্তি ফি পাওয়া যায়নি' : 'No admission fees found'}
                  </TableCell>
                </TableRow>
              ) : (
                fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>
                      <Badge variant="outline">{fee.receipt_no}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{fee.student_name}</TableCell>
                    <TableCell>{fee.class_name}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      {formatAmount(fee.amount)}
                    </TableCell>
                    <TableCell>
                      {paymentModes.find(m => m.value === fee.payment_mode)?.label || fee.payment_mode}
                    </TableCell>
                    <TableCell>{formatDate(fee.payment_date)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLastReceipt(fee);
                            setShowReceiptModal(true);
                          }}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(fee.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isBangla ? 'ভর্তি ফি আদায়' : 'Collect Admission Fee'}</DialogTitle>
            <DialogDescription>
              {isBangla ? 'নতুন শিক্ষার্থীর ভর্তি ফি আদায় করুন' : 'Collect admission fee for new student'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{isBangla ? 'শিক্ষার্থী নির্বাচন করুন (ঐচ্ছিক)' : 'Select Student (Optional)'}</Label>
              <Select onValueChange={handleStudentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={isBangla ? 'শিক্ষার্থী নির্বাচন করুন' : 'Select a student'} />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>{isBangla ? 'শিক্ষার্থীর নাম *' : 'Student Name *'}</Label>
              <Input
                value={formData.student_name}
                onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                placeholder={isBangla ? 'শিক্ষার্থীর নাম লিখুন' : 'Enter student name'}
                required
              />
            </div>
            
            <div>
              <Label>{isBangla ? 'জামাত/মারহালা *' : 'Class/Jamaat *'}</Label>
              <Select 
                value={formData.class_name} 
                onValueChange={(value) => setFormData({...formData, class_name: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isBangla ? 'জামাত নির্বাচন করুন' : 'Select class'} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>{isBangla ? 'টাকার পরিমাণ *' : 'Amount *'}</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder={isBangla ? 'টাকার পরিমাণ লিখুন' : 'Enter amount'}
                required
              />
            </div>
            
            <div>
              <Label>{isBangla ? 'পেমেন্ট মোড' : 'Payment Mode'}</Label>
              <Select 
                value={formData.payment_mode} 
                onValueChange={(value) => setFormData({...formData, payment_mode: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentModes.map(mode => (
                    <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>{isBangla ? 'মন্তব্য' : 'Remarks'}</Label>
              <Input
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                placeholder={isBangla ? 'মন্তব্য (ঐচ্ছিক)' : 'Remarks (optional)'}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                {isBangla ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? (isBangla ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBangla ? 'সংরক্ষণ করুন' : 'Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="sm:max-w-lg print:shadow-none">
          <DialogHeader>
            <DialogTitle>{isBangla ? 'ভর্তি ফি রসিদ' : 'Admission Fee Receipt'}</DialogTitle>
          </DialogHeader>
          {lastReceipt && (
            <div className="space-y-4 p-4 border rounded-lg bg-white print:border-2">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold text-emerald-600">
                  {isBangla ? 'ভর্তি ফি রসিদ' : 'ADMISSION FEE RECEIPT'}
                </h2>
                <p className="text-gray-500">{isBangla ? 'রসিদ নং' : 'Receipt No'}: {lastReceipt.receipt_no}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{isBangla ? 'শিক্ষার্থীর নাম' : 'Student Name'}</p>
                  <p className="font-medium">{lastReceipt.student_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{isBangla ? 'জামাত/মারহালা' : 'Class'}</p>
                  <p className="font-medium">{lastReceipt.class_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{isBangla ? 'টাকার পরিমাণ' : 'Amount'}</p>
                  <p className="font-bold text-emerald-600 text-lg">{formatAmount(lastReceipt.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{isBangla ? 'পেমেন্ট মোড' : 'Payment Mode'}</p>
                  <p className="font-medium">
                    {paymentModes.find(m => m.value === lastReceipt.payment_mode)?.label || lastReceipt.payment_mode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{isBangla ? 'তারিখ' : 'Date'}</p>
                  <p className="font-medium">{formatDate(lastReceipt.payment_date)}</p>
                </div>
                {lastReceipt.remarks && (
                  <div>
                    <p className="text-sm text-gray-500">{isBangla ? 'মন্তব্য' : 'Remarks'}</p>
                    <p className="font-medium">{lastReceipt.remarks}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4 mt-4">
                <p className="text-center text-sm text-gray-500">
                  {isBangla ? 'এটি কম্পিউটার জেনারেটেড রসিদ' : 'This is a computer generated receipt'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => setShowReceiptModal(false)}>
              {isBangla ? 'বন্ধ করুন' : 'Close'}
            </Button>
            <Button onClick={printReceipt} className="bg-emerald-600 hover:bg-emerald-700">
              <Printer className="h-4 w-4 mr-2" />
              {isBangla ? 'প্রিন্ট করুন' : 'Print'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdmissionFees;
