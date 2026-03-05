# AI-Powered Job Assessment & Screening Platform

An intelligent hiring platform that automatically converts job descriptions into role-specific assessments and evaluates candidates using AI-driven scoring, coding tests, and skill analytics.

**Hire based on skills, not resumes.**

---

# Overview

Traditional hiring often depends on resumes, which can lead to fake claims, mass applications, and time-consuming manual screening.

This platform analyzes job descriptions, generates assessments automatically, evaluates candidates fairly, and ranks them using measurable performance.

In addition to written tests, the platform includes an **AI-powered Interview Engine** that conducts technical interviews automatically.  
The AI asks role-specific questions, evaluates responses (text or voice), and assigns scores similar to a real interviewer, enabling fully automated and unbiased candidate screening.

---

# Key Features

## Job Description Intelligence
- Parses job descriptions  
- Extracts required skills and tools  
- Detects experience level  
- Assigns difficulty and weightage  
- Converts requirements into assessment criteria  

## Automated Question Generation
- Objective questions (MCQs, aptitude)  
- Subjective questions (case studies, scenarios)  
- Programming challenges (coding, debugging, design)  
- Difficulty adjusts based on role and experience  

## Smart Candidate Evaluation
- Automatic MCQ grading  
- Coding judged using test cases  
- AI-based subjective scoring with rubrics  
- Weighted scoring based on skill importance  

## AI-Powered Interview
- AI automatically conducts technical interviews  
- Generates questions based on job description  
- Supports text or voice responses  
- Evaluates answers using AI scoring  
- Provides interview feedback and score breakdown  
- Reduces dependency on human interviewers  

## Anti-Fake Application Detection
- Resume vs performance mismatch detection  
- Guess/random attempt detection  
- Code plagiarism checks  
- Bot or repeated attempt detection  

## Scoring, Ranking & Leaderboards
- Overall score calculation  
- Section-wise performance analysis  
- Skill-wise breakdown  
- Candidate ranking and shortlisting  
- Configurable leaderboards  

## Analytics & Reports
- Strengths and weaknesses analysis  
- Skill gap identification  
- Benchmark comparison  
- Downloadable reports  

## Security & Scalability
- JWT authentication  
- Role-based access control  
- Encrypted data storage  
- Concurrent assessments support  
- Secure coding sandbox environment  

---

# Tech Stack

## Frontend
- React.js (.tsx)
- Tailwind CSS
- Monaco Editor
- Chart.js / Recharts

## Backend
- Spring Boot
- REST APIs
- JWT Authentication

## AI / NLP
- LLM / Gemini API
- Prompt-based job description parsing
- AI scoring for subjective answers
- AI-based interview evaluation

## Database
- MySQL / PostgreSQL

## Other Tools
- Redis
- Docker
- Judge0 or secure code execution sandbox

---


---

# Core Modules

1. JD Intelligence Engine  
2. Question Generator  
3. Assessment Engine  
4. AI Interview Engine  
5. Evaluation Engine  
6. Analytics Dashboard  

---

# Project Structure
ai-assessment-platform/
│
├── frontend/
├── backend/
├── ai-service/
├── database/
├── docs/
└── README.md


---

# Database Tables (Simplified)

- users  
- job_descriptions  
- assessments  
- questions  
- interview_sessions  
- submissions  
- scores  
- reports  

---

# Setup Instructions

## Backend
mvn clean install
mvn spring-boot:run

## Frontend

npm install
npm start


## Database

Create the database and import the schema before starting the backend service.

---
# Example Use Cases

- Automatically generate assessments for a MERN developer role  
- Evaluate thousands of candidates instantly  
- Detect fake skill claims  
- Rank top performers efficiently  
- Conduct automated AI interviews without human intervention  
---
# Sample Output
Overall Score: 82%

React: 90
Node.js: 75
MongoDB: 70
Interview Score: 85

Rank: 3 / 150


---

# AI Models Used

- Job description parsing  
- Question generation  
- Subjective answer grading  
- Similarity detection  
- AI interview evaluation  

---

# Fairness & Transparency

- Standardized scoring  
- Skill-weighted evaluation  
- Explainable reports  
- No resume-only filtering  

---

# Limitations

- AI grading may still require human review in edge cases  
- Coding sandbox requires resource control  
- LLM responses depend on prompt quality  

---

# Future Improvements

- Adaptive difficulty assessments  
- Video proctoring  
- Resume parsing and analysis  
- Real-time cheating detection  
- Multi-language coding support  
- Voice-based AI interviews  

---

# License

MIT License


# System Architecture

