@echo off
REM auto-doc-update.bat - Automatische Dokumentations-Updates für Windows
REM Läuft alle 5 Minuten

echo 🔄 AUTOMATISCHES UPDATE: %DATE% %TIME%

REM Git Status erfassen
for /f %%i in ('git status --porcelain ^| find /c /v ""') do set GIT_STATUS=%%i
for /f %%i in ('git branch --show-current') do set GIT_BRANCH=%%i
for /f %%i in ('git log --oneline -1') do set GIT_COMMIT=%%i
for /f %%i in ('git remote -v ^| findstr origin') do set GIT_REMOTE=%%i

REM Dokumentation aktualisieren
set DOC_FILE=GIT-EMERGENCY-RECOVERY-%DATE:~-4,4%-%DATE:~-10,2%-%DATE:~-7,2%.md

echo # 🚨 GIT-EMERGENCY-RECOVERY - AUTOMATISCH AKTUALISIERT > %DOC_FILE%
echo. >> %DOC_FILE%
echo **Letztes Update:** %DATE% %TIME% >> %DOC_FILE%
echo **Status:** AKTIV - Live-Monitoring >> %DOC_FILE%
echo **Repository:** https://github.com/ViewunitySystem/OnAirMulTiMedia.git >> %DOC_FILE%
echo. >> %DOC_FILE%
echo --- >> %DOC_FILE%
echo. >> %DOC_FILE%
echo ## 📊 **AKTUELLER GIT-STATUS** >> %DOC_FILE%
echo. >> %DOC_FILE%
echo **Branch:** %GIT_BRANCH% >> %DOC_FILE%
echo **Letzter Commit:** %GIT_COMMIT% >> %DOC_FILE%
echo **Geänderte Dateien:** %GIT_STATUS% >> %DOC_FILE%
echo **Remote:** %GIT_REMOTE% >> %DOC_FILE%
echo. >> %DOC_FILE%
echo --- >> %DOC_FILE%
echo. >> %DOC_FILE%
echo ## 🚨 **EMERGENCY COMMANDS** >> %DOC_FILE%
echo. >> %DOC_FILE%
echo ```bash >> %DOC_FILE%
echo # Sofortige Wiederherstellung >> %DOC_FILE%
echo git reset --hard HEAD >> %DOC_FILE%
echo git clean -fd >> %DOC_FILE%
echo. >> %DOC_FILE%
echo # Status prüfen >> %DOC_FILE%
echo git status >> %DOC_FILE%
echo git log --oneline -5 >> %DOC_FILE%
echo. >> %DOC_FILE%
echo # Backup erstellen >> %DOC_FILE%
echo git branch emergency-backup-%%(date +%%Y%%m%%d-%%H%%M%%S) >> %DOC_FILE%
echo ``` >> %DOC_FILE%
echo. >> %DOC_FILE%
echo --- >> %DOC_FILE%
echo. >> %DOC_FILE%
echo ## 🔄 **AUTOMATISCHE UPDATES** >> %DOC_FILE%
echo. >> %DOC_FILE%
echo **Update-Frequenz:** Alle 5 Minuten >> %DOC_FILE%
echo **Monitoring:** Aktiv >> %DOC_FILE%
echo **Backup:** Automatisch >> %DOC_FILE%
echo. >> %DOC_FILE%
echo --- >> %DOC_FILE%
echo. >> %DOC_FILE%
echo **⚠️ WICHTIG:** Diese Datei wird automatisch aktualisiert! >> %DOC_FILE%
echo **🔄 NÄCHSTES UPDATE:** %DATE% %TIME% >> %DOC_FILE%

echo ✅ Dokumentation aktualisiert: %DOC_FILE%
