/**
 * Security Headers Middleware for Live Data Platform
 * Provides comprehensive security headers for all HTTP responses
 */

import { Request, Response, NextFunction } from 'express';

export interface SecurityConfig {
  enableHSTS: boolean;
  hstsMaxAge: number;
  hstsIncludeSubDomains: boolean;
  hstsPreload: boolean;
  enableCSP: boolean;
  cspDirectives: Record<string, string[]>;
  enableXFrameOptions: boolean;
  xFrameOptions: 'DENY' | 'SAMEORIGIN' | string;
  enableXContentTypeOptions: boolean;
  enableXSSProtection: boolean;
  enableReferrerPolicy: boolean;
  referrerPolicy: string;
  enablePermissionsPolicy: boolean;
  permissionsPolicy: Record<string, string[]>;
  enableExpectCT: boolean;
  expectCTMaxAge: number;
  enableCrossOriginEmbedderPolicy: boolean;
  crossOriginEmbedderPolicy: 'require-corp' | 'credentialless';
  enableCrossOriginOpenerPolicy: boolean;
  crossOriginOpenerPolicy: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  enableCrossOriginResourcePolicy: boolean;
  crossOriginResourcePolicy: 'same-origin' | 'same-site' | 'cross-origin';
}

export class SecurityHeaders {
  private config: SecurityConfig;
  
  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      enableHSTS: true,
      hstsMaxAge: 31536000, // 1 year
      hstsIncludeSubDomains: true,
      hstsPreload: true,
      enableCSP: true,
      cspDirectives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'", 'https:'],
        'frame-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': [],
        'block-all-mixed-content': []
      },
      enableXFrameOptions: true,
      xFrameOptions: 'DENY',
      enableXContentTypeOptions: true,
      enableXSSProtection: true,
      enableReferrerPolicy: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      enablePermissionsPolicy: true,
      permissionsPolicy: {
        'camera': ['none'],
        'microphone': ['none'],
        'geolocation': ['none'],
        'payment': ['none'],
        'usb': ['none'],
        'magnetometer': ['none'],
        'gyroscope': ['none'],
        'accelerometer': ['none'],
        'fullscreen': ['self']
      },
      enableExpectCT: true,
      expectCTMaxAge: 86400, // 1 day
      enableCrossOriginEmbedderPolicy: false,
      crossOriginEmbedderPolicy: 'require-corp',
      enableCrossOriginOpenerPolicy: true,
      crossOriginOpenerPolicy: 'same-origin',
      enableCrossOriginResourcePolicy: true,
      crossOriginResourcePolicy: 'same-origin',
      ...config
    };
  }
  
  /**
   * Apply security headers to HTTP response
   */
  public apply(req: Request, res: Response, next: NextFunction): void {
    try {
      this.setHSTS(res);
      this.setCSP(res);
      this.setXFrameOptions(res);
      this.setXContentTypeOptions(res);
      this.setXSSProtection(res);
      this.setReferrerPolicy(res);
      this.setPermissionsPolicy(res);
      this.setExpectCT(res);
      this.setCrossOriginEmbedderPolicy(res);
      this.setCrossOriginOpenerPolicy(res);
      this.setCrossOriginResourcePolicy(res);
      
      // Add custom security headers
      this.setCustomHeaders(res);
      
      next();
    } catch (error) {
      console.error('Error setting security headers:', error);
      next(error);
    }
  }
  
  /**
   * Set HTTP Strict Transport Security header
   */
  private setHSTS(res: Response): void {
    if (!this.config.enableHSTS) return;
    
    let hstsValue = `max-age=${this.config.hstsMaxAge}`;
    
    if (this.config.hstsIncludeSubDomains) {
      hstsValue += '; includeSubDomains';
    }
    
    if (this.config.hstsPreload) {
      hstsValue += '; preload';
    }
    
    res.setHeader('Strict-Transport-Security', hstsValue);
  }
  
  /**
   * Set Content Security Policy header
   */
  private setCSP(res: Response): void {
    if (!this.config.enableCSP) return;
    
    const directives: string[] = [];
    
    for (const [directive, values] of Object.entries(this.config.cspDirectives)) {
      if (values.length === 0) {
        directives.push(directive);
      } else {
        directives.push(`${directive} ${values.join(' ')}`);
      }
    }
    
    const cspValue = directives.join('; ');
    res.setHeader('Content-Security-Policy', cspValue);
  }
  
  /**
   * Set X-Frame-Options header
   */
  private setXFrameOptions(res: Response): void {
    if (!this.config.enableXFrameOptions) return;
    
    res.setHeader('X-Frame-Options', this.config.xFrameOptions);
  }
  
  /**
   * Set X-Content-Type-Options header
   */
  private setXContentTypeOptions(res: Response): void {
    if (!this.config.enableXContentTypeOptions) return;
    
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
  
  /**
   * Set X-XSS-Protection header
   */
  private setXSSProtection(res: Response): void {
    if (!this.config.enableXSSProtection) return;
    
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }
  
  /**
   * Set Referrer-Policy header
   */
  private setReferrerPolicy(res: Response): void {
    if (!this.config.enableReferrerPolicy) return;
    
    res.setHeader('Referrer-Policy', this.config.referrerPolicy);
  }
  
  /**
   * Set Permissions-Policy header
   */
  private setPermissionsPolicy(res: Response): void {
    if (!this.config.enablePermissionsPolicy) return;
    
    const policies: string[] = [];
    
    for (const [feature, allowlist] of Object.entries(this.config.permissionsPolicy)) {
      policies.push(`${feature}=(${allowlist.join(' ')})`);
    }
    
    const permissionsPolicyValue = policies.join(', ');
    res.setHeader('Permissions-Policy', permissionsPolicyValue);
  }
  
  /**
   * Set Expect-CT header
   */
  private setExpectCT(res: Response): void {
    if (!this.config.enableExpectCT) return;
    
    const expectCTValue = `max-age=${this.config.expectCTMaxAge}`;
    res.setHeader('Expect-CT', expectCTValue);
  }
  
  /**
   * Set Cross-Origin-Embedder-Policy header
   */
  private setCrossOriginEmbedderPolicy(res: Response): void {
    if (!this.config.enableCrossOriginEmbedderPolicy) return;
    
    res.setHeader('Cross-Origin-Embedder-Policy', this.config.crossOriginEmbedderPolicy);
  }
  
  /**
   * Set Cross-Origin-Opener-Policy header
   */
  private setCrossOriginOpenerPolicy(res: Response): void {
    if (!this.config.enableCrossOriginOpenerPolicy) return;
    
    res.setHeader('Cross-Origin-Opener-Policy', this.config.crossOriginOpenerPolicy);
  }
  
  /**
   * Set Cross-Origin-Resource-Policy header
   */
  private setCrossOriginResourcePolicy(res: Response): void {
    if (!this.config.enableCrossOriginResourcePolicy) return;
    
    res.setHeader('Cross-Origin-Resource-Policy', this.config.crossOriginResourcePolicy);
  }
  
  /**
   * Set custom security headers
   */
  private setCustomHeaders(res: Response): void {
    // Server information hiding
    res.removeHeader('X-Powered-By');
    res.setHeader('Server', 'LiveDataPlatform/1.0');
    
    // Cache control for sensitive endpoints
    if (res.getHeader('Content-Type')?.toString().includes('application/json')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    
    // Additional security headers
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    
    // API-specific headers
    res.setHeader('X-API-Version', '1.0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');
  }
  
  /**
   * Get current security configuration
   */
  public getConfig(): SecurityConfig {
    return { ...this.config };
  }
  
  /**
   * Update security configuration
   */
  public updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
  }
  
  /**
   * Generate security report
   */
  public generateSecurityReport(): {
    headers: Record<string, string>;
    configuration: SecurityConfig;
    recommendations: string[];
  } {
    const headers: Record<string, string> = {};
    
    // Simulate header generation for report
    if (this.config.enableHSTS) {
      headers['Strict-Transport-Security'] = `max-age=${this.config.hstsMaxAge}`;
    }
    
    if (this.config.enableCSP) {
      const directives = Object.entries(this.config.cspDirectives)
        .map(([directive, values]) => values.length === 0 ? directive : `${directive} ${values.join(' ')}`)
        .join('; ');
      headers['Content-Security-Policy'] = directives;
    }
    
    if (this.config.enableXFrameOptions) {
      headers['X-Frame-Options'] = this.config.xFrameOptions;
    }
    
    const recommendations: string[] = [];
    
    if (!this.config.enableHSTS) {
      recommendations.push('Enable HSTS for better security');
    }
    
    if (!this.config.enableCSP) {
      recommendations.push('Enable Content Security Policy');
    }
    
    if (!this.config.enableXFrameOptions) {
      recommendations.push('Enable X-Frame-Options to prevent clickjacking');
    }
    
    return {
      headers,
      configuration: this.config,
      recommendations
    };
  }
}

