/* ============================================
   PROJETOS - Gerenciamento de Projetos Lucid
   ============================================ */

let allProjects = [];
let currentView = 'grid';
let currentEditingId = null;
let currentTeamMembers = [];

// Status disponíveis
const STATUS_OPTIONS = {
  planejamento: 'Planejamento',
  em_andamento: 'Em Andamento',
  pausado: 'Pausado',
  concluido: 'Concluído',
  cancelado: 'Cancelado'
};

// Prioridades disponíveis
const PRIORITY_OPTIONS = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente'
};

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Sistema de Projetos inicializando...');
  
  // Verificar autenticação
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    window.location.href = 'login.html';
    return;
  }
  
  // Carregar dados do usuário
  await loadUserInfo();
  
  // Carregar projetos
  await loadProjects();
  
  // Configurar eventos
  setupEventListeners();
  
  // Renderizar projetos
  renderProjects();
  updateStats();
  
  console.log('✅ Sistema de Projetos carregado!');
});

// Carregar informações do usuário
async function loadUserInfo() {
  try {
    const authData = localStorage.getItem('lucid_auth');
    if (authData) {
      const userData = JSON.parse(authData);
      const userInfoElement = document.getElementById('userInfo');
      if (userInfoElement) {
        userInfoElement.textContent = userData.email || 'Usuário';
      }
    }
  } catch (error) {
    console.error('Erro ao carregar informações do usuário:', error);
  }
}

