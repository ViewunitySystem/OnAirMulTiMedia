#!/bin/bash
# ============================================================================
# GitHub Info Dashboard - Automatische Installation für alle Repos
# © 2025 Raymond Demitrio Dr. Tel
# ============================================================================

set -e

# Konfiguration
GITHUB_USER="${1:-ViewunitySystem}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
CLONE_DIR="${CLONE_DIR:-$HOME/repos}"
DRY_RUN="${DRY_RUN:-false}"
SKIP_PUSH="${SKIP_PUSH:-false}"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}GitHub Info Dashboard - Batch Setup${NC}"
echo -e "${YELLOW}User: $GITHUB_USER${NC}"
echo -e "${CYAN}============================================${NC}\n"

# Template-Dateien
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TEMPLATE_DIR="$SCRIPT_DIR/public"
INFO_TEMPLATE="$TEMPLATE_DIR/info.html"

if [ ! -f "$INFO_TEMPLATE" ]; then
    echo -e "${RED}❌ ERROR: Template nicht gefunden: $INFO_TEMPLATE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Template gefunden: $INFO_TEMPLATE${NC}\n"

# Erstelle Clone-Directory
mkdir -p "$CLONE_DIR"
echo -e "${GREEN}📁 Clone Directory: $CLONE_DIR${NC}\n"

# API Headers
if [ -n "$GITHUB_TOKEN" ]; then
    AUTH_HEADER="Authorization: Bearer $GITHUB_TOKEN"
    echo -e "${GREEN}🔑 Using GitHub Token for authentication${NC}\n"
else
    AUTH_HEADER=""
    echo -e "${YELLOW}⚠️  No GitHub Token - Rate limits apply${NC}\n"
fi

# Hole alle Repos
echo -e "${CYAN}🔍 Fetching repositories for $GITHUB_USER...${NC}"

REPOS_JSON=$(mktemp)
page=1
> "$REPOS_JSON"

while true; do
    url="https://api.github.com/users/$GITHUB_USER/repos?per_page=100&page=$page&sort=updated"
    
    if [ -n "$AUTH_HEADER" ]; then
        response=$(curl -s -H "$AUTH_HEADER" -H "Accept: application/vnd.github+json" "$url")
    else
        response=$(curl -s -H "Accept: application/vnd.github+json" "$url")
    fi
    
    echo "$response" >> "$REPOS_JSON"
    count=$(echo "$response" | jq '. | length')
    
    [ "$count" -lt 100 ] && break
    page=$((page + 1))
done

# ViewunitySystemT Repos
echo -e "${CYAN}🔍 Fetching repositories for ViewunitySystemT...${NC}"
page=1

while true; do
    url="https://api.github.com/users/ViewunitySystemT/repos?per_page=100&page=$page&sort=updated"
    
    if [ -n "$AUTH_HEADER" ]; then
        response=$(curl -s -H "$AUTH_HEADER" -H "Accept: application/vnd.github+json" "$url")
    else
        response=$(curl -s -H "Accept: application/vnd.github+json" "$url")
    fi
    
    echo "$response" >> "$REPOS_JSON"
    count=$(echo "$response" | jq '. | length')
    
    [ "$count" -lt 100 ] && break
    page=$((page + 1))
done

total_repos=$(jq '. | length' "$REPOS_JSON")
echo -e "${GREEN}✅ Gesamt: $total_repos Repositories${NC}\n"

# Statistiken
success_count=0
skip_count=0
error_count=0

