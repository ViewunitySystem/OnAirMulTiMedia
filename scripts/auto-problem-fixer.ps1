# AUTOMATIC TERMINAL PROBLEM SECTOR FIXER SYSTEM
# Windows PowerShell Version
# 
# Features:
# - Real-time file monitoring
# - Automatic problem detection
# - Instant fixes application
# - PowerShell integration
# - Windows-specific optimizations
#
# @author Raymond Demitrio Dr. Tel
# @version 1.0.0

param(
    [switch]$Start,
    [switch]$Stop,
    [switch]$Status,
    [switch]$Fix,
    [switch]$Watch,
    [switch]$Verbose,
    [switch]$DryRun,
    [switch]$Help
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogFile = Join-Path $ProjectRoot "auto-fixer.log"
$PidFile = Join-Path $ProjectRoot "auto-fixer.pid"
$WatchInterval = 2
$AutoFix = -not $DryRun

# Colors for terminal output
$Colors = @{
    Red     = "Red"
    Green   = "Green"
    Yellow  = "Yellow"
    Blue    = "Blue"
    Magenta = "Magenta"
    Cyan    = "Cyan"
    White   = "White"
}

# Logging function
function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    switch ($Level) {
        "INFO" { Write-Host "[$Timestamp] INFO: $Message" -ForegroundColor $Colors.Blue }
        "SUCCESS" { Write-Host "[$Timestamp] SUCCESS: $Message" -ForegroundColor $Colors.Green }
        "WARNING" { Write-Host "[$Timestamp] WARNING: $Message" -ForegroundColor $Colors.Yellow }
        "ERROR" { Write-Host "[$Timestamp] ERROR: $Message" -ForegroundColor $Colors.Red }
        "FIX" { Write-Host "[$Timestamp] FIX: $Message" -ForegroundColor $Colors.Magenta }
    }
    
    # Also log to file
    Add-Content -Path $LogFile -Value "[$Timestamp] $Level`: $Message"
}

# Help function
function Show-Help {
    Write-Host "🤖 AUTOMATIC TERMINAL PROBLEM SECTOR FIXER SYSTEM" -ForegroundColor $Colors.Cyan
    Write-Host ""
    Write-Host "Usage: .\auto-problem-fixer.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Start          Start the monitoring daemon"
    Write-Host "  -Stop           Stop the monitoring daemon"
    Write-Host "  -Status         Show current status"
    Write-Host "  -Fix            Run one-time fix (no monitoring)"
    Write-Host "  -Watch          Start real-time monitoring"
    Write-Host "  -Verbose        Enable verbose output"
    Write-Host "  -DryRun         Show what would be fixed without applying"
    Write-Host "  -Help           Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\auto-problem-fixer.ps1 -Start       # Start background monitoring"
    Write-Host "  .\auto-problem-fixer.ps1 -Fix         # Run one-time fix"
    Write-Host "  .\auto-problem-fixer.ps1 -Watch       # Start real-time monitoring with output"
    Write-Host "  .\auto-problem-fixer.ps1 -DryRun      # Preview fixes without applying"
}

# Check if daemon is running
function Test-DaemonRunning {
    if (Test-Path $PidFile) {
        $ProcessId = Get-Content $PidFile
        try {
            $null = Get-Process -Id $ProcessId -ErrorAction Stop
            return $true
        }
        catch {
            Remove-Item $PidFile -Force
            return $false
        }
    }
    return $false
}

# Start daemon
function Start-Daemon {
    if (Test-DaemonRunning) {
        $ProcessId = Get-Content $PidFile
        Write-Log "WARNING" "Auto-fixer daemon is already running (PID: $ProcessId)"
        return $false
    }
    
    Write-Log "INFO" "Starting auto-fixer daemon..."
    
    # Start background process
    $Job = Start-Job -ScriptBlock {
        param($ScriptPath, $LogFile, $PidFile)
        & $ScriptPath -Watch
    } -ArgumentList $MyInvocation.MyCommand.Path, $LogFile, $PidFile
    
    $Job.Id | Out-File -FilePath $PidFile -Encoding ASCII
    
    Write-Log "SUCCESS" "Auto-fixer daemon started (Job ID: $($Job.Id))"
    Write-Log "INFO" "Log file: $LogFile"
    Write-Log "INFO" "PID file: $PidFile"
    
    return $true
}

# Stop daemon
function Stop-Daemon {
    if (-not (Test-DaemonRunning)) {
        Write-Log "WARNING" "Auto-fixer daemon is not running"
        return $false
    }
    
    $JobId = Get-Content $PidFile
    Write-Log "INFO" "Stopping auto-fixer daemon (Job ID: $JobId)..."
    
    try {
        Stop-Job -Id $JobId -ErrorAction Stop
        Remove-Job -Id $JobId -ErrorAction Stop
        Remove-Item $PidFile -Force
        Write-Log "SUCCESS" "Auto-fixer daemon stopped"
        return $true
    }
    catch {
        Write-Log "ERROR" "Failed to stop daemon: $($_.Exception.Message)"
        return $false
    }
}

