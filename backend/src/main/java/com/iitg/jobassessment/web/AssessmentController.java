package com.iitg.jobassessment.web;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iitg.jobassessment.entity.Assessment;
import com.iitg.jobassessment.entity.AssessmentCompletion;
import com.iitg.jobassessment.entity.AssessmentStatus;
import com.iitg.jobassessment.entity.AssessmentSubmission;
import com.iitg.jobassessment.entity.Application;
import com.iitg.jobassessment.entity.ApplicationStatus;
import com.iitg.jobassessment.entity.InterviewCompletion;
import com.iitg.jobassessment.entity.QuestionConfig;
import com.iitg.jobassessment.entity.User;
import com.iitg.jobassessment.repository.AssessmentCompletionRepository;
import com.iitg.jobassessment.repository.ApplicationRepository;
import com.iitg.jobassessment.repository.AssessmentRepository;
import com.iitg.jobassessment.repository.AssessmentSubmissionRepository;
import com.iitg.jobassessment.repository.InterviewCompletionRepository;
import com.iitg.jobassessment.repository.UserRepository;
import com.iitg.jobassessment.web.dto.assessment.ApplyAssessmentRequest;
import com.iitg.jobassessment.web.dto.assessment.ApplicationResponse;
import com.iitg.jobassessment.web.dto.assessment.AssessmentAnalyticsResponse;
import com.iitg.jobassessment.web.dto.assessment.AssessmentDetailsResponse;
import com.iitg.jobassessment.web.dto.assessment.AssessmentListItemResponse;
import com.iitg.jobassessment.web.dto.assessment.AssessmentQuestionResponse;
import com.iitg.jobassessment.web.dto.assessment.AssessmentResponse;
import com.iitg.jobassessment.web.dto.assessment.AssessmentSubmissionResponse;
import com.iitg.jobassessment.web.dto.assessment.CompletionRequest;
import com.iitg.jobassessment.web.dto.assessment.CreateAssessmentRequest;
import com.iitg.jobassessment.web.dto.assessment.QuestionConfigRequest;
import com.iitg.jobassessment.web.dto.assessment.ScoreDistributionEntry;
import com.iitg.jobassessment.web.dto.assessment.SubmitAssessmentRequest;
import com.iitg.jobassessment.web.dto.assessment.TestCaseResponse;
import com.iitg.jobassessment.web.dto.assessment.TopCandidateEntry;
import com.iitg.jobassessment.web.dto.assessment.UpdateAssessmentRequest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.Comparator;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/assessments")
public class AssessmentController {
    private final AssessmentRepository assessmentRepository;
    private final ApplicationRepository applicationRepository;
    private final AssessmentSubmissionRepository assessmentSubmissionRepository;
    private final AssessmentCompletionRepository assessmentCompletionRepository;
    private final InterviewCompletionRepository interviewCompletionRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AssessmentController(AssessmentRepository assessmentRepository,
                                ApplicationRepository applicationRepository,
                                AssessmentSubmissionRepository assessmentSubmissionRepository,
                                AssessmentCompletionRepository assessmentCompletionRepository,
                                InterviewCompletionRepository interviewCompletionRepository,
                                UserRepository userRepository,
                                ObjectMapper objectMapper) {
        this.assessmentRepository = assessmentRepository;
        this.applicationRepository = applicationRepository;
        this.assessmentSubmissionRepository = assessmentSubmissionRepository;
        this.assessmentCompletionRepository = assessmentCompletionRepository;
        this.interviewCompletionRepository = interviewCompletionRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResponseEntity<List<AssessmentListItemResponse>> list() {
        List<AssessmentListItemResponse> response = assessmentRepository.findAll().stream()
            .map(assessment -> new AssessmentListItemResponse(
                assessment.getId().toString(),
                assessment.getTitle(),
                assessment.getRole(),
                assessment.getCompany(),
                assessment.getStatus().name().toLowerCase(Locale.ROOT),
                assessment.getDuration(),
                assessment.getQuestions(),
                assessment.getIncludeInterview(),
                assessment.getCreatedAt() != null ? assessment.getCreatedAt().toString() : null
            ))
            .toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<AssessmentResponse> create(@RequestBody CreateAssessmentRequest request) {
        Assessment assessment = new Assessment();
        assessment.setTitle(request.title());
        assessment.setRole(request.role());
        assessment.setCompany(request.company());
        assessment.setDescription(request.description());
        assessment.setDuration(request.duration());
        assessment.setQuestions(request.questions());
        assessment.setStatus(AssessmentStatus.ACTIVE);
        assessment.setAvgScore(0);
        assessment.setMinExperience(request.minExperience() != null ? request.minExperience() : 0);
        assessment.setMinMatchScore(request.minMatchScore() != null ? request.minMatchScore() : 0);
        assessment.setIncludeInterview(request.includeInterview() != null ? request.includeInterview() : Boolean.TRUE);

        List<String> skills = request.requiredSkills() != null ? request.requiredSkills() : new ArrayList<>();
        assessment.setRequiredSkills(skills);

        QuestionConfigRequest configRequest = request.questionConfig();
        if (configRequest != null) {
            QuestionConfig config = new QuestionConfig();
            config.setMcqCount(configRequest.mcqCount());
            config.setMcqTimeMinutes(configRequest.mcqTimeMinutes());
            config.setDescriptiveCount(configRequest.descriptiveCount());
            config.setDescriptiveTimeMinutes(configRequest.descriptiveTimeMinutes());
            config.setDsaCount(configRequest.dsaCount());
            config.setDsaTimeMinutes(configRequest.dsaTimeMinutes());
            assessment.setQuestionConfig(config);
        }

        Assessment saved = assessmentRepository.save(assessment);
        return ResponseEntity.ok(new AssessmentResponse(saved.getId().toString()));
    }

    @GetMapping("/{assessmentId}")
    public ResponseEntity<AssessmentDetailsResponse> getById(@PathVariable String assessmentId) {
        Assessment assessment = assessmentRepository.findById(parseId(assessmentId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));
        return ResponseEntity.ok(toDetailsResponse(assessment));
    }

    @PatchMapping("/{assessmentId}")
    public ResponseEntity<AssessmentDetailsResponse> update(@PathVariable String assessmentId,
                                                            @RequestBody UpdateAssessmentRequest request) {
        Assessment assessment = assessmentRepository.findById(parseId(assessmentId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));

        if (request.title() != null) assessment.setTitle(request.title());
        if (request.role() != null) assessment.setRole(request.role());
        if (request.company() != null) assessment.setCompany(request.company());
        if (request.description() != null) assessment.setDescription(request.description());
        if (request.status() != null) {
            assessment.setStatus(parseStatus(request.status()));
        }
        if (request.duration() != null) assessment.setDuration(request.duration());
        if (request.requiredSkills() != null) assessment.setRequiredSkills(request.requiredSkills());
        if (request.minExperience() != null) assessment.setMinExperience(request.minExperience());
        if (request.minMatchScore() != null) assessment.setMinMatchScore(request.minMatchScore());
        if (request.includeInterview() != null) assessment.setIncludeInterview(request.includeInterview());

        Assessment saved = assessmentRepository.save(assessment);
        return ResponseEntity.ok(toDetailsResponse(saved));
    }

    @GetMapping("/{assessmentId}/applications")
    public ResponseEntity<List<ApplicationResponse>> getApplications(@PathVariable String assessmentId) {
        List<ApplicationResponse> applications = applicationRepository.findByAssessmentId(parseId(assessmentId))
            .stream()
            .map(application -> new ApplicationResponse(
                application.getId().toString(),
                application.getAssessment().getId().toString(),
                application.getCandidate().getId().toString(),
                application.getName(),
                application.getEmail(),
                application.getExperienceYears(),
                application.getSkills(),
                application.getResumeSummary(),
                application.getResumeFileName(),
                application.getStatus().name().toLowerCase(Locale.ROOT),
                application.getScore(),
                application.getCreatedAt() != null ? application.getCreatedAt().toString() : null
            ))
            .toList();
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/{assessmentId}/applications/{candidateId}")
    public ResponseEntity<ApplicationResponse> getApplicationForCandidate(@PathVariable String assessmentId,
                                                                          @PathVariable String candidateId) {
        Application application = applicationRepository
            .findByAssessmentIdAndCandidateId(parseId(assessmentId), parseId(candidateId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        return ResponseEntity.ok(toApplicationResponse(application));
    }

    @GetMapping("/{assessmentId}/submissions")
    public ResponseEntity<List<AssessmentSubmissionResponse>> getSubmissions(@PathVariable String assessmentId) {
        List<AssessmentSubmission> submissions = assessmentSubmissionRepository.findByAssessmentId(parseId(assessmentId));
        List<AssessmentSubmissionResponse> response = submissions.stream()
            .map(this::toSubmissionResponse)
            .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{assessmentId}/submissions/{candidateId}")
    public ResponseEntity<AssessmentSubmissionResponse> getSubmissionForCandidate(@PathVariable String assessmentId,
                                                                                  @PathVariable String candidateId) {
        AssessmentSubmission submission = assessmentSubmissionRepository
            .findByAssessmentIdAndCandidateId(parseId(assessmentId), parseId(candidateId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
        return ResponseEntity.ok(toSubmissionResponse(submission));
    }

    @GetMapping("/{assessmentId}/analytics")
    public ResponseEntity<AssessmentAnalyticsResponse> getAnalytics(@PathVariable String assessmentId) {
        UUID id = parseId(assessmentId);
        Assessment assessment = assessmentRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));

        List<Application> applications = applicationRepository.findByAssessmentId(id);
        List<AssessmentSubmission> submissions = assessmentSubmissionRepository.findByAssessmentId(id);

        int totalCandidates = applications.size();
        int averageScore = submissions.isEmpty()
            ? 0
            : (int) Math.round(submissions.stream().mapToInt(AssessmentSubmission::getScore).average().orElse(0));
        int topScore = submissions.stream().mapToInt(AssessmentSubmission::getScore).max().orElse(0);

        List<ScoreDistributionEntry> distribution = buildScoreDistribution(submissions);
        List<TopCandidateEntry> topCandidates = buildTopCandidates(submissions, applications);

        AssessmentAnalyticsResponse response = new AssessmentAnalyticsResponse(
            assessment.getId().toString(),
            assessment.getTitle(),
            totalCandidates,
            averageScore,
            topScore,
            0,
            distribution,
            topCandidates
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{assessmentId}/applications")
    public ResponseEntity<ApplicationResponse> apply(@PathVariable String assessmentId,
                                                     @RequestBody ApplyAssessmentRequest request) {
        Assessment assessment = assessmentRepository.findById(parseId(assessmentId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));

        if (request.candidateId() == null || request.candidateId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Candidate id is required");
        }

        UUID candidateId = parseId(request.candidateId());
        User candidate = userRepository.findById(candidateId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Candidate not found"));

        Application application = applicationRepository.findByAssessmentIdAndCandidateId(assessment.getId(), candidateId)
            .orElseGet(Application::new);

        application.setAssessment(assessment);
        application.setCandidate(candidate);
        application.setName(request.name());
        application.setEmail(request.email());
        application.setExperienceYears(request.experienceYears() != null ? request.experienceYears() : 0);
        application.setSkills(request.skills() != null ? request.skills() : new ArrayList<>());
        application.setResumeSummary(request.resumeSummary());
        application.setResumeFileName(request.resumeFileName());

        int score = computeScore(assessment, application.getSkills(), application.getExperienceYears());
        application.setScore(score);
        ApplicationStatus status = score >= assessment.getMinMatchScore() ? ApplicationStatus.SHORTLISTED : ApplicationStatus.REJECTED;
        application.setStatus(status);

        Application saved = applicationRepository.save(application);
        return ResponseEntity.ok(toApplicationResponse(saved));
    }

    @PostMapping("/{assessmentId}/submissions")
    public ResponseEntity<AssessmentSubmissionResponse> submitAssessment(@PathVariable String assessmentId,
                                                                         @RequestBody SubmitAssessmentRequest request) {
        Assessment assessment = assessmentRepository.findById(parseId(assessmentId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));

        if (request.candidateId() == null || request.candidateId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Candidate id is required");
        }

        User candidate = userRepository.findById(parseId(request.candidateId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Candidate not found"));

        AssessmentSubmission submission = assessmentSubmissionRepository
            .findByAssessmentIdAndCandidateId(assessment.getId(), candidate.getId())
            .orElseGet(AssessmentSubmission::new);

        submission.setAssessment(assessment);
        submission.setCandidate(candidate);
        submission.setQuestionsJson(writeJson(request.questions()));
        submission.setAnswersJson(writeJson(request.answers()));

        int score = computeSubmissionScore(request.questions(), request.answers());
        submission.setScore(score);
        submission.setResult(score >= 60 ? com.iitg.jobassessment.entity.SubmissionResult.PASSED
            : com.iitg.jobassessment.entity.SubmissionResult.FAILED);

        AssessmentSubmission saved = assessmentSubmissionRepository.save(submission);

        assessmentCompletionRepository.findByAssessmentIdAndCandidateId(assessment.getId(), candidate.getId())
            .orElseGet(() -> {
                AssessmentCompletion completion = new AssessmentCompletion();
                completion.setAssessment(assessment);
                completion.setCandidate(candidate);
                return assessmentCompletionRepository.save(completion);
            });

        return ResponseEntity.ok(toSubmissionResponse(saved));
    }

    @GetMapping("/{assessmentId}/completions/{candidateId}")
    public ResponseEntity<Map<String, Boolean>> getAssessmentCompletion(@PathVariable String assessmentId,
                                                                        @PathVariable String candidateId) {
        boolean completed = assessmentCompletionRepository
            .findByAssessmentIdAndCandidateId(parseId(assessmentId), parseId(candidateId))
            .isPresent();
        return ResponseEntity.ok(Collections.singletonMap("completed", completed));
    }

    @PostMapping("/{assessmentId}/completions")
    public ResponseEntity<Map<String, Boolean>> markAssessmentCompletion(@PathVariable String assessmentId,
                                                                         @RequestBody CompletionRequest request) {
        Assessment assessment = assessmentRepository.findById(parseId(assessmentId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));
        UUID candidateId = parseId(request.candidateId());
        User candidate = userRepository.findById(candidateId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Candidate not found"));

        assessmentCompletionRepository.findByAssessmentIdAndCandidateId(assessment.getId(), candidateId)
            .orElseGet(() -> {
                AssessmentCompletion completion = new AssessmentCompletion();
                completion.setAssessment(assessment);
                completion.setCandidate(candidate);
                return assessmentCompletionRepository.save(completion);
            });
        return ResponseEntity.ok(Collections.singletonMap("completed", true));
    }

    @GetMapping("/{assessmentId}/interview-completions/{candidateId}")
    public ResponseEntity<Map<String, Boolean>> getInterviewCompletion(@PathVariable String assessmentId,
                                                                       @PathVariable String candidateId) {
        boolean completed = interviewCompletionRepository
            .findByAssessmentIdAndCandidateId(parseId(assessmentId), parseId(candidateId))
            .isPresent();
        return ResponseEntity.ok(Collections.singletonMap("completed", completed));
    }

    @PostMapping("/{assessmentId}/interview-completions")
    public ResponseEntity<Map<String, Boolean>> markInterviewCompletion(@PathVariable String assessmentId,
                                                                        @RequestBody CompletionRequest request) {
        Assessment assessment = assessmentRepository.findById(parseId(assessmentId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));
        UUID candidateId = parseId(request.candidateId());
        User candidate = userRepository.findById(candidateId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Candidate not found"));

        interviewCompletionRepository.findByAssessmentIdAndCandidateId(assessment.getId(), candidateId)
            .orElseGet(() -> {
                InterviewCompletion completion = new InterviewCompletion();
                completion.setAssessment(assessment);
                completion.setCandidate(candidate);
                return interviewCompletionRepository.save(completion);
            });
        return ResponseEntity.ok(Collections.singletonMap("completed", true));
    }

    @GetMapping("/{assessmentId}/questions")
    public ResponseEntity<List<AssessmentQuestionResponse>> getQuestions(@PathVariable String assessmentId) {
        Assessment assessment = assessmentRepository.findById(parseId(assessmentId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));
        return ResponseEntity.ok(generateQuestions(assessment));
    }

    private AssessmentDetailsResponse toDetailsResponse(Assessment assessment) {
        return new AssessmentDetailsResponse(
            assessment.getId().toString(),
            assessment.getTitle(),
            assessment.getRole(),
            assessment.getCompany(),
            assessment.getDescription(),
            assessment.getStatus().name().toLowerCase(Locale.ROOT),
            assessment.getDuration(),
            assessment.getRequiredSkills(),
            assessment.getMinExperience(),
            assessment.getMinMatchScore(),
            assessment.getIncludeInterview(),
            assessment.getCreatedAt() != null ? assessment.getCreatedAt().toString() : null
        );
    }

    private AssessmentSubmissionResponse toSubmissionResponse(AssessmentSubmission submission) {
        List<Map<String, Object>> questions = readJsonList(submission.getQuestionsJson());
        Map<String, Object> answers = readJsonMap(submission.getAnswersJson());
        return new AssessmentSubmissionResponse(
            submission.getAssessment().getId().toString(),
            submission.getCandidate().getId().toString(),
            questions,
            answers,
            submission.getScore(),
            submission.getResult().name().toLowerCase(Locale.ROOT),
            submission.getSubmittedAt() != null ? submission.getSubmittedAt().toString() : null
        );
    }

    private String writeJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return null;
        }
    }

    private int computeSubmissionScore(List<Map<String, Object>> questions, Map<String, Object> answers) {
        if (questions == null || questions.isEmpty() || answers == null) return 0;
        int totalMcq = 0;
        int correct = 0;
        for (Map<String, Object> question : questions) {
            String type = String.valueOf(question.getOrDefault("type", ""));
            if (!"mcq".equalsIgnoreCase(type)) continue;
            totalMcq++;
            String id = String.valueOf(question.get("id"));
            String correctAnswer = question.get("correctAnswer") != null
                ? String.valueOf(question.get("correctAnswer"))
                : null;
            Object answer = answers.get(id);
            if (correctAnswer != null && answer != null && correctAnswer.equalsIgnoreCase(String.valueOf(answer))) {
                correct++;
            }
        }
        if (totalMcq == 0) return 0;
        return (int) Math.round(((double) correct / (double) totalMcq) * 100.0);
    }

    private List<ScoreDistributionEntry> buildScoreDistribution(List<AssessmentSubmission> submissions) {
        int[] buckets = new int[5];
        for (AssessmentSubmission submission : submissions) {
            int score = submission.getScore();
            if (score <= 20) buckets[0]++;
            else if (score <= 40) buckets[1]++;
            else if (score <= 60) buckets[2]++;
            else if (score <= 80) buckets[3]++;
            else buckets[4]++;
        }
        return List.of(
            new ScoreDistributionEntry("0-20", buckets[0]),
            new ScoreDistributionEntry("21-40", buckets[1]),
            new ScoreDistributionEntry("41-60", buckets[2]),
            new ScoreDistributionEntry("61-80", buckets[3]),
            new ScoreDistributionEntry("81-100", buckets[4])
        );
    }

    private List<TopCandidateEntry> buildTopCandidates(List<AssessmentSubmission> submissions, List<Application> applications) {
        List<AssessmentSubmission> sorted = submissions.stream()
            .sorted(Comparator.comparingInt(AssessmentSubmission::getScore).reversed())
            .limit(5)
            .toList();

        List<TopCandidateEntry> entries = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            AssessmentSubmission submission = sorted.get(i);
            String candidateId = submission.getCandidate().getId().toString();
            Application application = applications.stream()
                .filter(app -> app.getCandidate().getId().toString().equals(candidateId))
                .findFirst()
                .orElse(null);
            String name = application != null ? application.getName() : "Candidate";
            String email = application != null ? application.getEmail() : "-";
            entries.add(new TopCandidateEntry(i + 1, candidateId, name, email, submission.getScore()));
        }
        return entries;
    }

    private List<AssessmentQuestionResponse> generateQuestions(Assessment assessment) {
        QuestionConfig config = assessment.getQuestionConfig();
        int mcqCount = config != null && config.getMcqCount() != null ? config.getMcqCount() : 5;
        int descriptiveCount = config != null && config.getDescriptiveCount() != null ? config.getDescriptiveCount() : 3;
        int dsaCount = config != null && config.getDsaCount() != null ? config.getDsaCount() : 2;

        List<AssessmentQuestionResponse> questions = new ArrayList<>();
        AtomicInteger index = new AtomicInteger(1);

        for (int i = 0; i < mcqCount; i++) {
            int id = index.getAndIncrement();
            questions.add(new AssessmentQuestionResponse(
                String.valueOf(id),
                "mcq",
                "Sample MCQ question " + id,
                List.of("Option A", "Option B", "Option C", "Option D"),
                "Option A",
                Collections.emptyList()
            ));
        }

        for (int i = 0; i < descriptiveCount; i++) {
            int id = index.getAndIncrement();
            questions.add(new AssessmentQuestionResponse(
                String.valueOf(id),
                "subjective",
                "Sample descriptive question " + id,
                Collections.emptyList(),
                null,
                Collections.emptyList()
            ));
        }

        for (int i = 0; i < dsaCount; i++) {
            int id = index.getAndIncrement();
            questions.add(new AssessmentQuestionResponse(
                String.valueOf(id),
                "coding",
                "Sample coding question " + id,
                Collections.emptyList(),
                null,
                List.of(new TestCaseResponse("input", "output"))
            ));
        }

        return questions;
    }

    private ApplicationResponse toApplicationResponse(Application application) {
        return new ApplicationResponse(
            application.getId().toString(),
            application.getAssessment().getId().toString(),
            application.getCandidate().getId().toString(),
            application.getName(),
            application.getEmail(),
            application.getExperienceYears(),
            application.getSkills(),
            application.getResumeSummary(),
            application.getResumeFileName(),
            application.getStatus().name().toLowerCase(Locale.ROOT),
            application.getScore(),
            application.getCreatedAt() != null ? application.getCreatedAt().toString() : null
        );
    }

    private int computeScore(Assessment assessment, List<String> skills, int experienceYears) {
        List<String> normalizedSkills = skills.stream()
            .map(skill -> skill == null ? "" : skill.trim().toLowerCase(Locale.ROOT))
            .filter(skill -> !skill.isBlank())
            .toList();
        List<String> requiredSkills = assessment.getRequiredSkills().stream()
            .map(skill -> skill == null ? "" : skill.trim().toLowerCase(Locale.ROOT))
            .filter(skill -> !skill.isBlank())
            .toList();

        int matchedSkills = (int) requiredSkills.stream()
            .filter(normalizedSkills::contains)
            .count();

        double skillMatchScore = requiredSkills.isEmpty()
            ? 100.0
            : ((double) matchedSkills / (double) requiredSkills.size()) * 100.0;

        double experienceScore = assessment.getMinExperience() <= 0
            ? 100.0
            : Math.min(100.0, ((double) experienceYears / (double) assessment.getMinExperience()) * 100.0);

        return (int) Math.round(skillMatchScore * 0.7 + experienceScore * 0.3);
    }

    private List<Map<String, Object>> readJsonList(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }

    private Map<String, Object> readJsonMap(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            return Collections.emptyMap();
        }
    }

    private java.util.UUID parseId(String id) {
        try {
            return java.util.UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid id");
        }
    }

    private AssessmentStatus parseStatus(String status) {
        try {
            return AssessmentStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
        }
    }
}
