# Code Coverage Configuration and Usage

This document explains the comprehensive code coverage setup for the NetworkingApp platform, covering both .NET backend and React frontend with minimum 80% threshold requirements.

## Overview

The code coverage infrastructure provides:
- **Backend**: .NET code coverage using Coverlet with MSTest
- **Frontend**: React/TypeScript coverage using Jest with Create React App
- **Combined reporting**: Unified scripts for both platforms
- **CI/CD integration**: Automated coverage validation
- **Threshold enforcement**: Minimum 80% coverage requirement

## Quick Start

### Run All Coverage Analysis
```powershell
# Full coverage analysis for both backend and frontend
.\Scripts\Generate-CodeCoverage.ps1 -OpenReports

# CI mode (no interactive prompts)
.\Scripts\Generate-CodeCoverage.ps1 -CI

# Custom threshold (default is 80%)
.\Scripts\Generate-CodeCoverage.ps1 -MinimumThreshold 85
```

### Backend Only (.NET)
```powershell
# Backend coverage with HTML report
.\Scripts\Generate-DotNetCodeCoverage.ps1 -OpenReport

# Just generate reports
.\Scripts\Generate-DotNetCodeCoverage.ps1
```

### Frontend Only (React)
```powershell
# Frontend coverage with HTML report
.\Scripts\Generate-ReactCodeCoverage.ps1 -OpenReport

# CI mode
.\Scripts\Generate-ReactCodeCoverage.ps1 -CI
```

## .NET Backend Configuration

### Tools Used
- **Coverlet**: Cross-platform code coverage library
- **ReportGenerator**: HTML report generation
- **MSTest**: Test framework integration

### Configuration Files
- `coverlet.runsettings`: Coverage collection settings
- `Tests/Tests.csproj`: Project configuration with coverage properties

### Coverage Metrics
- **Line Coverage**: ≥80%
- **Branch Coverage**: ≥80%
- **Method Coverage**: ≥80%

### Exclusions
- Test assemblies (`*.Tests.*`)
- Generated code attributes
- Third-party libraries
- Migration files

## React Frontend Configuration

### Tools Used
- **Jest**: Testing framework with built-in coverage
- **Create React App**: Integrated coverage reporting
- **LCOV**: Coverage format for CI/CD integration

### Configuration Files
- `ClientApp/jest.config.json`: Jest configuration with coverage settings
- `ClientApp/package.json`: NPM scripts for coverage

### Coverage Metrics
- **Lines**: ≥80%
- **Functions**: ≥80% 
- **Branches**: ≥80%
- **Statements**: ≥80%

### Exclusions
- Test files (`*.test.*`, `*.spec.*`)
- Story files (`*.stories.*`)
- Type definitions (`*.d.ts`)
- Entry points (`index.tsx`)
- Setup files

## Generated Reports

### Backend Reports
- **HTML**: `CodeCoverage/html/index.html`
- **XML**: `CodeCoverage/raw/coverage.cobertura.xml`
- **LCOV**: `CodeCoverage/raw/coverage.info`
- **Badge**: `CodeCoverage/coverage-badge.svg`

### Frontend Reports
- **HTML**: `ClientApp/coverage/lcov-report/index.html`
- **LCOV**: `ClientApp/coverage/lcov.info`
- **JSON**: `ClientApp/coverage/coverage-final.json`
- **Badge**: `ClientApp/coverage/frontend-coverage-badge.svg`

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Code Coverage
  run: |
    .\Scripts\Generate-CodeCoverage.ps1 -CI -MinimumThreshold 80
  shell: pwsh

- name: Upload Coverage Reports
  uses: actions/upload-artifact@v3
  with:
    name: coverage-reports
    path: |
      CodeCoverage/
      ClientApp/coverage/
```

### Azure DevOps Example
```yaml
- task: PowerShell@2
  displayName: 'Generate Code Coverage'
  inputs:
    filePath: 'Scripts/Generate-CodeCoverage.ps1'
    arguments: '-CI -MinimumThreshold 80'
    
- task: PublishCodeCoverageResults@1
  inputs:
    codeCoverageTool: 'Cobertura'
    summaryFileLocation: 'CodeCoverage/raw/coverage.cobertura.xml'
```

## Threshold Configuration

### Adjusting Thresholds
```powershell
# Set different thresholds
.\Scripts\Generate-CodeCoverage.ps1 -MinimumThreshold 75  # Lower threshold
.\Scripts\Generate-CodeCoverage.ps1 -MinimumThreshold 90  # Higher threshold
```

### Per-Project Thresholds
- Backend: Edit `coverlet.runsettings` or `Tests.csproj`
- Frontend: Edit `ClientApp/jest.config.json`

## Troubleshooting

### Common Issues

#### Backend Coverage Not Generated
```powershell
# Ensure test project builds
dotnet build Tests/Tests.csproj

# Check if tests run
dotnet test Tests/Tests.csproj --verbosity minimal
```

#### Frontend Coverage Missing
```powershell
# Install dependencies
cd ClientApp
npm install

# Run tests manually
npm run test:coverage
```

#### Low Coverage Warnings
- Add more unit tests
- Remove exclusions carefully
- Check test quality vs quantity

### Debugging Coverage
```powershell
# Verbose backend coverage
dotnet test Tests/Tests.csproj --collect:"XPlat Code Coverage" --verbosity detailed

# Debug frontend coverage  
cd ClientApp
npm run test:coverage -- --verbose
```

## Best Practices

### Writing Testable Code
- Use dependency injection
- Avoid static dependencies
- Write pure functions when possible
- Separate business logic from UI

### Improving Coverage
- Focus on critical business logic
- Test edge cases and error paths
- Use parameterized tests for multiple scenarios
- Mock external dependencies

### Maintaining Quality
- Coverage ≠ Quality (aim for meaningful tests)
- Review coverage reports regularly
- Update thresholds as code matures
- Integrate with code review process

## Files and Scripts

### Coverage Scripts
- `Scripts/Generate-CodeCoverage.ps1`: Combined coverage analysis
- `Scripts/Generate-DotNetCodeCoverage.ps1`: Backend coverage only
- `Scripts/Generate-ReactCodeCoverage.ps1`: Frontend coverage only

### Configuration Files
- `coverlet.runsettings`: .NET coverage settings
- `ClientApp/jest.config.json`: React coverage settings
- `Tests/Tests.csproj`: Backend test project with coverage
- `ClientApp/package.json`: Frontend scripts and dependencies

### Output Directories
- `CodeCoverage/`: Backend coverage reports
- `ClientApp/coverage/`: Frontend coverage reports

---

For more information about testing in this project, see:
- [Performance Testing Documentation](../Docs/TASK-071-Performance-Tests-Summary.md)
- [Test Architecture Documentation](../Tests/README.md)
