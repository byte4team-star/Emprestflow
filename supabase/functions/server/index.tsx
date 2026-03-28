import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import { addClientPortalRoutes } from "./client_portal_routes.tsx";
import { addBillingRoutes } from "./billing_routes.tsx";
import { addHealthRoutes } from "./health.tsx";

// Server version: 2.3.0 - Fixed timezone in date processing and message formatting - Updated at 2026-03-28
const app = new Hono();

// Supabase clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Evolution API credentials
const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
const evolutionInstanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'emprestflow';

console.log('[INIT] Supabase URL:', supabaseUrl);
console.log('[INIT] Has Service Key:', !!supabaseServiceKey);
console.log('[INIT] Has Anon Key:', !!supabaseAnonKey);
console.log('[INIT] Evolution API configured:', !!evolutionApiUrl && !!evolutionApiKey);

// Validate Evolution API URL format (simplified warnings)
if (evolutionApiUrl) {
  if (!evolutionApiUrl.startsWith('http://') && !evolutionApiUrl.startsWith('https://')) {
    console.warn('[INIT] ⚠️  EVOLUTION_API_URL has invalid format:', evolutionApiUrl);
    console.warn('[INIT] Expected: https://your-api.evolution.com | WhatsApp features disabled.');
  } else {
    console.log('[INIT] ✅ Evolution API URL format is valid:', evolutionApiUrl);
  }
} else {
  console.info('[INIT] ℹ️  EVOLUTION_API_URL not configured. WhatsApp features disabled.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Create a client for verifying user JWTs (uses anon key)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// HELPER FUNCTIONS: Date Formatting
// ============================================

/**
 * Safely parse a date string avoiding timezone issues
 * Forces time to 12:00:00 to prevent date shifts
 */
function parseDateSafe(dateString: string): Date {
  const dateOnly = dateString.split('T')[0]; // Get only YYYY-MM-DD
  return new Date(`${dateOnly}T12:00:00`); // Force noon time
}

/**
 * Format date as DD/MM/YYYY manually to avoid timezone issues
 */
function formatDateBR(dateString: string): string {
  const dateOnly = dateString.split('T')[0]; // Get YYYY-MM-DD
  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Debug middleware - log all incoming requests and headers
app.use('*', (c, next) => {
  const path = c.req.path;
  const method = c.req.method;
  
  console.log(`[REQUEST] ${method} ${path}`);
  console.log('[HEADERS] All headers:', {
    'content-type': c.req.header('Content-Type'),
    'authorization': c.req.header('Authorization') ? c.req.header('Authorization').substring(0, 50) + '...' : 'none',
    'x-user-token': c.req.header('X-User-Token') ? c.req.header('X-User-Token').substring(0, 50) + '...' : 'none',
    'origin': c.req.header('Origin'),
    'user-agent': c.req.header('User-Agent')?.substring(0, 100),
  });
  
  return next();
});

// ============================================
// MIDDLEWARE: Authentication
// ============================================
function decodeJWT(token: string): { sub?: string; email?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Get the payload (second part)
    const base64Url = parts[1];
    // Convert base64url to base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    
    // Decode using TextDecoder for better compatibility
    const jsonPayload = new TextDecoder().decode(
      Uint8Array.from(atob(padded), c => c.charCodeAt(0))
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('[AUTH] JWT decode error:', error.message);
    return null;
  }
}

async function authenticateUser(authHeader: string | null, userTokenHeader: string | null = null) {
  console.log('[AUTH] ===== authenticateUser START =====');
  console.log('[AUTH] authHeader present:', !!authHeader);
  console.log('[AUTH] userTokenHeader present:', !!userTokenHeader);
  
  // Priority: use X-User-Token if present, otherwise Authorization header
  let token: string | null = null;
  
  if (userTokenHeader) {
    token = userTokenHeader.trim();
    console.log('[AUTH] Using X-User-Token header');
  } else if (authHeader) {
    const extractedToken = authHeader.replace('Bearer ', '').trim();
    // Check if this is the anon key (use userTokenHeader instead if available)
    if (extractedToken === supabaseAnonKey) {
      console.log('[AUTH] Anon key detected in Authorization header');
      if (!userTokenHeader) {
        console.log('[AUTH] No X-User-Token available - anonymous request');
        return { user: null, error: 'Anonymous request' };
      }
      // This case is already handled above, but adding for clarity
      return { user: null, error: 'Anonymous request' };
    }
    token = extractedToken;
    console.log('[AUTH] Using Authorization header');
  } else {
    console.log('[AUTH] No authorization headers provided');
    return { user: null, error: 'No authorization header' };
  }

  console.log('[AUTH] Token received, length:', token?.length);
  console.log('[AUTH] Token first 30 chars:', token?.substring(0, 30) + '...');
  
  if (!token) {
    console.log('[AUTH] No token provided');
    return { user: null, error: 'No token provided' };
  }

  try {
    // CRITICAL FIX: Use the SERVICE ROLE client to verify JWTs
    // The service role has full permissions to validate any JWT from Supabase Auth
    console.log('[AUTH] Attempting to verify user with Supabase (using admin client)...');
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error('[AUTH] Supabase getUser error:', authError.message, authError.code);
      console.error('[AUTH] Full error object:', JSON.stringify(authError));
      return { user: null, error: `Auth error: ${authError.message}` };
    }
    
    if (!authUser) {
      console.error('[AUTH] No user returned from Supabase');
      return { user: null, error: 'No user found' };
    }

    console.log('[AUTH] ✅ User verified by Supabase:', authUser.email);
    console.log('[AUTH] User ID:', authUser.id);
    
    // Get or create user profile from KV store
    const userId = authUser.id;
    const userEmail = authUser.email || '';
    
    console.log('[AUTH] Fetching user profile from KV store...');
    const profileData = await kv.get(`user_profile:${userId}`);
    let profile = profileData ? JSON.parse(profileData) : null;

    if (!profile) {
      console.log('[AUTH] Creating new profile for user:', userId);
      profile = {
        id: userId,
        email: userEmail,
        name: authUser.user_metadata?.name || userEmail.split('@')[0] || 'User',
        role: authUser.user_metadata?.role || 'operator',
        createdAt: new Date().toISOString(),
      };
      await kv.set(`user_profile:${userId}`, JSON.stringify(profile));
      console.log('[AUTH] Profile created successfully');
    } else {
      console.log('[AUTH] Profile found:', { role: profile.role, name: profile.name });
    }

    console.log('[AUTH] ===== authenticateUser SUCCESS =====');
    
    return { 
      user: {
        id: userId,
        email: userEmail,
        role: profile.role || 'operator',
        name: profile.name,
        ...profile
      }, 
      error: null 
    };
  } catch (error) {
    console.error('[AUTH] Unexpected error in authenticateUser:', error.message);
    console.error('[AUTH] Error stack:', error.stack);
    return { user: null, error: 'Authentication error: ' + error.message };
  }
}

// Middleware to require authentication
const requireAuth = async (c: any, next: any) => {
  console.log('[REQUIRE_AUTH] ===== START =====');
  console.log('[REQUIRE_AUTH] Path:', c.req.path);
  console.log('[REQUIRE_AUTH] Method:', c.req.method);
  
  const authHeader = c.req.header('Authorization');
  const userTokenHeader = c.req.header('X-User-Token');
  console.log('[REQUIRE_AUTH] Has auth header:', !!authHeader);
  console.log('[REQUIRE_AUTH] Auth header:', authHeader?.substring(0, 50) + '...');
  
  const { user, error } = await authenticateUser(authHeader, userTokenHeader);

  console.log('[REQUIRE_AUTH] Authentication result:', {
    hasUser: !!user,
    error,
    userId: user?.id?.substring(0, 8),
    email: user?.email
  });

  if (error || !user) {
    console.error('[REQUIRE_AUTH] Authentication failed, returning 401');
    return c.json({ error: 'Unauthorized', message: error }, 401);
  }

  console.log('[REQUIRE_AUTH] ✅ Authentication successful, proceeding...');
  c.set('user', user);
  c.set('userId', user.id); // Also set userId for easy access
  await next();
};

// Middleware to require admin role
const requireAdmin = async (c: any, next: any) => {
  const user = c.get('user');
  
  if (user.role !== 'admin') {
    await logAudit({
      userId: user.id,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      resource: c.req.path,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { role: user.role }
    });
    return c.json({ error: 'Forbidden', message: 'Admin access required' }, 403);
  }

  await next();
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Audit logging
async function logAudit(data: {
  userId: string;
  action: string;
  resource: string;
  ip: string;
  metadata?: any;
}) {
  const auditLog = {
    ...data,
    timestamp: new Date().toISOString(),
  };
  
  const logKey = `audit:${Date.now()}:${data.userId}:${data.action}`;
  await kv.set(logKey, JSON.stringify(auditLog));
  console.log('[AUDIT]', auditLog);
}

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize Storage Buckets
async function initializeStorage() {
  const bucketName = 'make-bd42bc02-documents';
  
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
      });
      console.log(`[STORAGE] Bucket ${bucketName} created`);
    }
  } catch (error) {
    console.error('[STORAGE] Error initializing bucket:', error);
  }
}

// Initialize storage on startup
initializeStorage();

// ============================================
// INITIALIZE DEFAULT ADMIN USER
// ============================================
async function initializeDefaultAdmin() {
  try {
    console.log('[INIT] Checking for default admin user...');
    
    const defaultEmail = 'admin@empresa.com';
    const defaultPassword = 'Admin@123456';
    
    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const adminExists = existingUsers?.users?.some(u => u.email === defaultEmail);
    
    if (adminExists) {
      console.log('[INIT] ✅ Default admin user already exists');
      return;
    }
    
    console.log('[INIT] Creating default admin user...');
    
    // Create default admin user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: defaultEmail,
      password: defaultPassword,
      user_metadata: { 
        name: 'Administrador',
        role: 'admin'
      },
      email_confirm: true
    });
    
    if (error) {
      console.error('[INIT] ❌ Error creating default admin:', error.message);
      return;
    }
    
    // Create user profile in KV store
    const profile = {
      id: data.user.id,
      email: defaultEmail,
      name: 'Administrador',
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`user_profile:${data.user.id}`, JSON.stringify(profile));
    
    console.log('[INIT] ✅ Default admin user created successfully!');
    console.log('[INIT] 📧 Email:', defaultEmail);
    console.log('[INIT] 🔑 Password:', defaultPassword);
    console.log('[INIT] ⚠️  Please change this password after first login!');
    
  } catch (error) {
    console.error('[INIT] Error initializing default admin:', error);
  }
}

