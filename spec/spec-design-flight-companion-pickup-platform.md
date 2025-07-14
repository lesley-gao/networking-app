---
title: WingCompanion Design Specification
version: 1.0
date_created: 2025-07-07
last_updated: 2025-07-07
owner: WingCompanion Development Team
tags: [design, app, networking, travel, community, platform]
---

# Introduction

This specification defines the design and requirements for a community-focused networking platform that connects Chinese professionals in Auckland, New Zealand, to provide mutual assistance with flight companion services and airport pickup transportation. The platform addresses the specific challenge of language barriers and navigation difficulties faced by non-English speaking elderly travelers in English-speaking countries during airport and flight processes.

## 1. Purpose & Scope

This specification provides a comprehensive design for a web-based platform that enables:
- Matching travelers needing flight companion assistance with volunteers on the same flights
- Connecting passengers requiring airport pickup services with available drivers
- Building a trusted community network of Chinese professionals in Auckland
- Facilitating cultural bridge-building through mutual aid

**Target Audience**: Chinese professionals residing in Auckland, New Zealand, and their families requiring travel assistance.

**Assumptions**: 
- Users have basic internet access and smartphone/computer literacy
- Initial geographic focus is Auckland with future expansion potential
- Community operates on trust-based mutual aid principles

## 2. Definitions

- **Flight Companion**: A volunteer traveler on the same flight who provides assistance to elderly or non-English speaking passengers
- **Pickup Driver**: A community member offering airport transportation services
- **Help Seeker**: A user requesting assistance for themselves or family members
- **Helper/Volunteer**: A user offering assistance services
- **Matching**: The process of connecting help seekers with appropriate helpers
- **AKL**: Auckland Airport (IATA code)
- **Mutual Aid**: Community-based assistance where members both give and receive help
- **Trust Network**: A verified community of users with established credibility

## 3. Requirements, Constraints & Guidelines

### Core Requirements
- **REQ-001**: The platform must support both flight companion matching and airport pickup services
- **REQ-002**: Users must be able to create both help requests and service offers
- **REQ-003**: The system must provide intelligent matching based on flight details, location, and requirements
- **REQ-004**: All users must complete identity verification before accessing services
- **REQ-005**: The platform must support bilingual operation (English and Chinese)
- **REQ-006**: Real-time communication between matched users must be available
- **REQ-007**: The system must track service completion and user ratings

### Security Requirements
- **SEC-001**: All user data must be encrypted in transit and at rest
- **SEC-002**: Personal information access must be restricted to matched users only
- **SEC-003**: Payment transactions must use secure escrow mechanisms
- **SEC-004**: User verification must include document validation
- **SEC-005**: Emergency contact features must be available during active services

### Business Requirements
- **BUS-001**: The platform must support fee-based services with escrow payment system
- **BUS-002**: Service fees must range from NZD $15-200 depending on service type
- **BUS-003**: The system must track service history and user reputation
- **BUS-004**: Community guidelines and terms of service must be prominently displayed

### Constraints
- **CON-001**: Initial deployment limited to Auckland region
- **CON-002**: Flight companion services limited to major China-New Zealand routes
- **CON-003**: Maximum passenger capacity constraints for pickup services
- **CON-004**: Service matching window limited to 24 hours before travel
- **CON-005**: Users must be 18+ years old to offer services

### Guidelines
- **GUD-001**: Prioritize elderly traveler assistance in matching algorithms
- **GUD-002**: Encourage community building through service completion follow-ups
- **GUD-003**: Maintain clear communication channels throughout service delivery
- **GUD-004**: Provide comprehensive safety guidelines for all interactions

### Patterns
- **PAT-001**: Use RESTful API design for all backend services
- **PAT-002**: Implement responsive design for mobile-first experience
- **PAT-003**: Follow Entity Framework Core patterns for data access
- **PAT-004**: Use React component composition for frontend modularity

## 4. Interfaces & Data Contracts

### Flight Companion API Endpoints
```
GET /api/flightcompanion/requests - Retrieve active help requests
POST /api/flightcompanion/requests - Create new help request
GET /api/flightcompanion/offers - Retrieve available helpers
POST /api/flightcompanion/offers - Create helper offer
GET /api/flightcompanion/match/{requestId} - Find matching helpers
PUT /api/flightcompanion/match - Confirm helper assignment
DELETE /api/flightcompanion/requests/{id} - Cancel help request
PUT /api/flightcompanion/requests/{id} - Update help request
```