// Configurar event listeners
function setupEventListeners() {
  // Botão novo projeto
  document.getElementById('btnNovoProjeto').addEventListener('click', () => {
    openProjectModal();
  });
  
  // Botão criar plano Instagram
  const btnCreateInstagramPlan = document.getElementById('btnCreateInstagramPlan');
  if (btnCreateInstagramPlan) {
    btnCreateInstagramPlan.addEventListener('click', async () => {
      if (typeof createInstagramPlan === 'function') {
        await createInstagramPlan();
      } else {
        alert('Script de criação de plano não carregado. Recarregue a página.');
      }
    });
  }
  
  // Botões de visualização
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const view = this.getAttribute('data-view');
      switchView(view);
    });
  });
  
  // Filtros
  document.getElementById('filterStatus').addEventListener('change', () => {
    renderProjects();
  });
  
  document.getElementById('filterPrioridade').addEventListener('change', () => {
    renderProjects();
  });
  
  // Busca
  document.getElementById('searchInput').addEventListener('input', () => {
    renderProjects();
  });
  
  // Modal projeto
  document.getElementById('modalClose').addEventListener('click', closeProjectModal);
  document.getElementById('btnCancel').addEventListener('click', closeProjectModal);
  document.getElementById('projectForm').addEventListener('submit', handleProjectSubmit);
  
  // Modal membro
  document.getElementById('btnAddMember').addEventListener('click', () => {
    document.getElementById('memberModal').classList.add('active');
  });
  
  document.getElementById('memberModalClose').addEventListener('click', () => {
    document.getElementById('memberModal').classList.remove('active');
    document.getElementById('memberForm').reset();
  });
  
  document.getElementById('btnCancelMember').addEventListener('click', () => {
    document.getElementById('memberModal').classList.remove('active');
    document.getElementById('memberForm').reset();
  });
  
  document.getElementById('memberForm').addEventListener('submit', handleAddMember);
  
  // Fechar modal ao clicar fora
  document.getElementById('projectModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeProjectModal();
    }
  });
  
  document.getElementById('memberModal').addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.remove('active');
      document.getElementById('memberForm').reset();
    }
  });
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout();
  });
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarClose = document.getElementById('sidebarClose');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mainContent = document.getElementById('mainContent');
  
  // Função para atualizar margin do main baseado no estado da sidebar
  function updateMainMargin() {
    const projetosMain = document.querySelector('.projetos-main');
    if (!projetosMain || window.innerWidth < 1024) return;
    
    const isCollapsed = sidebar.classList.contains('collapsed');
    projetosMain.style.marginLeft = isCollapsed ? '70px' : '280px';
  }
  
  // Carregar estado do sidebar do localStorage
  const savedSidebarState = localStorage.getItem('projetos-sidebar-collapsed');
  if (sidebar && window.innerWidth >= 1024) {
    if (savedSidebarState === 'true') {
      sidebar.classList.add('collapsed');
    }
    updateMainMargin();
  }
  
  // Função para toggle do sidebar
  function toggleSidebar() {
    if (!sidebar) return;
    
    if (window.innerWidth < 1024) {
      // Mobile: comportamento de overlay
      const isActive = sidebar.classList.contains('active');
      if (isActive) {
        sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
      } else {
        sidebar.classList.add('active');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
      }
    } else {
      // Desktop: comportamento de colapsar/expandir
      const isCollapsed = sidebar.classList.contains('collapsed');
      if (isCollapsed) {
        sidebar.classList.remove('collapsed');
        localStorage.setItem('projetos-sidebar-collapsed', 'false');
      } else {
        sidebar.classList.add('collapsed');
        localStorage.setItem('projetos-sidebar-collapsed', 'true');
      }
      updateMainMargin();
    }
    updateSidebarToggleIcon();
  }
  
  // Função para atualizar ícone do botão
  function updateSidebarToggleIcon() {
    if (!sidebarToggle || !sidebar) return;
    const icon = sidebarToggle.querySelector('i');
    if (!icon) return;
    
    if (window.innerWidth >= 1024) {
      // Desktop: mostrar ícone de colapsar/expandir
      const isCollapsed = sidebar.classList.contains('collapsed');
      icon.className = isCollapsed ? 'fas fa-angle-right' : 'fas fa-angle-left';
    } else {
      // Mobile: mostrar ícone de menu
      const isActive = sidebar.classList.contains('active');
      icon.className = isActive ? 'fas fa-times' : 'fas fa-bars';
    }
  }
  
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleSidebar);
    updateSidebarToggleIcon(); // Atualizar ícone inicial
  }
  
  if (sidebarClose) {
    sidebarClose.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('active');
      if (sidebarOverlay) sidebarOverlay.classList.remove('active');
      updateSidebarToggleIcon();
    });
  }
  
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('active');
      if (sidebarOverlay) sidebarOverlay.classList.remove('active');
      updateSidebarToggleIcon();
    });
  }
  
  // Atualizar ícone quando a janela for redimensionada
  window.addEventListener('resize', () => {
    updateSidebarToggleIcon();
    // Em mobile, remover classe collapsed se existir
    if (window.innerWidth < 1024 && sidebar) {
      sidebar.classList.remove('collapsed');
      const projetosMain = document.querySelector('.projetos-main');
      if (projetosMain) projetosMain.style.marginLeft = '';
    } else {
      // Em desktop, restaurar estado salvo
      if (window.innerWidth >= 1024 && sidebar) {
        if (savedSidebarState === 'true') {
          sidebar.classList.add('collapsed');
        } else {
          sidebar.classList.remove('collapsed');
        }
        updateMainMargin();
      }
    }
  });
  
  // Sidebar items
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', function() {
      const view = this.getAttribute('data-view');
      switchView(view);
      
      // Atualizar sidebar items
      document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      
      // Fechar sidebar em mobile
      if (window.innerWidth < 1024) {
        if (sidebar) sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
      }
    });
  });
}

// Carregar projetos
async function loadProjects() {
  try {
    // Tentar carregar do Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('projetos')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            allProjects = data.map(project => ({
              ...project,
              membros: project.membros || [],
              data_inicio: project.data_inicio || null,
              data_fim: project.data_fim || null
            }));
            console.log('✅ Projetos carregados do Supabase:', allProjects.length);
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar do Supabase, usando localStorage:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem('lucid_projetos');
    if (stored) {
      allProjects = JSON.parse(stored);
      console.log('✅ Projetos carregados do localStorage:', allProjects.length);
    } else {
      allProjects = [];
    }
  } catch (error) {
    console.error('❌ Erro ao carregar projetos:', error);
    allProjects = [];
  }
}

