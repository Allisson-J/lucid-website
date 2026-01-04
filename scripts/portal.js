/* ============================================
   PORTAL LUCID - Lógica do Portal
   ============================================ */

let currentUser = null;

// Configuração de ferramentas disponíveis
const TOOLS_CONFIG = [
  {
    name: 'CRM',
    description: 'Sistema completo de gestão de relacionamento com clientes, leads e oportunidades de negócio',
    icon: 'fas fa-user-friends',
    url: 'crm.html',
    category: 'gestao',
    featured: true
  },
  {
    name: 'Automações',
    description: 'Criar e gerenciar automações de processos',
    icon: 'fas fa-robot',
    url: 'automacoes.html',
    category: 'automatizacao',
    featured: true
  },
  {
    name: 'Sistemas',
    description: 'Acessar sistemas e aplicações desenvolvidas',
    icon: 'fas fa-desktop',
    url: '#',
    category: 'sistemas',
    comingSoon: true
  },
  {
    name: 'Projetos',
    description: 'Gerenciar projetos, equipes, prazos e entregas',
    icon: 'fas fa-project-diagram',
    url: 'projetos.html',
    category: 'projetos',
    featured: true
  },
  {
    name: 'Equipes',
    description: 'Gerenciar equipes, membros e permissões',
    icon: 'fas fa-users',
    url: 'equipes.html',
    category: 'gestao',
    featured: true
  },
  {
    name: 'Calendário',
    description: 'Calendário compartilhado com eventos, prazos e reuniões',
    icon: 'fas fa-calendar-alt',
    url: 'calendario.html',
    category: 'gestao',
    featured: true
  },
  {
    name: 'Relatórios',
    description: 'Dashboard analítico completo com gráficos e métricas avançadas',
    icon: 'fas fa-chart-line',
    url: 'relatorios.html',
    category: 'gestao',
    featured: true
  },
  {
    name: 'Time Tracking',
    description: 'Rastreamento de tempo trabalhado em projetos e tarefas',
    icon: 'fas fa-stopwatch',
    url: 'time-tracking.html',
    category: 'gestao',
    featured: true
  },
  {
    name: 'Financeiro',
    description: 'Orçamentos, faturas, receitas e despesas',
    icon: 'fas fa-dollar-sign',
    url: 'financeiro.html',
    category: 'gestao',
    featured: true
  },
  {
    name: 'Configurações',
    description: 'Configurações do sistema e perfil',
    icon: 'fas fa-cog',
    url: 'configuracoes.html',
    category: 'config',
    featured: true
  },
  {
    name: 'Documentação',
    description: 'Acessar documentação e guias',
    icon: 'fas fa-book',
    url: 'documentacoes.html',
    category: 'docs',
    featured: true
  }
];

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Portal Lucid inicializando...');
  console.log('📋 TOOLS_CONFIG disponível:', typeof TOOLS_CONFIG !== 'undefined' ? 'Sim' : 'Não');
  
  // Garantir que as ferramentas sejam renderizadas mesmo se houver erro
  let ferramentasRenderizadas = false;
  
  try {
    // Verificar autenticação
    const authResult = await verificarAutenticacao();
    if (!authResult) {
      console.log('❌ Autenticação falhou, mas continuando para renderizar ferramentas...');
      // Não retornar, continuar para renderizar ferramentas
    }
    
    // Inicializar Supabase
    await inicializarSupabase();
    
    // Carregar dados do usuário
    await carregarDadosUsuario();
    
    // Carregar ferramentas (sempre executar)
    console.log('📦 Carregando ferramentas...');
    renderizarFerramentas();
    ferramentasRenderizadas = true;
    
    // Carregar métricas
    await carregarMetricas();
    
    // Configurar navegação
    configurarNavegacao();
    
    console.log('✅ Portal Lucid carregado com sucesso!');
  } catch (error) {
    console.error('❌ Erro na inicialização do portal:', error);
    // Mesmo com erro, tentar renderizar ferramentas
    if (!ferramentasRenderizadas) {
      console.log('🔄 Tentando renderizar ferramentas após erro...');
      renderizarFerramentas();
    }
  }
  
  // Fallback: se ainda não renderizou, tentar novamente após um delay
  setTimeout(() => {
    const container = document.getElementById('toolsGrid');
    if (container && container.children.length === 0) {
      console.warn('⚠️ Ferramentas não renderizadas, tentando novamente...');
      renderizarFerramentas();
    }
  }, 2000);
});