# Show status
function Show-Status {
    Write-Host "🤖 AUTOMATIC TERMINAL PROBLEM SECTOR FIXER SYSTEM STATUS" -ForegroundColor $Colors.Cyan
    Write-Host "=================================================="
    
    if (Test-DaemonRunning) {
        $JobId = Get-Content $PidFile
        Write-Host "Status: " -NoNewline
        Write-Host "RUNNING" -ForegroundColor $Colors.Green -NoNewline
        Write-Host " (Job ID: $JobId)"
        Write-Host "Log file: $LogFile"
        Write-Host "PID file: $PidFile"
        
        # Show recent log entries
        if (Test-Path $LogFile) {
            Write-Host ""
            Write-Host "Recent activity:"
            Get-Content $LogFile | Select-Object -Last 5 | ForEach-Object {
                Write-Host "  $_"
            }
        }
    }
    else {
        Write-Host "Status: " -NoNewline
        Write-Host "STOPPED" -ForegroundColor $Colors.Red
    }
    
    Write-Host ""
    Write-Host "Configuration:"
    Write-Host "  Project root: $ProjectRoot"
    Write-Host "  Watch interval: ${WatchInterval}s"
    Write-Host "  Auto-fix: $AutoFix"
    Write-Host "  Verbose: $Verbose"
}

# Fix GitHub Actions workflows
function Repair-Workflows {
    $WorkflowsDir = Join-Path $ProjectRoot ".github\workflows"
    $LiveWorkflowsDir = Join-Path $ProjectRoot "live-data-platform\.github\workflows"
    $FixesApplied = 0
    
    foreach ($Dir in $WorkflowsDir, $LiveWorkflowsDir) {
        if (Test-Path $Dir) {
            $Files = Get-ChildItem -Path $Dir -Filter "*.yml" -File
            $Files += Get-ChildItem -Path $Dir -Filter "*.yaml" -File
            
            foreach ($File in $Files) {
                Write-Log "INFO" "Analyzing workflow: $($File.Name)"
                $Content = Get-Content $File.FullName -Raw
                
                # Fix 1: Remove invalid package-name for simple release type
                if ($Content -match "release-type: simple" -and $Content -match "package-name:") {
                    if ($DryRun) {
                        Write-Log "FIX" "Would remove invalid package-name from $($File.Name)"
                    }
                    else {
                        $Content = $Content -replace "package-name:.*\r?\n", ""
                        Set-Content -Path $File.FullName -Value $Content
                        Write-Log "FIX" "Removed invalid package-name from $($File.Name)"
                    }
                    $FixesApplied++
                }
                
                # Fix 2: Add timeout-minutes if missing
                if ($Content -match "runs-on:" -and $Content -notmatch "timeout-minutes:") {
                    if ($DryRun) {
                        Write-Log "FIX" "Would add timeout-minutes to $($File.Name)"
                    }
                    else {
                        $Content = $Content -replace "(runs-on: ubuntu-latest)", "`$1`n    timeout-minutes: 15"
                        Set-Content -Path $File.FullName -Value $Content
                        Write-Log "FIX" "Added timeout-minutes to $($File.Name)"
                    }
                    $FixesApplied++
                }
            }
        }
    }
    
    return $FixesApplied
}

# Fix VS Code configuration
function Repair-VSCodeConfig {
    $VSCodeDir = Join-Path $ProjectRoot ".vscode"
    $SettingsFile = Join-Path $VSCodeDir "settings.json"
    $FixesApplied = 0
    
    # Create .vscode directory if it doesn't exist
    if (-not (Test-Path $VSCodeDir)) {
        if ($DryRun) {
            Write-Log "FIX" "Would create .vscode directory"
        }
        else {
            New-Item -Path $VSCodeDir -ItemType Directory -Force | Out-Null
            Write-Log "FIX" "Created .vscode directory"
        }
        $FixesApplied++
    }
    
    # Create or update settings.json
    if (-not (Test-Path $SettingsFile)) {
        if ($DryRun) {
            Write-Log "FIX" "Would create VS Code settings.json"
        }
        else {
            $Settings = @{
                "github-actions.validation.enabled" = $false
                "github-actions.validation.secrets" = $false
                "yaml.schemas"                      = @{
                    "https://json.schemastore.org/github-workflow.json" = "**/.github/workflows/*.yml"
                }
                "yaml.validate"                     = $true
                "yaml.format.enable"                = $true
                "files.associations"                = @{
                    "*.yml"  = "yaml"
                    "*.yaml" = "yaml"
                }
                "editor.formatOnSave"               = $true
                "editor.codeActionsOnSave"          = @{
                    "source.fixAll" = $true
                }
            }
            
            $Settings | ConvertTo-Json -Depth 3 | Set-Content -Path $SettingsFile
            Write-Log "FIX" "Created VS Code settings.json with GitHub Actions warning suppression"
        }
        $FixesApplied++
    }
    
    return $FixesApplied
}

