/* ============================================
   FINANCEIRO - Sistema Financeiro Básico
   ============================================ */

let allOrcamentos = [];
let allFaturas = [];
let allReceitas = [];
let allDespesas = [];
let allProjetos = [];
let allTimeRecords = [];
let currentUser = null;
let currentTab = 'resumo';

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Sistema Financeiro inicializando...');
  
  // Verificar autenticação
  const authenticated = typeof requireAuth !== 'undefined' ? await requireAuth() : await isAuthenticated();
  if (!authenticated) {
    window.location.href = 'login.html';
    return;
  }
  
  // Obter usuário atual
  if (typeof getCurrentUser !== 'undefined') {
    currentUser = await getCurrentUser();
  } else {
    const authData = localStorage.getItem('lucid_auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      currentUser = { id: parsed.id || generateId(), email: parsed.email || 'usuario@lucid.social' };
    } else {
      currentUser = { id: generateId(), email: 'usuario@lucid.social' };
    }
  }
  
  // Configurar eventos
  setupEventListeners();
  
  // Carregar dados
  await loadAllData();
  
  // Renderizar interface
  switchTab('resumo');
  
  // Mostrar informações do usuário
  const userInfoEl = document.getElementById('userInfo');
  if (userInfoEl && currentUser) {
    userInfoEl.textContent = currentUser.email || 'Usuário';
  }
  
  console.log('✅ Sistema Financeiro carregado!');
});

// Funções utilitárias
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function showToast(message, type = 'info') {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
    return;
  }
  
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    </div>
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Configurar event listeners
function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.financeiro-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // Orçamentos
  document.getElementById('btnNovoOrcamento').addEventListener('click', () => openOrcamentoModal());
  document.getElementById('orcamentoModalClose').addEventListener('click', closeOrcamentoModal);
  document.getElementById('btnCancelOrcamento').addEventListener('click', closeOrcamentoModal);
  document.getElementById('orcamentoForm').addEventListener('submit', handleOrcamentoSubmit);
  
  // Faturas
  document.getElementById('btnNovaFatura').addEventListener('click', () => openFaturaModal());
  document.getElementById('faturaModalClose').addEventListener('click', closeFaturaModal);
  document.getElementById('btnCancelFatura').addEventListener('click', closeFaturaModal);
  document.getElementById('faturaForm').addEventListener('submit', handleFaturaSubmit);
  document.getElementById('faturaGerarFromTimeTracking').addEventListener('change', function() {
    if (this.checked) {
      const projetoId = document.getElementById('faturaProjeto').value;
      if (projetoId) {
        loadTimeTrackingForFatura(projetoId);
      }
    }
  });
  
  // Receitas
  document.getElementById('btnNovaReceita').addEventListener('click', () => openReceitaModal());
  document.getElementById('receitaModalClose').addEventListener('click', closeReceitaModal);
  document.getElementById('btnCancelReceita').addEventListener('click', closeReceitaModal);
  document.getElementById('receitaForm').addEventListener('submit', handleReceitaSubmit);
  document.getElementById('receitaTipo').addEventListener('change', function() {
    const faturaGroup = document.getElementById('receitaFaturaGroup');
    faturaGroup.style.display = this.value === 'fatura' ? 'block' : 'none';
  });
  
  // Despesas
  document.getElementById('btnNovaDespesa').addEventListener('click', () => openDespesaModal());
  document.getElementById('despesaModalClose').addEventListener('click', closeDespesaModal);
  document.getElementById('btnCancelDespesa').addEventListener('click', closeDespesaModal);
  document.getElementById('despesaForm').addEventListener('submit', handleDespesaSubmit);
  
  // Relatórios
  document.getElementById('btnRelatorios').addEventListener('click', openReportsModal);
  document.getElementById('reportsModalClose').addEventListener('click', closeReportsModal);
  
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchReportTab(tabName);
    });
  });
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async function() {
    if (confirm('Deseja realmente sair?')) {
      if (typeof logout !== 'undefined') {
        await logout();
      } else {
        localStorage.removeItem('lucid_auth');
        window.location.href = 'login.html';
      }
    }
  });
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle && typeof toggleTheme !== 'undefined') {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Fechar modais
  document.getElementById('orcamentoModal').addEventListener('click', function(e) {
    if (e.target === this) closeOrcamentoModal();
  });
  
  document.getElementById('faturaModal').addEventListener('click', function(e) {
    if (e.target === this) closeFaturaModal();
  });
  
  document.getElementById('receitaModal').addEventListener('click', function(e) {
    if (e.target === this) closeReceitaModal();
  });
  
  document.getElementById('despesaModal').addEventListener('click', function(e) {
    if (e.target === this) closeDespesaModal();
  });
  
  document.getElementById('reportsModal').addEventListener('click', function(e) {
    if (e.target === this) closeReportsModal();
  });
}

// Alternar tab
function switchTab(tabName) {
  currentTab = tabName;
  
  // Atualizar tabs
  document.querySelectorAll('.financeiro-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
  });
  
  // Atualizar conteúdos
  document.querySelectorAll('.financeiro-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  const contentId = `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
  const content = document.getElementById(contentId);
  if (content) {
    content.classList.add('active');
  }
  
  // Renderizar conteúdo
  if (tabName === 'resumo') {
    updateResumo();
  } else if (tabName === 'orcamentos') {
    renderOrcamentos();
  } else if (tabName === 'faturas') {
    renderFaturas();
  } else if (tabName === 'receitas') {
    renderReceitas();
  } else if (tabName === 'despesas') {
    renderDespesas();
  }
}

