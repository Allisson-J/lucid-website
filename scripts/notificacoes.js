/* ============================================
   NOTIFICAÇÕES - Sistema de Notificações
   ============================================ */

let allNotifications = [];
let unreadCount = 0;
let notificationCheckInterval = null;
let currentUserId = null;

// Tipos de notificação
const NOTIFICATION_TYPES = {
  lead_novo: { icon: '📧', color: '#3b82f6' },
  projeto_prazo: { icon: '📅', color: '#f59e0b' },
  tarefa_atribuida: { icon: '✅', color: '#10b981' },
  tarefa_comentario: { icon: '💬', color: '#8b5cf6' },
  automacao_erro: { icon: '⚠️', color: '#ef4444' },
  sistema: { icon: '🔔', color: '#6b7280' },
  outro: { icon: '📌', color: '#6366f1' }
};

// Inicializar sistema de notificações
async function initNotifications() {
  try {
    // Obter usuário atual
    let user = await getCurrentUser();
    
    // Se getCurrentUser não retornou ID, tentar obter do localStorage diretamente
    if (!user || !user.id) {
      try {
        const loggedInUserData = localStorage.getItem('loggedInUser');
        if (loggedInUserData) {
          const parsed = JSON.parse(loggedInUserData);
          if (parsed.id) {
            user = { id: parsed.id, email: parsed.email };
          }
        } else {
          // Tentar lucid_auth como fallback
          const authData = localStorage.getItem('lucid_auth');
          if (authData) {
            const parsed = JSON.parse(authData);
            if (parsed.id) {
              user = { id: parsed.id, email: parsed.email };
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Erro ao obter usuário do localStorage:', e);
      }
    }
    
    if (!user || !user.id) {
      console.warn('⚠️ Usuário não autenticado, notificações desabilitadas');
      return;
    }
    
    currentUserId = user.id;
    
    // Carregar notificações
    await loadNotifications();
    
    // Atualizar badge
    updateNotificationBadge();
    
    // Iniciar polling (verificar novas notificações a cada 30 segundos)
    startNotificationPolling();
    
    // Configurar event listeners
    setupNotificationListeners();
    
    console.log('✅ Sistema de notificações inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar notificações:', error);
  }
}

// Carregar notificações
async function loadNotifications() {
  try {
    if (!currentUserId) return;
    
    // Tentar carregar do Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('notificacoes')
            .select('*')
            .eq('usuario_id', currentUserId)
            .order('created_at', { ascending: false })
            .limit(50);
          
          if (!error && data) {
            allNotifications = data;
            unreadCount = data.filter(n => !n.lida).length;
            console.log(`✅ ${data.length} notificação(ões) carregada(s), ${unreadCount} não lida(s)`);
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar do Supabase, usando localStorage:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem(`lucid_notificacoes_${currentUserId}`);
    if (stored) {
      allNotifications = JSON.parse(stored);
      unreadCount = allNotifications.filter(n => !n.lida).length;
      console.log(`✅ Notificações carregadas do localStorage: ${allNotifications.length}`);
    } else {
      allNotifications = [];
      unreadCount = 0;
    }
  } catch (error) {
    console.error('❌ Erro ao carregar notificações:', error);
    allNotifications = [];
    unreadCount = 0;
  }
}

// Criar notificação
async function createNotification(usuarioId, tipo, titulo, mensagem, link = null, dadosExtras = {}) {
  try {
    const notificationData = {
      id: generateId(),
      usuario_id: usuarioId,
      tipo: tipo,
      titulo: titulo,
      mensagem: mensagem,
      link: link,
      lida: false,
      dados_extras: dadosExtras,
      created_at: new Date().toISOString()
    };
    
    // Tentar salvar no Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          // Usar a função helper se disponível, senão inserir diretamente
          const { data, error } = await supabase
            .from('notificacoes')
            .insert([notificationData])
            .select()
            .single();
          
          if (!error && data) {
            console.log('✅ Notificação criada no Supabase');
            // Se for para o usuário atual, recarregar
            if (usuarioId === currentUserId) {
              await loadNotifications();
              updateNotificationBadge();
              renderNotificationDropdown();
            }
            return data.id;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao salvar no Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem(`lucid_notificacoes_${usuarioId}`) || '[]';
    const notifications = JSON.parse(stored);
    notifications.unshift(notificationData);
    localStorage.setItem(`lucid_notificacoes_${usuarioId}`, JSON.stringify(notifications));
    
    // Se for para o usuário atual, atualizar
    if (usuarioId === currentUserId) {
      allNotifications.unshift(notificationData);
      unreadCount++;
      updateNotificationBadge();
      renderNotificationDropdown();
    }
    
    console.log('✅ Notificação criada no localStorage');
    return notificationData.id;
  } catch (error) {
    console.error('❌ Erro ao criar notificação:', error);
    throw error;
  }
}

// Marcar notificação como lida
async function markNotificationAsRead(notificationId) {
  try {
    const notification = allNotifications.find(n => n.id === notificationId);
    if (!notification || notification.lida) return;
    
    notification.lida = true;
    notification.lida_at = new Date().toISOString();
    unreadCount = Math.max(0, unreadCount - 1);
    
    // Tentar salvar no Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          await supabase
            .from('notificacoes')
            .update({ lida: true, lida_at: notification.lida_at })
            .eq('id', notificationId);
        } catch (error) {
          console.warn('⚠️ Erro ao atualizar no Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    if (currentUserId) {
      localStorage.setItem(`lucid_notificacoes_${currentUserId}`, JSON.stringify(allNotifications));
    }
    
    updateNotificationBadge();
    renderNotificationDropdown();
  } catch (error) {
    console.error('❌ Erro ao marcar notificação como lida:', error);
  }
}

// Marcar todas como lidas
async function markAllNotificationsAsRead() {
  try {
    const unread = allNotifications.filter(n => !n.lida);
    if (unread.length === 0) return;
    
    const now = new Date().toISOString();
    unread.forEach(n => {
      n.lida = true;
      n.lida_at = now;
    });
    unreadCount = 0;
    
    // Tentar salvar no Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const unreadIds = unread.map(n => n.id);
          await supabase
            .from('notificacoes')
            .update({ lida: true, lida_at: now })
            .in('id', unreadIds);
        } catch (error) {
          console.warn('⚠️ Erro ao atualizar no Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    if (currentUserId) {
      localStorage.setItem(`lucid_notificacoes_${currentUserId}`, JSON.stringify(allNotifications));
    }
    
    updateNotificationBadge();
    renderNotificationDropdown();
  } catch (error) {
    console.error('❌ Erro ao marcar todas como lidas:', error);
  }
}

// Deletar notificação
async function deleteNotification(notificationId) {
  try {
    allNotifications = allNotifications.filter(n => n.id !== notificationId);
    if (allNotifications.find(n => n.id === notificationId && !n.lida)) {
      unreadCount = Math.max(0, unreadCount - 1);
    }
    
    // Tentar deletar do Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          await supabase
            .from('notificacoes')
            .delete()
            .eq('id', notificationId);
        } catch (error) {
          console.warn('⚠️ Erro ao deletar do Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    if (currentUserId) {
      localStorage.setItem(`lucid_notificacoes_${currentUserId}`, JSON.stringify(allNotifications));
    }
    
    updateNotificationBadge();
    renderNotificationDropdown();
  } catch (error) {
    console.error('❌ Erro ao deletar notificação:', error);
  }
}

// Atualizar badge de notificações
function updateNotificationBadge() {
  const badge = document.getElementById('notificationBadge');
  const count = document.getElementById('notificationCount');
  
  if (badge) {
    if (unreadCount > 0) {
      badge.style.display = 'flex';
      if (count) {
        count.textContent = unreadCount > 99 ? '99+' : unreadCount;
      }
    } else {
      badge.style.display = 'none';
    }
  }
}

// Renderizar dropdown de notificações
function renderNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  if (!dropdown) return;
  
  const unreadNotifications = allNotifications.filter(n => !n.lida).slice(0, 10);
  const recentNotifications = allNotifications.slice(0, 20);
  
  if (allNotifications.length === 0) {
    dropdown.innerHTML = `
      <div class="notification-empty">
        <i class="fas fa-bell-slash"></i>
        <p>Nenhuma notificação</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  if (unreadNotifications.length > 0) {
    html += `
      <div class="notification-section">
        <div class="notification-section-header">
          <span>Não lidas (${unreadNotifications.length})</span>
          <button class="notification-mark-all-read" onclick="if (typeof markAllNotificationsAsRead === 'function') markAllNotificationsAsRead()">
            Marcar todas como lidas
          </button>
        </div>
        ${unreadNotifications.map(n => renderNotificationItem(n)).join('')}
      </div>
    `;
  }
  
  const readNotifications = recentNotifications.filter(n => n.lida);
  if (readNotifications.length > 0) {
    html += `
      <div class="notification-section">
        <div class="notification-section-header">
          <span>Recentes</span>
        </div>
        ${readNotifications.map(n => renderNotificationItem(n)).join('')}
      </div>
    `;
  }
  
  html += `
    <div class="notification-footer">
      <a href="#" onclick="if (typeof openNotificationCenter === 'function') { openNotificationCenter(); return false; }">
        Ver todas as notificações
      </a>
    </div>
  `;
  
  dropdown.innerHTML = html;
  
  // Anexar event listeners
  dropdown.querySelectorAll('.notification-item').forEach(item => {
    const notificationId = item.getAttribute('data-id');
    
    // Click na notificação
    item.addEventListener('click', function(e) {
      if (e.target.closest('.notification-delete')) return;
      if (e.target.closest('.notification-mark-all-read')) return;
      
      const notification = allNotifications.find(n => n.id === notificationId);
      if (notification && !notification.lida) {
        markNotificationAsRead(notificationId);
      }
      
      // Navegar para o link se houver
      if (notification && notification.link) {
        window.location.href = notification.link;
      }
      
      // Fechar dropdown
      closeNotificationDropdown();
    });
    
    // Botão deletar
    const deleteBtn = item.querySelector('.notification-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteNotification(notificationId);
      });
    }
  });
}

// Renderizar item de notificação
function renderNotificationItem(notification) {
  const typeInfo = NOTIFICATION_TYPES[notification.tipo] || NOTIFICATION_TYPES.outro;
  const timeAgo = getTimeAgo(notification.created_at);
  
  return `
    <div class="notification-item ${notification.lida ? '' : 'unread'}" data-id="${notification.id}">
      <div class="notification-icon" style="background: ${typeInfo.color}20; color: ${typeInfo.color};">
        ${typeInfo.icon}
      </div>
      <div class="notification-content">
        <div class="notification-title">${escapeHtml(notification.titulo)}</div>
        <div class="notification-message">${escapeHtml(notification.mensagem)}</div>
        <div class="notification-time">${timeAgo}</div>
      </div>
      <button class="notification-delete" title="Remover">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
}

// Configurar event listeners
function setupNotificationListeners() {
  // Botão de notificações
  const notificationBtn = document.getElementById('notificationButton');
  const dropdown = document.getElementById('notificationDropdown');
  
  if (notificationBtn && dropdown) {
    notificationBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleNotificationDropdown();
    });
    
    // Fechar ao clicar fora
    document.addEventListener('click', function(e) {
      if (!notificationBtn.contains(e.target) && !dropdown.contains(e.target)) {
        closeNotificationDropdown();
      }
    });
  }
}

// Toggle dropdown
function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  if (!dropdown) return;
  
  if (dropdown.classList.contains('active')) {
    closeNotificationDropdown();
  } else {
    openNotificationDropdown();
  }
}

// Abrir dropdown
function openNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    renderNotificationDropdown();
    dropdown.classList.add('active');
  }
}

