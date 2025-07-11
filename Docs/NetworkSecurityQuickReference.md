# Network Security Quick Reference Guide

## Deployment Commands

### Deploy Network Security Infrastructure
```powershell
# Deploy to development
.\Scripts\Deploy-NetworkSecurity.ps1 -Environment dev -SubscriptionId "your-sub-id"

# Deploy to production with validation
.\Scripts\Deploy-NetworkSecurity.ps1 -Environment prod -SubscriptionId "your-sub-id" -ValidateOnly

# Deploy with What-If analysis
.\Scripts\Deploy-NetworkSecurity.ps1 -Environment prod -SubscriptionId "your-sub-id" -WhatIf
```

### Validate Network Security
```powershell
# Basic validation
.\Scripts\Test-NetworkSecurity.ps1 -Environment prod -SubscriptionId "your-sub-id"

# Full security testing
.\Scripts\Test-NetworkSecurity.ps1 -Environment prod -SubscriptionId "your-sub-id" -IncludeSecurityTests -IncludePerformanceTests
```

### Full Deployment with Network Security
```powershell
# Deploy everything including network security
.\Scripts\Deploy-ToAzure.ps1 -Environment prod

# Deploy only network security
.\Scripts\Deploy-ToAzure.ps1 -Environment prod -NetworkSecurityOnly

# Deploy without network security
.\Scripts\Deploy-ToAzure.ps1 -Environment prod -SkipNetworkSecurity
```

## Azure CLI Quick Commands

### Application Gateway
```bash
# Check Application Gateway status
az network application-gateway show \
  --resource-group rg-flight-companion-prod \
  --name fc-prod-appgw \
  --query "operationalState"

# View backend health
az network application-gateway show-backend-health \
  --resource-group rg-flight-companion-prod \
  --name fc-prod-appgw

# Update WAF policy mode
az network application-gateway waf-policy update \
  --resource-group rg-flight-companion-prod \
  --name fc-prod-waf-policy \
  --mode Prevention
```

### Network Security Groups
```bash
# List NSG rules
az network nsg rule list \
  --resource-group rg-flight-companion-prod \
  --nsg-name fc-prod-nsg-app \
  --output table

# Add new NSG rule
az network nsg rule create \
  --resource-group rg-flight-companion-prod \
  --nsg-name fc-prod-nsg-app \
  --name AllowSpecificService \
  --priority 1100 \
  --source-address-prefixes 10.2.1.0/24 \
  --destination-port-ranges 8080 \
  --access Allow \
  --protocol Tcp
```

### Virtual Network
```bash
# Check VNet configuration
az network vnet show \
  --resource-group rg-flight-companion-prod \
  --name vnet-flight-companion-prod

# List subnets
az network vnet subnet list \
  --resource-group rg-flight-companion-prod \
  --vnet-name vnet-flight-companion-prod \
  --output table
```

## Resource Names by Environment

### Development (dev)
- Resource Group: `rg-flight-companion-dev`
- Virtual Network: `vnet-flight-companion-dev`
- Application Gateway: `fc-dev-appgw`
- WAF Policy: `fc-dev-waf-policy`
- Public IP: `fc-dev-pip-appgw`
- NSGs: `fc-dev-nsg-{appgw|app|data|mgmt}`

### Test (test)
- Resource Group: `rg-flight-companion-test`
- Virtual Network: `vnet-flight-companion-test`
- Application Gateway: `fc-test-appgw`
- WAF Policy: `fc-test-waf-policy`
- Public IP: `fc-test-pip-appgw`
- NSGs: `fc-test-nsg-{appgw|app|data|mgmt}`

### Production (prod)
- Resource Group: `rg-flight-companion-prod`
- Virtual Network: `vnet-flight-companion-prod`
- Application Gateway: `fc-prod-appgw`
- WAF Policy: `fc-prod-waf-policy`
- Public IP: `fc-prod-pip-appgw`
- NSGs: `fc-prod-nsg-{appgw|app|data|mgmt}`

## Common Log Analytics Queries

### WAF Security Analysis
```kusto
// Top blocked IPs
AzureDiagnostics
| where Category == "ApplicationGatewayFirewallLog"
| where action_s == "Blocked"
| summarize count() by clientIP_s
| top 10 by count_

// Attack patterns
AzureDiagnostics
| where Category == "ApplicationGatewayFirewallLog" 
| where action_s == "Blocked"
| summarize count() by ruleId_s, message_s
| order by count_ desc
```

