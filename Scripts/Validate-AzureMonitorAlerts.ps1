# ==================================================================================================
# Validate Azure Monitor Alerts Configuration - PowerShell Script
# Validates Bicep templates and configuration files without Azure CLI
# ==================================================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('dev', 'test', 'prod')]
    [string]$Environment = 'dev',

    [Parameter(Mandatory = $false)]
    [switch]$GenerateReport,

    [Parameter(Mandatory = $false)]
    [string]$ReportPath = ".\validation-report-$Environment.html"
)

# Set strict mode and error action preference
Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# ==================================================================================================
# Functions
# ==================================================================================================

function Write-StatusMessage {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-BicepTemplate {
    param(
        [string]$TemplatePath
    )
    
    Write-StatusMessage "Validating Bicep template: $TemplatePath"
    
    $validationResults = @{
        TemplatePath = $TemplatePath
        Exists = $false
        Syntax = @{
            Valid = $false
            Errors = @()
            Warnings = @()
        }
        Structure = @{
            HasParameters = $false
            HasResources = $false
            HasOutputs = $false
        }
        Issues = @()
    }
    
    try {
        # Check if file exists
        if (Test-Path $TemplatePath) {
            $validationResults.Exists = $true
            Write-StatusMessage "✓ Template file exists" -Level "SUCCESS"
        }
        else {
            $validationResults.Issues += "Template file does not exist"
            Write-StatusMessage "✗ Template file does not exist" -Level "ERROR"
            return $validationResults
        }
        
        # Read and parse template content
        $templateContent = Get-Content -Path $TemplatePath -Raw
        
        # Basic syntax checks
        if ($templateContent -match '@description') {
            Write-StatusMessage "✓ Found parameter descriptions" -Level "SUCCESS"
        }
        
        if ($templateContent -match 'param\s+\w+') {
            $validationResults.Structure.HasParameters = $true
            Write-StatusMessage "✓ Template has parameters" -Level "SUCCESS"
        }
        
        if ($templateContent -match 'resource\s+\w+') {
            $validationResults.Structure.HasResources = $true
            Write-StatusMessage "✓ Template has resources" -Level "SUCCESS"
        }
        
        if ($templateContent -match 'output\s+\w+') {
            $validationResults.Structure.HasOutputs = $true
            Write-StatusMessage "✓ Template has outputs" -Level "SUCCESS"
        }
        
        # Check for alert-specific resources
        if ($templateContent -match 'Microsoft\.Insights/metricAlerts') {
            Write-StatusMessage "✓ Found metric alert resources" -Level "SUCCESS"
        }
        
        if ($templateContent -match 'Microsoft\.Insights/scheduledQueryRules') {
            Write-StatusMessage "✓ Found scheduled query rule resources" -Level "SUCCESS"
        }
        
        # Check for proper API versions
        $apiVersionPattern = '@\d{4}-\d{2}-\d{2}'
        if ($templateContent -match $apiVersionPattern) {
            Write-StatusMessage "✓ Found API versions" -Level "SUCCESS"
        }
        
        $validationResults.Syntax.Valid = $true
        
    }
    catch {
        $validationResults.Syntax.Errors += $_.Exception.Message
        Write-StatusMessage "✗ Template validation error: $($_.Exception.Message)" -Level "ERROR"
    }
    
    return $validationResults
}

function Test-ParameterFile {
    param(
        [string]$ParameterPath
    )
    
    Write-StatusMessage "Validating parameter file: $ParameterPath"
    
    $validationResults = @{
        ParameterPath = $ParameterPath
        Exists = $false
        ValidJson = $false
        HasRequiredParams = $false
        AlertParams = @()
        Issues = @()
    }
    
    try {
        # Check if file exists
        if (Test-Path $ParameterPath) {
            $validationResults.Exists = $true
            Write-StatusMessage "✓ Parameter file exists" -Level "SUCCESS"
        }
        else {
            $validationResults.Issues += "Parameter file does not exist"
            Write-StatusMessage "✗ Parameter file does not exist" -Level "ERROR"
            return $validationResults
        }
        
        # Parse JSON
        $parameterContent = Get-Content -Path $ParameterPath -Raw | ConvertFrom-Json
        $validationResults.ValidJson = $true
        Write-StatusMessage "✓ Valid JSON syntax" -Level "SUCCESS"
        
        # Check required parameters
        $requiredParams = @('workloadName', 'location', 'environmentName', 'ownerEmail')
        $hasAllRequired = $true
        
        foreach ($param in $requiredParams) {
            if ($parameterContent.parameters.PSObject.Properties.Name -contains $param) {
                Write-StatusMessage "✓ Found required parameter: $param" -Level "SUCCESS"
            }
            else {
                $hasAllRequired = $false
                $validationResults.Issues += "Missing required parameter: $param"
                Write-StatusMessage "✗ Missing required parameter: $param" -Level "ERROR"
            }
        }
        
        $validationResults.HasRequiredParams = $hasAllRequired
        
        # Check alert-specific parameters
        $alertParams = @('enableAlerts', 'alertEmailAddress', 'alertingEnvironment')
        foreach ($param in $alertParams) {
            if ($parameterContent.parameters.PSObject.Properties.Name -contains $param) {
                $validationResults.AlertParams += $param
                Write-StatusMessage "✓ Found alert parameter: $param" -Level "SUCCESS"
            }
            else {
                Write-StatusMessage "⚠ Optional alert parameter not found: $param" -Level "WARNING"
            }
        }
        
    }
    catch {
        $validationResults.Issues += "JSON parsing error: $($_.Exception.Message)"
        Write-StatusMessage "✗ Parameter file error: $($_.Exception.Message)" -Level "ERROR"
    }
    
    return $validationResults
}
}

