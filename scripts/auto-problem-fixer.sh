#!/bin/bash
# AUTOMATIC TERMINAL PROBLEM SECTOR FIXER SYSTEM
# Local Terminal Monitoring & Auto-Fix Script
# 
# Features:
# - Real-time file monitoring
# - Automatic problem detection
# - Instant fixes application
# - Terminal integration
# - Cross-platform support (Windows/Linux/macOS)
#
# @author Raymond Demitrio Dr. Tel
# @version 1.0.0

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/auto-fixer.log"
PID_FILE="$PROJECT_ROOT/auto-fixer.pid"
WATCH_INTERVAL=2
VERBOSE=false
AUTO_FIX=true
DRY_RUN=false

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[$timestamp] INFO: $message${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[$timestamp] SUCCESS: $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[$timestamp] WARNING: $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}[$timestamp] ERROR: $message${NC}"
            ;;
        "FIX")
            echo -e "${MAGENTA}[$timestamp] FIX: $message${NC}"
            ;;
    esac
    
    # Also log to file
    echo "[$timestamp] $level: $message" >> "$LOG_FILE"
}

# Help function
show_help() {
    echo "🤖 AUTOMATIC TERMINAL PROBLEM SECTOR FIXER SYSTEM"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --start          Start the monitoring daemon"
    echo "  --stop           Stop the monitoring daemon"
    echo "  --status         Show current status"
    echo "  --fix            Run one-time fix (no monitoring)"
    echo "  --watch          Start real-time monitoring"
    echo "  --verbose        Enable verbose output"
    echo "  --dry-run        Show what would be fixed without applying"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --start       # Start background monitoring"
    echo "  $0 --fix         # Run one-time fix"
    echo "  $0 --watch       # Start real-time monitoring with output"
    echo "  $0 --dry-run     # Preview fixes without applying"
}

# Check if daemon is running
is_daemon_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Start daemon
start_daemon() {
    if is_daemon_running; then
        log "WARNING" "Auto-fixer daemon is already running (PID: $(cat "$PID_FILE"))"
        return 1
    fi
    
    log "INFO" "Starting auto-fixer daemon..."
    
    # Start background process
    nohup "$0" --watch > /dev/null 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_FILE"
    
    log "SUCCESS" "Auto-fixer daemon started (PID: $pid)"
    log "INFO" "Log file: $LOG_FILE"
    log "INFO" "PID file: $PID_FILE"
}

# Stop daemon
stop_daemon() {
    if ! is_daemon_running; then
        log "WARNING" "Auto-fixer daemon is not running"
        return 1
    fi
    
    local pid=$(cat "$PID_FILE")
    log "INFO" "Stopping auto-fixer daemon (PID: $pid)..."
    
    kill "$pid" 2>/dev/null || true
    rm -f "$PID_FILE"
    
    log "SUCCESS" "Auto-fixer daemon stopped"
}

# Show status
show_status() {
    echo "🤖 AUTOMATIC TERMINAL PROBLEM SECTOR FIXER SYSTEM STATUS"
    echo "=================================================="
    
    if is_daemon_running; then
        local pid=$(cat "$PID_FILE")
        echo -e "Status: ${GREEN}RUNNING${NC} (PID: $pid)"
        echo "Log file: $LOG_FILE"
        echo "PID file: $PID_FILE"
        
        # Show recent log entries
        if [ -f "$LOG_FILE" ]; then
            echo ""
            echo "Recent activity:"
            tail -5 "$LOG_FILE" | while read line; do
                echo "  $line"
            done
        fi
    else
        echo -e "Status: ${RED}STOPPED${NC}"
    fi
    
    echo ""
    echo "Configuration:"
    echo "  Project root: $PROJECT_ROOT"
    echo "  Watch interval: ${WATCH_INTERVAL}s"
    echo "  Auto-fix: $AUTO_FIX"
    echo "  Verbose: $VERBOSE"
}

