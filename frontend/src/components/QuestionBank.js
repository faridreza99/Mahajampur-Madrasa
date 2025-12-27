import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { 
  FileQuestion, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  BookOpen,
  CheckCircle,
  HelpCircle,
  FileText,
  ToggleLeft,
  ListChecks,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Wand2,
  Loader2
} from 'lucide-react';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [filters, setFilters] = useState({
    subject: '',
    class_name: '',
    difficulty: '',
    question_type: '',
    search: ''
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'mcq',
    subject: '',
    class_name: '',
    difficulty: 'medium',
    marks: 1,
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    tags: []
  });

  const [aiFormData, setAiFormData] = useState({
    subject: '',
    class_name: '',
    question_type: 'mcq',
    difficulty: 'medium',
    count: 5,
    topic: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.class_name) params.append('class_name', filters.class_name);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.question_type) params.append('question_type', filters.question_type);
      if (filters.search) params.append('search', filters.search);
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      
      const response = await axios.get(`${API_BASE_URL}/question-bank?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setQuestions(response.data.questions || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        pages: response.data.pages
      }));
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, API_BASE_URL]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/question-bank/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [API_BASE_URL]);

  const fetchSubjectsAndClasses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [subjectsRes, classesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/classes`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const rawSubjects = subjectsRes.data.subjects || subjectsRes.data || [];
      const normalizedSubjects = rawSubjects.map(s => ({
        id: s.id,
        name: s.subject_name || s.name || 'Unknown'
      }));
      const uniqueSubjects = [...new Map(normalizedSubjects.map(s => [s.name, s])).values()];
      setSubjects(uniqueSubjects);
      setClasses(classesRes.data.classes || classesRes.data || []);
    } catch (error) {
      console.error('Error fetching subjects/classes:', error);
      toast.error('Failed to load subjects/classes');
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchQuestions();
    fetchStats();
    fetchSubjectsAndClasses();
  }, [fetchQuestions, fetchStats, fetchSubjectsAndClasses]);

  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setFormData({
      question_text: '',
      question_type: 'mcq',
      subject: '',
      class_name: '',
      difficulty: 'medium',
      marks: 1,
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      tags: []
    });
    setIsModalOpen(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text || '',
      question_type: question.question_type || 'mcq',
      subject: question.subject || '',
      class_name: question.class_name || '',
      difficulty: question.difficulty || 'medium',
      marks: question.marks || 1,
      options: question.options || ['', '', '', ''],
      correct_answer: question.correct_answer || '',
      explanation: question.explanation || '',
      tags: question.tags || []
    });
    setIsModalOpen(true);
  };

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    if (!aiFormData.subject || !aiFormData.class_name) {
      toast.error('Please select subject and class');
      return;
    }
    
    setAiGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/question-bank/ai-generate`, {
        subject: aiFormData.subject,
        class_name: aiFormData.class_name,
        question_type: aiFormData.question_type,
        difficulty: aiFormData.difficulty,
        count: aiFormData.count,
        topic: aiFormData.topic
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAiQuestions(response.data.questions || []);
      toast.success(`Generated ${response.data.questions?.length || 0} questions!`);
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate questions');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveAIQuestion = async (question) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/question-bank`, question, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Question saved to bank!');
      setAiQuestions(prev => prev.filter(q => q !== question));
      fetchQuestions();
      fetchStats();
    } catch (error) {
      toast.error('Failed to save question');
    }
  };

  const handleSaveAllAIQuestions = async () => {
    if (aiQuestions.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      let saved = 0;
      for (const question of aiQuestions) {
        await axios.post(`${API_BASE_URL}/question-bank`, question, {
          headers: { Authorization: `Bearer ${token}` }
        });
        saved++;
      }
      toast.success(`Saved ${saved} questions to bank!`);
      setAiQuestions([]);
      setIsAIModalOpen(false);
      fetchQuestions();
      fetchStats();
    } catch (error) {
      toast.error('Failed to save some questions');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/question-bank/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Question deleted successfully');
      fetchQuestions();
      fetchStats();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const submitData = { ...formData };
      
      if (formData.question_type !== 'mcq') {
        submitData.options = [];
      }

      if (editingQuestion) {
        await axios.put(`${API_BASE_URL}/question-bank/${editingQuestion.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Question updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/question-bank`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Question created successfully');
      }

      setIsModalOpen(false);
      fetchQuestions();
      fetchStats();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error(error.response?.data?.detail || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const removeOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'mcq': return <ListChecks className="h-4 w-4" />;
      case 'short_answer': return <FileText className="h-4 w-4" />;
      case 'essay': return <BookOpen className="h-4 w-4" />;
      case 'true_false': return <ToggleLeft className="h-4 w-4" />;
      case 'fill_blank': return <HelpCircle className="h-4 w-4" />;
      default: return <FileQuestion className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Question Bank</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage questions for tests and quizzes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20" onClick={() => setIsAIModalOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleCreateQuestion}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Questions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_questions}</p>
                </div>
                <FileQuestion className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">MCQ</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.by_type?.mcq || 0}</p>
                </div>
                <ListChecks className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Short Answer</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.by_type?.short_answer || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Essay</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.by_type?.essay || 0}</p>
                </div>
                <BookOpen className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Subjects</p>
                  <p className="text-2xl font-bold text-pink-600">{stats.subject_count || 0}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search questions..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={filters.subject} onValueChange={(value) => setFilters({ ...filters, subject: value === 'all' ? '' : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(sub => (
                    <SelectItem key={sub.id || sub.name} value={sub.name}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class</Label>
              <Select value={filters.class_name} onValueChange={(value) => setFilters({ ...filters, class_name: value === 'all' ? '' : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id || cls.name} value={cls.name}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={filters.difficulty} onValueChange={(value) => setFilters({ ...filters, difficulty: value === 'all' ? '' : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Question Type</Label>
              <Select value={filters.question_type} onValueChange={(value) => setFilters({ ...filters, question_type: value === 'all' ? '' : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <FileQuestion className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Questions Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Start building your question bank by adding questions</p>
              <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleCreateQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-500">#{(pagination.page - 1) * pagination.limit + index + 1}</span>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getQuestionTypeIcon(question.question_type)}
                          {question.question_type?.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                        <Badge variant="outline">{question.marks} marks</Badge>
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium mb-2">{question.question_text}</p>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                        <span className="bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{question.subject}</span>
                        <span className="bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">{question.class_name}</span>
                        {question.chapter && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{question.chapter}</span>}
                      </div>
                      {question.question_type === 'mcq' && question.options && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {question.options.map((opt, i) => (
                            <div key={i} className={`text-sm px-3 py-1.5 rounded ${opt === question.correct_answer ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                              {String.fromCharCode(65 + i)}. {opt}
                              {opt === question.correct_answer && <CheckCircle className="inline h-4 w-4 ml-1" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditQuestion(question)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteQuestion(question.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={pagination.page === 1}
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Create New Question'}</DialogTitle>
            <DialogDescription>
              Add questions to your bank for use in tests and quizzes
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Question Type *</Label>
                <Select value={formData.question_type} onValueChange={(value) => setFormData({ ...formData, question_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                    <SelectItem value="short_answer">Short Answer</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject *</Label>
                <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                  <SelectTrigger>
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
                <Label>Class *</Label>
                <Select value={formData.class_name} onValueChange={(value) => setFormData({ ...formData, class_name: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id || cls.name} value={cls.name}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Difficulty *</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Marks</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div>
              <Label>Question Text *</Label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                placeholder="Enter your question here..."
                required
              />
            </div>

            {formData.question_type === 'mcq' && (
              <div>
                <Label className="mb-2 block">Options</Label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-8 text-center font-medium">{String.fromCharCode(65 + index)}.</span>
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant={formData.correct_answer === option && option ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData({ ...formData, correct_answer: option })}
                        className={formData.correct_answer === option && option ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      {formData.options.length > 2 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => removeOption(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {formData.options.length < 6 && (
                    <Button type="button" variant="outline" size="sm" onClick={addOption}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Option
                    </Button>
                  )}
                </div>
              </div>
            )}

            {formData.question_type === 'true_false' && (
              <div>
                <Label>Correct Answer *</Label>
                <Select value={formData.correct_answer} onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="True">True</SelectItem>
                    <SelectItem value="False">False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(formData.question_type === 'short_answer' || formData.question_type === 'fill_blank') && (
              <div>
                <Label>Expected Answer</Label>
                <Input
                  value={formData.correct_answer}
                  onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                  placeholder="Enter the expected answer"
                />
              </div>
            )}

            <div>
              <Label>Explanation (Optional)</Label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="Explain the answer..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600" disabled={loading}>
                {loading ? 'Saving...' : (editingQuestion ? 'Update Question' : 'Create Question')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAIModalOpen} onOpenChange={setIsAIModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Question Generator
            </DialogTitle>
            <DialogDescription>
              Generate questions automatically using AI. Review and save the ones you want.
            </DialogDescription>
          </DialogHeader>
          
          {aiQuestions.length === 0 ? (
            <form onSubmit={handleAIGenerate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Subject *</Label>
                  <Select value={aiFormData.subject} onValueChange={(value) => setAiFormData({ ...aiFormData, subject: value })}>
                    <SelectTrigger>
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
                  <Label>Class *</Label>
                  <Select value={aiFormData.class_name} onValueChange={(value) => setAiFormData({ ...aiFormData, class_name: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.id || cls.name} value={cls.name}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Question Type</Label>
                  <Select value={aiFormData.question_type} onValueChange={(value) => setAiFormData({ ...aiFormData, question_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">Multiple Choice</SelectItem>
                      <SelectItem value="short_answer">Short Answer</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select value={aiFormData.difficulty} onValueChange={(value) => setAiFormData({ ...aiFormData, difficulty: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Number of Questions</Label>
                  <Select value={String(aiFormData.count)} onValueChange={(value) => setAiFormData({ ...aiFormData, count: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Topic (Optional)</Label>
                <Input
                  value={aiFormData.topic}
                  onChange={(e) => setAiFormData({ ...aiFormData, topic: e.target.value })}
                  placeholder="e.g., Photosynthesis, Algebra, World War II..."
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAIModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-500 hover:bg-purple-600" disabled={aiGenerating}>
                  {aiGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {aiQuestions.length} questions generated. Review and save the ones you want.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAiQuestions([])}>
                    Generate More
                  </Button>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={handleSaveAllAIQuestions}>
                    Save All ({aiQuestions.length})
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {aiQuestions.map((question, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{question.question_type?.replace('_', ' ').toUpperCase()}</Badge>
                          <Badge className={getDifficultyColor(question.difficulty)}>{question.difficulty}</Badge>
                          <Badge variant="outline">{question.marks} marks</Badge>
                        </div>
                        <p className="text-gray-900 dark:text-white font-medium mb-2">{question.question_text}</p>
                        {question.question_type === 'mcq' && question.options && (
                          <div className="grid grid-cols-2 gap-1 mt-2">
                            {question.options.map((opt, i) => (
                              <div key={i} className={`text-sm px-2 py-1 rounded ${opt === question.correct_answer ? 'bg-green-100 text-green-800 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-700'}`}>
                                {String.fromCharCode(65 + i)}. {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        {question.correct_answer && question.question_type !== 'mcq' && (
                          <p className="text-sm text-green-600 mt-1">Answer: {question.correct_answer}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => handleSaveAIQuestion(question)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600" onClick={() => setAiQuestions(prev => prev.filter((_, i) => i !== index))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionBank;
