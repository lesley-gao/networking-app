# WingCompanion - Travel Companion & Airport Pickup Platform

A community-focused networking platform designed for Chinese professionals in Auckland, New Zealand, facilitating travel companion matching and airport pickup services.

## 🚀 Quick Start

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Azure Developer CLI](https://docs.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WingCompanion
   ```

2. **Setup backend**
   ```bash
   cd backend
   dotnet restore
   dotnet build
   cd ..
   ```

3. **Setup frontend**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Run the application**
   ```bash
   # Terminal 1: Start backend
   cd backend
   dotnet run
   
   # Terminal 2: Start frontend (in new terminal)
   cd frontend
   npm start
   ```

### Azure Deployment

Deploy to Azure using Azure Developer CLI:

```bash
# Login to Azure
azd auth login

# Deploy to development
azd up --environment dev

# Deploy to production
azd up --environment prod
```

For detailed deployment instructions, see [Infrastructure Documentation](./infra/README.md).

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Material-UI (MUI) v5** for consistent component design
- **Tailwind CSS** for utility-first styling
- **Redux Toolkit** for state management
- **Storybook** for component documentation and testing
- **Playwright** for end-to-end testing

### Backend
- **.NET 8** Web API with minimal APIs
- **Entity Framework Core 8** for data access
- **SQLite** for local development, **Azure SQL** for production
- **ASP.NET Core Identity** for authentication
- **SignalR** for real-time notifications
- **Stripe** integration for payment processing

### Infrastructure
- **Azure App Service** for hosting
- **Azure SQL Database** for data persistence
- **Azure Key Vault** for secrets management
- **Application Insights** for monitoring
- **Virtual Network** for security isolation

## 📁 Project Structure

```
WingCompanion/
├── 📁 backend/                   # .NET 8 Web API
│   ├── 📁 Controllers/           # Web API controllers
│   ├── 📁 Data/                  # Database context and migrations
│   ├── 📁 Models/                # Data models and DTOs
│   ├── 📁 Services/              # Business logic services
│   ├── 📁 Hubs/                  # SignalR hubs
│   ├── 📁 Tests/                 # Unit and integration tests
│   ├── 📁 Filters/               # Request/response filters
│   ├── 📁 Middleware/            # Custom middleware
│   ├── 📁 Templates/             # Email templates
│   ├── 📁 Scripts/               # PowerShell deployment scripts
│   ├── 📁 Infrastructure/        # Additional infrastructure code
│   ├── 📁 Pages/                 # Razor pages
│   ├── 📁 Properties/            # Project properties
│   ├── 📁 bin/                   # Build output
│   ├── 📁 obj/                   # Build intermediates
│   ├── 📄 Program.cs             # Application entry point
│   ├── 📄 WingCompanion.csproj   # .NET project file
│   ├── 📄 WingCompanion.sln      # Solution file
│   ├── 📄 appsettings.json       # App configuration
│   ├── 📄 appsettings.Development.json # Development config
│   ├── 📄 coverlet.runsettings   # Code coverage configuration
│   └── 📄 FlightCompanion.db     # SQLite database (dev)
├── 📁 frontend/                  # React TypeScript frontend
│   ├── 📁 public/                # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/        # React components
│   │   ├── 📁 store/             # Redux store and slices
│   │   ├── 📁 hooks/             # Custom React hooks
│   │   ├── 📁 services/          # API services
│   │   ├── 📁 themes/            # Theme providers
│   │   ├── 📁 utils/             # Utility functions
│   │   ├── 📁 locales/           # Internationalization files
│   │   └── 📁 stories/           # Storybook stories
│   ├── 📁 e2e/                   # End-to-end tests
│   ├── 📁 .storybook/            # Storybook configuration
│   ├── 📁 scss/                  # SCSS stylesheets
│   ├── 📄 package.json           # Frontend dependencies
│   ├── 📄 package-lock.json      # Locked dependencies
│   ├── 📄 tailwind.config.js     # Tailwind configuration
│   ├── 📄 tsconfig.json          # TypeScript configuration
│   ├── 📄 vite.config.mjs        # Vite build configuration
│   ├── 📄 playwright.config.ts   # Playwright test configuration
│   ├── 📄 jest.config.json       # Jest test configuration
│   └── 📄 postcss.config.js      # PostCSS configuration
├── 📁 infra/                     # Azure infrastructure as code
│   ├── 📁 bicep/                 # Bicep templates
│   │   ├── 📄 main.bicep         # Main infrastructure template
│   │   ├── 📁 modules/           # Modular Bicep templates
│   │   └── 📁 parameters/        # Environment-specific parameters
│   └── 📄 README.md              # Infrastructure documentation
├── 📁 Docs/                      # Project documentation
│   ├── 📄 AuthControllerAPI.md   # API documentation
│   ├── 📄 DataProtection.md      # Security documentation
│   ├── 📄 UserVerificationWorkflow.md
│   └── 📄 TASK-*.md              # Implementation task summaries
├── 📁 plan/                      # Project planning documents
├── 📁 spec/                      # Technical specifications
├── 📁 .github/                   # GitHub configuration
│   └── 📁 workflows/             # GitHub Actions CI/CD
├── 📁 .vscode/                   # VS Code settings
├── 📄 azure.yaml                 # Azure Developer CLI configuration
├── 📄 bicepconfig.json           # Bicep configuration
├── 📄 .gitignore                 # Git ignore rules
└── 📄 README.md                  # This file
```

## 🔧 Development

### Available Scripts

#### Backend (.NET)
```bash
cd backend

# Development
dotnet run                        # Run the application
dotnet watch run                  # Run with hot reload
dotnet build                      # Build the project
dotnet test                       # Run all tests

# Database
dotnet ef migrations add <name>   # Add database migration
dotnet ef database update         # Update database
dotnet ef database drop           # Drop database (caution!)

# Code Coverage
dotnet test --collect:"XPlat Code Coverage" --settings coverlet.runsettings
```

#### Frontend (React)
```bash
cd frontend

# Development
npm start                         # Start development server (Vite)
npm run dev                       # Alternative start command
npm run build                     # Build for production
npm run preview                   # Preview production build

# Testing
npm test                          # Run unit tests (Jest)
npm run test:watch                # Run tests in watch mode
npm run test:e2e                  # Run end-to-end tests (Playwright)
npm run test:e2e:ui               # Run e2e tests with UI

# Code Quality
npm run lint                      # Lint code (ESLint)
npm run lint:fix                  # Fix linting issues
npm run format                    # Format code (Prettier)

# Storybook
npm run storybook                 # Start Storybook dev server
npm run build-storybook           # Build Storybook for production
```

#### Infrastructure & Deployment
```bash
# Bicep template validation
az deployment group validate --resource-group <rg> --template-file infra/bicep/main.bicep

# Deploy using PowerShell scripts (from backend directory)
cd backend
.\Scripts\Deploy-ToAzure.ps1 -Environment dev
.\Scripts\Generate-CodeCoverage.ps1

# Deploy using Azure Developer CLI
azd up --environment dev
azd deploy                        # Deploy without provisioning
azd down                          # Tear down resources
```

### Code Quality Tools

The project includes comprehensive tooling for code quality:

#### Frontend
- **ESLint** and **Prettier** for code formatting and linting
- **TypeScript** for type safety
- **Jest** and **React Testing Library** for unit testing
- **Playwright** for end-to-end testing
- **Storybook** for component documentation and visual testing

#### Backend
- **StyleCop** and **EditorConfig** for code standards
- **MSTest** and **Moq** for unit testing
- **Entity Framework** in-memory provider for integration testing
- **Coverlet** for code coverage analysis

## 🎨 Storybook

Access the component library and documentation:

```bash
cd frontend
npm run storybook
```

Open [http://localhost:6006](http://localhost:6006) to view Storybook.

## 🔐 Authentication & Security

- **JWT Token Authentication** with refresh tokens
- **ASP.NET Core Identity** for user management
- **Role-based Authorization** (User, Helper, Admin)
- **Data Protection** for sensitive information encryption
- **HTTPS enforcement** across all environments
- **Input validation** and **XSS protection**

## 💰 Payment Integration

- **Stripe** integration for secure payment processing
- **Escrow system** for holding funds until service completion
- **Dispute resolution** with admin intervention
- **Payment history** and receipt generation
- **Webhook handling** for payment events

## 🌐 Deployment Environments

### Development (`dev`)
- Local development with hot reload
- SQLite database for quick setup
- Relaxed security for development productivity
- Detailed logging and debugging

### Test (`test`)
- Azure-hosted for integration testing
- Azure SQL Database
- Production-like configuration
- Automated testing pipelines

### Production (`prod`)
- Full Azure deployment with high availability
- Enhanced security and monitoring
- Auto-scaling and performance optimization
- Error tracking and alerting

## 📊 Monitoring & Observability

- **Application Insights** for application telemetry
- **Log Analytics** for centralized logging
- **Custom dashboards** for key metrics
- **Automated alerts** for critical issues
- **Health checks** for service availability
- **Performance monitoring** for API endpoints

## 🧪 Testing Strategy

### Frontend Testing
- **Unit tests** with Jest and React Testing Library
- **Component tests** with Storybook interactions
- **Integration tests** for Redux stores and API calls
- **End-to-end tests** with Playwright
- **Visual regression testing** capabilities

### Backend Testing
- **Unit tests** for controllers and services
- **Integration tests** for API endpoints
- **Database tests** with in-memory providers
- **Performance tests** for matching algorithms
- **Load testing** for high-traffic scenarios

### Test Coverage Goals
- **Frontend**: >80% line coverage
- **Backend**: >85% line coverage
- **API Integration**: 100% endpoint coverage

## 🌍 Internationalization

- **React i18next** for frontend translations
- **English/Chinese** language support
- **Localized date/time formatting**
- **Cultural considerations** for Chinese users
- **Right-to-left (RTL)** text support preparation

## 🚀 Performance Optimization

### Frontend
- **Code splitting** with React.lazy
- **Bundle optimization** with Vite
- **Image optimization** and lazy loading
- **Memoization** for expensive calculations
- **Virtual scrolling** for large lists

### Backend
- **Entity Framework** query optimization
- **Caching strategies** with Redis (planned)
- **Database indexing** for search operations
- **Connection pooling** configuration
- **Response compression**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Workflow

1. **Feature Development**
   - Create feature branch from `develop`
   - Implement feature with comprehensive tests
   - Update Storybook documentation if UI changes
   - Ensure code coverage requirements are met

2. **Code Review Process**
   - All automated tests must pass
   - Code coverage thresholds must be maintained
   - Manual review by at least one team member
   - Security and performance considerations reviewed

3. **Release Process**
   - Merge `develop` to `main` for releases
   - Automatic deployment to test environment
   - Manual approval required for production deployment
   - Post-deployment verification and monitoring

## 📋 Implementation Progress

See [Implementation Plan](./plan/feature-flight-companion-platform-1.md) for detailed progress tracking.

### Completed Features ✅
- Core backend API with Entity Framework Core 8
- React frontend with TypeScript and Material-UI
- Authentication and authorization system
- Payment processing with Stripe integration
- Real-time notifications with SignalR
- Comprehensive Storybook component library
- Azure infrastructure as code with Bicep
- End-to-end testing with Playwright
- Code coverage reporting and CI/CD pipeline

### In Progress 🚧
- Performance optimization and caching
- Advanced search and filtering capabilities
- Security hardening and penetration testing
- Mobile responsiveness improvements

### Planned Features 📋
- Bilingual support (English/Chinese) completion
- Mobile app development (React Native)
- Machine learning for improved matching algorithms
- Advanced analytics and reporting dashboard
- SMS and push notification services

## 🛠️ Development Setup Troubleshooting

### Common Issues

#### Backend Setup
```bash
# If dotnet restore fails
dotnet nuget locals all --clear
dotnet restore --force

# If database migrations fail
dotnet ef database drop
dotnet ef database update
```

#### Frontend Setup
```bash
# If npm install fails
rm -rf node_modules package-lock.json
npm install

# If Vite fails to start
rm -rf node_modules/.vite
npm run dev
```

#### Database Issues
- Ensure SQLite is accessible for local development
- Check connection strings in `appsettings.Development.json`
- Verify Entity Framework migrations are applied

## 📞 Support & Resources

### Documentation
- [API Documentation](./Docs/AuthControllerAPI.md)
- [Architecture Overview](./Docs/)
- [Security Guide](./Docs/DataProtection.md)
- [Infrastructure Guide](./infra/README.md)

### Support Channels
- Create an issue in the repository for bugs
- Use GitHub Discussions for questions
- Contact the development team for urgent issues

### External Resources
- [.NET 8 Documentation](https://docs.microsoft.com/en-us/dotnet/)
- [React Documentation](https://reactjs.org/docs/)
- [Azure Developer CLI](https://docs.microsoft.com/en-us/azure/developer/azure-developer-cli/)
- [Storybook Documentation](https://storybook.js.org/docs/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Azure Well-Architected Framework** for architecture guidance
- **React** and **.NET** communities for excellent documentation
- **Material-UI** team for the comprehensive component library
- **Tailwind CSS** for utility-first CSS framework
- **Stripe** for secure payment processing capabilities
- **Playwright** team for robust end-to-end testing tools
- **Storybook** community for component development workflow

---

**Built with ❤️ for the Chinese professional community in Auckland, New Zealand**
