# 🏗️ Wavelength-Lore System Architecture

## 🎯 Overview

The Wavelength-Lore ecosystem is a comprehensive, multi-component architecture designed to deliver an immersive fan experience through integrated content management, community interaction, and intelligent assistance. The system combines a main content website with an external AI-powered chatbot service to create a seamless user experience.

## 🌐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WAVELENGTH-LORE ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐  │
│  │    MAIN WEBSITE         │    │    EXTERNAL CHATBOT SERVICE    │  │
│  │  (Wavelength-Lore)      │◄──►│   (Wavelength-Chatbot)          │  │
│  │                         │    │                                 │  │
│  │  • Content Management   │    │  • Firebase Functions Backend  │  │
│  │  • User Authentication  │    │  • SSO Integration             │  │
│  │  • Community Features   │    │  • Vector Database (Pinecone)  │  │
│  │  • Asset Management     │    │  • OpenAI GPT Integration      │  │
│  │  • Widget Integration   │    │  • VIP+ Access Control        │  │
│  └─────────────────────────┘    └─────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 🏢 Component Architecture

### 1. **Main Website (Wavelength-Lore)**
**Location**: `/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh`
**URL**: `https://wavelengthlore.com`

#### Core Services
- **Node.js/Express Server**: Main application backend
- **Firebase Integration**: Authentication and real-time database
- **AWS S3 + CloudFront**: Asset storage and content delivery
- **Community Forum**: Discussion and user interaction
- **Content Management**: Seasons, episodes, characters, lore

#### Key Features
- ✅ **User Authentication**: Firebase-based with membership tiers
- ✅ **Content Delivery**: Optimized asset pipeline with CDN
- ✅ **Community Features**: Forum, discussions, user profiles
- ✅ **Merchandise System**: Printify integration with dynamic catalog
- ✅ **VIP Access Control**: Membership-based feature gating

### 2. **External Chatbot Service (Wavelength-Chatbot)**
**Location**: `/Volumes/5bits/current/wavelength-dev/Wavelength-Chatbot`
**URL**: `https://us-central1-wavelength-lore.cloudfunctions.net`

#### Core Services
- **Firebase Functions**: Serverless backend infrastructure
- **SSO Authentication**: Integration with main website authentication
- **Vector Database**: Pinecone for lore knowledge storage
- **AI Processing**: OpenAI GPT for intelligent responses
- **Session Management**: JWT-based user session handling

#### Key Features
- ✅ **VIP+ Exclusive Access**: Membership tier requirement
- ✅ **Lore Knowledge Base**: Complete universe information
- ✅ **Real-time Chat**: Interactive conversation capabilities
- ✅ **Security Controls**: Rate limiting, CORS, input validation
- ✅ **Session Persistence**: Conversation history and context

## 🔗 Integration Architecture

### **Widget Integration Pattern**
```
Main Website (wavelengthlore.com)
    │
    ├── VIP Dropdown Detection
    │   └── Membership Level: VIP+ Required
    │
    ├── Widget Page (/chatbot/widget)
    │   ├── SSO Chat Widget (sso-chat-widget.js)
    │   ├── Authentication Handler
    │   └── iframe Container (.vip-chatbot-container)
    │
    └── External API Calls
        └── Firebase Functions
            ├── POST /chat (Main chat endpoint)
            ├── GET /health (System status)
            ├── GET /admin (Session management)
            └── POST /legacy (API key fallback)
```

### **Authentication Flow**
```
User Login Flow:
1. User authenticates on wavelengthlore.com
2. SSO token generated and stored
3. Widget detects authentication status
4. Token passed to Firebase Functions
5. Session validated and created
6. Chat interface activated for VIP+ users
```

### **Data Flow Architecture**
```
Content Pipeline:
├── Content Management System
│   ├── Interactive CLI Tools
│   ├── Schema Validation
│   └── Asset Processing
│
├── Asset Pipeline
│   ├── Image Optimization
│   ├── CDN Upload (CloudFront)
│   └── URL Generation
│
└── Deployment Workflow
    ├── Git Integration
    ├── Firebase Database Updates
    └── Production Deployment

Chatbot Pipeline:
├── Lore Ingestion
│   ├── Content Sync from Main Site
│   ├── Vector Database Updates
│   └── Knowledge Base Refresh
│
├── Chat Processing
│   ├── User Input Validation
│   ├── Context Retrieval
│   ├── AI Response Generation
│   └── Response Optimization
│
└── Session Management
    ├── Authentication Verification
    ├── Conversation History
    └── Rate Limit Enforcement
```

## 🛡️ Security Architecture

### **Multi-Layer Security Model**

#### Main Website Security
- **Firebase Security Rules**: Database access control
- **Input Sanitization**: XSS and injection protection
- **Rate Limiting**: Smart endpoint protection
- **CORS Configuration**: Cross-origin request control
- **User Authentication**: Firebase ID token validation

#### Chatbot Security
- **SSO Integration**: Secure token-based authentication
- **VIP+ Access Control**: Membership tier enforcement
- **Request Validation**: Input sanitization and limits
- **Session Management**: JWT-based secure sessions
- **API Security**: Headers, CORS, rate limiting

#### Shared Security Features
- **Automated Backups**: Encrypted S3 storage
- **Package Protection**: Corruption detection and recovery
- **Secret Management**: Environment variable protection
- **Access Logging**: Comprehensive audit trails

