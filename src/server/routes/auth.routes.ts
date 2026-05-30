// File: src/server/routes/auth.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { dbService } from '../db';

export const authRouter = Router();
const JWT_SECRET = 'hospital-management-secret-key-2026-secure';

// Helper to secure verify passwords (SHA-256)
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Custom JWT implementation
export function signToken(payload: object): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');
    
  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
      
    if (signature !== expectedSignature) return null;
    
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString();
    return JSON.parse(payloadStr);
  } catch (err) {
    return null;
  }
}

// Auth Middleware exported for other routes
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: "No token provided" });
  
  const user = verifyToken(token);
  if (!user) return res.status(403).json({ message: "Invalid or expired session" });
  
  (req as any).user = user;
  next();
}

// Helper to log PHI audit logs
export async function logAudit(
  userId: string, 
  username: string, 
  role: string, 
  action: string, 
  details: string, 
  patientId?: string
) {
  try {
    const newLog = {
      id: `log-${crypto.randomUUID()}`,
      userId,
      username,
      userRole: role,
      patientId: patientId || null,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    await dbService.insertAuditLog(newLog);
  } catch (err) {
    console.error("CRITICAL HIPAA NO_SQL LEDGER TRANSACTION ERROR:", err);
  }
}

// 1. Auth Login Gateway
authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Missing username or password" });
  }
  
  try {
    const userFound = await dbService.getUserByUsername(username);
    if (!userFound || hashPassword(password) !== userFound.passwordHash) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    
    const payload = {
      id: userFound.id,
      username: userFound.username,
      name: userFound.name,
      role: userFound.role,
      department: userFound.department
    };
    
    const token = signToken(payload);
    await logAudit(userFound.id, userFound.username, userFound.role, 'USER_LOGIN', `User ${userFound.username} logged in successfully.`);
    
    res.json({ token, user: payload });
  } catch (err: any) {
    res.status(500).json({ message: "Internal Auth Gateway Error", error: err.message });
  }
});

// 2. Fetch logged in session profile
authRouter.get('/me', authenticateToken, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});
