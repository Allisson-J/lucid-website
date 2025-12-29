/* ============================================
   CRM - Gerenciamento de Leads
   ============================================ */

// Variável global para armazenar todos os leads
let allLeads = [];

// Carregar leads do Supabase ou localStorage
async function loadLeadsFromSource() {
  // Verificar se Supabase está disponível
  if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
    const supabase = getSupabaseClient();
    
    // Tentar carregar do Supabase primeiro
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Converter formato do Supabase para formato esperado
        const formattedLeads = data.map(lead => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone || '',
          message: lead.message,
          status: lead.status,
          createdAt: lead.created_at
        }));

        console.log('✅ Leads carregados do Supabase:', formattedLeads.length);
        return formattedLeads;
      } catch (error) {
        console.error('⚠️ Erro ao carregar do Supabase, usando localStorage:', error);
        // Continuar para localStorage como fallback
      }
    }
  }

  // Fallback: carregar do localStorage
  return getLeads();
}

// Atualizar lead no Supabase ou localStorage
async function updateLeadInSource(leadId, updates) {
  // Verificar se Supabase está disponível
  if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
    const supabase = getSupabaseClient();
    
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('leads')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId)
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
  const leads = getLeads();
  const leadIndex = leads.findIndex(l => l.id === leadId);
  if (leadIndex !== -1) {
    leads[leadIndex].status = updates.status;
    saveLeads(leads);
  }
}

// Deletar lead do Supabase ou localStorage
async function deleteLeadFromSource(leadId) {
  // Verificar se Supabase está disponível
  if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
    const supabase = getSupabaseClient();
    
    if (supabase && isSupabaseConfigured()) {
      try {
        // Verificar se há sessão autenticada
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('⚠️ Erro ao verificar sessão:', sessionError);
        }
        
        if (!session) {
          console.warn('⚠️ Nenhuma sessão autenticada encontrada. Usando fallback localStorage.');
          throw new Error('Usuário não autenticado');
        }
        
        console.log('✅ Sessão autenticada encontrada. Deletando lead...');
        
        const { data, error } = await supabase
          .from('leads')
          .delete()
          .eq('id', leadId)
          .select();

        if (error) {
          console.error('❌ Erro ao deletar no Supabase:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            sessionExists: !!session
          });
          
          // Erro 42501 = violação de política RLS
          if (error.code === '42501' || error.message?.includes('row-level security')) {
            console.error('⚠️ Erro de política RLS (42501). A política de DELETE não está configurada.');
            console.error('📋 Execute o SQL do arquivo verificar-e-corrigir-tudo-rls.sql no Supabase.');
            console.log('🔄 Tentando usar localStorage como fallback...');
            // Não lançar erro aqui, deixar continuar para o fallback localStorage
            throw new Error('RLS_POLICY_ERROR');
          }
          
          throw error;
        }
        
        console.log('✅ Lead deletado do Supabase com sucesso!', data);
        return true;
      } catch (error) {
        console.error('Erro ao deletar no Supabase:', error);
        
        // Se for erro de RLS, tentar usar localStorage como fallback
        if (error.code === '42501' || 
            error.message?.includes('row-level security') || 
            error.message === 'RLS_POLICY_ERROR') {
          console.log('⚠️ Erro de RLS detectado. Usando localStorage como fallback...');
          // Continuar para fallback localStorage
        } else if (error.message === 'Usuário não autenticado') {
          console.log('⚠️ Usuário não autenticado. Usando localStorage como fallback...');
          // Continuar para fallback localStorage
        } else {
          // Outros erros também podem usar fallback
          console.log('⚠️ Erro no Supabase. Usando localStorage como fallback...');
        }
      }
    }
  }

  // Fallback: localStorage (apenas se Supabase não estiver disponível)
  console.log('Usando fallback localStorage para deletar lead...');
  const leads = getLeads();
  const filteredLeads = leads.filter(l => l.id !== leadId);
  saveLeads(filteredLeads);
  return true;
}

// Sistema de Tema (Modo Claro/Escuro)
function initTheme() {
  // Verificar preferência salva ou usar padrão (escuro)
  const savedTheme = localStorage.getItem('crm-theme') || 'dark';
  setTheme(savedTheme);
  
  // Configurar botão de alternar tema
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('crm-theme', theme);
  
  // Atualizar ícone
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
  }
  
  console.log(`✅ Tema alterado para: ${theme === 'light' ? 'Claro' : 'Escuro'}`);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  showToast(`Modo ${newTheme === 'light' ? 'claro' : 'escuro'} ativado!`, 'info');
}

