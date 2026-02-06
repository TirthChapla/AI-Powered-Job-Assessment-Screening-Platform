import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, Calendar, CheckCircle, Clock, FileText, LogOut, ShieldCheck, Target, UserCheck, XCircle, Zap } from 'lucide-react';
import { getApplicationForCandidate, getAssessments, isAssessmentCompleted } from '../data/storage';
import ThemeToggle from '../components/ThemeToggle';

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

export default function AssessmentDetails({ user, onLogout }: AssessmentDetailsProps) {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const assessment = getAssessments().find(item => item.id === assessmentId);
  const application = assessmentId ? getApplicationForCandidate(assessmentId, user.id) : undefined;
  const isCompleted = assessmentId ? isAssessmentCompleted(assessmentId, user.id) : false;

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
            <span className="text-gray-700 font-medium">{user.name}</span>
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
                    <div className="font-semibold text-gray-900">{assessment.questions}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-500">Created</div>
                    <div className="font-semibold text-gray-900">{new Date(assessment.createdAt).toLocaleDateString()}</div>
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
                    {assessment.requiredSkills.map(skill => (
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
                    Applied on {new Date(application.createdAt).toLocaleDateString()}
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