// Initialize default admin on startup
initializeDefaultAdmin();

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Sign up
app.post("/make-server-bd42bc02/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role = 'operator', accessCode } = body;

    console.log('[SIGNUP] Request received:', { email, role, hasAccessCode: !!accessCode });
    console.log('[SIGNUP] Access code received:', accessCode ? `"${accessCode}" (length: ${accessCode.length})` : 'none');

    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Security: Require access code for admin/operator registration
    const ADMIN_ACCESS_CODE = 'emprestflow26';
    if (role === 'admin' || role === 'operator') {
      // Normalize access code: trim whitespace
      const normalizedAccessCode = (accessCode || '').trim();
      const normalizedExpectedCode = ADMIN_ACCESS_CODE.trim();
      
      console.log('[SIGNUP] Code comparison:', {
        received: `"${normalizedAccessCode}"`,
        expected: `"${normalizedExpectedCode}"`,
        receivedLength: normalizedAccessCode.length,
        expectedLength: normalizedExpectedCode.length,
        match: normalizedAccessCode === normalizedExpectedCode
      });
      
      if (normalizedAccessCode !== normalizedExpectedCode) {
        console.error('[SIGNUP] ❌ Invalid access code attempt for role:', role);
        console.error('[SIGNUP] Received code bytes:', [...normalizedAccessCode].map(c => c.charCodeAt(0)));
        console.error('[SIGNUP] Expected code bytes:', [...normalizedExpectedCode].map(c => c.charCodeAt(0)));
        return c.json({ error: 'Código de acesso inválido. Somente pessoal autorizado pode criar contas de administrador/operador.' }, 403);
      }
      
      console.log('[SIGNUP] ✅ Access code validated successfully');
    }

    // Only admins can create admin accounts
    const authHeader = c.req.header('Authorization');
    if (role === 'admin' && authHeader) {
      const { user } = await authenticateUser(authHeader);
      if (!user || user.role !== 'admin') {
        return c.json({ error: 'Only admins can create admin accounts' }, 403);
      }
    }

    // Check if user already exists
    console.log('[SIGNUP] Checking if user already exists...');
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (userExists) {
      console.warn('[SIGNUP] ⚠️  Attempted duplicate registration for email:', email);
      return c.json({ 
        error: 'Este e-mail já está cadastrado no sistema. Use a opção "Esqueci minha senha" para recuperar seu acesso, ou faça login se já possui uma conta.' 
      }, 409);
    }
    
    console.log('[SIGNUP] ✅ Email is available, creating user...');

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm email since email server hasn't been configured
      email_confirm: true
    });

    if (error) {
      console.error('[SIGNUP] Error creating user:', error);
      
      // Better error messages
      let errorMessage = error.message;
      if (error.message.includes('already been registered') || error.message.includes('User already registered')) {
        errorMessage = 'Este e-mail já está cadastrado no sistema. Por favor, faça login ou use outro e-mail.';
      }
      
      return c.json({ error: errorMessage }, 400);
    }

    // Create user profile
    const profile = {
      id: data.user.id,
      email,
      name,
      role: role,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user_profile:${data.user.id}`, JSON.stringify(profile));

    // If role is 'client', create a client record automatically
    if (role === 'client') {
      const clientId = generateId('client');
      const client = {
        id: clientId,
        authUserId: data.user.id,
        fullName: name,
        cpfCnpj: '',
        rg: '',
        birthDate: '',
        phone: '',
        whatsapp: '',
        email: email,
        address: '',
        occupation: '',
        company: '',
        monthlyIncome: 0,
        status: 'active',
        lgpdConsent: true,
        lgpdConsentDate: new Date().toISOString(),
        documents: { front: null, back: null, selfie: null, video: null },
        createdAt: new Date().toISOString(),
        createdBy: data.user.id,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`client:${clientId}`, JSON.stringify(client));
      await kv.set(`client_auth:${data.user.id}`, clientId);
      
      console.log('[SIGNUP] Created client record:', clientId);
    }

    await logAudit({
      userId: data.user.id,
      action: 'USER_SIGNUP',
      resource: 'auth',
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { email, role: profile.role }
    });

    return c.json({ 
      success: true, 
      user: { id: data.user.id, email, name, role: profile.role } 
    });
  } catch (error) {
    console.error('[SIGNUP] Unexpected error:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Get user profile
app.get("/make-server-bd42bc02/auth/profile", requireAuth, async (c) => {
  const user = c.get('user');
  return c.json({ user });
});

// Get user profile (alternative endpoint without requireAuth for initial login)
app.get("/make-server-bd42bc02/auth/me", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const userTokenHeader = c.req.header('X-User-Token');
    console.log('[AUTH_ME] ===== START =====');
    console.log('[AUTH_ME] Auth header present:', !!authHeader);
    console.log('[AUTH_ME] X-User-Token header present:', !!userTokenHeader);
    
    if (!authHeader && !userTokenHeader) {
      console.log('[AUTH_ME] No auth header provided');
      return c.json({ error: 'No authorization header', code: 401 }, 401);
    }

    const { user, error: authError } = await authenticateUser(authHeader, userTokenHeader);
    
    console.log('[AUTH_ME] authenticateUser result:', {
      hasUser: !!user,
      error: authError,
      userId: user?.id?.substring(0, 8),
      email: user?.email
    });
    
    if (authError || !user) {
      console.error('[AUTH_ME] Authentication failed:', authError);
      return c.json({ error: authError || 'Authentication failed', code: 401, message: authError || 'Invalid JWT' }, 401);
    }

    console.log('[AUTH_ME] ✅ Returning profile for:', user.email);
    
    return c.json({ 
      user,
      success: true 
    });
  } catch (error) {
    console.error('[AUTH_ME] Unexpected error:', error);
    return c.json({ error: String(error), code: 500 }, 500);
  }
});

// ============================================
// PASSWORD RECOVERY ROUTES
// ============================================

// Request password recovery code
app.post("/make-server-bd42bc02/auth/forgot-password", async (c) => {
  try {
    const body = await c.req.json();
    const { method, email, phone } = body;

    console.log('[FORGOT_PASSWORD] Request received:', { method, email, phone });

    if (!method || (method !== 'email' && method !== 'phone')) {
      return c.json({ error: 'Método inválido. Use "email" ou "phone".' }, 400);
    }

    if (method === 'email' && !email) {
      return c.json({ error: 'Email é obrigatório' }, 400);
    }

    if (method === 'phone' && !phone) {
      return c.json({ error: 'Telefone é obrigatório' }, 400);
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    console.log('[FORGOT_PASSWORD] Generated code:', code);

    if (method === 'email') {
      // Find user by email
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (!user) {
        // Don't reveal if email exists or not (security)
        console.log('[FORGOT_PASSWORD] Email not found, but returning success');
        return c.json({ success: true, message: 'Se o email existir, um código foi enviado.' });
      }

      // Store recovery code
      const recoveryKey = `recovery:${user.id}`;
      await kv.set(recoveryKey, JSON.stringify({ code, expiresAt, method: 'email' }));

      console.log('[FORGOT_PASSWORD] ✅ Recovery code for', email, ':', code);

      // In development, return the code (REMOVE IN PRODUCTION!)
      return c.json({ 
        success: true, 
        message: 'Código de recuperação gerado.',
        devCode: code,
        devMessage: 'Email server não configurado. Use este código:' 
      });

    } else if (method === 'phone') {
      // Find user by phone (search in user profiles)
      const allProfiles = await kv.getByPrefix('user_profile:');
      let userProfile = null;
      let userId = null;

      for (const profileStr of allProfiles) {
        try {
          const profile = JSON.parse(profileStr);
          const normalizedPhone = phone.replace(/\D/g, '');
          const normalizedProfilePhone = (profile.phone || '').replace(/\D/g, '');
          
          if (normalizedProfilePhone === normalizedPhone) {
            userProfile = profile;
            userId = profile.id;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!userId) {
        console.log('[FORGOT_PASSWORD] Phone not found, but returning success');
        return c.json({ success: true, message: 'Se o telefone existir, um código foi enviado.' });
      }

      // Store recovery code
      const recoveryKey = `recovery:${userId}`;
      await kv.set(recoveryKey, JSON.stringify({ code, expiresAt, method: 'phone' }));

      // Send WhatsApp message via Evolution API
      if (evolutionApiUrl && evolutionApiKey) {
        try {
          const whatsappNumber = phone.replace(/\D/g, '');
          const formattedNumber = whatsappNumber.startsWith('55') ? whatsappNumber : `55${whatsappNumber}`;

          const message = `🔐 *ALEMÃO.CREFISA - Recuperação de Senha*\n\nSeu código de recuperação é: *${code}*\n\nEste código expira em 15 minutos.\n\n⚠️ Não compartilhe este código com ninguém!`;

          const response = await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey,
            },
            body: JSON.stringify({
              number: `${formattedNumber}@s.whatsapp.net`,
              text: message,
            }),
          });

          if (!response.ok) {
            console.error('[FORGOT_PASSWORD] Error sending WhatsApp:', await response.text());
          } else {
            console.log('[FORGOT_PASSWORD] ✅ WhatsApp sent to', formattedNumber);
          }
        } catch (error) {
          console.error('[FORGOT_PASSWORD] Error sending WhatsApp:', error);
        }
      }

      console.log('[FORGOT_PASSWORD] ✅ Recovery code for', phone, ':', code);

      return c.json({ 
        success: true, 
        message: 'Código de recuperação enviado via WhatsApp.',
        devCode: evolutionApiUrl ? undefined : code,
        devMessage: evolutionApiUrl ? undefined : 'Evolution API não configurada. Use este código:' 
      });
    }

  } catch (error) {
    console.error('[FORGOT_PASSWORD] Unexpected error:', error);
    return c.json({ error: 'Erro ao processar solicitação de recuperação' }, 500);
  }
});

// Reset password with code
app.post("/make-server-bd42bc02/auth/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const { method, email, phone, code, newPassword } = body;

    console.log('[RESET_PASSWORD] Request received:', { method, email, phone, code: '***' });

    if (!code || !newPassword) {
      return c.json({ error: 'Código e nova senha são obrigatórios' }, 400);
    }

    if (code.length !== 6) {
      return c.json({ error: 'Código deve ter 6 dígitos' }, 400);
    }

    if (newPassword.length < 8) {
      return c.json({ error: 'Senha deve ter no mínimo 8 caracteres' }, 400);
    }

    let userId: string | null = null;

    // Find user
    if (method === 'email') {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (user) {
        userId = user.id;
      }
    } else if (method === 'phone') {
      const allProfiles = await kv.getByPrefix('user_profile:');
      
      for (const profileStr of allProfiles) {
        try {
          const profile = JSON.parse(profileStr);
          const normalizedPhone = phone.replace(/\D/g, '');
          const normalizedProfilePhone = (profile.phone || '').replace(/\D/g, '');
          
          if (normalizedProfilePhone === normalizedPhone) {
            userId = profile.id;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    if (!userId) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }

    // Verify code
    const recoveryKey = `recovery:${userId}`;
    const recoveryData = await kv.get(recoveryKey);

    if (!recoveryData) {
      return c.json({ error: 'Código inválido ou expirado' }, 400);
    }

    const recovery = JSON.parse(recoveryData);

    // Check if expired
    if (new Date(recovery.expiresAt) < new Date()) {
      await kv.del(recoveryKey);
      return c.json({ error: 'Código expirado. Solicite um novo código.' }, 400);
    }

    // Verify code
    if (recovery.code !== code) {
      return c.json({ error: 'Código inválido' }, 400);
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('[RESET_PASSWORD] Error updating password:', updateError);
      return c.json({ error: 'Erro ao atualizar senha' }, 500);
    }

    // Delete recovery code
    await kv.del(recoveryKey);

    // Log audit
    await logAudit({
      userId,
      action: 'PASSWORD_RESET',
      resource: 'auth',
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { method }
    });

    console.log('[RESET_PASSWORD] ✅ Password reset successful for user:', userId);

    return c.json({ success: true, message: 'Senha redefinida com sucesso!' });

  } catch (error) {
    console.error('[RESET_PASSWORD] Unexpected error:', error);
    return c.json({ error: 'Erro ao redefinir senha' }, 500);
  }
});

// ============================================
// CLIENT MANAGEMENT ROUTES
// ============================================

// Create client
app.post("/make-server-bd42bc02/clients", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const {
      fullName,
      cpfCnpj,
      rg,
      birthDate,
      phone,
      whatsapp,
      email,
      address,
      occupation,
      company,
      monthlyIncome,
      status,
      referredBy,
      lgpdConsent,
    } = body;

    // Validation
    if (!fullName || !cpfCnpj || !rg || !phone || !email || !lgpdConsent) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const clientId = generateId('client');
    const client = {
      id: clientId,
      fullName,
      cpfCnpj,
      rg,
      birthDate,
      phone,
      whatsapp,
      email,
      address,
      occupation,
      company,
      monthlyIncome,
      status: status || 'active',
      referredBy,
      lgpdConsent,
      lgpdConsentDate: new Date().toISOString(),
      documents: {
        front: null,
        back: null,
        selfie: null,
        video: null,
      },
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`client:${clientId}`, JSON.stringify(client));
    await kv.set(`client_cpf:${cpfCnpj}`, clientId);

    await logAudit({
      userId: user.id,
      action: 'CLIENT_CREATED',
      resource: `client:${clientId}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { clientName: fullName, cpfCnpj }
    });

    return c.json({ success: true, client });
  } catch (error) {
    console.error('[CLIENT_CREATE] Error:', error);
    return c.json({ error: 'Error creating client' }, 500);
  }
});

