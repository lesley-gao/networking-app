# Database Migration and Production Deployment Guide

## Overview

This document provides comprehensive guidance for database migration scripts, production deployment, and data seeding for WingCompanion. The migration infrastructure ensures reliable, secure, and automated database deployments across development, testing, and production environments.

## Architecture

### Migration Infrastructure Components

1. **PowerShell Automation Scripts**
   - `Deploy-DatabaseMigrations.ps1` - Main migration orchestration script
   - `Validate-DatabaseMigration.ps1` - Comprehensive validation and testing

2. **Production Data Seeding**
   - `ProductionDatabaseSeeder.cs` - Essential production data initialization
   - `ConfigurationDataSeeder.cs` - System configuration and reference data

3. **Infrastructure as Code**
   - `database.bicep` - Azure SQL Database deployment template
   - Environment-specific parameter files

4. **Validation and Testing**
   - Automated schema validation
   - Data integrity checks
   - Performance verification
   - Security compliance testing

## Migration Script Features

### Deploy-DatabaseMigrations.ps1

**Key Capabilities:**
- ✅ Multi-environment support (dev, test, prod)
- ✅ Automated backup creation and retention management
- ✅ Migration rollback capabilities
- ✅ Comprehensive logging and error handling
- ✅ Production safety controls and approval workflows
- ✅ Data seeding with environment-specific configurations
- ✅ Validation and integrity checks

**Parameters:**
```powershell
.\Deploy-DatabaseMigrations.ps1 `
    -Environment "prod" `
    -ConnectionString "Server=..." `
    -CreateBackup $true `
    -SeedData $true `
    -ValidateOnly $false
```

**Environment-Specific Configurations:**
- **Development**: Quick deployment, test data seeding, minimal backup retention
- **Testing**: Standard validation, comprehensive test data, moderate backup retention
- **Production**: Maximum safety controls, essential data only, extended backup retention

### Validate-DatabaseMigration.ps1

**Validation Levels:**
- **Basic**: Core connectivity and migration status
- **Standard**: Schema validation, data integrity, security checks
- **Comprehensive**: Performance metrics, production readiness, monitoring setup

**Validation Categories:**
- 🔗 **Connectivity**: Database connection and accessibility
- 📊 **Schema**: Table structure, constraints, indexes
- 🔒 **Security**: Authentication, authorization, encryption
- 🛡️ **Data Integrity**: Foreign keys, consistency, validation
- ⚡ **Performance**: Query optimization, resource utilization
- 💾 **Backup**: Backup strategy, recovery procedures
- 🚀 **Production**: Monitoring, alerting, maintenance

## Production Data Seeding

### ProductionDatabaseSeeder

**Essential Data Types:**
- 👤 **User Roles**: Administrator, User, Support, Moderator
- 🔑 **Admin User**: System administrator account
- ⚙️ **System Settings**: Default application configurations
- 📬 **Notification Templates**: System notification templates
- 📄 **Verification Types**: Document verification categories

**Safety Features:**
- ✅ Idempotent operations (safe to run multiple times)
- ✅ Data existence checks before insertion
- ✅ Comprehensive error handling and logging
- ✅ Production-specific data validation

### ConfigurationDataSeeder

**Configuration Data:**
- 🚨 **Emergency Contacts**: System-level emergency procedures
- 💬 **System Messages**: Platform announcements and safety reminders
- 💳 **Escrow Settings**: Default transaction security configurations

## Database Infrastructure (Bicep)

### Environment-Specific Configurations

| Environment | Database Tier | Size Limit | Backup Retention | Geo-Redundancy |
|-------------|---------------|------------|------------------|----------------|
| Development | Standard S1   | 5 GB       | 7 days          | No             |
| Testing     | Standard S2   | 25 GB      | 14 days         | No             |
| Production  | Premium P2    | 250 GB     | 35 days         | Yes            |

### Security Features

**Azure SQL Security:**
- 🔐 Transparent Data Encryption (TDE)
- 🛡️ Advanced Threat Protection
- 🔍 Vulnerability Assessment
- 🔑 Azure Active Directory Integration
- 🚪 Firewall Rules and Network Security

**Key Management:**
- 🗝️ Azure Key Vault integration
- 🔒 Secure connection string storage
- 👤 Credential management
- 🔄 Automated secret rotation

### Monitoring and Diagnostics

**Diagnostic Logging:**
- 📊 Database performance metrics
- 🔍 Query execution logs
- 🚨 Security audit logs
- 📈 Resource utilization monitoring

**Backup Strategy:**
- 💾 Automated point-in-time backups
- 🌍 Geo-redundant backup storage (production)
- 📅 Long-term retention policies
- ⚡ Quick recovery procedures

## Deployment Workflows

### Development Environment

```powershell
# Quick deployment for development
.\Deploy-DatabaseMigrations.ps1 `
    -Environment "dev" `
    -ConnectionString $devConnectionString `
    -CreateBackup $false `
    -SeedData $true
```

### Testing Environment

```powershell
# Standard testing deployment
.\Deploy-DatabaseMigrations.ps1 `
    -Environment "test" `
    -ConnectionString $testConnectionString `
    -CreateBackup $true `
    -SeedData $true

# Validate after deployment
.\Validate-DatabaseMigration.ps1 `
    -ConnectionString $testConnectionString `
    -ValidationLevel "Standard" `
    -ExportReport
```

### Production Environment

```powershell
# Step 1: Validation only (dry run)
.\Deploy-DatabaseMigrations.ps1 `
    -Environment "prod" `
    -ConnectionString $prodConnectionString `
    -ValidateOnly $true