document.addEventListener('DOMContentLoaded', async function() {
  // Inicializar tema
  initTheme();
  
  // Verificar autenticação (agora é async)
  const authenticated = await requireAuth();
  if (!authenticated) return;

  // Configurar logout
  document.getElementById('logoutBtn').addEventListener('click', async function() {
    if (confirm('Deseja realmente sair?')) {
      await logout();
    }
  });

  // Mostrar informações do usuário
  const user = await getCurrentUser();
  if (user) {
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) {
      userInfoEl.textContent = user.email || 'Usuário';
    }
  }

  // Carregar leads (Supabase ou localStorage)
  await loadLeads();

  // Event listeners
  document.getElementById('searchInput').addEventListener('input', filterLeads);
  document.getElementById('filterStatus').addEventListener('change', filterLeads);
  document.getElementById('exportBtn').addEventListener('click', exportToCSV);
  document.getElementById('clearAllBtn').addEventListener('click', clearAllLeads);
});

// Carregar leads (Supabase ou localStorage)
async function loadLeads() {
  try {
    setLoading(true);
    allLeads = await loadLeadsFromSource();
    displayLeads(allLeads);
    updateStats(allLeads);
    
    // Aplicar filtros ativos se houver
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value || 'all';
    
    if (searchTerm || statusFilter !== 'all') {
      filterLeads();
    }
  } catch (error) {
    console.error('Erro ao carregar leads:', error);
    showToast('Erro ao carregar leads.', 'error');
  } finally {
    setLoading(false);
  }
}

// Obter leads do localStorage
function getLeads() {
  const leadsData = localStorage.getItem('lucid_leads');
  if (!leadsData) return [];
  
  try {
    return JSON.parse(leadsData);
  } catch (e) {
    return [];
  }
}

// Salvar leads no localStorage
function saveLeads(leads) {
  localStorage.setItem('lucid_leads', JSON.stringify(leads));
}

// Adicionar novo lead
function addLead(leadData) {
  const leads = getLeads();
  const newLead = {
    id: Date.now().toString(),
    ...leadData,
    status: 'new',
    createdAt: new Date().toISOString()
  };
  leads.unshift(newLead); // Adicionar no início
  saveLeads(leads);
  return newLead;
}

// Atualizar status do lead (mantida para compatibilidade)
async function updateLeadStatus(leadId, newStatus) {
  await updateLeadInSource(leadId, { status: newStatus });
  await loadLeads();
}

// Deletar lead (função interna)
async function deleteLeadInternal(leadId) {
  try {
    await deleteLeadFromSource(leadId);
    await loadLeads();
    showToast('Lead deletado com sucesso!', 'success');
    console.log('✅ Lead deletado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao deletar lead:', error);
    showToast('Erro ao deletar lead. Verifique o console.', 'error');
    // Recarregar leads mesmo em caso de erro para atualizar a interface
    await loadLeads();
  }
}

