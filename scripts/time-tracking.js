/* ============================================
   TIME TRACKING - Sistema de Rastreamento de Tempo
   ============================================ */

let allTimeRecords = [];
let allProjetos = [];
let allTarefas = [];
let currentUser = null;

// Estado do timer
let timerState = {
  running: false,
  paused: false,
  startTime: null,
  pausedTime: 0,
  currentRecord: null,
  intervalId: null
};

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Sistema de Time Tracking inicializando...');
  
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
  await renderTimeRecords();
  updateStats();
  loadTimerFromStorage();
  
  // Mostrar informações do usuário
  const userInfoEl = document.getElementById('userInfo');
  if (userInfoEl && currentUser) {
    userInfoEl.textContent = currentUser.email || 'Usuário';
  }
  
  console.log('✅ Sistema de Time Tracking carregado!');
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

function formatTime(hours) {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h}h ${m}m`;
}

function formatTimeDisplay(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function showToast(message, type = 'info') {
  // Verificar se existe função global
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
    return;
  }
  
  // Fallback: criar toast básico
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
  // Timer controls
  document.getElementById('btnStartTimer').addEventListener('click', startTimer);
  document.getElementById('btnPauseTimer').addEventListener('click', pauseTimer);
  document.getElementById('btnStopTimer').addEventListener('click', stopTimer);
  
  // Projeto change - atualizar tarefas
  document.getElementById('timerProjeto').addEventListener('change', function() {
    updateTarefasForProjeto(this.value);
  });
  
  // Filtros
  document.getElementById('btnFiltrar').addEventListener('click', async () => {
    await renderTimeRecords();
    updateStats();
  });
  
  // Relatórios
  document.getElementById('btnRelatorios').addEventListener('click', openReportsModal);
  document.getElementById('reportsModalClose').addEventListener('click', closeReportsModal);
  
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchReportTab(tabName);
    });
  });
  
  // Exportar
  document.getElementById('btnExportar').addEventListener('click', exportTimeRecords);
  
  // Modal editar
  document.getElementById('editRecordModalClose').addEventListener('click', closeEditModal);
  document.getElementById('btnCancelEdit').addEventListener('click', closeEditModal);
  document.getElementById('editRecordForm').addEventListener('submit', handleEditRecord);
  
  document.getElementById('editProjeto').addEventListener('change', function() {
    updateTarefasForProjetoEdit(this.value);
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
  
  // Fechar modais ao clicar fora
  document.getElementById('editRecordModal').addEventListener('click', function(e) {
    if (e.target === this) closeEditModal();
  });
  
  document.getElementById('reportsModal').addEventListener('click', function(e) {
    if (e.target === this) closeReportsModal();
  });
}

// Carregar todos os dados
async function loadAllData() {
  await Promise.all([
    loadProjetos(),
    loadTarefas(),
    loadTimeRecords()
  ]);
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
            populateProjetosSelect();
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar projetos do Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem('lucid_projetos');
    allProjetos = stored ? JSON.parse(stored) : [];
    populateProjetosSelect();
  } catch (error) {
    console.error('❌ Erro ao carregar projetos:', error);
    allProjetos = [];
  }
}

// Carregar tarefas
async function loadTarefas() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('tarefas')
            .select('*')
            .order('titulo', { ascending: true });
          
          if (!error && data) {
            allTarefas = data;
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar tarefas do Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem('lucid_tarefas');
    allTarefas = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Erro ao carregar tarefas:', error);
    allTarefas = [];
  }
}

// Carregar registros de tempo
async function loadTimeRecords() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('tempo_trabalho')
            .select('*')
            .eq('usuario_email', currentUser.email)
            .order('data_trabalho', { ascending: false });
          
          if (!error && data) {
            allTimeRecords = data;
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar registros do Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem(`lucid_tempo_trabalho_${currentUser.email}`);
    allTimeRecords = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Erro ao carregar registros:', error);
    allTimeRecords = [];
  }
}

// Salvar registros de tempo
async function saveTimeRecords() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          // Sincronizar registros
          for (const record of allTimeRecords) {
            const { id, created_at, updated_at, ...recordData } = record;
            
            const { data: existing } = await supabase
              .from('tempo_trabalho')
              .select('id')
              .eq('id', id)
              .single();
            
            if (existing) {
              await supabase
                .from('tempo_trabalho')
                .update({
                  ...recordData,
                  updated_at: new Date().toISOString()
                })
                .eq('id', id);
            } else {
              await supabase
                .from('tempo_trabalho')
                .insert([{ id: id, ...recordData }]);
            }
          }
          
          console.log('✅ Registros sincronizados com Supabase');
          return;
        } catch (error) {
          console.warn('⚠️ Erro ao salvar no Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    localStorage.setItem(`lucid_tempo_trabalho_${currentUser.email}`, JSON.stringify(allTimeRecords));
  } catch (error) {
    console.error('❌ Erro ao salvar registros:', error);
  }
}

// Popular select de projetos
function populateProjetosSelect() {
  const selectTimer = document.getElementById('timerProjeto');
  const selectFilter = document.getElementById('filterProjeto');
  const selectEdit = document.getElementById('editProjeto');
  
  const options = '<option value="">Selecione um projeto</option>' +
    allProjetos.map(p => `<option value="${p.id}">${p.nome || p.titulo || 'Projeto sem nome'}</option>`).join('');
  
  if (selectTimer) selectTimer.innerHTML = options;
  if (selectFilter) {
    selectFilter.innerHTML = '<option value="">Todos os Projetos</option>' +
      allProjetos.map(p => `<option value="${p.id}">${p.nome || p.titulo || 'Projeto sem nome'}</option>`).join('');
  }
  if (selectEdit) selectEdit.innerHTML = options;
}

// Atualizar tarefas para projeto (timer)
function updateTarefasForProjeto(projetoId) {
  const select = document.getElementById('timerTarefa');
  if (!select) return;
  
  if (!projetoId) {
    select.innerHTML = '<option value="">Nenhuma tarefa (opcional)</option>';
    return;
  }
  
  const tarefasProjeto = allTarefas.filter(t => t.projeto_id === projetoId);
  select.innerHTML = '<option value="">Nenhuma tarefa (opcional)</option>' +
    tarefasProjeto.map(t => `<option value="${t.id}">${escapeHtml(t.titulo || 'Tarefa sem título')}</option>`).join('');
}

// Atualizar tarefas para projeto (editar)
function updateTarefasForProjetoEdit(projetoId) {
  const select = document.getElementById('editTarefa');
  if (!select) return;
  
  if (!projetoId) {
    select.innerHTML = '<option value="">Nenhuma tarefa</option>';
    return;
  }
  
  const tarefasProjeto = allTarefas.filter(t => t.projeto_id === projetoId);
  select.innerHTML = '<option value="">Nenhuma tarefa</option>' +
    tarefasProjeto.map(t => `<option value="${t.id}">${escapeHtml(t.titulo || 'Tarefa sem título')}</option>`).join('');
}

// Iniciar timer
function startTimer() {
  const projetoId = document.getElementById('timerProjeto').value;
  if (!projetoId) {
    alert('Por favor, selecione um projeto.');
    return;
  }
  
  timerState.running = true;
  timerState.paused = false;
  timerState.startTime = new Date();
  timerState.pausedTime = 0;
  
  // Criar registro temporário
  timerState.currentRecord = {
    id: generateId(),
    usuario_id: currentUser.id,
    usuario_email: currentUser.email,
    projeto_id: projetoId,
    tarefa_id: document.getElementById('timerTarefa').value || null,
    descricao: document.getElementById('timerDescricao').value || null,
    data_trabalho: new Date().toISOString().split('T')[0],
    tempo_inicio: timerState.startTime.toISOString(),
    tempo_fim: null,
    duracao_minutos: 0,
    pausado: false,
    faturado: false
  };
  
  // Atualizar UI
  document.getElementById('btnStartTimer').style.display = 'none';
  document.getElementById('btnPauseTimer').style.display = 'inline-flex';
  document.getElementById('btnStopTimer').style.display = 'inline-flex';
  document.getElementById('timerProjeto').disabled = true;
  document.getElementById('timerTarefa').disabled = true;
  document.getElementById('timerDescricao').disabled = true;
  
  const statusIndicator = document.querySelector('.status-indicator');
  const statusText = document.getElementById('timerStatus');
  statusIndicator.classList.add('running');
  statusIndicator.classList.remove('paused');
  statusText.innerHTML = '<span class="status-indicator running"></span> Em execução';
  
  // Iniciar contador
  timerState.intervalId = setInterval(updateTimer, 1000);
  updateTimer();
  
  // Salvar estado no localStorage
  saveTimerToStorage();
}

// Pausar timer
function pauseTimer() {
  if (!timerState.running) return;
  
  timerState.paused = !timerState.paused;
  
  if (timerState.paused) {
    // Pausar
    clearInterval(timerState.intervalId);
    timerState.pausedTime = Math.floor((new Date() - timerState.startTime) / 1000);
    
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('timerStatus');
    statusIndicator.classList.remove('running');
    statusIndicator.classList.add('paused');
    statusText.innerHTML = '<span class="status-indicator paused"></span> Pausado';
    
    document.getElementById('btnPauseTimer').innerHTML = '<i class="fas fa-play"></i> Continuar';
  } else {
    // Continuar
    timerState.startTime = new Date(Date.now() - timerState.pausedTime * 1000);
    timerState.intervalId = setInterval(updateTimer, 1000);
    updateTimer();
    
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('timerStatus');
    statusIndicator.classList.remove('paused');
    statusIndicator.classList.add('running');
    statusText.innerHTML = '<span class="status-indicator running"></span> Em execução';
    
    document.getElementById('btnPauseTimer').innerHTML = '<i class="fas fa-pause"></i> Pausar';
  }
  
  saveTimerToStorage();
}

// Parar timer
async function stopTimer() {
  if (!timerState.running) return;
  
  clearInterval(timerState.intervalId);
  
  const endTime = new Date();
  const durationSeconds = Math.floor((endTime - timerState.startTime) / 1000) - timerState.pausedTime;
  const durationMinutes = Math.floor(durationSeconds / 60);
  
  if (durationMinutes < 1) {
    if (!confirm('O tempo registrado é menor que 1 minuto. Deseja descartar?')) {
      return;
    }
  }
  
  // Finalizar registro
  timerState.currentRecord.tempo_fim = endTime.toISOString();
  timerState.currentRecord.duracao_minutos = durationMinutes;
  timerState.currentRecord.pausado = timerState.paused;
  
  // Adicionar aos registros
  allTimeRecords.unshift(timerState.currentRecord);
  await saveTimeRecords();
  
  // Resetar timer
  resetTimer();
  
  // Atualizar interface
  await renderTimeRecords();
  updateStats();
  
  if (typeof showToast !== 'undefined') {
    showToast(`Tempo registrado: ${formatTime(durationMinutes / 60)}`, 'success');
  }
}

// Atualizar display do timer
function updateTimer() {
  if (!timerState.running || timerState.paused) return;
  
  const elapsed = Math.floor((new Date() - timerState.startTime) / 1000) - timerState.pausedTime;
  document.getElementById('timerDisplay').querySelector('.timer-time').textContent = formatTimeDisplay(elapsed);
}

// Resetar timer
function resetTimer() {
  timerState.running = false;
  timerState.paused = false;
  timerState.startTime = null;
  timerState.pausedTime = 0;
  timerState.currentRecord = null;
  
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
  
  // Resetar UI
  document.getElementById('timerDisplay').querySelector('.timer-time').textContent = '00:00:00';
  document.getElementById('btnStartTimer').style.display = 'inline-flex';
  document.getElementById('btnPauseTimer').style.display = 'none';
  document.getElementById('btnStopTimer').style.display = 'none';
  document.getElementById('timerProjeto').disabled = false;
  document.getElementById('timerTarefa').disabled = false;
  document.getElementById('timerDescricao').disabled = false;
  
  const statusIndicator = document.querySelector('.status-indicator');
  const statusText = document.getElementById('timerStatus');
  statusIndicator.classList.remove('running', 'paused');
  statusText.innerHTML = '<span class="status-indicator"></span> Parado';
  
  // Limpar campos
  document.getElementById('timerDescricao').value = '';
  document.getElementById('timerTarefa').value = '';
  
  // Limpar storage
  localStorage.removeItem('lucid_timer_state');
}

// Salvar estado do timer
function saveTimerToStorage() {
  if (!timerState.running) return;
  
  const state = {
    ...timerState,
    startTime: timerState.startTime.toISOString(),
    currentRecord: timerState.currentRecord
  };
  
  localStorage.setItem('lucid_timer_state', JSON.stringify(state));
}

// Carregar estado do timer
function loadTimerFromStorage() {
  try {
    const stored = localStorage.getItem('lucid_timer_state');
    if (!stored) return;
    
    const state = JSON.parse(stored);
    const startTime = new Date(state.startTime);
    const now = new Date();
    
    // Verificar se não passou mais de 24 horas
    if (now - startTime > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('lucid_timer_state');
      return;
    }
    
    // Restaurar estado
    timerState = {
      ...state,
      startTime: startTime,
      intervalId: null
    };
    
    // Restaurar UI
    document.getElementById('timerProjeto').value = state.currentRecord.projeto_id;
    updateTarefasForProjeto(state.currentRecord.projeto_id);
    document.getElementById('timerTarefa').value = state.currentRecord.tarefa_id || '';
    document.getElementById('timerDescricao').value = state.currentRecord.descricao || '';
    
    document.getElementById('btnStartTimer').style.display = 'none';
    document.getElementById('btnPauseTimer').style.display = 'inline-flex';
    document.getElementById('btnStopTimer').style.display = 'inline-flex';
    document.getElementById('timerProjeto').disabled = true;
    document.getElementById('timerTarefa').disabled = true;
    document.getElementById('timerDescricao').disabled = true;
    
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('timerStatus');
    if (state.paused) {
      statusIndicator.classList.add('paused');
      statusText.innerHTML = '<span class="status-indicator paused"></span> Pausado';
      document.getElementById('btnPauseTimer').innerHTML = '<i class="fas fa-play"></i> Continuar';
    } else {
      statusIndicator.classList.add('running');
      statusText.innerHTML = '<span class="status-indicator running"></span> Em execução';
      timerState.intervalId = setInterval(updateTimer, 1000);
    }
    
    updateTimer();
  } catch (error) {
    console.error('Erro ao carregar estado do timer:', error);
    localStorage.removeItem('lucid_timer_state');
  }
}

// Renderizar registros de tempo
async function renderTimeRecords() {
  const list = document.getElementById('timeRecordsList');
  if (!list) return;
  
  // Aplicar filtros
  let filtered = [...allTimeRecords];
  
  const dataInicio = document.getElementById('filterDataInicio').value;
  const dataFim = document.getElementById('filterDataFim').value;
  const projetoId = document.getElementById('filterProjeto').value;
  
  if (dataInicio) {
    filtered = filtered.filter(r => r.data_trabalho >= dataInicio);
  }
  
  if (dataFim) {
    filtered = filtered.filter(r => r.data_trabalho <= dataFim);
  }
  
  if (projetoId) {
    filtered = filtered.filter(r => r.projeto_id === projetoId);
  }
  
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Nenhum registro encontrado. Use o timer para começar a registrar seu tempo.</p></div>';
    return;
  }
  
  list.innerHTML = filtered.map(record => {
    const projeto = allProjetos.find(p => p.id === record.projeto_id);
    const tarefa = record.tarefa_id ? allTarefas.find(t => t.id === record.tarefa_id) : null;
    const horas = (record.duracao_minutos || 0) / 60;
    const horasFormatadas = horas.toFixed(2).replace('.', ',');
    
    return `
      <div class="time-record-card" data-id="${record.id}">
        <div class="time-record-header">
          <div class="time-record-info">
            <div class="time-record-project">
              ${escapeHtml(projeto?.nome || projeto?.titulo || 'Projeto não encontrado')}
              ${record.faturado ? '<span class="time-record-badge faturado">Faturado</span>' : ''}
            </div>
            ${tarefa ? `<div class="time-record-task">📋 ${escapeHtml(tarefa.titulo || 'Tarefa sem título')}</div>` : ''}
            ${record.descricao ? `<div class="time-record-description">${escapeHtml(record.descricao)}</div>` : ''}
          </div>
          <div class="time-record-meta">
            <div class="time-record-time">${horasFormatadas}h</div>
            <div class="time-record-date">${formatDate(record.data_trabalho)}</div>
          </div>
        </div>
        <div class="time-record-actions">
          <button class="btn btn-secondary btn-sm" onclick="editRecord('${record.id}')">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteRecord('${record.id}')">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Atualizar estatísticas