// Salvar projetos
async function saveProjects() {
  try {
    // Tentar salvar no Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          // Sincronizar cada projeto com o Supabase
          for (const project of allProjects) {
            const { id, created_at, updated_at, ...projectData } = project;
            
            // Verificar se o projeto já existe no Supabase
            const { data: existing } = await supabase
              .from('projetos')
              .select('id')
              .eq('id', id)
              .single();
            
            if (existing) {
              // Atualizar projeto existente
              const { error } = await supabase
                .from('projetos')
                .update({
                  ...projectData,
                  updated_at: new Date().toISOString()
                })
                .eq('id', id);
              
              if (error) throw error;
            } else {
              // Inserir novo projeto
              const { error } = await supabase
                .from('projetos')
                .insert([{
                  id: id,
                  ...projectData
                }]);
              
              if (error) throw error;
            }
          }
          
          // Remover projetos que foram deletados (não estão mais em allProjects)
          const { data: allSupabaseProjects } = await supabase
            .from('projetos')
            .select('id');
          
          if (allSupabaseProjects) {
            const localIds = new Set(allProjects.map(p => p.id));
            const toDelete = allSupabaseProjects.filter(p => !localIds.has(p.id));
            
            for (const project of toDelete) {
              await supabase
                .from('projetos')
                .delete()
                .eq('id', project.id);
            }
          }
          
          console.log('✅ Projetos sincronizados com Supabase');
          return;
        } catch (error) {
          console.warn('⚠️ Erro ao salvar no Supabase, usando localStorage:', error);
          // Continuar para localStorage como fallback
        }
      }
    }
    
    // Fallback: localStorage
    localStorage.setItem('lucid_projetos', JSON.stringify(allProjects));
  } catch (error) {
    console.error('❌ Erro ao salvar projetos:', error);
  }
}

// Renderizar projetos
function renderProjects() {
  const container = document.getElementById('projectsContainer');
  const emptyState = document.getElementById('emptyState');
  
  if (!container) return;
  
  // Aplicar filtros
  const filteredProjects = getFilteredProjects();
  
  if (filteredProjects.length === 0) {
    container.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  container.style.display = 'block';
  emptyState.style.display = 'none';
  
  // Renderizar conforme a visualização atual
  if (currentView === 'kanban') {
    renderKanbanView(filteredProjects);
  } else if (currentView === 'list') {
    renderListView(filteredProjects);
  } else {
    renderGridView(filteredProjects);
  }
}

// Obter projetos filtrados
function getFilteredProjects() {
  const statusFilter = document.getElementById('filterStatus').value;
  const priorityFilter = document.getElementById('filterPrioridade').value;
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  return allProjects.filter(project => {
    // Filtro de status
    if (statusFilter !== 'all' && project.status !== statusFilter) {
      return false;
    }
    
    // Filtro de prioridade
    if (priorityFilter !== 'all' && project.prioridade !== priorityFilter) {
      return false;
    }
    
    // Busca
    if (searchTerm) {
      const searchFields = [
        project.nome,
        project.cliente || '',
        project.descricao || ''
      ].join(' ').toLowerCase();
      
      if (!searchFields.includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });
}

// Renderizar visualização em grid
function renderGridView(projects) {
  const container = document.getElementById('projectsContainer');
  container.className = 'projects-container grid-view';
  
  container.innerHTML = projects.map(project => createProjectCard(project)).join('');
  
  // Adicionar event listeners aos cards
  container.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', function() {
      const projectId = this.getAttribute('data-id');
      editProject(projectId);
    });
  });
  
  // Adicionar event listeners aos botões de ação
  container.querySelectorAll('.btn-tasks').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const projectId = this.getAttribute('data-id');
      if (typeof openTasksModal === 'function') {
        openTasksModal(projectId);
      }
    });
  });
  
  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const projectId = this.getAttribute('data-id');
      editProject(projectId);
    });
  });
  
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const projectId = this.getAttribute('data-id');
      deleteProject(projectId);
    });
  });
}

// Renderizar visualização em lista
function renderListView(projects) {
  const container = document.getElementById('projectsContainer');
  container.className = 'projects-container list-view';
  
  container.innerHTML = projects.map(project => createProjectCard(project, true)).join('');
  
  // Adicionar event listeners (mesmo código do grid)
  container.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', function() {
      const projectId = this.getAttribute('data-id');
      editProject(projectId);
    });
  });
  
  container.querySelectorAll('.btn-comments').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const projectId = this.getAttribute('data-id');
      if (typeof openProjectCommentsModal === 'function') {
        openProjectCommentsModal(projectId);
      }
    });
  });
  
  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const projectId = this.getAttribute('data-id');
      editProject(projectId);
    });
  });
  
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const projectId = this.getAttribute('data-id');
      deleteProject(projectId);
    });
  });
  
  container.querySelectorAll('.btn-complete').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const projectId = this.getAttribute('data-id');
      markProjectAsCompleted(projectId);
    });
  });
}

