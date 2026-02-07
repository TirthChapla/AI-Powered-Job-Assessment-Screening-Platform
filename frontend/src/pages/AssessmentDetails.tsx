import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, Calendar, CheckCircle, Clock, FileText, LogOut, ShieldCheck, Target, UserCheck, XCircle, Zap } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import {
  AssessmentApplication,
  AssessmentDetails as AssessmentDetailsType,
  getAssessmentApplication,
  getAssessmentCompletion,
  getAssessmentDetails
} from '../data/api';

interface User {
  id: string;
  email: string;
  role: 'recruiter' | 'candidate';
  name: string;
}

interface AssessmentDetailsProps {
  user: User;
  onLogout: () => void;
}

type ShortlistedCandidate = {
  id: string;
  name: string;
  email: string;
  score: number;
  status: 'shortlisted' | 'pending' | 'rejected';
  interviewSlot: string;
  skills: string[];
  resumeScore: number;
  aiSummary: string;
  notes: string;
};

const useMockData = true;

const mockAssessment: AssessmentDetailsType = {
  id: 'assess-101',
  title: 'AI Screening: Frontend Engineer',
  company: 'HireIQ Labs',
  role: 'Frontend Engineer',
  status: 'active',
  duration: 90,
  createdAt: new Date().toISOString(),
  requiredSkills: ['React', 'TypeScript', 'UX Systems', 'API Integration', 'Testing'],
  minExperience: 2,
  minMatchScore: 75,
  includeInterview: true
};

const mockShortlistedCandidates: ShortlistedCandidate[] = [
  {
    id: 'cand-001',
    name: 'Aanya Sharma',
    email: 'aanya.sharma@example.com',
    score: 92,
    status: 'shortlisted',
    interviewSlot: 'Feb 09, 2026 · 10:30 AM',
    skills: ['React', 'TypeScript', 'Tailwind', 'Jest'],
    resumeScore: 88,
    aiSummary: 'Strong FE fundamentals with solid testing practices and API design exposure.',
    notes: 'Prior experience scaling component libraries.'
  },
  {
    id: 'cand-002',
    name: 'Rohit Verma',
    email: 'rohit.verma@example.com',
    score: 86,
    status: 'shortlisted',
    interviewSlot: 'Feb 09, 2026 · 02:00 PM',
    skills: ['React', 'Redux', 'TypeScript', 'Accessibility'],
    resumeScore: 83,
    aiSummary: 'Balanced profile with emphasis on state management and accessibility.',
    notes: 'Recommended to probe advanced React patterns.'
  },
  {
    id: 'cand-003',
    name: 'Meera Iyer',
    email: 'meera.iyer@example.com',
    score: 81,
    status: 'shortlisted',
    interviewSlot: 'Feb 10, 2026 · 11:15 AM',
    skills: ['React', 'TypeScript', 'GraphQL', 'Cypress'],
    resumeScore: 79,
    aiSummary: 'Hands-on with GraphQL and E2E testing; good collaboration signals.',
    notes: 'Follow up on performance optimization experience.'
  }
];

