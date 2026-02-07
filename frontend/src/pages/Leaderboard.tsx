import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Zap, LogOut, ArrowLeft, Award } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import {
  AssessmentApplication,
  AssessmentDetails,
  AssessmentSubmission,
  getAssessmentApplications,
  getAssessmentDetails,
  getAssessmentSubmissions
} from '../data/api';

interface User {
  id: string;
  email: string;
  role: 'recruiter' | 'candidate';
  name: string;
}

interface LeaderboardProps {
  user: User;
  onLogout: () => void;
}

type ScoreResult = 'passed' | 'failed';

interface ScoreEntry {
  candidateId: string;
  name: string;
  email: string;
  score: number;
  result: ScoreResult;
}

export default function Leaderboard({ user, onLogout }: LeaderboardProps) {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [appliedCandidates, setAppliedCandidates] = useState<AssessmentApplication[]>([]);
  const [assessmentSubmissions, setAssessmentSubmissions] = useState<AssessmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!assessmentId) return;
      try {
        setLoading(true);
        setError('');
        const [details, applications, submissions] = await Promise.all([
          getAssessmentDetails(assessmentId),
          getAssessmentApplications(assessmentId),
          getAssessmentSubmissions(assessmentId)
        ]);
        setAssessment(details);
        setAppliedCandidates(applications);
        setAssessmentSubmissions(submissions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard.');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [assessmentId]);

  const assessmentEntries: ScoreEntry[] = assessmentSubmissions.map((submission, index) => {
    const candidate = appliedCandidates.find(item => item.candidateId === submission.candidateId);
    return {
      candidateId: submission.candidateId,
      name: candidate?.name || `Candidate ${index + 1}`,
      email: candidate?.email || '-',
      score: submission.score,
      result: submission.result
    };
  });

  const interviewEntries: ScoreEntry[] = [];

  const sortDesc = (a: ScoreEntry, b: ScoreEntry) => b.score - a.score;

  const assessmentPassed = [...assessmentEntries].filter(item => item.result === 'passed').sort(sortDesc);
  const assessmentFailed = [...assessmentEntries].filter(item => item.result === 'failed').sort(sortDesc);
  const interviewPassed = [...interviewEntries].filter(item => item.result === 'passed').sort(sortDesc);
  const interviewFailed = [...interviewEntries].filter(item => item.result === 'failed').sort(sortDesc);

  const mergedPassed = [
    ...interviewPassed.map(item => ({ ...item, source: 'AI Interview' as const })),
    ...assessmentPassed.map(item => ({ ...item, source: 'Assessment' as const }))
  ].sort(sortDesc);

  const mergedFailed = [
    ...interviewFailed.map(item => ({ ...item, source: 'AI Interview' as const })),
    ...assessmentFailed.map(item => ({ ...item, source: 'Assessment' as const }))
  ].sort(sortDesc);

  const mergedAll = [...mergedPassed, ...mergedFailed].sort(sortDesc);
  const leaderboardEntries = useMemo(() => {
    const byCandidate = new Map<string, (ScoreEntry & { source: 'Assessment' | 'AI Interview' })>();
    for (const entry of mergedAll) {
      const key = entry.email || entry.name;
      const existing = byCandidate.get(key);
      if (!existing || entry.score > existing.score) {
        byCandidate.set(key, entry);
      }
    }
    return [...byCandidate.values()].sort(sortDesc);
  }, [mergedAll]);


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
          <div className="mb-6 text-sm text-gray-500">Loading leaderboard...</div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sticky top-6">
              <div className="text-sm font-semibold text-gray-700">Pages</div>
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => navigate(`/recruiter/assessment/${assessmentId}`)}
                  className="w-full text-left px-3 py-2 rounded-lg border transition border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Assessment Description
                </button>
                <button
                  onClick={() => navigate(`/recruiter/assessment/${assessmentId}`)}
                  className="w-full text-left px-3 py-2 rounded-lg border transition border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Applied Candidates
                </button>
                <button
                  onClick={() => navigate(`/recruiter/assessment/${assessmentId}`)}
                  className="w-full text-left px-3 py-2 rounded-lg border transition border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Shortlisted Candidates
                </button>
                <button
                  onClick={() => navigate(`/recruiter/assessment/${assessmentId}`)}
                  className="w-full text-left px-3 py-2 rounded-lg border transition border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Assessment Applied Candidates
                </button>
                <button
                  onClick={() => navigate(`/recruiter/assessment/${assessmentId}`)}
                  className="w-full text-left px-3 py-2 rounded-lg border transition border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  AI Interviewed Candidates
                </button>
                <button
                  className="w-full text-left px-3 py-2 rounded-lg border transition bg-blue-50 border-blue-200 text-blue-700"
                >
                  Leaderboard
                </button>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-9">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <Award className="w-8 h-8 text-yellow-600" />
                <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
              </div>
              <p className="text-gray-600">
                {assessment?.title || 'Assessment'} - Candidates ranked by score
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Passed</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Failed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leaderboardEntries.map((entry) => (
                      <tr key={`${entry.candidateId}-${entry.result}`} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{entry.name}</td>
                        <td className="px-6 py-4 text-gray-600">{entry.email}</td>
                        <td className="px-6 py-4 text-gray-600">{entry.source}</td>
                        <td className="px-6 py-4 text-gray-900 font-semibold">{entry.score}%</td>
                        <td className="px-6 py-4">
                          {entry.result === 'passed' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              passed
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {entry.result === 'failed' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              failed
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {leaderboardEntries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-500">
                          No leaderboard data yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
