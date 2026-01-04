/* ============================================
   AUTOMAÇÕES - Gerenciamento de Automações Lucid
   ============================================ */

// Variável global para armazenar todas as automações
let allAutomacoes = [];

// Tipos de automação disponíveis
const TIPO_OPTIONS = {
  python: '🐍 Python',
  power_automate: '⚡ Power Automate',
  vba: '📊 VBA',
  n8n: '🔄 N8N',
  outro: '🔧 Outro'
};

// Status disponíveis
const STATUS_OPTIONS = {
  ativa: '✅ Ativa',
  inativa: '⏸️ Inativa',
  pausada: '⏸️ Pausada',
  erro: '❌ Erro'
};

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Sistema de Automações inicializando...');
  
  // Verificar autenticação
  const authenticated = await requireAuth();
  if (!authenticated) return;

  // Carregar dados do usuário
  await loadUserInfo();

  // Carregar automações
  await loadAutomacoes();

  // Configurar eventos
  setupEventListeners();

  // Renderizar automações
  displayAutomacoes(allAutomacoes);
  updateStats(allAutomacoes);
  
  console.log('✅ Sistema de Automações carregado!');
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
  // Botão nova automação
  document.getElementById('btnNovaAutomacao').addEventListener('click', () => {
    openAutomacaoModal();
  });
  
  // Filtros
  document.getElementById('searchInput').addEventListener('input', filterAutomacoes);
  document.getElementById('filterStatus').addEventListener('change', filterAutomacoes);
  document.getElementById('filterTipo').addEventListener('change', filterAutomacoes);
  
  // Modal
  document.getElementById('modalClose').addEventListener('click', closeAutomacaoModal);
  document.getElementById('btnCancel').addEventListener('click', closeAutomacaoModal);
  document.getElementById('automacaoForm').addEventListener('submit', handleAutomacaoSubmit);
  
  // Fechar modal ao clicar fora
  document.getElementById('automacaoModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeAutomacaoModal();
    }
  });
  
  // Tema
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout();
  });
  
  // Event delegation para botões de ação na tabela
  const tbody = document.getElementById('automacoesTableBody');
  if (tbody) {
    tbody.addEventListener('click', async function(e) {
      const btnEdit = e.target.closest('.btn-edit');
      const btnDelete = e.target.closest('.btn-delete');
      const btnToggle = e.target.closest('.btn-toggle-status');
      
      if (btnEdit) {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
        const automacaoId = btnEdit.getAttribute('data-id');
        if (automacaoId) {
          editAutomacao(automacaoId);
        }
        return false;
      }
      
      if (btnDelete) {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
        const automacaoId = btnDelete.getAttribute('data-id');
        if (automacaoId) {
          await deleteAutomacao(automacaoId);
        }
        return false;
      }
      
      if (btnToggle) {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
        const automacaoId = btnToggle.getAttribute('data-id');
        if (automacaoId) {
          await toggleAutomacaoStatus(automacaoId);
        }
        return false;
      }
    });
  }
}

// Toggle tema
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('lucid_theme', newTheme);
  updateThemeIcon(newTheme);
  showToast(`Tema ${newTheme === 'light' ? 'claro' : 'escuro'} ativado!`, 'info');
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

// Carregar automações do Supabase ou localStorage
async function loadAutomacoesFromSource() {
  // Verificar se Supabase está disponível
  if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
    const supabase = getSupabaseClient();
    
    // Tentar carregar do Supabase primeiro
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('automacoes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Converter formato do Supabase para formato esperado
        const formattedAutomacoes = data.map(auto => ({
          id: auto.id,
          nome: auto.nome,
          descricao: auto.descricao || '',
          tipo: auto.tipo,
          status: auto.status,
          agendamento: auto.agendamento || '',
          configuracoes: auto.configuracoes || {},
          ultima_execucao: auto.ultima_execucao,
          proxima_execucao: auto.proxima_execucao,
          total_execucoes: auto.total_execucoes || 0,
          sucesso_execucoes: auto.sucesso_execucoes || 0,
          erro_execucoes: auto.erro_execucoes || 0,
          createdAt: auto.created_at,
          updatedAt: auto.updated_at
        }));

        console.log('✅ Automações carregadas do Supabase:', formattedAutomacoes.length);
        return formattedAutomacoes;
      } catch (error) {
        console.error('⚠️ Erro ao carregar do Supabase, usando localStorage:', error);
        // Continuar para localStorage como fallback
      }
    }
  }

  // Fallback: carregar do localStorage
  return getAutomacoes();
}

