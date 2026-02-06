export type AssessmentStatus = 'active' | 'draft' | 'closed';

export interface Assessment {
  id: string;
  title: string;
  role: string;
  company: string;
  duration: number;
  questions: number;
  status: AssessmentStatus;
  createdAt: string;
  avgScore: number;
  requiredSkills: string[];
  minExperience: number;
  minMatchScore: number;
  includeInterview: boolean;
}

export type ApplicationStatus = 'shortlisted' | 'rejected';

export interface Application {
  id: string;
  assessmentId: string;
  candidateId: string;
  name: string;
  email: string;
  experienceYears: number;
  skills: string[];
  resumeSummary?: string;
  resumeFileName?: string;
  status: ApplicationStatus;
  score: number;
  createdAt: string;
}

const ASSESSMENTS_KEY = 'assessments';
const APPLICATIONS_KEY = 'applications';
const COMPLETIONS_KEY = 'assessment-completions';

const readStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeStorage = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

type CompletionRecord = {
  assessmentId: string;
  candidateId: string;
  completedAt: string;
};

export const seedAssessments = () => {
  const existing = readStorage<Assessment[]>(ASSESSMENTS_KEY, []);
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  const seed: Assessment[] = [
    {
      id: '1',
      title: 'Senior Frontend Developer',
      role: 'React Developer',
      company: 'Tech Corp',
      duration: 90,
      questions: 45,
      status: 'active',
      createdAt: now,
      avgScore: 74,
      requiredSkills: ['React', 'TypeScript', 'REST APIs'],
      minExperience: 3,
      minMatchScore: 70,
      includeInterview: true
    },
    {
      id: '2',
      title: 'Full Stack Engineer',
      role: 'MERN Stack',
      company: 'StartupX',
      duration: 120,
      questions: 60,
      status: 'active',
      createdAt: now,
      avgScore: 68,
      requiredSkills: ['Node.js', 'React', 'MongoDB'],
      minExperience: 2,
      minMatchScore: 65,
      includeInterview: true
    },
    {
      id: '3',
      title: 'AI ML Engineer',
      role: 'AI ML Stack',
      company: 'AI-X',
      duration: 120,
      questions: 60,
      status: 'active',
      createdAt: now,
      avgScore: 68,
      requiredSkills: ['Python', 'Machine Learning', 'Data Analysis'],
      minExperience: 2,
      minMatchScore: 65,
      includeInterview: true
    },
    {
      id: '4',
      title: 'Backend Developer',
      role: 'Node.js',
      company: 'Cloud Systems',
      duration: 75,
      questions: 40,
      status: 'active',
      createdAt: now,
      avgScore: 71,
      requiredSkills: ['Node.js', 'SQL', 'APIs'],
      minExperience: 2,
      minMatchScore: 60,
      includeInterview: false
    }
  ];

  writeStorage(ASSESSMENTS_KEY, seed);
};

export const getAssessments = (): Assessment[] => {
  return readStorage<Assessment[]>(ASSESSMENTS_KEY, []);
};

export const saveAssessment = (assessment: Assessment): Assessment[] => {
  const assessments = getAssessments();
  const updated = [assessment, ...assessments];
  writeStorage(ASSESSMENTS_KEY, updated);
  return updated;
};

export const getApplications = (): Application[] => {
  return readStorage<Application[]>(APPLICATIONS_KEY, []);
};

export const getApplicationsForAssessment = (assessmentId: string): Application[] => {
  return getApplications().filter(app => app.assessmentId === assessmentId);
};

export const getApplicationForCandidate = (assessmentId: string, candidateId: string): Application | undefined => {
  return getApplications().find(app => app.assessmentId === assessmentId && app.candidateId === candidateId);
};

export const saveApplication = (application: Application): Application[] => {
  const applications = getApplications();
  const filtered = applications.filter(app => !(app.assessmentId === application.assessmentId && app.candidateId === application.candidateId));
  const updated = [application, ...filtered];
  writeStorage(APPLICATIONS_KEY, updated);
  return updated;
};

const getCompletions = (): CompletionRecord[] => {
  return readStorage<CompletionRecord[]>(COMPLETIONS_KEY, []);
};

export const markAssessmentCompleted = (assessmentId: string, candidateId: string) => {
  const completions = getCompletions();
  const exists = completions.some(item => item.assessmentId === assessmentId && item.candidateId === candidateId);
  if (exists) return;
  const updated = [
    { assessmentId, candidateId, completedAt: new Date().toISOString() },
    ...completions
  ];
  writeStorage(COMPLETIONS_KEY, updated);
};

export const isAssessmentCompleted = (assessmentId: string, candidateId: string) => {
  return getCompletions().some(item => item.assessmentId === assessmentId && item.candidateId === candidateId);
};

export const evaluateApplication = (params: {
  skills: string[];
  experienceYears: number;
  assessment: Assessment;
}) => {
  const normalizedSkills = params.skills.map(s => s.trim().toLowerCase()).filter(Boolean);
  const requiredSkills = params.assessment.requiredSkills.map(s => s.trim().toLowerCase()).filter(Boolean);
  const matchedSkills = requiredSkills.filter(skill => normalizedSkills.includes(skill)).length;
  const skillMatchScore = requiredSkills.length === 0 ? 100 : (matchedSkills / requiredSkills.length) * 100;
  const experienceScore = params.assessment.minExperience <= 0
    ? 100
    : Math.min(100, (params.experienceYears / params.assessment.minExperience) * 100);

  const finalScore = Math.round(skillMatchScore * 0.7 + experienceScore * 0.3);
  const status: ApplicationStatus = 'shortlisted';

  return { score: finalScore, status, skillMatchScore: Math.round(skillMatchScore), experienceScore: Math.round(experienceScore) };
};
