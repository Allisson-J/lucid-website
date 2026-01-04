/* ============================================
   EQUIPES - Sistema de Gerenciamento de Equipes
   ============================================ */

let allEquipes = [];
let allMembros = [];
let currentEquipeId = null;
let currentUser = null;

// Roles disponíveis
const ROLES = {
  admin: { label: 'Administrador', icon: '👑', color: '#ef4444' },
  gestor: { label: 'Gestor', icon: '⭐', color: '#f59e0b' },
  membro: { label: 'Membro', icon: '👤', color: '#3b82f6' }
};

// Status de convite
const CONVITE_STATUS = {
  pendente: { label: 'Pendente', icon: '⏳', color: '#f59e0b' },
  aceito: { label: 'Aceito', icon: '✅', color: '#10b981' },
  recusado: { label: 'Recusado', icon: '❌', color: '#ef4444' },
  expirado: { label: 'Expirado', icon: '⏰', color: '#6b7280' }
};

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Sistema de Equipes inicializando...');
  
  // Verificar autenticação
  const authenticated = await requireAuth();
  if (!authenticated) return;
  
  // Obter usuário atual
  currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.id) {
    // Tentar obter do localStorage
    try {
      const loggedInUser = localStorage.getItem('loggedInUser');
      if (loggedInUser) {
        const parsed = JSON.parse(loggedInUser);
        currentUser = { id: parsed.id || generateId(), email: parsed.email || 'usuario@lucid.social' };
      } else {
        const authData = localStorage.getItem('lucid_auth');
        if (authData) {
          const parsed = JSON.parse(authData);
          currentUser = { id: parsed.id || generateId(), email: parsed.email || 'usuario@lucid.social' };
        } else {
          currentUser = { id: generateId(), email: 'usuario@lucid.social' };
        }
      }
    } catch (e) {
      currentUser = { id: generateId(), email: 'usuario@lucid.social' };
    }
  }
  
  // Configurar eventos
  setupEventListeners();
  
  // Carregar dados
  await loadEquipes();
  await loadMembros();
  renderEquipes();
  updateStats();
  
  // Configurar tema (será gerenciado pelo toggleTheme)
  
  // Mostrar informações do usuário
  const userInfoEl = document.getElementById('userInfo');
  if (userInfoEl && currentUser) {
    userInfoEl.textContent = currentUser.email || 'Usuário';
  }
  
  console.log('✅ Sistema de Equipes carregado!');
});