function Test-PowerShellScripts {
    param(
        [string]$ScriptsPath
    )
    
    Write-StatusMessage "Validating PowerShell scripts in: $ScriptsPath"
    
    $validationResults = @{
        ScriptsPath = $ScriptsPath
        Scripts = @()
        TotalScripts = 0
        ValidScripts = 0
    }
    
    try {
        $scriptFiles = Get-ChildItem -Path $ScriptsPath -Filter "*Alert*.ps1" -ErrorAction SilentlyContinue
        $validationResults.TotalScripts = $scriptFiles.Count
        
        foreach ($script in $scriptFiles) {
            Write-StatusMessage "Checking script: $($script.Name)"
            
            $scriptResult = @{
                Name = $script.Name
                Path = $script.FullName
                Valid = $false
                HasParameters = $false
                HasFunctions = $false
                Issues = @()
            }
            
            try {
                $scriptContent = Get-Content -Path $script.FullName -Raw
                
                # Check for parameter block
                if ($scriptContent -match '\[CmdletBinding\(\)\]' -and $scriptContent -match 'param\s*\(') {
                    $scriptResult.HasParameters = $true
                    Write-StatusMessage "  ✓ Has parameter block" -Level "SUCCESS"
                }
                
                # Check for functions
                if ($scriptContent -match 'function\s+\w+') {
                    $scriptResult.HasFunctions = $true
                    Write-StatusMessage "  ✓ Contains functions" -Level "SUCCESS"
                }
                
                # Check for error handling
                if ($scriptContent -match '\$ErrorActionPreference' -and $scriptContent -match 'try\s*\{') {
                    Write-StatusMessage "  ✓ Has error handling" -Level "SUCCESS"
                }
                
                # Check for Azure PowerShell commands
                if ($scriptContent -match 'Get-Az' -or $scriptContent -match 'Set-Az' -or $scriptContent -match 'New-Az') {
                    Write-StatusMessage "  ✓ Uses Azure PowerShell commands" -Level "SUCCESS"
                }
                
                $scriptResult.Valid = $true
                $validationResults.ValidScripts++
                
            }
            catch {
                $scriptResult.Issues += $_.Exception.Message
                Write-StatusMessage "  ✗ Script validation error: $($_.Exception.Message)" -Level "ERROR"
            }
            
            $validationResults.Scripts += $scriptResult
        }
        
    }
    catch {
        Write-StatusMessage "Error validating scripts: $($_.Exception.Message)" -Level "ERROR"
    }
    
    return $validationResults
}