// Get all clients
app.get("/make-server-bd42bc02/clients", requireAuth, async (c) => {
  try {
    const clientKeys = await kv.getByPrefix('client:client_');
    const clients = clientKeys.map(item => JSON.parse(item));
    
    // Sort by creation date (newest first)
    clients.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ clients });
  } catch (error) {
    console.error('[CLIENTS_LIST] Error:', error);
    return c.json({ error: 'Error fetching clients' }, 500);
  }
});

// Get single client
app.get("/make-server-bd42bc02/clients/:id", requireAuth, async (c) => {
  try {
    const clientId = c.req.param('id');
    const clientData = await kv.get(`client:${clientId}`);
    
    if (!clientData) {
      return c.json({ error: 'Client not found' }, 404);
    }

    const client = JSON.parse(clientData);
    
    // Generate signed URLs for documents
    if (client.documents) {
      for (const [type, doc] of Object.entries(client.documents)) {
        if (doc && doc.path) {
          try {
            const { data: signedUrlData, error } = await supabaseAdmin.storage
              .from('make-bd42bc02-documents')
              .createSignedUrl(doc.path, 3600); // Valid for 1 hour
            
            if (!error && signedUrlData?.signedUrl) {
              client.documents[type] = signedUrlData.signedUrl;
            } else {
              console.error(`[CLIENT_GET] Error generating signed URL for ${type}:`, error);
              client.documents[type] = null;
            }
          } catch (error) {
            console.error(`[CLIENT_GET] Error processing document ${type}:`, error);
            client.documents[type] = null;
          }
        }
      }
    }
    
    return c.json({ client });
  } catch (error) {
    console.error('[CLIENT_GET] Error:', error);
    return c.json({ error: 'Error fetching client' }, 500);
  }
});

// Update client
app.put("/make-server-bd42bc02/clients/:id", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const clientId = c.req.param('id');
    const body = await c.req.json();
    
    const clientData = await kv.get(`client:${clientId}`);
    if (!clientData) {
      return c.json({ error: 'Client not found' }, 404);
    }

    const existingClient = JSON.parse(clientData);
    const updatedClient = {
      ...existingClient,
      ...body,
      id: clientId,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };

    await kv.set(`client:${clientId}`, JSON.stringify(updatedClient));

    await logAudit({
      userId: user.id,
      action: 'CLIENT_UPDATED',
      resource: `client:${clientId}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { clientName: updatedClient.fullName }
    });

    return c.json({ success: true, client: updatedClient });
  } catch (error) {
    console.error('[CLIENT_UPDATE] Error:', error);
    return c.json({ error: 'Error updating client' }, 500);
  }
});

// ============================================
// DOCUMENT UPLOAD ROUTES
// ============================================

// Upload document
app.post("/make-server-bd42bc02/clients/:id/documents", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const clientId = c.req.param('id');
    const body = await c.req.json();
    const { documentType, fileName, fileData, mimeType } = body;

    if (!['front', 'back', 'selfie', 'video'].includes(documentType)) {
      return c.json({ error: 'Invalid document type' }, 400);
    }

    // Validate file size (50MB max)
    const fileSizeBytes = (fileData.length * 3) / 4; // Base64 to bytes approximation
    if (fileSizeBytes > 52428800) {
      return c.json({ error: 'File size exceeds 50MB limit' }, 400);
    }

    const clientData = await kv.get(`client:${clientId}`);
    if (!clientData) {
      return c.json({ error: 'Client not found' }, 404);
    }

    // Convert base64 to blob
    const base64Data = fileData.split(',')[1] || fileData;
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const filePath = `${clientId}/${documentType}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('make-bd42bc02-documents')
      .upload(filePath, binaryData, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[UPLOAD] Error uploading file:', uploadError);
      return c.json({ error: uploadError.message }, 500);
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from('make-bd42bc02-documents')
      .createSignedUrl(filePath, 3600);

    // Update client document reference
    const client = JSON.parse(clientData);
    client.documents[documentType] = {
      path: filePath,
      fileName,
      mimeType,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.id,
    };
    client.updatedAt = new Date().toISOString();

    await kv.set(`client:${clientId}`, JSON.stringify(client));

    await logAudit({
      userId: user.id,
      action: 'DOCUMENT_UPLOADED',
      resource: `client:${clientId}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { documentType, fileName }
    });

    return c.json({ 
      success: true, 
      url: signedUrlData?.signedUrl,
      document: client.documents[documentType]
    });
  } catch (error) {
    console.error('[UPLOAD] Unexpected error:', error);
    return c.json({ error: 'Error uploading document' }, 500);
  }
});

// Get document signed URL
app.get("/make-server-bd42bc02/clients/:id/documents/:type", requireAuth, async (c) => {
  try {
    const clientId = c.req.param('id');
    const documentType = c.req.param('type');

    const clientData = await kv.get(`client:${clientId}`);
    if (!clientData) {
      return c.json({ error: 'Client not found' }, 404);
    }

    const client = JSON.parse(clientData);
    const document = client.documents?.[documentType];

    if (!document || !document.path) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // First check if file exists in storage
    const { data: fileExists, error: existsError } = await supabaseAdmin.storage
      .from('make-bd42bc02-documents')
      .list(document.path.split('/').slice(0, -1).join('/'), {
        search: document.path.split('/').pop()
      });

    if (existsError || !fileExists || fileExists.length === 0) {
      console.error('[DOCUMENT_URL] File does not exist in storage:', document.path);
      
      // Clean up the invalid reference from database
      client.documents[documentType] = null;
      await kv.set(`client:${clientId}`, JSON.stringify(client));
      
      return c.json({ error: 'Document file not found in storage' }, 404);
    }

    const { data: signedUrlData, error } = await supabaseAdmin.storage
      .from('make-bd42bc02-documents')
      .createSignedUrl(document.path, 3600);

    if (error) {
      console.error('[DOCUMENT_URL] Error creating signed URL:', error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ url: signedUrlData.signedUrl, document });
  } catch (error) {
    console.error('[DOCUMENT_URL] Error:', error);
    return c.json({ error: 'Error fetching document URL' }, 500);
  }
});

// ============================================
// CONTRACT MANAGEMENT ROUTES
// ============================================

// Create contract
app.post("/make-server-bd42bc02/contracts", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const {
      clientId,
      totalAmount,
      installments,
      firstDueDate,
      interestRate,
      lateFeeRate,
      description,
    } = body;

    if (!clientId || !totalAmount || !installments || !firstDueDate) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verify client exists
    const clientData = await kv.get(`client:${clientId}`);
    if (!clientData) {
      return c.json({ error: 'Client not found' }, 404);
    }

    const contractId = generateId('contract');
    
    // Calculate installment amount with SIMPLE interest (not compound/Price Table)
    // Formula: Total with interest = totalAmount * (1 + interestRate/100)
    // Installment = (totalAmount with interest) / number of installments
    const rate = (interestRate || 20) / 100; // Convert percentage to decimal
    const totalWithInterest = totalAmount * (1 + rate);
    const installmentAmount = totalWithInterest / installments;

    // Generate installments
    const installmentsList = [];
    for (let i = 0; i < installments; i++) {
      // Fix timezone issue: parse date and add fixed noon time to prevent day shifts
      const dueDateParts = firstDueDate.split('-'); // YYYY-MM-DD
      const year = parseInt(dueDateParts[0]);
      const month = parseInt(dueDateParts[1]) - 1; // Month is 0-indexed
      const day = parseInt(dueDateParts[2]);
      
      // Use Date.UTC to avoid timezone issues - creates date in UTC at noon
      const dueDate = new Date(Date.UTC(year, month + i, day, 12, 0, 0));
      
      // Format as YYYY-MM-DDT12:00:00 to fix timezone consistency
      const formattedDueDate = `${dueDate.getUTCFullYear()}-${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dueDate.getUTCDate()).padStart(2, '0')}T12:00:00`;

      installmentsList.push({
        number: i + 1,
        amount: parseFloat(installmentAmount.toFixed(2)),
        dueDate: formattedDueDate,
        status: 'pending',
        paidAt: null,
        paidAmount: null,
      });
    }

    const contract = {
      id: contractId,
      clientId,
      totalAmount,
      installments,
      installmentAmount: parseFloat(installmentAmount.toFixed(2)),
      firstDueDate,
      interestRate: interestRate || 20,
      lateFeeRate: lateFeeRate || 10,
      description,
      status: 'active',
      installmentsList,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`contract:${contractId}`, JSON.stringify(contract));
    
    // Add contract to client's contract list
    const client = JSON.parse(clientData);
    if (!client.contractIds) client.contractIds = [];
    client.contractIds.push(contractId);
    await kv.set(`client:${clientId}`, JSON.stringify(client));

    await logAudit({
      userId: user.id,
      action: 'CONTRACT_CREATED',
      resource: `contract:${contractId}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { clientId, totalAmount, installments }
    });

    return c.json({ success: true, contract });
  } catch (error) {
    console.error('[CONTRACT_CREATE] Error:', error);
    return c.json({ error: 'Error creating contract' }, 500);
  }
});

