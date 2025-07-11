# Azure SQL Database Configuration Guide

## 📋 Overview
This document provides comprehensive guidance for configuring Azure SQL Database for the Flight Companion Platform with proper DTU sizing and backup retention policies across development, test, and production environments.

## 🏗️ Database Architecture

### Environment-Specific Configuration

#### Development Environment
- **SKU**: Basic (5 DTU)
- **Storage**: 2 GB maximum
- **Backup Retention**: 7 days
- **Features**: 
  - Local backup redundancy
  - Basic performance tier
  - Single availability zone
- **Estimated Cost**: $5-15 AUD/month

#### Test Environment  
- **SKU**: Standard S1 (20 DTU)
- **Storage**: 10 GB maximum
- **Backup Retention**: 14 days short-term + 4 weeks long-term
- **Features**:
  - Local backup redundancy
  - Enhanced performance tier
  - Single availability zone
- **Estimated Cost**: $75-100 AUD/month

#### Production Environment
- **SKU**: Standard S3 (100 DTU)
- **Storage**: 100 GB maximum
- **Backup Retention**: 35 days short-term + Long-term (12W/12M/5Y)
- **Features**:
  - Zone redundancy for high availability
  - Geo-redundant backup storage (optional)
  - Read scale-out capability
  - Advanced security features
- **Estimated Cost**: $300-400 AUD/month

## 🔧 Infrastructure Configuration

### Bicep Template Features

The enhanced `database.bicep` template includes:

1. **Environment-Aware Sizing**
   ```bicep
   var databaseConfig = {
     dev: { sku: { name: 'Basic', tier: 'Basic', capacity: 5 } }
     test: { sku: { name: 'S1', tier: 'Standard', capacity: 20 } }
     prod: { sku: { name: 'S3', tier: 'Standard', capacity: 100 } }
   }
   ```

2. **Backup Retention Policies**
   - Short-term: 7-35 days based on environment
   - Long-term: Weekly, monthly, yearly retention for production

3. **Security Features**
   - Private endpoint connectivity
   - Transparent Data Encryption (TDE)
   - Azure AD authentication
   - SQL auditing enabled

4. **Monitoring Integration**
   - Application Insights logging
   - Diagnostic settings
   - Performance metrics collection

## 📊 Backup Strategy

### Short-Term Retention
- **Development**: 7 days
- **Test**: 14 days  
- **Production**: 35 days

### Long-Term Retention (Production Only)
- **Weekly**: 12 weeks retention
- **Monthly**: 12 months retention
- **Yearly**: 5 years retention

### Backup Types
1. **Full Backups**: Weekly (automated)
2. **Differential Backups**: Every 12-24 hours
3. **Transaction Log Backups**: Every 5-10 minutes

## 🚀 Deployment Instructions

### Prerequisites
1. Azure CLI installed and authenticated
2. Appropriate Azure RBAC permissions
3. Resource Group created (TASK-083)
4. Virtual Network configured

### Step 1: Deploy Database Infrastructure
```powershell
# Development Environment
.\Scripts\Deploy-SqlDatabase.ps1 `
  -EnvironmentName dev `
  -ResourceGroupName rg-netapp-dev-001 `
  -SubscriptionId "your-subscription-id"

# Production Environment with Geo-Redundant Backup
.\Scripts\Deploy-SqlDatabase.ps1 `
  -EnvironmentName prod `
  -ResourceGroupName rg-netapp-prod-001 `
  -SubscriptionId "your-subscription-id" `
  -EnableGeoRedundantBackup
```

### Step 2: Verify Deployment
```powershell
# Check database status
.\Scripts\Manage-SqlDatabase.ps1 `
  -ResourceGroupName rg-netapp-prod-001 `
  -SqlServerName sql-netapp-prod-001 `
  -DatabaseName sqldb-netapp-prod-001 `
  -Action status
