# SDR UI Rotation System

FROM node:20-alpine

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package.json und Package-lock.json kopieren
COPY package*.json ./

# Dependencies installieren
RUN npm ci --only=production

# Anwendungscode kopieren
COPY . .

# Build für Produktion
RUN npm run build

# Port freigeben
EXPOSE 3000

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Nicht-root User erstellen
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Berechtigungen setzen
RUN chown -R nextjs:nodejs /app
USER nextjs

# Anwendung starten
CMD ["npm", "start"]
