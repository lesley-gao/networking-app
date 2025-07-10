# NetworkingApp - Flight Companion & Airport Pickup Platform

A community-focused networking platform designed for Chinese professionals in Auckland, New Zealand, facilitating flight companion matching and airport pickup services.

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
   cd NetworkingApp
   ```

2. **Setup backend**
   ```bash
   dotnet restore
   dotnet build
   ```

3. **Setup frontend**
   ```bash
   cd ClientApp
   npm install
   npm start
   ```

4. **Run the application**
   ```bash
   # Terminal 1: Start backend
   dotnet run
   
   # Terminal 2: Start frontend (in ClientApp directory)
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

### Backend
- **.NET 8** Web API with minimal APIs
- **Entity Framework Core 8** for data access
- **SQLite** for local development, **Azure SQL** for production
- **ASP.NET Core Identity** for authentication
- **SignalR** for real-time notifications

### Infrastructure
- **Azure App Service** for hosting
- **Azure SQL Database** for data persistence
- **Azure Key Vault** for secrets management
- **Application Insights** for monitoring
- **Virtual Network** for security isolation

## 📁 Project Structure

```
NetworkingApp/
├── 📁 ClientApp/                 # React TypeScript frontend
│   ├── 📁 public/                # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/        # React components
│   │   ├── 📁 store/             # Redux store and slices
│   │   ├── 📁 styles/            # CSS and theme files
│   │   └── 📁 stories/           # Storybook stories
│   ├── 📄 package.json           # Frontend dependencies
│   └── 📄 tailwind.config.js     # Tailwind configuration
├── 📁 Controllers/               # Web API controllers
├── 📁 Data/                      # Database context and migrations
├── 📁 Models/                    # Data models and DTOs
├── 📁 Services/                  # Business logic services
├── 📁 Hubs/                      # SignalR hubs
├── 📁 Tests/                     # Unit and integration tests
├── 📁 infra/                     # Azure infrastructure as code
│   ├── 📁 bicep/                 # Bicep templates
│   │   ├── 📄 main.bicep         # Main infrastructure template
│   │   ├── 📁 modules/           # Modular Bicep templates
│   │   └── 📁 parameters/        # Environment-specific parameters
│   └── 📄 README.md              # Infrastructure documentation
├── 📁 scripts/                   # Deployment and utility scripts
├── 📁 .github/workflows/         # GitHub Actions CI/CD
├── 📄 azure.yaml                 # Azure Developer CLI configuration
├── 📄 Program.cs                 # Application entry point
└── 📄 NetworkingApp.csproj       # .NET project file
```

## 🔧 Development

### Available Scripts

#### Backend (.NET)
```bash
dotnet run                        # Run the application
dotnet test                       # Run tests
dotnet ef migrations add <name>   # Add database migration
dotnet ef database update         # Update database
```

#### Frontend (React)
```bash
npm start                         # Start development server
npm run build                     # Build for production
npm test                          # Run tests
npm run lint                      # Lint code
npm run storybook                 # Start Storybook
npm run build-storybook          # Build Storybook
```

#### Infrastructure
```bash
# Validate Bicep templates
az deployment group validate --resource-group <rg> --template-file infra/bicep/main.bicep

# Deploy using PowerShell script
.\scripts\Deploy-ToAzure.ps1 -Environment dev

# Deploy using Azure Developer CLI
azd up --environment dev
```

### Code Quality

The project includes comprehensive tooling for code quality:

- **ESLint** and **Prettier** for frontend code formatting
- **StyleCop** and **EditorConfig** for backend code standards
- **Storybook** for component documentation and visual testing
- **Jest** and **React Testing Library** for frontend testing
- **MSTest** and **Moq** for backend testing

## 🎨 Storybook

Access the component library and documentation:

```bash
cd ClientApp
npm run storybook
```

Open [http://localhost:6006](http://localhost:6006) to view Storybook.

## 🔐 Authentication & Security

- **JWT Token Authentication** with refresh tokens
- **ASP.NET Core Identity** for user management
- **Role-based Authorization** (User, Helper, Admin)
- **Data Protection** for sensitive information encryption
- **HTTPS enforcement** across all environments

## 💰 Payment Integration

- **Stripe** integration for secure payment processing
- **Escrow system** for holding funds until service completion
- **Dispute resolution** with admin intervention
- **Payment history** and receipt generation

## 🌐 Deployment Environments

### Development (`dev`)
- Local development with hot reload
- SQLite database for quick setup
- Relaxed security for development productivity

### Test (`test`)
- Azure-hosted for integration testing
- Azure SQL Database
- Production-like configuration

### Production (`prod`)
- Full Azure deployment with high availability
- Enhanced security and monitoring
- Auto-scaling and performance optimization

## 📊 Monitoring & Observability

- **Application Insights** for application telemetry
- **Log Analytics** for centralized logging
- **Custom dashboards** for key metrics
- **Automated alerts** for critical issues
- **Health checks** for service availability

## 🧪 Testing Strategy

### Frontend Testing
- **Unit tests** with Jest and React Testing Library
- **Component tests** with Storybook interactions
- **Visual regression testing** with Storybook
- **End-to-end tests** with Playwright

### Backend Testing
- **Unit tests** for controllers and services
- **Integration tests** for API endpoints
- **Database tests** with in-memory providers
- **Performance tests** for matching algorithms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Workflow

1. **Feature Development**
   - Create feature branch from `develop`
   - Implement feature with tests
   - Update Storybook documentation
   - Create Pull Request

2. **Code Review**
   - Automated tests must pass
   - Code coverage requirements met
   - Manual review by team members
   - Merge to `develop`

3. **Release Process**
   - Merge `develop` to `main`
   - Automatic deployment to test environment
   - Manual approval for production deployment

## 📋 Implementation Progress

See [Implementation Plan](./plan/feature-flight-companion-platform-1.md) for detailed progress tracking.

### Completed Features ✅
- Core backend API with Entity Framework
- React frontend with TypeScript and Material-UI
- Authentication and authorization system
- Payment processing with Stripe
- Real-time notifications with SignalR
- Comprehensive Storybook integration
- Azure infrastructure as code

### In Progress 🚧
- Unit and integration test suites
- End-to-end testing with Playwright
- Performance optimization
- Security hardening

### Planned Features 📋
- Bilingual support (English/Chinese)
- Advanced search and filtering
- Mobile app development
- Machine learning for improved matching

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Refer to the [Architecture Documentation](./docs/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Azure Well-Architected Framework** for architecture guidance
- **React** and **.NET** communities for excellent documentation
- **Material-UI** and **Tailwind CSS** for design systems
- **Stripe** for payment processing capabilities
