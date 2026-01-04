/* ============================================
   TAREFAS - Sistema de Tarefas e Subtarefas
   ============================================ */

let allTarefas = [];
let currentProjectId = null;
let currentEditingTaskId = null;

// Status disponíveis
const TASK_STATUS = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  pausada: 'Pausada',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};

// Prioridades disponíveis
const TASK_PRIORITY = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente'
};

// Carregar tarefas do projeto
async function loadTasks(projectId) {
  try {
    // Tentar carregar do Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('tarefas')
            .select('*')
            .eq('projeto_id', projectId)
            .order('ordem', { ascending: true });
          
          if (!error && data) {
            allTarefas = data.map(task => ({
              ...task,
              checklist: task.checklist || [],
              comentarios: task.comentarios || []
            }));
            console.log('✅ Tarefas carregadas do Supabase:', allTarefas.length);
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar do Supabase, usando localStorage:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem(`lucid_tarefas_${projectId}`);
    if (stored) {
      allTarefas = JSON.parse(stored);
      console.log('✅ Tarefas carregadas do localStorage:', allTarefas.length);
    } else {
      allTarefas = [];
    }
  } catch (error) {
    console.error('❌ Erro ao carregar tarefas:', error);
    allTarefas = [];
  }
}

// Salvar tarefas
async function saveTasks(projectId) {
  try {
    // Tentar salvar no Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          // Sincronizar cada tarefa com o Supabase
          for (const task of allTarefas) {
            const { id, created_at, updated_at, ...taskData } = task;
            
            // Verificar se a tarefa já existe no Supabase
            const { data: existing } = await supabase
              .from('tarefas')
              .select('id')
              .eq('id', id)
              .single();
            
            if (existing) {
              // Atualizar tarefa existente
              const { error } = await supabase
                .from('tarefas')
                .update(taskData)
                .eq('id', id);
              
              if (error) throw error;
            } else {
              // Criar nova tarefa
              const { error } = await supabase
                .from('tarefas')
                .insert([{ id, ...taskData }]);
              
              if (error) throw error;
            }
          }
          
          console.log('✅ Tarefas sincronizadas com Supabase');
          return;
        } catch (error) {
          console.warn('⚠️ Erro ao salvar no Supabase, usando localStorage:', error);
        }
      }
    }
    
    // Fallback: localStorage
    localStorage.setItem(`lucid_tarefas_${projectId}`, JSON.stringify(allTarefas));
    console.log('✅ Tarefas salvas no localStorage');
  } catch (error) {
    console.error('❌ Erro ao salvar tarefas:', error);
    throw error;
  }
}

// Abrir modal de tarefas (função global)
window.openTasksModal = async function(projectId) {
  currentProjectId = projectId;
  const project = typeof allProjects !== 'undefined' ? allProjects.find(p => p.id === projectId) : null;
  if (!project) {
    alert('Projeto não encontrado.');
    return;
  }
  
  // Atualizar título do modal
  const modalTitle = document.getElementById('tasksModalTitle');
  if (modalTitle) {
    modalTitle.textContent = `Tarefas: ${project.nome}`;
  }
  
  // Carregar tarefas
  await loadTasks(projectId);
  
  // Mostrar modal
  const modal = document.getElementById('tasksModal');
  if (modal) {
    modal.classList.add('active');
    renderTasks();
  }
}

// Fechar modal de tarefas
window.closeTasksModal = function() {
  const modal = document.getElementById('tasksModal');
  if (modal) {
    modal.classList.remove('active');
  }
  currentProjectId = null;
  currentEditingTaskId = null;
  allTarefas = [];
}