function updateStats() {
  const hoje = new Date().toISOString().split('T')[0];
  const inicioSemana = getWeekStart(new Date());
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  
  const hojeRecords = allTimeRecords.filter(r => r.data_trabalho === hoje);
  const semanaRecords = allTimeRecords.filter(r => new Date(r.data_trabalho) >= inicioSemana);
  const mesRecords = allTimeRecords.filter(r => new Date(r.data_trabalho) >= inicioMes);
  
  const hojeHoras = hojeRecords.reduce((sum, r) => sum + (r.duracao_minutos || 0) / 60, 0);
  const semanaHoras = semanaRecords.reduce((sum, r) => sum + (r.duracao_minutos || 0) / 60, 0);
  const mesHoras = mesRecords.reduce((sum, r) => sum + (r.duracao_minutos || 0) / 60, 0);
  
  document.getElementById('statHoje').textContent = hojeHoras.toFixed(1) + 'h';
  document.getElementById('statSemana').textContent = semanaHoras.toFixed(1) + 'h';
  document.getElementById('statMes').textContent = mesHoras.toFixed(1) + 'h';
  
  // Faturado (para implementação futura)
  document.getElementById('statFaturado').textContent = 'R$ 0,00';
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

// Editar registro
window.editRecord = function(recordId) {
  const record = allTimeRecords.find(r => r.id === recordId);
  if (!record) return;
  
  const modal = document.getElementById('editRecordModal');
  document.getElementById('editRecordId').value = record.id;
  document.getElementById('editProjeto').value = record.projeto_id || '';
  updateTarefasForProjetoEdit(record.projeto_id);
  setTimeout(() => {
    document.getElementById('editTarefa').value = record.tarefa_id || '';
  }, 100);
  document.getElementById('editDescricao').value = record.descricao || '';
  document.getElementById('editData').value = record.data_trabalho || '';
  document.getElementById('editHoras').value = ((record.duracao_minutos || 0) / 60).toFixed(2);
  document.getElementById('editFaturado').checked = record.faturado || false;
  
  modal.classList.add('active');
};

function closeEditModal() {
  document.getElementById('editRecordModal').classList.remove('active');
  document.getElementById('editRecordForm').reset();
}

async function handleEditRecord(e) {
  e.preventDefault();
  
  const recordId = document.getElementById('editRecordId').value;
  const record = allTimeRecords.find(r => r.id === recordId);
  if (!record) return;
  
  const horas = parseFloat(document.getElementById('editHoras').value);
  const minutos = Math.round(horas * 60);
  
  record.projeto_id = document.getElementById('editProjeto').value;
  record.tarefa_id = document.getElementById('editTarefa').value || null;
  record.descricao = document.getElementById('editDescricao').value || null;
  record.data_trabalho = document.getElementById('editData').value;
  record.duracao_minutos = minutos;
  record.faturado = document.getElementById('editFaturado').checked;
  record.updated_at = new Date().toISOString();
  
  await saveTimeRecords();
  await renderTimeRecords();
  updateStats();
  closeEditModal();
  
  if (typeof showToast !== 'undefined') {
    showToast('Registro atualizado com sucesso!', 'success');
  }
}

// Deletar registro
window.deleteRecord = async function(recordId) {
  if (!confirm('Deseja realmente excluir este registro?')) return;
  
  try {
    // Remover do Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        await supabase
          .from('tempo_trabalho')
          .delete()
          .eq('id', recordId);
      }
    }
    
    // Remover da lista
    allTimeRecords = allTimeRecords.filter(r => r.id !== recordId);
    await saveTimeRecords();
    await renderTimeRecords();
    updateStats();
    
    if (typeof showToast !== 'undefined') {
      showToast('Registro excluído com sucesso!', 'success');
    }
  } catch (error) {
    console.error('Erro ao deletar registro:', error);
    if (typeof showToast !== 'undefined') {
      showToast('Erro ao excluir registro.', 'error');
    }
  }
};