// Factory function for easy initialization
export function createSecurityHeaders(config?: Partial<SecurityConfig>): SecurityHeaders {
  return new SecurityHeaders(config);
}

// Default configuration for production
export const defaultSecurityConfig: Partial<SecurityConfig> = {
  enableHSTS: true,
  hstsMaxAge: 31536000, // 1 year
  hstsIncludeSubDomains: true,
  hstsPreload: true,
  enableCSP: true,
  enableXFrameOptions: true,
  xFrameOptions: 'DENY',
  enableXContentTypeOptions: true,
  enableXSSProtection: true,
  enableReferrerPolicy: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  enablePermissionsPolicy: true,
  enableExpectCT: true,
  expectCTMaxAge: 86400,
  enableCrossOriginOpenerPolicy: true,
  crossOriginOpenerPolicy: 'same-origin',
  enableCrossOriginResourcePolicy: true,
  crossOriginResourcePolicy: 'same-origin'
};

// Relaxed configuration for development
export const developmentSecurityConfig: Partial<SecurityConfig> = {
  enableHSTS: false,
  enableCSP: true,
  cspDirectives: {
    'default-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:', 'http:'],
    'connect-src': ["'self'", 'https:', 'http:', 'ws:', 'wss:'],
    'frame-src': ["'self'", 'http:', 'https:']
  },
  enableXFrameOptions: false,
  enableCrossOriginEmbedderPolicy: false,
  enableCrossOriginResourcePolicy: false
};