// Renderizar tarefas
function renderTasks() {
  const container = document.getElementById('tasksList');
  if (!container) return;
  
  // Separar tarefas principais e subtarefas
  const tarefasPrincipais = allTarefas.filter(t => !t.tarefa_pai_id);
  const subtarefas = allTarefas.filter(t => t.tarefa_pai_id);
  
  if (tarefasPrincipais.length === 0 && subtarefas.length === 0) {
    container.innerHTML = `
      <div class="empty-tasks">
        <i class="fas fa-tasks"></i>
        <p>Nenhuma tarefa criada ainda</p>
        <button class="btn btn-primary" onclick="openNewTaskModal()">
          <i class="fas fa-plus"></i>
          Criar Primeira Tarefa
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = tarefasPrincipais.map(task => renderTaskCard(task, subtarefas)).join('');
  
  // Anexar event listeners
  attachTaskEventListeners(container);
}

// Renderizar card de tarefa
function renderTaskCard(task, allSubtarefas) {
  const statusClass = task.status || 'pendente';
  const priorityClass = task.prioridade || 'normal';
  const statusLabel = TASK_STATUS[statusClass] || statusClass;
  const priorityLabel = TASK_PRIORITY[priorityClass] || priorityClass;
  
  // Formatar datas
  const dataVencimento = task.data_vencimento ? formatDate(task.data_vencimento) : null;
  const isAtrasado = dataVencimento && new Date(task.data_vencimento) < new Date() && task.status !== 'concluida';
  
  // Checklist
  const checklist = task.checklist || [];
  const checklistConcluido = checklist.filter(item => item.concluido).length;
  const checklistTotal = checklist.length;
  const checklistProgress = checklistTotal > 0 ? Math.round((checklistConcluido / checklistTotal) * 100) : 0;
  
  // Comentários
  const comentarios = task.comentarios || [];
  const comentariosCount = comentarios.length;
  
  // Subtarefas
  const subtarefas = allSubtarefas.filter(st => st.tarefa_pai_id === task.id);
  const subtarefasConcluidas = subtarefas.filter(st => st.status === 'concluida').length;
  const subtarefasTotal = subtarefas.length;
  
  return `
    <div class="task-card ${statusClass === 'concluida' ? 'task-completed' : ''} ${isAtrasado ? 'task-late' : ''}" data-id="${task.id}">
      <div class="task-header">
        <div class="task-title-row">
          <input type="checkbox" class="task-checkbox" ${statusClass === 'concluida' ? 'checked' : ''} data-id="${task.id}">
          <h4 class="task-title">${escapeHtml(task.titulo)}</h4>
          <span class="task-priority ${priorityClass}">${priorityLabel}</span>
        </div>
        <div class="task-status-badge ${statusClass}">${statusLabel}</div>
      </div>
      
      ${task.descricao ? `<p class="task-description">${escapeHtml(task.descricao)}</p>` : ''}
      
      <div class="task-meta">
        ${dataVencimento ? `
          <div class="task-meta-item ${isAtrasado ? 'late' : ''}">
            <i class="fas fa-calendar"></i>
            <span>${dataVencimento}</span>
          </div>
        ` : ''}
        ${task.responsavel_email ? `
          <div class="task-meta-item">
            <i class="fas fa-user"></i>
            <span>${escapeHtml(task.responsavel_email)}</span>
          </div>
        ` : ''}
        ${checklistTotal > 0 ? `
          <div class="task-meta-item">
            <i class="fas fa-list-check"></i>
            <span>${checklistConcluido}/${checklistTotal} (${checklistProgress}%)</span>
          </div>
        ` : ''}
        ${comentariosCount > 0 ? `
          <div class="task-meta-item">
            <i class="fas fa-comments"></i>
            <span>${comentariosCount} comentário(s)</span>
          </div>
        ` : ''}
        ${subtarefasTotal > 0 ? `
          <div class="task-meta-item">
            <i class="fas fa-list-ul"></i>
            <span>${subtarefasConcluidas}/${subtarefasTotal} subtarefa(s)</span>
          </div>
        ` : ''}
      </div>
      
      ${subtarefas.length > 0 ? `
        <div class="task-subtasks">
          ${subtarefas.map(st => renderSubtaskCard(st)).join('')}
        </div>
      ` : ''}
      
      <div class="task-actions">
        <button class="btn-icon btn-task-subtask" data-id="${task.id}" title="Adicionar Subtarefa">
          <i class="fas fa-list-ul"></i>
        </button>
        <button class="btn-icon btn-task-comment" data-id="${task.id}" title="Comentários">
          <i class="fas fa-comments"></i>
        </button>
        <button class="btn-icon btn-task-checklist" data-id="${task.id}" title="Checklist">
          <i class="fas fa-list-check"></i>
        </button>
        <button class="btn-icon btn-task-edit" data-id="${task.id}" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon btn-task-delete" data-id="${task.id}" title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
}

// Renderizar card de subtarefa
function renderSubtaskCard(subtask) {
  const statusClass = subtask.status || 'pendente';
  return `
    <div class="subtask-card ${statusClass === 'concluida' ? 'completed' : ''}" data-id="${subtask.id}">
      <input type="checkbox" class="subtask-checkbox" ${statusClass === 'concluida' ? 'checked' : ''} data-id="${subtask.id}">
      <span class="subtask-title">${escapeHtml(subtask.titulo)}</span>
      <button class="btn-icon btn-subtask-edit" data-id="${subtask.id}" title="Editar">
        <i class="fas fa-edit"></i>
      </button>
      <button class="btn-icon btn-subtask-delete" data-id="${subtask.id}" title="Excluir">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
}

// Anexar event listeners das tarefas
function attachTaskEventListeners(container) {
  // Checkbox principal
  container.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const taskId = this.getAttribute('data-id');
      toggleTaskStatus(taskId, this.checked);
    });
  });
  
  // Checkbox subtarefa
  container.querySelectorAll('.subtask-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const taskId = this.getAttribute('data-id');
      toggleTaskStatus(taskId, this.checked);
    });
  });
  
  // Botões de ação
  container.querySelectorAll('.btn-task-edit').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const taskId = this.getAttribute('data-id');
      editTask(taskId);
    });
  });
  
  container.querySelectorAll('.btn-task-delete').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const taskId = this.getAttribute('data-id');
      deleteTask(taskId);
    });
  });
  
  container.querySelectorAll('.btn-task-subtask').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const taskId = this.getAttribute('data-id');
      openNewSubtaskModal(taskId);
    });
  });
  
  container.querySelectorAll('.btn-task-comment').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const taskId = this.getAttribute('data-id');
      openCommentsModal(taskId);
    });
  });
  
  container.querySelectorAll('.btn-task-checklist').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const taskId = this.getAttribute('data-id');
      openChecklistModal(taskId);
    });
  });
  
  container.querySelectorAll('.btn-subtask-edit').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const taskId = this.getAttribute('data-id');
      editTask(taskId);
    });
  });
  
  container.querySelectorAll('.btn-subtask-delete').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const taskId = this.getAttribute('data-id');
      deleteTask(taskId);
    });
  });
}

// Abrir modal para nova tarefa (função global)
window.openNewTaskModal = function(parentTaskId = null) {
  currentEditingTaskId = null;
  const modal = document.getElementById('taskFormModal');
  const form = document.getElementById('taskForm');
  const modalTitle = document.getElementById('taskFormModalTitle');
  
  if (modal && form && modalTitle) {
    form.reset();
    document.getElementById('taskId').value = '';
    document.getElementById('taskParentId').value = parentTaskId || '';
    modalTitle.textContent = parentTaskId ? 'Nova Subtarefa' : 'Nova Tarefa';
    modal.classList.add('active');
  }
}

// Editar tarefa
function editTask(taskId) {
  const task = allTarefas.find(t => t.id === taskId);
  if (!task) return;
  
  currentEditingTaskId = taskId;
  const modal = document.getElementById('taskFormModal');
  const form = document.getElementById('taskForm');
  const modalTitle = document.getElementById('taskFormModalTitle');
  
  if (modal && form && modalTitle) {
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitulo').value = task.titulo || '';
    document.getElementById('taskDescricao').value = task.descricao || '';
    document.getElementById('taskStatus').value = task.status || 'pendente';
    document.getElementById('taskPrioridade').value = task.prioridade || 'normal';
    document.getElementById('taskDataInicio').value = task.data_inicio || '';
    document.getElementById('taskDataVencimento').value = task.data_vencimento || '';
    document.getElementById('taskResponsavel').value = task.responsavel_email || '';
    document.getElementById('taskParentId').value = task.tarefa_pai_id || '';
    
    modalTitle.textContent = task.tarefa_pai_id ? 'Editar Subtarefa' : 'Editar Tarefa';
    modal.classList.add('active');
  }
}

// Fechar modal de formulário (função global)
window.closeTaskFormModal = function() {
  const modal = document.getElementById('taskFormModal');
  if (modal) {
    modal.classList.remove('active');
  }
  currentEditingTaskId = null;
  document.getElementById('taskForm').reset();
}

// Salvar tarefa (função global)
window.saveTask = async function(e) {
  e.preventDefault();
  
  if (!currentProjectId) {
    alert('Erro: Nenhum projeto selecionado.');
    return;
  }
  
  try {
    const formData = new FormData(e.target);
    const taskId = formData.get('taskId') || generateId();
    const parentTaskId = formData.get('taskParentId');
    
    const taskData = {
      id: taskId,
      projeto_id: currentProjectId,
      tarefa_pai_id: parentTaskId || null,
      titulo: formData.get('titulo').trim(),
      descricao: formData.get('descricao').trim() || null,
      status: formData.get('status'),
      prioridade: formData.get('prioridade'),
      data_inicio: formData.get('dataInicio') || null,
      data_vencimento: formData.get('dataVencimento') || null,
      responsavel_email: formData.get('responsavel').trim() || null,
      checklist: [],
      comentarios: [],
      ordem: allTarefas.length
    };
    
    const existingIndex = allTarefas.findIndex(t => t.id === taskId);
    if (existingIndex >= 0) {
      // Atualizar tarefa existente (preservar checklist e comentários)
      const existing = allTarefas[existingIndex];
      allTarefas[existingIndex] = {
        ...existing,
        ...taskData,
        checklist: existing.checklist || [],
        comentarios: existing.comentarios || []
      };
    } else {
      // Nova tarefa
      allTarefas.push(taskData);
    }
    
    await saveTasks(currentProjectId);
    closeTaskFormModal();
    renderTasks();
    
    console.log('✅ Tarefa salva com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao salvar tarefa:', error);
    alert('Erro ao salvar tarefa. Por favor, tente novamente.');
  }
}

// Excluir tarefa
async function deleteTask(taskId) {
  if (!confirm('Tem certeza que deseja excluir esta tarefa? Todas as subtarefas também serão excluídas.')) {
    return;
  }
  
  try {
    // Remover tarefa e todas as subtarefas
    allTarefas = allTarefas.filter(t => t.id !== taskId && t.tarefa_pai_id !== taskId);
    
    // Tentar excluir do Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          // Excluir tarefa e subtarefas (CASCADE no banco cuida disso)
          await supabase
            .from('tarefas')
            .delete()
            .eq('id', taskId);
        } catch (error) {
          console.warn('⚠️ Erro ao excluir do Supabase:', error);
        }
      }
    }
    
    await saveTasks(currentProjectId);
    renderTasks();
    
    console.log('✅ Tarefa excluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao excluir tarefa:', error);
    alert('Erro ao excluir tarefa. Por favor, tente novamente.');
  }
}

// Alternar status da tarefa (checkbox)
async function toggleTaskStatus(taskId, completed) {
  const task = allTarefas.find(t => t.id === taskId);
  if (!task) return;
  
  task.status = completed ? 'concluida' : 'pendente';
  if (completed) {
    task.data_conclusao = new Date().toISOString();
  } else {
    task.data_conclusao = null;
  }
  
  await saveTasks(currentProjectId);
  renderTasks();
}

// Abrir modal de comentários
function openCommentsModal(taskId) {
  const task = allTarefas.find(t => t.id === taskId);
  if (!task) return;
  
  const modal = document.getElementById('taskCommentsModal');
  const commentsList = document.getElementById('taskCommentsList');
  const taskCommentsTitle = document.getElementById('taskCommentsTitle');
  
  if (modal && commentsList && taskCommentsTitle) {
    taskCommentsTitle.textContent = `Comentários: ${task.titulo}`;
    document.getElementById('taskCommentTaskId').value = taskId;
    
    const comentarios = task.comentarios || [];
    if (comentarios.length === 0) {
      commentsList.innerHTML = '<p class="empty-comments">Nenhum comentário ainda</p>';
    } else {
      commentsList.innerHTML = comentarios.map(comment => `
        <div class="comment-item">
          <div class="comment-header">
            <strong>${escapeHtml(comment.autor || 'Usuário')}</strong>
            <span class="comment-date">${formatDateTime(comment.data)}</span>
          </div>
          <p class="comment-text">${escapeHtml(comment.texto)}</p>
        </div>
      `).join('');
    }
    
    modal.classList.add('active');
  }
}

// Adicionar comentário (função global)
window.addComment = async function(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const taskId = formData.get('taskId');
  const texto = formData.get('texto').trim();
  
  if (!texto) {
    alert('Por favor, digite um comentário.');
    return;
  }
  
  const task = allTarefas.find(t => t.id === taskId);
  if (!task) return;
  
  // Obter usuário atual
  let autor = 'Usuário';
  try {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      const user = JSON.parse(loggedInUser);
      autor = user.email || user.username || user.name || 'Usuário';
    }
  } catch (e) {
    console.warn('Erro ao obter usuário:', e);
  }
  
  const comentarios = task.comentarios || [];
  comentarios.push({
    id: generateId(),
    autor: autor,
    texto: texto,
    data: new Date().toISOString()
  });
  
  task.comentarios = comentarios;
  await saveTasks(currentProjectId);
  
  // Atualizar modal de comentários
  openCommentsModal(taskId);
  e.target.reset();
}

// Abrir modal de checklist
function openChecklistModal(taskId) {
  const task = allTarefas.find(t => t.id === taskId);
  if (!task) return;
  
  const modal = document.getElementById('taskChecklistModal');
  const checklistList = document.getElementById('taskChecklistList');
  const taskChecklistTitle = document.getElementById('taskChecklistTitle');
  
  if (modal && checklistList && taskChecklistTitle) {
    taskChecklistTitle.textContent = `Checklist: ${task.titulo}`;
    document.getElementById('taskChecklistTaskId').value = taskId;
    
    const checklist = task.checklist || [];
    if (checklist.length === 0) {
      checklistList.innerHTML = '<p class="empty-checklist">Nenhum item no checklist ainda</p>';
    } else {
      checklistList.innerHTML = checklist.map(item => `
        <div class="checklist-item">
          <input type="checkbox" class="checklist-item-checkbox" ${item.concluido ? 'checked' : ''} data-item-id="${item.id}">
          <span class="checklist-item-text ${item.concluido ? 'completed' : ''}">${escapeHtml(item.texto)}</span>
          <button class="btn-icon btn-checklist-delete" data-item-id="${item.id}" title="Remover">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `).join('');
      
      // Anexar event listeners
      checklistList.querySelectorAll('.checklist-item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
          const itemId = this.getAttribute('data-item-id');
          toggleChecklistItem(taskId, itemId, this.checked);
        });
      });
      
      checklistList.querySelectorAll('.btn-checklist-delete').forEach(btn => {
        btn.addEventListener('click', function() {
          const itemId = this.getAttribute('data-item-id');
          removeChecklistItem(taskId, itemId);
        });
      });
    }
    
    modal.classList.add('active');
  }
}

// Adicionar item ao checklist (função global)
window.addChecklistItem = async function(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const taskId = formData.get('taskId');
  const texto = formData.get('texto').trim();
  
  if (!texto) {
    alert('Por favor, digite um item.');
    return;
  }
  
  const task = allTarefas.find(t => t.id === taskId);
  if (!task) return;
  
  const checklist = task.checklist || [];
  checklist.push({
    id: generateId(),
    texto: texto,
    concluido: false
  });
  
  task.checklist = checklist;
  await saveTasks(currentProjectId);
  
  // Atualizar modal de checklist
  openChecklistModal(taskId);
  e.target.reset();
}

// Alternar item do checklist
async function toggleChecklistItem(taskId, itemId, concluido) {
  const task = allTarefas.find(t => t.id === taskId);
  if (!task) return;
  
  const checklist = task.checklist || [];
  const item = checklist.find(i => i.id === itemId);
  if (item) {
    item.concluido = concluido;
    task.checklist = checklist;
    await saveTasks(currentProjectId);
    openChecklistModal(taskId);
  }
}

// Remover item do checklist
async function removeChecklistItem(taskId, itemId) {
  const task = allTarefas.find(t => t.id === taskId);
  if (!task) return;
  
  const checklist = task.checklist || [];
  task.checklist = checklist.filter(i => i.id !== itemId);
  await saveTasks(currentProjectId);
  
  openChecklistModal(taskId);
}

// Abrir modal para nova subtarefa
window.openNewSubtaskModal = function(parentTaskId) {
  openNewTaskModal(parentTaskId);
}

// Fechar modais (funções globais)
window.closeTaskCommentsModal = function() {
  const modal = document.getElementById('taskCommentsModal');
  if (modal) modal.classList.remove('active');
}

window.closeTaskChecklistModal = function() {
  const modal = document.getElementById('taskChecklistModal');
  if (modal) modal.classList.remove('active');
}

// Utilitários
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