function Generate-ValidationReport {
    param(
        [hashtable]$TemplateResults,
        [hashtable]$ParameterResults,
        [hashtable]$ScriptResults,
        [string]$Environment,
        [string]$OutputPath
    )
    
    Write-StatusMessage "Generating validation report..."
    
    $overallScore = 0
    $totalTests = 0
    $passedTests = 0
    
    # Calculate scores
    if ($TemplateResults.Syntax.Valid) { $passedTests++ }
    $totalTests++
    
    if ($ParameterResults.ValidJson) { $passedTests++ }
    $totalTests++
    
    if ($ParameterResults.HasRequiredParams) { $passedTests++ }
    $totalTests++
    
    if ($ScriptResults.ValidScripts -gt 0) { $passedTests++ }
    $totalTests++
    
    if ($totalTests -gt 0) {
        $overallScore = [math]::Round(($passedTests / $totalTests) * 100, 2)
    }
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Azure Monitor Alerts Validation Report - $Environment</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .score { font-size: 24px; font-weight: bold; }
        .status-pass { background-color: #d4edda; color: #155724; }
        .status-fail { background-color: #f8d7da; color: #721c24; }
        .status-warn { background-color: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Azure Monitor Alerts Validation Report</h1>
        <p><strong>Environment:</strong> $Environment</p>
        <p><strong>Generated:</strong> $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
        <p><strong>Overall Score:</strong> <span class="score">$overallScore%</span></p>
    </div>

    <div class="section">
        <h2>Validation Summary</h2>
        <ul>
            <li>Total Tests: $totalTests</li>
            <li>Passed: $passedTests</li>
            <li>Failed: $($totalTests - $passedTests)</li>
        </ul>
    </div>

    <div class="section">
        <h2>Bicep Template Validation</h2>
        <table>
            <tr>
                <th>Check</th>
                <th>Status</th>
                <th>Details</th>
            </tr>
            <tr>
                <td>Template Exists</td>
                <td class="$(if($TemplateResults.Exists) { 'status-pass' } else { 'status-fail' })">$(if($TemplateResults.Exists) { 'PASS' } else { 'FAIL' })</td>
                <td>$($TemplateResults.TemplatePath)</td>
            </tr>
            <tr>
                <td>Syntax Valid</td>
                <td class="$(if($TemplateResults.Syntax.Valid) { 'status-pass' } else { 'status-fail' })">$(if($TemplateResults.Syntax.Valid) { 'PASS' } else { 'FAIL' })</td>
                <td>Template structure and syntax</td>
            </tr>
            <tr>
                <td>Has Parameters</td>
                <td class="$(if($TemplateResults.Structure.HasParameters) { 'status-pass' } else { 'status-fail' })">$(if($TemplateResults.Structure.HasParameters) { 'PASS' } else { 'FAIL' })</td>
                <td>Template parameter definitions</td>
            </tr>
            <tr>
                <td>Has Resources</td>
                <td class="$(if($TemplateResults.Structure.HasResources) { 'status-pass' } else { 'status-fail' })">$(if($TemplateResults.Structure.HasResources) { 'PASS' } else { 'FAIL' })</td>
                <td>Azure resource definitions</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>Parameter File Validation</h2>
        <table>
            <tr>
                <th>Check</th>
                <th>Status</th>
                <th>Details</th>
            </tr>
            <tr>
                <td>File Exists</td>
                <td class="$(if($ParameterResults.Exists) { 'status-pass' } else { 'status-fail' })">$(if($ParameterResults.Exists) { 'PASS' } else { 'FAIL' })</td>
                <td>$($ParameterResults.ParameterPath)</td>
            </tr>
            <tr>
                <td>Valid JSON</td>
                <td class="$(if($ParameterResults.ValidJson) { 'status-pass' } else { 'status-fail' })">$(if($ParameterResults.ValidJson) { 'PASS' } else { 'FAIL' })</td>
                <td>JSON syntax validation</td>
            </tr>
            <tr>
                <td>Required Parameters</td>
                <td class="$(if($ParameterResults.HasRequiredParams) { 'status-pass' } else { 'status-fail' })">$(if($ParameterResults.HasRequiredParams) { 'PASS' } else { 'FAIL' })</td>
                <td>All required parameters present</td>
            </tr>
            <tr>
                <td>Alert Parameters</td>
                <td class="$(if($ParameterResults.AlertParams.Count -gt 0) { 'status-pass' } else { 'status-warn' })">$(if($ParameterResults.AlertParams.Count -gt 0) { 'PASS' } else { 'PARTIAL' })</td>
                <td>$($ParameterResults.AlertParams.Count) alert parameters found</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>PowerShell Scripts Validation</h2>
        <table>
            <tr>
                <th>Script</th>
                <th>Status</th>
                <th>Has Parameters</th>
                <th>Has Functions</th>
            </tr>
"@

    foreach ($script in $ScriptResults.Scripts) {
        $status = if ($script.Valid) { 'status-pass' } else { 'status-fail' }
        $statusText = if ($script.Valid) { 'PASS' } else { 'FAIL' }
        
        $html += @"
            <tr>
                <td>$($script.Name)</td>
                <td class="$status">$statusText</td>
                <td class="$(if($script.HasParameters) { 'status-pass' } else { 'status-warn' })">$(if($script.HasParameters) { 'YES' } else { 'NO' })</td>
                <td class="$(if($script.HasFunctions) { 'status-pass' } else { 'status-warn' })">$(if($script.HasFunctions) { 'YES' } else { 'NO' })</td>
            </tr>
"@
    }

    $html += @"
        </table>
    </div>

    <div class="section">
        <h2>Issues and Recommendations</h2>
        <ul>
"@

    # Add issues from validation
    foreach ($issue in $TemplateResults.Issues) {
        $html += "<li class='error'>Template: $issue</li>"
    }
    
    foreach ($issue in $ParameterResults.Issues) {
        $html += "<li class='error'>Parameters: $issue</li>"
    }
    
    if ($overallScore -ge 90) {
        $html += "<li class='success'>Configuration is ready for deployment</li>"
    }
    elseif ($overallScore -ge 70) {
        $html += "<li class='warning'>Configuration needs minor improvements before deployment</li>"
    }
    else {
        $html += "<li class='error'>Configuration has significant issues that must be resolved</li>"
    }

    $html += @"
        </ul>
    </div>

    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Address any failed validation checks</li>
            <li>Test the configuration in a development environment</li>
            <li>Deploy using the PowerShell scripts or Bicep templates</li>
            <li>Validate alert functionality after deployment</li>
        </ol>
    </div>
</body>
</html>
"@

    $html | Out-File -FilePath $OutputPath -Encoding UTF8
    Write-StatusMessage "Validation report generated: $OutputPath" -Level "SUCCESS"
    
    return $OutputPath
}

# ==================================================================================================
# Main Execution
# ==================================================================================================

Write-StatusMessage "Starting Azure Monitor Alerts validation for $Environment environment..." -Level "SUCCESS"

try {
    $baseDir = "d:\Microsoft Student Accelerator 2025\Stage 2\NetworkingApp"
    
    # Test Bicep templates
    $alertsTemplate = Join-Path $baseDir "infra\bicep\modules\alerts.bicep"
    $mainTemplate = Join-Path $baseDir "infra\bicep\main.bicep"
    
    Write-StatusMessage "=== Validating Bicep Templates ===" -Level "SUCCESS"
    $alertTemplateResults = Test-BicepTemplate -TemplatePath $alertsTemplate
    $mainTemplateResults = Test-BicepTemplate -TemplatePath $mainTemplate
    
    # Test parameter files
    $parameterFile = Join-Path $baseDir "infra\bicep\parameters\main.$Environment.json"
    
    Write-StatusMessage "=== Validating Parameter Files ===" -Level "SUCCESS"
    $parameterResults = Test-ParameterFile -ParameterPath $parameterFile
    
    # Test PowerShell scripts
    $scriptsPath = Join-Path $baseDir "Scripts"
    
    Write-StatusMessage "=== Validating PowerShell Scripts ===" -Level "SUCCESS"
    $scriptResults = Test-PowerShellScripts -ScriptsPath $scriptsPath
    
    # Generate report if requested
    if ($GenerateReport) {
        $reportPath = Generate-ValidationReport -TemplateResults $alertTemplateResults -ParameterResults $parameterResults -ScriptResults $scriptResults -Environment $Environment -OutputPath $ReportPath
        Write-StatusMessage "Validation report available at: $reportPath" -Level "SUCCESS"
    }
    
    # Summary
    Write-StatusMessage "=== Validation Summary ===" -Level "SUCCESS"
    Write-StatusMessage "Alerts Template: $(if($alertTemplateResults.Syntax.Valid) { 'VALID' } else { 'INVALID' })"
    Write-StatusMessage "Main Template: $(if($mainTemplateResults.Syntax.Valid) { 'VALID' } else { 'INVALID' })"
    Write-StatusMessage "Parameters: $(if($parameterResults.ValidJson) { 'VALID' } else { 'INVALID' })"
    Write-StatusMessage "Scripts: $($scriptResults.ValidScripts)/$($scriptResults.TotalScripts) valid"
    
    if ($alertTemplateResults.Syntax.Valid -and $parameterResults.ValidJson -and $scriptResults.ValidScripts -gt 0) {
        Write-StatusMessage "✅ Configuration is ready for deployment!" -Level "SUCCESS"
    }
    else {
        Write-StatusMessage "⚠️ Configuration needs attention before deployment" -Level "WARNING"
    }
}
catch {
    Write-StatusMessage "Validation failed with error: $($_.Exception.Message)" -Level "ERROR"
    exit 1
}

Write-StatusMessage "Validation completed at $(Get-Date)" -Level "SUCCESS"
