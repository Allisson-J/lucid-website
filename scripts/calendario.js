/* ============================================
   CALENDÁRIO - Sistema de Calendário Compartilhado
   ============================================ */

let allEventos = [];
let currentView = 'month';
let currentDate = new Date();
let currentEditingId = null;
let currentUser = null;

// Tipos de eventos
const TIPO_EVENTOS = {
  projeto: { label: 'Projeto', icon: '📁', color: '#3b82f6' },
  equipe: { label: 'Equipe', icon: '👥', color: '#10b981' },
  reuniao: { label: 'Reunião', icon: '💼', color: '#f59e0b' },
  evento_pessoal: { label: 'Pessoal', icon: '👤', color: '#8b5cf6' },
  prazo: { label: 'Prazo', icon: '⏰', color: '#ef4444' },
  lembrete: { label: 'Lembrete', icon: '🔔', color: '#06b6d4' }
};

// Nomes dos meses em português
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DIAS_SEMANA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Sistema de Calendário inicializando...');
  
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
  await loadEventos();
  await loadProjetosForSelect();
  await loadEquipesForSelect();
  
  // Renderizar calendário
  renderCalendar();
  updateDateRange();
  
  // Mostrar informações do usuário
  const userInfoEl = document.getElementById('userInfo');
  if (userInfoEl && currentUser) {
    userInfoEl.textContent = currentUser.email || 'Usuário';
  }
  
  console.log('✅ Sistema de Calendário carregado!');
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

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR');
}

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function toISOStringLocal(date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date - tzOffset).toISOString().slice(0, -1);
  return localISOTime.slice(0, 16); // Remove seconds and timezone
}

function fromISOStringLocal(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date;
}

// Configurar event listeners
function setupEventListeners() {
  // Botões de visualização
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const view = this.getAttribute('data-view');
      switchView(view);
    });
  });
  
  // Navegação
  document.getElementById('btnPrev').addEventListener('click', () => {
    navigateDate(-1);
  });
  
  document.getElementById('btnNext').addEventListener('click', () => {
    navigateDate(1);
  });
  
  document.getElementById('btnToday').addEventListener('click', () => {
    currentDate = new Date();
    renderCalendar();
    updateDateRange();
  });
  
  // Filtro de tipo
  document.getElementById('filterTipo').addEventListener('change', () => {
    renderCalendar();
  });
  
  // Modal novo evento
  document.getElementById('btnNovoEvento').addEventListener('click', () => {
    openEventModal();
  });
  
  document.getElementById('eventModalClose').addEventListener('click', closeEventModal);
  document.getElementById('btnCancelEvent').addEventListener('click', closeEventModal);
  
  document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);
  
  // Campo dia inteiro
  document.getElementById('eventDiaInteiro').addEventListener('change', function() {
    const datesRow = document.getElementById('eventDatesRow');
    if (this.checked) {
      datesRow.querySelectorAll('input[type="datetime-local"]').forEach(input => {
        input.type = 'date';
      });
    } else {
      datesRow.querySelectorAll('input[type="date"]').forEach(input => {
        input.type = 'datetime-local';
      });
    }
  });
  
  // Tipo de evento - mostrar/ocultar campos relacionados
  document.getElementById('eventTipo').addEventListener('change', function() {
    const tipo = this.value;
    const projetoGroup = document.getElementById('eventProjetoGroup');
    const equipeGroup = document.getElementById('eventEquipeGroup');
    
    if (tipo === 'projeto') {
      projetoGroup.style.display = 'block';
      equipeGroup.style.display = 'none';
    } else if (tipo === 'equipe') {
      projetoGroup.style.display = 'none';
      equipeGroup.style.display = 'block';
    } else {
      projetoGroup.style.display = 'none';
      equipeGroup.style.display = 'none';
    }
  });
  
  // Modal detalhes
  document.getElementById('eventDetailsClose').addEventListener('click', closeEventDetailsModal);
  document.getElementById('btnCloseEventDetails').addEventListener('click', closeEventDetailsModal);
  document.getElementById('btnEditEvent').addEventListener('click', editEventFromDetails);
  document.getElementById('btnDeleteEvent').addEventListener('click', deleteEventFromDetails);
  
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
  
  // Fechar modais ao clicar fora
  document.getElementById('eventModal').addEventListener('click', function(e) {
    if (e.target === this) closeEventModal();
  });
  
  document.getElementById('eventDetailsModal').addEventListener('click', function(e) {
    if (e.target === this) closeEventDetailsModal();
  });
}

