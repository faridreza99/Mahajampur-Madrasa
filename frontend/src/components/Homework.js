import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
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
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  FileText,
  Plus,
  Calendar,
  Download,
  Trash2,
  Edit,
  BookOpen,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_API_URL || '/api';

const Homework = () => {
  const [loading, setLoading] = useState(true);
  const [homework, setHomework] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    section_id: '',
    subject: '',
    due_date: '',
    instructions: ''
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchHomework = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/homework`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHomework(response.data.homework || []);
    } catch (error) {
      console.error('Failed to fetch homework:', error);
      toast.error('Failed to load homework');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userRole = JSON.parse(atob(token.split('.')[1])).role;
      
      let response;
      if (userRole === 'teacher') {
        response = await axios.get(`${API}/teacher/assigned-classes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClasses(response.data.classes || []);
        
        const allSubjects = new Set();
        (response.data.classes || []).forEach(cls => {
          (cls.subjects || []).forEach(s => allSubjects.add(s));
        });
        setSubjects([...allSubjects]);
      } else {
        response = await axios.get(`${API}/classes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClasses(response.data || []);
        
        const subjectsRes = await axios.get(`${API}/subjects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubjects((subjectsRes.data || []).map(s => s.name || s));
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  }, []);

  useEffect(() => {
    fetchHomework();
    fetchClasses();
  }, [fetchHomework, fetchClasses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.class_id || !formData.subject || !formData.due_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const formPayload = new FormData();
      formPayload.append('title', formData.title);
      formPayload.append('description', formData.description || '');
      formPayload.append('class_id', formData.class_id);
      formPayload.append('section_id', formData.section_id || '');
      formPayload.append('subject', formData.subject);
      formPayload.append('due_date', formData.due_date);
      formPayload.append('instructions', formData.instructions || '');
      
      if (file) {
        formPayload.append('file', file);
      }

      await axios.post(`${API}/homework`, formPayload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Homework created successfully');
      setShowDialog(false);
      setFormData({
        title: '',
        description: '',
        class_id: '',
        section_id: '',
        subject: '',
        due_date: '',
        instructions: ''
      });
      setFile(null);
      fetchHomework();
    } catch (error) {
      console.error('Failed to create homework:', error);
      toast.error('Failed to create homework');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (homeworkId) => {
    if (!window.confirm('Are you sure you want to delete this homework?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/homework/${homeworkId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Homework deleted');
      fetchHomework();
    } catch (error) {
      console.error('Failed to delete homework:', error);
      toast.error('Failed to delete homework');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Homework & Assignments</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Create and manage homework for your classes</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Add Homework
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Create New Homework</DialogTitle>
              <DialogDescription>
                Add a new homework assignment for your students
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter homework title"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="class">Class *</Label>
                  <Select
                    value={formData.class_id}
                    onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.class_id || cls.id} value={cls.class_id || cls.id}>
                          {cls.class_name || cls.name} {cls.section_name && `- ${cls.section_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject, index) => (
                        <SelectItem key={index} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[80px] p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter homework description"
                />
              </div>

              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <textarea
                  id="instructions"
                  className="w-full min-h-[60px] p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 text-sm"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Enter additional instructions"
                />
              </div>

              <div>
                <Label htmlFor="file">Attachment (Optional)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="text-xs sm:text-sm"
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Max 10MB. Supported: PDF, DOC, DOCX, PNG, JPG</p>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? 'Creating...' : 'Create Homework'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.class_id || cls.id} value={cls.class_id || cls.id}>
                {cls.class_name || cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Homework List
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">All homework assignments you've created</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {homework.length > 0 ? (
            <div className="overflow-x-auto min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Class</TableHead>
                    <TableHead className="hidden md:table-cell">Subject</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {homework
                    .filter(hw => !selectedClass || selectedClass === 'all' || hw.class_id === selectedClass)
                    .map((hw) => (
                    <TableRow key={hw.id}>
                      <TableCell className="min-w-0">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{hw.title}</p>
                            {hw.description && (
                              <p className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[200px]">{hw.description}</p>
                            )}
                            <div className="sm:hidden mt-1 text-[10px] text-gray-500">
                              {hw.class_name} | {hw.subject}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {hw.class_name} {hw.section_name && `- ${hw.section_name}`}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{hw.subject}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(hw.status)} className="text-[10px] sm:text-xs">
                          {hw.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          {hw.file_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = hw.file_url;
                                link.download = hw.file_name || 'attachment';
                                link.click();
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(hw.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-base sm:text-lg font-medium">No homework yet</p>
              <p className="text-xs sm:text-sm">Click "Add Homework" to start</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Homework;
