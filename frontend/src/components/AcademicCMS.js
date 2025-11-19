import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Book,
  Plus,
  Edit,
  Trash2,
  FileText,
  Upload,
  Download,
  BookOpen,
  X,
  File,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// Helper function to format API validation errors
const formatErrorMessage = (error, fallbackMsg) => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail.map((err) => {
      const field = err.loc ? err.loc.join(".") : "field";
      return `${field}: ${err.msg}`;
    });
    return messages.join(", ");
  }

  if (detail && typeof detail === "object" && detail.msg) {
    return detail.msg;
  }

  return fallbackMsg;
};

// --- Initial States ---

const initialChapter = {
  chapter_number: 1,
  title: "Chapter 1",
  file_url: "", // ADDED: Field for file URL
  file_name: "", // ADDED: Field for file Name
  id: null, // ADDED: To track if chapter exists in DB
};

const initialBookForm = {
  title: "",
  author: "",
  subject: "",
  class_standard: "",
  board: "CBSE",
  prelims_file_url: "",
  prelims_file_name: "",
  chapters: [initialChapter],
  bulk_upload_file: null,
};

const initialQAForm = {
  question: "",
  answer: "",
  subject: "",
  class_standard: "",
  chapter: "",
  question_type: "conceptual",
  difficulty_level: "medium",
  keywords: "",
};

const initialPaperForm = {
  title: "",
  subject: "",
  class_standard: "",
  chapter: "",
  exam_year: new Date().getFullYear().toString(),
  paper_type: "Final Exam",
  file_url: "",
};