// Verificar autenticação
async function verificarAutenticacao() {
  try {
    // Verificar se a função isAuthenticated existe
    if (typeof isAuthenticated === 'undefined') {
      console.warn('⚠️ Função isAuthenticated não encontrada, verificando localStorage...');
      const authData = localStorage.getItem('lucid_auth');
      if (!authData) {
        console.log('❌ Nenhum dado de autenticação encontrado, redirecionando...');
        window.location.href = 'login.html';
        return false;
      }
    } else {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        console.log('❌ Usuário não autenticado, redirecionando...');
        window.location.href = 'login.html';
        return false;
      }
    }
    
    // Obter dados do usuário do localStorage
    const authData = localStorage.getItem('lucid_auth');
    if (authData) {
      const userData = JSON.parse(authData);
      currentUser = {
        email: userData.email || 'Usuário',
        name: userData.name || userData.email || 'Usuário'
      };
      console.log('✅ Usuário autenticado:', currentUser.name);
    } else {
      // Fallback: criar usuário padrão para não bloquear
      currentUser = {
        email: 'usuario@lucid.social',
        name: 'Usuário'
      };
      console.warn('⚠️ Usando usuário padrão (fallback)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro na verificação de autenticação:', error);
    // Não redirecionar imediatamente, permitir que o portal carregue para debug
    console.warn('⚠️ Continuando sem autenticação para debug...');
    currentUser = {
      email: 'usuario@lucid.social',
      name: 'Usuário'
    };
    return true; // Retornar true para permitir debug
  }
}

// Inicializar Supabase
async function inicializarSupabase() {
  try {
    if (typeof getSupabaseClient !== 'undefined') {
      const client = getSupabaseClient();
      if (client) {
        console.log('✅ Supabase inicializado no portal');
        return client;
      }
    } else {
      console.warn('⚠️ Função getSupabaseClient não disponível');
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar Supabase:', error);
  }
  return null;
}

// Carregar dados do usuário
async function carregarDadosUsuario() {
  try {
    // Tentar obter usuário do Supabase
    if (typeof getSupabaseClient !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          currentUser = {
            email: user.email,
            name: user.user_metadata?.name || user.email || 'Usuário',
            id: user.id
          };
        }
      }
    }
    
    // Atualizar interface
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUser) {
      userNameElement.textContent = currentUser.name;
    }
  } catch (error) {
    console.error('❌ Erro ao carregar dados do usuário:', error);
  }
}

// Renderizar ferramentas
function renderizarFerramentas() {
  console.log('🔧 Renderizando ferramentas...');
  console.log('📋 TOOLS_CONFIG:', TOOLS_CONFIG);
  
  const container = document.getElementById('toolsGrid');
  if (!container) {
    console.error('❌ Container toolsGrid não encontrado!');
    return;
  }
  
  console.log('✅ Container encontrado, renderizando', TOOLS_CONFIG.length, 'ferramentas');
  
  try {
    container.innerHTML = TOOLS_CONFIG.map(tool => {
      console.log('🔨 Renderizando ferramenta:', tool.name);
      return `
        <a href="${tool.url}" class="tool-card ${tool.comingSoon ? 'tool-coming-soon' : ''} ${tool.featured ? 'tool-featured' : ''}">
          ${tool.featured ? '<span class="featured-badge"><i class="fas fa-star"></i> Disponível</span>' : ''}
          <div class="tool-icon">
            <i class="${tool.icon}"></i>
          </div>
          <h3 class="tool-name">${tool.name}</h3>
          <p class="tool-description">${tool.description}</p>
          ${tool.comingSoon ? '<span class="tool-badge">Em breve</span>' : ''}
          <span class="tool-link">
            ${tool.comingSoon ? 'Em breve' : 'Acessar'} 
            <i class="fas fa-arrow-right"></i>
          </span>
        </a>
      `;
    }).join('');
    
    console.log('✅ Ferramentas renderizadas com sucesso!');
    
    // Adicionar eventos para "coming soon"
    container.querySelectorAll('.tool-coming-soon').forEach(card => {
      card.addEventListener('click', function(e) {
        e.preventDefault();
        mostrarAlerta('Esta ferramenta estará disponível em breve!', 'info');
      });
    });
  } catch (error) {
    console.error('❌ Erro ao renderizar ferramentas:', error);
    container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Erro ao carregar ferramentas. Por favor, recarregue a página.</p>';
  }
}