// Exibir leads na tabela
function displayLeads(leads) {
  const tbody = document.getElementById('leadsTableBody');
  
  if (leads.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <p>Nenhum lead encontrado. Os leads do formulário de contato aparecerão aqui.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = leads.map(lead => {
    const date = new Date(lead.createdAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusClass = getStatusClass(lead.status);
    const statusLabel = getStatusLabel(lead.status);

    return `
      <tr>
        <td>${date}</td>
        <td><strong>${escapeHtml(lead.name)}</strong></td>
        <td>${escapeHtml(lead.email)}</td>
        <td>${lead.phone || '-'}</td>
        <td class="message-cell">
          <span class="message-preview">${escapeHtml(lead.message.substring(0, 50))}${lead.message.length > 50 ? '...' : ''}</span>
          ${lead.message.length > 50 ? `<button onclick="showFullMessage('${lead.id}')" class="btn-view-message" data-message="${escapeHtml(lead.message).replace(/"/g, '&quot;')}" title="Ver mensagem completa">Ver mais</button>` : ''}
        </td>
        <td>
          <select class="status-select ${statusClass}" onchange="updateLeadStatus('${lead.id}', this.value)">
            <option value="new" ${lead.status === 'new' ? 'selected' : ''}>Novo</option>
            <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contatado</option>
            <option value="qualified" ${lead.status === 'qualified' ? 'selected' : ''}>Qualificado</option>
            <option value="converted" ${lead.status === 'converted' ? 'selected' : ''}>Convertido</option>
          </select>
        </td>
        <td>
          <button onclick="deleteLead('${lead.id}')" class="btn-delete" title="Deletar">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Filtrar leads
async function filterLeads() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('filterStatus').value;
  
  // Carregar todos os leads se ainda não foram carregados
  if (allLeads.length === 0) {
    allLeads = await loadLeadsFromSource();
  }

  let filtered = [...allLeads]; // Usar cópia para não modificar o original

  // Filtrar por status
  if (statusFilter !== 'all') {
    filtered = filtered.filter(lead => lead.status === statusFilter);
  }

  // Filtrar por busca
  if (searchTerm) {
    filtered = filtered.filter(lead => 
      lead.name.toLowerCase().includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm) ||
      (lead.phone && lead.phone.includes(searchTerm)) ||
      lead.message.toLowerCase().includes(searchTerm)
    );
  }

  displayLeads(filtered);
  // Atualizar estatísticas com TODOS os leads (não apenas os filtrados)
  updateStats(allLeads);
}

// Atualizar estatísticas
function updateStats(leads) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const newLeads = leads.filter(lead => {
    const leadDate = new Date(lead.createdAt);
    return leadDate >= sevenDaysAgo;
  });

  const withEmail = leads.filter(lead => lead.email).length;
  const withPhone = leads.filter(lead => lead.phone).length;

  // Estatísticas gerais
  document.getElementById('totalLeads').textContent = leads.length;
  document.getElementById('newLeads').textContent = newLeads.length;
  document.getElementById('withEmail').textContent = withEmail;
  document.getElementById('withPhone').textContent = withPhone;

  // Estatísticas por status
  const total = leads.length || 1; // Evitar divisão por zero
  
  const statusNew = leads.filter(lead => lead.status === 'new').length;
  const statusContacted = leads.filter(lead => lead.status === 'contacted').length;
  const statusQualified = leads.filter(lead => lead.status === 'qualified').length;
  const statusConverted = leads.filter(lead => lead.status === 'converted').length;

  // Atualizar contadores
  const statusNewEl = document.getElementById('statusNewCount');
  const statusContactedEl = document.getElementById('statusContactedCount');
  const statusQualifiedEl = document.getElementById('statusQualifiedCount');
  const statusConvertedEl = document.getElementById('statusConvertedCount');

  if (statusNewEl) statusNewEl.textContent = statusNew;
  if (statusContactedEl) statusContactedEl.textContent = statusContacted;
  if (statusQualifiedEl) statusQualifiedEl.textContent = statusQualified;
  if (statusConvertedEl) statusConvertedEl.textContent = statusConverted;

  // Atualizar percentuais
  const statusNewPct = document.getElementById('statusNewPercentage');
  const statusContactedPct = document.getElementById('statusContactedPercentage');
  const statusQualifiedPct = document.getElementById('statusQualifiedPercentage');
  const statusConvertedPct = document.getElementById('statusConvertedPercentage');

  if (statusNewPct) statusNewPct.textContent = `${Math.round((statusNew / total) * 100)}%`;
  if (statusContactedPct) statusContactedPct.textContent = `${Math.round((statusContacted / total) * 100)}%`;
  if (statusQualifiedPct) statusQualifiedPct.textContent = `${Math.round((statusQualified / total) * 100)}%`;
  if (statusConvertedPct) statusConvertedPct.textContent = `${Math.round((statusConverted / total) * 100)}%`;
}