// Carregar todos os dados
async function loadAllData() {
  await Promise.all([
    loadProjetos(),
    loadOrcamentos(),
    loadFaturas(),
    loadReceitas(),
    loadDespesas(),
    loadTimeRecords()
  ]);
  populateProjetosSelects();
  populateFaturasSelect();
}

// Carregar projetos
async function loadProjetos() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('projetos')
            .select('*')
            .order('nome', { ascending: true });
          
          if (!error && data) {
            allProjetos = data;
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar projetos do Supabase:', error);
        }
      }
    }
    
    const stored = localStorage.getItem('lucid_projetos');
    allProjetos = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Erro ao carregar projetos:', error);
    allProjetos = [];
  }
}

// Carregar orçamentos
async function loadOrcamentos() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('orcamentos')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            allOrcamentos = data;
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar orçamentos do Supabase:', error);
        }
      }
    }
    
    const stored = localStorage.getItem('lucid_orcamentos');
    allOrcamentos = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Erro ao carregar orçamentos:', error);
    allOrcamentos = [];
  }
}

// Carregar faturas
async function loadFaturas() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('faturas')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            allFaturas = data;
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar faturas do Supabase:', error);
        }
      }
    }
    
    const stored = localStorage.getItem('lucid_faturas');
    allFaturas = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Erro ao carregar faturas:', error);
    allFaturas = [];
  }
}

// Carregar receitas
async function loadReceitas() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('receitas')
            .select('*')
            .order('data_recebimento', { ascending: false });
          
          if (!error && data) {
            allReceitas = data;
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar receitas do Supabase:', error);
        }
      }
    }
    
    const stored = localStorage.getItem('lucid_receitas');
    allReceitas = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Erro ao carregar receitas:', error);
    allReceitas = [];
  }
}

// Carregar despesas
async function loadDespesas() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('despesas')
            .select('*')
            .order('data_pagamento', { ascending: false });
          
          if (!error && data) {
            allDespesas = data;
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar despesas do Supabase:', error);
        }
      }
    }
    
    const stored = localStorage.getItem('lucid_despesas');
    allDespesas = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Erro ao carregar despesas:', error);
    allDespesas = [];
  }
}

// Carregar registros de tempo (para integração)
async function loadTimeRecords() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('tempo_trabalho')
            .select('*')
            .eq('faturado', false)
            .order('data_trabalho', { ascending: false });
          
          if (!error && data) {
            allTimeRecords = data;
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar registros de tempo do Supabase:', error);
        }
      }
    }
    
    // Fallback: não há localStorage específico para time tracking no financeiro
    allTimeRecords = [];
  } catch (error) {
    console.error('❌ Erro ao carregar registros de tempo:', error);
    allTimeRecords = [];
  }
}

// Salvar orçamentos
async function saveOrcamentos() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          for (const item of allOrcamentos) {
            const { id, created_at, updated_at, ...data } = item;
            const { data: existing } = await supabase
              .from('orcamentos')
              .select('id')
              .eq('id', id)
              .single();
            
            if (existing) {
              await supabase.from('orcamentos').update({ ...data }).eq('id', id);
            } else {
              await supabase.from('orcamentos').insert([{ id, ...data }]);
            }
          }
          return;
        } catch (error) {
          console.warn('⚠️ Erro ao salvar orçamentos no Supabase:', error);
        }
      }
    }
    
    localStorage.setItem('lucid_orcamentos', JSON.stringify(allOrcamentos));
  } catch (error) {
    console.error('❌ Erro ao salvar orçamentos:', error);
  }
}

// Salvar faturas
async function saveFaturas() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          for (const item of allFaturas) {
            const { id, created_at, updated_at, ...data } = item;
            const { data: existing } = await supabase
              .from('faturas')
              .select('id')
              .eq('id', id)
              .single();
            
            if (existing) {
              await supabase.from('faturas').update({ ...data }).eq('id', id);
            } else {
              await supabase.from('faturas').insert([{ id, ...data }]);
            }
          }
          return;
        } catch (error) {
          console.warn('⚠️ Erro ao salvar faturas no Supabase:', error);
        }
      }
    }
    
    localStorage.setItem('lucid_faturas', JSON.stringify(allFaturas));
  } catch (error) {
    console.error('❌ Erro ao salvar faturas:', error);
  }
}

// Salvar receitas
async function saveReceitas() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          for (const item of allReceitas) {
            const { id, created_at, updated_at, ...data } = item;
            const { data: existing } = await supabase
              .from('receitas')
              .select('id')
              .eq('id', id)
              .single();
            
            if (existing) {
              await supabase.from('receitas').update({ ...data }).eq('id', id);
            } else {
              await supabase.from('receitas').insert([{ id, ...data }]);
            }
          }
          return;
        } catch (error) {
          console.warn('⚠️ Erro ao salvar receitas no Supabase:', error);
        }
      }
    }
    
    localStorage.setItem('lucid_receitas', JSON.stringify(allReceitas));
  } catch (error) {
    console.error('❌ Erro ao salvar receitas:', error);
  }
}

// Salvar despesas
async function saveDespesas() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          for (const item of allDespesas) {
            const { id, created_at, updated_at, ...data } = item;
            const { data: existing } = await supabase
              .from('despesas')
              .select('id')
              .eq('id', id)
              .single();
            
            if (existing) {
              await supabase.from('despesas').update({ ...data }).eq('id', id);
            } else {
              await supabase.from('despesas').insert([{ id, ...data }]);
            }
          }
          return;
        } catch (error) {
          console.warn('⚠️ Erro ao salvar despesas no Supabase:', error);
        }
      }
    }
    
    localStorage.setItem('lucid_despesas', JSON.stringify(allDespesas));
  } catch (error) {
    console.error('❌ Erro ao salvar despesas:', error);
  }
}

