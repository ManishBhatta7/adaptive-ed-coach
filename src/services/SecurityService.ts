import { logger } from './LoggingService';
import { supabase } from '@/integrations/supabase/client';

export interface SecurityConfig {
  enableCSP: boolean;
  enableXSSProtection: boolean;
  enableInputSanitization: boolean;
  maxRequestSize: number;
  rateLimitWindow: number;
  maxRequestsPerWindow: number;
}

export class SecurityService {
  private static instance: SecurityService;
  private config: SecurityConfig;
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  private blockedIPs = new Set<string>();
  private suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /document\.cookie/gi,
    /document\.write/gi,
    /window\.location/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    /insert\s+into/gi,
    /update\s+set/gi
  ];

  private constructor() {
    this.config = {
      enableCSP: true,
      enableXSSProtection: true,
      enableInputSanitization: true,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      rateLimitWindow: 60000, // 1 minute
      maxRequestsPerWindow: 100
    };
    
    this.initializeSecurity();
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  private initializeSecurity(): void {
    this.setupCSP();
    this.setupXSSProtection();
    this.monitorSecurityEvents();
  }

  // Content Security Policy
  private setupCSP(): void {
    if (this.config.enableCSP && typeof document !== 'undefined') {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdn.jsdelivr.net;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: https: blob:;
        connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com;
        media-src 'self' blob:;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
      `.replace(/\s+/g, ' ').trim();
      
      document.head.appendChild(meta);
      
      logger.info('Content Security Policy initialized', {}, 'Security');
    }
  }

  // XSS Protection
  private setupXSSProtection(): void {
    if (this.config.enableXSSProtection && typeof document !== 'undefined') {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'X-XSS-Protection';
      meta.content = '1; mode=block';
      document.head.appendChild(meta);
      
      logger.info('XSS Protection enabled', {}, 'Security');
    }
  }

  // Monitor security events
  private monitorSecurityEvents(): void {
    // Monitor CSP violations
    if (typeof document !== 'undefined') {
      document.addEventListener('securitypolicyviolation', (e) => {
        logger.error('CSP Violation detected', undefined, {
          violatedDirective: e.violatedDirective,
          blockedURI: e.blockedURI,
          documentURI: e.documentURI,
          lineNumber: e.lineNumber,
          sourceFile: e.sourceFile
        }, 'Security');
        
        this.handleSecurityViolation('CSP_VIOLATION', {
          directive: e.violatedDirective,
          uri: e.blockedURI
        });
      });
    }
  }

  // Input sanitization
  sanitizeInput(input: string): string {
    if (!this.config.enableInputSanitization) {
      return input;
    }
    
    let sanitized = input;
    
    // Remove script tags and dangerous patterns
    this.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(sanitized)) {
      logger.warn('Suspicious pattern detected in input', {
        pattern: pattern.toString(),
        originalLength: input.length
      }, 'Security');
        
        sanitized = sanitized.replace(pattern, '');
      }
    });
    
    // HTML encode special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    return sanitized;
  }

  // Validate file uploads
  validateFileUpload(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check file size
    if (file.size > this.config.maxRequestSize) {
      errors.push(`File size exceeds maximum allowed size (${this.config.maxRequestSize / 1024 / 1024}MB)`);
    }
    
    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }
    
    // Check file name for suspicious patterns
    const fileName = file.name.toLowerCase();
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar'];
    
    if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
      errors.push('File extension is not allowed');
    }
    
    if (errors.length > 0) {
      logger.warn('File upload validation failed', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        errors
      }, 'Security');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Rate limiting
  checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const userLimit = this.requestCounts.get(identifier);
    
    if (!userLimit || now > userLimit.resetTime) {
      this.requestCounts.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow
      });
      return true;
    }
    
    if (userLimit.count >= this.config.maxRequestsPerWindow) {
      logger.warn('Rate limit exceeded', {
        identifier,
        count: userLimit.count,
        limit: this.config.maxRequestsPerWindow
      }, 'Security');
      
      this.handleSecurityViolation('RATE_LIMIT_EXCEEDED', { identifier });
      return false;
    }
    
    userLimit.count++;
    return true;
  }

  // Session security
  validateSession(sessionToken: string): boolean {
    if (!sessionToken) {
      return false;
    }
    
    // Check session format
    if (sessionToken.length < 32) {
      logger.warn('Invalid session token format', {}, 'Security');
      return false;
    }
    
    // Additional session validation logic can be added here
    return true;
  }

  // Check for common attack patterns
  detectAttackPatterns(input: string, context: string): boolean {
    const attackPatterns = [
      // SQL Injection
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND)\b.*\b(FROM|INTO|SET|WHERE|TABLE)\b)/gi,
      // XSS
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on(load|error|click|mouse|key)\s*=/gi,
      // Command Injection
      /(\||\&|\;|\$\(|\`)/g,
      // Path Traversal
      /\.\.[\/\\]/g,
      // LDAP Injection
      /(\(|\)|\\|\*|\x00)/g
    ];
    
    for (const pattern of attackPatterns) {
      if (pattern.test(input)) {
        logger.error('Attack pattern detected', new Error('Attack pattern detected'), {
          pattern: pattern.toString(),
          context,
          inputLength: input.length
        }, 'Security');
        
        this.handleSecurityViolation('ATTACK_PATTERN_DETECTED', {
          pattern: pattern.toString(),
          context
        });
        
        return true;
      }
    }
    
    return false;
  }

  // Handle security violations
  private handleSecurityViolation(type: string, details: Record<string, any>): void {
    // Log the violation
    logger.critical(`Security violation: ${type}`, undefined, details, 'Security');
    
    // Store in database for analysis
    this.storeSecurityEvent(type, details);
    
    // Implement response actions based on violation type
    switch (type) {
      case 'RATE_LIMIT_EXCEEDED':
        // Temporarily block the identifier
        if (details.identifier) {
          this.temporarilyBlockUser(details.identifier);
        }
        break;
        
      case 'ATTACK_PATTERN_DETECTED':
        // More severe response for attack patterns
        if (details.context === 'login') {
          // Block IP for longer duration for login attacks
          this.temporarilyBlockUser(details.identifier || 'unknown', 3600000); // 1 hour
        }
        break;
        
      case 'CSP_VIOLATION':
        // Monitor for repeated CSP violations
        break;
    }
  }

  // Temporarily block a user/IP
  private temporarilyBlockUser(identifier: string, duration = 300000): void { // 5 minutes default
    this.blockedIPs.add(identifier);
    
    setTimeout(() => {
      this.blockedIPs.delete(identifier);
      logger.info('User unblocked', { identifier }, 'Security');
    }, duration);
    
    logger.warn('User temporarily blocked', { identifier, duration }, 'Security');
  }

  // Check if user/IP is blocked
  isBlocked(identifier: string): boolean {
    return this.blockedIPs.has(identifier);
  }

  // Store security events in database
  private async storeSecurityEvent(type: string, details: Record<string, any>): Promise<void> {
    try {
      // Use learning_sessions table to store security events
      await supabase.from('learning_sessions').insert({
        user_id: '00000000-0000-0000-0000-000000000000', // System user
        session_type: 'security_event',
        insights: {
          event_type: type,
          details,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          url: window.location.href
        }
      });
    } catch (error) {
      logger.error('Failed to store security event', error as Error, { type, details }, 'Security');
    }
  }

  // Encrypt sensitive data before storage
  encryptSensitiveData(data: string, key?: string): string {
    // Simple XOR encryption for demonstration
    // In production, use proper encryption libraries
    const encKey = key || 'default-key-should-be-env-var';
    let encrypted = '';
    
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ encKey.charCodeAt(i % encKey.length)
      );
    }
    
    return btoa(encrypted);
  }

  // Decrypt sensitive data
  decryptSensitiveData(encryptedData: string, key?: string): string {
    try {
      const encKey = key || 'default-key-should-be-env-var';
      const encrypted = atob(encryptedData);
      let decrypted = '';
      
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ encKey.charCodeAt(i % encKey.length)
        );
      }
      
      return decrypted;
    } catch (error) {
      logger.error('Failed to decrypt data', error as Error, {}, 'Security');
      return '';
    }
  }

  // Generate security report
  generateSecurityReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      config: this.config,
      statistics: {
        totalRequests: Array.from(this.requestCounts.values()).reduce((sum, limit) => sum + limit.count, 0),
        blockedUsers: this.blockedIPs.size,
        activeRateLimits: this.requestCounts.size
      },
      recommendations: this.generateSecurityRecommendations()
    };
    
    return JSON.stringify(report, null, 2);
  }

  private generateSecurityRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.blockedIPs.size > 10) {
      recommendations.push('High number of blocked IPs detected. Consider reviewing and implementing additional security measures.');
    }
    
    if (!this.config.enableCSP) {
      recommendations.push('Content Security Policy is disabled. Enable CSP for better XSS protection.');
    }
    
    if (this.config.maxRequestsPerWindow > 200) {
      recommendations.push('Rate limit is quite high. Consider lowering it for better protection against abuse.');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const securityService = SecurityService.getInstance();