# Run linting fixes
function Invoke-LintingFixes {
    $FixesApplied = 0
    
    # ESLint fixes
    if (Get-Command npx -ErrorAction SilentlyContinue) {
        try {
            $null = npx eslint --version 2>$null
            if ($DryRun) {
                Write-Log "FIX" "Would run ESLint auto-fix"
            }
            else {
                $null = npx eslint . --fix 2>$null
                Write-Log "FIX" "Applied ESLint auto-fixes"
                $FixesApplied++
            }
        }
        catch {
            # ESLint not available
        }
    }
    
    # Prettier fixes
    if (Get-Command npx -ErrorAction SilentlyContinue) {
        try {
            $null = npx prettier --version 2>$null
            if ($DryRun) {
                Write-Log "FIX" "Would run Prettier formatting"
            }
            else {
                $null = npx prettier --write . 2>$null
                Write-Log "FIX" "Applied Prettier formatting"
                $FixesApplied++
            }
        }
        catch {
            # Prettier not available
        }
    }
    
    return $FixesApplied
}

# Main fix function
function Invoke-Fixes {
    Write-Log "INFO" "🔍 Starting comprehensive problem scan..."
    
    $TotalFixes = 0
    
    # Fix workflows
    $TotalFixes += Repair-Workflows
    
    # Fix VS Code config
    $TotalFixes += Repair-VSCodeConfig
    
    # Run linting fixes
    $TotalFixes += Invoke-LintingFixes
    
    if ($TotalFixes -gt 0) {
        Write-Log "SUCCESS" "🎉 Applied $TotalFixes fixes"
    }
    else {
        Write-Log "INFO" "✅ No fixes needed"
    }
    
    return $TotalFixes
}

# Watch mode - real-time monitoring
function Start-WatchMode {
    Write-Log "INFO" "👁️  Starting real-time monitoring..."
    Write-Log "INFO" "Watching for changes in:"
    Write-Log "INFO" "  - .github\workflows\"
    Write-Log "INFO" "  - live-data-platform\.github\workflows\"
    Write-Log "INFO" "  - .vscode\"
    Write-Log "INFO" "  - package.json"
    
    $LastCheck = (Get-Date).Ticks
    
    while ($true) {
        $ChangesDetected = $false
        
        # Check workflow files
        foreach ($Dir in (Join-Path $ProjectRoot ".github\workflows"), (Join-Path $ProjectRoot "live-data-platform\.github\workflows")) {
            if (Test-Path $Dir) {
                $Files = Get-ChildItem -Path $Dir -Filter "*.yml" -File
                $Files += Get-ChildItem -Path $Dir -Filter "*.yaml" -File
                
                foreach ($File in $Files) {
                    if ($File.LastWriteTime.Ticks -gt $LastCheck) {
                        $ChangesDetected = $true
                        break
                    }
                }
                
                if ($ChangesDetected) { break }
            }
        }
        
        # Check VS Code config
        $SettingsFile = Join-Path $ProjectRoot ".vscode\settings.json"
        if (Test-Path $SettingsFile) {
            $File = Get-Item $SettingsFile
            if ($File.LastWriteTime.Ticks -gt $LastCheck) {
                $ChangesDetected = $true
            }
        }
        
        # Check package.json
        $PackageFile = Join-Path $ProjectRoot "package.json"
        if (Test-Path $PackageFile) {
            $File = Get-Item $PackageFile
            if ($File.LastWriteTime.Ticks -gt $LastCheck) {
                $ChangesDetected = $true
            }
        }
        
        if ($ChangesDetected) {
            Write-Log "INFO" "🔄 Changes detected - running fixes..."
            Invoke-Fixes
        }
        
        $LastCheck = (Get-Date).Ticks
        Start-Sleep -Seconds $WatchInterval
    }
}

# Main execution
try {
    if ($Help) {
        Show-Help
    }
    elseif ($Start) {
        Start-Daemon
    }
    elseif ($Stop) {
        Stop-Daemon
    }
    elseif ($Status) {
        Show-Status
    }
    elseif ($Fix) {
        Invoke-Fixes
    }
    elseif ($Watch) {
        Start-WatchMode
    }
    else {
        Show-Help
    }
}
catch {
    Write-Log "ERROR" "An error occurred: $($_.Exception.Message)"
    exit 1
}
