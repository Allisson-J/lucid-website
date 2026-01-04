/* ============================================
   COMENTÁRIOS EM PROJETOS - Sistema de Comentários e Colaboração
   ============================================ */

let allComments = [];
let currentProjectIdForComments = null;
let allUsers = []; // Para menções

// Carregar comentários do projeto
async function loadProjectComments(projectId) {
  try {
    currentProjectIdForComments = projectId;
    
    // Tentar carregar do Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('comentarios_projetos')
            .select('*')
            .eq('projeto_id', projectId)
            .order('created_at', { ascending: true });
          
          if (!error && data) {
            allComments = data;
            console.log(`✅ ${data.length} comentário(s) carregado(s) do projeto`);
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar do Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem(`lucid_comentarios_projeto_${projectId}`);
    if (stored) {
      allComments = JSON.parse(stored);
    } else {
      allComments = [];
    }
  } catch (error) {
    console.error('❌ Erro ao carregar comentários:', error);
    allComments = [];
  }
}

// Salvar comentário
async function saveComment(projectId, commentText) {
  try {
    if (!commentText.trim()) {
      alert('Por favor, digite um comentário.');
      return;
    }
    
    // Obter usuário atual
    let user = await getCurrentUser();
    let userId = user?.id;
    let userName = user?.email || user?.username || 'Usuário';
    
    // Se não tiver ID, tentar obter do localStorage
    if (!userId) {
      try {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
          const parsed = JSON.parse(loggedInUser);
          userId = parsed.id || generateId();
          userName = parsed.username || parsed.email || parsed.name || 'Usuário';
        } else {
          const authData = localStorage.getItem('lucid_auth');
          if (authData) {
            const parsed = JSON.parse(authData);
            userId = parsed.id || generateId();
            userName = parsed.email || 'Usuário';
          } else {
            userId = generateId();
          }
        }
      } catch (e) {
        userId = generateId();
      }
    }
    
    // Processar menções (@usuario)
    const mencoes = extractMentions(commentText);
    
    const commentData = {
      id: generateId(),
      projeto_id: projectId,
      usuario_id: userId,
      usuario_nome: userName,
      comentario: commentText.trim(),
      mencoes: mencoes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Tentar salvar no Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('comentarios_projetos')
            .insert([commentData])
            .select()
            .single();
          
          if (!error && data) {
            allComments.push(data);
            
            // Registrar no histórico
            await registerActivity('projeto', projectId, userId, userName, 'comentado', `Comentário adicionado: ${commentText.substring(0, 50)}...`);
            
            // Notificar usuários mencionados
            if (mencoes.length > 0 && typeof createNotification === 'function') {
              for (const mencionadoId of mencoes) {
                await createNotification(
                  mencionadoId,
                  'tarefa_comentario',
                  'Você foi mencionado em um comentário',
                  `${userName} te mencionou em um comentário do projeto`,
                  `projetos.html?projeto=${projectId}`,
                  { projetoId: projectId, comentarioId: data.id }
                );
              }
            }
            
            console.log('✅ Comentário salvo no Supabase');
            return data;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao salvar no Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    allComments.push(commentData);
    localStorage.setItem(`lucid_comentarios_projeto_${projectId}`, JSON.stringify(allComments));
    
    console.log('✅ Comentário salvo no localStorage');
    return commentData;
  } catch (error) {
    console.error('❌ Erro ao salvar comentário:', error);
    throw error;
  }
}

// Deletar comentário
async function deleteComment(commentId) {
  try {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) {
      return;
    }
    
    // Tentar deletar do Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { error } = await supabase
            .from('comentarios_projetos')
            .delete()
            .eq('id', commentId);
          
          if (!error) {
            allComments = allComments.filter(c => c.id !== commentId);
            console.log('✅ Comentário deletado do Supabase');
            
            // Salvar no localStorage
            if (currentProjectIdForComments) {
              localStorage.setItem(`lucid_comentarios_projeto_${currentProjectIdForComments}`, JSON.stringify(allComments));
            }
            
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao deletar do Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    allComments = allComments.filter(c => c.id !== commentId);
    if (currentProjectIdForComments) {
      localStorage.setItem(`lucid_comentarios_projeto_${currentProjectIdForComments}`, JSON.stringify(allComments));
    }
  } catch (error) {
    console.error('❌ Erro ao deletar comentário:', error);
    throw error;
  }
}

// Abrir modal de comentários
window.openProjectCommentsModal = async function(projectId) {
  const modal = document.getElementById('projectCommentsModal');
  if (!modal) return;
  
  await loadProjectComments(projectId);
  
  // Obter nome do projeto
  const project = window.allProjects?.find(p => p.id === projectId);
  const projectName = project?.nome || 'Projeto';
  
  const modalTitle = document.getElementById('projectCommentsModalTitle');
  if (modalTitle) {
    modalTitle.textContent = `Comentários - ${projectName}`;
  }
  
  renderComments();
  modal.classList.add('active');
};

// Fechar modal de comentários
window.closeProjectCommentsModal = function() {
  const modal = document.getElementById('projectCommentsModal');
  if (modal) {
    modal.classList.remove('active');
  }
  allComments = [];
  currentProjectIdForComments = null;
};

// Renderizar comentários
function renderComments() {
  const container = document.getElementById('projectCommentsList');
  if (!container) return;
  
  if (allComments.length === 0) {
    container.innerHTML = `
      <div class="comments-empty">
        <i class="fas fa-comments"></i>
        <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = allComments.map(comment => renderCommentItem(comment)).join('');
  
  // Anexar event listeners
  container.querySelectorAll('.comment-delete').forEach(btn => {
    btn.addEventListener('click', async function() {
      const commentId = this.getAttribute('data-id');
      await deleteComment(commentId);
      renderComments();
    });
  });
  
  // Scroll para o final
  container.scrollTop = container.scrollHeight;
}

// Renderizar item de comentário
function renderCommentItem(comment) {
  const timeAgo = getTimeAgo(comment.created_at);
  const userName = comment.usuario_nome || 'Usuário';
  const commentText = processMentions(comment.comentario, comment.mencoes || []);
  
  // Verificar se o usuário atual pode deletar (mesmo usuário)
  let currentUser = null;
  try {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      currentUser = JSON.parse(loggedInUser);
    } else {
      const authData = localStorage.getItem('lucid_auth');
      if (authData) {
        currentUser = JSON.parse(authData);
      }
    }
  } catch (e) {
    // Ignorar
  }
  
  const canDelete = currentUser && (currentUser.id === comment.usuario_id || currentUser.email === comment.usuario_id);
  
  return `
    <div class="comment-item">
      <div class="comment-header">
        <div class="comment-author">
          <div class="comment-avatar">${userName.charAt(0).toUpperCase()}</div>
          <div>
            <div class="comment-author-name">${escapeHtml(userName)}</div>
            <div class="comment-date">${timeAgo}</div>
          </div>
        </div>
        ${canDelete ? `
          <button class="comment-delete" data-id="${comment.id}" title="Excluir comentário">
            <i class="fas fa-times"></i>
          </button>
        ` : ''}
      </div>
      <div class="comment-text">${commentText}</div>
    </div>
  `;
}

// Processar menções no texto do comentário
function processMentions(text, mencoes) {
  if (!mencoes || mencoes.length === 0) {
    return escapeHtml(text);
  }
  
  let processedText = escapeHtml(text);
  
  // Destacar menções (por enquanto apenas destacar o texto @usuario)
  // Em produção, você poderia linkar para o perfil do usuário
  processedText = processedText.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  
  return processedText;
}

// Extrair menções do texto (@usuario)
function extractMentions(text) {
  const mentions = [];
  const mentionRegex = /@(\w+)/g;
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionText = match[1];
    // Aqui você poderia buscar o ID do usuário pelo nome
    // Por enquanto, retornamos o texto da menção
    mentions.push(mentionText);
  }
  
  return mentions;
}

// Carregar formulário de comentário
function setupCommentForm() {
  const form = document.getElementById('projectCommentForm');
  const textarea = document.getElementById('projectCommentInput');
  
  if (!form || !textarea) return;
  
  // Auto-resize textarea
  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
  });
  
  // Submit do formulário
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const commentText = textarea.value.trim();
    if (!commentText) return;
    
    if (!currentProjectIdForComments) {
      alert('Erro: Nenhum projeto selecionado.');
      return;
    }
    
    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      
      await saveComment(currentProjectIdForComments, commentText);
      
      textarea.value = '';
      textarea.style.height = 'auto';
      renderComments();
      
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    } catch (error) {
      console.error('Erro ao salvar comentário:', error);
      alert('Erro ao salvar comentário. Tente novamente.');
    }
  });
}

// Registrar atividade no histórico
async function registerActivity(entidadeTipo, entidadeId, userId, userName, acao, descricao, camposAlterados = {}) {
  try {
    // Tentar registrar no Supabase
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          // Usar função helper se disponível
          const { data, error } = await supabase
            .rpc('registrar_atividade', {
              p_entidade_tipo: entidadeTipo,
              p_entidade_id: entidadeId,
              p_usuario_id: userId,
              p_usuario_nome: userName,
              p_acao: acao,
              p_descricao: descricao,
              p_campos_alterados: camposAlterados
            });
          
          if (!error) {
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao registrar atividade no Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const historicoKey = `lucid_historico_${entidadeTipo}_${entidadeId}`;
    const historico = JSON.parse(localStorage.getItem(historicoKey) || '[]');
    
    historico.push({
      id: generateId(),
      entidade_tipo: entidadeTipo,
      entidade_id: entidadeId,
      usuario_id: userId,
      usuario_nome: userName,
      acao: acao,
      descricao: descricao,
      campos_alterados: camposAlterados,
      created_at: new Date().toISOString()
    });
    
    localStorage.setItem(historicoKey, JSON.stringify(historico));
  } catch (error) {
    console.error('❌ Erro ao registrar atividade:', error);
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
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Exportar função para uso em outros scripts
window.registerActivity = registerActivity;

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCommentForm);
} else {
  setupCommentForm();
}