### Pickup Service API Endpoints
```
GET /api/pickup/requests - Retrieve pickup requests
POST /api/pickup/requests - Create pickup request
GET /api/pickup/offers - Retrieve available drivers
POST /api/pickup/offers - Create driver offer
GET /api/pickup/match/{requestId} - Find matching drivers
PUT /api/pickup/match - Confirm driver assignment
DELETE /api/pickup/requests/{id} - Cancel pickup request
PUT /api/pickup/requests/{id} - Update pickup request
```

### Authentication & User Management API Endpoints
```
POST /api/auth/register - User registration
POST /api/auth/login - User authentication
POST /api/auth/logout - User logout
POST /api/auth/refresh - Refresh JWT token
GET /api/users/profile - Get user profile
PUT /api/users/profile - Update user profile
POST /api/users/verify - Submit verification documents
GET /api/users/verification-status - Check verification status
```

### Payment & Rating API Endpoints
```
POST /api/payments/create-intent - Create payment intent
POST /api/payments/confirm - Confirm payment
GET /api/payments/history - Get payment history
POST /api/ratings - Submit rating
GET /api/ratings/user/{userId} - Get user ratings
POST /api/disputes - Create dispute
GET /api/disputes/{id} - Get dispute details
```

### Data Models
**FlightCompanionRequest Schema:**
```json
{
  "id": "integer",
  "userId": "integer",
  "flightNumber": "string(100)",
  "airline": "string(50)",
  "flightDate": "datetime",
  "departureAirport": "string(10)",
  "arrivalAirport": "string(10)",
  "travelerName": "string(100)",
  "travelerAge": "string(20)",
  "specialNeeds": "string(500)",
  "offeredAmount": "decimal(18,2)",
  "additionalNotes": "string(1000)",
  "isActive": "boolean",
  "isMatched": "boolean",
  "createdAt": "datetime"
}
```

**PickupRequest Schema:**
```json
{
  "id": "integer",
  "userId": "integer",
  "flightNumber": "string(100)",
  "arrivalDate": "datetime",
  "arrivalTime": "timespan",
  "airport": "string(10)",
  "destinationAddress": "string(200)",
  "passengerName": "string(100)",
  "passengerPhone": "string(20)",
  "passengerCount": "integer",
  "hasLuggage": "boolean",
  "offeredAmount": "decimal(18,2)",
  "specialRequests": "string(500)",
  "isActive": "boolean",
  "isMatched": "boolean",
  "createdAt": "datetime"
}
```

**User Schema:**
```json
{
  "id": "integer",
  "email": "string(100)",
  "firstName": "string(50)",
  "lastName": "string(50)",
  "phoneNumber": "string(20)",
  "preferredLanguage": "string(10)",
  "isVerified": "boolean",
  "verificationDocuments": "string(500)",
  "emergencyContact": "string(100)",
  "emergencyPhone": "string(20)",
  "rating": "decimal(3,2)",
  "totalRatings": "integer",
  "isActive": "boolean",
  "createdAt": "datetime",
  "lastLoginAt": "datetime"
}
```

**Payment Schema:**
```json
{
  "id": "integer",
  "payerId": "integer",
  "receiverId": "integer",
  "requestId": "integer",
  "requestType": "string(20)",
  "amount": "decimal(18,2)",
  "currency": "string(3)",
  "status": "string(20)",
  "stripePaymentIntentId": "string(100)",
  "escrowReleaseDate": "datetime",
  "platformFeeAmount": "decimal(18,2)",
  "createdAt": "datetime",
  "completedAt": "datetime"
}
```

**Rating Schema:**
```json
{
  "id": "integer",
  "raterId": "integer",
  "ratedUserId": "integer",
  "requestId": "integer",
  "requestType": "string(20)",
  "score": "integer",
  "comment": "string(500)",
  "isPublic": "boolean",
  "createdAt": "datetime"
}
```

**Notification Schema:**
```json
{
  "id": "integer",
  "userId": "integer",
  "title": "string(100)",
  "message": "string(500)",
  "type": "string(20)",
  "isRead": "boolean",
  "actionUrl": "string(200)",
  "createdAt": "datetime",
  "expiresAt": "datetime"
}
```

## 5. Acceptance Criteria

