import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  FileText, Plus, Trash2, Search, Printer, Save, Eye, 
  ChevronDown, ChevronUp, GripVertical, X, BookOpen, Sparkles, Loader2
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
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sectionTemplates, setSectionTemplates] = useState([]);
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

  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  
  const sectionOptions = [
    { id: 'one_word', name_bn: 'একশব্দে উত্তর', name_en: 'One Word Answer', default_marks: 1 },
    { id: 'fill_blanks', name_bn: 'শূন্যস্থান পূরণ', name_en: 'Fill in the Blanks', default_marks: 1 },
    { id: 'true_false', name_bn: 'সত্য/মিথ্যা', name_en: 'True/False', default_marks: 1 },
    { id: 'mcq', name_bn: 'বহুনির্বাচনী প্রশ্ন', name_en: 'MCQ', default_marks: 1 },
    { id: 'short_answer', name_bn: 'সংক্ষেপে উত্তর', name_en: 'Short Answer', default_marks: 2 },
    { id: 'matching', name_bn: 'মিলকরণ', name_en: 'Matching', default_marks: 1 },
    { id: 'descriptive', name_bn: 'রচনামূলক প্রশ্ন', name_en: 'Descriptive', default_marks: 5 },
    { id: 'application', name_bn: 'প্রয়োগমূলক প্রশ্ন', name_en: 'Application Based', default_marks: 5 }
  ];

  const [aiForm, setAiForm] = useState({
    class_name: '',
    subject: '',
    total_marks: 100,
    duration_minutes: 120,
    exam_type: 'বার্ষিক পরীক্ষা',
    difficulty_mix: 'balanced',
    section_config: {
      one_word: { enabled: true, question_count: 5 },
      fill_blanks: { enabled: true, question_count: 5 },
      true_false: { enabled: true, question_count: 5 },
      short_answer: { enabled: true, question_count: 5 },
      descriptive: { enabled: true, question_count: 5 }
    }
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

  useEffect(() => {
    fetchPapers();
    fetchClasses();
    fetchSubjects();
    fetchTemplates();
  }, [fetchPapers, fetchClasses, fetchSubjects, fetchTemplates]);

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

  const toggleSectionSelection = (sectionId) => {
    setAiForm(prev => {
      const currentConfig = prev.section_config[sectionId] || { enabled: false, question_count: 5 };
      return {
        ...prev,
        section_config: {
          ...prev.section_config,
          [sectionId]: { ...currentConfig, enabled: !currentConfig.enabled }
        }
      };
    });
  };

  const updateSectionQuestionCount = (sectionId, count) => {
    setAiForm(prev => {
      const currentConfig = prev.section_config[sectionId] || { enabled: true, question_count: 5 };
      return {
        ...prev,
        section_config: {
          ...prev.section_config,
          [sectionId]: { ...currentConfig, question_count: parseInt(count) || 1 }
        }
      };
    });
  };

  const getEnabledSections = () => {
    return Object.entries(aiForm.section_config)
      .filter(([_, config]) => config.enabled)
      .map(([id, _]) => id);
  };

  const getTotalQuestions = () => {
    return Object.entries(aiForm.section_config)
      .filter(([_, config]) => config.enabled)
      .reduce((sum, [_, config]) => sum + (config.question_count || 0), 0);
  };

  const handleAIGenerate = async () => {
    if (!aiForm.class_name || !aiForm.subject) {
      toast.error('Please select class and subject');
      return;
    }
    
    const enabledSections = getEnabledSections();
    if (enabledSections.length === 0) {
      toast.error('Please select at least one section type');
      return;
    }

    try {
      setAiGenerating(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE_URL}/question-papers/ai-generate`, aiForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Question paper generated successfully!');
      setIsAIDialogOpen(false);
      setAiForm({
        class_name: '',
        subject: '',
        total_marks: 100,
        duration_minutes: 120,
        exam_type: 'বার্ষিক পরীক্ষা',
        difficulty_mix: 'balanced',
        section_config: {
          one_word: { enabled: true, question_count: 5 },
          fill_blanks: { enabled: true, question_count: 5 },
          true_false: { enabled: true, question_count: 5 },
          short_answer: { enabled: true, question_count: 5 },
          descriptive: { enabled: true, question_count: 5 }
        }
      });
      fetchPapers();
      
      if (response.data.paper) {
        handleEditPaper(response.data.paper);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate question paper');
    } finally {
      setAiGenerating(false);
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
    // Create a new window with print content
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow || !printData) return;
    
    const getBengaliNum = (n) => {
      const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return String(n).split('').map(d => bengaliDigits[parseInt(d)] || d).join('');
    };
    
    let sectionsHtml = '';
    printData.paper.sections?.forEach((section, sIndex) => {
      const bengaliLabels = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ'];
      const label = bengaliLabels[sIndex] || '';
      
      let questionsHtml = '';
      section.questions?.forEach((q, qIndex) => {
        const questionLabel = String.fromCharCode(2453 + qIndex);
        questionsHtml += `<div style="margin-left: 20px; margin-bottom: 8px;"><span>${questionLabel})</span> ${q.question_text || ''}</div>`;
      });
      
      sectionsHtml += `
        <div style="border-top: 1px solid #ccc; padding-top: 15px; margin-top: 15px;">
          <div style="margin-bottom: 10px;">
            <strong>${label} বিভাগ: ${section.section_title_bn || ''}</strong>
            <span style="margin-left: 10px; color: #666;">(${section.marks_per_question || 0} × ${section.questions?.length || 0} = ${(section.marks_per_question || 0) * (section.questions?.length || 0)})</span>
          </div>
          ${section.instructions_bn ? `<p style="font-style: italic; color: #666; margin-bottom: 10px;">${section.instructions_bn}</p>` : ''}
          ${questionsHtml}
        </div>
      `;
    });
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${printData.paper.title_bn} - ${printData.paper.class_name}</title>
        <style>
          body { font-family: 'SolaimanLipi', 'Noto Sans Bengali', Arial, sans-serif; margin: 40px; color: black; }
          .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { height: 60px; margin-bottom: 10px; }
          h1 { margin: 5px 0; font-size: 24px; }
          h2 { margin: 10px 0; font-size: 18px; }
          .info { display: flex; justify-content: center; gap: 30px; margin-top: 10px; }
          .meta { display: flex; justify-content: space-between; margin-top: 10px; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${printData.branding.logo_url ? `<img src="${printData.branding.logo_url}" class="logo" alt="Logo">` : ''}
          <h1 style="color: ${printData.branding.primary_color};">${printData.branding.school_name_bn || ''}</h1>
          <p style="margin: 5px 0; color: #666;">${printData.branding.school_name_en || ''}</p>
          ${printData.branding.address ? `<p style="font-size: 12px; color: #888;">${printData.branding.address}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <h2>${printData.paper.title_bn || ''} - ${printData.paper.exam_year || ''}</h2>
          <div class="info">
            <span>শ্রেণী: ${printData.paper.class_name || ''}</span>
            <span>বিষয়: ${printData.paper.subject || ''}</span>
          </div>
          <div class="meta">
            <span>সময়: ${Math.floor((printData.paper.duration_minutes || 0) / 60)} ঘণ্টা</span>
            <span>পূর্ণমান: ${printData.paper.total_marks || 0}</span>
          </div>
        </div>
        
        <div>${sectionsHtml}</div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for images to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  const calculateTotalMarks = () => {
    if (!paperForm.sections || !Array.isArray(paperForm.sections)) {
      return 0;
    }
    return paperForm.sections.reduce((total, section) => {
      const questionCount = section.question_ids?.length || section.questions?.length || 0;
      return total + (questionCount * (section.marks_per_question || 0));
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
        <div className="flex gap-2">
          <Button onClick={handleCreatePaper} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            নতুন প্রশ্নপত্র / New Paper
          </Button>
          <Button onClick={() => setIsAIDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            <Sparkles className="h-4 w-4 mr-2" />
            AI প্রশ্নপত্র / AI Generate
          </Button>
        </div>
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
                            ({section.question_ids?.length || section.questions?.length || 0} questions × {section.marks_per_question || 0} marks)
                          </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleRemoveSection(sIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI প্রশ্নপত্র তৈরি / AI Question Paper Generator
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              AI will create a complete question paper with sections and questions in Bengali
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-gray-300">Class / শ্রেণী</Label>
                <Select value={aiForm.class_name} onValueChange={(value) => setAiForm({ ...aiForm, class_name: value })}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id || cls.name} value={cls.name}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-300">Subject / বিষয়</Label>
                <Select value={aiForm.subject} onValueChange={(value) => setAiForm({ ...aiForm, subject: value })}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(sub => (
                      <SelectItem key={sub.id || sub.name} value={sub.name}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-gray-300">Total Marks / মোট নম্বর</Label>
                <Input
                  type="number"
                  value={aiForm.total_marks}
                  onChange={(e) => setAiForm({ ...aiForm, total_marks: parseInt(e.target.value) || 100 })}
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-300">Duration (min) / সময়</Label>
                <Input
                  type="number"
                  value={aiForm.duration_minutes}
                  onChange={(e) => setAiForm({ ...aiForm, duration_minutes: parseInt(e.target.value) || 120 })}
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-gray-300">Exam Type / পরীক্ষার ধরন</Label>
              <Select value={aiForm.exam_type} onValueChange={(value) => setAiForm({ ...aiForm, exam_type: value })}>
                <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="বার্ষিক পরীক্ষা">বার্ষিক পরীক্ষা (Annual Exam)</SelectItem>
                  <SelectItem value="অর্ধ-বার্ষিক পরীক্ষা">অর্ধ-বার্ষিক পরীক্ষা (Half-Yearly)</SelectItem>
                  <SelectItem value="প্রথম সাময়িক পরীক্ষা">প্রথম সাময়িক পরীক্ষা (1st Term)</SelectItem>
                  <SelectItem value="দ্বিতীয় সাময়িক পরীক্ষা">দ্বিতীয় সাময়িক পরীক্ষা (2nd Term)</SelectItem>
                  <SelectItem value="মডেল টেস্ট">মডেল টেস্ট (Model Test)</SelectItem>
                  <SelectItem value="সাপ্তাহিক পরীক্ষা">সাপ্তাহিক পরীক্ষা (Weekly Test)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-gray-300">Difficulty Mix</Label>
              <Select value={aiForm.difficulty_mix} onValueChange={(value) => setAiForm({ ...aiForm, difficulty_mix: value })}>
                <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">Balanced (Easy, Medium, Hard)</SelectItem>
                  <SelectItem value="easy">Mostly Easy</SelectItem>
                  <SelectItem value="medium">Mostly Medium</SelectItem>
                  <SelectItem value="challenging">Challenging</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-gray-300">Select Sections & Question Count / বিভাগ ও প্রশ্ন সংখ্যা নির্বাচন</Label>
              <div className="space-y-2 p-3 border rounded-lg dark:border-gray-600 max-h-64 overflow-y-auto">
                {sectionOptions.map(section => {
                  const config = aiForm.section_config[section.id] || { enabled: false, question_count: 5 };
                  return (
                    <div 
                      key={section.id} 
                      className={`flex items-center justify-between p-2 rounded transition-colors ${
                        config.enabled
                          ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-600'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={() => toggleSectionSelection(section.id)}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm dark:text-gray-300">
                          {section.name_bn}
                        </span>
                      </label>
                      {config.enabled && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">প্রশ্ন:</span>
                          <Input
                            type="number"
                            min="1"
                            max="50"
                            value={config.question_count}
                            onChange={(e) => updateSectionQuestionCount(section.id, e.target.value)}
                            className="w-16 h-7 text-center text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Selected: {getEnabledSections().length} section(s) | Total Questions: {getTotalQuestions()}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIDialogOpen(false)} disabled={aiGenerating}>
              Cancel
            </Button>
            <Button onClick={handleAIGenerate} className="bg-purple-600 hover:bg-purple-700" disabled={aiGenerating}>
              {aiGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Paper
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-content,
          #print-content * {
            visibility: visible !important;
            color: black !important;
          }
          #print-content {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20px !important;
            background: white !important;
            z-index: 99999 !important;
          }
          #print-content h1,
          #print-content h2,
          #print-content p,
          #print-content span,
          #print-content div {
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default QuestionPaperBuilder;
