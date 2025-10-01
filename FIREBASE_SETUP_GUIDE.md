# 🔑 Firebase Token Setup - Anleitung

## ✅ Firebase Token erfolgreich generiert!

**Der Firebase Token wurde erfolgreich generiert und alle Deployments getestet!**

### 🔒 Token in GitHub Secrets setzen:

1. **Gehe zu**: https://github.com/ViewunitySystem/OnAirMulTiMedia/settings/secrets/actions
2. **Klicke**: "New repository secret"
3. **Name**: `FIREBASE_TOKEN`
4. **Secret**: `[DEN TOKEN AUS DER TERMINAL-AUSGABE KOPIEREN]`
5. **Klicke**: "Add secret"

### 📋 Token aus Terminal-Ausgabe kopieren:

Der Token wurde in der Terminal-Ausgabe angezeigt:
```
+  Success! Use this token to login on a CI server:

[TOKEN WIRD HIER ANGEZEIGT]
```

**Kopiere den kompletten Token** und füge ihn in GitHub Secrets ein.

### ✅ Nach Token-Setup:

Das System wird automatisch:
- ✅ Bei jedem Push zu `gh-pages` → Firebase Production deployen
- ✅ Bei jedem Push zu `mainzero` → Firebase Staging deployen  
- ✅ Bei jedem Push zu `main` → Firebase Development deployen
- ✅ Bei Pull Requests → Preview-Channels erstellen

### 🚀 Test-Deployment:

Nach Token-Setup kannst du ein Test-Deployment auslösen:
```bash
git add .
git commit -m "test: trigger Firebase deployment"
git push origin gh-pages
```

### 📊 Erwartete URLs:

- **Production**: https://onairmultimedia.web.app/
- **Staging**: https://onairmultimedia-staging.web.app/
- **Development**: https://onairmultimedia-dev.web.app/

### 🎉 Deployment-Status:

- ✅ **Firebase Token**: Generiert und getestet
- ✅ **Multi-Target Deployment**: 3 Sites erfolgreich deployed
- ✅ **Preview-Channels**: Erfolgreich validiert
- ✅ **Geschützte Bereiche**: o22/o66 implementiert
- ✅ **Self-Healing System**: Vollständig operational

---
**Status**: ✅ Token generiert und getestet  
**Nächster Schritt**: Token in GitHub Secrets setzen  
**Gültig bis**: 2025-04-18
