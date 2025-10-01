import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

// WebTrit Token-Endpoint für sichere JWT-Generierung
class WebTritTokenService {
  constructor() {
    this.secret = process.env.WEBTRIT_JWT_SECRET || 'oamtm-webtrit-secret-2025';
    this.issuer = 'oamtm-webtrit-service';
    this.audience = 'webtrit-client';
  }

  // Short-lived JWT für WebTrit-Session generieren
  generateToken(userId, permissions = ['call', 'video', 'im']) {
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: this.issuer,
      aud: this.audience,
      sub: userId,
      iat: now,
      exp: now + (15 * 60), // 15 Minuten
      permissions,
      session_id: this.generateSessionId(),
      client_info: {
        platform: 'web',
        version: '2025.10.01',
        swipe_enhanced: true
      }
    };

    return jwt.sign(payload, this.secret, { algorithm: 'HS256' });
  }

  // Session-ID generieren
  generateSessionId() {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
  }

  // Token validieren
  validateToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience
      });
      return { valid: true, payload: decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Audit-Event für Token-Operationen
  emitTokenAudit(event, userId, sessionId, metadata = {}) {
    const auditEvent = {
      event: `TOKEN_${event}`,
      timestamp: new Date().toISOString(),
      user_id: userId,
      session_id: sessionId,
      service: 'webtrit-token-service',
      metadata
    };

    // In Production: an audit/events/webtrit-tokens.jsonl schreiben
    console.log('TOKEN_AUDIT:', JSON.stringify(auditEvent));
    return auditEvent;
  }
}

// Express.js Route Handler
export function createTokenEndpoint(app) {
  const tokenService = new WebTritTokenService();

  // Token-Endpoint
  app.post('/api/webtrit/token', async (req, res) => {
    try {
      const { userId, permissions } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      // Feature-Flag prüfen
      const commsEnabled = process.env.OAMTM_COMMS_ENABLED === 'true' || 
                           req.query.comms === '1';
      
      if (!commsEnabled) {
        return res.status(503).json({ 
          error: 'Communications feature disabled',
          feature_flag: 'comms_disabled'
        });
      }

      // Token generieren
      const token = tokenService.generateToken(userId, permissions);
      const sessionId = tokenService.generateSessionId();

      // Audit-Event
      tokenService.emitTokenAudit('GENERATED', userId, sessionId, {
        permissions,
        feature_flag: commsEnabled
      });

      res.json({
        token,
        expires_in: 900, // 15 Minuten
        session_id: sessionId,
        permissions,
        webtrit_config: {
          server_url: process.env.WEBTRIT_SERVER_URL || 'wss://webtrit.example.com',
          ice_servers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

    } catch (error) {
      console.error('Token generation error:', error);
      res.status(500).json({ error: 'Token generation failed' });
    }
  });

  // Token-Validierung
  app.post('/api/webtrit/validate', async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: 'token required' });
      }

      const validation = tokenService.validateToken(token);
      
      if (validation.valid) {
        res.json({
          valid: true,
          payload: validation.payload
        });
      } else {
        res.status(401).json({
          valid: false,
          error: validation.error
        });
      }

    } catch (error) {
      console.error('Token validation error:', error);
      res.status(500).json({ error: 'Token validation failed' });
    }
  });

  return tokenService;
}

// Standalone Service (für Tests)
export { WebTritTokenService };
