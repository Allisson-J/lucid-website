/* ============================================
   CONFIGURAÇÕES - Sistema de Configurações e Perfil
   ============================================ */

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Sistema de Configurações inicializando...');
  
  // Verificar autenticação
  const authenticated = await requireAuth();
  if (!authenticated) return;

  // Carregar dados do usuário
  await loadUserData();

  // Configurar eventos
  setupEventListeners();

  // Carregar preferências salvas
  loadPreferences();
  
  // Inicializar tabs
  initTabs();
  
  console.log('✅ Sistema de Configurações carregado!');
});

// Inicializar tabs
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-panel');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // Remover active de todas as tabs
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Ativar tab clicada
      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${targetTab}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

// Configurar event listeners
function setupEventListeners() {
  // Formulários
  document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
  document.getElementById('passwordForm').addEventListener('submit', handlePasswordSubmit);
  document.getElementById('preferencesForm').addEventListener('submit', handlePreferencesSubmit);
  
  // Botões
  document.getElementById('btnClearLocalData').addEventListener('click', handleClearLocalData);
  document.getElementById('btnExportData').addEventListener('click', handleExportData);
  
  // Tema toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (confirm('Deseja realmente sair?')) {
      await logout();
    }
  });

  // Theme change listener
  document.getElementById('prefTheme').addEventListener('change', function() {
    applyTheme(this.value);
  });
}

// Toggle tema
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

function applyTheme(theme) {
  // Se for auto, detectar preferência do sistema
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }
  
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('lucid_theme', theme);
  updateThemeIcon(theme);
  updateThemeSelect(theme);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

function updateThemeSelect(theme) {
  const select = document.getElementById('prefTheme');
  if (select) {
    select.value = localStorage.getItem('lucid_theme_preference') || theme;
  }
}

// Inicializar tema
function initTheme() {
  const savedPreference = localStorage.getItem('lucid_theme_preference') || 'dark';
  applyTheme(savedPreference);
}

initTheme();

// Carregar dados do usuário
async function loadUserData() {
  try {
    const user = await getCurrentUser();
    if (user) {
      // Preencher informações do perfil
      const nameInput = document.getElementById('profileName');
      const emailInput = document.getElementById('profileEmail');
      const accountEmail = document.getElementById('accountEmail');
      const accountProvider = document.getElementById('accountProvider');
      const accountCreatedAt = document.getElementById('accountCreatedAt');
      const userInfo = document.getElementById('userInfo');
      
      if (nameInput) {
        nameInput.value = user.name || user.email?.split('@')[0] || '';
      }
      
      if (emailInput) {
        emailInput.value = user.email || '';
      }
      
      if (accountEmail) {
        accountEmail.textContent = user.email || '-';
      }
      
      if (accountProvider) {
        accountProvider.textContent = user.provider === 'supabase' ? 'Supabase Auth' : 'LocalStorage';
      }
      
      if (accountCreatedAt) {
        // Tentar obter data de criação (se disponível)
        const createdAt = user.created_at || user.createdAt;
        if (createdAt) {
          accountCreatedAt.textContent = new Date(createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          });
        } else {
          accountCreatedAt.textContent = 'Não disponível';
        }
      }
      
      if (userInfo) {
        userInfo.textContent = user.email || 'Usuário';
      }
    }
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
    showToast('Erro ao carregar dados do usuário.', 'error');
  }
}

// Carregar preferências salvas
function loadPreferences() {
  // Tema
  const themePreference = localStorage.getItem('lucid_theme_preference') || 'dark';
  const themeSelect = document.getElementById('prefTheme');
  if (themeSelect) {
    themeSelect.value = themePreference;
  }
  
  // Idioma
  const language = localStorage.getItem('lucid_language') || 'pt-BR';
  const languageSelect = document.getElementById('prefLanguage');
  if (languageSelect) {
    languageSelect.value = language;
  }
  
  // Notificações
  const notifications = localStorage.getItem('lucid_notifications') !== 'false';
  const notificationsCheck = document.getElementById('prefNotifications');
  if (notificationsCheck) {
    notificationsCheck.checked = notifications;
  }
  
  // Relatório semanal
  const weeklyReport = localStorage.getItem('lucid_weekly_report') === 'true';
  const weeklyReportCheck = document.getElementById('prefWeeklyReport');
  if (weeklyReportCheck) {
    weeklyReportCheck.checked = weeklyReport;
  }
}