// Renderizar visualização kanban
function renderKanbanView(projects) {
  const container = document.getElementById('projectsContainer');
  container.className = 'projects-container kanban-view';
  
  const statuses = ['planejamento', 'em_andamento', 'pausado', 'concluido'];
  
  container.innerHTML = statuses.map(status => {
    const statusProjects = projects.filter(p => p.status === status);
    return `
      <div class="kanban-column">
        <div class="kanban-column-header">
          <span>${STATUS_OPTIONS[status]}</span>
          <span class="count">${statusProjects.length}</span>
        </div>
        <div class="kanban-column-content">
          ${statusProjects.map(project => createProjectCard(project, false, true)).join('')}
        </div>
      </div>
    `;
  }).join('');
  
  // Adicionar event listeners
  container.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', function() {
      const projectId = this.getAttribute('data-id');
      editProject(projectId);
    });
  });
  
  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const projectId = this.getAttribute('data-id');
      editProject(projectId);
    });
  });
  
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const projectId = this.getAttribute('data-id');
      deleteProject(projectId);
    });
  });
  
  container.querySelectorAll('.btn-complete').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const projectId = this.getAttribute('data-id');
      markProjectAsCompleted(projectId);
    });
  });
}

// Criar card de projeto
function createProjectCard(project, isList = false, isKanban = false) {
  const statusClass = project.status || 'planejamento';
  const priorityClass = project.prioridade || 'normal';
  const statusLabel = STATUS_OPTIONS[statusClass] || statusClass;
  const priorityLabel = PRIORITY_OPTIONS[priorityClass] || priorityClass;
  
  // Formatar datas
  const dataInicio = project.data_inicio ? formatDate(project.data_inicio) : null;
  const dataFim = project.data_fim ? formatDate(project.data_fim) : null;
  const isAtrasado = dataFim && new Date(project.data_fim) < new Date() && project.status !== 'concluido';
  
  // Membros
  const membros = project.membros || [];
  const membrosDisplay = membros.slice(0, 3);
  const membrosRestantes = membros.length - 3;
  
  const listClass = isList ? 'list-item' : '';
  const kanbanClass = isKanban ? 'kanban-item' : '';
  const completedClass = statusClass === 'concluido' ? 'project-completed' : '';
  const lateClass = isAtrasado ? 'project-late' : '';
  
  return `
    <div class="project-card ${listClass} ${kanbanClass} ${completedClass} ${lateClass}" data-id="${project.id}">
      <div class="project-header">
        <div class="project-title-row">
          <h3 class="project-title">${escapeHtml(project.nome)}</h3>
          <div class="project-priority ${priorityClass}">${priorityLabel}</div>
        </div>
        <span class="project-status ${statusClass}">${statusLabel}</span>
        ${isAtrasado ? '<span class="project-status atrasado" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); margin-left: 8px;">Atrasado</span>' : ''}
      </div>
      
      ${project.descricao ? `<p class="project-description">${escapeHtml(project.descricao)}</p>` : ''}
      
      <div class="project-meta">
        ${project.cliente ? `
          <div class="meta-item">
            <i class="fas fa-user"></i>
            <span>${escapeHtml(project.cliente)}</span>
          </div>
        ` : ''}
        ${dataInicio ? `
          <div class="meta-item">
            <i class="fas fa-calendar-alt"></i>
            <span>Início: ${dataInicio}</span>
          </div>
        ` : ''}
        ${dataFim ? `
          <div class="meta-item">
            <i class="fas fa-calendar-check"></i>
            <span>Término: ${dataFim}</span>
          </div>
        ` : ''}
        ${project.orcamento ? `
          <div class="meta-item">
            <i class="fas fa-dollar-sign"></i>
            <span>R$ ${parseFloat(project.orcamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        ` : ''}
      </div>
      
      ${membros.length > 0 ? `
        <div class="project-team">
          ${membrosDisplay.map((membro, index) => `
            <div class="team-avatar" title="${escapeHtml(membro.nome)}">
              ${membro.nome.charAt(0).toUpperCase()}
            </div>
          `).join('')}
          ${membrosRestantes > 0 ? `
            <div class="team-more" title="+${membrosRestantes} membros">
              +${membrosRestantes}
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      <div class="project-actions">
        <button class="btn-icon btn-comments" data-id="${project.id}" title="Comentários">
          <i class="fas fa-comments"></i>
        </button>
        <button class="btn-icon btn-tasks" data-id="${project.id}" title="Gerenciar Tarefas">
          <i class="fas fa-tasks"></i>
        </button>
        ${statusClass !== 'concluido' ? `
          <button class="btn-icon btn-complete" data-id="${project.id}" title="Marcar como Concluído">
            <i class="fas fa-check-circle"></i>
          </button>
        ` : ''}
        <button class="btn-icon btn-edit" data-id="${project.id}" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon delete btn-delete" data-id="${project.id}" title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
}

// Formatar data
function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

// Escapar HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Função global para acesso aos projetos (usada pelo chat-ia.js)
window.getAllProjects = function() {
  return allProjects || [];
};

// Alternar visualização
function switchView(view) {
  currentView = view;
  
  // Ocultar todos os containers (com verificação de existência)
  const projectsContainer = document.getElementById('projectsContainer');
  const ganttContainer = document.getElementById('ganttContainer');
  const calendarContainer = document.getElementById('calendarContainer');
  const timelineContainer = document.getElementById('timelineContainer');
  const emptyState = document.getElementById('emptyState');
  
  if (projectsContainer) projectsContainer.style.display = 'none';
  if (ganttContainer) ganttContainer.style.display = 'none';
  if (calendarContainer) calendarContainer.style.display = 'none';
  if (timelineContainer) timelineContainer.style.display = 'none';
  if (emptyState) emptyState.style.display = 'none';
  
  // Atualizar botões
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-view') === view) {
      btn.classList.add('active');
    }
  });
  
  // Mostrar visualização apropriada
  const filteredProjects = getFilteredProjects();
  
  if (view === 'gantt') {
    if (ganttContainer) {
      ganttContainer.style.display = 'block';
      renderGanttView(filteredProjects);
    }
  } else if (view === 'calendar') {
    if (calendarContainer) {
      calendarContainer.style.display = 'block';
      renderCalendarView(filteredProjects);
    }
  } else if (view === 'timeline') {
    if (timelineContainer) {
      timelineContainer.style.display = 'block';
      renderTimelineView(filteredProjects);
    }
  } else {
    // Grid, List ou Kanban
    if (projectsContainer) {
      projectsContainer.style.display = 'block';
      renderProjects();
    }
  }
}

// Abrir modal de projeto
function openProjectModal(projectId = null) {
  currentEditingId = projectId;
  const modal = document.getElementById('projectModal');
  const form = document.getElementById('projectForm');
  const title = document.getElementById('modalTitle');
  
  if (projectId) {
    // Editar projeto existente
    const project = allProjects.find(p => p.id === projectId);
    if (project) {
      title.textContent = 'Editar Projeto';
      form.projectId.value = project.id;
      form.projectNome.value = project.nome || '';
      form.projectStatus.value = project.status || 'planejamento';
      form.projectPrioridade.value = project.prioridade || 'normal';
      form.projectDataInicio.value = project.data_inicio || '';
      form.projectDataFim.value = project.data_fim || '';
      form.projectCliente.value = project.cliente || '';
      form.projectDescricao.value = project.descricao || '';
      form.projectOrcamento.value = project.orcamento || '';
      
      currentTeamMembers = project.membros || [];
      renderTeamMembers();
    }
  } else {
    // Novo projeto
    title.textContent = 'Novo Projeto';
    form.reset();
    form.projectId.value = '';
    currentTeamMembers = [];
    renderTeamMembers();
  }
  
  modal.classList.add('active');
}

// Fechar modal de projeto
function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  modal.classList.remove('active');
  document.getElementById('projectForm').reset();
  currentEditingId = null;
  currentTeamMembers = [];
}

// Editar projeto
function editProject(projectId) {
  openProjectModal(projectId);
}

// Renderizar membros da equipe
function renderTeamMembers() {
  const container = document.getElementById('teamMembersList');
  if (!container) return;
  
  container.innerHTML = currentTeamMembers.map((membro, index) => `
    <div class="member-item">
      <div class="member-info">
        <div class="member-avatar">${membro.nome.charAt(0).toUpperCase()}</div>
        <div class="member-details">
          <div class="member-name">${escapeHtml(membro.nome)}</div>
          ${membro.funcao ? `<div class="member-role">${escapeHtml(membro.funcao)}</div>` : ''}
        </div>
      </div>
      <button type="button" class="btn-remove-member" onclick="removeTeamMember(${index})" title="Remover">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');
}

// Adicionar membro à equipe
function handleAddMember(e) {
  e.preventDefault();
  
  const nome = document.getElementById('memberNome').value.trim();
  const email = document.getElementById('memberEmail').value.trim();
  const funcao = document.getElementById('memberFuncao').value.trim();
  
  if (!nome) {
    alert('Por favor, informe o nome do membro.');
    return;
  }
  
  currentTeamMembers.push({
    nome,
    email: email || null,
    funcao: funcao || null
  });
  
  renderTeamMembers();
  document.getElementById('memberForm').reset();
  document.getElementById('memberModal').classList.remove('active');
}

// Remover membro da equipe
function removeTeamMember(index) {
  currentTeamMembers.splice(index, 1);
  renderTeamMembers();
}

// Tornar função disponível globalmente
window.removeTeamMember = removeTeamMember;

// Submeter formulário de projeto
async function handleProjectSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const projectId = form.projectId.value;
  
  const projectData = {
    nome: form.projectNome.value.trim(),
    status: form.projectStatus.value,
    prioridade: form.projectPrioridade.value,
    data_inicio: form.projectDataInicio.value || null,
    data_fim: form.projectDataFim.value || null,
    cliente: form.projectCliente.value.trim() || null,
    descricao: form.projectDescricao.value.trim() || null,
    orcamento: form.projectOrcamento.value ? parseFloat(form.projectOrcamento.value) : null,
    membros: currentTeamMembers,
    updated_at: new Date().toISOString()
  };
  
  if (!projectData.nome) {
    alert('Por favor, informe o nome do projeto.');
    return;
  }
  
  try {
    // Tentar salvar diretamente no Supabase primeiro
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          if (projectId) {
            // Atualizar projeto existente no Supabase
            const { data, error } = await supabase
              .from('projetos')
              .update({
                ...projectData,
                updated_at: new Date().toISOString()
              })
              .eq('id', projectId)
              .select()
              .single();
            
            if (error) throw error;
            
            // Atualizar no array local
            const index = allProjects.findIndex(p => p.id === projectId);
            if (index !== -1) {
              allProjects[index] = data;
            }
          } else {
            // Criar novo projeto no Supabase
            const { data, error } = await supabase
              .from('projetos')
              .insert([projectData])
              .select()
              .single();
            
            if (error) throw error;
            
            // Adicionar ao array local
            allProjects.unshift(data);
          }
          
          // Sincronizar com localStorage também
          localStorage.setItem('lucid_projetos', JSON.stringify(allProjects));
          
          closeProjectModal();
          renderProjects();
          updateStats();
          
          console.log('✅ Projeto salvo no Supabase com sucesso!');
          return;
        } catch (error) {
          console.warn('⚠️ Erro ao salvar no Supabase, usando localStorage:', error);
          // Continuar para localStorage como fallback
        }
      }
    }
    
    // Fallback: localStorage
    if (projectId) {
      // Atualizar projeto existente
      const index = allProjects.findIndex(p => p.id === projectId);
      if (index !== -1) {
        allProjects[index] = {
          ...allProjects[index],
          ...projectData
        };
      }
    } else {
      // Criar novo projeto
      const newProject = {
        id: Date.now().toString(),
        ...projectData,
        created_at: new Date().toISOString()
      };
      allProjects.unshift(newProject);
    }
    
    await saveProjects();
    closeProjectModal();
    renderProjects();
    updateStats();
    
    console.log('✅ Projeto salvo com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao salvar projeto:', error);
    alert('Erro ao salvar projeto. Por favor, tente novamente.');
  }
}

