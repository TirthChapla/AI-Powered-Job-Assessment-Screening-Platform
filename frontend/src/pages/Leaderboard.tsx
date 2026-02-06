import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Zap, LogOut, ArrowLeft, Award, TrendingUp, TrendingDown, Medal, Search, Filter } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

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

interface Candidate {
  rank: number;
  name: string;
  email: string;
  overallScore: number;
  skills: {
    react: number;
    typescript: number;
    node: number;
    testing: number;
  };
  interviewScore: number;
  timeSpent: number;
  status: 'shortlisted' | 'under_review' | 'rejected';
  trend: 'up' | 'down' | 'same';
}

export default function Leaderboard({ user, onLogout }: LeaderboardProps) {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'shortlisted' | 'under_review' | 'rejected'>('all');

  const candidates: Candidate[] = [
    {
      rank: 1,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      overallScore: 92,
      skills: { react: 95, typescript: 90, node: 88, testing: 92 },
      interviewScore: 94,
      timeSpent: 75,
      status: 'shortlisted',
      trend: 'up'
    },
    {
      rank: 2,
      name: 'Bob Smith',
      email: 'bob@example.com',
      overallScore: 88,
      skills: { react: 90, typescript: 85, node: 87, testing: 88 },
      interviewScore: 90,
      timeSpent: 82,
      status: 'shortlisted',
      trend: 'same'
    },
    {
      rank: 3,
      name: 'Carol White',
      email: 'carol@example.com',
      overallScore: 85,
      skills: { react: 88, typescript: 82, node: 84, testing: 85 },
      interviewScore: 87,
      timeSpent: 79,
      status: 'shortlisted',
      trend: 'up'
    },
    {
      rank: 4,
      name: 'David Brown',
      email: 'david@example.com',
      overallScore: 82,
      skills: { react: 85, typescript: 80, node: 81, testing: 82 },
      interviewScore: 84,
      timeSpent: 88,
      status: 'under_review',
      trend: 'down'
    },
    {
      rank: 5,
      name: 'Eve Davis',
      email: 'eve@example.com',
      overallScore: 80,
      skills: { react: 82, typescript: 78, node: 79, testing: 81 },
      interviewScore: 82,
      timeSpent: 90,
      status: 'under_review',
      trend: 'same'
    },
    {
      rank: 6,
      name: 'Frank Miller',
      email: 'frank@example.com',
      overallScore: 76,
      skills: { react: 78, typescript: 74, node: 75, testing: 77 },
      interviewScore: 78,
      timeSpent: 85,
      status: 'under_review',
      trend: 'up'
    },
    {
      rank: 7,
      name: 'Grace Lee',
      email: 'grace@example.com',
      overallScore: 74,
      skills: { react: 76, typescript: 72, node: 73, testing: 75 },
      interviewScore: 76,
      timeSpent: 87,
      status: 'under_review',
      trend: 'down'
    },
    {
      rank: 8,
      name: 'Henry Wilson',
      email: 'henry@example.com',
      overallScore: 68,
      skills: { react: 70, typescript: 66, node: 67, testing: 69 },
      interviewScore: 70,
      timeSpent: 92,
      status: 'rejected',
      trend: 'down'
    }
  ];

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || candidate.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return null;
  };

  const getStatusStyle = (status: Candidate['status']) => {
    switch (status) {
      case 'shortlisted':
        return 'bg-green-100 text-green-700';
      case 'under_review':
        return 'bg-orange-100 text-orange-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
    }
  };

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
          <div className="flex items-center space-x-3 mb-2">
            <Award className="w-8 h-8 text-yellow-600" />
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          </div>
          <p className="text-gray-600">Senior Frontend Developer - Top Performers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
            <Medal className="w-8 h-8 mb-3" />
            <div className="text-2xl font-bold mb-1">92%</div>
            <div className="text-yellow-100 text-sm">Top Score</div>
            <div className="text-sm font-medium mt-2">Alice Johnson</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="text-gray-600 text-sm mb-2">Average Score</div>
            <div className="text-3xl font-bold text-gray-900">79%</div>
            <div className="flex items-center space-x-1 text-green-600 text-sm mt-2">
              <TrendingUp className="w-4 h-4" />
              <span>+3% from last batch</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="text-gray-600 text-sm mb-2">Shortlisted</div>
            <div className="text-3xl font-bold text-gray-900">3</div>
            <div className="text-sm text-gray-600 mt-2">Top performers</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="text-gray-600 text-sm mb-2">Total Candidates</div>
            <div className="text-3xl font-bold text-gray-900">127</div>
            <div className="text-sm text-gray-600 mt-2">8 shown below</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidates..."
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="all">All Status</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="under_review">Under Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Overall</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Skills</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Interview</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.rank} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getRankIcon(candidate.rank)}
                        <span className="font-bold text-gray-900 text-lg">{candidate.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{candidate.name}</div>
                        <div className="text-sm text-gray-600">{candidate.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`text-2xl font-bold ${
                          candidate.overallScore >= 80 ? 'text-green-600' :
                          candidate.overallScore >= 60 ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {candidate.overallScore}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">React:</span>
                          <span className="font-semibold text-gray-900 ml-1">{candidate.skills.react}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">TS:</span>
                          <span className="font-semibold text-gray-900 ml-1">{candidate.skills.typescript}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Node:</span>
                          <span className="font-semibold text-gray-900 ml-1">{candidate.skills.node}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Test:</span>
                          <span className="font-semibold text-gray-900 ml-1">{candidate.skills.testing}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-blue-600">{candidate.interviewScore}%</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{candidate.timeSpent} min</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(candidate.status)}`}>
                        {candidate.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {candidate.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-600" />}
                      {candidate.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-600" />}
                      {candidate.trend === 'same' && <div className="w-5 h-0.5 bg-gray-400"></div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCandidates.length === 0 && (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No candidates found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