// Carregar eventos
async function loadEventos() {
  try {
    // Tentar carregar do Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('eventos_calendario')
            .select('*')
            .order('data_inicio', { ascending: true });
          
          if (!error && data) {
            allEventos = data;
            console.log(`✅ ${data.length} evento(s) carregado(s) do Supabase`);
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar do Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem('lucid_eventos_calendario');
    if (stored) {
      allEventos = JSON.parse(stored);
    } else {
      allEventos = [];
    }
  } catch (error) {
    console.error('❌ Erro ao carregar eventos:', error);
    allEventos = [];
  }
}

// Salvar eventos
async function saveEventos() {
  try {
    // Tentar salvar no Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          // Sincronizar eventos com Supabase
          for (const evento of allEventos) {
            const { id, created_at, updated_at, ...eventoData } = evento;
            
            const { data: existing } = await supabase
              .from('eventos_calendario')
              .select('id')
              .eq('id', id)
              .single();
            
            if (existing) {
              await supabase
                .from('eventos_calendario')
                .update({
                  ...eventoData,
                  updated_at: new Date().toISOString()
                })
                .eq('id', id);
            } else {
              await supabase
                .from('eventos_calendario')
                .insert([{ id: id, ...eventoData }]);
            }
          }
          
          console.log('✅ Eventos sincronizados com Supabase');
          return;
        } catch (error) {
          console.warn('⚠️ Erro ao salvar no Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    localStorage.setItem('lucid_eventos_calendario', JSON.stringify(allEventos));
  } catch (error) {
    console.error('❌ Erro ao salvar eventos:', error);
  }
}

// Carregar projetos para select
async function loadProjetosForSelect() {
  try {
    let projetos = [];
    
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        const { data } = await supabase
          .from('projetos')
          .select('id, nome')
          .order('nome');
        
        if (data) projetos = data;
      }
    }
    
    const select = document.getElementById('eventProjeto');
    if (select) {
      select.innerHTML = '<option value="">Nenhum</option>' +
        projetos.map(p => `<option value="${p.id}">${p.nome || p.titulo || 'Projeto sem nome'}</option>`).join('');
    }
  } catch (error) {
    console.warn('⚠️ Erro ao carregar projetos:', error);
  }
}

// Carregar equipes para select
async function loadEquipesForSelect() {
  try {
    let equipes = [];
    
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        const { data } = await supabase
          .from('equipes')
          .select('id, nome')
          .eq('ativa', true)
          .order('nome');
        
        if (data) equipes = data;
      }
    }
    
    const select = document.getElementById('eventEquipe');
    if (select) {
      select.innerHTML = '<option value="">Nenhuma</option>' +
        equipes.map(e => `<option value="${e.id}">${e.nome || 'Equipe sem nome'}</option>`).join('');
    }
  } catch (error) {
    console.warn('⚠️ Erro ao carregar equipes:', error);
  }
}

// Alternar visualização
function switchView(view) {
  currentView = view;
  
  // Atualizar botões
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === view);
  });
  
  // Atualizar containers
  document.querySelectorAll('.calendario-view').forEach(container => {
    container.classList.remove('active');
  });
  
  const containerId = `view${view.charAt(0).toUpperCase() + view.slice(1)}Container`;
  const container = document.getElementById(containerId);
  if (container) container.classList.add('active');
  
  renderCalendar();
  updateDateRange();
}

// Navegar datas
function navigateDate(direction) {
  if (currentView === 'month') {
    currentDate.setMonth(currentDate.getMonth() + direction);
  } else if (currentView === 'week') {
    currentDate.setDate(currentDate.getDate() + (direction * 7));
  } else if (currentView === 'day') {
    currentDate.setDate(currentDate.getDate() + direction);
  }
  
  renderCalendar();
  updateDateRange();
}

