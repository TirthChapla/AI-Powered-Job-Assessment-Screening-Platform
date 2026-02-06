import { useNavigate } from 'react-router-dom';
import { Briefcase, Brain, Target, Shield, BarChart3, Zap, CheckCircle, TrendingUp } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Assessment',
      description: 'Automatically generate role-specific tests from job descriptions using advanced AI'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Smart Evaluation',
      description: 'Intelligent grading for MCQs, coding challenges, and subjective answers'
    },
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: 'Automated Interviews',
      description: 'AI conducts technical interviews, evaluates responses, and provides scores'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Anti-Fraud Detection',
      description: 'Detect fake claims, plagiarism, and suspicious patterns automatically'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Advanced Analytics',
      description: 'Comprehensive reports with skill breakdowns and performance insights'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Smart Ranking',
      description: 'Automatic candidate ranking based on weighted skill performance'
    }
  ];

  const useCases = [
    'Generate assessments for any tech role instantly',
    'Evaluate 1000+ candidates simultaneously',
    'Detect fake skill claims and resume fraud',
    'Conduct AI interviews without human intervention',
    'Rank candidates based on actual performance'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Zap className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">HireIQ</span>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-md hover:shadow-lg"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          <span>AI-Powered Hiring Platform</span>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Hire Based on Skills,<br />
          <span className="text-blue-600">Not Resumes</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          An intelligent hiring platform that converts job descriptions into role-specific assessments,
          conducts AI interviews, and evaluates candidates using advanced scoring algorithms.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition shadow-lg hover:shadow-xl"
          >
            Start Free Trial
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:text-blue-600 font-semibold text-lg transition shadow-md hover:shadow-lg"
          >
            View Demo
          </button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition border border-gray-100"
            >
              <div className="text-blue-600 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-white shadow-2xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose HireIQ?</h2>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                Traditional hiring wastes time on fake resumes and manual screening.
                Our AI-powered platform evaluates real skills through automated assessments and interviews.
              </p>
              <div className="space-y-4">
                {useCases.map((useCase, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-blue-200 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-50 text-lg">{useCase}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold mb-6">Sample Results</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Overall Score</span>
                  <span className="text-3xl font-bold">82%</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-100">React</span>
                    <span className="font-semibold">90</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white rounded-full h-2" style={{ width: '90%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-100">Node.js</span>
                    <span className="font-semibold">75</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white rounded-full h-2" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-100">Interview Score</span>
                    <span className="font-semibold">85</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white rounded-full h-2" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Final Rank</span>
                    <span className="text-2xl font-bold">3/150</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Transform Your Hiring?</h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Join hundreds of companies using AI to hire better, faster, and fairer.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-10 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition shadow-lg hover:shadow-xl"
          >
            Start Your Free Trial
          </button>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Zap className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold text-white">HireIQ</span>
          </div>
          <p className="text-sm">AI-Powered Job Assessment & Screening Platform</p>
          <p className="text-xs mt-2">Hire based on skills, not resumes.</p>
        </div>
      </footer>
    </div>
  );
}