// Abrir modal de relatórios
function openReportsModal() {
  const modal = document.getElementById('reportsModal');
  modal.classList.add('active');
  switchReportTab('projeto');
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
  renderReportByProjeto();
  renderReportByMembro();
  renderReportByPeriodo();
}

// Relatório por projeto
function renderReportByProjeto() {
  const content = document.getElementById('reportProjetoContent');
  if (!content) return;
  
  const projetosHoras = {};
  
  allTimeRecords.forEach(record => {
    const projetoId = record.projeto_id;
    if (!projetosHoras[projetoId]) {
      projetosHoras[projetoId] = { horas: 0, registros: 0 };
    }
    projetosHoras[projetoId].horas += (record.duracao_minutos || 0) / 60;
    projetosHoras[projetoId].registros++;
  });
  
  const projetosData = Object.entries(projetosHoras)
    .map(([projetoId, data]) => {
      const projeto = allProjetos.find(p => p.id === projetoId);
      return {
        projeto: projeto?.nome || projeto?.titulo || 'Projeto não encontrado',
        horas: data.horas,
        registros: data.registros
      };
    })
    .sort((a, b) => b.horas - a.horas);
  
  const totalHoras = projetosData.reduce((sum, p) => sum + p.horas, 0);
  
  if (projetosData.length === 0) {
    content.innerHTML = '<p class="empty-state">Nenhum registro encontrado.</p>';
    return;
  }
  
  content.innerHTML = `
    <table class="report-table">
      <thead>
        <tr>
          <th>Projeto</th>
          <th>Horas</th>
          <th>Registros</th>
        </tr>
      </thead>
      <tbody>
        ${projetosData.map(p => `
          <tr>
            <td>${escapeHtml(p.projeto)}</td>
            <td><strong>${p.horas.toFixed(2)}h</strong></td>
            <td>${p.registros}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="report-summary">
      <div class="report-summary-item">
        <strong>Total de Horas:</strong>
        <span>${totalHoras.toFixed(2)}h</span>
      </div>
    </div>
  `;
}

// Relatório por membro (simplificado - apenas usuário atual)
function renderReportByMembro() {
  const content = document.getElementById('reportMembroContent');
  if (!content) return;
  
  const totalHoras = allTimeRecords.reduce((sum, r) => sum + (r.duracao_minutos || 0) / 60, 0);
  const totalRegistros = allTimeRecords.length;
  
  content.innerHTML = `
    <table class="report-table">
      <thead>
        <tr>
          <th>Membro</th>
          <th>Horas</th>
          <th>Registros</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(currentUser.email || 'Usuário')}</td>
          <td><strong>${totalHoras.toFixed(2)}h</strong></td>
          <td>${totalRegistros}</td>
        </tr>
      </tbody>
    </table>
    <div class="report-summary">
      <div class="report-summary-item">
        <strong>Total de Horas:</strong>
        <span>${totalHoras.toFixed(2)}h</span>
      </div>
      <div class="report-summary-item">
        <strong>Total de Registros:</strong>
        <span>${totalRegistros}</span>
      </div>
    </div>
  `;
}

// Relatório por período
function renderReportByPeriodo() {
  const content = document.getElementById('reportPeriodoContent');
  if (!content) return;
  
  const periodoHoras = {};
  
  allTimeRecords.forEach(record => {
    const data = record.data_trabalho;
    if (!periodoHoras[data]) {
      periodoHoras[data] = { horas: 0, registros: 0 };
    }
    periodoHoras[data].horas += (record.duracao_minutos || 0) / 60;
    periodoHoras[data].registros++;
  });
  
  const periodoData = Object.entries(periodoHoras)
    .map(([data, info]) => ({
      data,
      dataFormatada: formatDate(data),
      horas: info.horas,
      registros: info.registros
    }))
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 30); // Últimos 30 dias
  
  const totalHoras = periodoData.reduce((sum, p) => sum + p.horas, 0);
  
  if (periodoData.length === 0) {
    content.innerHTML = '<p class="empty-state">Nenhum registro encontrado.</p>';
    return;
  }
  
  content.innerHTML = `
    <table class="report-table">
      <thead>
        <tr>
          <th>Data</th>
          <th>Horas</th>
          <th>Registros</th>
        </tr>
      </thead>
      <tbody>
        ${periodoData.map(p => `
          <tr>
            <td>${p.dataFormatada}</td>
            <td><strong>${p.horas.toFixed(2)}h</strong></td>
            <td>${p.registros}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="report-summary">
      <div class="report-summary-item">
        <strong>Total de Horas:</strong>
        <span>${totalHoras.toFixed(2)}h</span>
      </div>
    </div>
  `;
}

// Exportar registros
function exportTimeRecords() {
  try {
    const headers = ['Data', 'Projeto', 'Tarefa', 'Descrição', 'Horas', 'Faturado'];
    const rows = allTimeRecords.map(record => {
      const projeto = allProjetos.find(p => p.id === record.projeto_id);
      const tarefa = record.tarefa_id ? allTarefas.find(t => t.id === record.tarefa_id) : null;
      const horas = (record.duracao_minutos || 0) / 60;
      
      return [
        formatDate(record.data_trabalho),
        projeto?.nome || projeto?.titulo || '',
        tarefa?.titulo || '',
        record.descricao || '',
        horas.toFixed(2).replace('.', ','),
        record.faturado ? 'Sim' : 'Não'
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tempo_trabalho_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    if (typeof showToast !== 'undefined') {
      showToast('Registros exportados com sucesso!', 'success');
    }
  } catch (error) {
    console.error('Erro ao exportar:', error);
    if (typeof showToast !== 'undefined') {
      showToast('Erro ao exportar registros.', 'error');
    }
  }
}