// Atualizar range de datas exibido
function updateDateRange() {
  const rangeEl = document.getElementById('currentDateRange');
  if (!rangeEl) return;
  
  if (currentView === 'month') {
    const mes = MESES[currentDate.getMonth()];
    const ano = currentDate.getFullYear();
    rangeEl.textContent = `${mes} ${ano}`;
  } else if (currentView === 'week') {
    const start = getWeekStart(currentDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    rangeEl.textContent = `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`;
  } else if (currentView === 'day') {
    rangeEl.textContent = formatDate(currentDate.toISOString());
  } else {
    rangeEl.textContent = 'Todos os Eventos';
  }
}

// Obter início da semana
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

// Renderizar calendário
function renderCalendar() {
  const tipoFilter = document.getElementById('filterTipo').value;
  const eventosFiltrados = tipoFilter === 'all' 
    ? allEventos 
    : allEventos.filter(e => e.tipo === tipoFilter);
  
  if (currentView === 'month') {
    renderMonthView(eventosFiltrados);
  } else if (currentView === 'week') {
    renderWeekView(eventosFiltrados);
  } else if (currentView === 'day') {
    renderDayView(eventosFiltrados);
  } else if (currentView === 'list') {
    renderListView(eventosFiltrados);
  }
}

// Renderizar visualização mensal
function renderMonthView(eventos) {
  const grid = document.getElementById('monthGrid');
  if (!grid) return;
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  grid.innerHTML = '';
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const isCurrentMonth = date.getMonth() === month;
    const isToday = date.getTime() === today.getTime();
    
    const dayEvents = eventos.filter(e => {
      const eventDate = new Date(e.data_inicio);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === date.getTime();
    });
    
    const cell = document.createElement('div');
    cell.className = 'calendario-day-cell';
    if (!isCurrentMonth) cell.classList.add('other-month');
    if (isToday) cell.classList.add('today');
    
    cell.innerHTML = `
      <div class="day-number">${date.getDate()}</div>
      <div class="day-events">
        ${dayEvents.slice(0, 3).map(e => `
          <div class="day-event" style="background: ${e.cor || TIPO_EVENTOS[e.tipo]?.color || '#3b82f6'}; border-left-color: ${e.cor || TIPO_EVENTOS[e.tipo]?.color || '#3b82f6'};" 
               data-id="${e.id}" title="${escapeHtml(e.titulo)}">
            ${escapeHtml(e.titulo)}
          </div>
        `).join('')}
        ${dayEvents.length > 3 ? `<div class="day-event" style="background: rgba(77,166,255,0.3); border-left-color: #4da6ff;">+${dayEvents.length - 3} mais</div>` : ''}
      </div>
    `;
    
    cell.addEventListener('click', () => {
      if (dayEvents.length > 0) {
        openEventDetails(dayEvents[0].id);
      }
    });
    
    grid.appendChild(cell);
  }
}

// Renderizar visualização semanal (simplificada)
function renderWeekView(eventos) {
  const container = document.getElementById('weekEventsContainer');
  const header = document.getElementById('weekDaysHeader');
  if (!container || !header) return;
  
  const weekStart = getWeekStart(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  header.innerHTML = '';
  container.innerHTML = '';
  
  // Criar cabeçalhos dos dias
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const isToday = date.getTime() === today.getTime();
    
    const dayHeader = document.createElement('div');
    dayHeader.className = 'week-day-header' + (isToday ? ' today' : '');
    dayHeader.innerHTML = `
      <div class="week-day-name">${DIAS_SEMANA_CURTO[date.getDay()]}</div>
      <div class="week-day-number">${date.getDate()}</div>
    `;
    header.appendChild(dayHeader);
    
    // Criar coluna de eventos
    const column = document.createElement('div');
    column.className = 'week-day-column';
    column.setAttribute('data-date', date.toISOString().split('T')[0]);
    
    const dayEvents = eventos.filter(e => {
      const eventDate = new Date(e.data_inicio);
      return eventDate.toDateString() === date.toDateString();
    });
    
    dayEvents.forEach(e => {
      const eventEl = document.createElement('div');
      eventEl.className = 'week-event';
      eventEl.style.background = e.cor || TIPO_EVENTOS[e.tipo]?.color || '#3b82f6';
      eventEl.style.borderLeftColor = e.cor || TIPO_EVENTOS[e.tipo]?.color || '#3b82f6';
      
      const start = new Date(e.data_inicio);
      const top = (start.getHours() * 60 + start.getMinutes()) * 0.5; // 60px por hora = 0.5px por minuto
      const duration = e.data_fim ? (new Date(e.data_fim) - start) / 60000 : 60; // minutos
      const height = Math.max(duration * 0.5, 30);
      
      eventEl.style.top = `${top}px`;
      eventEl.style.height = `${height}px`;
      eventEl.setAttribute('data-id', e.id);
      eventEl.innerHTML = `
        <div style="font-weight: 600; font-size: 0.75rem;">${escapeHtml(e.titulo)}</div>
        <div style="font-size: 0.7rem; opacity: 0.9;">${formatTime(e.data_inicio)}</div>
      `;
      
      eventEl.addEventListener('click', () => openEventDetails(e.id));
      column.appendChild(eventEl);
    });
    
    container.appendChild(column);
  }
  
  // Criar slots de tempo
  const timeSlots = document.getElementById('timeSlots');
  if (timeSlots) {
    timeSlots.innerHTML = '';
    for (let hour = 0; hour < 24; hour++) {
      const slot = document.createElement('div');
      slot.className = 'time-slot';
      slot.textContent = `${hour.toString().padStart(2, '0')}:00`;
      timeSlots.appendChild(slot);
    }
  }
}