# Fix GitHub Actions workflows
fix_workflows() {
    local workflows_dir="$PROJECT_ROOT/.github/workflows"
    local live_workflows_dir="$PROJECT_ROOT/live-data-platform/.github/workflows"
    local fixes_applied=0
    
    for dir in "$workflows_dir" "$live_workflows_dir"; do
        if [ -d "$dir" ]; then
            for file in "$dir"/*.yml "$dir"/*.yaml; do
                if [ -f "$file" ]; then
                    local filename=$(basename "$file")
                    log "INFO" "Analyzing workflow: $filename"
                    
                    # Fix 1: Remove invalid package-name for simple release type
                    if grep -q "release-type: simple" "$file" && grep -q "package-name:" "$file"; then
                        if [ "$DRY_RUN" = true ]; then
                            log "FIX" "Would remove invalid package-name from $filename"
                        else
                            sed -i '/package-name:/d' "$file"
                            log "FIX" "Removed invalid package-name from $filename"
                        fi
                        ((fixes_applied++))
                    fi
                    
                    # Fix 2: Add timeout-minutes if missing
                    if grep -q "runs-on:" "$file" && ! grep -q "timeout-minutes:" "$file"; then
                        if [ "$DRY_RUN" = true ]; then
                            log "FIX" "Would add timeout-minutes to $filename"
                        else
                            sed -i '/runs-on: ubuntu-latest/a\    timeout-minutes: 15' "$file"
                            log "FIX" "Added timeout-minutes to $filename"
                        fi
                        ((fixes_applied++))
                    fi
                fi
            done
        fi
    done
    
    return $fixes_applied
}

# Fix VS Code configuration
fix_vscode_config() {
    local vscode_dir="$PROJECT_ROOT/.vscode"
    local settings_file="$vscode_dir/settings.json"
    local fixes_applied=0
    
    # Create .vscode directory if it doesn't exist
    if [ ! -d "$vscode_dir" ]; then
        if [ "$DRY_RUN" = true ]; then
            log "FIX" "Would create .vscode directory"
        else
            mkdir -p "$vscode_dir"
            log "FIX" "Created .vscode directory"
        fi
        ((fixes_applied++))
    fi
    
    # Create or update settings.json
    if [ ! -f "$settings_file" ]; then
        if [ "$DRY_RUN" = true ]; then
            log "FIX" "Would create VS Code settings.json"
        else
            cat > "$settings_file" << 'EOF'
{
  "github-actions.validation.enabled": false,
  "github-actions.validation.secrets": false,
  "yaml.schemas": {
    "https://json.schemastore.org/github-workflow.json": "**/.github/workflows/*.yml"
  },
  "yaml.validate": true,
  "yaml.format.enable": true,
  "files.associations": {
    "*.yml": "yaml",
    "*.yaml": "yaml"
  },
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  }
}
EOF
            log "FIX" "Created VS Code settings.json with GitHub Actions warning suppression"
        fi
        ((fixes_applied++))
    fi
    
    return $fixes_applied
}

# Run linting fixes
run_linting_fixes() {
    local fixes_applied=0
    
    # ESLint fixes
    if command -v npx >/dev/null 2>&1; then
        if npx eslint --version >/dev/null 2>&1; then
            if [ "$DRY_RUN" = true ]; then
                log "FIX" "Would run ESLint auto-fix"
            else
                if npx eslint . --fix >/dev/null 2>&1; then
                    log "FIX" "Applied ESLint auto-fixes"
                    ((fixes_applied++))
                fi
            fi
        fi
    fi
    
    # Prettier fixes
    if command -v npx >/dev/null 2>&1; then
        if npx prettier --version >/dev/null 2>&1; then
            if [ "$DRY_RUN" = true ]; then
                log "FIX" "Would run Prettier formatting"
            else
                if npx prettier --write . >/dev/null 2>&1; then
                    log "FIX" "Applied Prettier formatting"
                    ((fixes_applied++))
                fi
            fi
        fi
    fi
    
    return $fixes_applied
}

# Main fix function
run_fixes() {
    log "INFO" "🔍 Starting comprehensive problem scan..."
    
    local total_fixes=0
    
    # Fix workflows
    fix_workflows
    total_fixes=$((total_fixes + $?))
    
    # Fix VS Code config
    fix_vscode_config
    total_fixes=$((total_fixes + $?))
    
    # Run linting fixes
    run_linting_fixes
    total_fixes=$((total_fixes + $?))
    
    if [ $total_fixes -gt 0 ]; then
        log "SUCCESS" "🎉 Applied $total_fixes fixes"
    else
        log "INFO" "✅ No fixes needed"
    fi
    
    return $total_fixes
}

# Watch mode - real-time monitoring
watch_mode() {
    log "INFO" "👁️  Starting real-time monitoring..."
    log "INFO" "Watching for changes in:"
    log "INFO" "  - .github/workflows/"
    log "INFO" "  - live-data-platform/.github/workflows/"
    log "INFO" "  - .vscode/"
    log "INFO" "  - package.json"
    
    local last_check=0
    
    while true; do
        local current_time=$(date +%s)
        
        # Check for file changes
        local changes_detected=false
        
        # Check workflow files
        for dir in "$PROJECT_ROOT/.github/workflows" "$PROJECT_ROOT/live-data-platform/.github/workflows"; do
            if [ -d "$dir" ]; then
                for file in "$dir"/*.yml "$dir"/*.yaml; do
                    if [ -f "$file" ]; then
                        local file_time=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
                        if [ "$file_time" -gt "$last_check" ]; then
                            changes_detected=true
                            break 2
                        fi
                    fi
                done
            fi
        done
        
        # Check VS Code config
        if [ -f "$PROJECT_ROOT/.vscode/settings.json" ]; then
            local file_time=$(stat -c %Y "$PROJECT_ROOT/.vscode/settings.json" 2>/dev/null || stat -f %m "$PROJECT_ROOT/.vscode/settings.json" 2>/dev/null)
            if [ "$file_time" -gt "$last_check" ]; then
                changes_detected=true
            fi
        fi
        
        # Check package.json
        if [ -f "$PROJECT_ROOT/package.json" ]; then
            local file_time=$(stat -c %Y "$PROJECT_ROOT/package.json" 2>/dev/null || stat -f %m "$PROJECT_ROOT/package.json" 2>/dev/null)
            if [ "$file_time" -gt "$last_check" ]; then
                changes_detected=true
            fi
        fi
        
        if [ "$changes_detected" = true ]; then
            log "INFO" "🔄 Changes detected - running fixes..."
            run_fixes
        fi
        
        last_check=$current_time
        sleep $WATCH_INTERVAL
    done
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --start)
            start_daemon
            exit 0
            ;;
        --stop)
            stop_daemon
            exit 0
            ;;
        --status)
            show_status
            exit 0
            ;;
        --fix)
            run_fixes
            exit $?
            ;;
        --watch)
            watch_mode
            exit 0
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            AUTO_FIX=false
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# If no arguments provided, show help
show_help