// Fechar dropdown
function closeNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.remove('active');
  }
}

// Abrir centro de notificações (modal)
window.openNotificationCenter = function() {
  const modal = document.getElementById('notificationCenterModal');
  if (modal) {
    modal.classList.add('active');
    renderNotificationCenter();
  }
  closeNotificationDropdown();
}

// Fechar centro de notificações
window.closeNotificationCenter = function() {
  const modal = document.getElementById('notificationCenterModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Renderizar centro de notificações
function renderNotificationCenter() {
  const container = document.getElementById('notificationCenterList');
  if (!container) return;
  
  if (allNotifications.length === 0) {
    container.innerHTML = `
      <div class="notification-center-empty">
        <i class="fas fa-bell-slash"></i>
        <h3>Nenhuma notificação</h3>
        <p>Você não tem notificações no momento.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = allNotifications.map(n => renderNotificationItem(n)).join('');
  
  // Anexar event listeners
  container.querySelectorAll('.notification-item').forEach(item => {
    const notificationId = item.getAttribute('data-id');
    
    item.addEventListener('click', function(e) {
      if (e.target.closest('.notification-delete')) return;
      
      const notification = allNotifications.find(n => n.id === notificationId);
      if (notification && !notification.lida) {
        markNotificationAsRead(notificationId);
        item.classList.remove('unread');
      }
      
      if (notification && notification.link) {
        window.location.href = notification.link;
      }
    });
    
    const deleteBtn = item.querySelector('.notification-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteNotification(notificationId);
        renderNotificationCenter();
      });
    }
  });
}

// Iniciar polling de notificações
function startNotificationPolling() {
  // Verificar a cada 30 segundos
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
  }
  
  notificationCheckInterval = setInterval(async () => {
    try {
      await loadNotifications();
      updateNotificationBadge();
      
      // Atualizar dropdown se estiver aberto
      const dropdown = document.getElementById('notificationDropdown');
      if (dropdown && dropdown.classList.contains('active')) {
        renderNotificationDropdown();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar notificações:', error);
    }
  }, 30000); // 30 segundos
}

// Parar polling
function stopNotificationPolling() {
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
    notificationCheckInterval = null;
  }
}

// Utilitários
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getTimeAgo(dateString) {
  if (!dateString) return 'Agora';
  
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `Há ${diffMins} min`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays < 7) return `Há ${diffDays} dia(s)`;
  
  return date.toLocaleDateString('pt-BR');
}

// Funções globais para acesso
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.createNotification = createNotification;

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotifications);
} else {
  // DOM já está pronto
  setTimeout(initNotifications, 1000); // Aguardar um pouco para garantir que auth.js está carregado
}

