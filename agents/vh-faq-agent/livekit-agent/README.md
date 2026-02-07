# VoiceHire Product Assistant Agent

An intelligent voice-powered product assistant built with LiveKit that provides comprehensive information about VoiceHire's AI-powered recruitment platform. This agent, named "Veeaa", conducts natural voice conversations to help users understand VoiceHire's features, pricing, implementation process, and capabilities.

## 🎯 Overview

The VoiceHire Product Assistant Agent is a sophisticated conversational AI that leverages LiveKit's real-time communication platform to provide voice-based product support. It combines advanced speech recognition, natural language processing, and a comprehensive knowledge base to deliver accurate, helpful responses about VoiceHire's services.

### Key Features

- **Natural Voice Conversations**: Seamless speech-to-speech interactions using advanced AI
- **Comprehensive Knowledge Base**: Detailed information about VoiceHire's platform, pricing, features, and implementation
- **Full Context Maintenance**: Maintains complete conversation context throughout the entire session
- **Real-Time Processing**: Instant responses with LiveKit's low-latency infrastructure
- **Single Conversation Flow**: Simplified interaction without complex stage management
- **Performance Monitoring**: Advanced logging and context size monitoring for optimal performance

## 🛠️ Dev Setup

Clone the repository and install dependencies to a virtual environment:

```console
# Linux/macOS
cd agents/vh-faq-agent/livekit-agent
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

<details>
  <summary>Windows instructions (click to expand)</summary>
  
```cmd
:: Windows (CMD/PowerShell)
cd agents\vh-faq-agent\livekit-agent
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
</details>

Set up the environment by copying `.env.example` to `.env.local` and filling in the required values:

- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `OPENAI_API_KEY`
- `DEEPGRAM_API_KEY`

You can also do this automatically using the LiveKit CLI:

```console
lk app env
```

Run the agent:

```console
python src/agent.py dev
```