// Exportar para CSV
async function exportToCSV() {
  try {
    const leads = await loadLeadsFromSource();
    if (leads.length === 0) {
      showToast('Não há leads para exportar.', 'warning');
      return;
    }

    const headers = ['Data', 'Nome', 'Email', 'Telefone', 'Mensagem', 'Status'];
    const rows = leads.map(lead => [
      new Date(lead.createdAt).toLocaleDateString('pt-BR'),
      lead.name,
      lead.email,
      lead.phone || '',
      lead.message.replace(/"/g, '""'),
      getStatusLabel(lead.status)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_lucid_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast(`CSV exportado com ${leads.length} leads!`, 'success');
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    showToast('Erro ao exportar CSV.', 'error');
  }
}

// Limpar todos os leads
async function clearAllLeads() {
  if (confirm('⚠️ ATENÇÃO: Tem certeza que deseja deletar TODOS os leads?\n\nEsta ação não pode ser desfeita!')) {
    try {
      setLoading(true);
      
      // Verificar se Supabase está disponível
      if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
        const supabase = getSupabaseClient();
        
        if (supabase && isSupabaseConfigured()) {
          try {
            const { error } = await supabase
              .from('leads')
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos
            
            if (error) throw error;
            showToast('Todos os leads foram removidos do Supabase.', 'success');
          } catch (error) {
            console.error('Erro ao limpar Supabase:', error);
            showToast('Erro ao limpar leads do Supabase. Usando localStorage.', 'warning');
            localStorage.removeItem('lucid_leads');
            showToast('Leads removidos do localStorage.', 'success');
          }
        } else {
          localStorage.removeItem('lucid_leads');
          showToast('Todos os leads foram removidos do localStorage.', 'success');
        }
      } else {
        localStorage.removeItem('lucid_leads');
        showToast('Todos os leads foram removidos do localStorage.', 'success');
      }
      
      await loadLeads();
    } catch (error) {
      console.error('Erro ao limpar leads:', error);
      showToast('Erro ao limpar leads.', 'error');
    } finally {
      setLoading(false);
    }
  }
}

// Funções auxiliares
function getStatusClass(status) {
  const classes = {
    'new': 'status-new',
    'contacted': 'status-contacted',
    'qualified': 'status-qualified',
    'converted': 'status-converted'
  };
  return classes[status] || '';
}

function getStatusLabel(status) {
  const labels = {
    'new': 'Novo',
    'contacted': 'Contatado',
    'qualified': 'Qualificado',
    'converted': 'Convertido'
  };
  return labels[status] || status;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Sistema de notificações Toast
function showToast(message, type = 'info') {
  // Remover toasts existentes
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

  // Animação de entrada
  setTimeout(() => toast.classList.add('show'), 10);

  // Remover após 4 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Loading state
function setLoading(isLoading) {
  const container = document.querySelector('.crm-table-container');
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

// Mostrar mensagem completa em modal
window.showFullMessage = async function(leadId) {
  // Buscar mensagem completa do lead
  const leads = await loadLeadsFromSource();
  const lead = leads.find(l => l.id === leadId);
  
  if (!lead) {
    showToast('Mensagem não encontrada.', 'error');
    return;
  }
  
  const modal = document.createElement('div');
  modal.className = 'message-modal';
  modal.innerHTML = `
    <div class="message-modal-content">
      <div class="message-modal-header">
        <h3>Mensagem Completa</h3>
        <button class="btn-close-modal">&times;</button>
      </div>
      <div class="message-modal-body">
        <p>${escapeHtml(lead.message)}</p>
      </div>
      <div class="message-modal-footer">
        <button class="btn btn-secondary">Fechar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Event listeners
  const closeModal = () => {
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 200);
  };
  
  modal.querySelector('.btn-close-modal').addEventListener('click', closeModal);
  modal.querySelector('.btn-secondary').addEventListener('click', closeModal);
  
  // Fechar ao clicar fora
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Fechar com ESC
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
};

// Filtrar por status ao clicar no card
window.filterByStatus = function(status) {
  const filterSelect = document.getElementById('filterStatus');
  if (filterSelect) {
    filterSelect.value = status;
    filterLeads();
    showToast(`Filtrado por: ${getStatusLabel(status)}`, 'info');
  }
};

// Tornar funções globais para uso em onclick
window.updateLeadStatus = async function(leadId, newStatus) {
  try {
    setLoading(true);
    await updateLeadInSource(leadId, { status: newStatus });
    await loadLeads();
    showToast('Status atualizado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    showToast('Erro ao atualizar status.', 'error');
  } finally {
    setLoading(false);
  }
};

window.deleteLead = async function(leadId) {
  if (confirm('Deseja realmente deletar este lead?')) {
    try {
      setLoading(true);
      await deleteLeadInternal(leadId);
    } catch (error) {
      console.error('Erro ao deletar:', error);
      showToast('Erro ao deletar lead.', 'error');
    } finally {
      setLoading(false);
    }
  }
};

// Tornar addLead global para uso no form.js
window.addLead = addLead;