- **AC-001**: Given a user creates a flight companion request, When the request is submitted with valid flight details, Then the system shall store the request and make it available for matching
- **AC-002**: Given an available helper on the same flight route, When a help request is created, Then the system shall identify and present potential matches within 5 seconds
- **AC-003**: Given a confirmed match between helper and help seeker, When both parties accept the arrangement, Then the system shall facilitate secure payment escrow and exchange contact information
- **AC-004**: Given a pickup request for Auckland airport, When drivers in the service area are available, Then the system shall present matches sorted by proximity and rating
- **AC-005**: Given a completed service, When both parties confirm completion, Then the system shall release payment and prompt for mutual ratings
- **AC-006**: The system shall support simultaneous English and Chinese language display for all user interfaces
- **AC-007**: Given invalid or incomplete request data, When a user attempts to submit, Then the system shall display clear validation messages and prevent submission

## 6. Test Automation Strategy

- **Test Levels**: Unit tests for business logic, Integration tests for API endpoints, End-to-End tests for complete user workflows
- **Frameworks**: MSTest for unit testing, FluentAssertions for readable assertions, Moq for mocking dependencies, React Testing Library for frontend components
- **Test Data Management**: Use Entity Framework In-Memory database for integration tests, dedicated test data factories for consistent object creation
- **CI/CD Integration**: Automated test execution in GitHub Actions on every pull request and merge to main branch
- **Coverage Requirements**: Minimum 80% code coverage for business logic layers, 90% for critical payment and matching algorithms
- **Performance Testing**: Load testing for matching algorithms with simulated peak traffic, response time validation for API endpoints (<200ms for matching queries)

## 7. Security Framework & Implementation

### Authentication & Authorization
- **AUTH-001**: JWT-based authentication with refresh token rotation
- **AUTH-002**: Role-based access control (User, Helper, Admin)
- **AUTH-003**: Multi-factor authentication for high-value transactions
- **AUTH-004**: Account lockout after 5 failed login attempts
- **AUTH-005**: Password complexity requirements and encryption

### Data Protection
- **DATA-001**: AES-256 encryption for sensitive data at rest
- **DATA-002**: TLS 1.3 for all data in transit
- **DATA-003**: Personal information masking in logs and error messages
- **DATA-004**: GDPR-compliant data retention and deletion policies
- **DATA-005**: Regular security audits and penetration testing

### Payment Security
- **PAY-001**: PCI DSS compliance for payment processing
- **PAY-002**: Stripe-managed payment tokenization
- **PAY-003**: Escrow system with automated release conditions
- **PAY-004**: Fraud detection and prevention mechanisms
- **PAY-005**: Secure webhook validation for payment events

### Infrastructure Security
- **INFRA-001**: Azure Key Vault for secrets management
- **INFRA-002**: Network security groups and application firewalls
- **INFRA-003**: Azure AD integration for administrative access
- **INFRA-004**: Automated security patching and updates
- **INFRA-005**: Comprehensive logging and monitoring with Azure Sentinel

## 8. Deployment Architecture

### Azure Infrastructure Components
```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Resource Group                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │   Azure App     │  │   Azure SQL      │  │  Azure Key  │ │
│  │   Service       │  │   Database       │  │   Vault     │ │
│  │   (Web API)     │──│  (Production)    │  │ (Secrets)   │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
│           │                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │   Azure CDN     │  │  Application     │  │ Azure Blob  │ │
│  │ (Static Assets) │  │   Insights       │  │  Storage    │ │
│  │                 │  │ (Monitoring)     │  │(Documents)  │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Environment Configuration
- **Development**: Local SQL Server, minimal logging, debug symbols
- **Staging**: Azure SQL Basic tier, full logging, performance testing
- **Production**: Azure SQL Standard tier, optimized logging, monitoring

### CI/CD Pipeline Strategy
```yaml
Trigger: Push to main branch
├── Build Stage
│   ├── Restore NuGet packages
│   ├── Build .NET 8 application
│   ├── Build React TypeScript frontend
│   └── Run Storybook build verification
├── Test Stage
│   ├── Unit tests (Backend)
│   ├── Unit tests (Frontend)
│   ├── Integration tests
│   └── Security scans
├── Deploy Staging
│   ├── Deploy to staging environment
│   ├── Run E2E tests
│   └── Performance validation
└── Deploy Production
    ├── Manual approval gate
    ├── Blue-green deployment
    └── Health checks validation
