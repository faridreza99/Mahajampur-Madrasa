import React, { useState, useEffect } from "react";
import axios from "axios";
import { useCurrency } from "../context/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  DollarSign,
  GraduationCap,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.REACT_APP_API_URL || "/api";

const FeeSetup = () => {
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  
  const [showModal, setShowModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [structureToDelete, setStructureToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    marhala_id: "",
    marhala_name: "",
    academic_year: new Date().getFullYear().toString(),
    monthly_fee: 0,
    admission_fee: 0,
    exam_fee: 0,
    session_fee: 0,
    monthly_late_fee: 0,
    monthly_due_day: 10,
    is_enabled: true,
  });

  useEffect(() => {
    fetchData();
  }, [academicYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [classesRes, structuresRes] = await Promise.all([
        axios.get(`${API}/classes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/fees/marhala-setup?academic_year=${academicYear}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setClasses(classesRes.data || []);
      setFeeStructures(structuresRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("ডাটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (structure = null) => {
    if (structure) {
      setEditingStructure(structure);
      setFormData({
        marhala_id: structure.marhala_id,
        marhala_name: structure.marhala_name,
        academic_year: structure.academic_year,
        monthly_fee: structure.monthly_fee || 0,
        admission_fee: structure.admission_fee || 0,
        exam_fee: structure.exam_fee || 0,
        session_fee: structure.session_fee || 0,
        monthly_late_fee: structure.monthly_late_fee || 0,
        monthly_due_day: structure.monthly_due_day || 10,
        is_enabled: structure.is_enabled !== false,
      });
    } else {
      setEditingStructure(null);
      setFormData({
        marhala_id: "",
        marhala_name: "",
        academic_year: academicYear,
        monthly_fee: 0,
        admission_fee: 0,
        exam_fee: 0,
        session_fee: 0,
        monthly_late_fee: 0,
        monthly_due_day: 10,
        is_enabled: true,
      });
    }
    setShowModal(true);
  };

  const handleClassSelect = (classId) => {
    const selectedClass = classes.find((c) => c.id === classId);
    if (selectedClass) {
      setFormData({
        ...formData,
        marhala_id: classId,
        marhala_name: selectedClass.name || selectedClass.name_bn || "",
      });
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      if (!formData.marhala_id) {
        toast.error("মারহালা/শ্রেণী নির্বাচন করুন");
        return;
      }

      setLoading(true);

      if (editingStructure) {
        await axios.put(
          `${API}/fees/marhala-setup/${editingStructure.id}`,
          {
            monthly_fee: parseFloat(formData.monthly_fee) || 0,
            admission_fee: parseFloat(formData.admission_fee) || 0,
            exam_fee: parseFloat(formData.exam_fee) || 0,
            session_fee: parseFloat(formData.session_fee) || 0,
            monthly_late_fee: parseFloat(formData.monthly_late_fee) || 0,
            monthly_due_day: parseInt(formData.monthly_due_day) || 10,
            is_enabled: formData.is_enabled,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("ফি কনফিগারেশন আপডেট হয়েছে");
      } else {
        // Convert numeric values to proper types before POST
        const createData = {
          marhala_id: formData.marhala_id,
          marhala_name: formData.marhala_name,
          academic_year: formData.academic_year,
          monthly_fee: parseFloat(formData.monthly_fee) || 0,
          admission_fee: parseFloat(formData.admission_fee) || 0,
          exam_fee: parseFloat(formData.exam_fee) || 0,
          session_fee: parseFloat(formData.session_fee) || 0,
          monthly_late_fee: parseFloat(formData.monthly_late_fee) || 0,
          monthly_due_day: parseInt(formData.monthly_due_day) || 10,
          is_enabled: formData.is_enabled,
        };
        await axios.post(
          `${API}/fees/marhala-setup`,
          createData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("ফি কনফিগারেশন তৈরি হয়েছে");
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error("Error saving fee structure:", error);
      toast.error(error.response?.data?.detail || "সংরক্ষণ করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !structureToDelete) return;

      setLoading(true);
      await axios.delete(
        `${API}/fees/marhala-setup/${structureToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("ফি কনফিগারেশন মুছে ফেলা হয়েছে");
      setShowDeleteConfirm(false);
      setStructureToDelete(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting fee structure:", error);
      toast.error("মুছে ফেলতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const getClassesWithoutFeeStructure = () => {
    const structuredClassIds = feeStructures.map((s) => s.marhala_id);
    return classes.filter((c) => !structuredClassIds.includes(c.id));
  };

  const yearOptions = [
    (new Date().getFullYear() - 1).toString(),
    new Date().getFullYear().toString(),
    (new Date().getFullYear() + 1).toString(),
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-emerald-600" />
            ফি সেটআপ (Fee Setup)
          </h1>
          <p className="text-gray-600 mt-1">
            মারহালা/শ্রেণী অনুযায়ী ফি কনফিগার করুন
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="শিক্ষাবর্ষ" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={() => handleOpenModal()} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            নতুন ফি যোগ করুন
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">মোট মারহালা</p>
                <p className="text-2xl font-bold text-blue-800">{classes.length}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">কনফিগার করা</p>
                <p className="text-2xl font-bold text-emerald-800">{feeStructures.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">বাকি আছে</p>
                <p className="text-2xl font-bold text-amber-800">
                  {getClassesWithoutFeeStructure().length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">শিক্ষাবর্ষ</p>
                <p className="text-2xl font-bold text-purple-800">{academicYear}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            মারহালা অনুযায়ী ফি তালিকা
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">লোড হচ্ছে...</p>
            </div>
          ) : feeStructures.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">কোন ফি কনফিগারেশন পাওয়া যায়নি</p>
              <p className="text-sm text-gray-400 mt-1">
                উপরে "নতুন ফি যোগ করুন" বাটনে ক্লিক করে ফি সেট করুন
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">মারহালা/শ্রেণী</TableHead>
                    <TableHead className="font-semibold text-right">মাসিক বেতন</TableHead>
                    <TableHead className="font-semibold text-right">ভর্তি ফি</TableHead>
                    <TableHead className="font-semibold text-right">পরীক্ষা ফি</TableHead>
                    <TableHead className="font-semibold text-right">সেশন ফি</TableHead>
                    <TableHead className="font-semibold text-right">বিলম্ব ফি</TableHead>
                    <TableHead className="font-semibold text-center">অবস্থা</TableHead>
                    <TableHead className="font-semibold text-center">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStructures.map((structure) => (
                    <TableRow key={structure.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {structure.marhala_name}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(structure.monthly_fee)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(structure.admission_fee)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(structure.exam_fee)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(structure.session_fee)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(structure.monthly_late_fee)}
                      </TableCell>
                      <TableCell className="text-center">
                        {structure.is_enabled ? (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            সক্রিয়
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            নিষ্ক্রিয়
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModal(structure)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setStructureToDelete(structure);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {getClassesWithoutFeeStructure().length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              ফি কনফিগার করা হয়নি
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-600 text-sm mb-3">
              নিম্নলিখিত মারহালা/শ্রেণীগুলোর জন্য এখনও ফি সেটআপ করা হয়নি:
            </p>
            <div className="flex flex-wrap gap-2">
              {getClassesWithoutFeeStructure().map((cls) => (
                <Badge
                  key={cls.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-amber-100 border-amber-300"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      marhala_id: cls.id,
                      marhala_name: cls.name || cls.name_bn || "",
                      academic_year: academicYear,
                    });
                    setEditingStructure(null);
                    setShowModal(true);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {cls.name || cls.name_bn}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" />
              {editingStructure ? "ফি সম্পাদনা করুন" : "নতুন ফি কনফিগারেশন"}
            </DialogTitle>
            <DialogDescription>
              মারহালা/শ্রেণীর জন্য ফি নির্ধারণ করুন
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">মারহালা/শ্রেণী *</label>
              {editingStructure ? (
                <Input value={formData.marhala_name} disabled />
              ) : (
                <Select
                  value={formData.marhala_id}
                  onValueChange={handleClassSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="মারহালা নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {getClassesWithoutFeeStructure().map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name || cls.name_bn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  মাসিক বেতন
                </label>
                <Input
                  type="number"
                  value={formData.monthly_fee}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_fee: e.target.value })
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  ভর্তি ফি
                </label>
                <Input
                  type="number"
                  value={formData.admission_fee}
                  onChange={(e) =>
                    setFormData({ ...formData, admission_fee: e.target.value })
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  পরীক্ষা ফি
                </label>
                <Input
                  type="number"
                  value={formData.exam_fee}
                  onChange={(e) =>
                    setFormData({ ...formData, exam_fee: e.target.value })
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  সেশন ফি
                </label>
                <Input
                  type="number"
                  value={formData.session_fee}
                  onChange={(e) =>
                    setFormData({ ...formData, session_fee: e.target.value })
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  বিলম্ব ফি (মাসিক)
                </label>
                <Input
                  type="number"
                  value={formData.monthly_late_fee}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_late_fee: e.target.value })
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  পেমেন্ট ডেডলাইন (তারিখ)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={formData.monthly_due_day}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_due_day: e.target.value })
                  }
                  placeholder="10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_enabled"
                checked={formData.is_enabled}
                onChange={(e) =>
                  setFormData({ ...formData, is_enabled: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <label htmlFor="is_enabled" className="text-sm">
                এই ফি কনফিগারেশন সক্রিয় রাখুন
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              <X className="w-4 h-4 mr-2" />
              বাতিল
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              ফি কনফিগারেশন মুছে ফেলুন
            </DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিত যে আপনি "{structureToDelete?.marhala_name}" এর ফি
              কনফিগারেশন মুছে ফেলতে চান?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              বাতিল
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeeSetup;