// Popular selects de projetos
function populateProjetosSelects() {
  const selects = [
    'orcamentoProjeto',
    'faturaProjeto',
    'despesaProjeto'
  ];
  
  const options = '<option value="">Selecione um projeto</option>' +
    allProjetos.map(p => `<option value="${p.id}">${p.nome || p.titulo || 'Projeto sem nome'}</option>`).join('');
  
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      const currentValue = select.value;
      select.innerHTML = selectId === 'faturaProjeto' || selectId === 'despesaProjeto' 
        ? '<option value="">Nenhum projeto</option>' + allProjetos.map(p => `<option value="${p.id}">${p.nome || p.titulo || 'Projeto sem nome'}</option>`).join('')
        : options;
      if (currentValue) select.value = currentValue;
    }
  });
}

// Popular select de faturas (para receitas)
function populateFaturasSelect() {
  const select = document.getElementById('receitaFatura');
  if (!select) return;
  
  const options = '<option value="">Nenhuma</option>' +
    allFaturas.map(f => `<option value="${f.id}">${f.numero || f.titulo || 'Fatura sem número'} - ${formatCurrency(f.valor_total)}</option>`).join('');
  
  select.innerHTML = options;
}

// Gerar número de fatura
function generateFaturaNumber() {
  const ano = new Date().getFullYear();
  const faturasAno = allFaturas.filter(f => {
    if (!f.numero) return false;
    return f.numero.includes(ano.toString());
  });
  
  const ultimoNumero = faturasAno.length > 0 
    ? Math.max(...faturasAno.map(f => {
        const match = f.numero.match(/-(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      }))
    : 0;
  
  return `FAT-${ano}-${String(ultimoNumero + 1).padStart(3, '0')}`;
}

// Atualizar resumo
function updateResumo() {
  // Total de receitas
  const totalReceitas = allReceitas.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0);
  document.getElementById('statTotalReceitas').textContent = formatCurrency(totalReceitas);
  
  // Total de despesas
  const totalDespesas = allDespesas.reduce((sum, d) => sum + parseFloat(d.valor || 0), 0);
  document.getElementById('statTotalDespesas').textContent = formatCurrency(totalDespesas);
  
  // Saldo
  const saldo = totalReceitas - totalDespesas;
  document.getElementById('statSaldo').textContent = formatCurrency(saldo);
  
  // Faturas pendentes
  const faturasPendentes = allFaturas.filter(f => f.status === 'pendente' || f.status === 'parcial').length;
  document.getElementById('statFaturasPendentes').textContent = faturasPendentes;
  
  // Receitas do mês
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const receitasMes = allReceitas.filter(r => new Date(r.data_recebimento) >= inicioMes)
    .reduce((sum, r) => sum + parseFloat(r.valor || 0), 0);
  document.getElementById('resumoReceitasMes').textContent = formatCurrency(receitasMes);
  
  // Despesas do mês
  const despesasMes = allDespesas.filter(d => new Date(d.data_pagamento) >= inicioMes)
    .reduce((sum, d) => sum + parseFloat(d.valor || 0), 0);
  document.getElementById('resumoDespesasMes').textContent = formatCurrency(despesasMes);
  
  // Faturas emitidas
  const faturasEmitidas = allFaturas.length;
  document.getElementById('resumoFaturasEmitidas').textContent = faturasEmitidas;
  
  // Orçamentos aprovados
  const orcamentosAprovados = allOrcamentos.filter(o => o.status === 'aprovado').length;
  document.getElementById('resumoOrcamentosAprovados').textContent = orcamentosAprovados;
}

// Renderizar orçamentos
function renderOrcamentos() {
  const list = document.getElementById('orcamentosList');
  if (!list) return;
  
  if (allOrcamentos.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Nenhum orçamento encontrado. Clique em "Novo Orçamento" para começar.</p></div>';
    return;
  }
  
  const statusLabels = {
    rascunho: 'Rascunho',
    aprovado: 'Aprovado',
    rejeitado: 'Rejeitado',
    cancelado: 'Cancelado'
  };
  
  list.innerHTML = allOrcamentos.map(orcamento => {
    const projeto = allProjetos.find(p => p.id === orcamento.projeto_id);
    return `
      <div class="financeiro-item-card" data-id="${orcamento.id}">
        <div class="financeiro-item-header">
          <div class="financeiro-item-title">
            ${escapeHtml(orcamento.titulo || 'Orçamento sem título')}
            <span class="financeiro-badge status-${orcamento.status}">${statusLabels[orcamento.status] || orcamento.status}</span>
          </div>
          <div class="financeiro-item-value">${formatCurrency(orcamento.valor_total)}</div>
        </div>
        <div class="financeiro-item-meta">
          <span><strong>Projeto:</strong> ${escapeHtml(projeto?.nome || projeto?.titulo || 'Não encontrado')}</span>
          <span><strong>Data:</strong> ${formatDate(orcamento.data_criacao)}</span>
        </div>
        ${orcamento.descricao ? `<div class="financeiro-item-description">${escapeHtml(orcamento.descricao)}</div>` : ''}
        <div class="financeiro-item-actions">
          <button class="btn btn-secondary btn-sm" onclick="editOrcamento('${orcamento.id}')">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteOrcamento('${orcamento.id}')">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Renderizar faturas
function renderFaturas() {
  const list = document.getElementById('faturasList');
  if (!list) return;
  
  if (allFaturas.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Nenhuma fatura encontrada. Clique em "Nova Fatura" para começar.</p></div>';
    return;
  }
  
  const statusLabels = {
    pendente: 'Pendente',
    parcial: 'Parcial',
    paga: 'Paga',
    cancelada: 'Cancelada',
    vencida: 'Vencida'
  };
  
  list.innerHTML = allFaturas.map(fatura => {
    const projeto = fatura.projeto_id ? allProjetos.find(p => p.id === fatura.projeto_id) : null;
    const percentualPago = fatura.valor_total > 0 
      ? (fatura.valor_pago / fatura.valor_total) * 100 
      : 0;
    
    return `
      <div class="financeiro-item-card" data-id="${fatura.id}">
        <div class="financeiro-item-header">
          <div class="financeiro-item-title">
            ${escapeHtml(fatura.numero || '')} - ${escapeHtml(fatura.titulo || 'Fatura sem título')}
            <span class="financeiro-badge status-${fatura.status}">${statusLabels[fatura.status] || fatura.status}</span>
          </div>
          <div class="financeiro-item-value">${formatCurrency(fatura.valor_total)}</div>
        </div>
        <div class="financeiro-item-meta">
          ${projeto ? `<span><strong>Projeto:</strong> ${escapeHtml(projeto.nome || projeto.titulo)}</span>` : ''}
          <span><strong>Emissão:</strong> ${formatDate(fatura.data_emissao)}</span>
          ${fatura.data_vencimento ? `<span><strong>Vencimento:</strong> ${formatDate(fatura.data_vencimento)}</span>` : ''}
          <span><strong>Pago:</strong> ${formatCurrency(fatura.valor_pago || 0)}</span>
        </div>
        ${fatura.descricao ? `<div class="financeiro-item-description">${escapeHtml(fatura.descricao)}</div>` : ''}
        ${fatura.valor_total > 0 ? `
          <div class="fatura-progress">
            <div class="fatura-progress-fill" style="width: ${Math.min(percentualPago, 100)}%"></div>
          </div>
          <small style="color: var(--text-tertiary);">${percentualPago.toFixed(1)}% pago</small>
        ` : ''}
        <div class="financeiro-item-actions">
          <button class="btn btn-secondary btn-sm" onclick="editFatura('${fatura.id}')">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteFatura('${fatura.id}')">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Renderizar receitas
function renderReceitas() {
  const list = document.getElementById('receitasList');
  if (!list) return;
  
  if (allReceitas.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Nenhuma receita encontrada. Clique em "Nova Receita" para começar.</p></div>';
    return;
  }
  
  const tipoLabels = {
    fatura: 'Fatura',
    outra: 'Outra',
    reembolso: 'Reembolso',
    transferencia: 'Transferência'
  };
  
  list.innerHTML = allReceitas.map(receita => {
    const fatura = receita.fatura_id ? allFaturas.find(f => f.id === receita.fatura_id) : null;
    return `
      <div class="financeiro-item-card" data-id="${receita.id}">
        <div class="financeiro-item-header">
          <div class="financeiro-item-title">
            ${escapeHtml(receita.descricao || 'Receita sem descrição')}
            <span class="financeiro-badge" style="background: rgba(34, 197, 94, 0.2); color: #22c55e;">${tipoLabels[receita.tipo] || receita.tipo}</span>
          </div>
          <div class="financeiro-item-value" style="color: #22c55e;">${formatCurrency(receita.valor)}</div>
        </div>
        <div class="financeiro-item-meta">
          <span><strong>Data:</strong> ${formatDate(receita.data_recebimento)}</span>
          ${receita.categoria ? `<span><strong>Categoria:</strong> ${escapeHtml(receita.categoria)}</span>` : ''}
          ${receita.metodo_pagamento ? `<span><strong>Método:</strong> ${escapeHtml(receita.metodo_pagamento)}</span>` : ''}
          ${fatura ? `<span><strong>Fatura:</strong> ${escapeHtml(fatura.numero || fatura.titulo)}</span>` : ''}
        </div>
        ${receita.observacoes ? `<div class="financeiro-item-description">${escapeHtml(receita.observacoes)}</div>` : ''}
        <div class="financeiro-item-actions">
          <button class="btn btn-secondary btn-sm" onclick="editReceita('${receita.id}')">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteReceita('${receita.id}')">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Renderizar despesas
function renderDespesas() {
  const list = document.getElementById('despesasList');
  if (!list) return;
  
  if (allDespesas.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Nenhuma despesa encontrada. Clique em "Nova Despesa" para começar.</p></div>';
    return;
  }
  
  const tipoLabels = {
    operacional: 'Operacional',
    marketing: 'Marketing',
    infraestrutura: 'Infraestrutura',
    pessoal: 'Pessoal',
    outras: 'Outras'
  };
  
  list.innerHTML = allDespesas.map(despesa => {
    const projeto = despesa.projeto_id ? allProjetos.find(p => p.id === despesa.projeto_id) : null;
    return `
      <div class="financeiro-item-card" data-id="${despesa.id}">
        <div class="financeiro-item-header">
          <div class="financeiro-item-title">
            ${escapeHtml(despesa.descricao || 'Despesa sem descrição')}
            <span class="financeiro-badge" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;">${tipoLabels[despesa.tipo] || despesa.tipo}</span>
          </div>
          <div class="financeiro-item-value" style="color: #ef4444;">${formatCurrency(despesa.valor)}</div>
        </div>
        <div class="financeiro-item-meta">
          <span><strong>Data:</strong> ${formatDate(despesa.data_pagamento)}</span>
          ${despesa.categoria ? `<span><strong>Categoria:</strong> ${escapeHtml(despesa.categoria)}</span>` : ''}
          ${despesa.metodo_pagamento ? `<span><strong>Método:</strong> ${escapeHtml(despesa.metodo_pagamento)}</span>` : ''}
          ${projeto ? `<span><strong>Projeto:</strong> ${escapeHtml(projeto.nome || projeto.titulo)}</span>` : ''}
          ${despesa.fornecedor ? `<span><strong>Fornecedor:</strong> ${escapeHtml(despesa.fornecedor)}</span>` : ''}
        </div>
        ${despesa.observacoes ? `<div class="financeiro-item-description">${escapeHtml(despesa.observacoes)}</div>` : ''}
        <div class="financeiro-item-actions">
          <button class="btn btn-secondary btn-sm" onclick="editDespesa('${despesa.id}')">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteDespesa('${despesa.id}')">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Modal Orçamento
function openOrcamentoModal(orcamento = null) {
  const modal = document.getElementById('orcamentoModal');
  const form = document.getElementById('orcamentoForm');
  const title = document.getElementById('orcamentoModalTitle');
  
  if (orcamento) {
    title.textContent = 'Editar Orçamento';
    document.getElementById('orcamentoId').value = orcamento.id;
    document.getElementById('orcamentoProjeto').value = orcamento.projeto_id || '';
    document.getElementById('orcamentoTitulo').value = orcamento.titulo || '';
    document.getElementById('orcamentoDescricao').value = orcamento.descricao || '';
    document.getElementById('orcamentoValor').value = orcamento.valor_total || '';
    document.getElementById('orcamentoStatus').value = orcamento.status || 'rascunho';
  } else {
    title.textContent = 'Novo Orçamento';
    form.reset();
    document.getElementById('orcamentoId').value = '';
    document.getElementById('orcamentoData').value = new Date().toISOString().split('T')[0];
  }
  
  modal.classList.add('active');
}

function closeOrcamentoModal() {
  document.getElementById('orcamentoModal').classList.remove('active');
  document.getElementById('orcamentoForm').reset();
}

async function handleOrcamentoSubmit(e) {
  e.preventDefault();
  
  try {
    const form = e.target;
    const id = document.getElementById('orcamentoId').value;
    
    const orcamentoData = {
      projeto_id: document.getElementById('orcamentoProjeto').value,
      titulo: document.getElementById('orcamentoTitulo').value,
      descricao: document.getElementById('orcamentoDescricao').value || null,
      valor_total: parseFloat(document.getElementById('orcamentoValor').value),
      status: document.getElementById('orcamentoStatus').value,
      data_criacao: new Date().toISOString().split('T')[0]
    };
    
    if (id) {
      // Editar
      const index = allOrcamentos.findIndex(o => o.id === id);
      if (index !== -1) {
        allOrcamentos[index] = {
          ...allOrcamentos[index],
          ...orcamentoData,
          updated_at: new Date().toISOString()
        };
      }
    } else {
      // Criar
      const novoOrcamento = {
        id: generateId(),
        ...orcamentoData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      allOrcamentos.unshift(novoOrcamento);
    }
    
    await saveOrcamentos();
    await loadOrcamentos();
    renderOrcamentos();
    updateResumo();
    closeOrcamentoModal();
    
    showToast(id ? 'Orçamento atualizado com sucesso!' : 'Orçamento criado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error);
    showToast('Erro ao salvar orçamento.', 'error');
  }
}

window.editOrcamento = function(id) {
  const orcamento = allOrcamentos.find(o => o.id === id);
  if (orcamento) openOrcamentoModal(orcamento);
};

window.deleteOrcamento = async function(id) {
  if (!confirm('Deseja realmente excluir este orçamento?')) return;
  
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        await supabase.from('orcamentos').delete().eq('id', id);
      }
    }
    
    allOrcamentos = allOrcamentos.filter(o => o.id !== id);
    await saveOrcamentos();
    await loadOrcamentos();
    renderOrcamentos();
    updateResumo();
    
    showToast('Orçamento excluído com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao deletar orçamento:', error);
    showToast('Erro ao excluir orçamento.', 'error');
  }
};

// Modal Fatura
function openFaturaModal(fatura = null) {
  const modal = document.getElementById('faturaModal');
  const form = document.getElementById('faturaForm');
  const title = document.getElementById('faturaModalTitle');
  
  if (fatura) {
    title.textContent = 'Editar Fatura';
    document.getElementById('faturaId').value = fatura.id;
    document.getElementById('faturaProjeto').value = fatura.projeto_id || '';
    document.getElementById('faturaTitulo').value = fatura.titulo || '';
    document.getElementById('faturaDescricao').value = fatura.descricao || '';
    document.getElementById('faturaValor').value = fatura.valor_total || '';
    document.getElementById('faturaValorPago').value = fatura.valor_pago || 0;
    document.getElementById('faturaDataEmissao').value = fatura.data_emissao || '';
    document.getElementById('faturaDataVencimento').value = fatura.data_vencimento || '';
    document.getElementById('faturaClienteNome').value = fatura.cliente_nome || '';
    document.getElementById('faturaClienteEmail').value = fatura.cliente_email || '';
    document.getElementById('faturaStatus').value = fatura.status || 'pendente';
  } else {
    title.textContent = 'Nova Fatura';
    form.reset();
    document.getElementById('faturaId').value = '';
    document.getElementById('faturaDataEmissao').value = new Date().toISOString().split('T')[0];
    document.getElementById('faturaValorPago').value = 0;
  }
  
  modal.classList.add('active');
}

function closeFaturaModal() {
  document.getElementById('faturaModal').classList.remove('active');
  document.getElementById('faturaForm').reset();
}

async function handleFaturaSubmit(e) {
  e.preventDefault();
  
  try {
    const form = e.target;
    const id = document.getElementById('faturaId').value;
    const gerarFromTimeTracking = document.getElementById('faturaGerarFromTimeTracking').checked;
    
    let itens = [];
    if (gerarFromTimeTracking) {
      const projetoId = document.getElementById('faturaProjeto').value;
      if (projetoId) {
        const records = allTimeRecords.filter(r => r.projeto_id === projetoId && !r.faturado);
        itens = records.map(r => ({
          tipo: 'tempo_trabalho',
          descricao: r.descricao || 'Trabalho realizado',
          horas: (r.duracao_minutos || 0) / 60,
          valor_hora: r.taxa_hora || 0,
          valor_total: (r.duracao_minutos || 0) / 60 * (r.taxa_hora || 0)
        }));
      }
    }
    
    const valorTotal = gerarFromTimeTracking && itens.length > 0
      ? itens.reduce((sum, item) => sum + item.valor_total, 0)
      : parseFloat(document.getElementById('faturaValor').value);
    
    const faturaData = {
      projeto_id: document.getElementById('faturaProjeto').value || null,
      numero: id ? allFaturas.find(f => f.id === id)?.numero : generateFaturaNumber(),
      titulo: document.getElementById('faturaTitulo').value,
      descricao: document.getElementById('faturaDescricao').value || null,
      valor_total: valorTotal,
      valor_pago: parseFloat(document.getElementById('faturaValorPago').value) || 0,
      data_emissao: document.getElementById('faturaDataEmissao').value,
      data_vencimento: document.getElementById('faturaDataVencimento').value || null,
      cliente_nome: document.getElementById('faturaClienteNome').value || null,
      cliente_email: document.getElementById('faturaClienteEmail').value || null,
      status: document.getElementById('faturaStatus').value,
      itens: itens.length > 0 ? itens : []
    };
    
    // Atualizar status baseado no valor pago
    if (faturaData.valor_pago >= faturaData.valor_total) {
      faturaData.status = 'paga';
    } else if (faturaData.valor_pago > 0) {
      faturaData.status = 'parcial';
    } else {
      faturaData.status = 'pendente';
    }
    
    if (id) {
      // Editar
      const index = allFaturas.findIndex(f => f.id === id);
      if (index !== -1) {
        allFaturas[index] = {
          ...allFaturas[index],
          ...faturaData,
          updated_at: new Date().toISOString()
        };
      }
    } else {
      // Criar
      const novaFatura = {
        id: generateId(),
        ...faturaData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      allFaturas.unshift(novaFatura);
    }
    
    await saveFaturas();
    await loadFaturas();
    populateFaturasSelect();
    renderFaturas();
    updateResumo();
    closeFaturaModal();
    
    showToast(id ? 'Fatura atualizada com sucesso!' : 'Fatura criada com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao salvar fatura:', error);
    showToast('Erro ao salvar fatura.', 'error');
  }
}

function loadTimeTrackingForFatura(projetoId) {
  // Esta função seria chamada quando o checkbox for marcado
  // Por enquanto, apenas atualiza o valor total quando os itens são gerados
  console.log('Carregar registros de tempo para projeto:', projetoId);
}

window.editFatura = function(id) {
  const fatura = allFaturas.find(f => f.id === id);
  if (fatura) openFaturaModal(fatura);
};

window.deleteFatura = async function(id) {
  if (!confirm('Deseja realmente excluir esta fatura?')) return;
  
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        await supabase.from('faturas').delete().eq('id', id);
      }
    }
    
    allFaturas = allFaturas.filter(f => f.id !== id);
    await saveFaturas();
    await loadFaturas();
    populateFaturasSelect();
    renderFaturas();
    updateResumo();
    
    showToast('Fatura excluída com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao deletar fatura:', error);
    showToast('Erro ao excluir fatura.', 'error');
  }
};

// Modal Receita
function openReceitaModal(receita = null) {
  const modal = document.getElementById('receitaModal');
  const form = document.getElementById('receitaForm');
  const title = document.getElementById('receitaModalTitle');
  
  if (receita) {
    title.textContent = 'Editar Receita';
    document.getElementById('receitaId').value = receita.id;
    document.getElementById('receitaTipo').value = receita.tipo || 'outra';
    document.getElementById('receitaFatura').value = receita.fatura_id || '';
    document.getElementById('receitaDescricao').value = receita.descricao || '';
    document.getElementById('receitaValor').value = receita.valor || '';
    document.getElementById('receitaData').value = receita.data_recebimento || '';
    document.getElementById('receitaCategoria').value = receita.categoria || '';
    document.getElementById('receitaMetodo').value = receita.metodo_pagamento || '';
    document.getElementById('receitaObservacoes').value = receita.observacoes || '';
    
    const faturaGroup = document.getElementById('receitaFaturaGroup');
    faturaGroup.style.display = receita.tipo === 'fatura' ? 'block' : 'none';
  } else {
    title.textContent = 'Nova Receita';
    form.reset();
    document.getElementById('receitaId').value = '';
    document.getElementById('receitaData').value = new Date().toISOString().split('T')[0];
    document.getElementById('receitaTipo').value = 'outra';
  }
  
  modal.classList.add('active');
}

function closeReceitaModal() {
  document.getElementById('receitaModal').classList.remove('active');
  document.getElementById('receitaForm').reset();
}

async function handleReceitaSubmit(e) {
  e.preventDefault();
  
  try {
    const form = e.target;
    const id = document.getElementById('receitaId').value;
    
    const receitaData = {
      tipo: document.getElementById('receitaTipo').value,
      fatura_id: document.getElementById('receitaFatura').value || null,
      descricao: document.getElementById('receitaDescricao').value,
      valor: parseFloat(document.getElementById('receitaValor').value),
      data_recebimento: document.getElementById('receitaData').value,
      categoria: document.getElementById('receitaCategoria').value || null,
      metodo_pagamento: document.getElementById('receitaMetodo').value || null,
      observacoes: document.getElementById('receitaObservacoes').value || null
    };
    
    if (id) {
      const index = allReceitas.findIndex(r => r.id === id);
      if (index !== -1) {
        allReceitas[index] = {
          ...allReceitas[index],
          ...receitaData,
          updated_at: new Date().toISOString()
        };
      }
    } else {
      const novaReceita = {
        id: generateId(),
        ...receitaData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      allReceitas.unshift(novaReceita);
    }
    
    await saveReceitas();
    await loadReceitas();
    renderReceitas();
    updateResumo();
    closeReceitaModal();
    
    showToast(id ? 'Receita atualizada com sucesso!' : 'Receita criada com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao salvar receita:', error);
    showToast('Erro ao salvar receita.', 'error');
  }
}

window.editReceita = function(id) {
  const receita = allReceitas.find(r => r.id === id);
  if (receita) openReceitaModal(receita);
};

window.deleteReceita = async function(id) {
  if (!confirm('Deseja realmente excluir esta receita?')) return;
  
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        await supabase.from('receitas').delete().eq('id', id);
      }
    }
    
    allReceitas = allReceitas.filter(r => r.id !== id);
    await saveReceitas();
    await loadReceitas();
    renderReceitas();
    updateResumo();
    
    showToast('Receita excluída com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao deletar receita:', error);
    showToast('Erro ao excluir receita.', 'error');
  }
};

// Modal Despesa
function openDespesaModal(despesa = null) {
  const modal = document.getElementById('despesaModal');
  const form = document.getElementById('despesaForm');
  const title = document.getElementById('despesaModalTitle');
  
  if (despesa) {
    title.textContent = 'Editar Despesa';
    document.getElementById('despesaId').value = despesa.id;
    document.getElementById('despesaTipo').value = despesa.tipo || 'outras';
    document.getElementById('despesaProjeto').value = despesa.projeto_id || '';
    document.getElementById('despesaDescricao').value = despesa.descricao || '';
    document.getElementById('despesaValor').value = despesa.valor || '';
    document.getElementById('despesaData').value = despesa.data_pagamento || '';
    document.getElementById('despesaCategoria').value = despesa.categoria || '';
    document.getElementById('despesaMetodo').value = despesa.metodo_pagamento || '';
    document.getElementById('despesaFornecedor').value = despesa.fornecedor || '';
    document.getElementById('despesaNotaFiscal').value = despesa.nota_fiscal || '';
    document.getElementById('despesaObservacoes').value = despesa.observacoes || '';
  } else {
    title.textContent = 'Nova Despesa';
    form.reset();
    document.getElementById('despesaId').value = '';
    document.getElementById('despesaData').value = new Date().toISOString().split('T')[0];
    document.getElementById('despesaTipo').value = 'outras';
  }
  
  modal.classList.add('active');
}

function closeDespesaModal() {
  document.getElementById('despesaModal').classList.remove('active');
  document.getElementById('despesaForm').reset();
}

async function handleDespesaSubmit(e) {
  e.preventDefault();
  
  try {
    const form = e.target;
    const id = document.getElementById('despesaId').value;
    
    const despesaData = {
      tipo: document.getElementById('despesaTipo').value,
      projeto_id: document.getElementById('despesaProjeto').value || null,
      descricao: document.getElementById('despesaDescricao').value,
      valor: parseFloat(document.getElementById('despesaValor').value),
      data_pagamento: document.getElementById('despesaData').value,
      categoria: document.getElementById('despesaCategoria').value || null,
      metodo_pagamento: document.getElementById('despesaMetodo').value || null,
      fornecedor: document.getElementById('despesaFornecedor').value || null,
      nota_fiscal: document.getElementById('despesaNotaFiscal').value || null,
      observacoes: document.getElementById('despesaObservacoes').value || null
    };
    
    if (id) {
      const index = allDespesas.findIndex(d => d.id === id);
      if (index !== -1) {
        allDespesas[index] = {
          ...allDespesas[index],
          ...despesaData,
          updated_at: new Date().toISOString()
        };
      }
    } else {
      const novaDespesa = {
        id: generateId(),
        ...despesaData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      allDespesas.unshift(novaDespesa);
    }
    
    await saveDespesas();
    await loadDespesas();
    renderDespesas();
    updateResumo();
    closeDespesaModal();
    
    showToast(id ? 'Despesa atualizada com sucesso!' : 'Despesa criada com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao salvar despesa:', error);
    showToast('Erro ao salvar despesa.', 'error');
  }
}

window.editDespesa = function(id) {
  const despesa = allDespesas.find(d => d.id === id);
  if (despesa) openDespesaModal(despesa);
};

window.deleteDespesa = async function(id) {
  if (!confirm('Deseja realmente excluir esta despesa?')) return;
  
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        await supabase.from('despesas').delete().eq('id', id);
      }
    }
    
    allDespesas = allDespesas.filter(d => d.id !== id);
    await saveDespesas();
    await loadDespesas();
    renderDespesas();
    updateResumo();
    
    showToast('Despesa excluída com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    showToast('Erro ao excluir despesa.', 'error');
  }
};

// Relatórios
function openReportsModal() {
  const modal = document.getElementById('reportsModal');
  modal.classList.add('active');
  switchReportTab('geral');
  renderReports();
}

function closeReportsModal() {
  document.getElementById('reportsModal').classList.remove('active');
}

function switchReportTab(tabName) {
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
  });
  
  document.querySelectorAll('.report-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `report${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  });
}