// Update contract
app.put("/make-server-bd42bc02/contracts/:id", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const contractId = c.req.param('id');
    const body = await c.req.json();
    
    const {
      clientId,
      totalAmount,
      installments,
      firstDueDate,
      interestRate,
      lateFeeRate,
      description,
    } = body;

    // Get existing contract
    const contractData = await kv.get(`contract:${contractId}`);
    if (!contractData) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    const contract = JSON.parse(contractData);

    // Update contract fields
    contract.totalAmount = totalAmount || contract.totalAmount;
    contract.installments = installments || contract.installments;
    contract.firstDueDate = firstDueDate || contract.firstDueDate;
    contract.interestRate = interestRate !== undefined ? interestRate : contract.interestRate;
    contract.lateFeeRate = lateFeeRate !== undefined ? lateFeeRate : contract.lateFeeRate;
    contract.description = description !== undefined ? description : contract.description;
    contract.updatedAt = new Date().toISOString();
    
    // Calculate installment amount with SIMPLE interest (not compound/Price Table)
    const rate = contract.interestRate / 100;
    const totalWithInterest = contract.totalAmount * (1 + rate);
    contract.installmentAmount = totalWithInterest / contract.installments;

    // Recalculate installments if total or installments changed
    const installmentsList = [];
    for (let i = 0; i < contract.installments; i++) {
      const existingInstallment = contract.installmentsList[i];
      
      // Fix timezone issue: use UTC to avoid date shifting
      const dueDateParts = contract.firstDueDate.split('-'); // YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
      const dateOnly = dueDateParts[0] + '-' + dueDateParts[1] + '-' + dueDateParts[2].split('T')[0];
      const parts = dateOnly.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const day = parseInt(parts[2]);
      
      // Use Date.UTC to avoid timezone issues - creates date in UTC at noon
      const dueDate = new Date(Date.UTC(year, month + i, day, 12, 0, 0));
      
      // Format as YYYY-MM-DDT12:00:00 to fix timezone consistency
      const formattedDueDate = `${dueDate.getUTCFullYear()}-${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dueDate.getUTCDate()).padStart(2, '0')}T12:00:00`;

      // Keep paid installments as-is, recalculate pending ones
      if (existingInstallment && existingInstallment.status === 'paid') {
        installmentsList.push(existingInstallment);
      } else {
        installmentsList.push({
          number: i + 1,
          dueDate: formattedDueDate,
          amount: parseFloat(contract.installmentAmount.toFixed(2)),
          status: 'pending',
          paidAt: null,
          paidAmount: null,
        });
      }
    }
    contract.installmentsList = installmentsList;

    await kv.set(`contract:${contractId}`, JSON.stringify(contract));

    await logAudit({
      userId: user.id,
      action: 'CONTRACT_UPDATED',
      resource: `contract:${contractId}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { totalAmount, installments }
    });

    return c.json({ success: true, contract });
  } catch (error) {
    console.error('[CONTRACT_UPDATE] Error:', error);
    return c.json({ error: 'Error updating contract' }, 500);
  }
});

// Delete contract
app.delete("/make-server-bd42bc02/contracts/:id", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const contractId = c.req.param('id');

    // Get contract
    const contractData = await kv.get(`contract:${contractId}`);
    if (!contractData) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    const contract = JSON.parse(contractData);

    // Check if there are paid installments
    const hasPaidInstallments = contract.installmentsList?.some((inst: any) => inst.status === 'paid');
    if (hasPaidInstallments) {
      return c.json({ 
        error: 'Não é possível excluir contrato com parcelas pagas. Apenas contratos sem pagamentos podem ser excluídos.' 
      }, 400);
    }

    // Remove contract from client's contract list
    const clientData = await kv.get(`client:${contract.clientId}`);
    if (clientData) {
      const client = JSON.parse(clientData);
      if (client.contractIds) {
        client.contractIds = client.contractIds.filter((cid: string) => cid !== contractId);
        await kv.set(`client:${contract.clientId}`, JSON.stringify(client));
      }
    }

    // Delete contract
    await kv.del(`contract:${contractId}`);

    await logAudit({
      userId: user.id,
      action: 'CONTRACT_DELETED',
      resource: `contract:${contractId}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { clientId: contract.clientId, totalAmount: contract.totalAmount }
    });

    return c.json({ success: true, message: 'Contrato excluído com sucesso' });
  } catch (error) {
    console.error('[CONTRACT_DELETE] Error:', error);
    return c.json({ error: 'Error deleting contract' }, 500);
  }
});

// Get all contracts
app.get("/make-server-bd42bc02/contracts", requireAuth, async (c) => {
  try {
    const contractKeys = await kv.getByPrefix('contract:contract_');
    const contracts = contractKeys.map(item => JSON.parse(item));
    
    // Enrich with client data
    for (const contract of contracts) {
      const clientData = await kv.get(`client:${contract.clientId}`);
      if (clientData) {
        contract.client = JSON.parse(clientData);
      }
    }

    contracts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ contracts });
  } catch (error) {
    console.error('[CONTRACTS_LIST] Error:', error);
    return c.json({ error: 'Error fetching contracts' }, 500);
  }
});

// Get single contract
app.get("/make-server-bd42bc02/contracts/:id", requireAuth, async (c) => {
  try {
    const contractId = c.req.param('id');
    const contractData = await kv.get(`contract:${contractId}`);
    
    if (!contractData) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    const contract = JSON.parse(contractData);
    
    // Get client data
    const clientData = await kv.get(`client:${contract.clientId}`);
    if (clientData) {
      contract.client = JSON.parse(clientData);
    }

    return c.json({ contract });
  } catch (error) {
    console.error('[CONTRACT_GET] Error:', error);
    return c.json({ error: 'Error fetching contract' }, 500);
  }
});

// Update installment payment
app.post("/make-server-bd42bc02/contracts/:id/installments/:number/pay", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const contractId = c.req.param('id');
    const installmentNumber = parseInt(c.req.param('number'));
    const body = await c.req.json();
    const { amount, paymentDate } = body;

    const contractData = await kv.get(`contract:${contractId}`);
    if (!contractData) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    const contract = JSON.parse(contractData);
    const installment = contract.installmentsList[installmentNumber - 1];

    if (!installment) {
      return c.json({ error: 'Installment not found' }, 404);
    }

    if (installment.status === 'paid') {
      return c.json({ error: 'Esta parcela já foi paga anteriormente' }, 400);
    }

    installment.status = 'paid';
    installment.paidAt = paymentDate || new Date().toISOString();
    installment.paidAmount = amount;

    contract.updatedAt = new Date().toISOString();
    await kv.set(`contract:${contractId}`, JSON.stringify(contract));

    // Get client information for the financial transaction
    const clientData = await kv.get(`client:${contract.clientId}`);
    const client = clientData ? JSON.parse(clientData) : null;

    // Create financial transaction automatically
    const transactionId = generateId('transaction');
    const transaction = {
      id: transactionId,
      type: 'income',
      category: 'Pagamento de Contrato',
      description: `Parcela ${installmentNumber}/${contract.installments} - Contrato ${contractId}`,
      amount: parseFloat(amount),
      date: paymentDate || new Date().toISOString(),
      paymentMethod: 'Não especificado',
      status: 'paid',
      clientId: contract.clientId,
      clientName: client ? client.fullName : 'Cliente não identificado',
      contractId: contractId,
      notes: `Pagamento automático da parcela ${installmentNumber} do contrato ${contractId}`,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`transaction:${transactionId}`, JSON.stringify(transaction));

    await logAudit({
      userId: user.id,
      action: 'INSTALLMENT_PAID',
      resource: `contract:${contractId}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { installmentNumber, amount, transactionId }
    });

    // Audit log for financial transaction
    await logAudit({
      userId: user.id,
      action: 'TRANSACTION_CREATED',
      resource: `transaction:${transactionId}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { 
        type: 'income',
        category: 'Pagamento de Contrato',
        amount: parseFloat(amount),
        installmentNumber,
        contractId 
      }
    });

    return c.json({ success: true, installment, transactionId });
  } catch (error) {
    console.error('[PAYMENT] Error:', error);
    return c.json({ error: 'Error processing payment' }, 500);
  }
});

// ============================================
// WHATSAPP INTEGRATION - Evolution API
// ============================================

/**
 * Helper function to send WhatsApp message via Evolution API
 */
async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!evolutionApiUrl || !evolutionApiKey) {
    console.error('[WHATSAPP] Evolution API not configured');
    return { success: false, error: 'WhatsApp API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY.' };
  }

  try {
    // Format phone number: remove all non-digits
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // Evolution API expects format: 5511999999999@s.whatsapp.net
    const whatsappNumber = `${formattedPhone}@s.whatsapp.net`;

    console.log('[WHATSAPP] Sending message:', {
      to: whatsappNumber,
      originalPhone: phoneNumber,
      instance: evolutionInstanceName,
    });

    // Send message via Evolution API
    const response = await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: whatsappNumber,
        text: message,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[WHATSAPP] Evolution API error:', responseData);
      return { 
        success: false, 
        error: `Erro ao enviar WhatsApp: ${responseData.message || response.statusText}` 
      };
    }

    console.log('[WHATSAPP] Message sent successfully:', responseData);
    
    return { 
      success: true, 
      messageId: responseData.key?.id || 'unknown' 
    };
  } catch (error) {
    console.error('[WHATSAPP] Error sending message:', error);
    return { 
      success: false, 
      error: `Erro na requisição: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

app.post("/make-server-bd42bc02/whatsapp/send-reminder", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { clientId, contractId, installmentNumber, type } = body;

    // Get contract and client
    const contractData = await kv.get(`contract:${contractId}`);
    const clientData = await kv.get(`client:${clientId}`);

    if (!contractData || !clientData) {
      return c.json({ error: 'Contract or client not found' }, 404);
    }

    const contract = JSON.parse(contractData);
    const client = JSON.parse(clientData);
    const installment = contract.installmentsList[installmentNumber - 1];

    if (!installment) {
      return c.json({ error: 'Installment not found' }, 404);
    }

    if (!client.whatsapp) {
      return c.json({ error: 'Cliente não possui WhatsApp cadastrado' }, 400);
    }

    // Build message
    let message = '';
    if (type === 'before') {
      message = `Olá ${client.fullName}! 👋\n\nLembramos que a parcela ${installmentNumber}/${contract.installments} no valor de *R$ ${installment.amount.toFixed(2)}* vence em 3 dias (${formatDateBR(installment.dueDate)}).\n\n📝 Contrato: ${contract.id}\n\nPor favor, fique atento ao vencimento!`;
    } else if (type === 'today') {
      message = `Olá ${client.fullName}! 👋\n\n⚠️ A parcela ${installmentNumber}/${contract.installments} no valor de *R$ ${installment.amount.toFixed(2)}* vence *HOJE*!\n\n📝 Contrato: ${contract.id}\n\nPor favor, regularize seu pagamento.`;
    } else if (type === 'overdue') {
      message = `Olá ${client.fullName}! 👋\n\n🔴 A parcela ${installmentNumber}/${contract.installments} no valor de *R$ ${installment.amount.toFixed(2)}* está em *atraso* desde ${formatDateBR(installment.dueDate)}.\n\n📝 Contrato: ${contract.id}\n\nPor favor, regularize seu pagamento o quanto antes.`;
    }

    // Send WhatsApp message via Evolution API
    const whatsappResult = await sendWhatsAppMessage(client.whatsapp, message);

    // Save notification log
    const notificationId = generateId('notification');
    const notification = {
      id: notificationId,
      clientId,
      contractId,
      installmentNumber,
      type,
      message,
      sentAt: new Date().toISOString(),
      status: whatsappResult.success ? 'sent' : 'failed',
      error: whatsappResult.error,
      messageId: whatsappResult.messageId,
    };

    await kv.set(`notification:${notificationId}`, JSON.stringify(notification));

    await logAudit({
      userId: user.id,
      action: 'WHATSAPP_REMINDER_SENT',
      resource: `contract:${contractId}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { 
        clientId, 
        installmentNumber, 
        type,
        success: whatsappResult.success,
        phone: client.whatsapp,
      }
    });

    if (!whatsappResult.success) {
      return c.json({ 
        error: whatsappResult.error,
        notification,
      }, 500);
    }

    return c.json({ 
      success: true, 
      notification,
      messageId: whatsappResult.messageId,
    });
  } catch (error) {
    console.error('[WHATSAPP] Error:', error);
    return c.json({ error: 'Error sending WhatsApp reminder' }, 500);
  }
});