export default function AssessmentDetails({ user, onLogout }: AssessmentDetailsProps) {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState<AssessmentDetailsType | null>(null);
  const [application, setApplication] = useState<AssessmentApplication | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      if (!assessmentId) return;
      try {
        setLoading(true);
        setError('');
        if (useMockData) {
          setAssessment(mockAssessment);
          setIsCompleted(true);
          setApplication({
            id: 'app-001',
            candidateId: user.id,
            assessmentId,
            name: user.name,
            email: user.email,
            experienceYears: 3,
            skills: ['React', 'TypeScript', 'Testing'],
            status: 'shortlisted',
            score: 88,
            createdAt: new Date().toISOString(),
            resumeFileName: 'candidate_resume.pdf'
          });
          return;
        }
        const [details, completion] = await Promise.all([
          getAssessmentDetails(assessmentId),
          getAssessmentCompletion(assessmentId, user.id)
        ]);
        setAssessment(details);
        setIsCompleted(completion.completed);

        const app = await getAssessmentApplication(assessmentId, user.id).catch(() => null);
        setApplication(app);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assessment.');
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [assessmentId, user.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-gray-600">Loading assessment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">Unable to load assessment</div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/candidate')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">Assessment Not Found</div>
          <p className="text-gray-600 mb-6">The assessment you are trying to view does not exist.</p>
          <button
            onClick={() => navigate('/candidate')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            Back to Dashboard
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
              onClick={() => navigate('/candidate')}
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
              onClick={() => navigate('/candidate/profile')}
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

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{assessment.title}</h1>
                  <p className="text-gray-600">{assessment.company} · {assessment.role}</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {assessment.status}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-semibold text-gray-900">{assessment.duration} mins</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-500">Questions</div>
                    <div className="font-semibold text-gray-900">—</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-500">Created</div>
                    <div className="font-semibold text-gray-900">
                      {assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Assessment Description</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                This assessment is designed to evaluate core skills required for the {assessment.role} role.
                It includes a mix of MCQs, subjective questions, and coding challenges to assess both depth and breadth.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">Required Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(assessment.requiredSkills || []).map(skill => (
                      <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">Experience Requirement</span>
                  </div>
                  <p className="text-gray-600">Minimum {assessment.minExperience} years</p>
                  <p className="text-gray-600">Shortlist threshold: {assessment.minMatchScore}%</p>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">Screening</span>
                  </div>
                  <p className="text-gray-600">AI shortlisting based on resume and skills match.</p>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">Interview</span>
                  </div>
                  <p className="text-gray-600">
                    {assessment.includeInterview ? 'AI interview unlocks after you qualify the assessment.' : 'No interview required.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">AI Interview Shortlist</h2>
                <span className="text-sm text-gray-600">
                  {mockShortlistedCandidates.length} candidates shortlisted
                </span>
              </div>
              <div className="grid gap-4">
                {mockShortlistedCandidates.map(candidate => (
                  <div key={candidate.id} className="border border-gray-200 rounded-xl p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{candidate.name}</div>
                        <div className="text-sm text-gray-600">{candidate.email}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                          {candidate.status}
                        </span>
                        <div className="text-sm text-gray-600">Score: {candidate.score}%</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">Interview Slot</div>
                        <div className="text-sm font-semibold text-gray-900">{candidate.interviewSlot}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">Resume Score</div>
                        <div className="text-sm font-semibold text-gray-900">{candidate.resumeScore}%</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">Top Skills</div>
                        <div className="text-sm text-gray-900">{candidate.skills.join(', ')}</div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-700">{candidate.aiSummary}</div>
                    <div className="mt-2 text-sm text-gray-600">Notes: {candidate.notes}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Candidate Track</h3>

              {!application && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <XCircle className="w-5 h-5 text-gray-400" />
                    <span>Not applied yet</span>
                  </div>
                  <button
                    onClick={() => navigate(`/candidate/apply/${assessment.id}`)}
                    className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                  >
                    Apply Now
                  </button>
                </div>
              )}

              {application && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {application.status === 'shortlisted' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-semibold text-gray-900 capitalize">{application.status}</span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">AI Match Score</div>
                    <div className="text-2xl font-bold text-gray-900">{application.score}%</div>
                  </div>

                  <div className="text-sm text-gray-600">
                    Applied on {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : '-'}
                  </div>

                  {application.resumeFileName && (
                    <div className="text-sm text-gray-600">
                      Resume: <span className="font-medium text-gray-900">{application.resumeFileName}</span>
                    </div>
                  )}

                  {application.status === 'shortlisted' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => navigate(`/candidate/assessment/${assessment.id}`)}
                        className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
                      >
                        Start Assessment
                      </button>
                      {assessment.includeInterview && isCompleted && (
                        <button
                          onClick={() => navigate(`/candidate/interview/${assessment.id}`)}
                          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                        >
                          AI Interview
                        </button>
                      )}
                      {assessment.includeInterview && !isCompleted && (
                        <div className="text-sm text-gray-600">
                          Complete the assessment to unlock AI interview.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