function renderReports() {
  renderReportGeral();
  renderReportReceitas();
  renderReportDespesas();
  renderReportFaturas();
}

function renderReportGeral() {
  const content = document.getElementById('reportGeralContent');
  if (!content) return;
  
  const totalReceitas = allReceitas.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0);
  const totalDespesas = allDespesas.reduce((sum, d) => sum + parseFloat(d.valor || 0), 0);
  const saldo = totalReceitas - totalDespesas;
  const totalFaturas = allFaturas.reduce((sum, f) => sum + parseFloat(f.valor_total || 0), 0);
  const faturasPendentes = allFaturas.filter(f => f.status === 'pendente' || f.status === 'parcial')
    .reduce((sum, f) => sum + parseFloat(f.valor_total || 0) - parseFloat(f.valor_pago || 0), 0);
  
  content.innerHTML = `
    <div class="report-summary">
      <div class="report-summary-item">
        <strong>Total de Receitas:</strong>
        <span style="color: #22c55e;">${formatCurrency(totalReceitas)}</span>
      </div>
      <div class="report-summary-item">
        <strong>Total de Despesas:</strong>
        <span style="color: #ef4444;">${formatCurrency(totalDespesas)}</span>
      </div>
      <div class="report-summary-item">
        <strong>Saldo:</strong>
        <span style="color: ${saldo >= 0 ? '#22c55e' : '#ef4444'}; font-weight: bold;">${formatCurrency(saldo)}</span>
      </div>
      <div class="report-summary-item">
        <strong>Total de Faturas:</strong>
        <span>${formatCurrency(totalFaturas)}</span>
      </div>
      <div class="report-summary-item">
        <strong>Faturas Pendentes:</strong>
        <span style="color: #f59e0b;">${formatCurrency(faturasPendentes)}</span>
      </div>
    </div>
  `;
}