# Step 2: Create backup
.\Deploy-DatabaseMigrations.ps1 `
    -Environment "prod" `
    -ConnectionString $prodConnectionString `
    -CreateBackup $true `
    -SeedData $false `
    -ValidateOnly $true

# Step 3: Execute migration (requires approval)
.\Deploy-DatabaseMigrations.ps1 `
    -Environment "prod" `
    -ConnectionString $prodConnectionString `
    -CreateBackup $true `
    -SeedData $true

# Step 4: Comprehensive validation
.\Validate-DatabaseMigration.ps1 `
    -ConnectionString $prodConnectionString `
    -ValidationLevel "Comprehensive" `
    -ExportReport
```

## Rollback Procedures

### Automated Rollback

```powershell
# Rollback to specific migration
.\Deploy-DatabaseMigrations.ps1 `
    -Environment "prod" `
    -ConnectionString $prodConnectionString `
    -RollbackToMigration `
    -RollbackTarget "20250711050000_AddEmergencyTable" `
    -CreateBackup $true
```

### Manual Recovery

1. **Identify Rollback Point**: Determine target migration or backup
2. **Create Safety Backup**: Always backup current state before rollback
3. **Execute Rollback**: Use automated script or manual database restore
4. **Validate Rollback**: Run comprehensive validation suite
5. **Update Application**: Ensure application compatibility with rolled-back schema

## Security Considerations

### Production Safety

**Access Controls:**
- 🔐 Role-based database access
- 🔑 Azure Active Directory integration
- 👥 Principle of least privilege
- 🔍 Audit logging for all administrative actions

**Data Protection:**
- 🔒 Encryption at rest and in transit
- 🛡️ Advanced threat protection
- 🔍 Vulnerability scanning
- 📊 Security monitoring and alerting

**Compliance:**
- 📋 Data retention policies
- 🔄 Backup and recovery procedures
- 📝 Change management documentation
- ✅ Regulatory compliance validation

### Network Security

**Firewall Configuration:**
- 🚪 Azure service access allowed
- 🌐 Restricted public access (production)
- 🔒 VNet integration (recommended for production)
- 📍 IP whitelisting for administrative access

## Monitoring and Alerting

### Key Metrics

**Performance Metrics:**
- 📊 Database CPU utilization
- 💾 Memory usage
- 🔄 I/O operations per second
- ⏱️ Query execution times

**Availability Metrics:**
- 🔗 Connection success rate
- ⚡ Response times
- 🚨 Error rates
- 📈 Throughput metrics

### Alert Configuration

**Critical Alerts:**
- 🚨 Database unavailability
- 💾 Storage space critical (>90%)
- 🔐 Security policy violations
- ⚡ Performance degradation

**Warning Alerts:**
- ⚠️ High CPU utilization (>80%)
- 📊 Unusual query patterns
- 🔄 Backup failures
- 📈 Connection pool exhaustion

## Best Practices

### Development

1. **Version Control**: All migration scripts in source control
2. **Naming Conventions**: Descriptive migration names with timestamps
3. **Testing**: Local testing before deployment
4. **Documentation**: Clear migration descriptions and impacts

### Testing

1. **Environment Parity**: Testing environment mirrors production
2. **Data Validation**: Comprehensive testing of data integrity
3. **Performance Testing**: Load testing with realistic data volumes
4. **Security Testing**: Penetration testing and vulnerability scans

### Production

1. **Change Management**: Formal approval process for production changes
2. **Backup Strategy**: Multiple backup copies with offsite storage
3. **Monitoring**: Continuous monitoring of database health
4. **Documentation**: Detailed runbooks and recovery procedures

## Troubleshooting

### Common Issues

**Migration Failures:**
- ❌ **Timeout Errors**: Increase timeout values or optimize migrations
- ❌ **Lock Conflicts**: Schedule migrations during maintenance windows
- ❌ **Data Conflicts**: Resolve data inconsistencies before migration
- ❌ **Permission Errors**: Verify database permissions and credentials

**Performance Issues:**
- 🐌 **Slow Queries**: Analyze execution plans and add indexes
- 💾 **High Memory Usage**: Optimize query efficiency
- 🔄 **Connection Exhaustion**: Tune connection pool settings
- 📊 **Storage Issues**: Monitor and plan for storage growth

### Recovery Procedures

**Data Recovery:**
1. Identify the extent of data loss or corruption
2. Select appropriate backup (point-in-time or full backup)
3. Restore to isolated environment for validation
4. Execute full restore to production environment
5. Validate data integrity and application functionality

**Schema Recovery:**
1. Identify problematic migration or schema change
2. Create current state backup
3. Execute rollback to known good state
4. Validate schema integrity
5. Plan and execute corrective migration

## Maintenance

### Regular Tasks

**Daily:**
- 📊 Monitor database performance metrics
- 🔍 Review error logs and alerts
- ✅ Verify backup completion

**Weekly:**
- 📈 Analyze performance trends
- 🔄 Review and rotate logs
- 🧹 Clean up old backup files

**Monthly:**
- 🛡️ Security vulnerability assessment
- 📊 Capacity planning review
- 📝 Update documentation and procedures

**Quarterly:**
- 🔍 Comprehensive security audit
- ⚡ Performance optimization review
- 💾 Disaster recovery testing
- 📚 Training and knowledge updates

## Contact Information

**Database Team:**
- 📧 Email: database-team@flightcompanion.com
- 📞 On-call: +1-800-DB-SUPPORT

**Emergency Contacts:**
- 🚨 Emergency Hotline: +1-800-FLIGHT-HELP
- 📧 Emergency Email: emergency@flightcompanion.com

**Documentation:**
- 📚 Internal Wiki: https://wiki.flightcompanion.com/database
- 📖 API Documentation: https://docs.flightcompanion.com
- 🔧 Runbooks: https://runbooks.flightcompanion.com/database
