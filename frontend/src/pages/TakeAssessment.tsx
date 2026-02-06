import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Zap, LogOut, Clock, ChevronLeft, ChevronRight, CheckCircle, Code, FileText, List } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { getApplicationForCandidate, getAssessments, markAssessmentCompleted } from '../data/storage';
import ThemeToggle from '../components/ThemeToggle';

interface User {
  id: string;
  email: string;
  role: 'recruiter' | 'candidate';
  name: string;
}

interface TakeAssessmentProps {
  user: User;
  onLogout: () => void;
}

interface Question {
  id: string;
  type: 'mcq' | 'subjective' | 'coding';
  question: string;
  options?: string[];
  correctAnswer?: string;
  testCases?: { input: string; output: string }[];
}

export default function TakeAssessment({ user, onLogout }: TakeAssessmentProps) {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const assessment = getAssessments().find(item => item.id === assessmentId);
  const application = assessmentId ? getApplicationForCandidate(assessmentId, user.id) : undefined;

  if (!assessment || !application || application.status !== 'shortlisted') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</div>
          <p className="text-gray-600 mb-6">
            Only shortlisted candidates can start this assessment. Please apply and get shortlisted first.
          </p>
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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(5400);
  const [code, setCode] = useState('// Write your code here\n');

  const mockQuestions: Question[] = [
    {
      id: '1',
      type: 'mcq',
      question: 'What is the purpose of React hooks?',
      options: [
        'To add state and lifecycle features to functional components',
        'To style React components',
        'To handle routing in React',
        'To manage API calls'
      ]
    },
    {
      id: '2',
      type: 'mcq',
      question: 'Which of the following is a valid way to update state in React?',
      options: [
        'this.state.value = newValue',
        'setState({value: newValue})',
        'updateState(newValue)',
        'state.value = newValue'
      ]
    },
    {
      id: '3',
      type: 'subjective',
      question: 'Explain the concept of Virtual DOM in React and how it improves performance.'
    },
    {
      id: '4',
      type: 'subjective',
      question: 'Describe the differences between REST and GraphQL APIs. When would you choose one over the other?'
    },
    {
      id: '5',
      type: 'coding',
      question: 'Write a function that reverses a string without using built-in reverse methods.',
      testCases: [
        { input: 'hello', output: 'olleh' },
        { input: 'world', output: 'dlrow' }
      ]
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = () => {
    if (assessmentId) {
      markAssessmentCompleted(assessmentId, user.id);
    }
    navigate('/candidate');
  };

  const question = mockQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / mockQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Zap className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">Senior Frontend Developer</div>
              <div className="text-sm text-gray-600">Question {currentQuestion + 1} of {mockQuestions.length}</div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <ThemeToggle />
            <div className="flex items-center space-x-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="font-mono text-lg font-semibold text-orange-600">{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-200 h-2">
          <div className="bg-blue-600 h-2 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-3">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
              <div className="flex items-center space-x-2 mb-6">
                {question.type === 'mcq' && <List className="w-6 h-6 text-blue-600" />}
                {question.type === 'subjective' && <FileText className="w-6 h-6 text-green-600" />}
                {question.type === 'coding' && <Code className="w-6 h-6 text-purple-600" />}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  question.type === 'mcq' ? 'bg-blue-100 text-blue-700' :
                  question.type === 'subjective' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {question.type.toUpperCase()}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">{question.question}</h2>

              {question.type === 'mcq' && question.options && (
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(question.id, option)}
                      className={`w-full text-left p-4 border-2 rounded-lg transition ${
                        answers[question.id] === option
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          answers[question.id] === option
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {answers[question.id] === option && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="text-gray-900">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {question.type === 'subjective' && (
                <div>
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    rows={12}
                    placeholder="Type your answer here..."
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    {(answers[question.id] || '').length} characters
                  </div>
                </div>
              )}

              {question.type === 'coding' && (
                <div className="space-y-4">
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <Editor
                      height="400px"
                      defaultLanguage="javascript"
                      theme="vs-dark"
                      value={answers[question.id] || code}
                      onChange={(value) => handleAnswer(question.id, value || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true
                      }}
                    />
                  </div>
                  {question.testCases && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="font-semibold text-gray-900 mb-3">Test Cases:</div>
                      <div className="space-y-2">
                        {question.testCases.map((testCase, index) => (
                          <div key={index} className="bg-white p-3 rounded border border-gray-200 text-sm font-mono">
                            <div><span className="text-gray-600">Input:</span> {testCase.input}</div>
                            <div><span className="text-gray-600">Expected Output:</span> {testCase.output}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>
              {currentQuestion < mockQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-md hover:shadow-lg"
                >
                  <span>Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition shadow-md hover:shadow-lg"
                >
                  Submit Assessment
                </button>
              )}
            </div>
          </div>

          <div className="col-span-1">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sticky top-6">
              <h3 className="font-bold text-gray-900 mb-4">Question Overview</h3>
              <div className="grid grid-cols-5 gap-2">
                {mockQuestions.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`aspect-square flex items-center justify-center rounded-lg font-semibold text-sm transition ${
                      index === currentQuestion
                        ? 'bg-blue-600 text-white'
                        : answers[q.id]
                        ? 'bg-green-100 text-green-700 border-2 border-green-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Answered</span>
                  <span className="font-semibold text-green-600">{Object.keys(answers).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-semibold text-orange-600">{mockQuestions.length - Object.keys(answers).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
