import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, LogOut, UserCircle, Zap } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { AssessmentApplication, AssessmentSubmission, getAssessmentApplication, getAssessmentSubmission } from '../data/api';

interface User {
  id: string;
  email: string;
  role: 'recruiter' | 'candidate';
  name: string;
}

interface RecruiterCandidateDetailsProps {
  user: User;
  onLogout: () => void;
}

export default function RecruiterCandidateDetails({ user, onLogout }: RecruiterCandidateDetailsProps) {
  const navigate = useNavigate();
  const { assessmentId, candidateId } = useParams();
  const [candidate, setCandidate] = useState<AssessmentApplication | null>(null);
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCandidate = async () => {
      if (!assessmentId || !candidateId) return;
      try {
        setLoading(true);
        setError('');
        const [application, candidateSubmission] = await Promise.all([
          getAssessmentApplication(assessmentId, candidateId),
          getAssessmentSubmission(assessmentId, candidateId).catch(() => null)
        ]);
        setCandidate(application);
        setSubmission(candidateSubmission);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load candidate details.');
      } finally {
        setLoading(false);
      }
    };

    loadCandidate();
  }, [assessmentId, candidateId]);

  const displayCandidate = candidate ?? undefined;
  const displaySubmission = submission ?? undefined;
  const displayAnswers = displaySubmission?.answers as Record<string, any> | undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-gray-600">Loading candidate...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">Unable to load candidate</div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(`/recruiter/assessment/${assessmentId}`)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Back to Assessment
          </button>
        </div>
      </div>
    );
  }

  if (!displayCandidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">Candidate Not Found</div>
          <p className="text-gray-600 mb-6">We couldn't find the candidate details.</p>
          <button
            onClick={() => navigate(`/recruiter/assessment/${assessmentId}`)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Back to Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/recruiter/assessment/${assessmentId}`)}
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

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <UserCircle className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{displayCandidate.name}</h1>
              <p className="text-gray-600">{displayCandidate.email}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-600">Experience</div>
              <div className="text-lg font-semibold text-gray-900">{displayCandidate.experienceYears} years</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">AI Result</div>
              <div className={`text-lg font-semibold ${displayCandidate.status === 'shortlisted' ? 'text-green-600' : 'text-red-600'}`}>
                {displayCandidate.status === 'shortlisted' ? 'Accepted' : 'Rejected'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Score</div>
              <div className="text-lg font-semibold text-gray-900">{displayCandidate.score}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Applied On</div>
              <div className="text-lg font-semibold text-gray-900">{displayCandidate.createdAt ? new Date(displayCandidate.createdAt).toLocaleDateString() : '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Assessment Result</div>
              <div className={`text-lg font-semibold ${displaySubmission?.result === 'passed' ? 'text-green-600' : displaySubmission?.result === 'failed' ? 'text-red-600' : 'text-gray-400'}`}>
                {displaySubmission?.result ? displaySubmission.result : 'Not submitted'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Assessment Score</div>
              <div className="text-lg font-semibold text-gray-900">{displaySubmission ? `${displaySubmission.score}%` : '-'}</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm text-gray-600 mb-2">Skills</div>
            <div className="flex flex-wrap gap-2">
              {displayCandidate.skills.map((skill) => (
                <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Resume</span>
            </div>
            <div className="text-gray-700">{displayCandidate.resumeFileName || 'Not uploaded'}</div>
            {displayCandidate.resumeSummary && (
              <div className="mt-2 text-sm text-gray-600">{displayCandidate.resumeSummary}</div>
            )}
          </div>

          {displaySubmission && (
            <div className="mt-8">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">Assessment Responses</span>
              </div>
              <div className="space-y-4">
                {displaySubmission.questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="text-xs font-semibold text-gray-500 mb-1">Question {index + 1} · {question.type.toUpperCase()}</div>
                    <div className="text-gray-900 font-semibold mb-3">{question.question}</div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs font-semibold text-gray-500 mb-2">Candidate Answer</div>
                      <div className="text-gray-800 whitespace-pre-wrap">
                        {displayAnswers?.[question.id] ? displayAnswers[question.id] : 'No answer provided.'}
                      </div>
                    </div>
                    {question.type === 'mcq' && question.options && (
                      <div className="mt-3 text-sm text-gray-600">
                        <div className="font-semibold text-gray-500 mb-1">Options</div>
                        <ul className="list-disc list-inside space-y-1">
                          {question.options.map((option: string) => (
                            <li key={option}>
                              {option}
                              {question.correctAnswer === option && (
                                <span className="ml-2 text-green-600 font-semibold">(Correct)</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