// Salvar automações no localStorage
function saveAutomacoes(automacoes) {
  try {
    localStorage.setItem('lucid_automacoes', JSON.stringify(automacoes));
  } catch (error) {
    console.error('Erro ao salvar automações:', error);
  }
}

// Obter automações do localStorage
function getAutomacoes() {
  try {
    const saved = localStorage.getItem('lucid_automacoes');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Erro ao carregar automações:', error);
    return [];
  }
}

// Salvar automação no Supabase ou localStorage
async function saveAutomacaoToSource(automacaoData) {
  // Verificar se Supabase está disponível
  if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
    const supabase = getSupabaseClient();
    
    if (supabase && isSupabaseConfigured()) {
      try {
        // Parse configurações se for string
        let configuracoes = automacaoData.configuracoes;
        if (typeof configuracoes === 'string') {
          try {
            configuracoes = configuracoes.trim() ? JSON.parse(configuracoes) : {};
          } catch (e) {
            configuracoes = {};
          }
        }
        
        const { data, error } = await supabase
          .from('automacoes')
          .insert([{
            nome: automacaoData.nome,
            descricao: automacaoData.descricao || null,
            tipo: automacaoData.tipo,
            status: automacaoData.status,
            agendamento: automacaoData.agendamento || null,
            configuracoes: configuracoes,
            total_execucoes: 0,
            sucesso_execucoes: 0,
            erro_execucoes: 0
          }])
          .select();

        if (error) throw error;
        return data[0];
      } catch (error) {
        console.error('Erro ao salvar no Supabase:', error);
        // Continuar para localStorage como fallback
      }
    }
  }

  // Fallback: localStorage
  const automacoes = getAutomacoes();
  const newAutomacao = {
    id: 'auto_' + Date.now(),
    ...automacaoData,
    total_execucoes: 0,
    sucesso_execucoes: 0,
    erro_execucoes: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  automacoes.push(newAutomacao);
  saveAutomacoes(automacoes);
  return newAutomacao;
}

// Atualizar automação no Supabase ou localStorage
async function updateAutomacaoInSource(automacaoId, updates) {
  // Verificar se Supabase está disponível
  if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
    const supabase = getSupabaseClient();
    
    if (supabase && isSupabaseConfigured()) {
      try {
        // Parse configurações se for string
        if (updates.configuracoes && typeof updates.configuracoes === 'string') {
          try {
            updates.configuracoes = updates.configuracoes.trim() ? JSON.parse(updates.configuracoes) : {};
          } catch (e) {
            updates.configuracoes = {};
          }
        }
        
        const { data, error } = await supabase
          .from('automacoes')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', automacaoId)
          .select();

        if (error) throw error;
        return data[0];
      } catch (error) {
        console.error('Erro ao atualizar no Supabase:', error);
        // Fallback para localStorage
      }
    }
  }

  // Fallback: localStorage
  const automacoes = getAutomacoes();
  const automacaoIndex = automacoes.findIndex(a => a.id === automacaoId);
  if (automacaoIndex !== -1) {
    automacoes[automacaoIndex] = {
      ...automacoes[automacaoIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveAutomacoes(automacoes);
  }
}

// Deletar automação do Supabase ou localStorage
async function deleteAutomacaoFromSource(automacaoId) {
  // Verificar se Supabase está disponível
  if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
    const supabase = getSupabaseClient();
    
    if (supabase && isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('automacoes')
          .delete()
          .eq('id', automacaoId);

        if (error) throw error;
        return;
      } catch (error) {
        console.error('Erro ao deletar do Supabase:', error);
        // Fallback para localStorage
      }
    }
  }

  // Fallback: localStorage
  const automacoes = getAutomacoes();
  const filtered = automacoes.filter(a => a.id !== automacaoId);
  saveAutomacoes(filtered);
}

// Carregar automações
async function loadAutomacoes() {
  try {
    setLoading(true);
    allAutomacoes = await loadAutomacoesFromSource();
    console.log('✅ Automações carregadas:', allAutomacoes.length);
  } catch (error) {
    console.error('❌ Erro ao carregar automações:', error);
    showToast('Erro ao carregar automações.', 'error');
  } finally {
    setLoading(false);
  }
}

