## Project Structure

```
AI-Powered-Job-Assessment-Screening-Platform/
├── models/
│   ├── __init__.py
│   ├── ai_resume_matcher.py          # Main AI module
│   └── tests/
│       ├── __init__.py
│       └── test_matching.py           # Unit tests
├── examples/
│   ├── __init__.py
│   └── run_example.py                # Quick example
└── README.md
```

## Running the Code

### 1. Main Model (ai_resume_matcher.py)
```bash
python AI-Powered-Job-Assessment-Screening-Platform/models/ai_resume_matcher.py
```

### 2. Examples
```bash
python AI-Powered-Job-Assessment-Screening-Platform/examples/run_example.py
```

### 3. Tests
```bash
python AI-Powered-Job-Assessment-Screening-Platform/models/tests/test_matching.py
```

## Key Files

- **ai_resume_matcher.py**: Core AI model for resume matching
- **run_example.py**: Simple example showing how to use the model
- **test_matching.py**: Unit tests for the module

## Usage

```python
from AI_Powered_Job_Assessment_Screening_Platform.models.ai_resume_matcher import match_resumes, load_model

# Load model
model = load_model()

# Match resumes
result = match_resumes(jd_text, resume_texts, model=model)
```
