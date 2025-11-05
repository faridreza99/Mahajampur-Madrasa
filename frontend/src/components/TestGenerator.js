import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Plus, Send, Calendar, Eye, Edit, Trash2, RefreshCw, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const TestGenerator = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // Test generation form with subject configs
  const [subjectConfigs, setSubjectConfigs] = useState([{
    subject: '',
    num_questions: 10,
    max_marks: 100
  }]);
  
  const [testForm, setTestForm] = useState({
    class_standard: '',
    chapter: '',
    topic: '',
    difficulty_level: 'medium',
    tags: []
  });
  
  // Generated test
  const [generatedTest, setGeneratedTest] = useState(null);
  
  // Scheduling
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_start: '',
    scheduled_end: ''
  });
  
  const classes = ['9', '10', '11', '12'];
  const subjects = ['Physics', 'Chemistry', 'Biology', 'Math', 'English', 'Computer Science'];
  const difficultyLevels = ['easy', 'medium', 'hard'];
  const learningTags = ['Knowledge', 'Understanding', 'Application', 'Reasoning', 'Skills'];
  
  // Add subject row
  const handleAddSubject = () => {
    setSubjectConfigs([...subjectConfigs, { subject: '', num_questions: 10, max_marks: 100 }]);
  };
  
  // Remove subject row
  const handleRemoveSubject = (index) => {
    if (subjectConfigs.length === 1) {
      toast.error('At least one subject is required');
      return;
    }
    const updated = subjectConfigs.filter((_, i) => i !== index);
    setSubjectConfigs(updated);
  };
  
  // Update subject config
  const handleSubjectConfigChange = (index, field, value) => {
    const updated = [...subjectConfigs];
    updated[index][field] = value;
    setSubjectConfigs(updated);
  };
  
  // Calculate total marks
  const calculateTotalMarks = () => {
    return subjectConfigs.reduce((sum, config) => sum + (parseInt(config.max_marks) || 0), 0);
  };
  
  // Generate test with multiple subjects
  const handleGenerateTest = async () => {
    // Validate all subject configs
    const validConfigs = subjectConfigs.filter(c => c.subject);
    if (!testForm.class_standard || validConfigs.length === 0) {
      toast.error('Please select class and at least one subject');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // For now, generate for first subject (backend needs multi-subject support)
      // TODO: Backend should accept subject_configs array
      const firstConfig = validConfigs[0];
      const response = await axios.post(
        `${API_BASE_URL}/test/generate`,
        {
          ...testForm,
          subject: firstConfig.subject,
          num_questions: firstConfig.num_questions,
          max_marks: firstConfig.max_marks,
          subject_configs: validConfigs  // Send all configs for future use
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Store all subject configs with generated test for reference
      setGeneratedTest({
        ...response.data,
        subject_configs: validConfigs
      });
      setActiveTab('preview');
      toast.success(`Test generated with ${response.data.total_questions} questions!`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate test');
      console.error(error);
    }
    setLoading(false);
  };
  
  // Edit question inline
  const handleEditQuestion = (question) => {
    setEditingQuestion({ ...question });
  };
  
  // Save edited question
  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/test/question/${editingQuestion.id}`,
        {
          question_text: editingQuestion.question_text,
          options: editingQuestion.options,
          correct_answer: editingQuestion.correct_answer,
          marks: editingQuestion.marks
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      const updatedQuestions = generatedTest.questions.map(q =>
        q.id === editingQuestion.id ? response.data.question : q
      );
      setGeneratedTest({
        ...generatedTest,
        questions: updatedQuestions
      });
      
      setEditingQuestion(null);
      toast.success('Question updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update question');
      console.error(error);
    }
    setLoading(false);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingQuestion(null);
  };
  
  // Publish test
  const handlePublishTest = async () => {
    if (!generatedTest) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/test/publish`,
        {
          test_id: generatedTest.test_id,
          scheduled_start: scheduleForm.scheduled_start || null,
          scheduled_end: scheduleForm.scheduled_end || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success('Test published successfully!');
      setGeneratedTest(null);
      setActiveTab('list');
      fetchTests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to publish test');
      console.error(error);
    }
    setLoading(false);
  };
  
  // Fetch tests
  const fetchTests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/test/list`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setTests(response.data.tests || []);
    } catch (error) {
      toast.error('Failed to fetch tests');
      console.error(error);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    if (activeTab === 'list') {
      fetchTests();
    }
  }, [activeTab]);
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-8 h-8 text-emerald-600" />
          AI Test Generator
        </h1>
        <p className="text-gray-600">Create and manage tests with AI assistance</p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('generate')}
            className={`${
              activeTab === 'generate'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Plus size={18} />
            Generate Test
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`${
              activeTab === 'preview'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            disabled={!generatedTest}
          >
            <Eye size={18} />
            Preview & Edit
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`${
              activeTab === 'list'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <FileText size={18} />
            History
          </button>
        </nav>
      </div>
      
      {/* Generate Test Tab */}
      {activeTab === 'generate' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Generate New Test</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Class */}
            <div>
              <label className="block text-sm font-medium mb-2">Class *</label>
              <select
                value={testForm.class_standard}
                onChange={(e) => setTestForm({...testForm, class_standard: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty Level</label>
              <select
                value={testForm.difficulty_level}
                onChange={(e) => setTestForm({...testForm, difficulty_level: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {difficultyLevels.map(d => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
            
            {/* Chapter */}
            <div>
              <label className="block text-sm font-medium mb-2">Chapter</label>
              <input
                type="text"
                value={testForm.chapter}
                onChange={(e) => setTestForm({...testForm, chapter: e.target.value})}
                placeholder="Optional"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            {/* Topic */}
            <div>
              <label className="block text-sm font-medium mb-2">Topic</label>
              <input
                type="text"
                value={testForm.topic}
                onChange={(e) => setTestForm({...testForm, topic: e.target.value})}
                placeholder="Optional"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          
          {/* Subject Configuration Table */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Subject Configuration</label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subject *</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Questions</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Maximum Marks</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subjectConfigs.map((config, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <select
                          value={config.subject}
                          onChange={(e) => handleSubjectConfigChange(index, 'subject', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="">Select Subject</option>
                          {subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={config.num_questions}
                          onChange={(e) => handleSubjectConfigChange(index, 'num_questions', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="10"
                          max="500"
                          value={config.max_marks}
                          onChange={(e) => handleSubjectConfigChange(index, 'max_marks', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveSubject(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={subjectConfigs.length === 1}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="2" className="px-4 py-3 text-right font-semibold">Total Marks:</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{calculateTotalMarks()}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <button
              onClick={handleAddSubject}
              className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Plus size={16} />
              Add Another Subject
            </button>
          </div>
          
          {/* Learning Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Learning Dimensions (Tags)</label>
            <div className="flex flex-wrap gap-2">
              {learningTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    if (testForm.tags.includes(tag)) {
                      setTestForm({...testForm, tags: testForm.tags.filter(t => t !== tag)});
                    } else {
                      setTestForm({...testForm, tags: [...testForm.tags, tag]});
                    }
                  }}
                  className={`px-4 py-2 rounded-lg border ${
                    testForm.tags.includes(tag)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          {/* Generate Button */}
          <button
            onClick={handleGenerateTest}
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            {loading ? 'Generating...' : 'Generate Test with AI'}
          </button>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> After generation, you can edit questions, adjust marks, and then publish to students.
            </p>
          </div>
        </div>
      )}
      
      {/* Preview & Edit Tab */}
      {activeTab === 'preview' && generatedTest && (
        <div className="space-y-6">
          {/* Test Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{generatedTest.title}</h2>
                <p className="text-sm text-gray-600">
                  {generatedTest.total_questions} Questions · Status: {generatedTest.status}
                </p>
              </div>
              <button
                onClick={handleGenerateTest}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Regenerate
              </button>
            </div>
            
            {/* Scheduling Options */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-3">Schedule Test (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduled_start}
                    onChange={(e) => setScheduleForm({...scheduleForm, scheduled_start: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduled_end}
                    onChange={(e) => setScheduleForm({...scheduleForm, scheduled_end: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Questions Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Questions (Click Edit to Modify)</h3>
            <div className="space-y-4">
              {generatedTest.questions.map((q, idx) => (
                <div key={q.id} className="border rounded-lg p-4">
                  {editingQuestion && editingQuestion.id === q.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">Q{idx + 1}.</span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {editingQuestion.learning_tag}
                        </span>
                      </div>
                      
                      {/* Question Text */}
                      <textarea
                        value={editingQuestion.question_text}
                        onChange={(e) => setEditingQuestion({...editingQuestion, question_text: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows="3"
                      />
                      
                      {/* Marks */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Marks:</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editingQuestion.marks}
                          onChange={(e) => setEditingQuestion({...editingQuestion, marks: parseInt(e.target.value)})}
                          className="w-20 px-3 py-2 border rounded-lg"
                        />
                      </div>
                      
                      {/* Options for MCQ */}
                      {editingQuestion.question_type === 'mcq' && editingQuestion.options && editingQuestion.options.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Options:</label>
                          {editingQuestion.options.map((opt, optIdx) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <span className="font-medium">{opt.id}.</span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const updatedOptions = [...editingQuestion.options];
                                  updatedOptions[optIdx].text = e.target.value;
                                  setEditingQuestion({...editingQuestion, options: updatedOptions});
                                }}
                                className="flex-1 px-3 py-2 border rounded-lg"
                              />
                              <input
                                type="radio"
                                name="correct_answer"
                                checked={editingQuestion.correct_answer === opt.id}
                                onChange={() => setEditingQuestion({...editingQuestion, correct_answer: opt.id})}
                              />
                              <span className="text-sm text-gray-600">Correct</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Answer for non-MCQ */}
                      {editingQuestion.question_type !== 'mcq' && (
                        <div>
                          <label className="text-sm font-medium">Correct Answer:</label>
                          <input
                            type="text"
                            value={editingQuestion.correct_answer}
                            onChange={(e) => setEditingQuestion({...editingQuestion, correct_answer: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg mt-1"
                          />
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleSaveQuestion}
                          disabled={loading}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                        >
                          <Save size={18} />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                        >
                          <X size={18} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">Q{idx + 1}.</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {q.learning_tag}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {q.marks} marks
                          </span>
                        </div>
                        <p className="text-gray-800 mb-2">{q.question_text}</p>
                        
                        {/* Options for MCQ */}
                        {q.question_type === 'mcq' && q.options && q.options.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`text-sm px-3 py-2 rounded ${
                                  opt.id === q.correct_answer
                                    ? 'bg-emerald-50 border border-emerald-300 font-medium'
                                    : 'bg-gray-50'
                                }`}
                              >
                                {opt.id}. {opt.text}
                                {opt.id === q.correct_answer && (
                                  <span className="ml-2 text-emerald-600">✓ Correct</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Answer for non-MCQ */}
                        {q.question_type !== 'mcq' && (
                          <div className="mt-2 text-sm bg-emerald-50 border border-emerald-200 rounded p-2">
                            <span className="font-medium text-emerald-700">Answer:</span> {q.correct_answer}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleEditQuestion(q)}
                        className="ml-4 p-2 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Edit question"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Publish Button */}
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={handlePublishTest}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <Send size={20} />
              {loading ? 'Publishing...' : 'Publish Test to Students'}
            </button>
          </div>
        </div>
      )}
      
      {/* History Tab */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Test History</h2>
          
          {tests.length > 0 ? (
            <div className="space-y-3">
              {tests.map((test) => (
                <div key={test.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{test.title}</h4>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Subject:</span> {test.subject}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Total Questions:</span> {test.total_questions}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Marks:</span> {test.max_marks || test.total_marks || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Difficulty:</span> {test.difficulty_level}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          test.status === 'published'
                            ? 'bg-emerald-100 text-emerald-700'
                            : test.status === 'draft'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {test.status.toUpperCase()}
                        </span>
                        {test.is_scheduled && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1">
                            <Calendar size={12} />
                            Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p><span className="font-medium">Created by:</span> {test.created_by_name}</p>
                      <p><span className="font-medium">Date:</span> {new Date(test.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No tests found. Generate a new test to view history here!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestGenerator;
