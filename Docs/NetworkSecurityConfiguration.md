# Network Security Configuration Guide

## Overview

This document provides comprehensive guidance on implementing and managing network security for the Flight Companion Platform using Azure Network Security Groups (NSGs) and Application Gateway with Web Application Firewall (WAF).

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Network Security Groups (NSGs)](#network-security-groups-nsgs)
3. [Application Gateway Configuration](#application-gateway-configuration)
4. [Web Application Firewall (WAF)](#web-application-firewall-waf)
5. [Virtual Network Segmentation](#virtual-network-segmentation)
6. [Deployment and Management](#deployment-and-management)
7. [Monitoring and Alerting](#monitoring-and-alerting)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)

## Architecture Overview

The Flight Companion Platform implements a multi-tier security architecture with the following components:

```
Internet → Application Gateway (WAF) → App Service → SQL Database
                                   ↓
                            Management/Operations
```

### Security Layers

1. **Perimeter Security**: Application Gateway with WAF v2
2. **Network Segmentation**: Virtual Network with segregated subnets
3. **Access Control**: Network Security Groups with granular rules
4. **Data Protection**: Private endpoints for database connectivity
5. **Monitoring**: Diagnostic logging and alerting

## Network Security Groups (NSGs)

### NSG Structure

The platform implements four primary NSGs:

#### 1. Application Gateway NSG (`fc-{env}-nsg-appgw`)

**Purpose**: Controls traffic to and from the Application Gateway subnet

**Key Rules**:
- Allow HTTP (80) and HTTPS (443) from Internet
- Allow Azure Infrastructure traffic (65200-65535)
- Allow management traffic for gateway operations
- Deny all other inbound traffic

```json
{
  "inboundRules": [
    {
      "name": "AllowHTTPFromInternet",
      "priority": 1000,
      "direction": "Inbound",
      "access": "Allow",
      "protocol": "Tcp",
      "sourceAddressPrefix": "*",
      "sourcePortRange": "*",
      "destinationAddressPrefix": "*",
      "destinationPortRange": "80"
    },
    {
      "name": "AllowHTTPSFromInternet", 
      "priority": 1010,
      "direction": "Inbound",
      "access": "Allow",
      "protocol": "Tcp",
      "sourceAddressPrefix": "*",
      "sourcePortRange": "*",
      "destinationAddressPrefix": "*",
      "destinationPortRange": "443"
    }
  ]
}
```

#### 2. App Service NSG (`fc-{env}-nsg-app`)

**Purpose**: Controls traffic to the application tier

**Key Rules**:
- Allow HTTP traffic from Application Gateway subnet only
- Allow management traffic from Azure services
- Block direct internet access
- Allow outbound HTTPS for external API calls

#### 3. Database NSG (`fc-{env}-nsg-data`)

**Purpose**: Secures database access

**Key Rules**:
- Allow SQL Server traffic (1433) from App Service subnet only
- Block all direct internet access
- Allow management traffic from Management subnet
- Enable private endpoint connectivity

#### 4. Management NSG (`fc-{env}-nsg-mgmt`)

**Purpose**: Secures management and operations access

**Key Rules**:
- Restricted SSH/RDP access from specific IP ranges
- Allow monitoring and logging traffic
- Block unnecessary internet access

### Environment-Specific Configurations

#### Development Environment
- More permissive rules for development access
- SSH/RDP access from broader IP ranges
- Simplified logging requirements

#### Test Environment
- Balanced security with testing flexibility
- WAF in Detection mode
- Enhanced logging for testing validation

#### Production Environment
- Maximum security restrictions
- WAF in Prevention mode
- Comprehensive logging and monitoring
- Private endpoints for all data services

## Application Gateway Configuration

### SKU and Scaling

The Application Gateway uses different SKUs based on environment:

- **Development**: Standard_v2 with 1-3 instances
- **Test**: WAF_v2 with 2-5 instances  
- **Production**: WAF_v2 with 3-10 instances

### SSL/TLS Configuration

#### SSL Policy
- Uses AppGwSslPolicy20220101S for strong encryption
- Supports TLS 1.2 and 1.3 only
- Disables weak cipher suites

#### Certificate Management
- Azure Key Vault integration for certificate storage
- Automatic certificate renewal support
- Wildcard certificates for subdomain support

### Listeners and Rules

#### HTTP Listener
- Redirects all HTTP traffic to HTTPS
- Custom error pages for security

#### HTTPS Listener
- SSL termination at gateway
- Backend communication over HTTP (internal network)
- Custom health probes for application monitoring

### Backend Configuration

#### Backend Pools
- App Service backend with automatic discovery
- Health probe configuration
- Connection draining for graceful updates

#### HTTP Settings
- Cookie-based affinity when needed
- Request timeout configuration
- Custom headers for backend identification

## Web Application Firewall (WAF)

### WAF Policy Configuration

The WAF policy provides comprehensive protection against web vulnerabilities:

#### Managed Rule Sets

1. **OWASP Core Rule Set 3.2**
   - SQL Injection protection
   - Cross-Site Scripting (XSS) prevention
   - Local File Inclusion (LFI) detection
   - Remote File Inclusion (RFI) protection

2. **Microsoft BotManager Rules**
   - Bot detection and mitigation
   - Rate limiting for suspicious activity

#### Custom Rules

1. **Rate Limiting Rule**
   ```json
   {
     "name": "RateLimitRule",
     "priority": 1,
     "ruleType": "RateLimitRule",
     "action": "Block",
     "rateLimitDuration": "PT1M",
     "rateLimitThreshold": 100,
     "matchConditions": [
       {
         "matchVariable": "RemoteAddr",
         "operator": "IPMatch",
         "matchValue": ["*"]
       }
     ]
   }
   ```

2. **Geo-blocking Rule**
   ```json
   {
     "name": "GeoBlockRule",
     "priority": 2,
     "ruleType": "MatchRule",
     "action": "Block",
     "matchConditions": [
       {
         "matchVariable": "RemoteAddr",
         "operator": "GeoMatch",
         "matchValue": ["high-risk-countries"]
       }
     ]
   }
   ```

### WAF Modes

#### Detection Mode
- Logs threats without blocking
- Used in development and testing
- Helps tune rules before enforcement

#### Prevention Mode
- Actively blocks malicious requests
- Used in production environments
- Provides real-time protection

### Exclusions and Tuning

Custom exclusions can be configured for:
- False positive reduction
- Application-specific requirements
- Third-party integrations

## Virtual Network Segmentation

### Subnet Architecture

The virtual network is segmented into specialized subnets:

```
VNet: 10.x.0.0/16
├── GatewaySubnet: 10.x.0.0/27 (VPN Gateway)
├── AppGateway: 10.x.1.0/24 (Application Gateway)
├── AppService: 10.x.2.0/24 (App Service Integration)
├── Database: 10.x.3.0/24 (Database Services)
└── Management: 10.x.4.0/24 (Management Tools)
```

### Service Endpoints

Service endpoints are configured for:
- Azure SQL Database
- Azure Key Vault
- Azure Storage
- Azure Container Registry

### Private Endpoints

Private endpoints provide secure connectivity for:
- SQL Server instances
- Key Vault access
- Storage accounts
- Container registries

## Deployment and Management

### Automated Deployment

#### Using PowerShell Script
```powershell
# Deploy network security infrastructure
.\Scripts\Deploy-NetworkSecurity.ps1 -Environment prod -SubscriptionId "your-subscription-id"

# Validate deployment
.\Scripts\Test-NetworkSecurity.ps1 -Environment prod -SubscriptionId "your-subscription-id" -IncludeSecurityTests
```

#### Using Azure CLI
```bash
# Deploy Bicep template
az deployment group create \
  --resource-group rg-flight-companion-prod \
  --template-file infra/bicep/network-security.bicep \
  --parameters @infra/bicep/parameters/network-security.prod.json
```

### Environment-Specific Parameters

Parameters are managed through JSON files:
- `network-security.dev.json` - Development settings
- `network-security.test.json` - Testing settings  
- `network-security.prod.json` - Production settings

### Infrastructure as Code

All network security components are defined in Bicep templates:
- `network-security.bicep` - Main template
- Parameter files for environment-specific configurations
- Modular design for reusability

## Monitoring and Alerting

### Diagnostic Logging

#### NSG Flow Logs
- Enabled for all NSGs
- Stored in Log Analytics workspace
- Includes source/destination analysis

#### Application Gateway Logs
- Access logs for request tracking
- Performance logs for optimization
- Firewall logs for security analysis

#### WAF Logs
- Blocked request analysis
- Attack pattern identification
- False positive detection

### Azure Monitor Integration

#### Key Metrics
- Request count and latency
- Error rates and status codes
- Firewall rule triggers
- Network traffic patterns

#### Alert Rules
- High error rates
- Suspicious traffic patterns
- WAF rule violations
- Performance degradation

### Log Analytics Queries

#### Security Analysis
```kusto
// WAF blocked requests
AzureDiagnostics
| where Category == "ApplicationGatewayFirewallLog"
| where action_s == "Blocked"
| summarize count() by clientIP_s, ruleId_s
| order by count_ desc
```

#### Performance Monitoring
```kusto
// Application Gateway performance
AzureDiagnostics  
| where Category == "ApplicationGatewayAccessLog"
| summarize avg(timeTaken_d), count() by bin(TimeGenerated, 5m)
| render timechart
```

## Troubleshooting

### Common Issues

#### 1. Application Gateway Health Probe Failures
**Symptoms**: Backend marked as unhealthy
**Causes**: 
- Incorrect probe configuration
- NSG blocking probe traffic
- Application endpoint issues

**Resolution**:
```powershell
# Check backend health
az network application-gateway show-backend-health \
  --resource-group rg-flight-companion-prod \
  --name fc-prod-appgw
```

#### 2. WAF False Positives
**Symptoms**: Legitimate requests blocked
**Causes**:
- Overly restrictive WAF rules
- Application-specific patterns triggering rules

**Resolution**:
1. Review WAF logs to identify triggered rules
2. Create rule exclusions
3. Adjust rule sensitivity

#### 3. NSG Rule Conflicts
**Symptoms**: Unexpected traffic blocking
**Causes**:
- Overlapping rule priorities
- Incorrect rule configuration

**Resolution**:
```powershell
# Analyze NSG rules
az network nsg rule list \
  --resource-group rg-flight-companion-prod \
  --nsg-name fc-prod-nsg-app \
  --output table
```

### Debugging Commands

#### Network Connectivity Testing
```bash
# Test connectivity between subnets
az network watcher test-connectivity \
  --source-resource vm-test \
  --dest-address 10.2.3.4 \
  --dest-port 1433
```

#### Traffic Analysis
```bash
# Enable packet capture
az network watcher packet-capture create \
  --resource-group rg-flight-companion-prod \
  --vm vm-test \
  --name packet-capture-1
```

## Security Best Practices

### 1. Principle of Least Privilege
- Grant minimum required access
- Regular access reviews
- Just-in-time access where possible

### 2. Defense in Depth
- Multiple security layers
- Complementary security controls
- Fail-safe defaults

### 3. Regular Security Updates
- Keep WAF rules updated
- Apply security patches
- Monitor threat intelligence

### 4. Monitoring and Alerting
- Continuous security monitoring
- Automated alert responses
- Regular security assessments

### 5. Compliance and Governance
- Document security configurations
- Regular compliance audits
- Change management processes

## Maintenance and Updates

### Regular Tasks

#### Weekly
- Review WAF logs for new attack patterns
- Check Application Gateway health status
- Validate SSL certificate expiration dates

#### Monthly  
- Update WAF managed rules
- Review and optimize NSG rules
- Analyze security metrics and trends

#### Quarterly
- Security assessment and penetration testing
- Review and update security policies
- Disaster recovery testing

### Change Management

All security changes should follow:
1. Development environment testing
2. Test environment validation
3. Production deployment with rollback plan
4. Post-deployment verification

### Documentation Updates

Keep documentation current with:
- Configuration changes
- New security requirements
- Lessons learned from incidents
- Updated procedures and runbooks

## Conclusion

The network security implementation provides comprehensive protection for the Flight Companion Platform through:

- Multi-layered security architecture
- Automated deployment and validation
- Comprehensive monitoring and alerting
- Environment-specific configurations
- Best practice security controls

Regular maintenance, monitoring, and updates ensure the security posture remains effective against evolving threats while supporting application performance and availability requirements.