```

## 9. Risk Management & Mitigation Strategies

### Technical Risks
- **TR-001**: Database performance degradation under load
  - Mitigation: Implement database indexing strategy, query optimization, and Azure SQL auto-scaling
- **TR-002**: Frontend bundle size impacting mobile performance
  - Mitigation: Code splitting, lazy loading, and Webpack optimization strategies
- **TR-003**: Third-party API failures (Stripe, Azure services)
  - Mitigation: Circuit breaker patterns, fallback mechanisms, and comprehensive error handling
- **TR-004**: Real-time notification delivery failures
  - Mitigation: SignalR connection monitoring, message queuing, and retry mechanisms

### Business Risks
- **BR-001**: Low user engagement and platform abandonment
  - Mitigation: Gamification elements, community building features, and user feedback integration
- **BR-002**: Trust issues in community-based matching
  - Mitigation: Comprehensive user verification, rating systems, and emergency support features
- **BR-003**: Seasonal usage fluctuations affecting sustainability
  - Mitigation: Service diversification, community events, and retention strategies

### Operational Risks
- **OR-001**: Inadequate customer support for disputes
  - Mitigation: Automated dispute resolution workflows, comprehensive documentation, and escalation procedures
- **OR-002**: Security breach exposing user data
  - Mitigation: Multi-layered security architecture, regular audits, and incident response procedures
- **OR-003**: Regulatory changes affecting platform operations
  - Mitigation: Legal monitoring, compliance framework updates, and adaptable platform architecture

## 10. Monitoring & Observability Strategy

### Application Performance Monitoring
- Real-time performance metrics collection via Application Insights
- Custom telemetry for matching algorithm performance
- Database query performance tracking and optimization alerts
- Frontend performance monitoring with Core Web Vitals

### Business Intelligence & Analytics
- User engagement and retention metrics dashboard
- Service completion rates and user satisfaction tracking
- Geographic and demographic usage pattern analysis
- Revenue and payment transaction monitoring

### Security Monitoring
- Authentication and authorization event logging
- Suspicious activity detection and automated alerting
- Payment fraud prevention and monitoring
- Data access audit trails and compliance reporting

### Infrastructure Monitoring
- Azure service health and availability monitoring
- Resource utilization and auto-scaling metrics
- Network performance and CDN effectiveness tracking
- Database backup verification and disaster recovery testing

## 11. Related Specifications / Further Reading

[Azure Well-Architected Framework](https://docs.microsoft.com/en-us/azure/architecture/framework/)  
[.NET Core Web API Best Practices](https://docs.microsoft.com/en-us/aspnet/core/web-api/)  
[React Application Architecture Guidelines](https://reactjs.org/docs/thinking-in-react.html)  
[Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core/)  
[New Zealand Privacy Act 2020 Compliance Guide](https://www.privacy.org.nz/privacy-act-2020/)

## 12. Technical Requirements
- **TECH-001**: Frontend built with React 18+ and TypeScript for type safety
- **TECH-002**: Tailwind CSS for utility-first styling framework
- **TECH-003**: Material-UI (MUI) v5 for consistent component library
- **TECH-004**: Redux Toolkit for centralized state management
- **TECH-005**: Storybook for component documentation and testing
- **TECH-006**: Theme switching capability (light/dark mode)
- **TECH-007**: Backend implemented with C# .NET 8 Web API
- **TECH-008**: Entity Framework Core 8 for database operations
- **TECH-009**: RESTful API design with OpenAPI documentation
- **TECH-010**: SQL Server or SQLite for data persistence
- **TECH-011**: JWT authentication with refresh token support
- **TECH-012**: Responsive design supporting mobile devices (320px+)

## 13. Deployment Requirements
- **DEP-001**: Azure App Service for hosting and auto-scaling
- **DEP-002**: Azure SQL Database for production data persistence
- **DEP-003**: Azure Key Vault for secure configuration management
- **DEP-004**: Application Insights for monitoring and telemetry
- **DEP-005**: Azure Blob Storage for document verification uploads
- **DEP-006**: Azure CDN for static asset delivery optimization
- **DEP-007**: GitHub Actions for CI/CD pipeline automation
- **DEP-008**: Environment separation (Development, Staging, Production)
- **DEP-009**: SSL/TLS certificates for secure communication
- **DEP-010**: Database backup and disaster recovery strategy

## 14. Performance Requirements
- **PERF-001**: API response times must be under 200ms for matching queries
- **PERF-002**: Database queries optimized with proper indexing strategy
- **PERF-003**: Frontend bundle size optimized for mobile performance
- **PERF-004**: Support for 1000+ concurrent users during peak hours
- **PERF-005**: Payment processing completion within 30 seconds
- **PERF-006**: Real-time notifications delivered within 5 seconds
