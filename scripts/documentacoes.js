/* ============================================
   DOCUMENTAÇÕES - Script para página de documentação
   ============================================ */

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Página de Documentações carregando...');
  
  // Verificar autenticação
  const authenticated = await requireAuth();
  if (!authenticated) return;

  // Carregar dados do usuário
  await loadUserInfo();

  // Configurar eventos
  setupEventListeners();

  // Inicializar navegação suave
  initSmoothScroll();

  // Inicializar navegação ativa
  initActiveNavigation();
  
  console.log('✅ Página de Documentações carregada!');
});

// Carregar informações do usuário
async function loadUserInfo() {
  try {
    const user = await getCurrentUser();
    if (user) {
      const userInfoElement = document.getElementById('userInfo');
      if (userInfoElement) {
        userInfoElement.textContent = user.email || 'Usuário';
      }
    }
  } catch (error) {
    console.error('Erro ao carregar informações do usuário:', error);
  }
}

// Configurar event listeners
function setupEventListeners() {
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('Deseja realmente sair?')) {
        await logout();
      }
    });
  }
  
  // Tema
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Navegação do sidebar
  const navLinks = document.querySelectorAll('.doc-nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      
      // Atualizar links ativos
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      
      // Scroll suave
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// Toggle tema
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('lucid_theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

// Inicializar tema
function initTheme() {
  const savedTheme = localStorage.getItem('lucid_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

initTheme();

// Inicializar scroll suave
function initSmoothScroll() {
  // Adicionar smooth scroll para links internos
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

// Inicializar navegação ativa baseada no scroll
function initActiveNavigation() {
  const sections = document.querySelectorAll('.doc-section');
  const navLinks = document.querySelectorAll('.doc-nav-link');
  
  function updateActiveNav() {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }
  
  window.addEventListener('scroll', updateActiveNav);
  updateActiveNav(); // Chamar uma vez para definir o inicial
}