// Send location to WhatsApp
app.post("/make-server-bd42bc02/whatsapp/send-location", async (c) => {
  try {
    const body = await c.req.json();
    const { phoneNumber, clientName, latitude, longitude, googleMapsLink } = body;

    console.log('[WHATSAPP_LOCATION] Sending location:', { phoneNumber, clientName, latitude, longitude });

    if (!phoneNumber || !clientName || !latitude || !longitude) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('[WHATSAPP_LOCATION] Evolution API not configured');
      return c.json({ error: 'WhatsApp service not configured' }, 500);
    }

    // Format message
    const message = `📍 *Nova Localização de Cliente*\n\n` +
                   `👤 *Cliente:* ${clientName}\n` +
                   `🌍 *Coordenadas:*\n` +
                   `   Latitude: ${latitude}\n` +
                   `   Longitude: ${longitude}\n\n` +
                   `🗺️ *Google Maps:*\n${googleMapsLink}\n\n` +
                   `_Localização compartilhada durante o cadastro_`;

    // Send text message first
    const textResponse = await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: message,
      }),
    });

    if (!textResponse.ok) {
      const errorData = await textResponse.json().catch(() => ({}));
      console.error('[WHATSAPP_LOCATION] Text message failed:', errorData);
      throw new Error('Failed to send text message');
    }

    const textResult = await textResponse.json();
    console.log('[WHATSAPP_LOCATION] Text message sent successfully:', textResult);

    // Send location message
    const locationResponse = await fetch(`${evolutionApiUrl}/message/sendLocation/${evolutionInstanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: phoneNumber,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        name: `Localização de ${clientName}`,
        address: googleMapsLink,
      }),
    });

    if (!locationResponse.ok) {
      const errorData = await locationResponse.json().catch(() => ({}));
      console.error('[WHATSAPP_LOCATION] Location message failed:', errorData);
      // Don't throw error here, text message was sent successfully
    } else {
      const locationResult = await locationResponse.json();
      console.log('[WHATSAPP_LOCATION] Location message sent successfully:', locationResult);
    }

    return c.json({ 
      success: true,
      message: 'Location sent to WhatsApp successfully',
      phoneNumber,
    });
  } catch (error: any) {
    console.error('[WHATSAPP_LOCATION] Error:', error);
    return c.json({ 
      error: error.message || 'Error sending location to WhatsApp',
      details: error.toString(),
    }, 500);
  }
});

// ============================================
// REMINDERS - DUE INSTALLMENTS
// ============================================

app.get("/make-server-bd42bc02/reminders/due-installments", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    console.log('[REMINDERS] Fetching due installments for user:', user.id);
    
    // Get all contracts
    const contractKeys = await kv.getByPrefix('contract:contract_');
    const contracts = contractKeys.map(item => JSON.parse(item));
    
    // Get all clients for name lookup
    const clientKeys = await kv.getByPrefix('client:client_');
    const clients = clientKeys.map(item => JSON.parse(item));
    const clientMap = new Map(clients.map(c => [c.id, c]));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reminders: any[] = [];
    
    // Process each contract
    for (const contract of contracts) {
      if (contract.status === 'cancelled') continue;
      
      const client = clientMap.get(contract.clientId);
      if (!client) continue;
      
      // Check each installment
      for (const installment of contract.installmentsList || []) {
        // Skip paid or cancelled installments
        if (installment.status === 'paid' || installment.status === 'cancelled') {
          continue;
        }
        
        // DEBUG: Log installment structure
        console.log('[REMINDERS] Installment data:', {
          contractId: contract.id,
          installment: installment,
          number: installment.number,
          installmentNumber: installment.installmentNumber
        });
        
        // Use parseDateSafe to avoid timezone issues
        const dueDate = parseDateSafe(installment.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        // Calculate days until due
        const diffTime = dueDate.getTime() - today.getTime();
        const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Only show installments that are due within 15 days or overdue
        if (daysUntilDue <= 15) {
          let status: 'upcoming' | 'due_today' | 'overdue';
          
          if (daysUntilDue < 0) {
            status = 'overdue';
          } else if (daysUntilDue <= 6) {
            status = 'due_today';
          } else {
            status = 'upcoming';
          }
          
          reminders.push({
            id: `${contract.id}-${installment.number}`,
            clientId: client.id,
            clientName: client.fullName,
            clientPhone: client.whatsapp || client.phone || '',
            contractId: contract.id,
            contractNumber: contract.id.split('_')[1] || contract.id,
            installmentNumber: installment.number,
            totalInstallments: contract.installments,
            amount: installment.amount,
            dueDate: installment.dueDate,
            status,
            daysUntilDue
          });
        }
      }
    }
    
    // DEBUG: Log all reminders before sorting
    console.log('[REMINDERS] Total reminders before sorting:', reminders.length);
    reminders.forEach((r, idx) => {
      console.log(`[REMINDERS] Reminder ${idx}:`, {
        id: r.id,
        installmentNumber: r.installmentNumber,
        totalInstallments: r.totalInstallments,
        typeof_installmentNumber: typeof r.installmentNumber
      });
    });
    
    // Sort by days until due (overdue first, then soonest)
    reminders.sort((a, b) => {
      if (a.daysUntilDue < 0 && b.daysUntilDue >= 0) return -1;
      if (b.daysUntilDue < 0 && a.daysUntilDue >= 0) return 1;
      return a.daysUntilDue - b.daysUntilDue;
    });
    
    console.log('[REMINDERS] Found reminders:', reminders.length);
    
    return c.json({ 
      success: true,
      reminders,
      count: reminders.length
    });
  } catch (error: any) {
    console.error('[REMINDERS] Error:', error);
    return c.json({ error: error.message || 'Error fetching reminders' }, 500);
  }
});

// ============================================
// DASHBOARD & ANALYTICS
// ============================================

app.get("/make-server-bd42bc02/dashboard/stats", requireAuth, async (c) => {
  try {
    // Get all clients and contracts
    const clientKeys = await kv.getByPrefix('client:client_');
    const contractKeys = await kv.getByPrefix('contract:contract_');
    
    const clients = clientKeys.map(item => JSON.parse(item));
    const contracts = contractKeys.map(item => JSON.parse(item));

    // Calculate statistics
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'active').length;
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;

    let totalRevenue = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let paidInstallments = 0;
    let overdueInstallments = 0;

    // Current month calculations
    let monthlyOutstanding = 0;
    let monthlyOverdue = 0;

    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    contracts.forEach(contract => {
      if (contract.status === 'active') {
        contract.installmentsList.forEach(inst => {
          const instDate = parseDateSafe(inst.dueDate);
          const instMonthKey = `${instDate.getFullYear()}-${String(instDate.getMonth() + 1).padStart(2, '0')}`;
          const isCurrentMonth = instMonthKey === currentMonthKey;

          if (inst.status === 'paid') {
            totalRevenue += inst.paidAmount || inst.amount;
            paidInstallments++;
          } else {
            totalOutstanding += inst.amount;
            const dueDate = parseDateSafe(inst.dueDate);
            if (dueDate < today) {
              totalOverdue += inst.amount;
              overdueInstallments++;
              
              // Count overdue in current month
              if (isCurrentMonth) {
                monthlyOverdue += inst.amount;
              }
            }
            
            // Count outstanding in current month (not paid and due date in current month)
            if (isCurrentMonth) {
              monthlyOutstanding += inst.amount;
            }
          }
        });
      }
    });

    const defaultRate = totalOutstanding > 0 
      ? (totalOverdue / totalOutstanding * 100).toFixed(2) 
      : 0;
    
    const monthlyDefaultRate = monthlyOutstanding > 0
      ? (monthlyOverdue / monthlyOutstanding * 100).toFixed(2)
      : 0;

    // Monthly evolution (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      let paid = 0;
      let overdue = 0;

      contracts.forEach(contract => {
        contract.installmentsList.forEach(inst => {
          const instDate = parseDateSafe(inst.dueDate);
          const instMonthKey = `${instDate.getFullYear()}-${String(instDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (instMonthKey === monthKey) {
            if (inst.status === 'paid') {
              paid += inst.paidAmount || inst.amount;
            } else if (parseDateSafe(inst.dueDate) < today) {
              overdue += inst.amount;
            }
          }
        });
      });

      monthlyData.push({
        month: monthKey,
        paid,
        overdue,
      });
    }

    // Get reminders for dashboard (top 10 most urgent)
    const clientMap = new Map(clients.map(c => [c.id, c]));
    const reminders: any[] = [];
    
    today.setHours(0, 0, 0, 0);
    
    contracts.forEach(contract => {
      if (contract.status === 'cancelled') return;
      
      const client = clientMap.get(contract.clientId);
      if (!client) return;
      
      contract.installmentsList?.forEach((installment: any) => {
        if (installment.status === 'paid' || installment.status === 'cancelled') return;
        
        const dueDate = parseDateSafe(installment.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const diffTime = dueDate.getTime() - today.getTime();
        const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 15) {
          let status: 'upcoming' | 'due_today' | 'overdue';
          
          if (daysUntilDue < 0) {
            status = 'overdue';
          } else if (daysUntilDue <= 6) {
            status = 'due_today';
          } else {
            status = 'upcoming';
          }
          
          reminders.push({
            id: `${contract.id}-${installment.number}`,
            clientId: client.id,
            clientName: client.fullName,
            clientPhone: client.whatsapp || client.phone || '',
            contractId: contract.id,
            contractNumber: contract.id.split('_')[1] || contract.id,
            installmentNumber: installment.number,
            totalInstallments: contract.installments,
            amount: installment.amount,
            dueDate: installment.dueDate,
            status,
            daysUntilDue
          });
        }
      });
    });
    
    // Sort by urgency (overdue first, then soonest)
    reminders.sort((a, b) => {
      if (a.daysUntilDue < 0 && b.daysUntilDue >= 0) return -1;
      if (b.daysUntilDue < 0 && a.daysUntilDue >= 0) return 1;
      return a.daysUntilDue - b.daysUntilDue;
    });

    return c.json({
      stats: {
        totalClients,
        activeClients,
        totalContracts,
        activeContracts,
        totalRevenue,
        totalOutstanding,
        totalOverdue,
        defaultRate: parseFloat(defaultRate),
        paidInstallments,
        overdueInstallments,
        // New monthly fields
        monthlyOutstanding,
        monthlyOverdue,
        monthlyDefaultRate: parseFloat(monthlyDefaultRate),
      },
      monthlyData,
      reminders: reminders.slice(0, 10), // Top 10 most urgent
    });
  } catch (error) {
    console.error('[DASHBOARD] Error:', error);
    return c.json({ error: 'Error fetching dashboard stats' }, 500);
  }
});

// Get audit logs (admin only)
app.get("/make-server-bd42bc02/audit-logs", requireAuth, requireAdmin, async (c) => {
  try {
    const logs = await kv.getByPrefix('audit:');
    const auditLogs = logs.map(item => JSON.parse(item));
    
    auditLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return c.json({ logs: auditLogs.slice(0, 100) }); // Return last 100 logs
  } catch (error) {
    console.error('[AUDIT_LOGS] Error:', error);
    return c.json({ error: 'Error fetching audit logs' }, 500);
  }
});