const AcademicCMS = () => {
  const [activeTab, setActiveTab] = useState("books");

  const [books, setBooks] = useState([]);
  const [referenceBooks, setReferenceBooks] = useState([]);
  const [qaPairs, setQaPairs] = useState([]);
  const [previousPapers, setPreviousPapers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddReferenceBook, setShowAddReferenceBook] = useState(false);
  const [showAddQA, setShowAddQA] = useState(false);
  const [showAddPaper, setShowAddPaper] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [uploadSummary, setUploadSummary] = useState(null);

  const [editingBookId, setEditingBookId] = useState(null);
  const [editingReferenceBookId, setEditingReferenceBookId] = useState(null);
  const [editingQAId, setEditingQAId] = useState(null);
  const [editingPaperId, setEditingPaperId] = useState(null);

  const [bookForm, setBookForm] = useState(initialBookForm);
  const [referenceBookForm, setReferenceBookForm] = useState(initialBookForm);
  const [qaForm, setQaForm] = useState(initialQAForm);
  const [paperForm, setPaperForm] = useState(initialPaperForm);

  // Academic Books navigation (class -> subject -> books)
  const [bookNavLevel, setBookNavLevel] = useState({
    step: "class",
    class: "",
    subject: "",
  });

  // Reference Books navigation (class -> subject -> books)
  const [refNavLevel, setRefNavLevel] = useState({
    step: "class",
    class: "",
    subject: "",
  });

  // Chapter modal (for both academic & reference books)
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterModalData, setChapterModalData] = useState({
    bookTitle: "",
    chapters: [],
  });
  const [chapterLoading, setChapterLoading] = useState(false);

  // --- Helper Functions ---

  const handleFileUpload = useCallback(async (file, onSuccess) => {
    if (!file) return null;

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 100MB");
      return null;
    }

    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, TXT, and DOCX/DOC files are allowed");
      return null;
    }

    setUploadingFile(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const url = res.data.file_url;
      toast.success("File uploaded successfully");
      if (onSuccess) onSuccess(url, file.name);
      return url;
    } catch (err) {
      toast.error(formatErrorMessage(err, "File upload failed"));
      console.error(err);
      return null;
    } finally {
      setUploadingFile(false);
    }
  }, []);

  const handleFormChange = (formType, field, value) => {
    if (formType === "book") {
      setBookForm((prev) => ({ ...prev, [field]: value }));
    } else if (formType === "reference") {
      setReferenceBookForm((prev) => ({ ...prev, [field]: value }));
    } else if (formType === "qa") {
      setQaForm((prev) => ({ ...prev, [field]: value }));
    } else if (formType === "paper") {
      setPaperForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleChapterChange = (
    formType,
    index,
    field,
    value,
    fileName = null,
  ) => {
    const setForm = formType === "book" ? setBookForm : setReferenceBookForm;

    setForm((prev) => {
      const chapters = [...prev.chapters];
      if (!chapters[index]) return prev;

      chapters[index] = {
        ...chapters[index],
        [field]: value,
        ...(fileName && { file_name: fileName }),
        ...(field === "file_url" && !value && { file_name: "" }),
      };

      if (
        field === "file_url" &&
        value &&
        !chapters[index].title.trim() &&
        fileName
      ) {
        chapters[index].title = fileName.split(".").slice(0, -1).join(".");
      }

      return { ...prev, chapters };
    });
  };

  const addChapterField = (formType) => {
    const setForm = formType === "book" ? setBookForm : setReferenceBookForm;

    setForm((prev) => {
      const newIndex = prev.chapters.length;
      if (newIndex >= 20) {
        toast.warning("Maximum of 20 chapters allowed");
        return prev;
      }
      return {
        ...prev,
        chapters: [
          ...prev.chapters,
          {
            chapter_number: newIndex + 1,
            title: `Chapter ${newIndex + 1}`,
            file_url: "",
            file_name: "",
          },
        ],
      };
    });
  };

  const removeChapterField = (formType, index) => {
    const setForm = formType === "book" ? setBookForm : setReferenceBookForm;

    setForm((prev) => {
      const filtered = prev.chapters.filter((_, i) => i !== index);
      const renumbered = filtered.map((c, i) => ({
        ...c,
        chapter_number: i + 1,
        title: c.title.startsWith("Chapter ") ? `Chapter ${i + 1}` : c.title,
      }));
      return { ...prev, chapters: renumbered };
    });
  };

  const resetForm = (formType) => {
    if (formType === "book") {
      setBookForm(initialBookForm);
      setEditingBookId(null);
    } else if (formType === "reference") {
      setReferenceBookForm(initialBookForm);
      setEditingReferenceBookId(null);
    } else if (formType === "qa") {
      setQaForm(initialQAForm);
      setEditingQAId(null);
    } else if (formType === "paper") {
      setPaperForm(initialPaperForm);
      setEditingPaperId(null);
    }
  };

  // --- Fetch chapters from backend ---

  const fetchBookChapters = useCallback(async (bookId, bookType) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE_URL}/cms/books/${bookId}/chapters`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { book_type: bookType },
        },
      );
      return res.data || [];
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to load chapters"));
      console.error("Error fetching book chapters:", err);
      return [];
    }
  }, []);

  const openChapterModal = async (book, bookType) => {
    setShowChapterModal(true);
    setChapterLoading(true);
    setChapterModalData({
      bookTitle: book.title || "",
      chapters: [],
    });

    const chapters = await fetchBookChapters(book.id, bookType);

    setChapterModalData({
      bookTitle: book.title || "",
      chapters,
    });
    setChapterLoading(false);
  };

  // --- Fetch Functions ---

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/cms/academic-books`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBooks(res.data || []);
    } catch (err) {
      toast.error("Failed to load academic books");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReferenceBooks = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/cms/reference-books`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReferenceBooks(res.data || []);
    } catch (err) {
      toast.error("Failed to load reference books");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchQAPairs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/cms/qa-knowledge-base`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQaPairs(res.data || []);
    } catch (err) {
      toast.error("Failed to load Q&A pairs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreviousPapers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/cms/previous-year-papers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPreviousPapers(res.data || []);
    } catch (err) {
      toast.error("Failed to load previous year papers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
    fetchReferenceBooks();
    fetchQAPairs();
    fetchPreviousPapers();
  }, [fetchBooks, fetchReferenceBooks, fetchQAPairs, fetchPreviousPapers]);

  // --- CRUD: Academic Books ---

  const handleAddBook = async (e) => {
    e.preventDefault();
    const isEditing = editingBookId !== null;

    try {
      const token = localStorage.getItem("token");
      const endpoint = `${API_BASE_URL}/cms/academic-books`;

      const payload = {
        ...bookForm,
        chapters: bookForm.chapters.filter(
          (c) => c.title.trim() && c.file_url.trim(),
        ),
        pdf_url: bookForm.prelims_file_url,
        cover_image_url: bookForm.prelims_file_url,
      };

      if (isEditing) {
        await axios.put(`${endpoint}/${editingBookId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Academic book updated successfully");
      } else {
        await axios.post(endpoint, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Academic book added successfully");
      }

      setShowAddBook(false);
      resetForm("book");
      fetchBooks();
    } catch (err) {
      const msg = isEditing
        ? "Failed to update academic book"
        : "Failed to add academic book";
      toast.error(formatErrorMessage(err, msg));
      console.error(err);
    }
  };

  const handleEditBook = async (book) => {
    // ADDED async
    // Fetch Chapters for this book
    const existingChapters = await fetchBookChapters(book.id, "academic"); // ADDED: API Call

    setEditingBookId(book.id);
    setBookForm({
      title: book.title || "",
      author: book.author || "",
      subject: book.subject || "",
      class_standard: book.class_standard || "",
      board: book.board || "CBSE",
      prelims_file_url: book.prelims_file_url || book.pdf_url || "",
      prelims_file_name: book.prelims_file_name || "",
      chapters: (existingChapters.length > 0
        ? existingChapters
        : [initialChapter]
      ).map((c, i) => ({
        id: c.id, // Keep existing chapter ID for updates
        chapter_number: c.chapter_number || i + 1,
        title:
          c.chapter_title || c.title || `Chapter ${c.chapter_number || i + 1}`, // Mapped from backend field
        file_url: c.file_url || "",
        file_name: c.file_name || "",
      })),
      bulk_upload_file: null,
    });
    setShowAddBook(true);
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm("Delete this academic book?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/cms/academic-books/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Academic book deleted");
      fetchBooks();
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to delete academic book"));
      console.error(err);
    }
  };

  // --- CRUD: Reference Books ---

  const handleAddReferenceBook = async (e) => {
    e.preventDefault();
    const isEditing = editingReferenceBookId !== null;

    try {
      const token = localStorage.getItem("token");
      const endpoint = `${API_BASE_URL}/cms/reference-books`;

      const payload = {
        ...referenceBookForm,
        chapters: referenceBookForm.chapters.filter(
          (c) => c.title.trim() && c.file_url.trim(),
        ),
        pdf_url: referenceBookForm.prelims_file_url,
      };

      if (isEditing) {
        await axios.put(`${endpoint}/${editingReferenceBookId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Reference book updated successfully");
      } else {
        await axios.post(endpoint, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Reference book added successfully");
      }

      setShowAddReferenceBook(false);
      resetForm("reference");
      fetchReferenceBooks();
    } catch (err) {
      const msg = isEditing
        ? "Failed to update reference book"
        : "Failed to add reference book";
      toast.error(formatErrorMessage(err, msg));
      console.error(err);
    }
  };

  const handleEditReferenceBook = async (book) => {
    // ADDED async
    // Fetch Chapters for this book
    const existingChapters = await fetchBookChapters(book.id, "reference"); // ADDED: API Call

    setEditingReferenceBookId(book.id);
    setReferenceBookForm({
      title: book.title || "",
      author: book.author || "",
      subject: book.subject || "",
      class_standard: book.class_standard || "",
      board: book.board || "CBSE",
      prelims_file_url: book.prelims_file_url || book.pdf_url || "",
      prelims_file_name: book.prelims_file_name || "",
      chapters: (existingChapters.length > 0
        ? existingChapters
        : [initialChapter]
      ).map((c, i) => ({
        id: c.id, // Keep existing chapter ID for updates
        chapter_number: c.chapter_number || i + 1,
        title:
          c.chapter_title || c.title || `Chapter ${c.chapter_number || i + 1}`, // Mapped from backend field
        file_url: c.file_url || "",
        file_name: c.file_name || "",
      })),
      bulk_upload_file: null,
    });
    setShowAddReferenceBook(true);
  };

  const handleDeleteReferenceBook = async (id) => {
    if (!window.confirm("Delete this reference book?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/cms/reference-books/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Reference book deleted");
      fetchReferenceBooks();
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to delete reference book"));
      console.error(err);
    }
  };

  // --- CRUD: Q&A ---

  const handleAddQA = async (e) => {
    e.preventDefault();
    const isEditing = editingQAId !== null;

    try {
      const token = localStorage.getItem("token");
      const endpoint = `${API_BASE_URL}/cms/qa-knowledge-base`;

      const qaData = {
        ...qaForm,
        keywords: qaForm.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        chapter_topic: qaForm.chapter || "",
      };

      if (isEditing) {
        await axios.put(`${endpoint}/${editingQAId}`, qaData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Q&A pair updated");
      } else {
        await axios.post(endpoint, qaData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Q&A pair added");
      }

      setShowAddQA(false);
      resetForm("qa");
      fetchQAPairs();
    } catch (err) {
      const msg = isEditing
        ? "Failed to update Q&A pair"
        : "Failed to add Q&A pair";
      toast.error(formatErrorMessage(err, msg));
      console.error(err);
    }
  };

  const handleEditQA = (qa) => {
    setEditingQAId(qa.id);
    setQaForm({
      question: qa.question || "",
      answer: qa.answer || "",
      subject: qa.subject || "",
      class_standard: qa.class_standard || "",
      chapter: qa.chapter_topic || "",
      question_type: qa.question_type || "conceptual",
      difficulty_level: qa.difficulty_level || "medium",
      keywords: Array.isArray(qa.keywords)
        ? qa.keywords.join(", ")
        : qa.keywords || "",
    });
    setShowAddQA(true);
  };

  const handleDeleteQA = async (id) => {
    if (!window.confirm("Delete this Q&A pair?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/cms/qa-knowledge-base/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Q&A pair deleted");
      fetchQAPairs();
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to delete Q&A pair"));
      console.error(err);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkUploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", bulkUploadFile);

      const res = await axios.post(
        `${API_BASE_URL}/cms/qa-knowledge-base/bulk-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setUploadSummary(res.data.summary);
      toast.success(
        `${res.data.summary.successful} Q&A pairs uploaded successfully`,
      );
      setBulkUploadFile(null);
      fetchQAPairs();
    } catch (err) {
      toast.error(formatErrorMessage(err, "Bulk upload failed"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        question: "What is Newton's Second Law?",
        answer: "Force = mass × acceleration (F = m × a)",
        subject: "Physics",
        class: "9",
        chapter_topic: "Laws of Motion",
        keywords: "newton, force, motion",
        difficulty: "medium",
        type: "conceptual",
      },
      {
        question: "Solve: 2x + 5 = 15",
        answer: "x = 5",
        subject: "Math",
        class: "9",
        chapter_topic: "Linear Equations",
        keywords: "algebra, equations",
        difficulty: "easy",
        type: "numerical",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Q&A Template");
    XLSX.writeFile(wb, "sample_qa_template.xlsx");
    toast.success("Sample template downloaded");
  };

  // --- CRUD: Papers ---

  const handleAddPaper = async (e) => {
    e.preventDefault();
    const isEditing = editingPaperId !== null;

    try {
      const token = localStorage.getItem("token");
      const endpoint = `${API_BASE_URL}/cms/previous-year-papers`;

      if (isEditing) {
        await axios.put(`${endpoint}/${editingPaperId}`, paperForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Previous year paper updated");
      } else {
        await axios.post(endpoint, paperForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Previous year paper added");
      }

      setShowAddPaper(false);
      resetForm("paper");
      fetchPreviousPapers();
    } catch (err) {
      const msg = isEditing ? "Failed to update paper" : "Failed to add paper";
      toast.error(formatErrorMessage(err, msg));
      console.error(err);
    }
  };

  const handleEditPaper = (paper) => {
    setEditingPaperId(paper.id);
    setPaperForm({
      title: paper.title || "",
      subject: paper.subject || "",
      class_standard: paper.class_standard || "",
      chapter: paper.chapter || "",
      exam_year: paper.exam_year || new Date().getFullYear().toString(),
      paper_type: paper.paper_type || "Final Exam",
      file_url: paper.pdf_url || paper.file_url || "",
    });
    setShowAddPaper(true);
  };

  const handleDeletePaper = async (id) => {
    if (!window.confirm("Delete this paper?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/cms/previous-year-papers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Previous year paper deleted");
      fetchPreviousPapers();
    } catch (err) {
      toast.error(formatErrorMessage(err, "Failed to delete paper"));
      console.error(err);
    }
  };

  // --- Shared Book Modal (Academic + Reference) ---

  const renderBookModal = (
    isReference,
    showModal,
    setShowModal,
    formState,
    setFormState,
    handleAddFunction,
    editingId,
    resetFormFn,
  ) => {
    if (!showModal) return null;

    const formType = isReference ? "reference" : "book";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {editingId
                ? `Edit ${isReference ? "Reference" : "Academic"} Book`
                : `Add New ${isReference ? "Reference" : "Academic"} Book`}
            </h3>
            <button
              onClick={() => {
                setShowModal(false);
                resetFormFn(formType);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleAddFunction} className="space-y-4">
            {/* Title / Author */}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="BOOK TITLE *"
                value={formState.title}
                onChange={(e) =>
                  handleFormChange(formType, "title", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="AUTHOR *"
                value={formState.author}
                onChange={(e) =>
                  handleFormChange(formType, "author", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            {/* Class / Subject */}
            <div className="grid grid-cols-2 gap-4">
              <select
                value={formState.class_standard}
                onChange={(e) =>
                  handleFormChange(formType, "class_standard", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">SELECT CLASS (5-12) *</option>
                {[5, 6, 7, 8, 9, 10, 11, 12].map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
              <select
                value={formState.subject}
                onChange={(e) =>
                  handleFormChange(formType, "subject", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">SELECT SUBJECTS *</option>
                {["Physics", "Chemistry", "Biology", "Math", "English"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Prelims Upload */}
            <div className="border p-4 rounded-lg bg-gray-50">
              <label className="block text-xs font-medium mb-2 text-gray-600 flex justify-between items-center">
                <span>
                  PRELIMS / Full Book File (PDF, TXT, DOCX - Max 100MB)
                </span>
                {formState.prelims_file_url && (
                  <button
                    type="button"
                    onClick={() =>
                      handleFormChange(formType, "prelims_file_url", "")
                    }
                    className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear File
                  </button>
                )}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".pdf,.txt,.docx,.doc"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      await handleFileUpload(file, (url, fileName) => {
                        handleFormChange(formType, "prelims_file_url", url);
                        handleFormChange(
                          formType,
                          "prelims_file_name",
                          fileName,
                        );
                      });
                    }
                  }}
                  className="flex-1 text-sm border p-1 rounded"
                  disabled={uploadingFile || formState.prelims_file_url}
                />
                <div className="text-xs w-1/3">
                  {uploadingFile ? (
                    <span className="text-blue-600">Uploading...</span>
                  ) : formState.prelims_file_name ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <File className="w-3 h-3" /> {formState.prelims_file_name}
                    </span>
                  ) : (
                    <span className="text-gray-500">No file chosen</span>
                  )}
                </div>
              </div>
            </div>

            {/* Chapters */}
            <div className="space-y-3 p-4 border rounded-lg bg-white shadow-inner">
              <h4 className="text-base font-semibold text-gray-800 border-b pb-2 mb-3">
                Chapters (1-{formState.chapters.length})
              </h4>
              {formState.chapters.map((chapter, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 border p-3 rounded-lg bg-gray-50"
                >
                  <span className="font-bold text-gray-700 min-w-[85px] text-sm">
                    CHAPTER {index + 1}:
                  </span>
                  <input
                    type="text"
                    placeholder="Chapter Title"
                    value={chapter.title}
                    onChange={(e) =>
                      handleChapterChange(
                        formType,
                        index,
                        "title",
                        e.target.value,
                      )
                    }
                    className="w-1/3 px-2 py-1 border rounded-lg text-sm"
                    required
                  />

                  <div className="flex items-center w-1/3 text-xs">
                    <input
                      type="file"
                      accept=".pdf,.txt,.docx,.doc"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          await handleFileUpload(file, (url, fileName) => {
                            handleChapterChange(
                              formType,
                              index,
                              "file_url",
                              url,
                              fileName,
                            );
                          });
                        }
                      }}
                      className="text-sm flex-1"
                      disabled={uploadingFile || chapter.file_url}
                    />
                  </div>

                  <div className="w-1/3 text-xs flex items-center justify-end gap-2">
                    {uploadingFile && (
                      <span className="text-blue-600">Uploading...</span>
                    )}
                    {chapter.file_name && (
                      <span className="text-green-600 flex items-center gap-1">
                        <File className="w-3 h-3" /> File
                      </span>
                    )}
                    {chapter.file_url && (
                      <button
                        type="button"
                        onClick={() =>
                          handleChapterChange(formType, index, "file_url", "")
                        }
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Clear Chapter File"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {formState.chapters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChapterField(formType, index)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-full"
                        title="Remove Chapter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {formState.chapters.length < 20 && (
                <button
                  type="button"
                  onClick={() => addChapterField(formType)}
                  className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 mt-2 font-bold text-sm"
                >
                  <Plus className="w-4 h-4" />
                  CHAPTER ADD
                </button>
              )}
            </div>

            {/* Bulk Upload Placeholder */}
            <div className="border p-4 rounded-lg bg-gray-50">
              <label className="block text-xs font-medium mb-2 text-gray-600 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                BULK UPLOAD (All Chapters in One File - Max 100MB)
              </label>
              <input
                type="file"
                accept=".pdf,.txt,.docx,.doc"
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    bulk_upload_file: e.target.files[0],
                  })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
                disabled={uploadingFile}
              />
              {formState.bulk_upload_file && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {formState.bulk_upload_file.name}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400"
                disabled={uploadingFile}
              >
                {editingId ? "Update Book" : "Add Book"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetFormFn(formType);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- Render ---

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Academic Content CMS
        </h1>
        <p className="text-gray-600">
          Manage academic books, reference books, Q&A and previous papers
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("books")}
            className={`${
              activeTab === "books"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Book className="w-4 h-4" />
            Academic Books
          </button>
          <button
            onClick={() => setActiveTab("reference")}
            className={`${
              activeTab === "reference"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Book className="w-4 h-4" />
            Reference Books
          </button>
          <button
            onClick={() => setActiveTab("papers")}
            className={`${
              activeTab === "papers"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <FileText className="w-4 h-4" />
            Previous Years' Papers
          </button>
          <button
            onClick={() => setActiveTab("qa")}
            className={`${
              activeTab === "qa"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <FileText className="w-4 h-4" />
            Q&A Knowledge Base
          </button>
        </nav>
      </div>

      {/* Academic Books Tab: class -> subject -> books */}
      {activeTab === "books" && (
        <div>
          {/* Breadcrumb */}
          {bookNavLevel.step !== "class" && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <button
                onClick={() =>
                  setBookNavLevel({ step: "class", class: "", subject: "" })
                }
                className="hover:text-emerald-600"
              >
                Classes
              </button>
              {bookNavLevel.class && (
                <>
                  <span>›</span>
                  <span className="font-medium">
                    Class {bookNavLevel.class}
                  </span>
                </>
              )}
              {bookNavLevel.step === "subject" && (
                <>
                  <span>›</span>
                  <span>Select Subject</span>
                </>
              )}
              {bookNavLevel.step === "books" && bookNavLevel.subject && (
                <>
                  <span>›</span>
                  <span>{bookNavLevel.subject}</span>
                </>
              )}
            </div>
          )}

          {/* Step 1: Classes */}
          {bookNavLevel.step === "class" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Select Class (5-12)</h2>
                <button
                  onClick={() => {
                    resetForm("book");
                    setShowAddBook(true);
                  }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Book
                </button>
              </div>
              {books.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    No academic books added yet
                  </p>
                  <button
                    onClick={() => setShowAddBook(true)}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
                  >
                    Add Your First Book
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[...new Set(books.map((b) => b.class_standard))]
                    .filter(Boolean)
                    .sort((a, b) => Number(a) - Number(b))
                    .map((classNum) => (
                      <button
                        key={classNum}
                        onClick={() =>
                          setBookNavLevel({
                            step: "subject",
                            class: classNum,
                            subject: "",
                          })
                        }
                        className="border-2 border-gray-300 rounded-lg p-6 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center"
                      >
                        <div className="text-3xl font-bold text-gray-900">
                          Class {classNum}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          {
                            books.filter((b) => b.class_standard === classNum)
                              .length
                          }{" "}
                          books
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2 & 3: Subject / Books */}
          {(bookNavLevel.step === "subject" ||
            bookNavLevel.step === "books") && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {bookNavLevel.step === "subject"
                    ? `Select Subject (Class ${bookNavLevel.class})`
                    : `Academic Books (Class ${bookNavLevel.class} - ${bookNavLevel.subject})`}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setBookNavLevel({
                        step: "class",
                        class: "",
                        subject: "",
                      })
                    }
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ← Back to Classes
                  </button>
                  {bookNavLevel.step === "books" && (
                    <button
                      onClick={() => {
                        resetForm("book");
                        setBookForm((prev) => ({
                          ...prev,
                          subject: bookNavLevel.subject,
                          class_standard: bookNavLevel.class,
                        }));
                        setShowAddBook(true);
                      }}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Book
                    </button>
                  )}
                </div>
              </div>

              {bookNavLevel.step === "subject" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    ...new Set(
                      books
                        .filter((b) => b.class_standard === bookNavLevel.class)
                        .map((b) => b.subject),
                    ),
                  ]
                    .filter(Boolean)
                    .sort()
                    .map((subject) => (
                      <button
                        key={subject}
                        onClick={() =>
                          setBookNavLevel({
                            step: "books",
                            class: bookNavLevel.class,
                            subject,
                          })
                        }
                        className="border-2 border-gray-300 rounded-lg p-4 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                      >
                        <div className="text-xl font-semibold text-gray-900">
                          {subject}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {
                            books.filter(
                              (b) =>
                                b.class_standard === bookNavLevel.class &&
                                b.subject === subject,
                            ).length
                          }{" "}
                          books
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {bookNavLevel.step === "books" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {books
                    .filter(
                      (b) =>
                        b.class_standard === bookNavLevel.class &&
                        b.subject === bookNavLevel.subject,
                    )
                    .map((book) => {
                      const hasPrelims = book.prelims_file_url || book.pdf_url;
                      const chapterCount =
                        book.chapter_count ||
                        (book.chapters ? book.chapters.length : 0);

                      return (
                        <div
                          key={book.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900 flex-1">
                              {book.title}
                            </h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditBook(book)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Edit Book"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBook(book.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete Book"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            by {book.author}
                          </p>
                          <div className="mt-2 flex gap-2 flex-wrap">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {book.subject}
                            </span>
                            <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                              Class {book.class_standard}
                            </span>
                            {chapterCount > 0 && (
                              <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded">
                                {chapterCount} Chapters
                              </span>
                            )}
                          </div>

                          {/* View buttons */}
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {hasPrelims && (
                              <a
                                href={book.prelims_file_url || book.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded hover:bg-yellow-200"
                              >
                                <FileText className="w-3 h-3" />
                                View Book
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => openChapterModal(book, "academic")}
                              className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded hover:bg-emerald-200"
                            >
                              <BookOpen className="w-3 h-3" />
                              View Chapters
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {renderBookModal(
            false,
            showAddBook,
            setShowAddBook,
            bookForm,
            setBookForm,
            handleAddBook,
            editingBookId,
            resetForm,
          )}
        </div>
      )}

      {/* Reference Books Tab: class -> subject -> books */}
      {activeTab === "reference" && (
        <div>
          {/* Breadcrumb */}
          {refNavLevel.step !== "class" && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <button
                onClick={() =>
                  setRefNavLevel({ step: "class", class: "", subject: "" })
                }
                className="hover:text-emerald-600"
              >
                Classes
              </button>
              {refNavLevel.class && (
                <>
                  <span>›</span>
                  <span className="font-medium">Class {refNavLevel.class}</span>
                </>
              )}
              {refNavLevel.step === "subject" && (
                <>
                  <span>›</span>
                  <span>Select Subject</span>
                </>
              )}
            </div>
          )}

          {/* Step 1: Classes */}
          {refNavLevel.step === "class" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Select Class (5-12)</h2>
                <button
                  onClick={() => {
                    resetForm("reference");
                    setShowAddReferenceBook(true);
                  }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Book
                </button>
              </div>
              {referenceBooks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    No reference books added yet
                  </p>
                  <button
                    onClick={() => setShowAddReferenceBook(true)}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
                  >
                    Add Your First Book
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[...new Set(referenceBooks.map((b) => b.class_standard))]
                    .filter(Boolean)
                    .sort((a, b) => Number(a) - Number(b))
                    .map((classNum) => (
                      <button
                        key={classNum}
                        onClick={() =>
                          setRefNavLevel({
                            step: "subject",
                            class: classNum,
                            subject: "",
                          })
                        }
                        className="border-2 border-gray-300 rounded-lg p-6 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center"
                      >
                        <div className="text-3xl font-bold text-gray-900">
                          Class {classNum}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          {
                            referenceBooks.filter(
                              (b) => b.class_standard === classNum,
                            ).length
                          }{" "}
                          books
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2 & 3: Subject / Books */}
          {(refNavLevel.step === "subject" || refNavLevel.step === "books") && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {refNavLevel.step === "subject"
                    ? `Select Subject (Class ${refNavLevel.class})`
                    : `Reference Books (Class ${refNavLevel.class} - ${refNavLevel.subject})`}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setRefNavLevel({
                        step: "class",
                        class: "",
                        subject: "",
                      })
                    }
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ← Back to Classes
                  </button>
                  {refNavLevel.step === "books" && (
                    <button
                      onClick={() => {
                        resetForm("reference");
                        setReferenceBookForm((prev) => ({
                          ...prev,
                          subject: refNavLevel.subject,
                          class_standard: refNavLevel.class,
                        }));
                        setShowAddReferenceBook(true);
                      }}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Book
                    </button>
                  )}
                </div>
              </div>

              {refNavLevel.step === "subject" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    ...new Set(
                      referenceBooks
                        .filter((b) => b.class_standard === refNavLevel.class)
                        .map((b) => b.subject),
                    ),
                  ]
                    .filter(Boolean)
                    .sort()
                    .map((subject) => (
                      <button
                        key={subject}
                        onClick={() =>
                          setRefNavLevel({
                            step: "books",
                            class: refNavLevel.class,
                            subject,
                          })
                        }
                        className="border-2 border-gray-300 rounded-lg p-4 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                      >
                        <div className="text-xl font-semibold text-gray-900">
                          {subject}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {
                            referenceBooks.filter(
                              (b) =>
                                b.class_standard === refNavLevel.class &&
                                b.subject === subject,
                            ).length
                          }{" "}
                          books
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {refNavLevel.step === "books" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {referenceBooks
                    .filter(
                      (b) =>
                        b.class_standard === refNavLevel.class &&
                        b.subject === refNavLevel.subject,
                    )
                    .map((book) => {
                      const hasPrelims = book.prelims_file_url || book.pdf_url;
                      const chapterCount =
                        book.chapter_count ||
                        (book.chapters ? book.chapters.length : 0);

                      return (
                        <div
                          key={book.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900 flex-1">
                              {book.title}
                            </h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditReferenceBook(book)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Edit Book"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteReferenceBook(book.id)
                                }
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete Book"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            by {book.author}
                          </p>
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {chapterCount > 0 && (
                              <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded">
                                {chapterCount} Chapters
                              </span>
                            )}
                          </div>

                          {/* View buttons */}
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {hasPrelims && (
                              <a
                                href={book.prelims_file_url || book.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded hover:bg-orange-200"
                              >
                                <FileText className="w-3 h-3" />
                                View Book
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                openChapterModal(book, "reference")
                              }
                              className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded hover:bg-emerald-200"
                            >
                              <BookOpen className="w-3 h-3" />
                              View Chapters
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {renderBookModal(
            true,
            showAddReferenceBook,
            setShowAddReferenceBook,
            referenceBookForm,
            setReferenceBookForm,
            handleAddReferenceBook,
            editingReferenceBookId,
            resetForm,
          )}
        </div>
      )}

      {/* Previous Years' Papers Tab */}
      {activeTab === "papers" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Previous Years' Papers ({previousPapers.length}) (5-12)
            </h2>
            <button
              onClick={() => {
                resetForm("paper");
                setShowAddPaper(true);
              }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Paper
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {previousPapers.map((paper) => (
              <div
                key={paper.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 flex-1">
                    {paper.title}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPaper(paper)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit Paper"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePaper(paper.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete Paper"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="inline-block bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">
                    Class {paper.class_standard}
                  </span>
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                    {paper.subject}
                  </span>
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    {paper.exam_year}
                  </span>
                  {paper.file_url && (
                    <a
                      href={paper.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded hover:bg-orange-200"
                    >
                      <FileText className="w-3 h-3" />
                      View File
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {showAddPaper && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">
                  {editingPaperId
                    ? "Edit Previous Year Paper"
                    : "Add New Previous Year Paper"}
                </h3>
                <form onSubmit={handleAddPaper} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Paper Title *"
                    value={paperForm.title}
                    onChange={(e) =>
                      setPaperForm({ ...paperForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={paperForm.subject}
                      onChange={(e) =>
                        setPaperForm({
                          ...paperForm,
                          subject: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Select Subject *</option>
                      {[
                        "Physics",
                        "Chemistry",
                        "Biology",
                        "Math",
                        "English",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <select
                      value={paperForm.class_standard}
                      onChange={(e) =>
                        setPaperForm({
                          ...paperForm,
                          class_standard: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Select Class *</option>
                      {[5, 6, 7, 8, 9, 10, 11, 12].map((c) => (
                        <option key={c} value={c}>
                          Class {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Exam Year *"
                      value={paperForm.exam_year}
                      onChange={(e) =>
                        setPaperForm({
                          ...paperForm,
                          exam_year: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      min="2000"
                      max={new Date().getFullYear()}
                      required
                    />
                    <select
                      value={paperForm.paper_type}
                      onChange={(e) =>
                        setPaperForm({
                          ...paperForm,
                          paper_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option value="Final Exam">Final Exam</option>
                      <option value="Mid-Term">Mid-Term</option>
                      <option value="Practice Paper">Practice Paper</option>
                      <option value="Sample Paper">Sample Paper</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Chapter (optional)"
                    value={paperForm.chapter}
                    onChange={(e) =>
                      setPaperForm({
                        ...paperForm,
                        chapter: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Upload File (PDF, TXT, DOCX/DOC - Max 100MB)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.txt,.docx,.doc"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          await handleFileUpload(file, (url) => {
                            setPaperForm({ ...paperForm, file_url: url });
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                      disabled={uploadingFile}
                    />
                    {uploadingFile && (
                      <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                    )}
                    {paperForm.file_url && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ File uploaded{" "}
                        <button
                          type="button"
                          onClick={() =>
                            setPaperForm({ ...paperForm, file_url: "" })
                          }
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <X className="w-4 h-4 inline-block" /> Clear
                        </button>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
                      disabled={uploadingFile}
                    >
                      {editingPaperId ? "Update Paper" : "Add Paper"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPaper(false);
                        resetForm("paper");
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Q&A Tab */}
      {activeTab === "qa" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Q&A Knowledge Base ({qaPairs.length}) (5-12)
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowBulkUpload(true);
                  setUploadSummary(null);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                Bulk Upload
              </button>
              <button
                onClick={() => {
                  resetForm("qa");
                  setShowAddQA(true);
                }}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4" />
                Add Q&A
              </button>
            </div>
          </div>

          {/* Q&A List */}
          <div className="space-y-3">
            {qaPairs.map((qa) => (
              <div key={qa.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Q: {qa.question}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">A: {qa.answer}</p>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {qa.subject}
                      </span>
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        Class {qa.class_standard}
                      </span>
                      {qa.chapter_topic && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          {qa.chapter_topic}
                        </span>
                      )}
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {qa.difficulty_level}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditQA(qa)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit Q&A"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQA(qa.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete Q&A"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Q&A Modal */}
          {showAddQA && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">
                  {editingQAId ? "Edit Q&A Pair" : "Add New Q&A Pair"}
                </h3>
                <form onSubmit={handleAddQA} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Question
                    </label>
                    <input
                      type="text"
                      value={qaForm.question}
                      onChange={(e) =>
                        handleFormChange("qa", "question", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Answer
                    </label>
                    <textarea
                      value={qaForm.answer}
                      onChange={(e) =>
                        handleFormChange("qa", "answer", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={4}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={qaForm.subject}
                        onChange={(e) =>
                          handleFormChange("qa", "subject", e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Class
                      </label>
                      <input
                        type="text"
                        value={qaForm.class_standard}
                        onChange={(e) =>
                          handleFormChange(
                            "qa",
                            "class_standard",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Chapter/Topic
                      </label>
                      <input
                        type="text"
                        value={qaForm.chapter}
                        onChange={(e) =>
                          handleFormChange("qa", "chapter", e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="e.g. Thermodynamics"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Difficulty Level
                      </label>
                      <select
                        value={qaForm.difficulty_level}
                        onChange={(e) =>
                          handleFormChange(
                            "qa",
                            "difficulty_level",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Question Type
                      </label>
                      <select
                        value={qaForm.question_type}
                        onChange={(e) =>
                          handleFormChange(
                            "qa",
                            "question_type",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="conceptual">Conceptual</option>
                        <option value="numerical">Numerical</option>
                        <option value="theoretical">Theoretical</option>
                        <option value="application">Application</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={qaForm.keywords}
                      onChange={(e) =>
                        handleFormChange("qa", "keywords", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="newton, force, motion"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
                    >
                      {editingQAId ? "Update Q&A" : "Add Q&A"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddQA(false);
                        resetForm("qa");
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Bulk Upload Modal */}
          {showBulkUpload && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                <h3 className="text-lg font-semibold mb-4">
                  Bulk Upload Q&A Pairs
                </h3>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">
                      📋 File Requirements
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Upload Excel (.xlsx) or CSV (.csv) file with these
                      columns:
                    </p>
                    <ul className="text-sm text-blue-600 list-disc list-inside space-y-1">
                      <li>
                        <strong>question</strong> (required)
                      </li>
                      <li>
                        <strong>answer</strong> (required)
                      </li>
                      <li>
                        <strong>subject</strong> (optional)
                      </li>
                      <li>
                        <strong>class</strong> or{" "}
                        <strong>class_standard</strong> (optional)
                      </li>
                      <li>
                        <strong>chapter_topic</strong> (optional)
                      </li>
                      <li>
                        <strong>keywords</strong> (optional)
                      </li>
                      <li>
                        <strong>difficulty</strong> or{" "}
                        <strong>difficulty_level</strong> (optional)
                      </li>
                      <li>
                        <strong>type</strong> or <strong>question_type</strong>{" "}
                        (optional)
                      </li>
                    </ul>
                    <button
                      onClick={downloadSampleTemplate}
                      className="mt-3 w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      📄 Download Sample Template
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select File
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={(e) => setBulkUploadFile(e.target.files[0])}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    {bulkUploadFile && (
                      <p className="text-sm text-gray-600 mt-2">
                        Selected: {bulkUploadFile.name}
                      </p>
                    )}
                  </div>

                  {uploadSummary && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">
                        ✅ Upload Summary
                      </h4>
                      <div className="text-sm text-green-700 space-y-1">
                        <p>Total rows: {uploadSummary.total_rows}</p>
                        <p>✅ Successful: {uploadSummary.successful}</p>
                        <p>⚠️ Skipped: {uploadSummary.skipped}</p>
                        {uploadSummary.skipped_details &&
                          uploadSummary.skipped_details.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">Skipped rows:</p>
                              <ul className="list-disc list-inside">
                                {uploadSummary.skipped_details.map(
                                  (detail, index) => (
                                    <li key={index} className="text-xs">
                                      {detail}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleBulkUpload}
                      disabled={!bulkUploadFile || loading}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? "Uploading..." : "Upload Q&A Pairs"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkUpload(false);
                        setBulkUploadFile(null);
                        setUploadSummary(null);
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chapter Modal (Academic + Reference) */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Chapters - {chapterModalData.bookTitle}
              </h3>
              <button
                onClick={() => setShowChapterModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {chapterLoading ? (
              <p className="text-sm text-blue-600">Loading chapters...</p>
            ) : chapterModalData.chapters.length === 0 ? (
              <p className="text-sm text-gray-600">
                No chapters found for this book.
              </p>
            ) : (
              <div className="space-y-3">
                {chapterModalData.chapters.map((chap, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {chap.chapter_number
                          ? `Chapter ${chap.chapter_number}: `
                          : ""}
                        {chap.title || "Untitled Chapter"}
                      </p>
                      {chap.file_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          {chap.file_name}
                        </p>
                      )}
                    </div>
                    {chap.file_url ? (
                      <a
                        href={chap.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded hover:bg-emerald-200"
                      >
                        <FileText className="w-3 h-3" />
                        Open
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">
                        No file uploaded
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicCMS;