// Marcar projeto como concluído
async function markProjectAsCompleted(projectId) {
  const project = allProjects.find(p => p.id === projectId);
  if (!project) {
    alert('Projeto não encontrado.');
    return;
  }
  
  if (project.status === 'concluido') {
    alert('Este projeto já está marcado como concluído.');
    return;
  }
  
  try {
    // Atualizar status para concluído
    project.status = 'concluido';
    project.updated_at = new Date().toISOString();
    
    // Tentar salvar no Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { error } = await supabase
            .from('projetos')
            .update({
              status: 'concluido',
              updated_at: new Date().toISOString()
            })
            .eq('id', projectId);
          
          if (error) throw error;
        } catch (error) {
          console.warn('⚠️ Erro ao salvar no Supabase, usando localStorage:', error);
        }
      }
    }
    
    // Salvar no localStorage
    await saveProjects();
    
    // Recarregar visualização
    renderProjects();
    updateStats();
    
    console.log('✅ Projeto marcado como concluído!');
  } catch (error) {
    console.error('❌ Erro ao marcar projeto como concluído:', error);
    alert('Erro ao marcar projeto como concluído. Por favor, tente novamente.');
  }
}

// Excluir projeto
async function deleteProject(projectId) {
  if (!confirm('Tem certeza que deseja excluir este projeto?')) {
    return;
  }
  
  try {
    // Tentar excluir do Supabase primeiro
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { error } = await supabase
            .from('projetos')
            .delete()
            .eq('id', projectId);
          
          if (error) throw error;
          
          // Remover do array local
          allProjects = allProjects.filter(p => p.id !== projectId);
          
          // Sincronizar com localStorage
          localStorage.setItem('lucid_projetos', JSON.stringify(allProjects));
          
          renderProjects();
          updateStats();
          
          console.log('✅ Projeto excluído do Supabase com sucesso!');
          return;
        } catch (error) {
          console.warn('⚠️ Erro ao excluir do Supabase, usando localStorage:', error);
          // Continuar para localStorage como fallback
        }
      }
    }
    
    // Fallback: localStorage
    allProjects = allProjects.filter(p => p.id !== projectId);
    await saveProjects();
    renderProjects();
    updateStats();
    console.log('✅ Projeto excluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao excluir projeto:', error);
    alert('Erro ao excluir projeto. Por favor, tente novamente.');
  }
}