// ============================================
// CLIENT PORTAL ROUTES (defined in client_portal_routes.tsx)
// ============================================
// Note: Client portal routes are added via addClientPortalRoutes() below

// Health check endpoint
app.get("/make-server-bd42bc02/health", (c) => {
  console.log('[HEALTH] Health check called');
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Public test endpoint - completely open, no auth
app.get("/make-server-bd42bc02/public-test", (c) => {
  console.log('[PUBLIC_TEST] Public test endpoint called');
  return c.json({ 
    status: "ok", 
    message: "Public endpoint working - no authentication required",
    timestamp: new Date().toISOString(),
    headers: {
      hasAuthorization: !!c.req.header('Authorization'),
      hasXUserToken: !!c.req.header('X-User-Token'),
    }
  });
});

// Debug endpoint to check environment (NO AUTH)
app.get("/make-server-bd42bc02/debug/env", (c) => {
  console.log('[DEBUG_ENV] Environment check called');
  return c.json({
    timestamp: new Date().toISOString(),
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    hasAnonKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl?.substring(0, 30),
    serviceKeyPrefix: supabaseServiceKey?.substring(0, 20),
    anonKeyPrefix: supabaseAnonKey?.substring(0, 20),
  });
});

// Debug endpoint to test JWT decoding (NO AUTH REQUIRED)
app.post("/make-server-bd42bc02/debug/decode", async (c) => {
  console.log('[DEBUG_DECODE] ===== Token decode test START =====');
  
  try {
    const body = await c.req.json();
    const token = body.token;
    
    if (!token) {
      console.log('[DEBUG_DECODE] No token provided');
      return c.json({ error: 'No token provided' }, 400);
    }
    
    console.log('[DEBUG_DECODE] Token length:', token.length);
    console.log('[DEBUG_DECODE] Token preview:', token.substring(0, 50) + '...');
    
    // Test with supabaseClient (anon key)
    console.log('[DEBUG_DECODE] Testing with supabaseClient (anon key)...');
    const { data: { user: clientUser }, error: clientError } = await supabaseClient.auth.getUser(token);
    
    console.log('[DEBUG_DECODE] supabaseClient result:', {
      hasUser: !!clientUser,
      error: clientError?.message,
      userId: clientUser?.id?.substring(0, 8),
      email: clientUser?.email
    });
    
    // Test with supabaseAdmin (service role key)
    console.log('[DEBUG_DECODE] Testing with supabaseAdmin (service role)...');
    const { data: { user: adminUser }, error: adminError } = await supabaseAdmin.auth.getUser(token);
    
    console.log('[DEBUG_DECODE] supabaseAdmin result:', {
      hasUser: !!adminUser,
      error: adminError?.message,
      userId: adminUser?.id?.substring(0, 8),
      email: adminUser?.email
    });
    
    // Manual decode
    console.log('[DEBUG_DECODE] Manual decode...');
    const manualResult = decodeJWT(token);
    console.log('[DEBUG_DECODE] Manual decode result:', manualResult);
    
    return c.json({
      timestamp: new Date().toISOString(),
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...',
      supabaseClient: {
        success: !!clientUser,
        error: clientError?.message,
        userId: clientUser?.id,
        email: clientUser?.email
      },
      supabaseAdmin: {
        success: !!adminUser,
        error: adminError?.message,
        userId: adminUser?.id,
        email: adminUser?.email
      },
      manualDecode: manualResult
    });
  } catch (error) {
    console.error('[DEBUG_DECODE] Error:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// SEED DATA ENDPOINT - For populating test data
// ============================================
app.post("/make-server-bd42bc02/seed", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    console.log('[SEED] Starting seed data creation by user:', user.email);
    
    // ⚠️ IMPORTANTE: NÃO limpar dados existentes - apenas adicionar dados de teste
    console.log('[SEED] Creating additional test data (keeping existing data)...');
    
    const clients = [];
    const contracts = [];
    
    // Create 6 clients with realistic Brazilian data
    const clientsData = [
      {
        fullName: "Maria Silva Santos",
        cpfCnpj: "123.456.789-01",
        rg: "12.345.678-9",
        birthDate: "1985-03-15",
        phone: "(11) 98765-4321",
        whatsapp: "(11) 98765-4321",
        email: "maria.santos@email.com",
        address: "Rua das Flores, 123, Apto 45, Vila Mariana, São Paulo - SP, CEP: 04015-020",
        occupation: "Analista de Sistemas",
        company: "Tech Solutions Ltda",
        monthlyIncome: "R$ 8.500,00",
        status: "active",
        lgpdConsent: true,
      },
      {
        fullName: "João Pedro Oliveira",
        cpfCnpj: "234.567.890-12",
        rg: "23.456.789-0",
        birthDate: "1990-07-22",
        phone: "(11) 97654-3210",
        whatsapp: "(11) 97654-3210",
        email: "joao.oliveira@email.com",
        address: "Av. Paulista, 1500, Conjunto 301, Bela Vista, So Paulo - SP, CEP: 01310-100",
        occupation: "Engenheiro Civil",
        company: "Construtora ABC",
        monthlyIncome: "R$ 12.000,00",
        status: "active",
        referredBy: {
          name: "Maria Silva Santos",
          phone: "(11) 98765-4321"
        },
        lgpdConsent: true,
      },
      {
        fullName: "Ana Carolina Ferreira",
        cpfCnpj: "345.678.901-23",
        rg: "34.567.890-1",
        birthDate: "1988-11-05",
        phone: "(11) 96543-2109",
        whatsapp: "(11) 96543-2109",
        email: "ana.ferreira@email.com",
        address: "Rua Augusta, 2500, Apto 802, Consolação, São Paulo - SP, CEP: 01412-100",
        occupation: "Médica",
        company: "Hospital São Luiz",
        monthlyIncome: "R$ 18.000,00",
        status: "active",
        lgpdConsent: true,
      },
      {
        fullName: "Carlos Eduardo Costa",
        cpfCnpj: "456.789.012-34",
        rg: "45.678.901-2",
        birthDate: "1982-05-30",
        phone: "(11) 95432-1098",
        whatsapp: "(11) 95432-1098",
        email: "carlos.costa@email.com",
        address: "Rua Haddock Lobo, 595, Cerqueira César, São Paulo - SP, CEP: 01414-001",
        occupation: "Advogado",
        company: "Costa & Associados",
        monthlyIncome: "R$ 15.000,00",
        status: "active",
        lgpdConsent: true,
      },
      {
        fullName: "Patricia Gomes Alves",
        cpfCnpj: "567.890.123-45",
        rg: "56.789.012-3",
        birthDate: "1995-09-18",
        phone: "(11) 94321-0987",
        whatsapp: "(11) 94321-0987",
        email: "patricia.alves@email.com",
        address: "Rua Oscar Freire, 1000, Apto 1203, Jardim Paulista, São Paulo - SP, CEP: 01426-001",
        occupation: "Designer Gráfica",
        company: "Studio Criativo",
        monthlyIncome: "R$ 6.500,00",
        status: "active",
        referredBy: {
          name: "Ana Carolina Ferreira",
          phone: "(11) 96543-2109"
        },
        lgpdConsent: true,
      },
      {
        fullName: "Ricardo Mendes Lima",
        cpfCnpj: "678.901.234-56",
        rg: "67.890.123-4",
        birthDate: "1978-12-10",
        phone: "(11) 93210-9876",
        whatsapp: "(11) 93210-9876",
        email: "ricardo.lima@email.com",
        address: "Rua dos Pinheiros, 450, Pinheiros, São Paulo - SP, CEP: 05422-000",
        occupation: "Empresário",
        company: "Lima Comércio e Serviços",
        monthlyIncome: "R$ 25.000,00",
        status: "active",
        lgpdConsent: true,
      }
    ];

    // Create clients
    for (let i = 0; i < clientsData.length; i++) {
      const clientData = clientsData[i];
      const clientId = generateId('client');
      
      // All clients start with no documents (they must be uploaded via UI)
      const documents = {
        front: null,
        back: null,
        selfie: null,
        video: null,
      };
      
      const client = {
        id: clientId,
        ...clientData,
        lgpdConsentDate: new Date().toISOString(),
        documents,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`client:${clientId}`, JSON.stringify(client));
      await kv.set(`client_cpf:${clientData.cpfCnpj}`, clientId);
      clients.push(client);
      
      console.log('[SEED] Created client:', client.fullName);
    }

    // Create 5 contracts with the created clients
    const contractsData = [
      {
        clientIndex: 0, // Maria Silva Santos
        totalAmount: 15000,
        installments: 12,
        firstDueDate: "2026-03-01",
        interestRate: 20,
        lateFeeRate: 10,
        description: "Contrato de financiamento de equipamentos de TI"
      },
      {
        clientIndex: 1, // João Pedro Oliveira
        totalAmount: 50000,
        installments: 24,
        firstDueDate: "2026-03-15",
        interestRate: 20,
        lateFeeRate: 10,
        description: "Contrato de prestacao de servicos de engenharia"
      },
      {
        clientIndex: 2, // Ana Carolina Ferreira
        totalAmount: 30000,
        installments: 18,
        firstDueDate: "2026-03-10",
        interestRate: 20,
        lateFeeRate: 10,
        description: "Contrato de consultoria médica"
      },
      {
        clientIndex: 3, // Carlos Eduardo Costa
        totalAmount: 80000,
        installments: 36,
        firstDueDate: "2026-04-01",
        interestRate: 20,
        lateFeeRate: 10,
        description: "Contrato de assessoria jurídica empresarial"
      },
      {
        clientIndex: 4, // Patricia Gomes Alves
        totalAmount: 12000,
        installments: 10,
        firstDueDate: "2026-03-20",
        interestRate: 20,
        lateFeeRate: 10,
        description: "Contrato de projeto de design e branding"
      }
    ];

    // Create contracts
    for (const contractData of contractsData) {
      const client = clients[contractData.clientIndex];
      const contractId = generateId('contract');
      
      // Calculate installment amount with SIMPLE interest
      const rate = contractData.interestRate / 100;
      const totalWithInterest = contractData.totalAmount * (1 + rate);
      const installmentAmount = totalWithInterest / contractData.installments;

      // Generate installments
      const installmentsList = [];
      for (let i = 0; i < contractData.installments; i++) {
        // Fix timezone issue: parse date and add fixed noon time to prevent day shifts
        const dueDateParts = contractData.firstDueDate.split('-');
        const year = parseInt(dueDateParts[0]);
        const month = parseInt(dueDateParts[1]) - 1;
        const day = parseInt(dueDateParts[2]);
        
        // Use Date.UTC to avoid timezone issues - creates date in UTC at noon
        const dueDate = new Date(Date.UTC(year, month + i, day, 12, 0, 0));
        const formattedDueDate = `${dueDate.getUTCFullYear()}-${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dueDate.getUTCDate()).padStart(2, '0')}T12:00:00`;

        installmentsList.push({
          number: i + 1,
          amount: parseFloat(installmentAmount.toFixed(2)),
          dueDate: formattedDueDate,
          status: 'pending',
          paidAt: null,
          paidAmount: null,
        });
      }

      const contract = {
        id: contractId,
        clientId: client.id,
        totalAmount: contractData.totalAmount,
        installments: contractData.installments,
        installmentAmount,
        firstDueDate: contractData.firstDueDate,
        interestRate: contractData.interestRate,
        lateFeeRate: contractData.lateFeeRate,
        description: contractData.description,
        status: 'active',
        installmentsList,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`contract:${contractId}`, JSON.stringify(contract));
      
      // Add contract to client's contract list
      if (!client.contractIds) client.contractIds = [];
      client.contractIds.push(contractId);
      await kv.set(`client:${client.id}`, JSON.stringify(client));
      
      contracts.push(contract);
      
      console.log('[SEED] Created contract for client:', client.fullName);
    }

    await logAudit({
      userId: user.id,
      action: 'SEED_DATA_CREATED',
      resource: 'system',
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { clientsCount: clients.length, contractsCount: contracts.length }
    });

    return c.json({ 
      success: true, 
      message: 'Seed data created successfully',
      summary: {
        clients: clients.length,
        contracts: contracts.length
      },
      data: {
        clients: clients.map(c => ({ id: c.id, name: c.fullName })),
        contracts: contracts.map(c => ({ id: c.id, clientName: clients.find(cl => cl.id === c.clientId)?.fullName, totalAmount: c.totalAmount }))
      }
    });
  } catch (error) {
    console.error('[SEED] Error:', error);
    return c.json({ error: 'Error creating seed data', details: String(error) }, 500);
  }
});

// ============================================
// USER MANAGEMENT ENDPOINTS (ADMIN ONLY)
// ============================================

// Get all users (admin only)
app.get("/make-server-bd42bc02/users", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    // Only admins can list users
    if (user.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    console.log('[USERS] Fetching all users...');

    // Get all users from Supabase Auth using Service Role Key
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('[USERS] Error fetching users:', authError);
      return c.json({ error: 'Error fetching users' }, 500);
    }

    // Enrich with profile data from KV
    const users = await Promise.all(
      authData.users.map(async (authUser) => {
        const profileData = await kv.get(`user_profile:${authUser.id}`);
        let profile = null;
        
        if (profileData) {
          profile = JSON.parse(profileData);
        }

        return {
          id: authUser.id,
          email: authUser.email,
          name: profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0],
          role: profile?.role || authUser.user_metadata?.role || 'operator',
          createdAt: authUser.created_at,
          lastLogin: authUser.last_sign_in_at,
        };
      })
    );

    console.log('[USERS] Found', users.length, 'users');

    return c.json({ users });
  } catch (error) {
    console.error('[USERS] Error:', error);
    return c.json({ error: 'Error fetching users' }, 500);
  }
});

// Create user (admin only)
app.post("/make-server-bd42bc02/users", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    // Only admins can create users
    if (user.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { email, password, name, role = 'operator' } = body;

    console.log('[CREATE_USER] Request received:', { email, role });

    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields: email, password, name' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (userExists) {
      return c.json({ error: 'Este e-mail já está cadastrado no sistema.' }, 409);
    }

    // Create user using Service Role Key
    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      user_metadata: { name, role },
      email_confirm: true // Auto-confirm email
    });

    if (createError) {
      console.error('[CREATE_USER] Error creating user:', createError);
      return c.json({ error: createError.message }, 400);
    }

    // Create user profile in KV
    const profile = {
      id: data.user.id,
      email: email.toLowerCase(),
      name,
      role,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user_profile:${data.user.id}`, JSON.stringify(profile));

    // If role is 'client', create a client record automatically
    if (role === 'client') {
      const clientId = generateId('client');
      const client = {
        id: clientId,
        authUserId: data.user.id,
        fullName: name,
        cpfCnpj: '',
        rg: '',
        birthDate: '',
        phone: '',
        whatsapp: '',
        email: email.toLowerCase(),
        address: '',
        occupation: '',
        company: '',
        monthlyIncome: 0,
        status: 'active',
        lgpdConsent: true,
        lgpdConsentDate: new Date().toISOString(),
        documents: { front: null, back: null, selfie: null, video: null },
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`client:${clientId}`, JSON.stringify(client));
      await kv.set(`client_auth:${data.user.id}`, clientId);
      
      console.log('[CREATE_USER] Created client record:', clientId);
    }

    await logAudit({
      userId: user.id,
      action: 'USER_CREATED_BY_ADMIN',
      resource: `user:${data.user.id}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { createdEmail: email, createdRole: role }
    });

    console.log('[CREATE_USER] User created successfully:', data.user.id);

    return c.json({ 
      success: true,
      user: {
        id: data.user.id,
        email: email.toLowerCase(),
        name,
        role,
      }
    });
  } catch (error) {
    console.error('[CREATE_USER] Error:', error);
    return c.json({ error: 'Error creating user' }, 500);
  }
});

