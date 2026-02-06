import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, LogOut, Search, FileText, Clock, CheckCircle, XCircle, Play, Award } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { Assessment, Application, getApplicationForCandidate, getAssessments, isAssessmentCompleted, seedAssessments } from '../data/storage';

interface User {
  id: string;
  email: string;
  role: 'recruiter' | 'candidate';
  name: string;
}

interface CandidateDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function CandidateDashboard({ user, onLogout }: CandidateDashboardProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    seedAssessments();
    setAssessments(getAssessments());
  }, []);

  const filteredAssessments = assessments.filter(assessment =>
    assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getApplication = (assessmentId: string): Application | undefined => {
    return getApplicationForCandidate(assessmentId, user.id);
  };

  const getStatusIcon = (status: 'not_applied' | 'shortlisted' | 'rejected') => {
    switch (status) {
      case 'not_applied':
        return <Play className="w-5 h-5 text-blue-600" />;
      case 'shortlisted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusStyle = (status: 'not_applied' | 'shortlisted' | 'rejected') => {
    switch (status) {
      case 'not_applied':
        return 'bg-blue-100 text-blue-700';
      case 'shortlisted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
    }
  };

  const stats = [
    { label: 'Available', value: assessments.length },
    { label: 'Shortlisted', value: assessments.filter(a => getApplication(a.id)?.status === 'shortlisted').length },
    { label: 'Rejected', value: assessments.filter(a => getApplication(a.id)?.status === 'rejected').length },
    { label: 'Avg Score', value: '79%' }
  ];


  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Zap className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">HireIQ</span>
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assessments</h1>
          <p className="text-gray-600">View and complete your job assessments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Assessments</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assessments..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredAssessments.map((assessment) => {
              const application = getApplication(assessment.id);
              const isCompleted = isAssessmentCompleted(assessment.id, user.id);
              const status = application ? application.status : 'not_applied';

              return (
              <div
                key={assessment.id}
                className="p-6 hover:bg-gray-50 transition cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/candidate/assessment/${assessment.id}/details`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/candidate/assessment/${assessment.id}/details`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(status)}
                      <h3 className="text-lg font-bold text-gray-900">{assessment.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(status)}`}>
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{assessment.company}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{assessment.duration} mins</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>{assessment.questions} questions</span>
                      </div>
                      {assessment.includeInterview && isCompleted && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Zap className="w-4 h-4" />
                          <span>AI Interview unlocked</span>
                        </div>
                      )}
                    </div>
                    {application && (
                      <div className="mt-3 flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Award className="w-5 h-5 text-yellow-600" />
                          <span className="font-semibold text-gray-900">AI Match Score: {application.score}%</span>
                        </div>
                        <div className="text-gray-600">
                          Status: <span className="font-semibold text-gray-900">{application.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-6 flex flex-col space-y-2">
                    {!application && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/candidate/apply/${assessment.id}`);
                        }}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-md hover:shadow-lg"
                      >
                        Apply Now
                      </button>
                    )}
                    {application?.status === 'shortlisted' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/candidate/assessment/${assessment.id}`);
                          }}
                          className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition shadow-md hover:shadow-lg"
                        >
                          Start Assessment
                        </button>
                        {assessment.includeInterview && isCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/candidate/interview/${assessment.id}`);
                            }}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-md hover:shadow-lg"
                          >
                            AI Interview
                          </button>
                        )}
                      </>
                    )}
                    {application?.status === 'rejected' && (
                      <div className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-semibold">
                        Not Shortlisted
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          {filteredAssessments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No assessments found</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