This agent requires a frontend application to communicate with. You can use one of our example frontends in [livekit-examples](https://github.com/livekit-examples/), create your own following one of our [client quickstarts](https://docs.livekit.io/realtime/quickstarts/), or test instantly against one of our hosted [Sandbox](https://cloud.livekit.io/projects/p_/sandbox) frontends.

## 🏗️ Architecture

### Core Components

- **`agent.py`**: Main product assistant implementation with conversation management and performance monitoring
- **`prompts.py`**: Product assistant prompts and system instructions
- **`knowledge_loader.py`**: Advanced knowledge base loader with search capabilities and performance optimization

### Conversation Flow

The agent operates as a single, continuous conversation:

1. **Welcome & Introduction**: Greets users and asks how it can help
2. **Continuous Q&A**: Answers questions while maintaining full context
3. **Natural Conclusion**: Ends only when user explicitly wants to stop

### Knowledge Base

The agent has access to comprehensive information about:

- **Company Overview**: VoiceHire's mission, vision, and current product status
- **ATS Features**: Complete applicant tracking system capabilities (available now)
- **AI Agents**: Interview Agent (coming July 2025) and Recruitment Agent (coming end of year 2025)
- **Pricing Plans**: Detailed pricing structure and pilot program information
- **Business Value**: Competitive advantages and ROI calculations
- **Talent Pipeline Management**: Application management and workflow features
- **Management & Collaboration**: Team features and role-based access control
- **Founder Information**: Details about Anand and company vision

### Performance Monitoring

The agent includes advanced monitoring for:

- **Context Size Tracking**: Monitors conversation context size and token usage
- **Response Time Measurement**: Tracks LLM call performance and response times
- **Memory Usage Logging**: Detailed logging of knowledge base size and usage
- **Error Handling**: Comprehensive error tracking with context preservation
- **Conversation Analytics**: Duration tracking and user interaction patterns

## 🎮 Usage

### Starting a Conversation

1. Connect to the LiveKit room where the agent is running
2. The agent (Veeaa) will greet you and ask how it can help
3. Ask questions about VoiceHire's platform, features, pricing, or implementation
4. The agent will provide detailed, accurate responses based on the knowledge base
5. Continue asking questions - the agent maintains full context throughout
6. Say goodbye or indicate you want to end the conversation when finished

### Sample Interactions

**User**: "What is VoiceHire?"
**Veeaa**: "VoiceHire is an AI-powered recruitment platform that reimagines the hiring process through intelligent automation. We combine a comprehensive Applicant Tracking System with revolutionary AI agents to deliver a complete, unbiased, and efficient hiring solution. Our platform is available now with our ATS features, and we're launching our AI Interview Agent at the end of July 2025."

**User**: "How much does it cost?"
**Veeaa**: "We operate on a simple pay-as-you-use model! Right now, our ATS platform is completely free during our pilot program until the end of July 2025. After that, it's just $10 per job post. When our AI Interview Agent launches in July, it'll be $5 per hour of interview time, and our AI Recruitment Agent coming at the end of the year will be $50 per job. No contracts or hidden fees!"

**User**: "Tell me about the current features available now"
**Veeaa**: "Great question! Our ATS platform is fully available right now and includes a complete job management system, advanced candidate management with AI-powered search, intelligent screening tools, a dynamic form builder with 12+ question types, role-based access control, automated email communications, and a career page builder. You can post jobs across multiple platforms, manage all applications in one place, and get a free customizable career site. It's all free during our pilot program!"

### Ending a Conversation

The agent will only end the conversation when you explicitly indicate you want to stop, such as saying "goodbye", "I'm done", or "I don't want to talk anymore". This ensures you maintain full context throughout your entire interaction.

## 📚 Knowledge Base

The knowledge base is stored in markdown files within the `knowledge-base/` directory:

- `company-overview.md` - Company mission, vision, and current product status
- `ats-features.md` - Detailed ATS platform features and capabilities
- `ai-agents.md` - Information about Interview and Recruitment AI agents
- `pricing-plans.md` - Comprehensive pricing structure and pilot program details
- `business-value-competitive-advantages.md` - ROI calculations and competitive analysis
- `talent-pipeline-management.md` - Application management and workflow features
- `management-collaboration.md` - Team features and collaboration tools
- `founder-and-voice-agent.md` - Founder information and company vision

### Knowledge Base Features

- **Intelligent Loading**: Automatic loading with size monitoring and performance optimization
- **Search Capabilities**: Advanced search functionality for specific topics and queries
- **Topic Organization**: Well-structured content with clear categorization
- **Performance Monitoring**: Detailed logging of knowledge base usage and size metrics
- **Context Optimization**: Smart content delivery to stay within LLM token limits

### Updating Knowledge Base

To update the knowledge base:

1. Edit the relevant markdown files in `knowledge-base/`
2. The `knowledge_loader.py` will automatically load the updated content
3. Restart the agent to apply changes

## 🛠️ Development

### Project Structure

```
livekit-agent/
├── src/
│   ├── agent.py              # Main product assistant with performance monitoring
│   ├── prompts.py            # Product assistant prompts and guidelines
│   └── knowledge_loader.py   # Advanced knowledge base loader
├── knowledge-base/
│   ├── company-overview.md           # Company information and product status
│   ├── ats-features.md              # ATS platform features
│   ├── ai-agents.md                 # AI agents information
│   ├── pricing-plans.md             # Pricing and pilot program
│   ├── business-value-competitive-advantages.md  # ROI and competitive analysis
│   ├── talent-pipeline-management.md # Application management
│   ├── management-collaboration.md   # Team and collaboration features
│   └── founder-and-voice-agent.md   # Founder and company vision
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables
└── README.md                # This file
```

### Key Features of Current Implementation

- **Single Conversation Flow**: No complex stage management or transitions
- **Full Context Maintenance**: Maintains complete conversation history throughout
- **User-Controlled Ending**: Only ends when user explicitly wants to stop
- **Performance Monitoring**: Advanced logging and context size tracking
- **Knowledge Base Optimization**: Smart content loading and search capabilities
- **Error Handling**: Comprehensive error tracking with context preservation

### Adding New Features

1. **New Knowledge**: Add markdown files to `knowledge-base/`
2. **Enhanced Prompts**: Update `prompts.py` with improved instructions
3. **Custom Logic**: Extend the ProductAssistantAgent class in `agent.py`
4. **Performance Tuning**: Adjust context size limits and monitoring thresholds

### Testing

To test the agent:

1. Start the agent locally
2. Connect to the LiveKit room using a client application
3. Test various conversation flows and knowledge queries
4. Verify responses maintain context and are accurate
5. Monitor performance logs for context size and response times
6. Test conversation ending by explicitly saying goodbye

## 📦 Dependencies

- **livekit-agents**: Core LiveKit agents framework (~1.0.13)
- **livekit-plugins-openai**: OpenAI integration for LLM (~1.0.13)
- **livekit-plugins-deepgram**: Deepgram for speech recognition and synthesis (~1.0.13)
- **livekit-plugins-silero**: Silero for voice activity detection (~1.0.13)
- **livekit-plugins-turn-detector**: Turn detection for conversation flow (~1.0.13)
- **python-dotenv**: Environment variable management (~1.1.0)

## 🚀 Deployment

### Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key
LIVEKIT_URL=your_livekit_server_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
DEEPGRAM_API_KEY=your_deepgram_api_key
```

### Running the Agent

```bash
# Install dependencies
pip install -r requirements.txt

# Run the agent
python src/agent.py
```

### Integration with Website

This agent is designed to be integrated into VoiceHire's product website, providing:

- **Real-time product support**: Instant answers to product questions
- **Lead qualification**: Understanding customer needs and requirements
- **Demo scheduling**: Helping users book product demonstrations
- **Technical support**: Answering implementation and integration questions

## 🔧 Configuration

### Model Settings

- **LLM**: OpenAI GPT-4o-mini for cost-effective, high-quality responses
- **STT**: Deepgram Nova-3 for accurate speech recognition
- **TTS**: Deepgram for natural voice synthesis
- **VAD**: Silero for voice activity detection

### Performance Optimization

- **Knowledge Base**: Full knowledge base loaded for comprehensive responses
- **Context Management**: Efficient context handling with size monitoring
- **Response Time**: Optimized for sub-second response times
- **Memory Usage**: Monitored and logged for performance tracking
- **Token Limits**: Smart context size management to prevent LLM failures

## 📊 Monitoring

The agent includes comprehensive logging for:

- **Conversation Duration**: Track how long users engage
- **Knowledge Usage**: Monitor which topics are most requested
- **Performance Metrics**: Response times, context sizes, and token usage
- **Error Tracking**: Detailed error logging with context preservation
- **User Interactions**: Conversation patterns and user behavior
- **Context Size Monitoring**: Real-time tracking of conversation context growth

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with performance monitoring
5. Submit a pull request

## 📄 License

This project is proprietary to VoiceHire and not open source.

## 📞 Support

For technical support or questions:

- Email: support@voicehireats.com
- Documentation: https://docs.voicehireats.com
- Demo: https://voicehireats.com/demo

---

**VoiceHire Product Assistant Agent** - Transforming recruitment through intelligent voice technology.