// Delete user (admin only)
app.delete("/make-server-bd42bc02/users/:userId", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userId = c.req.param('userId');
    
    // Only admins can delete users
    if (user.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    // Prevent self-deletion
    if (user.id === userId) {
      return c.json({ error: 'Você não pode excluir sua própria conta' }, 400);
    }

    console.log('[DELETE_USER] Deleting user:', userId);

    // Get user profile to check role
    const profileData = await kv.get(`user_profile:${userId}`);
    let userRole = 'operator';
    
    if (profileData) {
      const profile = JSON.parse(profileData);
      userRole = profile.role;
    }

    // If user is a client, handle client data
    if (userRole === 'client') {
      const clientId = await kv.get(`client_auth:${userId}`);
      
      if (clientId) {
        const clientData = await kv.get(`client:${clientId}`);
        
        if (clientData) {
          const client = JSON.parse(clientData);
          
          // Mark as deleted (soft delete)
          client.status = 'deleted';
          client.deletedAt = new Date().toISOString();
          client.deletedBy = user.id;
          
          // Anonymize for LGPD
          const originalCpf = client.cpfCnpj;
          client.fullName = '[EXCLUÍDO]';
          client.cpfCnpj = '[EXCLUÍDO]';
          client.rg = '[EXCLUÍDO]';
          client.phone = '[EXCLUÍDO]';
          client.whatsapp = '[EXCLUÍDO]';
          client.email = '[EXCLUÍDO]';
          client.address = '[EXCLUÍDO]';
          client.occupation = '[EXCLUÍDO]';
          client.company = '[EXCLUÍDO]';
          client.monthlyIncome = 0;
          
          await kv.set(`client:${clientId}`, JSON.stringify(client));
          
          // Delete CPF index
          if (originalCpf && originalCpf !== '[EXCLUÍDO]') {
            await kv.del(`client_cpf:${originalCpf}`);
          }
          
          // Delete client_auth mapping
          await kv.del(`client_auth:${userId}`);
        }
      }
    }

    // Delete user profile from KV
    await kv.del(`user_profile:${userId}`);

    // Delete from Supabase Auth using Service Role Key
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error('[DELETE_USER] Error deleting from auth:', deleteError);
      return c.json({ error: 'Error deleting user' }, 500);
    }

    await logAudit({
      userId: user.id,
      action: 'USER_DELETED',
      resource: `user:${userId}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { deletedUserId: userId, userRole }
    });

    console.log('[DELETE_USER] User deleted successfully');

    return c.json({ success: true, message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('[DELETE_USER] Error:', error);
    return c.json({ error: 'Error deleting user' }, 500);
  }
});

// Reset user password (admin only)
app.post("/make-server-bd42bc02/users/:userId/reset-password", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userId = c.req.param('userId');
    
    // Only admins can reset passwords
    if (user.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    console.log('[RESET_PASSWORD] Resetting password for user:', userId);

    // Generate a secure temporary password
    const newPassword = `Temp${Math.random().toString(36).slice(-8)}${Math.random().toString(36).slice(-8).toUpperCase()}!`;

    // Update password in Supabase Auth using Service Role Key
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );
    
    if (updateError) {
      console.error('[RESET_PASSWORD] Error updating password:', updateError);
      return c.json({ error: 'Error resetting password' }, 500);
    }

    await logAudit({
      userId: user.id,
      action: 'PASSWORD_RESET_BY_ADMIN',
      resource: `user:${userId}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { resetUserId: userId }
    });

    console.log('[RESET_PASSWORD] Password reset successfully');

    return c.json({ 
      success: true, 
      message: 'Senha resetada com sucesso',
      newPassword 
    });
  } catch (error) {
    console.error('[RESET_PASSWORD] Error:', error);
    return c.json({ error: 'Error resetting password' }, 500);
  }
});

// Add client portal routes
addClientPortalRoutes(app, supabaseAdmin, kv, logAudit, generateId);

// Add billing/automatic charging routes
addBillingRoutes(app, authenticateUser);

// ============================================
// PUBLIC ENDPOINTS (NO AUTH)
// ============================================

// Ultra-simple ping endpoint
app.get("/make-server-bd42bc02/ping", (c) => {
  return c.text("pong");
});

