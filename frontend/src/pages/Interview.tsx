import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Zap, LogOut, MessageCircle, Send, Mic, MicOff, Brain, Clock } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { isAssessmentCompleted } from '../data/storage';

interface User {
  id: string;
  email: string;
  role: 'recruiter' | 'candidate';
  name: string;
}

interface InterviewProps {
  user: User;
  onLogout: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

export default function Interview({ user, onLogout }: InterviewProps) {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const isCompleted = assessmentId ? isAssessmentCompleted(assessmentId, user.id) : false;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const interviewQuestions = [
    'Tell me about your experience with React and how you\'ve used it in production applications.',
    'Can you explain the difference between controlled and uncontrolled components in React?',
    'Describe a challenging bug you encountered in a previous project and how you resolved it.',
    'How do you approach optimizing the performance of a React application?',
    'What\'s your experience with state management libraries like Redux or Context API?'
  ];

  useEffect(() => {
    if (!isCompleted) return;
    const initialMessage: Message = {
      id: '1',
      sender: 'ai',
      text: `Hello ${user.name}! I'm your AI interviewer. I'll be conducting a technical interview for the Senior Frontend Developer position. This interview will take approximately 20-30 minutes. Are you ready to begin?`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, user.name]);

  if (!isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">Interview Locked</div>
          <p className="text-gray-600 mb-6">
            Complete the assessment to unlock the AI interview.
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    let aiResponse = '';
    if (currentQuestion <= interviewQuestions.length) {
      aiResponse = `Thank you for that response. Let me ask you the next question: ${interviewQuestions[currentQuestion - 1]}`;
      setCurrentQuestion(currentQuestion + 1);
    } else {
      aiResponse = 'Thank you for completing the interview! Your responses have been recorded and will be evaluated. You should hear back from the recruiter within 2-3 business days.';
    }

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: aiResponse,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const handleEndInterview = () => {
    navigate('/candidate');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Zap className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">AI Technical Interview</div>
              <div className="text-sm text-gray-600">Senior Frontend Developer</div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-mono text-lg font-semibold text-blue-600">{formatTime(timeElapsed)}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <div>
              <div className="font-semibold text-gray-900">AI Interview in Progress</div>
              <div className="text-sm text-gray-600">Question {Math.min(currentQuestion, interviewQuestions.length)} of {interviewQuestions.length}</div>
            </div>
          </div>
          <button
            onClick={handleEndInterview}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition shadow-md hover:shadow-lg"
          >
            End Interview
          </button>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-2xl ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender === 'ai' && (
                      <>
                        <Brain className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">AI Interviewer</span>
                      </>
                    )}
                    {message.sender === 'user' && (
                      <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                    )}
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      message.sender === 'ai'
                        ? 'bg-blue-50 border border-blue-200 text-gray-900'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="leading-relaxed">{message.text}</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-2xl">
                  <div className="flex items-center space-x-2 mb-1">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900">AI Interviewer</span>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`p-3 rounded-lg transition ${
                  isRecording
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your answer here..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {isRecording ? (
                <span className="text-red-600 font-semibold">Recording... Click the microphone to stop</span>
              ) : (
                'Press Enter to send or click the microphone to use voice'
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <div className="font-semibold mb-1">Interview Tips</div>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Take your time to think before answering</li>
                <li>Provide specific examples from your experience</li>
                <li>Ask clarifying questions if needed</li>
                <li>Be honest about what you know and don't know</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
