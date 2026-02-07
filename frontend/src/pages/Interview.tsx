import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Zap, LogOut, Mic, MicOff, Brain, Clock, Video, VideoOff, PhoneCall, PhoneOff } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { getAssessmentCompletion, markInterviewCompletion } from '../data/api';

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

const useMockData = true;

const mockInterviewInfo = {
  role: 'Frontend Engineer',
  company: 'HireIQ Labs',
  assessmentTitle: 'AI Screening: Frontend Engineer',
  score: 92,
  interviewSlot: 'Feb 09, 2026 · 10:30 AM',
  focusAreas: ['React', 'TypeScript', 'Testing', 'Performance'],
  notes: 'Strong UI fundamentals. Probe advanced hooks and architecture choices.'
};

export default function Interview({ user, onLogout }: InterviewProps) {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [interviewRole, setInterviewRole] = useState(mockInterviewInfo.role);
  const [isInCall, setIsInCall] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamMuted, setIsCamMuted] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const interviewQuestions = [
    'Tell me about your experience with React and how you\'ve used it in production applications.',
    'Can you explain the difference between controlled and uncontrolled components in React?',
    'Describe a challenging bug you encountered in a previous project and how you resolved it.',
    'How do you approach optimizing the performance of a React application?',
    'What\'s your experience with state management libraries like Redux or Context API?'
  ];

  useEffect(() => {
    const loadCompletion = async () => {
      if (!assessmentId) return;
      try {
        setLoading(true);
        if (useMockData) {
          setIsCompleted(true);
          setInterviewRole(mockInterviewInfo.role);
          return;
        }
        const response = await getAssessmentCompletion(assessmentId, user.id);
        setIsCompleted(response.completed);
      } finally {
        setLoading(false);
      }
    };

    loadCompletion();
  }, [assessmentId, user.id]);

  useEffect(() => {
    if (!isCompleted) return;
    const initialMessage: Message = {
      id: '1',
      sender: 'ai',
      text: `Hello ${user.name}! I'm your AI interviewer. I'll be conducting a technical interview for the ${interviewRole} position. This interview will take approximately 20-30 minutes. Are you ready to begin?`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [interviewRole, isCompleted, user.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (mediaStream) {
      videoRef.current.srcObject = mediaStream;
    } else {
      videoRef.current.srcObject = null;
    }
  }, [mediaStream]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-gray-600">Loading interview...</div>
      </div>
    );
  }

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
    setIsInCall(false);
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    if (assessmentId) {
      markInterviewCompletion(assessmentId, user.id);
    }
    navigate('/candidate');
  };

  const handleStartInterview = async () => {
    try {
      setMediaError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      setIsMicMuted(false);
      setIsCamMuted(false);
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
      setIsInCall(true);
      setIsRecording(true);
    } catch {
      setMediaError('Camera and microphone access is required to start the interview.');
      setIsInCall(false);
      setIsRecording(false);
    }
  };

  const handleToggleMic = () => {
    setIsMicMuted((prev) => {
      const next = !prev;
      if (mediaStream) {
        mediaStream.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  };

  const handleToggleCam = () => {
    setIsCamMuted((prev) => {
      const next = !prev;
      if (mediaStream) {
        mediaStream.getVideoTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
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
              <div className="text-sm text-gray-600">{interviewRole}</div>
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
        <div className="mb-6 bg-white rounded-xl shadow-md border border-gray-100 p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-sm text-gray-500">Interview Brief</div>
              <div className="text-lg font-semibold text-gray-900">{mockInterviewInfo.assessmentTitle}</div>
              <div className="text-sm text-gray-600">{mockInterviewInfo.company}</div>
            </div>
            <div className="text-sm text-gray-600">Slot: {mockInterviewInfo.interviewSlot}</div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">AI Match Score</div>
              <div className="text-sm font-semibold text-gray-900">{mockInterviewInfo.score}%</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Focus Areas</div>
              <div className="text-sm text-gray-900">{mockInterviewInfo.focusAreas.join(', ')}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Notes</div>
              <div className="text-sm text-gray-900">{mockInterviewInfo.notes}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <div>
              <div className="font-semibold text-gray-900">AI Interview in Progress</div>
              <div className="text-sm text-gray-600">Question {Math.min(currentQuestion, interviewQuestions.length)} of {interviewQuestions.length}</div>
            </div>
          </div>
          {isInCall ? (
            <button
              onClick={handleEndInterview}
              className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition shadow-md hover:shadow-lg"
            >
              <PhoneOff className="w-5 h-5" />
              <span>End Interview</span>
            </button>
          ) : (
            <button
              onClick={handleStartInterview}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition shadow-md hover:shadow-lg"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Start Interview</span>
            </button>
          )}
        </div>

        {mediaError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {mediaError}
          </div>
        )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">AI Interviewer</span>
                </div>
                <span className="text-xs text-gray-500">Voice only</span>
              </div>
              <div className="h-56 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                AI voice channel ready
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>Status: {isInCall ? 'Live' : 'Idle'}</span>
                <span>Mic: {isRecording ? 'On' : 'Off'}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Candidate Video</span>
                </div>
                <span className="text-xs text-gray-500">Camera + mic</span>
              </div>
              <div className="h-56 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-500 overflow-hidden">
                {mediaStream ? (
                  <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                ) : (
                  <span>Camera preview will appear here</span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={handleToggleMic}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isMicMuted
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isMicMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                </button>
                <button
                  onClick={handleToggleCam}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isCamMuted
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isCamMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  <span>{isCamMuted ? 'Turn Camera On' : 'Turn Camera Off'}</span>
                </button>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
