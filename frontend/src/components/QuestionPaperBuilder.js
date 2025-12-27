import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  FileText, Plus, Trash2, Search, Printer, Save, Eye, 
  ChevronDown, ChevronUp, GripVertical, X, BookOpen
} from 'lucide-react';
import { Button } from './ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

const QuestionPaperBuilder = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(null);
  
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sectionTemplates, setSectionTemplates] = useState([]);
  const [questionBank, setQuestionBank] = useState([]);
  const [printData, setPrintData] = useState(null);
  
  const [paperForm, setPaperForm] = useState({
    title_bn: 'বার্ষিক পরীক্ষা',
    title_en: 'Annual Examination',
    class_name: '',
    subject: '',
    exam_year: new Date().getFullYear().toString(),
    duration_minutes: 120,
    total_marks: 100,
    sections: []
  });

  const [questionFilters, setQuestionFilters] = useState({
    search: '',
    question_type: '',
    difficulty: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

  const fetchPapers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/question-papers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPapers(response.data.papers || []);
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const fetchClasses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  }, [API_BASE_URL]);

  const fetchSubjects = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const subjectList = response.data || [];
      const normalized = subjectList.map(sub => ({
        ...sub,
        name: sub.name || sub.subject_name
      }));
      setSubjects(normalized);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }, [API_BASE_URL]);

  const fetchTemplates = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/question-paper/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSectionTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, [API_BASE_URL]);

  const fetchQuestions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (paperForm.subject) params.append('subject', paperForm.subject);
      if (paperForm.class_name) params.append('class_name', paperForm.class_name);
      if (questionFilters.question_type) params.append('question_type', questionFilters.question_type);
      if (questionFilters.difficulty) params.append('difficulty', questionFilters.difficulty);
      if (questionFilters.search) params.append('search', questionFilters.search);
      params.append('limit', '100');
      
      const response = await axios.get(`${API_BASE_URL}/question-bank?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestionBank(response.data.questions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  }, [API_BASE_URL, paperForm.subject, paperForm.class_name, questionFilters]);

  useEffect(() => {
    fetchPapers();
    fetchClasses();
    fetchSubjects();
    fetchTemplates();
  }, [fetchPapers, fetchClasses, fetchSubjects, fetchTemplates]);

  useEffect(() => {
    if (isQuestionPickerOpen) {
      fetchQuestions();
    }
  }, [isQuestionPickerOpen, fetchQuestions]);

  const handleCreatePaper = () => {
    setEditingPaper(null);
    setPaperForm({
      title_bn: 'বার্ষিক পরীক্ষা',
      title_en: 'Annual Examination',
      class_name: '',
      subject: '',
      exam_year: new Date().getFullYear().toString(),
      duration_minutes: 120,
      total_marks: 100,
      sections: []
    });
    setIsEditorOpen(true);
  };

  const handleEditPaper = async (paper) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/question-papers/${paper.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingPaper(response.data);
      setPaperForm({
        title_bn: response.data.title_bn || '',
        title_en: response.data.title_en || '',
        class_name: response.data.class_name || '',
        subject: response.data.subject || '',
        exam_year: response.data.exam_year || new Date().getFullYear().toString(),
        duration_minutes: response.data.duration_minutes || 120,
        total_marks: response.data.total_marks || 100,
        sections: response.data.sections || []
      });
      setIsEditorOpen(true);
    } catch (error) {
      toast.error('Failed to load paper');
    }
  };

  const handleSavePaper = async () => {
    if (!paperForm.class_name || !paperForm.subject) {
      toast.error('Please select class and subject');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (editingPaper) {
        await axios.put(`${API_BASE_URL}/question-papers/${editingPaper.id}`, paperForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Question paper updated');
      } else {
        await axios.post(`${API_BASE_URL}/question-papers`, paperForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Question paper created');
      }
      
      setIsEditorOpen(false);
      fetchPapers();
    } catch (error) {
      toast.error('Failed to save paper');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaper = async (paperId) => {
    if (!window.confirm('Are you sure you want to delete this paper?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/question-papers/${paperId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Paper deleted');
      fetchPapers();
    } catch (error) {
      toast.error('Failed to delete paper');
    }
  };

  const handleAddSection = (template) => {
    const newSection = {
      section_number: paperForm.sections.length + 1,
      section_title_bn: template.title_bn,
      section_title_en: template.title_en,
      instructions_bn: template.instructions_bn,
      marks_per_question: template.default_marks,
      question_ids: [],
      questions: []
    };
    setPaperForm(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const handleRemoveSection = (index) => {
    setPaperForm(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const handleOpenQuestionPicker = (sectionIndex) => {
    setCurrentSectionIndex(sectionIndex);
    setIsQuestionPickerOpen(true);
  };

  const handleAddQuestionToSection = (question) => {
    if (currentSectionIndex === null) return;
    
    setPaperForm(prev => {
      const sections = [...prev.sections];
      const section = sections[currentSectionIndex];
      
      if (!section.question_ids.includes(question.id)) {
        section.question_ids.push(question.id);
        section.questions = [...(section.questions || []), question];
      }
      
      return { ...prev, sections };
    });
    toast.success('Question added');
  };

  const handleRemoveQuestionFromSection = (sectionIndex, questionId) => {
    setPaperForm(prev => {
      const sections = [...prev.sections];
      const section = sections[sectionIndex];
      section.question_ids = section.question_ids.filter(id => id !== questionId);
      section.questions = (section.questions || []).filter(q => q.id !== questionId);
      return { ...prev, sections };
    });
  };

  const handlePrintPreview = async (paper) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/question-papers/${paper.id}/print`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrintData(response.data);
      setIsPrintPreviewOpen(true);
    } catch (error) {
      toast.error('Failed to load print preview');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateTotalMarks = () => {
    return paperForm.sections.reduce((total, section) => {
      return total + (section.question_ids.length * section.marks_per_question);
    }, 0);
  };

  const getBengaliNumber = (num) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('');
  };

  return (
    <div className="p-6 space-y-6 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            প্রশ্নপত্র তৈরি / Question Paper Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Create and print exam papers with school branding</p>
        </div>
        <Button onClick={handleCreatePaper} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          নতুন প্রশ্নপত্র / New Paper
        </Button>
      </div>

      {loading && papers.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : papers.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Question Papers</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first question paper</p>
            <Button onClick={handleCreatePaper} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Paper
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map(paper => (
            <Card key={paper.id} className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">{paper.title_bn}</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  {paper.class_name} | {paper.subject} | {paper.exam_year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <span>Sections: {paper.sections?.length || 0}</span>
                  <span>Marks: {paper.total_marks}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditPaper(paper)}>
                    <BookOpen className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handlePrintPreview(paper)}>
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeletePaper(paper.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingPaper ? 'Edit Question Paper' : 'Create Question Paper'}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Build your exam paper by adding sections and questions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <Label className="dark:text-gray-300">পরীক্ষার নাম (Bengali) *</Label>
                <Input
                  value={paperForm.title_bn}
                  onChange={(e) => setPaperForm({ ...paperForm, title_bn: e.target.value })}
                  placeholder="বার্ষিক পরীক্ষা"
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label className="dark:text-gray-300">Exam Title (English)</Label>
                <Input
                  value={paperForm.title_en}
                  onChange={(e) => setPaperForm({ ...paperForm, title_en: e.target.value })}
                  placeholder="Annual Examination"
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label className="dark:text-gray-300">শ্রেণী / Class *</Label>
                <Select value={paperForm.class_name} onValueChange={(value) => setPaperForm({ ...paperForm, class_name: value })}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id || cls.name} value={cls.name}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="dark:text-gray-300">বিষয় / Subject *</Label>
                <Select value={paperForm.subject} onValueChange={(value) => setPaperForm({ ...paperForm, subject: value })}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(sub => (
                      <SelectItem key={sub.id || sub.name} value={sub.name}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="dark:text-gray-300">সাল / Year</Label>
                <Input
                  value={paperForm.exam_year}
                  onChange={(e) => setPaperForm({ ...paperForm, exam_year: e.target.value })}
                  placeholder="২০২৫"
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label className="dark:text-gray-300">সময় (মিনিট) / Duration</Label>
                <Input
                  type="number"
                  value={paperForm.duration_minutes}
                  onChange={(e) => setPaperForm({ ...paperForm, duration_minutes: parseInt(e.target.value) || 0 })}
                  className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium dark:text-white">প্রশ্ন বিভাগ / Sections</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Marks: <strong>{calculateTotalMarks()}</strong>
                </div>
              </div>

              <div className="mb-4">
                <Label className="dark:text-gray-300 mb-2 block">Add Section Template:</Label>
                <div className="flex flex-wrap gap-2">
                  {sectionTemplates.map(template => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSection(template)}
                      className="dark:border-gray-600 dark:text-gray-300"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {template.title_bn}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {paperForm.sections.map((section, sIndex) => (
                  <Card key={sIndex} className="dark:bg-gray-900 dark:border-gray-700">
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {getBengaliNumber(sIndex + 1)}।
                          </span>
                          <span className="ml-2 font-medium dark:text-white">{section.section_title_bn}</span>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            ({section.question_ids.length} questions × {section.marks_per_question} marks)
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenQuestionPicker(sIndex)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Questions
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleRemoveSection(sIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {section.questions && section.questions.length > 0 && (
                      <CardContent className="py-2">
                        <div className="space-y-2">
                          {section.questions.map((q, qIndex) => (
                            <div key={q.id} className="flex justify-between items-start p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="flex-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                                  {getBengaliNumber(qIndex + 1)})
                                </span>
                                <span className="text-sm dark:text-gray-300">{q.question_text}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500"
                                onClick={() => handleRemoveQuestionFromSection(sIndex, q.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)} className="dark:border-gray-600 dark:text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleSavePaper} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Paper'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuestionPickerOpen} onOpenChange={setIsQuestionPickerOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Select Questions</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Add questions from your Question Bank
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search questions..."
                value={questionFilters.search}
                onChange={(e) => setQuestionFilters({ ...questionFilters, search: e.target.value })}
                className="flex-1 min-w-[200px] dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              />
              <Select value={questionFilters.question_type} onValueChange={(value) => setQuestionFilters({ ...questionFilters, question_type: value })}>
                <SelectTrigger className="w-[150px] dark:bg-gray-900 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="mcq">MCQ</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="fill_blank">Fill Blank</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchQuestions} variant="outline" className="dark:border-gray-600">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {questionBank.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No questions found. Create questions in the Question Bank first.
                </div>
              ) : (
                questionBank.map(question => (
                  <div key={question.id} className="flex justify-between items-start p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex-1">
                      <p className="text-sm dark:text-gray-200">{question.question_text}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                          {question.question_type}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {question.difficulty}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddQuestionToSection(question)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsQuestionPickerOpen(false)} className="dark:border-gray-600">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintPreviewOpen} onOpenChange={setIsPrintPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto dark:bg-white print:shadow-none">
          <div className="print:block">
            {printData && (
              <div className="bg-white text-black p-8 print:p-0" id="print-content">
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                  {printData.branding.logo_url && (
                    <img
                      src={printData.branding.logo_url}
                      alt="School Logo"
                      className="h-16 mx-auto mb-2"
                    />
                  )}
                  <h1 className="text-2xl font-bold" style={{ color: printData.branding.primary_color }}>
                    {printData.branding.school_name_bn}
                  </h1>
                  <p className="text-sm text-gray-600">{printData.branding.school_name_en}</p>
                  {printData.branding.address && (
                    <p className="text-xs text-gray-500">{printData.branding.address}</p>
                  )}
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold">{printData.paper.title_bn} - {printData.paper.exam_year}</h2>
                  <div className="flex justify-center gap-8 mt-2 text-sm">
                    <span>শ্রেণী: {printData.paper.class_name}</span>
                    <span>বিষয়: {printData.paper.subject}</span>
                  </div>
                  <div className="flex justify-between mt-2 text-sm px-8">
                    <span>সময়: {Math.floor(printData.paper.duration_minutes / 60)} ঘণ্টা</span>
                    <span>পূর্ণমান: {printData.paper.total_marks}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {printData.paper.sections.map((section, sIndex) => (
                    <div key={sIndex} className="border-t border-gray-300 pt-4">
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="font-bold">{getBengaliNumber(sIndex + 1)}।</span>
                        <span className="font-bold">{section.section_title_bn}</span>
                        <span className="text-sm text-gray-600">
                          ({section.marks_per_question} × {section.questions?.length || 0} = {(section.marks_per_question || 1) * (section.questions?.length || 0)})
                        </span>
                      </div>
                      {section.instructions_bn && (
                        <p className="text-sm text-gray-600 mb-2 italic">{section.instructions_bn}</p>
                      )}
                      <div className="space-y-2 pl-6">
                        {section.questions?.map((q, qIndex) => (
                          <div key={q.id} className="flex gap-2">
                            <span>{String.fromCharCode(2453 + qIndex)}))</span>
                            <span>{q.question_text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => setIsPrintPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-content, #print-content * {
            visibility: visible;
          }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default QuestionPaperBuilder;