// Handle profile submit
async function handleProfileSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const name = formData.get('name').trim();
  
  if (!name) {
    showToast('Por favor, preencha o nome.', 'error');
    return;
  }
  
  try {
    // Salvar no localStorage (atualizar auth data)
    const authData = localStorage.getItem('lucid_auth');
    if (authData) {
      const user = JSON.parse(authData);
      user.name = name;
      localStorage.setItem('lucid_auth', JSON.stringify(user));
    }
    
    // Se usar Supabase, atualizar perfil lá também
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { error } = await supabase.auth.updateUser({
            data: { name: name }
          });
          
          if (error) throw error;
        } catch (error) {
          console.error('Erro ao atualizar perfil no Supabase:', error);
          // Continuar mesmo se falhar no Supabase
        }
      }
    }
    
    showToast('Perfil atualizado com sucesso!', 'success');
    
    // Atualizar userInfo no header
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
      userInfo.textContent = name;
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    showToast('Erro ao atualizar perfil.', 'error');
  }
}

// Handle password submit
async function handlePasswordSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');
  
  // Validações
  if (newPassword.length < 6) {
    showToast('A nova senha deve ter no mínimo 6 caracteres.', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showToast('As senhas não coincidem.', 'error');
    return;
  }
  
  try {
    // Se usar Supabase, atualizar senha lá
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { error } = await supabase.auth.updateUser({
            password: newPassword
          });
          
          if (error) throw error;
          
          showToast('Senha alterada com sucesso!', 'success');
          e.target.reset();
          return;
        } catch (error) {
          console.error('Erro ao alterar senha no Supabase:', error);
          showToast('Erro ao alterar senha. Verifique a senha atual.', 'error');
          return;
        }
      }
    }
    
    // Fallback: para localStorage, não podemos validar senha atual
    // Mas podemos mostrar mensagem informativa
    showToast('Para alterar a senha, é necessário usar Supabase Auth. Atualmente usando modo localStorage.', 'info');
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    showToast('Erro ao alterar senha.', 'error');
  }
}

// Handle preferences submit
async function handlePreferencesSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const theme = formData.get('theme');
  const language = formData.get('language');
  const notifications = formData.get('notifications') === 'on';
  const weeklyReport = formData.get('weeklyReport') === 'on';
  
  try {
    // Salvar preferências
    localStorage.setItem('lucid_theme_preference', theme);
    localStorage.setItem('lucid_language', language);
    localStorage.setItem('lucid_notifications', notifications);
    localStorage.setItem('lucid_weekly_report', weeklyReport);
    
    // Aplicar tema
    applyTheme(theme);
    
    showToast('Preferências salvas com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao salvar preferências:', error);
    showToast('Erro ao salvar preferências.', 'error');
  }
}

// Handle clear local data
function handleClearLocalData() {
  if (!confirm('Deseja realmente limpar todos os dados locais? Isso não afeta os dados no servidor, mas você precisará fazer login novamente.')) {
    return;
  }
  
  if (!confirm('Tem certeza? Esta ação é irreversível para os dados locais.')) {
    return;
  }
  
  try {
    // Limpar localStorage (exceto algumas chaves importantes)
    const keysToKeep = ['lucid_theme', 'lucid_theme_preference']; // Manter preferências de tema
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('lucid_') && !keysToKeep.includes(key)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    showToast('Dados locais limpos com sucesso! Redirecionando...', 'success');
    
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    showToast('Erro ao limpar dados.', 'error');
  }
}

// Handle export data
function handleExportData() {
  try {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      user: null,
      preferences: {
        theme: localStorage.getItem('lucid_theme'),
        themePreference: localStorage.getItem('lucid_theme_preference'),
        language: localStorage.getItem('lucid_language'),
        notifications: localStorage.getItem('lucid_notifications'),
        weeklyReport: localStorage.getItem('lucid_weekly_report')
      },
      localStorage: {}
    };
    
    // Coletar dados do localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('lucid_')) {
        try {
          dataToExport.localStorage[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          dataToExport.localStorage[key] = localStorage.getItem(key);
        }
      }
    }
    
    // Criar e baixar arquivo JSON
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lucid-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Dados exportados com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    showToast('Erro ao exportar dados.', 'error');
  }
}

// Show toast
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    </div>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

