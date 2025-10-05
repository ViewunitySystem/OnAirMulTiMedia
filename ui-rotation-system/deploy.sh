#!/bin/bash

# SDR UI Rotation System - Deployment Script
# Autor: Raymond Demitrio Dr. Tel
# Version: 1.0.0

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging-Funktion
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Prüfung der Voraussetzungen
check_prerequisites() {
    log "Prüfe Voraussetzungen..."
    
    # Node.js prüfen
    if ! command -v node &> /dev/null; then
        error "Node.js ist nicht installiert. Bitte installieren Sie Node.js 20+"
        exit 1
    fi
    
    # npm prüfen
    if ! command -v npm &> /dev/null; then
        error "npm ist nicht installiert"
        exit 1
    fi
    
    # Docker prüfen (optional)
    if command -v docker &> /dev/null; then
        info "Docker gefunden"
    else
        warning "Docker nicht gefunden - Container-Deployment nicht möglich"
    fi
    
    log "Voraussetzungen erfüllt ✓"
}

# Dependencies installieren
install_dependencies() {
    log "Installiere Dependencies..."
    
    if [ ! -f "package.json" ]; then
        error "package.json nicht gefunden"
        exit 1
    fi
    
    npm ci --only=production
    log "Dependencies installiert ✓"
}

# Build durchführen
build_application() {
    log "Baue Anwendung..."
    
    # Client Build
    if [ -d "src" ]; then
        npm run build:client
        log "Client Build abgeschlossen ✓"
    fi
    
    # Server Build
    npm run build:server
    log "Server Build abgeschlossen ✓"
}

# Tests ausführen
run_tests() {
    log "Führe Tests aus..."
    
    if npm run test --silent; then
        log "Tests erfolgreich ✓"
    else
        error "Tests fehlgeschlagen"
        exit 1
    fi
}

# Linting durchführen
run_linting() {
    log "Führe Linting durch..."
    
    if npm run lint; then
        log "Linting erfolgreich ✓"
    else
        warning "Linting-Warnungen gefunden"
    fi
}

# Docker Image bauen
build_docker_image() {
    if ! command -v docker &> /dev/null; then
        warning "Docker nicht verfügbar - überspringe Docker Build"
        return
    fi
    
    log "Baue Docker Image..."
    
    docker build -t sdr-ui-rotation:latest .
    log "Docker Image erstellt ✓"
}

# Docker Container starten
start_docker_container() {
    if ! command -v docker &> /dev/null; then
        warning "Docker nicht verfügbar - überspringe Container Start"
        return
    fi
    
    log "Starte Docker Container..."
    
    # Stoppe existierende Container
    docker stop sdr-ui-rotation 2>/dev/null || true
    docker rm sdr-ui-rotation 2>/dev/null || true
    
    # Starte neuen Container
    docker run -d \
        --name sdr-ui-rotation \
        -p 3000:3000 \
        --restart unless-stopped \
        sdr-ui-rotation:latest
    
    log "Docker Container gestartet ✓"
}

# Health Check durchführen
health_check() {
    log "Führe Health Check durch..."
    
    # Warte auf Start
    sleep 5
    
    # Health Check
    for i in {1..30}; do
        if curl -f http://localhost:3000/health &>/dev/null; then
            log "Health Check erfolgreich ✓"
            return 0
        fi
        sleep 2
    done
    
    error "Health Check fehlgeschlagen"
    return 1
}

# Logs anzeigen
show_logs() {
    log "Zeige Logs..."
    
    if command -v docker &> /dev/null && docker ps | grep -q sdr-ui-rotation; then
        docker logs sdr-ui-rotation --tail 50
    else
        info "Keine Docker-Logs verfügbar"
    fi
}

# Cleanup durchführen
cleanup() {
    log "Führe Cleanup durch..."
    
    # Node modules cleanup
    if [ -d "node_modules" ]; then
        rm -rf node_modules
    fi
    
    # Build artifacts cleanup
    if [ -d "dist" ]; then
        rm -rf dist
    fi
    
    log "Cleanup abgeschlossen ✓"
}

# Hauptfunktion
main() {
    log "🚀 Starte SDR UI Rotation System Deployment"
    
    # Argumente verarbeiten
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            install_dependencies
            build_application
            run_tests
            run_linting
            build_docker_image
            start_docker_container
            health_check
            log "✅ Deployment erfolgreich abgeschlossen!"
            ;;
        "test")
            check_prerequisites
            install_dependencies
            run_tests
            ;;
        "build")
            check_prerequisites
            install_dependencies
            build_application
            ;;
        "docker")
            build_docker_image
            start_docker_container
            health_check
            ;;
        "logs")
            show_logs
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            echo "SDR UI Rotation System - Deployment Script"
            echo ""
            echo "Verwendung: $0 [COMMAND]"
            echo ""
            echo "Commands:"
            echo "  deploy    - Vollständiges Deployment (Standard)"
            echo "  test      - Nur Tests ausführen"
            echo "  build     - Nur Build durchführen"
            echo "  docker    - Docker Image bauen und starten"
            echo "  logs      - Logs anzeigen"
            echo "  cleanup   - Cleanup durchführen"
            echo "  help      - Diese Hilfe anzeigen"
            ;;
        *)
            error "Unbekannter Command: $1"
            echo "Verwenden Sie '$0 help' für Hilfe"
            exit 1
            ;;
    esac
}

# Signal Handler
trap 'error "Deployment abgebrochen"; exit 1' INT TERM

# Script ausführen
main "$@"