## 📊 Technology Stack

### **Main Website Stack**
```
Frontend:
├── HTML5/CSS3/JavaScript
├── EJS Templating
├── Responsive Design
└── Progressive Enhancement

Backend:
├── Node.js + Express.js
├── Firebase Admin SDK
├── AWS SDK (S3, CloudFront)
├── Printify API Integration
└── Custom Middleware Stack

Database & Storage:
├── Firebase Realtime Database
├── AWS S3 (Asset Storage)
├── CloudFront CDN
└── Local Caching Layer
```

### **Chatbot Stack**
```
Backend:
├── Firebase Functions (Node.js 18)
├── Express.js Framework
├── Firebase Admin SDK
└── Custom Security Middleware

AI & Database:
├── OpenAI GPT-4 API
├── Pinecone Vector Database
├── Custom RAG Implementation
└── Knowledge Base Management

Authentication:
├── JWT Token Management
├── SSO Integration
├── Session Persistence
└── Membership Validation
```

## 🚀 Deployment Architecture

### **Main Website Deployment**
```
Development → Staging → Production
     │            │          │
     ├── Local    ├── Test   ├── AWS App Runner
     ├── Testing  ├── Valid  ├── CloudFront CDN
     └── Debug    └── QA     └── Domain Management
```

### **Chatbot Deployment**
```
Development → Firebase Functions → Production
     │              │                  │
     ├── Local      ├── Cloud Build    ├── Auto-scaling
     ├── Testing    ├── Validation     ├── Global CDN
     └── Debug      └── Deploy         └── Health Monitoring
```

## 🔄 Operational Workflows

### **Content Publishing Workflow**
1. **Content Creation**: Interactive CLI tools guide content creation
2. **Asset Processing**: Automated optimization and CDN upload
3. **Validation**: Schema validation and quality checks
4. **Deployment**: Git integration with automated deployment
5. **Chatbot Sync**: Knowledge base updates for AI responses

### **Chatbot Update Workflow**
1. **Lore Ingestion**: Sync content from main website
2. **Vector Processing**: Update Pinecone knowledge base
3. **Function Deployment**: Firebase Functions updates
4. **Health Validation**: Automated testing suite
5. **Production Verification**: Integration testing

## 📈 Monitoring & Analytics

### **Health Monitoring**
- ✅ **Main Website**: Uptime monitoring, performance metrics
- ✅ **Chatbot Service**: Firebase Functions monitoring, error tracking
- ✅ **Integration Points**: Cross-system health validation
- ✅ **User Experience**: Authentication flow monitoring

### **Performance Metrics**
- **Response Times**: API endpoint performance tracking
- **Success Rates**: Authentication and chat completion rates
- **Resource Usage**: Memory, CPU, and bandwidth monitoring
- **User Engagement**: Chat usage and session analytics

## 🔮 Future Architecture Considerations

### **Planned Enhancements**
- **Mobile App Integration**: Native app with chatbot SDK
- **Advanced Analytics**: User behavior and content effectiveness
- **Multi-language Support**: Internationalization framework
- **Enhanced AI Features**: Voice chat, image generation
- **Microservices Migration**: Service decomposition for scaling

### **Scalability Roadmap**
- **Horizontal Scaling**: Load balancing and auto-scaling
- **Database Optimization**: Read replicas and caching layers
- **CDN Enhancement**: Global edge computing integration
- **API Gateway**: Centralized API management and versioning

## 📚 Documentation Links

### **Main Website Documentation**
- **[System Overview](content-management/SYSTEM_OVERVIEW.md)** - Content management architecture
- **[Security Guide](docs/SECURITY_ENHANCEMENT_GUIDE.md)** - Security implementation
- **[Asset Management](docs/scripts/RESOURCE_CHECKER_README.md)** - Resource validation
- **[Forum Features](docs/FORUM_DELETE_FUNCTIONALITY.md)** - Community functionality

### **Chatbot Documentation**
- **[Chatbot Testing Summary](tests/chatbot/CHATBOT_TESTING_SUMMARY.md)** - Comprehensive validation results
- **[Firebase Functions Integration](../Wavelength-Chatbot/README.md)** - Backend architecture
- **[SSO Integration Guide](../Wavelength-Chatbot/docs/SSO-INTEGRATION.md)** - Authentication setup

### **Integration Documentation**
- **[Production Validation](docs/scripts/PRODUCTION_VALIDATION_README.md)** - Cross-system testing
- **[Git Commit Best Practices](documentation/development/GIT_COMMIT_MESSAGE_PITFALLS.md)** - Development workflows

## 🎯 Key Architectural Principles

1. **Separation of Concerns**: Clear boundaries between content management and AI services
2. **Security First**: Multi-layer security with VIP+ access control
3. **Scalable Design**: Serverless architecture supporting growth
4. **User Experience**: Seamless integration between main site and chatbot
5. **Maintainability**: Comprehensive testing and documentation
6. **Cost Efficiency**: Pay-per-use Firebase Functions model
7. **Performance**: CDN-optimized content delivery and caching

---

*This architecture document provides a comprehensive overview of the Wavelength-Lore ecosystem, including the external Firebase Functions chatbot service integration. The system is designed for scalability, security, and exceptional user experience.*

**Last Updated**: October 25, 2025  
**Architecture Version**: 2.0 (includes external chatbot integration)  
**Status**: Production Ready ✅