import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FileText,
  Plus,
  Send,
  Calendar,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// Helper: get a numeric class_standard from class object
const getClassStandard = (cls) => {
  if (cls.class_standard !== undefined && cls.class_standard !== null) {
    return String(cls.class_standard);
  }
  if (cls.name) {
    const match = String(cls.name).match(/\d+/);
    if (match) return match[0];
    return String(cls.name);
  }
  return String(cls.id);
};

const TestGenerator = () => {
  const [activeTab, setActiveTab] = useState("generate");
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // ===== Class options from backend =====
  const [classOptions, setClassOptions] = useState([]);
  const [classLoading, setClassLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");

  // Test generation form
  const [testForm, setTestForm] = useState({
    class_standard: "",
    chapter: "",
    topic: "",
    difficulty_level: "medium",
    tags: [],
  });

  // Subject configuration rows
  const [subjectConfigs, setSubjectConfigs] = useState([
    { subject: "", num_questions: 10, max_marks: 100 },
  ]);

  // Generated test preview
  const [generatedTest, setGeneratedTest] = useState(null);

  // Schedule
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_start: "",
    scheduled_end: "",
  });

  // History – which class card is active
  const [selectedHistoryClass, setSelectedHistoryClass] = useState(null);

  const subjects = [
    "Physics",
    "Chemistry",
    "Biology",
    "Math",
    "English",
    "Computer Science",
  ];
  const difficultyLevels = ["easy", "medium", "hard"];
  const learningTags = [
    "Knowledge",
    "Understanding",
    "Application",
    "Reasoning",
    "Skills",
  ];

  // =========================
  // Load classes from backend
  // =========================
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setClassLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/classes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClassOptions(res.data || []);
      } catch (err) {
        console.error("Failed to load classes:", err);
        toast.error("Failed to load classes");
      } finally {
        setClassLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // =========================
  // Subject config handlers
  // =========================
  const handleAddSubject = () => {
    setSubjectConfigs((prev) => [
      ...prev,
      { subject: "", num_questions: 10, max_marks: 100 },
    ]);
  };

  const handleRemoveSubject = (index) => {
    if (subjectConfigs.length === 1) {
      toast.error("At least one subject is required");
      return;
    }
    setSubjectConfigs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubjectConfigChange = (index, field, value) => {
    setSubjectConfigs((prev) => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };

  const calculateTotalMarks = () =>
    subjectConfigs.reduce(
      (sum, cfg) => sum + (parseInt(cfg.max_marks) || 0),
      0,
    );

  // =========================
  // Class change in Generate form
  // =========================
  const handleGenerateClassChange = (e) => {
    const id = e.target.value;
    setSelectedClassId(id);

    const cls = classOptions.find((c) => String(c.id) === String(id));
    const classStandard = cls ? getClassStandard(cls) : "";

    setTestForm((prev) => ({
      ...prev,
      class_standard: classStandard,
    }));
  };

  // =========================
  // Generate Test (Chapter compulsory)
  // =========================
  const handleGenerateTest = async () => {
    const validConfigs = subjectConfigs.filter((c) => c.subject);

    if (
      !testForm.class_standard ||
      !testForm.chapter ||
      validConfigs.length === 0
    ) {
      toast.error("Class, Chapter and at least one Subject are required");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const firstConfig = validConfigs[0];

      const res = await axios.post(
        `${API_BASE_URL}/test/generate`,
        {
          ...testForm,
          subject: firstConfig.subject,
          num_questions: firstConfig.num_questions,
          max_marks: firstConfig.max_marks,
          subject_configs: validConfigs,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setGeneratedTest({
        ...res.data,
        subject_configs: validConfigs,
      });
      setActiveTab("preview");
      toast.success(
        `Test generated with ${res.data.total_questions} questions!`,
      );
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to generate test");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Edit Question
  // =========================
  const handleEditQuestion = (q) => {
    setEditingQuestion({ ...q });
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE_URL}/test/question/${editingQuestion.id}`,
        {
          question_text: editingQuestion.question_text,
          options: editingQuestion.options,
          correct_answer: editingQuestion.correct_answer,
          marks: editingQuestion.marks,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const updatedQuestions = generatedTest.questions.map((q) =>
        q.id === editingQuestion.id ? res.data.question : q,
      );
      setGeneratedTest((prev) => ({ ...prev, questions: updatedQuestions }));
      setEditingQuestion(null);
      toast.success("Question updated");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to update question");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => setEditingQuestion(null);

  // =========================
  // Publish test
  // =========================
  const handlePublishTest = async () => {
    if (!generatedTest) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/test/publish`,
        {
          test_id: generatedTest.test_id,
          scheduled_start: scheduleForm.scheduled_start || null,
          scheduled_end: scheduleForm.scheduled_end || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Test published");
      setGeneratedTest(null);
      setActiveTab("list");
      fetchTests();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to publish test");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // History – fetch tests
  // =========================
  const fetchTests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/test/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTests(res.data.tests || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "list") {
      fetchTests();
    }
  }, [activeTab]);

  // =========================
  // History – group by class, most recent first
  // =========================
  const buildClassGroups = () => {
    if (!tests.length) return [];

    const byClass = tests.reduce((acc, test) => {
      const cls = test.class_standard || test.class || "Unknown";
      if (!acc[cls]) acc[cls] = [];
      acc[cls].push(test);
      return acc;
    }, {});

    const groups = Object.entries(byClass).map(([cls, list]) => {
      const latestDate = Math.max(
        ...list.map((t) =>
          t.created_at ? new Date(t.created_at).getTime() : 0,
        ),
      );
      return { class_standard: cls, tests: list, latestDate };
    });

    // 🔥 Most recent class first
    groups.sort((a, b) => b.latestDate - a.latestDate);
    return groups;
  };

  const classGroups = buildClassGroups();
  const activeHistoryClass =
    selectedHistoryClass || classGroups[0]?.class_standard || null;

  const testsForActiveClass = activeHistoryClass
    ? tests.filter(
        (t) =>
          String(t.class_standard || t.class) === String(activeHistoryClass),
      )
    : [];

  // =========================
  // Render
  // =========================
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-8 h-8 text-emerald-600" />
          AI Test Generator
        </h1>
        <p className="text-gray-600">
          Create and manage tests with AI assistance
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("generate")}
            className={`${
              activeTab === "generate"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Plus size={18} />
            Generate Test
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            disabled={!generatedTest}
            className={`${
              activeTab === "preview"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Eye size={18} />
            Preview & Edit
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`${
              activeTab === "list"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <FileText size={18} />
            History
          </button>
        </nav>
      </div>

      {/* Generate tab */}
      {activeTab === "generate" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Generate New Test</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Class (from API) */}
            <div>
              <label className="block text-sm font-medium mb-2">Class *</label>
              <select
                value={selectedClassId}
                onChange={handleGenerateClassChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">
                  {classLoading ? "Loading classes..." : "Select Class"}
                </option>
                {classOptions.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name || `Class ${getClassStandard(cls)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Difficulty Level
              </label>
              <select
                value={testForm.difficulty_level}
                onChange={(e) =>
                  setTestForm((prev) => ({
                    ...prev,
                    difficulty_level: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                {difficultyLevels.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter – compulsory */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Chapter *
              </label>
              <input
                type="text"
                value={testForm.chapter}
                onChange={(e) =>
                  setTestForm((prev) => ({
                    ...prev,
                    chapter: e.target.value,
                  }))
                }
                placeholder="Enter chapter name"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* Topic (optional) */}
            <div>
              <label className="block text-sm font-medium mb-2">Topic</label>
              <input
                type="text"
                value={testForm.topic}
                onChange={(e) =>
                  setTestForm((prev) => ({
                    ...prev,
                    topic: e.target.value,
                  }))
                }
                placeholder="Optional"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Subject Config table */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Subject Configuration
            </label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Subject *
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Questions
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Maximum Marks
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subjectConfigs.map((config, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <select
                          value={config.subject}
                          onChange={(e) =>
                            handleSubjectConfigChange(
                              index,
                              "subject",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="">Select Subject</option>
                          {subjects.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={config.num_questions}
                          onChange={(e) =>
                            handleSubjectConfigChange(
                              index,
                              "num_questions",
                              parseInt(e.target.value || "0", 10),
                            )
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="10"
                          max="500"
                          value={config.max_marks}
                          onChange={(e) =>
                            handleSubjectConfigChange(
                              index,
                              "max_marks",
                              parseInt(e.target.value || "0", 10),
                            )
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveSubject(index)}
                          disabled={subjectConfigs.length === 1}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-3 text-right font-semibold"
                    >
                      Total Marks:
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600">
                      {calculateTotalMarks()}
                    </td>
                    <td className="px-4 py-3" />
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
            <label className="block text-sm font-medium mb-2">
              Learning Dimensions (Tags)
            </label>
            <div className="flex flex-wrap gap-2">
              {learningTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setTestForm((prev) => ({
                      ...prev,
                      tags: prev.tags.includes(tag)
                        ? prev.tags.filter((t) => t !== tag)
                        : [...prev.tags, tag],
                    }));
                  }}
                  className={`px-4 py-2 rounded-lg border ${
                    testForm.tags.includes(tag)
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-emerald-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerateTest}
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            {loading ? "Generating..." : "Generate Test with AI"}
          </button>
        </div>
      )}

      {/* Preview & Edit tab */}
      {activeTab === "preview" && generatedTest && (
        <div className="space-y-6">
          {/* Test header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{generatedTest.title}</h2>
                <p className="text-sm text-gray-600">
                  {generatedTest.total_questions} Questions · Status:{" "}
                  {generatedTest.status}
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

            {/* Scheduling */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-3">Schedule Test (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduled_start}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        scheduled_start: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduled_end}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        scheduled_end: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Questions (Click Edit to Modify)
            </h3>
            <div className="space-y-4">
              {generatedTest.questions.map((q, idx) => (
                <div key={q.id} className="border rounded-lg p-4">
                  {editingQuestion && editingQuestion.id === q.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">Q{idx + 1}.</span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {editingQuestion.learning_tag}
                        </span>
                      </div>

                      <textarea
                        value={editingQuestion.question_text}
                        onChange={(e) =>
                          setEditingQuestion((prev) => ({
                            ...prev,
                            question_text: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                      />

                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Marks:</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={editingQuestion.marks}
                          onChange={(e) =>
                            setEditingQuestion((prev) => ({
                              ...prev,
                              marks: parseInt(e.target.value || "0", 10),
                            }))
                          }
                          className="w-20 px-3 py-2 border rounded-lg"
                        />
                      </div>

                      {editingQuestion.question_type === "mcq" &&
                        editingQuestion.options &&
                        editingQuestion.options.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Options:
                            </label>
                            {editingQuestion.options.map((opt, optIdx) => (
                              <div
                                key={opt.id}
                                className="flex items-center gap-2"
                              >
                                <span className="font-medium">{opt.id}.</span>
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => {
                                    const updated = [
                                      ...editingQuestion.options,
                                    ];
                                    updated[optIdx].text = e.target.value;
                                    setEditingQuestion((prev) => ({
                                      ...prev,
                                      options: updated,
                                    }));
                                  }}
                                  className="flex-1 px-3 py-2 border rounded-lg"
                                />
                                <input
                                  type="radio"
                                  name="correct_answer"
                                  checked={
                                    editingQuestion.correct_answer === opt.id
                                  }
                                  onChange={() =>
                                    setEditingQuestion((prev) => ({
                                      ...prev,
                                      correct_answer: opt.id,
                                    }))
                                  }
                                />
                                <span className="text-sm text-gray-600">
                                  Correct
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                      {editingQuestion.question_type !== "mcq" && (
                        <div>
                          <label className="text-sm font-medium">
                            Correct Answer:
                          </label>
                          <input
                            type="text"
                            value={editingQuestion.correct_answer}
                            onChange={(e) =>
                              setEditingQuestion((prev) => ({
                                ...prev,
                                correct_answer: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border rounded-lg mt-1"
                          />
                        </div>
                      )}

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
                    // View mode
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

                        {q.question_type === "mcq" &&
                          q.options &&
                          q.options.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {q.options.map((opt) => (
                                <div
                                  key={opt.id}
                                  className={`text-sm px-3 py-2 rounded ${
                                    opt.id === q.correct_answer
                                      ? "bg-emerald-50 border border-emerald-300 font-medium"
                                      : "bg-gray-50"
                                  }`}
                                >
                                  {opt.id}. {opt.text}
                                  {opt.id === q.correct_answer && (
                                    <span className="ml-2 text-emerald-600">
                                      ✓ Correct
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                        {q.question_type !== "mcq" && (
                          <div className="mt-2 text-sm bg-emerald-50 border border-emerald-200 rounded p-2">
                            <span className="font-medium text-emerald-700">
                              Answer:
                            </span>{" "}
                            {q.correct_answer}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleEditQuestion(q)}
                        className="ml-4 p-2 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Publish button */}
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={handlePublishTest}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <Send size={20} />
              {loading ? "Publishing..." : "Publish Test to Students"}
            </button>
          </div>
        </div>
      )}

      {/* History tab */}
      {activeTab === "list" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Test History</h2>

          {tests.length > 0 ? (
            <>
              {/* Class cards – most recent first */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {buildClassGroups().map((group) => (
                  <button
                    key={group.class_standard}
                    onClick={() =>
                      setSelectedHistoryClass(group.class_standard)
                    }
                    className={`border rounded-xl p-4 text-center shadow-sm hover:shadow-md transition ${
                      String(activeHistoryClass) ===
                      String(group.class_standard)
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      class-{group.class_standard}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      Class {group.class_standard}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {group.tests.length}{" "}
                      {group.tests.length === 1 ? "book" : "books"}
                    </div>
                  </button>
                ))}
              </div>

              {/* Tests for active class */}
              {activeHistoryClass && (
                <>
                  <h3 className="text-md font-semibold mb-3">
                    Tests for Class {activeHistoryClass}
                  </h3>
                  <div className="space-y-3">
                    {testsForActiveClass.map((test) => (
                      <div
                        key={test.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{test.title}</h4>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Subject:</span>{" "}
                                {test.subject}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  Total Questions:
                                </span>{" "}
                                {test.total_questions}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Marks:</span>{" "}
                                {test.max_marks || test.total_marks || "N/A"}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Difficulty:</span>{" "}
                                {test.difficulty_level}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  test.status === "published"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : test.status === "draft"
                                      ? "bg-gray-100 text-gray-700"
                                      : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {test.status?.toUpperCase()}
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
                            <p>
                              <span className="font-medium">Created by:</span>{" "}
                              {test.created_by_name}
                            </p>
                            <p>
                              <span className="font-medium">Date:</span>{" "}
                              {test.created_at
                                ? new Date(test.created_at).toLocaleDateString()
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
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
