import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, LogOut, ArrowLeft, Sparkles, FileText, Clock, Target, Brain } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { saveAssessment } from '../data/storage';

interface User {
  id: string;
  email: string;
  role: 'recruiter' | 'candidate';
  name: string;
}

interface CreateAssessmentProps {
  user: User;
  onLogout: () => void;
}

export default function CreateAssessment({ user, onLogout }: CreateAssessmentProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [duration, setDuration] = useState(90);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [includeInterview, setIncludeInterview] = useState(true);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [minExperience, setMinExperience] = useState(2);
  const [minMatchScore, setMinMatchScore] = useState(70);

  const handleAnalyzeJD = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockData = {
      role: 'Senior Frontend Developer',
      skills: ['React', 'TypeScript', 'Node.js', 'REST APIs', 'Testing'],
      experience: 'Senior (5+ years)',
      questions: {
        mcq: 15,
        subjective: 10,
        coding: 5
      }
    };

    setGeneratedData(mockData);
    setRequiredSkills(mockData.skills);
    setLoading(false);
    setStep(2);
  };

  const handleCreateAssessment = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    saveAssessment({
      id: Date.now().toString(),
      title: assessmentTitle || generatedData?.role || 'Untitled Assessment',
      role: generatedData?.role || assessmentTitle,
      company: user.name || 'Recruiter',
      duration,
      questions: (generatedData?.questions?.mcq || 0) + (generatedData?.questions?.subjective || 0) + (generatedData?.questions?.coding || 0),
      status: 'active',
      createdAt: new Date().toISOString(),
      avgScore: 0,
      requiredSkills: requiredSkills.length ? requiredSkills : (generatedData?.skills || []),
      minExperience,
      minMatchScore,
      includeInterview
    });
    setLoading(false);
    navigate('/recruiter');
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (requiredSkills.some(skill => skill.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setRequiredSkills([...requiredSkills, trimmed]);
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter(item => item !== skill));
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

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Assessment</h1>
          <p className="text-gray-600">AI will generate role-specific questions from your job description</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-semibold`}>
              1
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-semibold`}>
              2
            </div>
            <div className={`w-24 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-semibold`}>
              3
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
            <div className="flex items-center space-x-2 mb-6">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Step 1: Job Description</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Assessment Title
                </label>
                <input
                  type="text"
                  value={assessmentTitle}
                  onChange={(e) => setAssessmentTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="e.g., Senior Frontend Developer"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paste Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  rows={12}
                  placeholder="Paste your complete job description here. Include required skills, experience level, responsibilities, and qualifications. Our AI will analyze it to generate relevant assessment questions."
                  required
                />
              </div>
              <button
                onClick={handleAnalyzeJD}
                disabled={!jobDescription || !assessmentTitle || loading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-5 h-5" />
                <span>{loading ? 'Analyzing...' : 'Analyze with AI'}</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && generatedData && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-xl">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="w-6 h-6" />
                <h2 className="text-xl font-bold">AI Analysis Complete</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-blue-100 text-sm mb-1">Role Detected</div>
                  <div className="text-xl font-bold">{generatedData.role}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-blue-100 text-sm mb-1">Experience Level</div>
                  <div className="text-xl font-bold">{generatedData.experience}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-blue-100 text-sm mb-1">Skills Identified</div>
                  <div className="text-xl font-bold">{generatedData.skills.length}</div>
                </div>
              </div>
              <div className="mt-6">
                <div className="text-blue-100 text-sm mb-2">Key Skills</div>
                <div className="flex flex-wrap gap-2">
                  {generatedData.skills.map((skill: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Configure Assessment</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Required Skills (for AI shortlisting)
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Add a skill and press Enter"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {requiredSkills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => handleRemoveSkill(skill)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-medium hover:bg-blue-100"
                        type="button"
                      >
                        {skill} ✕
                      </button>
                    ))}
                    {requiredSkills.length === 0 && (
                      <span className="text-sm text-gray-500">No skills added yet</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Minimum Experience Required (years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={minExperience}
                    onChange={(e) => setMinExperience(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Minimum Match Score for Shortlisting ({minMatchScore}%)
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={5}
                    value={minMatchScore}
                    onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Assessment Duration (minutes)
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="180"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>30 min</span>
                    <span className="font-semibold text-blue-600">{duration} minutes</span>
                    <span>180 min</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`p-4 border-2 rounded-lg transition ${
                          difficulty === level
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-semibold capitalize">{level}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Question Breakdown
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-blue-600 text-sm mb-1">Multiple Choice</div>
                      <div className="text-2xl font-bold text-gray-900">{generatedData.questions.mcq}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-green-600 text-sm mb-1">Subjective</div>
                      <div className="text-2xl font-bold text-gray-900">{generatedData.questions.subjective}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="text-purple-600 text-sm mb-1">Coding</div>
                      <div className="text-2xl font-bold text-gray-900">{generatedData.questions.coding}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">Include AI Interview</div>
                    <div className="text-sm text-gray-600">AI will conduct technical interview after assessment</div>
                  </div>
                  <button
                    onClick={() => setIncludeInterview(!includeInterview)}
                    className={`relative w-14 h-8 rounded-full transition ${
                      includeInterview ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition transform ${
                      includeInterview ? 'translate-x-6' : 'translate-x-0'
                    }`}></div>
                  </button>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateAssessment}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Assessment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