// Atualizar estatísticas
function updateStats() {
  const total = allProjects.length;
  const emAndamento = allProjects.filter(p => p.status === 'em_andamento').length;
  const concluidos = allProjects.filter(p => p.status === 'concluido').length;
  
  // Calcular atrasados
  const agora = new Date();
  const atrasados = allProjects.filter(p => {
    if (p.status === 'concluido' || !p.data_fim) return false;
    return new Date(p.data_fim) < agora;
  }).length;
  
  // Animar valores
  animateValue('statTotal', total);
  animateValue('statEmAndamento', emAndamento);
  animateValue('statConcluidos', concluidos);
  animateValue('statAtrasados', atrasados);
}

// Animar valor
function animateValue(elementId, targetValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const startValue = parseInt(element.textContent) || 0;
  const duration = 500;
  const steps = 20;
  const increment = (targetValue - startValue) / steps;
  let currentStep = 0;
  
  const timer = setInterval(() => {
    currentStep++;
    const currentValue = Math.round(startValue + (increment * currentStep));
    element.textContent = currentValue;
    
    if (currentStep >= steps) {
      element.textContent = targetValue;
      clearInterval(timer);
    }
  }, duration / steps);
}

// Toggle theme
function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById('themeIcon');
  
  if (body.classList.contains('light-theme')) {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
    if (themeIcon) themeIcon.textContent = '🌙';
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    if (themeIcon) themeIcon.textContent = '☀️';
    localStorage.setItem('theme', 'light');
  }
}

// Carregar tema salvo
document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  const body = document.body;
  const themeIcon = document.getElementById('themeIcon');
  
  if (savedTheme === 'light') {
    body.classList.add('light-theme');
    if (themeIcon) themeIcon.textContent = '☀️';
  } else {
    body.classList.add('dark-theme');
    if (themeIcon) themeIcon.textContent = '🌙';
  }
});