// Renderizar visualização diária (simplificada)
function renderDayView(eventos) {
  const container = document.getElementById('dayEventsContainer');
  const dateHeader = document.getElementById('dayDate');
  if (!container || !dateHeader) return;
  
  const dateStr = currentDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  dateHeader.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  
  const dayEvents = eventos.filter(e => {
    const eventDate = new Date(e.data_inicio);
    return eventDate.toDateString() === currentDate.toDateString();
  }).sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio));
  
  container.innerHTML = '';
  
  dayEvents.forEach(e => {
    const eventEl = document.createElement('div');
    eventEl.className = 'day-event-item';
    eventEl.style.background = e.cor || TIPO_EVENTOS[e.tipo]?.color || '#3b82f6';
    eventEl.style.borderLeftColor = e.cor || TIPO_EVENTOS[e.tipo]?.color || '#3b82f6';
    
    const start = new Date(e.data_inicio);
    const top = (start.getHours() * 60 + start.getMinutes()) * 0.5;
    const duration = e.data_fim ? (new Date(e.data_fim) - start) / 60000 : 60;
    const height = Math.max(duration * 0.5, 50);
    
    eventEl.style.top = `${top}px`;
    eventEl.style.height = `${height}px`;
    eventEl.setAttribute('data-id', e.id);
    eventEl.innerHTML = `
      <div class="day-event-time">${formatTime(e.data_inicio)}${e.data_fim ? ' - ' + formatTime(e.data_fim) : ''}</div>
      <div class="day-event-title">${escapeHtml(e.titulo)}</div>
    `;
    
    eventEl.addEventListener('click', () => openEventDetails(e.id));
    container.appendChild(eventEl);
  });
  
  // Criar slots de tempo
  const timeSlots = document.getElementById('dayTimeSlots');
  if (timeSlots) {
    timeSlots.innerHTML = '';
    for (let hour = 0; hour < 24; hour++) {
      const slot = document.createElement('div');
      slot.className = 'time-slot';
      slot.textContent = `${hour.toString().padStart(2, '0')}:00`;
      timeSlots.appendChild(slot);
    }
  }
}

