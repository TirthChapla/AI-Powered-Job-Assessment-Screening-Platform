import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, LogOut, Upload, Zap } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { Assessment, Application, evaluateApplication, getAssessments, saveApplication } from '../data/storage';

interface User {
  id: string;
  email: string;
  role: 'recruiter' | 'candidate';
  name: string;
}

interface ApplyAssessmentProps {
  user: User;
  onLogout: () => void;
}

export default function ApplyAssessment({ user, onLogout }: ApplyAssessmentProps) {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const assessment = getAssessments().find(item => item.id === assessmentId) as Assessment | undefined;

  const [formName, setFormName] = useState(user.name || '');
  const [formEmail, setFormEmail] = useState(user.email || '');
  const [formExperience, setFormExperience] = useState(2);
  const [formSkills, setFormSkills] = useState('');
  const [formResume, setFormResume] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">Assessment Not Found</div>
          <p className="text-gray-600 mb-6">The assessment you are trying to apply for does not exist.</p>
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

  const handleApply = () => {
    if (!formName.trim() || !formEmail.trim()) {
      setFormError('Please fill all required fields.');
      return;
    }

    if (!resumeFile) {
      setFormError('Please upload your resume in PDF format.');
      return;
    }

    const skillList = formSkills.split(',').map(skill => skill.trim()).filter(Boolean);
    if (skillList.length === 0) {
      setFormError('Please add at least one skill.');
      return;
    }

    const evaluation = evaluateApplication({
      skills: skillList,
      experienceYears: formExperience,
      assessment
    });

    const application: Application = {
      id: Date.now().toString(),
      assessmentId: assessment.id,
      candidateId: user.id,
      name: formName,
      email: formEmail,
      experienceYears: formExperience,
      skills: skillList,
      resumeSummary: formResume.trim() || undefined,
      resumeFileName: resumeFile.name,
      status: evaluation.status,
      score: evaluation.score,
      createdAt: new Date().toISOString()
    };

    saveApplication(application);
    navigate('/candidate');
  };

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

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Apply for {assessment.title}</h1>
              <p className="text-gray-600">Provide required details for AI shortlisting.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Experience (years)</label>
              <input
                type="number"
                min={0}
                max={20}
                value={formExperience}
                onChange={(e) => setFormExperience(Math.max(0, Number(e.target.value)))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Skills (comma separated)</label>
              <input
                value={formSkills}
                onChange={(e) => setFormSkills(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="React, TypeScript, Node.js"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Resume (PDF only)</label>
              <div className="flex items-center space-x-3">
                <label className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.type !== 'application/pdf') {
                        setFormError('Only PDF files are allowed.');
                        setResumeFile(null);
                        return;
                      }
                      setFormError('');
                      setResumeFile(file);
                    }}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-gray-600">{resumeFile ? resumeFile.name : 'No file chosen'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Max size 5MB. PDF only.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Resume Summary (optional)</label>
              <textarea
                value={formResume}
                onChange={(e) => setFormResume(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="Brief summary of your experience"
              />
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {formError}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={() => navigate('/candidate')}
              className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition shadow-md hover:shadow-lg"
            >
              Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
