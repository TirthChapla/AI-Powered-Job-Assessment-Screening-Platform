import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, LogOut, Save, Pencil, Zap } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import {
  getAssessmentApplications,
  getAssessmentDetails,
  getAssessmentSubmissions,
  updateAssessment as updateAssessmentApi,
  AssessmentApplication,
  AssessmentSubmission
} from '../data/api';

interface User {
  id: string;
  email: string;
  role: 'recruiter' | 'candidate';
  name: string;
}

interface RecruiterAssessmentDetailsProps {
  user: User;
  onLogout: () => void;
}

export default function RecruiterAssessmentDetails({ user, onLogout }: RecruiterAssessmentDetailsProps) {
  type AiQuestion = {
    id: string;
    type: 'mcq' | 'descriptive' | 'dsa';
    question: string;
    answer: string;
    options?: string[];
  };
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<'active' | 'draft' | 'closed'>('active');
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(true);
  const [duration, setDuration] = useState(0);
  const [skills, setSkills] = useState('');
  const [minExperience, setMinExperience] = useState(0);
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [includeInterview, setIncludeInterview] = useState(true);
  const [activePage, setActivePage] = useState<'description' | 'applied' | 'shortlisted' | 'passed' | 'interviewed'>('description');
  const [resultFilter, setResultFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [interviewFilter, setInterviewFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [appliedCandidates, setAppliedCandidates] = useState<AssessmentApplication[]>([]);
  const [assessmentSubmissions, setAssessmentSubmissions] = useState<AssessmentSubmission[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiQuestions, setAiQuestions] = useState<AiQuestion[]>([
    {
      id: 'q1',
      type: 'mcq' as const,
      question: 'Which hook is used for side effects in React?',
      options: ['useMemo', 'useCallback', 'useEffect', 'useRef'],
      answer: 'useEffect'
    },
    {
      id: 'q2',
      type: 'descriptive' as const,
      question: 'Explain the difference between controlled and uncontrolled components in React.',
      answer: 'Controlled components manage form data via React state, while uncontrolled components store form data in the DOM using refs.'
    },
    {
      id: 'q3',
      type: 'dsa' as const,
      question: 'Write a function to reverse a string without using built-in reverse methods.',
      answer: 'function reverseString(str){ let out=""; for(let i=str.length-1;i>=0;i--){ out+=str[i]; } return out; }'
    }
  ]);

  useEffect(() => {
    const loadAssessment = async () => {
      if (!assessmentId) return;
      try {
        setLoading(true);
        setError('');
        const [details, applications, submissions] = await Promise.all([
          getAssessmentDetails(assessmentId),
          getAssessmentApplications(assessmentId),
          getAssessmentSubmissions(assessmentId)
        ]);

        setTitle(details.title);
        setRole(details.role);
        setCompany(details.company);
        setStatus(details.status);
        setDescription(details.description || '');
        setDuration(details.duration || 0);
        setSkills((details.requiredSkills || []).join(', '));
        setMinExperience(details.minExperience || 0);
        setMinMatchScore(details.minMatchScore || 0);
        setIncludeInterview(Boolean(details.includeInterview));
        setAppliedCandidates(applications);
        setAssessmentSubmissions(submissions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assessment.');
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [assessmentId]);

  const handleSave = async () => {
    if (!assessmentId) return;
    try {
      setError('');
      await updateAssessmentApi(assessmentId, {
        title,
        role,
        company,
        status,
        description,
        duration,
        requiredSkills: skills.split(',').map(item => item.trim()).filter(Boolean),
        minExperience,
        minMatchScore,
        includeInterview
      });
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assessment.');
    }
  };

  const filteredSubmissions = useMemo(() => {
    if (resultFilter === 'all') return assessmentSubmissions;
    return assessmentSubmissions.filter(item => item.result === resultFilter);
  }, [assessmentSubmissions, resultFilter]);

  const displayedSubmissions = filteredSubmissions.map((submission) => {
    const candidate = appliedCandidates.find(item => item.candidateId === submission.candidateId);
    return {
      candidateId: submission.candidateId,
      name: candidate?.name || 'Candidate',
      email: candidate?.email || '-',
      result: submission.result,
      score: submission.score,
      submittedAt: submission.submittedAt
    };
  });

  const displayedInterviewedCandidates: Array<{
    candidateId: string;
    name: string;
    email: string;
    result: 'passed' | 'failed';
    score: number;
    submittedAt: string;
  }> = [];

  const regenerateAiQuestions = () => {
    setAiQuestions([
      {
        id: 'q4',
        type: 'mcq' as const,
        question: 'What does React.memo do?',
        options: ['Adds state', 'Memoizes components', 'Runs effects', 'Creates refs'],
        answer: 'Memoizes components'
      },
      {
        id: 'q5',
        type: 'descriptive' as const,
        question: 'Describe how you would optimize a slow React page.',
        answer: 'Use memoization, virtualization, split code, and profile renders to remove unnecessary updates.'
      },
      {
        id: 'q6',
        type: 'dsa' as const,
        question: 'Implement a function to find the first non-repeating character in a string.',
        answer: 'Use a frequency map, then scan again to return the first character with count 1.'
      }
    ]);
  };

  const updateAiQuestion = (id: string, field: 'type' | 'question' | 'answer', value: string) => {
    setAiQuestions(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateAiOption = (id: string, index: number, value: string) => {
    setAiQuestions(prev => prev.map(item => {
      if (item.id !== id) return item;
      const options = [...(item.options || [])];
      options[index] = value;
      return { ...item, options };
    }));
  };

  const displayedShortlistedCandidates = appliedCandidates.filter(candidate => candidate.status === 'shortlisted');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/recruiter')}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">HireIQ</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={() => navigate('/recruiter/profile')}
              className="text-gray-700 font-medium hover:text-blue-600 transition"
            >
              {user.name}
            </button>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {loading && (
          <div className="mb-6 text-sm text-gray-500">Loading assessment...</div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sticky top-6">
              <div className="text-sm font-semibold text-gray-700">Pages</div>
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => setActivePage('description')}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                    activePage === 'description'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Assessment Description
                </button>
                <button
                  onClick={() => setActivePage('applied')}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                    activePage === 'applied'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Applied Candidates
                </button>
                <button
                  onClick={() => setActivePage('shortlisted')}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                    activePage === 'shortlisted'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Shortlisted Candidates
                </button>
                <button
                  onClick={() => setActivePage('passed')}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                    activePage === 'passed'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Assessment Applied Candidates
                </button>
                <button
                  onClick={() => setActivePage('interviewed')}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                    activePage === 'interviewed'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  AI Interviewed Candidates
                </button>
                <button
                  onClick={() => navigate(`/recruiter/leaderboard/${assessmentId}`)}
                  className="w-full text-left px-3 py-2 rounded-lg border transition border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Leaderboard
                </button>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-9 space-y-6">
            {activePage === 'description' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900">Assessment Details</h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                    {status}
                  </span>
                </div>
                {activePage === 'description' && (!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saved ? 'Saved' : 'Save Changes'}</span>
                  </button>
                ))}
              </div>
              {saved && activePage === 'description' && (
                <div className="text-sm text-green-600">Changes saved.</div>
              )}

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <span className="text-lg font-semibold text-gray-900">Assessment Description</span>
                  <span className="text-sm font-semibold text-gray-500">{isDescriptionOpen ? 'Hide' : 'Show'}</span>
                </button>
                {isDescriptionOpen && (
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Assessment Title</label>
                        <input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          readOnly={!isEditing}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                        <input
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          readOnly={!isEditing}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                        <input
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          readOnly={!isEditing}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as 'active' | 'draft' | 'closed')}
                          disabled={!isEditing}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        >
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (mins)</label>
                        <input
                          type="number"
                          min={10}
                          max={240}
                          value={duration}
                          onChange={(e) => setDuration(Math.max(10, Number(e.target.value)))}
                          readOnly={!isEditing}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Required Skills</label>
                        <input
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          readOnly={!isEditing}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          placeholder="React, TypeScript, Node.js"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Experience (years)</label>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={minExperience}
                          onChange={(e) => setMinExperience(Math.max(0, Number(e.target.value)))}
                          readOnly={!isEditing}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Match Score (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={minMatchScore}
                          onChange={(e) => setMinMatchScore(Math.max(0, Number(e.target.value)))}
                          readOnly={!isEditing}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">AI Interview</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={includeInterview}
                            onChange={(e) => setIncludeInterview(e.target.checked)}
                            disabled={!isEditing}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-gray-700">Include AI interview after assessment</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={10}
                        readOnly={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                        placeholder="Add full assessment description here..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setIsQuestionsOpen(!isQuestionsOpen)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <span className="text-lg font-semibold text-gray-900">AI Generated Questions & Answers</span>
                  <span className="text-sm font-semibold text-gray-500">{isQuestionsOpen ? 'Hide' : 'Show'}</span>
                </button>
                {isQuestionsOpen && (
                  <div className="p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm text-gray-600">You can edit any question and answer below.</div>
                      <button
                        onClick={regenerateAiQuestions}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                      >
                        Re-generate Questions
                      </button>
                    </div>
                    {aiQuestions.map((item, index) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-gray-600">Question {index + 1}</div>
                          <select
                            value={item.type}
                            onChange={(e) => updateAiQuestion(item.id, 'type', e.target.value)}
                            className="text-xs font-semibold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            <option value="mcq">MCQ</option>
                            <option value="descriptive">Descriptive</option>
                            <option value="dsa">DSA</option>
                          </select>
                        </div>
                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-gray-500 mb-2">Question</label>
                          <textarea
                            value={item.question}
                            onChange={(e) => updateAiQuestion(item.id, 'question', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                        </div>
                        {item.type === 'mcq' && (
                          <div className="mt-3 grid gap-2">
                            {(item.options || []).map((option, optionIndex) => (
                              <input
                                key={`${item.id}-option-${optionIndex}`}
                                value={option}
                                onChange={(e) => updateAiOption(item.id, optionIndex, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                              />
                            ))}
                          </div>
                        )}
                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-gray-500 mb-2">Suggested Answer</label>
                          <textarea
                            value={item.answer}
                            onChange={(e) => updateAiQuestion(item.id, 'answer', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}

            {activePage === 'applied' && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Applied Candidates</h2>
                {appliedCandidates.length === 0 ? (
                  <div className="text-gray-600">No candidates have applied yet.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Candidate</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {appliedCandidates.map((candidate) => (
                              <tr
                                key={candidate.id}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => navigate(`/recruiter/assessment/${assessmentId}/candidate/${candidate.candidateId}`)}
                              >
                                <td className="px-4 py-3 font-medium text-gray-900">{candidate.name}</td>
                                <td className="px-4 py-3 text-gray-600">{candidate.email}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    candidate.status === 'shortlisted'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {candidate.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{candidate.score}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                  </div>
                )}
              </div>
            )}

            {activePage === 'shortlisted' && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Shortlisted Candidates</h2>
                {displayedShortlistedCandidates.length === 0 ? (
                  <div className="text-gray-600">No candidates shortlisted yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Candidate</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Experience</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {displayedShortlistedCandidates.map((candidate) => (
                          <tr
                            key={candidate.candidateId}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/recruiter/assessment/${assessmentId}/candidate/${candidate.candidateId}`)}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">{candidate.name}</td>
                            <td className="px-4 py-3 text-gray-600">{candidate.email}</td>
                            <td className="px-4 py-3 text-gray-600">{candidate.experienceYears} yrs</td>
                            <td className="px-4 py-3 text-gray-600">{candidate.score}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {activePage === 'passed' && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Assessment Applied Candidates</h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-gray-600">Filter</span>
                    <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                      {(['all', 'passed', 'failed'] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => setResultFilter(option)}
                          className={`px-3 py-1.5 text-sm font-semibold rounded-md transition capitalize ${
                            resultFilter === option
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {displayedSubmissions.length === 0 ? (
                  <div className="text-gray-600">No candidates match the selected filter.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Candidate</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Result</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {displayedSubmissions.map((submission) => (
                          <tr
                            key={submission.candidateId}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/recruiter/assessment/${assessmentId}/candidate/${submission.candidateId}`)}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">{submission.name}</td>
                            <td className="px-4 py-3 text-gray-600">{submission.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                submission.result === 'passed'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {submission.result}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{submission.score}%</td>
                            <td className="px-4 py-3 text-gray-600">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {activePage === 'interviewed' && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900">AI Interviewed Candidates</h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-gray-600">Filter</span>
                    <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                      {(['all', 'passed', 'failed'] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => setInterviewFilter(option)}
                          className={`px-3 py-1.5 text-sm font-semibold rounded-md transition capitalize ${
                            interviewFilter === option
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {displayedInterviewedCandidates.length === 0 ? (
                  <div className="text-gray-600">No candidates match the selected filter.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Candidate</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Result</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Completed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {displayedInterviewedCandidates.map((candidate) => (
                          <tr
                            key={candidate.candidateId}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/recruiter/assessment/${assessmentId}/candidate/${candidate.candidateId}`)}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">{candidate.name}</td>
                            <td className="px-4 py-3 text-gray-600">{candidate.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                candidate.result === 'passed'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {candidate.result}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{candidate.score}%</td>
                            <td className="px-4 py-3 text-gray-600">{new Date(candidate.submittedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
