import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, Users, FileText, BarChart3, LogOut, Search, Calendar, TrendingUp } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { getApplicationsForAssessment, getAssessments, seedAssessments } from '../data/storage';

interface User {
  id: string;
  email: string;
  role: 'recruiter' | 'candidate';
  name: string;
}

interface RecruiterDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function RecruiterDashboard({ user, onLogout }: RecruiterDashboardProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [assessments, setAssessments] = useState(getAssessments());

  useEffect(() => {
    seedAssessments();
    setAssessments(getAssessments());
  }, []);

  const totalCandidates = assessments.reduce((sum, assessment) => sum + getApplicationsForAssessment(assessment.id).length, 0);
  const activeCount = assessments.filter(assessment => assessment.status === 'active').length;

  const stats = [
    { label: 'Active Assessments', value: String(activeCount), icon: <FileText className="w-6 h-6" />, color: 'blue' },
    { label: 'Total Candidates', value: String(totalCandidates), icon: <Users className="w-6 h-6" />, color: 'green' },
    { label: 'Avg. Score', value: assessments.length ? `${Math.round(assessments.reduce((sum, assessment) => sum + assessment.avgScore, 0) / assessments.length)}%` : '0%', icon: <TrendingUp className="w-6 h-6" />, color: 'orange' },
    { label: 'Top Performers', value: '42', icon: <BarChart3 className="w-6 h-6" />, color: 'purple' }
  ];

  const filteredAssessments = assessments.filter(assessment =>
    assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruiter Dashboard</h1>
          <p className="text-gray-600">Manage assessments and evaluate candidates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className={`text-${stat.color}-600 mb-3`}>{stat.icon}</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Your Assessments</h2>
              <button
                onClick={() => navigate('/recruiter/create')}
                className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Create Assessment</span>
              </button>
            </div>
            <div className="mt-4 relative">
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Assessment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Candidates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{assessment.title}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{assessment.role}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{getApplicationsForAssessment(assessment.id).length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        assessment.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : assessment.status === 'draft'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {assessment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {assessment.avgScore > 0 ? (
                        <span className="font-semibold text-gray-900">{assessment.avgScore}%</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-gray-600 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(assessment.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/recruiter/results/${assessment.id}`)}
                          className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-medium text-sm transition"
                        >
                          View Results
                        </button>
                        <button
                          onClick={() => navigate(`/recruiter/leaderboard/${assessment.id}`)}
                          className="px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg font-medium text-sm transition"
                        >
                          Leaderboard
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAssessments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No assessments found</p>
              <button
                onClick={() => navigate('/recruiter/create')}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Create Your First Assessment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