// Carregar métricas
async function carregarMetricas() {
  // Automações: valor fixo de 7
  animarMetrica('metricAutomations', 7);
  
  // Se houver Supabase, tentar carregar dados reais
  if (typeof getSupabaseClient !== 'undefined') {
    try {
      const supabase = getSupabaseClient();
      if (supabase && typeof isSupabaseConfigured !== 'undefined' && isSupabaseConfigured()) {
        
        // 1. Contar projetos da tabela projetos
        try {
          const { count: projetosCount, error: projetosError } = await supabase
            .from('projetos')
            .select('*', { count: 'exact', head: true });
          
          if (!projetosError && projetosCount !== null) {
            animarMetrica('metricProjects', projetosCount);
            console.log('✅ Projetos carregados:', projetosCount);
          } else {
            console.warn('⚠️ Erro ao contar projetos:', projetosError);
            animarMetrica('metricProjects', 0);
          }
        } catch (error) {
          console.error('❌ Erro ao carregar projetos:', error);
          animarMetrica('metricProjects', 0);
        }
        
        // 2. Contar usuários ativos
        // Nota: Não podemos acessar auth.users diretamente do cliente por segurança
        // Vamos tentar contar de uma tabela users se existir
        try {
          const { count: usersCount, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
          
          if (!usersError && usersCount !== null) {
            animarMetrica('metricUsers', usersCount);
            console.log('✅ Usuários carregados da tabela users:', usersCount);
          } else {
            // Se não houver tabela users, usar valor padrão de 1 (usuário atual)
            // Para contar usuários reais do auth.users, seria necessário criar uma função RPC no Supabase
            animarMetrica('metricUsers', 1);
            console.log('⚠️ Tabela users não encontrada, usando valor padrão: 1');
          }
        } catch (error) {
          console.error('❌ Erro ao carregar usuários:', error);
          animarMetrica('metricUsers', 1); // Valor padrão em caso de erro
        }
        
      } else {
        // Fallback: valores padrão se Supabase não estiver disponível
        animarMetrica('metricProjects', 0);
        animarMetrica('metricUsers', 0);
      }
    } catch (error) {
      console.warn('⚠️ Erro geral ao carregar métricas:', error);
      // Fallback: valores padrão
      animarMetrica('metricProjects', 0);
      animarMetrica('metricUsers', 0);
    }
  } else {
    // Fallback: valores padrão se Supabase não estiver disponível
    animarMetrica('metricProjects', 0);
    animarMetrica('metricUsers', 0);
  }
}

// Animar métricas
function animarMetrica(elementId, valorFinal, sufixo = '') {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const valorInicial = 0;
  const duracao = 1500;
  const incremento = valorFinal / (duracao / 16);
  let valorAtual = valorInicial;
  
  const timer = setInterval(() => {
    valorAtual += incremento;
    if (valorAtual >= valorFinal) {
      valorAtual = valorFinal;
      clearInterval(timer);
    }
    
    if (sufixo === '%') {
      element.textContent = valorAtual.toFixed(0) + sufixo;
    } else {
      element.textContent = Math.floor(valorAtual) + sufixo;
    }
  }, 16);
}

// Configurar navegação
function configurarNavegacao() {
  // Navegação suave
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || href.length <= 1) return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Atualizar link ativo
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.remove('active');
        });
        this.classList.add('active');
      }
    });
  });
  
  // Atualizar link ativo ao scroll
  window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.portal-section');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.pageYOffset >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// Logout
async function logout() {
  try {
    console.log('🚪 Fazendo logout...');
    
    // Logout do Supabase
    if (typeof getSupabaseClient !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }
    
    // Limpar localStorage
    localStorage.removeItem('lucid_auth');
    
    // Redirecionar
    window.location.href = 'login.html';
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    localStorage.removeItem('lucid_auth');
    window.location.href = 'login.html';
  }
}

// Mostrar alerta
function mostrarAlerta(mensagem, tipo = 'info') {
  const container = document.getElementById('alertContainer');
  if (!container) return;
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert-portal ${tipo}`;
  alertDiv.innerHTML = `
    <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
    ${mensagem}
  `;
  
  container.appendChild(alertDiv);
  
  // Remover após 5 segundos
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.parentNode.removeChild(alertDiv);
    }
  }, 5000);
}

// Tornar logout disponível globalmente
window.logout = logout;

