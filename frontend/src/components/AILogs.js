import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Bot, Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function AILogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  
  // Filter states
  const [contentSource, setContentSource] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [sortOrder, setSortOrder] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Available filter options
  const [filterOptions, setFilterOptions] = useState({
    content_sources: [],
    subjects: [],
    chapters: [],
    topics: []
  });

  useEffect(() => {
    fetchFilterOptions();
    fetchLogs();
  }, [contentSource, subject, chapter, topic, sortOrder, currentPage]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sort_order: sortOrder
      });
      
      if (contentSource) params.append('content_source', contentSource);
      if (subject) params.append('subject', subject);
      if (chapter) params.append('chapter', chapter);
      if (topic) params.append('topic', topic);
      
      const response = await axios.get(`${API_BASE_URL}/ai-engine/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLogs(response.data.logs || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (contentSource) params.append('content_source', contentSource);
      if (subject) params.append('subject', subject);
      if (chapter) params.append('chapter', chapter);
      
      const response = await axios.get(`${API_BASE_URL}/ai-engine/log-filters?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFilterOptions(response.data.filters);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const resetFilters = () => {
    setContentSource('');
    setSubject('');
    setChapter('');
    setTopic('');
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Activity className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Activity Logs</h1>
            <p className="text-gray-600">Track your AI interactions by Subject, Chapter, and Topic</p>
          </div>
        </div>
        <Button onClick={resetFilters} variant="outline">
          Clear Filters
        </Button>
      </div>

      {/* Hierarchical Filtering Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter by Content Source & Tags</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Content Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Source
              </label>
              <select
                value={contentSource}
                onChange={(e) => {
                  setContentSource(e.target.value);
                  setSubject('');
                  setChapter('');
                  setTopic('');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Sources</option>
                {filterOptions.content_sources.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setChapter('');
                  setTopic('');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Subjects</option>
                {filterOptions.subjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Chapter Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter
              </label>
              <select
                value={chapter}
                onChange={(e) => {
                  setChapter(e.target.value);
                  setTopic('');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Chapters</option>
                {filterOptions.chapters.map((chap) => (
                  <option key={chap} value={chap}>{chap}</option>
                ))}
              </select>
            </div>

            {/* Topic Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic (Optional)
              </label>
              <select
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Topics</option>
                {filterOptions.topics.map((top) => (
                  <option key={top} value={top}>{top}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Sort Order */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activity History</CardTitle>
          {pagination && (
            <p className="text-sm text-gray-600">
              Showing {logs.length} of {pagination.total_count} interactions
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No activity logs found. Try adjusting your filters.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="space-y-3">
                    {/* Question */}
                    {log.question && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Question:</p>
                        <p className="text-sm text-gray-900">{log.question}</p>
                      </div>
                    )}
                    
                    {/* Answer */}
                    {log.answer && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Answer:</p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{log.answer}</p>
                      </div>
                    )}
                    
                    {/* Source Tags */}
                    {log.tags && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold mb-2 text-gray-600">📚 Source Tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {log.tags.subject && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              Subject: {log.tags.subject}
                            </span>
                          )}
                          {log.tags.chapter && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              Chapter: {log.tags.chapter}
                            </span>
                          )}
                          {log.tags.topic && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              Topic: {log.tags.topic}
                            </span>
                          )}
                          {log.tags.academic_book && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                              📖 Academic Book: {log.tags.academic_book}
                            </span>
                          )}
                          {log.tags.reference_book && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                              📚 Reference Book: {log.tags.reference_book}
                            </span>
                          )}
                          {log.tags.qa_knowledge_base && (
                            <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs">
                              ❓ Q&A Knowledge Base
                            </span>
                          )}
                          {log.tags.previous_papers && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                              📝 Previous Papers: {log.tags.previous_papers}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Metadata */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                      {log.source && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          Source: {log.source}
                        </span>
                      )}
                      {log.user_name && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                          {log.user_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination Controls */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Page {pagination.current_page} of {pagination.total_pages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.has_previous}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.has_next}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
