# AI-Powered Job Assessment & Screening Platform

An intelligent hiring platform that automatically converts job descriptions into role-specific assessments and evaluates candidates using AI-driven scoring, coding tests, and skill analytics.

Hire based on skills, not resumes.

---

## Overview

Traditional hiring often depends on resumes, which leads to fake claims, mass applications, and time-consuming manual screening. This platform analyzes job descriptions, generates assessments automatically, evaluates candidates fairly, and ranks them using measurable performance.

In addition to written tests, the platform also features an **AI-powered Interview Engine** that automatically conducts technical interviews. The AI asks role-specific questions, evaluates answers (text or voice), and assigns scores just like a real interviewer, enabling fully automated and unbiased candidate screening.

---

## Key Features

### Job Description Intelligence
- Parses job descriptions
- Extracts required skills and tools
- Detects experience level
- Assigns difficulty and weightage
- Converts requirements into assessment criteria

### Automated Question Generation
- Objective questions (MCQs, aptitude)
- Subjective questions (case studies, scenarios)
- Programming challenges (coding, debugging, design)
- Difficulty adjusts based on role and experience

### Smart Candidate Evaluation
- Automatic MCQ grading
- Coding judged with test cases
- AI-based subjective scoring with rubrics
- Weighted scoring per skill importance

### AI-Powered Interview
- AI automatically conducts technical interviews
- Generates questions based on job description
- Supports text or voice responses
- Evaluates answers using AI scoring
- Provides interview feedback and score breakdown
- Reduces dependency on human interviewers

### Anti-Fake Application Detection
- Resume vs performance mismatch checks
- Guess/random attempt detection
- Code plagiarism checks
- Bot/repeated attempt detection

### Scoring, Ranking & Leaderboards
- Overall score
- Section-wise performance
- Skill-wise breakdown
- Ranking and shortlisting
- Configurable leaderboards

### Analytics & Reports
- Strengths and weaknesses
- Skill gap analysis
- Benchmark comparison
- Downloadable reports

### Security & Scalability
- JWT authentication
- Role-based access control
- Encrypted data
- Concurrent assessments support
- Secure coding sandbox

---

## Tech Stack

Frontend:
- React.js (.tsx)
- talwind CSS
- Monaco Editor
- Chart.js / Recharts

Backend:
- Spring Boot
- REST APIs
- JWT Authentication

AI / NLP:
- LLM or OpenAI API
- Prompt-based JD parsing
- AI scoring for subjective answers
- AI-based interview evaluation

Database:
- MySQL / PostgreSQL

Other:
- Redis
- Docker
- Judge0 or sandbox executor

---

## System Architecture

JD Upload → JD Parser → Question Generator → Assessment Engine → AI Interview Engine → Evaluation Engine → Scoring & Ranking → Recruiter Dashboard

---

## Core Modules

1. JD Intelligence Engine  
2. Question Generator  
3. Assessment Engine  
4. AI Interview Engine  
5. Evaluation Engine  
6. Analytics Dashboard  

---

## Project Structure

ai-assessment-platform/  
frontend/  
backend/  
ai-service/  
database/  
docs/  
README.md  

---

## Database Tables (Simplified)

- users
- job_descriptions
- assessments
- questions
- interview_sessions
- submissions
- scores
- reports

---

## Setup Instructions

### Backend

mvn clean install
mvn spring-boot:run

### Frontend

npm install
npm start

### Database
Create database and import schema

---

## Example Use Cases

- Generate MERN developer assessment automatically  
- Evaluate 1000 candidates instantly  
- Detect fake skill claims  
- Rank top performers  
- Conduct automated AI interviews without human intervention  

---

## Sample Output

Overall: 82%  
React: 90  
Node: 75  
MongoDB: 70  
Interview Score: 85  
Rank: 3/150  

---

## AI Models Used

- JD parsing
- Question generation
- Subjective grading
- Similarity detection
- AI interview evaluation

---

## Fairness & Transparency

- Standardized scoring
- Skill-weighted evaluation
- Explainable reports
- No resume-only filtering

---

## Limitations

- AI grading may require human review
- Coding sandbox needs resource control
- LLM responses depend on prompt quality

---

## Future Improvements

- Adaptive difficulty
- Video proctoring
- Resume parser
- Real-time cheating detection
- Multi-language coding
- Voice-based AI interviews

---

## License

MIT License