```

### Step 3: Update Application Configuration
1. Retrieve connection string from Key Vault
2. Update application `appsettings.json`
3. Run Entity Framework migrations

## 🔐 Security Configuration

### Network Security
- **Private Endpoint**: Database accessible only from VNet
- **Firewall Rules**: No public internet access
- **TLS Version**: Minimum 1.2 required

### Authentication
- **Azure AD Integration**: Primary authentication method
- **SQL Authentication**: Secondary method with strong passwords
- **Managed Identity**: For application connections

### Data Protection
- **Transparent Data Encryption**: Enabled by default
- **Always Encrypted**: For sensitive columns (future enhancement)
- **Dynamic Data Masking**: For non-production environments

## 📈 Performance Optimization

### DTU Sizing Guidelines

#### Development (5 DTU)
- **Concurrent Users**: 1-5
- **Query Complexity**: Simple CRUD operations
- **Data Volume**: < 1 GB active data

#### Test (20 DTU)  
- **Concurrent Users**: 5-15
- **Query Complexity**: Moderate joins and aggregations
- **Data Volume**: 1-5 GB active data

#### Production (100 DTU)
- **Concurrent Users**: 50-100
- **Query Complexity**: Complex reporting queries
- **Data Volume**: 10-50 GB active data

### Scaling Considerations
- Monitor DTU utilization regularly
- Scale up when consistently > 80% utilization
- Consider Premium tier for > 100 DTU requirements
- Implement read replicas for read-heavy workloads

## 🔍 Monitoring & Alerting

### Key Metrics to Monitor
1. **DTU Utilization**: Target < 80% average
2. **Storage Usage**: Monitor against tier limits
3. **Connection Count**: Track active connections
4. **Query Performance**: Identify slow queries
5. **Backup Success**: Ensure all backups complete

### Alerting Rules
- DTU utilization > 80% for 10 minutes
- Storage usage > 85% of limit
- Backup failure detection
- Connection timeouts > 5% rate

## 🛠️ Maintenance Tasks

### Daily Operations
- Monitor performance metrics
- Review backup success logs
- Check for blocking queries

### Weekly Operations  
- Database consistency checks
- Index maintenance analysis
- Security log review

### Monthly Operations
- Backup restore testing
- Performance trend analysis
- Security access review

## 🔄 Disaster Recovery

### Backup Recovery Options

#### Point-in-Time Restore
```powershell
.\Scripts\Manage-SqlDatabase.ps1 `
  -ResourceGroupName rg-netapp-prod-001 `
  -SqlServerName sql-netapp-prod-001 `
  -DatabaseName sqldb-netapp-prod-001 `
  -Action restore `
  -RestorePointInTime "2025-07-11T10:00:00Z" `
  -TargetDatabaseName sqldb-netapp-prod-001-restored
```

#### Geo-Restore (Production)
- Available when geo-redundant backup is enabled
- Restore to any Azure region
- RPO: < 1 hour

### Business Continuity Planning
1. **RTO Target**: < 4 hours for production
2. **RPO Target**: < 15 minutes for production  
3. **Testing Schedule**: Monthly DR drills
4. **Documentation**: Incident response procedures

## 💰 Cost Optimization

### Right-Sizing Strategies
1. **Monitor DTU Usage**: Scale down if consistently < 40%
2. **Storage Optimization**: Regular data archiving
3. **Backup Storage**: Use local redundancy for non-critical environments
4. **Reserved Capacity**: Consider 1-year reservations for production

### Cost Management
- Set up budget alerts
- Regular cost analysis reviews
- Automated scaling policies
- Development environment shutdown schedules

## 🔗 Integration Points

### Application Integration
1. **Connection String Management**: Azure Key Vault
2. **Entity Framework**: Code-first migrations
3. **Connection Pooling**: Optimized for .NET 8
4. **Retry Policies**: Transient fault handling

### DevOps Integration
1. **Schema Migrations**: Automated via CI/CD
2. **Test Data Management**: Synthetic data generation
3. **Performance Testing**: Load testing with realistic data
4. **Backup Validation**: Automated restore testing

## 📋 Troubleshooting Guide

### Common Issues

#### High DTU Utilization
1. Identify expensive queries using Query Performance Insight
2. Optimize indexing strategy
3. Consider read replicas for reporting workloads
4. Scale up to higher tier if needed

#### Connection Timeouts
1. Review connection string configuration
2. Implement proper connection pooling
3. Check for blocking queries
4. Verify network connectivity

#### Backup Failures
1. Check storage account permissions
2. Verify backup retention settings
3. Monitor storage space availability
4. Review diagnostic logs

### Support Resources
- Azure SQL Database documentation
- Performance troubleshooting guides
- Azure support ticket system
- Community forums and Stack Overflow

## 🎯 Success Criteria

### Performance Metrics
- [ ] DTU utilization < 80% during peak hours
- [ ] Query response time < 100ms for 95th percentile
- [ ] Connection success rate > 99.9%
- [ ] Zero data loss incidents

### Backup Validation
- [ ] All scheduled backups completing successfully
- [ ] Point-in-time restore tested monthly
- [ ] Long-term retention policies configured
- [ ] Geo-redundant backup validated (production)

### Security Compliance
- [ ] Private endpoint connectivity verified
- [ ] Azure AD authentication enabled
- [ ] Transparent data encryption active
- [ ] SQL auditing configured and monitored

---

**Next Steps**: Proceed to TASK-086 (Azure Key Vault Setup) for secure configuration management