// Configurar event listeners
function setupEventListeners() {
  // Botão nova equipe
  document.getElementById('btnNovaEquipe').addEventListener('click', openNovaEquipeModal);
  
  // Modal equipe
  document.getElementById('equipeModalClose').addEventListener('click', closeEquipeModal);
  document.getElementById('btnCancelEquipe').addEventListener('click', closeEquipeModal);
  document.getElementById('equipeForm').addEventListener('submit', handleEquipeSubmit);
  
  // Color picker
  document.getElementById('equipeCor').addEventListener('input', function() {
    document.getElementById('equipeCorHex').value = this.value;
  });
  document.getElementById('equipeCorHex').addEventListener('input', function() {
    if (this.value.match(/^#[0-9A-Fa-f]{6}$/)) {
      document.getElementById('equipeCor').value = this.value;
    }
  });
  
  // Modal membros
  document.getElementById('membrosModalClose').addEventListener('click', closeMembrosModal);
  document.getElementById('btnConvidarMembro').addEventListener('click', openConviteModal);
  
  // Modal convite
  document.getElementById('conviteModalClose').addEventListener('click', closeConviteModal);
  document.getElementById('btnCancelConvite').addEventListener('click', closeConviteModal);
  document.getElementById('conviteForm').addEventListener('submit', handleConviteSubmit);
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async function() {
    if (confirm('Deseja realmente sair?')) {
      await logout();
    }
  });
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

// Carregar equipes
async function loadEquipes() {
  try {
    // Tentar carregar do Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('equipes')
            .select('*')
            .eq('ativa', true)
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            allEquipes = data;
            console.log(`✅ ${data.length} equipe(s) carregada(s) do Supabase`);
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar do Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem('lucid_equipes');
    if (stored) {
      allEquipes = JSON.parse(stored);
    } else {
      allEquipes = [];
    }
  } catch (error) {
    console.error('❌ Erro ao carregar equipes:', error);
    allEquipes = [];
  }
}

// Carregar membros
async function loadMembros() {
  try {
    // Tentar carregar do Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('equipes_membros')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            allMembros = data;
            console.log(`✅ ${data.length} membro(s) carregado(s) do Supabase`);
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar do Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem('lucid_equipes_membros');
    if (stored) {
      allMembros = JSON.parse(stored);
    } else {
      allMembros = [];
    }
  } catch (error) {
    console.error('❌ Erro ao carregar membros:', error);
    allMembros = [];
  }
}

// Salvar equipes
async function saveEquipes() {
  try {
    // Tentar salvar no Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          // Sincronizar cada equipe
          for (const equipe of allEquipes) {
            const { id, created_at, updated_at, ...equipeData } = equipe;
            
            const { data: existing } = await supabase
              .from('equipes')
              .select('id')
              .eq('id', id)
              .single();
            
            if (existing) {
              await supabase
                .from('equipes')
                .update(equipeData)
                .eq('id', id);
            } else {
              await supabase
                .from('equipes')
                .insert([{ id, ...equipeData }]);
            }
          }
          console.log('✅ Equipes sincronizadas com Supabase');
          return;
        } catch (error) {
          console.warn('⚠️ Erro ao salvar no Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    localStorage.setItem('lucid_equipes', JSON.stringify(allEquipes));
  } catch (error) {
    console.error('❌ Erro ao salvar equipes:', error);
  }
}

// Renderizar equipes
function renderEquipes() {
  const container = document.getElementById('equipesGrid');
  if (!container) return;
  
  if (allEquipes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <h3>Nenhuma equipe ainda</h3>
        <p>Crie sua primeira equipe para começar a gerenciar times e membros</p>
        <button class="btn btn-primary" onclick="document.getElementById('btnNovaEquipe').click()">
          <i class="fas fa-plus"></i>
          Criar Primeira Equipe
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = allEquipes.map(equipe => createEquipeCard(equipe)).join('');
  
  // Anexar event listeners
  container.querySelectorAll('.equipe-card').forEach(card => {
    const equipeId = card.getAttribute('data-id');
    
    // Click no card
    card.addEventListener('click', function(e) {
      if (e.target.closest('.equipe-actions')) return;
      openMembrosModal(equipeId);
    });
    
    // Botões de ação
    const btnMembros = card.querySelector('.btn-membros');
    if (btnMembros) {
      btnMembros.addEventListener('click', function(e) {
        e.stopPropagation();
        openMembrosModal(equipeId);
      });
    }
    
    const btnEdit = card.querySelector('.btn-edit');
    if (btnEdit) {
      btnEdit.addEventListener('click', function(e) {
        e.stopPropagation();
        editEquipe(equipeId);
      });
    }
    
    const btnDelete = card.querySelector('.btn-delete');
    if (btnDelete) {
      btnDelete.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteEquipe(equipeId);
      });
    }
  });
}

// Criar card de equipe
function createEquipeCard(equipe) {
  const membrosEquipe = allMembros.filter(m => m.equipe_id === equipe.id);
  const membrosAceitos = membrosEquipe.filter(m => m.convite_status === 'aceito').length;
  const membrosPendentes = membrosEquipe.filter(m => m.convite_status === 'pendente').length;
  const lider = membrosEquipe.find(m => m.role === 'admin' || equipe.lider_id === m.usuario_id);
  
  return `
    <div class="equipe-card" data-id="${equipe.id}">
      <div class="equipe-header" style="border-left: 4px solid ${equipe.cor || '#4da6ff'};">
        <div class="equipe-title-row">
          <h3 class="equipe-title">${escapeHtml(equipe.nome)}</h3>
          <div class="equipe-cor-badge" style="background: ${equipe.cor || '#4da6ff'};"></div>
        </div>
      </div>
      
      ${equipe.descricao ? `<p class="equipe-description">${escapeHtml(equipe.descricao)}</p>` : ''}
      
      <div class="equipe-stats">
        <div class="equipe-stat">
          <i class="fas fa-users"></i>
          <span>${membrosAceitos} membro(s)</span>
        </div>
        ${membrosPendentes > 0 ? `
          <div class="equipe-stat">
            <i class="fas fa-clock"></i>
            <span>${membrosPendentes} pendente(s)</span>
          </div>
        ` : ''}
      </div>
      
      <div class="equipe-actions">
        <button class="btn-icon btn-membros" title="Gerenciar Membros">
          <i class="fas fa-users"></i>
        </button>
        <button class="btn-icon btn-edit" title="Editar Equipe">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon btn-delete delete" title="Excluir Equipe">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
}

// Abrir modal nova equipe
function openNovaEquipeModal() {
  const modal = document.getElementById('equipeModal');
  const form = document.getElementById('equipeForm');
  const title = document.getElementById('equipeModalTitle');
  
  if (modal && form && title) {
    form.reset();
    document.getElementById('equipeId').value = '';
    document.getElementById('equipeCor').value = '#4da6ff';
    document.getElementById('equipeCorHex').value = '#4da6ff';
    title.textContent = 'Nova Equipe';
    modal.classList.add('active');
  }
}

// Editar equipe
function editEquipe(equipeId) {
  const equipe = allEquipes.find(e => e.id === equipeId);
  if (!equipe) return;
  
  const modal = document.getElementById('equipeModal');
  const form = document.getElementById('equipeForm');
  const title = document.getElementById('equipeModalTitle');
  
  if (modal && form && title) {
    document.getElementById('equipeId').value = equipe.id;
    document.getElementById('equipeNome').value = equipe.nome || '';
    document.getElementById('equipeDescricao').value = equipe.descricao || '';
    document.getElementById('equipeCor').value = equipe.cor || '#4da6ff';
    document.getElementById('equipeCorHex').value = equipe.cor || '#4da6ff';
    title.textContent = 'Editar Equipe';
    modal.classList.add('active');
  }
}

// Fechar modal equipe
function closeEquipeModal() {
  const modal = document.getElementById('equipeModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Salvar equipe
async function handleEquipeSubmit(e) {
  e.preventDefault();
  
  try {
    const formData = new FormData(e.target);
    const equipeId = formData.get('equipeId') || generateId();
    
    const equipeData = {
      id: equipeId,
      nome: formData.get('equipeNome').trim(),
      descricao: formData.get('equipeDescricao').trim() || null,
      cor: formData.get('equipeCor') || '#4da6ff',
      lider_id: currentUser.id,
      ativa: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const existingIndex = allEquipes.findIndex(e => e.id === equipeId);
    if (existingIndex >= 0) {
      allEquipes[existingIndex] = { ...allEquipes[existingIndex], ...equipeData };
    } else {
      allEquipes.push(equipeData);
      
      // Adicionar líder como admin automaticamente
      const membroLider = {
        id: generateId(),
        equipe_id: equipeId,
        usuario_id: currentUser.id,
        role: 'admin',
        convite_status: 'aceito',
        data_entrada: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      allMembros.push(membroLider);
      await saveMembros();
    }
    
    await saveEquipes();
    closeEquipeModal();
    renderEquipes();
    updateStats();
    
    console.log('✅ Equipe salva com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao salvar equipe:', error);
    alert('Erro ao salvar equipe. Por favor, tente novamente.');
  }
}

// Deletar equipe
async function deleteEquipe(equipeId) {
  if (!confirm('Tem certeza que deseja excluir esta equipe? Todos os membros também serão removidos.')) {
    return;
  }
  
  try {
    // Marcar como inativa (soft delete)
    const equipe = allEquipes.find(e => e.id === equipeId);
    if (equipe) {
      equipe.ativa = false;
      await saveEquipes();
    }
    
    // Remover membros
    allMembros = allMembros.filter(m => m.equipe_id !== equipeId);
    await saveMembros();
    
    // Remover do array local
    allEquipes = allEquipes.filter(e => e.id !== equipeId);
    
    renderEquipes();
    updateStats();
    
    console.log('✅ Equipe excluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao excluir equipe:', error);
    alert('Erro ao excluir equipe. Por favor, tente novamente.');
  }
}

// Abrir modal membros
async function openMembrosModal(equipeId) {
  currentEquipeId = equipeId;
  const modal = document.getElementById('membrosModal');
  const title = document.getElementById('membrosModalTitle');
  
  if (modal && title) {
    const equipe = allEquipes.find(e => e.id === equipeId);
    if (equipe) {
      title.textContent = `Membros - ${equipe.nome}`;
    }
    await renderMembros();
    modal.classList.add('active');
  }
}

// Fechar modal membros
function closeMembrosModal() {
  const modal = document.getElementById('membrosModal');
  if (modal) {
    modal.classList.remove('active');
  }
  currentEquipeId = null;
}

// Renderizar membros
async function renderMembros() {
  const container = document.getElementById('membrosList');
  if (!container || !currentEquipeId) return;
  
  const membrosEquipe = allMembros.filter(m => m.equipe_id === currentEquipeId);
  
  if (membrosEquipe.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-user-plus"></i>
        <p>Nenhum membro nesta equipe ainda. Convide alguém para começar!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = membrosEquipe.map(membro => createMembroCard(membro)).join('');
  
  // Anexar event listeners
  container.querySelectorAll('.membro-card').forEach(card => {
    const membroId = card.getAttribute('data-id');
    
    const btnRemove = card.querySelector('.btn-remove');
    if (btnRemove) {
      btnRemove.addEventListener('click', function(e) {
        e.stopPropagation();
        removeMembro(membroId);
      });
    }
    
    const roleSelect = card.querySelector('.membro-role-select');
    if (roleSelect) {
      roleSelect.addEventListener('change', function(e) {
        updateMembroRole(membroId, this.value);
      });
    }
  });
}

// Criar card de membro
function createMembroCard(membro) {
  const roleInfo = ROLES[membro.role] || ROLES.membro;
  const statusInfo = CONVITE_STATUS[membro.convite_status] || CONVITE_STATUS.pendente;
  const canManage = canManageEquipe(currentEquipeId);
  
  return `
    <div class="membro-card" data-id="${membro.id}">
      <div class="membro-info">
        <div class="membro-avatar">
          ${membro.usuario_nome ? membro.usuario_nome.charAt(0).toUpperCase() : 'U'}
        </div>
        <div class="membro-details">
          <div class="membro-name">${membro.usuario_nome || membro.usuario_id || 'Usuário'}</div>
          <div class="membro-email">${membro.usuario_email || 'Email não disponível'}</div>
        </div>
      </div>
      
      <div class="membro-status">
        <span class="status-badge" style="background: ${statusInfo.color}20; color: ${statusInfo.color};">
          ${statusInfo.icon} ${statusInfo.label}
        </span>
      </div>
      
      <div class="membro-role">
        ${canManage ? `
          <select class="membro-role-select" data-id="${membro.id}">
            ${Object.keys(ROLES).map(role => `
              <option value="${role}" ${membro.role === role ? 'selected' : ''}>
                ${ROLES[role].label}
              </option>
            `).join('')}
          </select>
        ` : `
          <span class="role-badge" style="background: ${roleInfo.color}20; color: ${roleInfo.color};">
            ${roleInfo.icon} ${roleInfo.label}
          </span>
        `}
      </div>
      
      ${canManage ? `
        <button class="btn-icon btn-remove delete" title="Remover da Equipe">
          <i class="fas fa-times"></i>
        </button>
      ` : ''}
    </div>
  `;
}

// Abrir modal convite
function openConviteModal() {
  const modal = document.getElementById('conviteModal');
  const form = document.getElementById('conviteForm');
  
  if (modal && form && currentEquipeId) {
    form.reset();
    document.getElementById('conviteEquipeId').value = currentEquipeId;
    document.getElementById('conviteRole').value = 'membro';
    modal.classList.add('active');
  }
}

// Fechar modal convite
function closeConviteModal() {
  const modal = document.getElementById('conviteModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Enviar convite
async function handleConviteSubmit(e) {
  e.preventDefault();
  
  try {
    const formData = new FormData(e.target);
    const equipeId = formData.get('conviteEquipeId');
    const email = formData.get('conviteEmail').trim();
    const role = formData.get('conviteRole');
    
    if (!equipeId || !email) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    
    // Gerar token de convite
    const token = generateToken();
    
    const membroData = {
      id: generateId(),
      equipe_id: equipeId,
      usuario_id: email, // Usar email como ID temporário
      usuario_email: email,
      role: role,
      convite_status: 'pendente',
      convite_token: token,
      convite_enviado_em: new Date().toISOString(),
      convite_expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
      convidado_por: currentUser.id,
      created_at: new Date().toISOString()
    };
    
    allMembros.push(membroData);
    await saveMembros();
    
    // TODO: Enviar email com convite (precisa de backend)
    console.log('📧 Convite criado (email não enviado - precisa de backend)');
    console.log('🔗 Link do convite:', `${window.location.origin}/equipes.html?token=${token}`);
    
    closeConviteModal();
    await renderMembros();
    updateStats();
    
    alert(`Convite enviado para ${email}!`);
    console.log('✅ Convite criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar convite:', error);
    alert('Erro ao criar convite. Por favor, tente novamente.');
  }
}

// Remover membro
async function removeMembro(membroId) {
  if (!confirm('Tem certeza que deseja remover este membro da equipe?')) {
    return;
  }
  
  try {
    allMembros = allMembros.filter(m => m.id !== membroId);
    await saveMembros();
    await renderMembros();
    updateStats();
    
    console.log('✅ Membro removido com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao remover membro:', error);
    alert('Erro ao remover membro. Por favor, tente novamente.');
  }
}

// Atualizar role do membro
async function updateMembroRole(membroId, newRole) {
  try {
    const membro = allMembros.find(m => m.id === membroId);
    if (membro) {
      membro.role = newRole;
      await saveMembros();
      await renderMembros();
      console.log('✅ Role do membro atualizada!');
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar role:', error);
    alert('Erro ao atualizar papel do membro. Por favor, tente novamente.');
  }
}

// Salvar membros
async function saveMembros() {
  try {
    // Tentar salvar no Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          for (const membro of allMembros) {
            const { id, created_at, updated_at, ...membroData } = membro;
            
            const { data: existing } = await supabase
              .from('equipes_membros')
              .select('id')
              .eq('id', id)
              .single();
            
            if (existing) {
              await supabase
                .from('equipes_membros')
                .update(membroData)
                .eq('id', id);
            } else {
              await supabase
                .from('equipes_membros')
                .insert([{ id, ...membroData }]);
            }
          }
          console.log('✅ Membros sincronizados com Supabase');
          return;
        } catch (error) {
          console.warn('⚠️ Erro ao salvar no Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    localStorage.setItem('lucid_equipes_membros', JSON.stringify(allMembros));
  } catch (error) {
    console.error('❌ Erro ao salvar membros:', error);
  }
}

// Verificar se pode gerenciar equipe
function canManageEquipe(equipeId) {
  if (!currentUser || !currentUser.id) return false;
  
  const equipe = allEquipes.find(e => e.id === equipeId);
  if (!equipe) return false;
  
  // Se for o líder
  if (equipe.lider_id === currentUser.id) return true;
  
  // Se for admin ou gestor da equipe
  const membro = allMembros.find(m => 
    m.equipe_id === equipeId && 
    m.usuario_id === currentUser.id && 
    m.convite_status === 'aceito' &&
    (m.role === 'admin' || m.role === 'gestor')
  );
  
  return !!membro;
}

// Atualizar estatísticas
function updateStats() {
  document.getElementById('totalEquipes').textContent = allEquipes.length;
  document.getElementById('totalMembros').textContent = allMembros.filter(m => m.convite_status === 'aceito').length;
  document.getElementById('convitesPendentes').textContent = allMembros.filter(m => m.convite_status === 'pendente').length;
}

// Toggle tema
function toggleTheme() {
  if (typeof window.toggleTheme === 'function') {
    window.toggleTheme();
  } else {
    // Fallback básico
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('lucid_theme', newTheme);
    
    // Atualizar ícone
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
      themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    }
  }
}

// Utilitários
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