// Renderizar visualização em lista
function renderListView(eventos) {
  const list = document.getElementById('eventsList');
  if (!list) return;
  
  const sorted = [...eventos].sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio));
  
  if (sorted.length === 0) {
    list.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">Nenhum evento encontrado.</div>';
    return;
  }
  
  list.innerHTML = sorted.map(e => {
    const tipoInfo = TIPO_EVENTOS[e.tipo] || { label: e.tipo, icon: '📅', color: '#3b82f6' };
    return `
      <div class="event-list-item" style="border-left-color: ${e.cor || tipoInfo.color};" data-id="${e.id}">
        <div class="event-list-header">
          <div class="event-list-title">${escapeHtml(e.titulo)}</div>
          <div class="event-list-date">${formatDateTime(e.data_inicio)}</div>
        </div>
        ${e.descricao ? `<div class="event-list-description">${escapeHtml(e.descricao)}</div>` : ''}
        <div class="event-list-meta">
          <div class="event-list-meta-item">
            <i class="fas fa-tag"></i>
            <span>${tipoInfo.icon} ${tipoInfo.label}</span>
          </div>
          ${e.local ? `<div class="event-list-meta-item"><i class="fas fa-map-marker-alt"></i><span>${escapeHtml(e.local)}</span></div>` : ''}
          ${e.participantes && e.participantes.length > 0 ? `<div class="event-list-meta-item"><i class="fas fa-users"></i><span>${e.participantes.length} participante(s)</span></div>` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  list.querySelectorAll('.event-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id');
      openEventDetails(id);
    });
  });
}

// Abrir modal de evento
function openEventModal(evento = null) {
  const modal = document.getElementById('eventModal');
  const form = document.getElementById('eventForm');
  const title = document.getElementById('eventModalTitle');
  
  if (!modal || !form) return;
  
  currentEditingId = evento ? evento.id : null;
  
  if (evento) {
    title.textContent = 'Editar Evento';
    form.eventTitulo.value = evento.titulo || '';
    form.eventDescricao.value = evento.descricao || '';
    form.eventTipo.value = evento.tipo || 'evento_pessoal';
    form.eventCor.value = evento.cor || '#3b82f6';
    form.eventDiaInteiro.checked = evento.dia_inteiro || false;
    form.eventLocal.value = evento.local || '';
    form.eventParticipantes.value = Array.isArray(evento.participantes) ? evento.participantes.join(', ') : '';
    form.eventProjeto.value = evento.projeto_id || '';
    form.eventEquipe.value = evento.equipe_id || '';
    
    const startDate = new Date(evento.data_inicio);
    const startStr = toISOStringLocal(startDate);
    form.eventDataInicio.value = startStr;
    
    if (evento.data_fim) {
      const endDate = new Date(evento.data_fim);
      const endStr = toISOStringLocal(endDate);
      form.eventDataFim.value = endStr;
    }
    
    // Trigger change para atualizar campos
    form.eventTipo.dispatchEvent(new Event('change'));
    form.eventDiaInteiro.dispatchEvent(new Event('change'));
  } else {
    title.textContent = 'Novo Evento';
    form.reset();
    const now = new Date();
    form.eventDataInicio.value = toISOStringLocal(now);
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    form.eventDataFim.value = toISOStringLocal(oneHourLater);
    form.eventCor.value = '#3b82f6';
  }
  
  modal.classList.add('active');
}

// Fechar modal de evento
function closeEventModal() {
  const modal = document.getElementById('eventModal');
  if (modal) {
    modal.classList.remove('active');
    currentEditingId = null;
  }
}

// Submeter formulário de evento
async function handleEventSubmit(e) {
  e.preventDefault();
  
  try {
    const form = e.target;
    const formData = new FormData(form);
    
    const eventoData = {
      titulo: formData.get('titulo'),
      descricao: formData.get('descricao') || null,
      tipo: formData.get('tipo'),
      cor: formData.get('cor') || '#3b82f6',
      dia_inteiro: formData.get('dia_inteiro') === 'on',
      local: formData.get('local') || null,
      participantes: formData.get('participantes') 
        ? formData.get('participantes').split(',').map(e => e.trim()).filter(e => e)
        : [],
      projeto_id: formData.get('projeto_id') || null,
      equipe_id: formData.get('equipe_id') || null,
      criado_por: currentUser?.id || null,
      criado_por_email: currentUser?.email || null
    };
    
    const startInput = formData.get('data_inicio');
    const endInput = formData.get('data_fim');
    
    if (eventoData.dia_inteiro) {
      const startDate = new Date(startInput);
      startDate.setHours(0, 0, 0, 0);
      eventoData.data_inicio = startDate.toISOString();
      
      if (endInput) {
        const endDate = new Date(endInput);
        endDate.setHours(23, 59, 59, 999);
        eventoData.data_fim = endDate.toISOString();
      }
    } else {
      eventoData.data_inicio = new Date(startInput).toISOString();
      eventoData.data_fim = endInput ? new Date(endInput).toISOString() : null;
    }
    
    if (currentEditingId) {
      // Editar evento existente
      const index = allEventos.findIndex(e => e.id === currentEditingId);
      if (index !== -1) {
        allEventos[index] = {
          ...allEventos[index],
          ...eventoData,
          updated_at: new Date().toISOString()
        };
      }
    } else {
      // Criar novo evento
      const novoEvento = {
        id: generateId(),
        ...eventoData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      allEventos.push(novoEvento);
    }
    
    await saveEventos();
    await loadEventos();
    renderCalendar();
    closeEventModal();
    
    if (typeof showToast !== 'undefined') {
      showToast(currentEditingId ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!', 'success');
    } else {
      alert(currentEditingId ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao salvar evento:', error);
    if (typeof showToast !== 'undefined') {
      showToast('Erro ao salvar evento.', 'error');
    } else {
      alert('Erro ao salvar evento.');
    }
  }
}

// Abrir detalhes do evento
function openEventDetails(eventoId) {
  const evento = allEventos.find(e => e.id === eventoId);
  if (!evento) return;
  
  const modal = document.getElementById('eventDetailsModal');
  const title = document.getElementById('eventDetailsTitle');
  const content = document.getElementById('eventDetailsContent');
  
  if (!modal || !title || !content) return;
  
  const tipoInfo = TIPO_EVENTOS[evento.tipo] || { label: evento.tipo, icon: '📅', color: '#3b82f6' };
  
  title.textContent = evento.titulo;
  title.style.color = evento.cor || tipoInfo.color;
  
  content.innerHTML = `
    <div class="event-details-section">
      <h4>Informações</h4>
      <p><strong>Tipo:</strong> ${tipoInfo.icon} ${tipoInfo.label}</p>
      <p><strong>Data de Início:</strong> ${formatDateTime(evento.data_inicio)}</p>
      ${evento.data_fim ? `<p><strong>Data de Fim:</strong> ${formatDateTime(evento.data_fim)}</p>` : ''}
      ${evento.dia_inteiro ? '<p><strong>Dia Inteiro:</strong> Sim</p>' : ''}
      ${evento.local ? `<p><strong>Local:</strong> ${escapeHtml(evento.local)}</p>` : ''}
    </div>
    
    ${evento.descricao ? `
    <div class="event-details-section">
      <h4>Descrição</h4>
      <p>${escapeHtml(evento.descricao)}</p>
    </div>
    ` : ''}
    
    ${evento.participantes && evento.participantes.length > 0 ? `
    <div class="event-details-section">
      <h4>Participantes</h4>
      <div class="event-details-participants">
        ${evento.participantes.map(p => `<span class="event-participant">${escapeHtml(p)}</span>`).join('')}
      </div>
    </div>
    ` : ''}
  `;
  
  // Armazenar ID para edição/exclusão
  modal.setAttribute('data-event-id', eventoId);
  modal.classList.add('active');
}

// Fechar modal de detalhes
function closeEventDetailsModal() {
  const modal = document.getElementById('eventDetailsModal');
  if (modal) {
    modal.classList.remove('active');
    modal.removeAttribute('data-event-id');
  }
}

// Editar evento a partir dos detalhes
function editEventFromDetails() {
  const modal = document.getElementById('eventDetailsModal');
  const eventoId = modal.getAttribute('data-event-id');
  if (!eventoId) return;
  
  const evento = allEventos.find(e => e.id === eventoId);
  if (!evento) return;
  
  closeEventDetailsModal();
  openEventModal(evento);
}

// Deletar evento a partir dos detalhes
async function deleteEventFromDetails() {
  const modal = document.getElementById('eventDetailsModal');
  const eventoId = modal.getAttribute('data-event-id');
  if (!eventoId) return;
  
  if (!confirm('Deseja realmente excluir este evento?')) return;
  
  try {
    // Remover do Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        await supabase
          .from('eventos_calendario')
          .delete()
          .eq('id', eventoId);
      }
    }
    
    // Remover da lista local
    allEventos = allEventos.filter(e => e.id !== eventoId);
    await saveEventos();
    await loadEventos();
    renderCalendar();
    closeEventDetailsModal();
    
    if (typeof showToast !== 'undefined') {
      showToast('Evento excluído com sucesso!', 'success');
    } else {
      alert('Evento excluído com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    if (typeof showToast !== 'undefined') {
      showToast('Erro ao excluir evento.', 'error');
    } else {
      alert('Erro ao excluir evento.');
    }
  }
}