### Performance Monitoring
```kusto
// Response time analysis
AzureDiagnostics
| where Category == "ApplicationGatewayAccessLog"
| summarize avg(timeTaken_d), percentile(timeTaken_d, 95) by bin(TimeGenerated, 5m)
| render timechart

// Error rate tracking
AzureDiagnostics
| where Category == "ApplicationGatewayAccessLog"
| summarize total=count(), errors=countif(httpStatus_d >= 400) by bin(TimeGenerated, 5m)
| extend error_rate = (errors * 100.0) / total
| render timechart
```

### NSG Flow Analysis
```kusto
// Top traffic flows
AzureNetworkAnalytics_CL
| where SubType_s == "FlowLog"
| summarize count() by SrcIP_s, DestIP_s, DestPort_d
| top 20 by count_

// Blocked traffic analysis
AzureNetworkAnalytics_CL
| where SubType_s == "FlowLog" and FlowStatus_s == "D"
| summarize count() by SrcIP_s, Rule_s
| order by count_ desc
```

## Environment Configuration Summary

| Setting | Development | Test | Production |
|---------|-------------|------|------------|
| VNet CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |
| App Gateway SKU | Standard_v2 | WAF_v2 | WAF_v2 |
| Min Instances | 1 | 2 | 3 |
| Max Instances | 3 | 5 | 10 |
| WAF Mode | Detection | Detection | Prevention |
| DDoS Protection | No | No | Yes |
| Private Endpoints | No | Yes | Yes |
| SSL Policy | Basic | Intermediate | Strict |

## Emergency Procedures

### WAF Blocking Legitimate Traffic
1. Switch WAF to Detection mode:
   ```bash
   az network application-gateway waf-policy update \
     --resource-group rg-flight-companion-prod \
     --name fc-prod-waf-policy \
     --mode Detection
   ```
2. Identify false positive rules in logs
3. Create rule exclusions
4. Switch back to Prevention mode

### Application Gateway Health Issues
1. Check backend health:
   ```bash
   az network application-gateway show-backend-health \
     --resource-group rg-flight-companion-prod \
     --name fc-prod-appgw
   ```
2. Verify NSG rules allow health probe traffic
3. Check application endpoint health
4. Review diagnostic logs

### Security Incident Response
1. Enable packet capture if needed:
   ```bash
   az network watcher packet-capture create \
     --resource-group rg-flight-companion-prod \
     --vm vm-jumpbox \
     --name security-incident-capture
   ```
2. Review security logs for attack patterns
3. Implement additional blocking rules if necessary
4. Document incident and remediation steps

## Troubleshooting Checklist

### Application Gateway Issues
- [ ] Check operational state
- [ ] Verify backend health
- [ ] Review listener configuration
- [ ] Validate SSL certificates
- [ ] Check NSG rules for port 65200-65535

### WAF Issues
- [ ] Verify WAF policy is enabled
- [ ] Check rule mode (Detection vs Prevention)
- [ ] Review managed rule sets
- [ ] Validate custom rule configuration
- [ ] Check for rule exclusions

### Network Connectivity Issues
- [ ] Verify NSG rules
- [ ] Check route tables
- [ ] Validate service endpoints
- [ ] Test private endpoint connectivity
- [ ] Review diagnostic logs

### Performance Issues
- [ ] Check Application Gateway capacity
- [ ] Verify auto-scaling configuration
- [ ] Review backend response times
- [ ] Analyze traffic patterns
- [ ] Monitor resource utilization

## Contact Information

- **Security Team**: security@flightcompanion.com
- **Operations Team**: ops@flightcompanion.com
- **On-Call Support**: +1-555-SUPPORT

## Additional Resources

- [Azure Application Gateway Documentation](https://docs.microsoft.com/en-us/azure/application-gateway/)
- [Azure WAF Documentation](https://docs.microsoft.com/en-us/azure/web-application-firewall/)
- [Azure NSG Documentation](https://docs.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
- [Flight Companion Security Policies](./SecurityPolicies.md)
- [Incident Response Procedures](./IncidentResponse.md)