# Verarbeite jedes Repo
jq -c '.[]' "$REPOS_JSON" | while read -r repo; do
    repo_name=$(echo "$repo" | jq -r '.name')
    repo_full_name=$(echo "$repo" | jq -r '.full_name')
    repo_path="$CLONE_DIR/$repo_name"
    default_branch=$(echo "$repo" | jq -r '.default_branch')
    archived=$(echo "$repo" | jq -r '.archived')
    disabled=$(echo "$repo" | jq -r '.disabled')
    has_pages=$(echo "$repo" | jq -r '.has_pages')
    
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📦 Repository: $repo_full_name${NC}"
    echo -e "${GRAY}   Branch: $default_branch${NC}"
    
    # Skip archived/disabled
    if [ "$archived" = "true" ]; then
        echo -e "${YELLOW}   ⏭️  SKIPPED: Repository is archived${NC}"
        skip_count=$((skip_count + 1))
        continue
    fi
    
    if [ "$disabled" = "true" ]; then
        echo -e "${YELLOW}   ⏭️  SKIPPED: Repository is disabled${NC}"
        skip_count=$((skip_count + 1))
        continue
    fi
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "\033[0;35m   🔍 DRY-RUN: Would install dashboard to $repo_path${NC}"
        skip_count=$((skip_count + 1))
        continue
    fi
    
    # Clone oder Update
    if [ -d "$repo_path" ]; then
        echo -e "${YELLOW}   📥 Updating existing repo...${NC}"
        cd "$repo_path"
        git fetch --all > /dev/null 2>&1
        git checkout "$default_branch" > /dev/null 2>&1
        git pull origin "$default_branch" > /dev/null 2>&1
    else
        echo -e "${YELLOW}   📥 Cloning repo...${NC}"
        git clone "https://github.com/$repo_full_name.git" "$repo_path" > /dev/null 2>&1
    fi
    
    cd "$repo_path"
    
    # Check if info.html exists
    if [ -f "info.html" ]; then
        echo -e "${YELLOW}   ℹ️  info.html exists - updating...${NC}"
    else
        echo -e "${GREEN}   ➕ Creating new info.html...${NC}"
    fi
    
    # Kopiere und passe Template an
    cp "$INFO_TEMPLATE" "info.html"
    
    # Ersetze Repo-Namen
    sed -i.bak "s|ViewunitySystem/OnAirMulTiMedia|$repo_full_name|g" info.html
    sed -i.bak "s|OnAirMulTiMedia – Info & Monitoring|$repo_name – Info & Monitoring|g" info.html
    rm -f info.html.bak
    
    echo -e "${GREEN}   ✅ Template installed and configured${NC}"
    
    # Git Commit & Push
    git add info.html > /dev/null 2>&1
    
    if git diff --cached --quiet; then
        echo -e "${CYAN}   ℹ️  No changes detected - already up to date${NC}"
        skip_count=$((skip_count + 1))
    else
        git commit -m "feat: Add GitHub Info Dashboard

⭐ Live GitHub-Statistiken (Stars, Forks, Watcher, Issues)
📦 Release-Downloads (Summe aller Assets)
💬 Community-Beiträge möglich
🔄 Auto-Refresh alle 10 Minuten
🔒 XSS-safe rendering
🎨 Responsive Dark Theme

Template von: https://github.com/ViewunitySystem/OnAirMulTiMedia/tree/mainzero/hackathon-bridge" > /dev/null 2>&1
        
        if [ "$SKIP_PUSH" = "true" ]; then
            echo -e "${YELLOW}   💾 Changes committed (push skipped)${NC}"
        else
            echo -e "${CYAN}   📤 Pushing to GitHub...${NC}"
            if git push origin "$default_branch" > /dev/null 2>&1; then
                echo -e "${GREEN}   ✅ Successfully pushed to GitHub${NC}"
                success_count=$((success_count + 1))
            else
                echo -e "${RED}   ❌ ERROR: Git push failed${NC}"
                error_count=$((error_count + 1))
            fi
        fi
    fi
    
    # URL anzeigen
    if [ "$has_pages" = "true" ]; then
        owner=$(echo "$repo" | jq -r '.owner.login')
        echo -e "${GREEN}   🌐 Dashboard URL: https://$owner.github.io/$repo_name/info.html${NC}"
    else
        echo -e "${YELLOW}   💡 Tip: Enable GitHub Pages${NC}"
    fi
done

# Cleanup
rm -f "$REPOS_JSON"

# Zusammenfassung
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📊 ZUSAMMENFASSUNG${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Gesamt Repositories: $total_repos"
echo -e "${GREEN}✅ Erfolgreich:      $success_count${NC}"
echo -e "${YELLOW}⏭️  Übersprungen:     $skip_count${NC}"
echo -e "${RED}❌ Fehler:           $error_count${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ "$DRY_RUN" = "true" ]; then
    echo -e "\033[0;35m🔍 DRY-RUN Modus - Keine Änderungen vorgenommen${NC}"
    echo -e "${GRAY}Setze DRY_RUN=false um tatsächlich zu installieren${NC}\n"
fi

echo -e "${GREEN}🎉 Setup abgeschlossen!${NC}\n"

echo -e "${YELLOW}💡 Tipps:${NC}"
echo -e "${GRAY}   • Aktiviere GitHub Pages in den Repo-Settings${NC}"
echo -e "${GRAY}   • Setze GITHUB_TOKEN environment variable für höhere Rate Limits${NC}"
echo -e "${GRAY}   • Setze ADMIN_KEY für Backend-Repos mit Community-Beiträgen${NC}"
echo ""