function renderReportReceitas() {
  const content = document.getElementById('reportReceitasContent');
  if (!content) return;
  
  const receitasPorTipo = {};
  allReceitas.forEach(r => {
    const tipo = r.tipo || 'outra';
    if (!receitasPorTipo[tipo]) receitasPorTipo[tipo] = 0;
    receitasPorTipo[tipo] += parseFloat(r.valor || 0);
  });
  
  const totalReceitas = allReceitas.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0);
  
  const tipoLabels = {
    fatura: 'Fatura',
    outra: 'Outra',
    reembolso: 'Reembolso',
    transferencia: 'Transferência'
  };
  
  content.innerHTML = `
    <table class="report-table">
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Valor</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(receitasPorTipo).map(([tipo, valor]) => {
          const percentual = totalReceitas > 0 ? (valor / totalReceitas * 100).toFixed(1) : 0;
          return `
            <tr>
              <td>${tipoLabels[tipo] || tipo}</td>
              <td><strong>${formatCurrency(valor)}</strong></td>
              <td>${percentual}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    <div class="report-summary">
      <div class="report-summary-item">
        <strong>Total:</strong>
        <span>${formatCurrency(totalReceitas)}</span>
      </div>
    </div>
  `;
}

function renderReportDespesas() {
  const content = document.getElementById('reportDespesasContent');
  if (!content) return;
  
  const despesasPorTipo = {};
  allDespesas.forEach(d => {
    const tipo = d.tipo || 'outras';
    if (!despesasPorTipo[tipo]) despesasPorTipo[tipo] = 0;
    despesasPorTipo[tipo] += parseFloat(d.valor || 0);
  });
  
  const totalDespesas = allDespesas.reduce((sum, d) => sum + parseFloat(d.valor || 0), 0);
  
  const tipoLabels = {
    operacional: 'Operacional',
    marketing: 'Marketing',
    infraestrutura: 'Infraestrutura',
    pessoal: 'Pessoal',
    outras: 'Outras'
  };
  
  content.innerHTML = `
    <table class="report-table">
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Valor</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(despesasPorTipo).map(([tipo, valor]) => {
          const percentual = totalDespesas > 0 ? (valor / totalDespesas * 100).toFixed(1) : 0;
          return `
            <tr>
              <td>${tipoLabels[tipo] || tipo}</td>
              <td><strong>${formatCurrency(valor)}</strong></td>
              <td>${percentual}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    <div class="report-summary">
      <div class="report-summary-item">
        <strong>Total:</strong>
        <span>${formatCurrency(totalDespesas)}</span>
      </div>
    </div>
  `;
}

function renderReportFaturas() {
  const content = document.getElementById('reportFaturasContent');
  if (!content) return;
  
  const faturasPorStatus = {};
  allFaturas.forEach(f => {
    const status = f.status || 'pendente';
    if (!faturasPorStatus[status]) faturasPorStatus[status] = { count: 0, valor: 0 };
    faturasPorStatus[status].count++;
    faturasPorStatus[status].valor += parseFloat(f.valor_total || 0);
  });
  
  const totalFaturas = allFaturas.reduce((sum, f) => sum + parseFloat(f.valor_total || 0), 0);
  
  const statusLabels = {
    pendente: 'Pendente',
    parcial: 'Parcial',
    paga: 'Paga',
    cancelada: 'Cancelada',
    vencida: 'Vencida'
  };
  
  content.innerHTML = `
    <table class="report-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Quantidade</th>
          <th>Valor Total</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(faturasPorStatus).map(([status, data]) => `
          <tr>
            <td>${statusLabels[status] || status}</td>
            <td>${data.count}</td>
            <td><strong>${formatCurrency(data.valor)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="report-summary">
      <div class="report-summary-item">
        <strong>Total de Faturas:</strong>
        <span>${allFaturas.length}</span>
      </div>
      <div class="report-summary-item">
        <strong>Valor Total:</strong>
        <span>${formatCurrency(totalFaturas)}</span>
      </div>
    </div>
  `;
}