// Health check endpoint
app.get("/make-server-bd42bc02/health", (c) => {
  console.log('[HEALTH] Health check called');
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Diagnostic endpoint
app.get("/make-server-bd42bc02/diagnostic/data", async (c) => {
  try {
    console.log('[DIAGNOSTIC] Starting data diagnostic...');
    
    const contractsRaw = await kv.getByPrefix('contract:');
    const contracts = contractsRaw.map((c: any) => typeof c === 'string' ? JSON.parse(c) : c);
    
    const clientsRaw = await kv.getByPrefix('client:');
    const clients = clientsRaw.map((c: any) => typeof c === 'string' ? JSON.parse(c) : c);
    
    const contractsWithClients = [];
    for (const contract of contracts) {
      if (contract.clientId) {
        const client = clients.find((cl: any) => cl.id === contract.clientId);
        contractsWithClients.push({
          contractId: contract.id,
          contractNumber: contract.contractNumber,
          clientId: contract.clientId,
          clientFound: !!client,
          clientName: client?.fullName || 'N/A',
          clientWhatsapp: client?.whatsapp || 'N/A',
          status: contract.status
        });
      }
    }
    
    return c.json({
      summary: {
        totalContracts: contracts.length,
        totalClients: clients.length,
        activeContracts: contracts.filter((c: any) => c.status === 'active').length
      },
      contracts: contractsWithClients,
      clients: clients.map((c: any) => ({ id: c.id, fullName: c.fullName, whatsapp: c.whatsapp }))
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// CREATE TEST CLIENT USER (for development)
// ============================================
app.post("/make-server-bd42bc02/create-test-client", async (c) => {
  try {
    console.log('[CREATE_TEST_CLIENT] Creating test client user...');

    // Create auth user with role 'client'
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'cliente@teste.com',
      password: 'Cliente@123',
      user_metadata: { 
        name: 'Cliente Teste',
        role: 'client' 
      },
      email_confirm: true
    });

    if (authError) {
      console.error('[CREATE_TEST_CLIENT] Error creating auth user:', authError);
      return c.json({ error: authError.message }, 400);
    }

    const userId = authData.user.id;

    // Create user profile with role 'client'
    const userProfile = {
      id: userId,
      email: 'cliente@teste.com',
      name: 'Cliente Teste',
      role: 'client',
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user_profile:${userId}`, JSON.stringify(userProfile));

    // Create client record
    const clientId = generateId('client');
    const client = {
      id: clientId,
      authUserId: userId,
      fullName: 'Cliente Teste da Silva',
      cpfCnpj: '123.456.789-00',
      rg: '12.345.678-9',
      birthDate: '1990-01-15',
      phone: '(11) 98765-4321',
      whatsapp: '(11) 98765-4321',
      email: 'cliente@teste.com',
      address: 'Rua de Teste, 123 - São Paulo - SP',
      occupation: 'Desenvolvedor',
      company: 'Empresa Teste Ltda',
      monthlyIncome: 8000,
      status: 'active',
      lgpdConsent: true,
      lgpdConsentDate: new Date().toISOString(),
      documents: { front: null, back: null, selfie: null, video: null },
      createdAt: new Date().toISOString(),
      createdBy: userId,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`client:${clientId}`, JSON.stringify(client));
    await kv.set(`client_cpf:${client.cpfCnpj}`, clientId);
    await kv.set(`client_auth:${userId}`, clientId);

    // Create a test contract
    const contractId = generateId('contract');
    const contractNumber = `CONT-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const contract = {
      id: contractId,
      contractNumber,
      clientId,
      clientName: client.fullName,
      productType: 'Serviço de Consultoria',
      totalValue: 12000,
      installments: 12,
      installmentValue: 1000,
      paymentDay: 10,
      startDate: '2026-02-01',
      endDate: '2027-01-01',
      status: 'active',
      interestRate: 2,
      lateFeeRate: 10,
      notes: 'Contrato de teste',
      createdAt: new Date().toISOString(),
      createdBy: userId,
      updatedAt: new Date().toISOString(),
      installmentList: [],
    };

    // Generate installments
    const startDate = new Date('2026-02-10');
    for (let i = 1; i <= 12; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + i - 1);
      dueDate.setHours(12, 0, 0, 0); // Set to noon to prevent timezone shifts
      const isPaid = i <= 3;
      contract.installmentList.push({
        number: i,
        dueDate: dueDate.toISOString().split('T')[0] + 'T12:00:00',
        value: 1000,
        status: isPaid ? 'paid' : 'pending',
        paidAt: isPaid ? new Date(dueDate.getTime() - 86400000).toISOString() : undefined,
      });
    }

    await kv.set(`contract:${contractId}`, JSON.stringify(contract));
    client.contractIds = [contractId];
    await kv.set(`client:${clientId}`, JSON.stringify(client));

    await logAudit({
      userId,
      action: 'CREATE_TEST_CLIENT',
      resource: `client:${clientId}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { email: 'cliente@teste.com', clientId, contractId }
    });

    return c.json({ 
      success: true, 
      credentials: { email: 'cliente@teste.com', password: 'Cliente@123' },
      clientId,
      contractId,
    });
  } catch (error) {
    console.error('[CREATE_TEST_CLIENT] Error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// CREATE ADMIN USER (for development)
app.post("/make-server-bd42bc02/create-admin", async (c) => {
  try {
    const defaultEmail = 'admin@empresa.com';
    const defaultPassword = 'Admin@123456';

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === defaultEmail);

    if (existingAdmin) {
      await supabaseAdmin.auth.admin.deleteUser(existingAdmin.id);
      await kv.del(`user_profile:${existingAdmin.id}`);
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: defaultEmail,
      password: defaultPassword,
      user_metadata: { name: 'Administrador', role: 'admin' },
      email_confirm: true
    });

    if (authError) {
      return c.json({ error: authError.message }, 400);
    }

    await kv.set(`user_profile:${authData.user.id}`, JSON.stringify({
      id: authData.user.id,
      email: defaultEmail,
      name: 'Administrador',
      role: 'admin',
      createdAt: new Date().toISOString(),
    }));

    return c.json({ 
      success: true,
      credentials: { email: defaultEmail, password: defaultPassword }
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// FIX USER PROFILES (diagnostic and repair endpoint)
app.post("/make-server-bd42bc02/fix-user-profiles", async (c) => {
  try {
    console.log('[FIX_PROFILES] Checking and fixing user profiles...');
    
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
    const fixes = [];
    
    for (const authUser of allUsers.users) {
      const userId = authUser.id;
      const profileKey = await kv.get(`user_profile:${userId}`);
      
      if (!profileKey) {
        // Create missing profile
        const profile = {
          id: userId,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: authUser.user_metadata?.role || 'operator',
          createdAt: authUser.created_at || new Date().toISOString(),
        };
        
        await kv.set(`user_profile:${userId}`, JSON.stringify(profile));
        fixes.push({
          userId,
          email: authUser.email,
          action: 'created_profile',
          role: profile.role
        });
        
        // If client role, create client record too
        if (profile.role === 'client') {
          const clientAuthKey = await kv.get(`client_auth:${userId}`);
          if (!clientAuthKey) {
            const clientId = generateId('client');
            const client = {
              id: clientId,
              authUserId: userId,
              fullName: profile.name,
              cpfCnpj: '',
              rg: '',
              birthDate: '',
              phone: '',
              whatsapp: '',
              email: profile.email,
              address: '',
              occupation: '',
              company: '',
              monthlyIncome: 0,
              status: 'active',
              lgpdConsent: true,
              lgpdConsentDate: new Date().toISOString(),
              documents: { front: null, back: null, selfie: null, video: null },
              createdAt: new Date().toISOString(),
              createdBy: userId,
              updatedAt: new Date().toISOString(),
            };
            
            await kv.set(`client:${clientId}`, JSON.stringify(client));
            await kv.set(`client_auth:${userId}`, clientId);
            fixes.push({
              userId,
              email: authUser.email,
              action: 'created_client_record',
              clientId
            });
          }
        }
      }
    }
    
    return c.json({
      success: true,
      message: `Checked ${allUsers.users.length} users, fixed ${fixes.length} profiles`,
      fixes
    });
  } catch (error) {
    console.error('[FIX_PROFILES] Error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ============================================
// FINANCIAL MANAGEMENT ROUTES
// ============================================

// Get all transactions with summary
app.get("/make-server-bd42bc02/financial", requireAuth, async (c) => {
  try {
    const period = c.req.query('period') || 'current-month';
    
    // Get all transactions
    const allTransactionsData = await kv.getByPrefix('transaction:');
    const transactions = allTransactionsData.map((data: string) => JSON.parse(data));
    
    // Filter by period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'current-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // All time
    }
    
    const filteredTransactions = transactions.filter((t: any) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate;
    });
    
    // Calculate summary
    const summary = filteredTransactions.reduce((acc: any, t: any) => {
      if (t.status === 'paid') {
        if (t.type === 'income') {
          acc.totalIncome += t.amount;
        } else {
          acc.totalExpense += t.amount;
        }
      } else if (t.status === 'pending') {
        if (t.type === 'income') {
          acc.pendingIncome += t.amount;
        } else {
          acc.pendingExpense += t.amount;
        }
      }
      return acc;
    }, {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      pendingIncome: 0,
      pendingExpense: 0,
    });
    
    summary.balance = summary.totalIncome - summary.totalExpense;
    
    // Sort by date (newest first)
    filteredTransactions.sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    return c.json({
      transactions: filteredTransactions,
      summary,
    });
  } catch (error) {
    console.error('[FINANCIAL_LIST] Error:', error);
    return c.json({ error: 'Error fetching financial data' }, 500);
  }
});

// Create transaction
app.post("/make-server-bd42bc02/financial/transactions", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const {
      type,
      category,
      description,
      amount,
      date,
      paymentMethod,
      status,
      clientId,
      contractId,
      notes,
    } = body;
    
    if (!type || !category || !description || !amount || !date || !paymentMethod || !status) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Validate type
    if (type !== 'income' && type !== 'expense') {
      return c.json({ error: 'Invalid transaction type' }, 400);
    }
    
    const transactionId = generateId('transaction');
    
    const transaction = {
      id: transactionId,
      type,
      category,
      description,
      amount: parseFloat(amount),
      date,
      paymentMethod,
      status,
      clientId: clientId || null,
      contractId: contractId || null,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      updatedAt: new Date().toISOString(),
    };
    
    // If clientId is provided, add client name
    if (clientId) {
      const clientData = await kv.get(`client:${clientId}`);
      if (clientData) {
        const client = JSON.parse(clientData);
        transaction.clientName = client.fullName;
      }
    }
    
    await kv.set(`transaction:${transactionId}`, JSON.stringify(transaction));
    
    // Audit log
    await logAudit({
      userId: user.id,
      action: 'TRANSACTION_CREATED',
      resource: `transaction:${transactionId}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { 
        type,
        category,
        description,
        amount: parseFloat(amount)
      }
    });
    
    return c.json({ transaction });
  } catch (error) {
    console.error('[TRANSACTION_CREATE] Error:', error);
    return c.json({ error: 'Error creating transaction' }, 500);
  }
});

// Get single transaction
app.get("/make-server-bd42bc02/financial/transactions/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const transactionData = await kv.get(`transaction:${id}`);
    
    if (!transactionData) {
      return c.json({ error: 'Transaction not found' }, 404);
    }
    
    const transaction = JSON.parse(transactionData);
    
    // Get client info if available
    if (transaction.clientId) {
      const clientData = await kv.get(`client:${transaction.clientId}`);
      if (clientData) {
        const client = JSON.parse(clientData);
        transaction.clientName = client.fullName;
      }
    }
    
    return c.json({ transaction });
  } catch (error) {
    console.error('[TRANSACTION_GET] Error:', error);
    return c.json({ error: 'Error fetching transaction' }, 500);
  }
});

// Update transaction
app.put("/make-server-bd42bc02/financial/transactions/:id", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const existingData = await kv.get(`transaction:${id}`);
    if (!existingData) {
      return c.json({ error: 'Transaction not found' }, 404);
    }
    
    const existing = JSON.parse(existingData);
    
    const transaction = {
      ...existing,
      ...body,
      id,
      amount: parseFloat(body.amount),
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };
    
    // Update client name if clientId changed
    if (transaction.clientId) {
      const clientData = await kv.get(`client:${transaction.clientId}`);
      if (clientData) {
        const client = JSON.parse(clientData);
        transaction.clientName = client.fullName;
      }
    } else {
      transaction.clientName = null;
    }
    
    await kv.set(`transaction:${id}`, JSON.stringify(transaction));
    
    // Audit log
    await logAudit({
      userId: user.id,
      action: 'TRANSACTION_UPDATED',
      resource: `transaction:${id}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { 
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        amount: transaction.amount
      }
    });
    
    return c.json({ transaction });
  } catch (error) {
    console.error('[TRANSACTION_UPDATE] Error:', error);
    return c.json({ error: 'Error updating transaction' }, 500);
  }
});

// Delete transaction
app.delete("/make-server-bd42bc02/financial/transactions/:id", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    
    const existingData = await kv.get(`transaction:${id}`);
    if (!existingData) {
      return c.json({ error: 'Transaction not found' }, 404);
    }
    
    const transaction = JSON.parse(existingData);
    
    await kv.del(`transaction:${id}`);
    
    // Audit log
    await logAudit({
      userId: user.id,
      action: 'TRANSACTION_DELETED',
      resource: `transaction:${id}`,
      ip: c.req.header('x-forwarded-for') || 'unknown',
      metadata: { 
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        amount: transaction.amount
      }
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[TRANSACTION_DELETE] Error:', error);
    return c.json({ error: 'Error deleting transaction' }, 500);
  }
});

// ============================================
// HEALTH CHECK ROUTES
// ============================================
addHealthRoutes(app);

// Add root health check
app.get('/make-server-bd42bc02', (c) => {
  return c.json({
    status: 'online',
    version: '2.1.1',
    service: 'EmprestFlow API',
    timestamp: new Date().toISOString(),
    message: 'Server is running successfully'
  });
});

Deno.serve(app.fetch);