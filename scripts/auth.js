/* ============================================
   AUTENTICAÇÃO - Sistema de Login via Supabase
   ============================================ */

// Credenciais padrão para fallback (se Supabase Auth não estiver configurado)
// ⚠️ SEGURANÇA: Estas são credenciais de desenvolvimento. Em produção, configure o Supabase Auth
// e remova ou altere estas credenciais padrão. NUNCA exponha credenciais reais no código.
const DEFAULT_CREDENTIALS = {
  email: typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.defaultAdminEmail : 'admin@lucid.social',
  password: typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.defaultAdminPassword : 'admin123'
};

// Verificar se usuário está autenticado (Supabase ou fallback)
async function isAuthenticated() {
  // Tentar usar Supabase Auth primeiro
  if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Erro ao verificar sessão Supabase:', error);
          return checkLocalStorageAuth();
        }
        return !!session;
      } catch (e) {
        console.error('Erro ao verificar autenticação Supabase:', e);
        return checkLocalStorageAuth();
      }
    }
  }
  
  // Fallback: verificar localStorage
  return checkLocalStorageAuth();
}

// Verificar autenticação no localStorage (fallback)
function checkLocalStorageAuth() {
  const authData = localStorage.getItem('lucid_auth');
  if (!authData) return false;
  
  try {
    const auth = JSON.parse(authData);
    if (auth.expires && new Date(auth.expires) > new Date()) {
      return true;
    } else {
      localStorage.removeItem('lucid_auth');
      return false;
    }
  } catch (e) {
    return false;
  }
}

// Fazer login (Supabase Auth ou fallback)
async function login(email, password) {
  // Tentar usar Supabase Auth primeiro
  if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (error) {
          console.error('Erro no login Supabase:', error);
          // Se erro for "Invalid login credentials", tentar fallback
          if (error.message?.includes('Invalid login') || error.message?.includes('Email not confirmed')) {
            return loginFallback(email, password);
          }
          return { success: false, message: error.message || 'Erro ao fazer login.' };
        }

        if (data.session) {
          console.log('✅ Login realizado via Supabase Auth!');
          return { success: true, message: 'Login realizado com sucesso!', user: data.user };
        }
      } catch (e) {
        console.error('Erro ao fazer login Supabase:', e);
        return loginFallback(email, password);
      }
    }
  }
  
  // Fallback: usar credenciais padrão
  return loginFallback(email, password);
}

// Login fallback (localStorage)
function loginFallback(email, password) {
  if (email === DEFAULT_CREDENTIALS.email && password === DEFAULT_CREDENTIALS.password) {
    const authData = {
      email: email,
      loggedIn: true,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    localStorage.setItem('lucid_auth', JSON.stringify(authData));
    console.log('⚠️ Login realizado via fallback (localStorage)');
    return { success: true, message: 'Login realizado com sucesso!' };
  } else {
    return { success: false, message: 'Email ou senha incorretos.' };
  }
}

// Fazer logout
async function logout() {
  // Tentar logout do Supabase primeiro
  if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
        console.log('✅ Logout realizado via Supabase Auth');
      } catch (e) {
        console.error('Erro ao fazer logout Supabase:', e);
      }
    }
  }
  
  // Remover do localStorage também
  localStorage.removeItem('lucid_auth');
  window.location.href = 'login.html';
}

// Obter dados do usuário autenticado
async function getCurrentUser() {
  // Tentar obter do Supabase primeiro
  if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user) {
          return {
            id: user.id,
            email: user.email,
            loggedIn: true,
            provider: 'supabase'
          };
        }
      } catch (e) {
        console.error('Erro ao obter usuário Supabase:', e);
      }
    }
  }
  
  // Fallback: obter do localStorage
  const authData = localStorage.getItem('lucid_auth');
  if (!authData) return null;
  
  try {
    return JSON.parse(authData);
  } catch (e) {
    return null;
  }
}

// Proteger rotas (redirecionar se não autenticado)
async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