// Exibir automações na tabela
function displayAutomacoes(automacoes) {
  const tbody = document.getElementById('automacoesTableBody');
  
  if (automacoes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <p>Nenhuma automação encontrada. Crie sua primeira automação!</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = automacoes.map(auto => {
    const tipoLabel = TIPO_OPTIONS[auto.tipo] || auto.tipo;
    const statusClass = getStatusClass(auto.status);
    const statusLabel = STATUS_OPTIONS[auto.status] || auto.status;
    
    const ultimaExecucao = auto.ultima_execucao 
      ? new Date(auto.ultima_execucao).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Nunca';
    
    const taxaSucesso = auto.total_execucoes > 0
      ? ((auto.sucesso_execucoes / auto.total_execucoes) * 100).toFixed(1) + '%'
      : '-';
    
    return `
      <tr>
        <td><strong>${escapeHtml(auto.nome)}</strong></td>
        <td>${tipoLabel}</td>
        <td>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </td>
        <td>${auto.agendamento || '-'}</td>
        <td>${ultimaExecucao}</td>
        <td>${auto.total_execucoes || 0}</td>
        <td>${taxaSucesso}</td>
        <td class="actions-cell">
          <button class="btn-toggle-status" data-id="${auto.id}" title="Alternar Status">
            ${auto.status === 'ativa' ? '⏸️' : '▶️'}
          </button>
          <button class="btn-edit" data-id="${auto.id}" title="Editar">✏️</button>
          <button class="btn-delete" data-id="${auto.id}" title="Deletar">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Obter classe CSS do status
function getStatusClass(status) {
  const statusMap = {
    'ativa': 'status-ativa',
    'inativa': 'status-inativa',
    'pausada': 'status-pausada',
    'erro': 'status-erro'
  };
  return statusMap[status] || '';
}

// Escapar HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Filtrar automações
function filterAutomacoes() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('filterStatus').value;
  const tipoFilter = document.getElementById('filterTipo').value;
  
  let filtered = [...allAutomacoes];
  
  // Filtrar por status
  if (statusFilter !== 'all') {
    filtered = filtered.filter(auto => auto.status === statusFilter);
  }
  
  // Filtrar por tipo
  if (tipoFilter !== 'all') {
    filtered = filtered.filter(auto => auto.tipo === tipoFilter);
  }
  
  // Filtrar por busca
  if (searchTerm) {
    filtered = filtered.filter(auto =>
      auto.nome.toLowerCase().includes(searchTerm) ||
      (auto.descricao && auto.descricao.toLowerCase().includes(searchTerm))
    );
  }
  
  displayAutomacoes(filtered);
}

// Filtrar por tipo (ao clicar no card)
window.filterByType = function(tipo) {
  const filterTipo = document.getElementById('filterTipo');
  if (filterTipo) {
    filterTipo.value = tipo;
    filterAutomacoes();
    showToast(`Filtrado por: ${TIPO_OPTIONS[tipo]}`, 'info');
  }
};

// Atualizar estatísticas
function updateStats(automacoes) {
  const total = automacoes.length;
  const ativas = automacoes.filter(a => a.status === 'ativa').length;
  const totalExecucoes = automacoes.reduce((sum, a) => sum + (a.total_execucoes || 0), 0);
  const totalSucessos = automacoes.reduce((sum, a) => sum + (a.sucesso_execucoes || 0), 0);
  const taxaSucesso = totalExecucoes > 0 
    ? ((totalSucessos / totalExecucoes) * 100).toFixed(1) + '%'
    : '-';
  
  document.getElementById('totalAutomacoes').textContent = total;
  document.getElementById('ativasAutomacoes').textContent = ativas;
  document.getElementById('totalExecucoes').textContent = totalExecucoes;
  document.getElementById('taxaSucesso').textContent = taxaSucesso;
  
  // Contar por tipo
  document.getElementById('countPython').textContent = automacoes.filter(a => a.tipo === 'python').length;
  document.getElementById('countPowerAutomate').textContent = automacoes.filter(a => a.tipo === 'power_automate').length;
  document.getElementById('countVBA').textContent = automacoes.filter(a => a.tipo === 'vba').length;
  document.getElementById('countN8N').textContent = automacoes.filter(a => a.tipo === 'n8n').length;
}

// Abrir modal
function openAutomacaoModal(automacaoId = null) {
  const modal = document.getElementById('automacaoModal');
  const form = document.getElementById('automacaoForm');
  const title = document.getElementById('modalTitle');
  
  if (automacaoId) {
    title.textContent = 'Editar Automação';
    const automacao = allAutomacoes.find(a => a.id === automacaoId);
    if (automacao) {
      document.getElementById('automacaoNome').value = automacao.nome;
      document.getElementById('automacaoDescricao').value = automacao.descricao || '';
      document.getElementById('automacaoTipo').value = automacao.tipo;
      document.getElementById('automacaoStatus').value = automacao.status;
      document.getElementById('automacaoAgendamento').value = automacao.agendamento || '';
      document.getElementById('automacaoConfiguracoes').value = 
        typeof automacao.configuracoes === 'string' 
          ? automacao.configuracoes 
          : JSON.stringify(automacao.configuracoes || {}, null, 2);
      form.dataset.editId = automacaoId;
    }
  } else {
    title.textContent = 'Nova Automação';
    form.reset();
    delete form.dataset.editId;
  }
  
  modal.classList.add('active');
}

// Fechar modal
function closeAutomacaoModal() {
  const modal = document.getElementById('automacaoModal');
  const form = document.getElementById('automacaoForm');
  modal.classList.remove('active');
  form.reset();
  delete form.dataset.editId;
}

// Editar automação
function editAutomacao(automacaoId) {
  openAutomacaoModal(automacaoId);
}

// Toggle status da automação
async function toggleAutomacaoStatus(automacaoId) {
  const automacao = allAutomacoes.find(a => a.id === automacaoId);
  if (!automacao) return;
  
  const newStatus = automacao.status === 'ativa' ? 'inativa' : 'ativa';
  
  if (confirm(`Deseja ${newStatus === 'ativa' ? 'ativar' : 'desativar'} esta automação?`)) {
    try {
      setLoading(true);
      await updateAutomacaoInSource(automacaoId, { status: newStatus });
      await loadAutomacoes();
      displayAutomacoes(allAutomacoes);
      updateStats(allAutomacoes);
      showToast(`Automação ${newStatus === 'ativa' ? 'ativada' : 'desativada'} com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showToast('Erro ao atualizar status.', 'error');
    } finally {
      setLoading(false);
    }
  }
}

// Deletar automação
async function deleteAutomacao(automacaoId) {
  if (confirm('Deseja realmente deletar esta automação?')) {
    try {
      setLoading(true);
      await deleteAutomacaoFromSource(automacaoId);
      await loadAutomacoes();
      displayAutomacoes(allAutomacoes);
      updateStats(allAutomacoes);
      showToast('Automação deletada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao deletar:', error);
      showToast('Erro ao deletar automação.', 'error');
    } finally {
      setLoading(false);
    }
  }
}

// Handle form submit
async function handleAutomacaoSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const automacaoData = {
    nome: formData.get('nome'),
    descricao: formData.get('descricao'),
    tipo: formData.get('tipo'),
    status: formData.get('status'),
    agendamento: formData.get('agendamento'),
    configuracoes: formData.get('configuracoes')
  };
  
  try {
    setLoading(true);
    
    if (form.dataset.editId) {
      // Editar
      await updateAutomacaoInSource(form.dataset.editId, automacaoData);
      showToast('Automação atualizada com sucesso!', 'success');
    } else {
      // Criar
      await saveAutomacaoToSource(automacaoData);
      showToast('Automação criada com sucesso!', 'success');
    }
    
    await loadAutomacoes();
    displayAutomacoes(allAutomacoes);
    updateStats(allAutomacoes);
    closeAutomacaoModal();
  } catch (error) {
    console.error('Erro ao salvar automação:', error);
    showToast('Erro ao salvar automação.', 'error');
  } finally {
    setLoading(false);
  }
}

// Loading state
function setLoading(isLoading) {
  const container = document.querySelector('.automacoes-table-container');
  if (container) {
    if (isLoading) {
      container.style.opacity = '0.6';
      container.style.pointerEvents = 'none';
    } else {
      container.style.opacity = '1';
      container.style.pointerEvents = 'auto';
    }
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
      <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
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

