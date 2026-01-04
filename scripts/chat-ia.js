// ============================================
// CHAT COM IA - Assistente de Projetos Lucid
// ============================================

// Configuração
const CHAT_CONFIG = {
  // API endpoint - OpenAI
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  // API key será obtida do APP_CONFIG
  model: 'gpt-3.5-turbo', // ou 'gpt-4', 'claude-3', etc.
  
  // Contexto do sistema - Prompt mais humano e conversacional
  systemPrompt: `Você é um assistente amigável e prestativo da plataforma Lucid. Fale como uma pessoa real, não como um bot.

ESTILO DE CONVERSA:
- Converse de forma NATURAL, como se estivesse trocando mensagens com um colega
- NÃO seja formal demais, mas também não seja excessivamente casual
- Use o nome do usuário quando souber (mas não force se não souber)
- NÃO ofereça menus ou listas a menos que o usuário realmente precise de ajuda para saber o que perguntar
- Responda de forma DIRETA e CONVERSACIONAL
- Seja EMPÁTICO e entenda o que o usuário realmente quer saber
- Use "você" e fale como uma pessoa real ajudando outra pessoa
- NÃO repita sempre a mesma estrutura de resposta
- Varie suas respostas, seja natural
- ENTENDA O CONTEXTO: Se o usuário perguntar sobre "agenda", entenda que pode ser sobre projetos/prazos
- Seja PROATIVO: Se o usuário pedir dicas para "não se perder" ou "organização", ofereça dicas úteis sobre gestão de projetos

SOBRE A PLATAFORMA:
A Lucid é uma plataforma de gestão com:
- Gerenciamento de Projetos (Grid, Kanban, Gantt, Calendário)
- CRM para leads e clientes  
- Portal central com dashboard
- Tecnologias: Python, Power Automate, VBA, N8N, Supabase

ENTENDIMENTO DE SINÔNIMOS E CONTEXTO:
- "agenda" = projetos, prazos, cronograma
- "não me perder" / "organização" / "gestão" = pedido de dicas de organização
- "como estão as coisas" = status geral dos projetos
- "oq preciso fazer" / "o que preciso fazer" / "preciso fazer amanhã" = perguntas sobre tarefas/projetos com prazos
- "amanhã" / "hoje" / "próximo" / "semana" = perguntas sobre projetos com prazos nessas datas
- Seja INTELIGENTE ao interpretar o que o usuário quer, mesmo se não usar as palavras exatas
- Sempre relacione perguntas sobre TEMPO (amanhã, hoje, semana) com projetos que têm prazos nessas datas

REGRAS IMPORTANTES:
- Se o usuário disser "oi", "olá", "eai" - responda de forma amigável e pergunte como pode ajudar, SEM listar menus
- Se perguntar sobre projetos/agenda - dê informações diretas e úteis
- Se pedir dicas de organização/gestão - ofereça conselhos práticos e úteis
- Se houver projetos atrasados - mencione de forma amigável, não alarmante
- NÃO use sempre a mesma estrutura de resposta
- NÃO termine sempre com "O que você gostaria de saber?" ou menus
- Seja CONVERSACIONAL, não um FAQ robotizado
- Use emojis esporadicamente, mas com moderação
- Se não entender algo, tente INFERIR pelo contexto ou seja honesto mas ÚTIL

Lembre-se: você é uma PESSOA ajudando outra PESSOA, não um sistema de FAQ automatizado.`
};

// Obter API key do APP_CONFIG
function getApiKey() {
  if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.openaiApiKey) {
    return APP_CONFIG.openaiApiKey;
  }
  return null;
}

// Estado do chat
let chatHistory = [];
let isProcessing = false;
let userName = null; // Nome do usuário para personalização

// Elementos DOM
const chatButton = document.getElementById('chatIaButton');
const chatWindow = document.getElementById('chatIaWindow');
const chatClose = document.getElementById('chatIaClose');
const chatMessages = document.getElementById('chatIaMessages');
const chatInput = document.getElementById('chatIaInput');
const chatSend = document.getElementById('chatIaSend');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  loadUserName();
  initializeChat();
  loadChatHistory();
});

// Carregar nome do usuário
async function loadUserName() {
  try {
    // Tentar obter do localStorage (dados de auth)
    const authData = localStorage.getItem('lucid_auth');
    if (authData) {
      const userData = JSON.parse(authData);
      userName = userData.name || userData.email?.split('@')[0] || null;
    }
    
    // Tentar obter do elemento do portal
    const userNameEl = document.getElementById('userName');
    if (userNameEl && userNameEl.textContent) {
      userName = userNameEl.textContent.trim();
    }
    
    // Tentar obter do Supabase se disponível
    if (typeof getCurrentUser === 'function') {
      const user = await getCurrentUser();
      if (user && user.email) {
        userName = user.name || user.email.split('@')[0];
      }
    }
  } catch (error) {
    console.log('Não foi possível carregar nome do usuário:', error);
  }
}

// Inicializar chat
function initializeChat() {
  // Toggle chat window
  if (chatButton) {
    chatButton.addEventListener('click', toggleChat);
  }
  
  if (chatClose) {
    chatClose.addEventListener('click', closeChat);
  }
  
  // Enviar mensagem
  if (chatSend) {
    chatSend.addEventListener('click', sendMessage);
  }
  
  // Enter para enviar, Shift+Enter para nova linha
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }
  
  // Fechar ao clicar fora (opcional)
  document.addEventListener('click', (e) => {
    if (chatWindow && chatWindow.classList.contains('active')) {
      if (!chatWindow.contains(e.target) && !chatButton.contains(e.target)) {
        // Deixar aberto - comentado para melhor UX
        // closeChat();
      }
    }
  });
}

// Toggle chat
function toggleChat() {
  if (chatWindow.classList.contains('active')) {
    closeChat();
  } else {
    openChat();
  }
}

// Abrir chat
function openChat() {
  chatWindow.classList.add('active');
  chatInput.focus();
  scrollToBottom();
}

// Fechar chat
function closeChat() {
  chatWindow.classList.remove('active');
}

// Enviar mensagem
async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message || isProcessing) return;
  
  // Adicionar mensagem do usuário
  addMessage('user', message);
  chatInput.value = '';
  chatInput.style.height = 'auto';
  
  // Desabilitar input
  isProcessing = true;
  chatSend.disabled = true;
  chatInput.disabled = true;
  
  // Mostrar typing indicator
  const typingId = showTypingIndicator();
  
  try {
    // Obter contexto dos projetos
    const projectsContext = getProjectsContext();
    
    // Enviar para IA
    const response = await callAI(message, projectsContext);
    
    // Remover typing indicator
    removeTypingIndicator(typingId);
    
    // Adicionar resposta
    addMessage('assistant', response);
    
    // Salvar no histórico
    saveChatHistory();
    
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    removeTypingIndicator(typingId);
    addMessage('assistant', 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.');
  } finally {
    // Reabilitar input
    isProcessing = false;
    chatSend.disabled = false;
    chatInput.disabled = false;
    chatInput.focus();
  }
}

// Adicionar mensagem ao chat
function addMessage(role, content) {
  // Remover mensagem de boas-vindas se existir
  const welcome = chatMessages.querySelector('.chat-ia-welcome');
  if (welcome) {
    welcome.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-ia-message ${role}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'chat-ia-message-avatar';
  avatar.innerHTML = role === 'user' 
    ? '<i class="fas fa-user"></i>' 
    : '<i class="fas fa-robot"></i>';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'chat-ia-message-content';
  
  // Formatando o conteúdo (suporta markdown básico)
  contentDiv.innerHTML = formatMessage(content);
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);
  
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
  
  // Adicionar ao histórico
  chatHistory.push({ role, content, timestamp: new Date().toISOString() });
}

// Formatar mensagem (markdown básico)
function formatMessage(text) {
  // Quebras de linha
  text = text.replace(/\n/g, '<br>');
  
  // Listas
  text = text.replace(/^\- (.+)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Negrito
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Código inline
  text = text.replace(/`(.+?)`/g, '<code>$1</code>');
  
  return text;
}

// Mostrar indicador de digitação
function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-ia-message assistant';
  typingDiv.id = 'typing-indicator';
  
  const avatar = document.createElement('div');
  avatar.className = 'chat-ia-message-avatar';
  avatar.innerHTML = '<i class="fas fa-robot"></i>';
  
  const typingContent = document.createElement('div');
  typingContent.className = 'chat-ia-message-typing';
  typingContent.innerHTML = '<span></span><span></span><span></span>';
  
  typingDiv.appendChild(avatar);
  typingDiv.appendChild(typingContent);
  
  chatMessages.appendChild(typingDiv);
  scrollToBottom();
  
  return 'typing-indicator';
}

// Remover indicador de digitação
function removeTypingIndicator(id) {
  const indicator = document.getElementById(id);
  if (indicator) {
    indicator.remove();
  }
}

// Chamar IA
async function callAI(userMessage, context) {
  // Verificar se a API key está configurada
  const apiKey = getApiKey();
  
  if (apiKey && apiKey.trim() !== '') {
    // Usar API real da OpenAI
    return await callRealAPI(userMessage, context, apiKey);
  }
  
  // Mock response para desenvolvimento (quando não há API key configurada)
  return await generateMockResponse(userMessage, context);
}

// Gerar resposta mock (fallback quando API não está disponível)
async function generateMockResponse(userMessage, context) {
  // Simular delay da API
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Saudações - Respostas mais naturais e variadas
  if (lowerMessage.match(/^(olá|ola|oi|eai|e aí|hey|hello|bom dia|boa tarde|boa noite)/)) {
    const greetings = [
      `Oi${userName ? `, ${userName}` : ''}! 👋 Tudo bem?`,
      `Olá${userName ? `, ${userName}` : ''}! Como posso ajudar?`,
      `E aí${userName ? `, ${userName}` : ''}! 👋`,
      `Oi${userName ? `, ${userName}` : ''}! Tudo certo?`
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    return `${greeting}\n\nEm que posso te ajudar hoje?`;
  }
  
  // Perguntas sobre a plataforma/Lucid
  if (lowerMessage.includes('lucid') || lowerMessage.includes('plataforma') || lowerMessage.includes('sistema')) {
    return `A Lucid é uma plataforma de gestão e automação. Temos ferramentas pra gerenciar projetos (com várias visualizações), um CRM pra leads, e um portal central.\n\n` +
           `Usamos tecnologias como Python, Power Automate, VBA, N8N, e tudo roda no Supabase.\n\n` +
           `Tem algo específico que você quer saber?`;
  }
  
  // Perguntas sobre agenda (sinônimo de projetos/prazos)
  if (lowerMessage.includes('agenda') || lowerMessage.includes('cronograma') || 
      (lowerMessage.includes('como esta') && (lowerMessage.includes('minha') || lowerMessage.includes('a ')))) {
    if (context.totalProjects === 0) {
      return `Você ainda não tem projetos na sua agenda${userName ? `, ${userName}` : ''}!\n\n` +
             `Que tal começar criando alguns projetos? Posso te ajudar a organizar se quiser.`;
    }
    
    // Resposta sobre agenda/projetos - mais detalhada
    const introOptions = [
      `Olha, sua agenda tem ${context.totalProjects} projeto(s)!`,
      `Você está com ${context.totalProjects} projeto(s) na agenda no momento.`,
      `Sua agenda está com ${context.totalProjects} projeto(s).`
    ];
    let response = introOptions[Math.floor(Math.random() * introOptions.length)] + '\n\n';
    
    if (context.projects.length > 0) {
      response += `Aqui estão os principais:\n\n`;
      context.projects.slice(0, 5).forEach((project) => {
        const statusText = getStatusText(project.status);
        const priorityText = getPriorityText(project.prioridade);
        
        response += `**${project.nome}**\n`;
        response += `Status: ${statusText} | Prioridade: ${priorityText}`;
        if (project.data_fim) {
          const daysLeft = getDaysUntil(project.data_fim);
          if (daysLeft < 0) {
            response += ` | ⚠️ Vencido há ${Math.abs(daysLeft)} dias`;
          } else if (daysLeft <= 7) {
            response += ` | ⏰ Termina em ${daysLeft} dias`;
          } else {
            response += ` | 📅 Termina em ${daysLeft} dias`;
          }
        }
        response += `\n\n`;
      });
    }
    
    if (context.upcomingProjects > 0) {
      response += `Tem ${context.upcomingProjects} com prazo bem próximo (próximos 7 dias), então vale a pena ficar de olho! `;
    }
    
    if (context.lateProjects > 0) {
      response += `E tem ${context.lateProjects} projeto(s) com prazo vencido - que tal revisar eles?`;
    } else if (context.totalProjects > 0 && context.upcomingProjects === 0) {
      response += `Todos os prazos estão em dia! Continue assim! 🎉`;
    }
    
    return response;
  }
  
  // Perguntas sobre projetos
  if (lowerMessage.includes('projeto') || lowerMessage.includes('projetos')) {
    if (context.totalProjects === 0) {
      return `Você ainda não tem projetos cadastrados${userName ? `, ${userName}` : ''}! 😊\n\n` +
             `Que tal criar seu primeiro projeto? É só clicar no botão "Novo Projeto" lá em cima.\n\n` +
             `Se quiser, posso te ajudar a pensar em como estruturá-lo!`;
    }
    
    // Respostas variadas
    const introOptions = [
      `Você tem ${context.totalProjects} projeto(s) no sistema!`,
      `Encontrei ${context.totalProjects} projeto(s) seus.`,
      `Você está trabalhando em ${context.totalProjects} projeto(s) no momento.`
    ];
    let response = introOptions[Math.floor(Math.random() * introOptions.length)] + '\n\n';
    
    if (context.projects.length > 0) {
      response += `Aqui estão os principais:\n\n`;
      context.projects.slice(0, 5).forEach((project, idx) => {
        const statusText = getStatusText(project.status);
        const priorityText = getPriorityText(project.prioridade);
        
        response += `**${project.nome}**\n`;
        response += `Status: ${statusText} | Prioridade: ${priorityText}`;
        if (project.data_fim) {
          const daysLeft = getDaysUntil(project.data_fim);
          if (daysLeft < 0) {
            response += ` | ⚠️ Vencido há ${Math.abs(daysLeft)} dias`;
          } else if (daysLeft <= 7) {
            response += ` | ⏰ Termina em ${daysLeft} dias`;
          } else {
            response += ` | 📅 Termina em ${daysLeft} dias`;
          }
        }
        response += `\n\n`;
      });
    }
    
    if (context.lateProjects > 0) {
      response += `Ah, e tem ${context.lateProjects} projeto(s) com prazo vencido. Que tal dar uma olhada neles?`;
    }
    
    return response;
  }
  
  // Perguntas sobre tempo/futuro (amanhã, hoje, semana, próximo, etc.)
  if (lowerMessage.includes('amanhã') || lowerMessage.includes('amanha') || 
      lowerMessage.includes('hoje') || lowerMessage.includes('próximo') || lowerMessage.includes('proximo') ||
      lowerMessage.includes('semana') || lowerMessage.includes('preciso fazer') || 
      lowerMessage.includes('o que fazer') || lowerMessage.includes('tenho que fazer') ||
      lowerMessage.includes('tenho pra fazer') || lowerMessage.includes('fazer hoje') ||
      lowerMessage.includes('fazer amanhã') || lowerMessage.includes('fazer amanha')) {
    
    if (context.totalProjects === 0) {
      return `Você não tem projetos cadastrados ainda${userName ? `, ${userName}` : ''}.\n\n` +
             `Que tal criar alguns projetos para começar a organizar?`;
    }
    
    // Filtrar projetos por data relevante
    let relevantProjects = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (lowerMessage.includes('amanhã') || lowerMessage.includes('amanha')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      relevantProjects = context.projects.filter(p => {
        if (!p.data_fim || p.status === 'concluido' || p.status === 'cancelado') return false;
        const endDate = new Date(p.data_fim);
        endDate.setHours(0, 0, 0, 0);
        return endDate.getTime() === tomorrow.getTime();
      });
      
      if (relevantProjects.length > 0) {
        let response = `Amanhã você tem ${relevantProjects.length} projeto(s) com prazo:\n\n`;
        relevantProjects.slice(0, 5).forEach(project => {
          response += `**${project.nome}**\n`;
          response += `Status: ${getStatusText(project.status)} | Prioridade: ${getPriorityText(project.prioridade)}\n\n`;
        });
        return response;
      } else {
        return `Amanhã não tem projetos com prazo marcado! 🎉\n\n` +
               `Mas você tem ${context.totalProjects} projeto(s) no total. Quer ver todos eles?`;
      }
    }
    
    if (lowerMessage.includes('hoje')) {
      relevantProjects = context.projects.filter(p => {
        if (!p.data_fim || p.status === 'concluido' || p.status === 'cancelado') return false;
        const endDate = new Date(p.data_fim);
        endDate.setHours(0, 0, 0, 0);
        return endDate.getTime() === now.getTime();
      });
      
      if (relevantProjects.length > 0) {
        let response = `Hoje você tem ${relevantProjects.length} projeto(s) com prazo:\n\n`;
        relevantProjects.slice(0, 5).forEach(project => {
          response += `**${project.nome}**\n`;
          response += `Status: ${getStatusText(project.status)} | Prioridade: ${getPriorityText(project.prioridade)}\n\n`;
        });
        return response;
      } else {
        return `Hoje não tem projetos com prazo marcado! 🎉\n\n` +
               `Você tem ${context.totalProjects} projeto(s) no total. Quer ver todos eles?`;
      }
    }
    
    // Se perguntou sobre "próximo" ou "semana" ou "preciso fazer"
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);
    
    relevantProjects = context.projects.filter(p => {
      if (!p.data_fim || p.status === 'concluido' || p.status === 'cancelado') return false;
      const endDate = new Date(p.data_fim);
      endDate.setHours(0, 0, 0, 0);
      return endDate >= now && endDate <= in7Days;
    });
    
    if (relevantProjects.length > 0) {
      let response = `Nos próximos dias você tem ${relevantProjects.length} projeto(s) com prazo próximo:\n\n`;
      relevantProjects.slice(0, 5).forEach(project => {
        const daysLeft = getDaysUntil(project.data_fim);
        response += `**${project.nome}**\n`;
        response += `Prazo em ${daysLeft} dia(s) | Prioridade: ${getPriorityText(project.prioridade)}\n\n`;
      });
      if (relevantProjects.length > 5) {
        response += `E mais ${relevantProjects.length - 5} projeto(s)...\n\n`;
      }
      response += `Vale a pena dar uma olhada neles!`;
      return response;
    } else {
      return `Você não tem projetos com prazo nos próximos dias! 🎉\n\n` +
             `Mas você tem ${context.totalProjects} projeto(s) no total. Quer ver todos eles?`;
    }
  }
  
  // Perguntas sobre prazos
  if (lowerMessage.includes('prazo') || lowerMessage.includes('vencimento') || lowerMessage.includes('deadline')) {
    if (context.lateProjects > 0) {
      return `Você tem ${context.lateProjects} projeto(s) com prazo vencido${userName ? `, ${userName}` : ''}.\n\n` +
             `Que tal revisar esses projetos? Pode ser bom atualizar as datas ou reavaliar o status deles.`;
    }
    
    if (context.upcomingProjects > 0) {
      return `Tem ${context.upcomingProjects} projeto(s) com prazos bem próximos (próximos 7 dias). Vale a pena dar uma olhada neles pra garantir que está tudo nos trilhos!`;
    }
    
    return `Boa notícia! Todos os seus projetos estão dentro dos prazos. Continue assim! 🎉`;
  }
  
  // Perguntas sobre status
  if (lowerMessage.includes('status') || lowerMessage.includes('andamento')) {
    if (context.statusCount && Object.keys(context.statusCount).length > 0) {
      let response = `Aqui está como estão seus projetos:\n\n`;
      Object.entries(context.statusCount).forEach(([status, count]) => {
        response += `**${getStatusText(status)}**: ${count}`;
        if (count === 1) response += ` projeto`;
        else response += ` projetos`;
        response += `\n`;
      });
      return response;
    }
    return `Não encontrei projetos no momento. Você já criou algum projeto?`;
  }
  
  // Perguntas sobre planejamento
  if (lowerMessage.includes('planejar') || lowerMessage.includes('planejamento') || lowerMessage.includes('criar projeto')) {
    return `Pra planejar bem um projeto, pense em:\n\n` +
           `- O que você quer alcançar (objetivo claro)\n` +
           `- Prazos realistas (sempre deixe uma margem)\n` +
           `- O que é mais urgente e importante\n` +
           `- Quem vai fazer o quê (equipe)\n\n` +
           `Aqui na plataforma você pode organizar tudo isso e ainda visualizar de várias formas - Grid, Kanban, Gantt, Calendário...\n\n` +
           `Tem algum projeto específico em mente? Posso te ajudar a pensar em como estruturá-lo!`;
  }
  
  // Perguntas sobre funcionalidades
  if (lowerMessage.includes('funcionalidade') || lowerMessage.includes('ferramenta') || lowerMessage.includes('como usar') || lowerMessage.includes('como fazer')) {
    return `A plataforma tem várias coisas legais! Tem o sistema de projetos (com várias visualizações tipo Gantt, Kanban, etc), o CRM pra gerenciar leads, e o portal central.\n\n` +
           `O que você quer saber especificamente?`;
  }
  
  // Perguntas sobre CRM
  if (lowerMessage.includes('crm') || lowerMessage.includes('lead') || lowerMessage.includes('cliente')) {
    return `O CRM aqui serve pra gerenciar seus leads e clientes. Os leads que chegam pelo formulário de contato aparecem lá, e você acompanha desde quando são novos até quando viram clientes (convertidos).\n\n` +
           `Também dá pra ver estatísticas e exportar os dados. Quer saber algo específico sobre o CRM?`;
  }
  
  // Agradecimentos
  if (lowerMessage.match(/(obrigado|obrigada|valeu|agradeço|thanks|thank you)/)) {
    const thanksOptions = [
      `De nada${userName ? `, ${userName}` : ''}! 😊 Qualquer coisa é só chamar!`,
      `Por nada! Se precisar de mais alguma coisa, só falar.`,
      `Tranquilo${userName ? `, ${userName}` : ''}! Fico feliz em ajudar.`,
      `Disponha! Se tiver mais alguma dúvida, estou aqui.`
    ];
    return thanksOptions[Math.floor(Math.random() * thanksOptions.length)];
  }
  
  // Perguntas sobre organização/gestão/dicas
  if (lowerMessage.includes('dica') || lowerMessage.includes('ajuda') || 
      lowerMessage.includes('não me perder') || lowerMessage.includes('organizar') ||
      lowerMessage.includes('organização') || lowerMessage.includes('gestão') ||
      lowerMessage.includes('como fazer') || lowerMessage.includes('como gerir')) {
    
    let tips = `Algumas dicas que podem ajudar:\n\n`;
    
    if (context.totalProjects > 0) {
      if (context.lateProjects > 0) {
        tips += `1. Primeiro, revise os ${context.lateProjects} projeto(s) com prazo vencido - atualize as datas ou reavalie o status deles\n`;
      }
      
      if (context.upcomingProjects > 0) {
        tips += `2. Você tem ${context.upcomingProjects} projeto(s) com prazos próximos - priorize esses!\n`;
      }
      
      tips += `3. Use as visualizações da plataforma (Gantt, Kanban) pra ter uma visão melhor dos prazos\n`;
      tips += `4. Revise sua agenda regularmente - pelo menos uma vez por semana\n`;
      tips += `5. Defina prioridades claras - não adianta tentar fazer tudo ao mesmo tempo\n`;
    } else {
      tips += `1. Comece criando seus projetos na plataforma\n`;
      tips += `2. Defina prazos realistas (sempre deixe uma margem)\n`;
      tips += `3. Use as visualizações (Gantt, Kanban) pra acompanhar melhor\n`;
      tips += `4. Revise regularmente - organização é um processo contínuo\n`;
    }
    
    return tips + `\nQuer ajuda com algo específico?`;
  }
  
  // Resposta genérica mais inteligente - tentar inferir pelo contexto
  // Se tem projetos no contexto, oferecer ajuda relacionada
  if (context.totalProjects > 0) {
    const contextualResponses = [
      `Desculpa, não entendi bem. Você quer saber sobre seus ${context.totalProjects} projetos? Ou sobre algo específico da plataforma?`,
      `Hmm, não captei direito. Pode reformular? Se for sobre seus projetos, posso te ajudar com informações, prazos, dicas de organização...`,
      `Não entendi essa pergunta. É sobre seus projetos, prazos, ou alguma funcionalidade da plataforma?`
    ];
    return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
  }
  
  // Resposta genérica padrão
  const genericResponses = [
    `Hmm, não entendi direito. Pode reformular?`,
    `Desculpa, não captei. Pode repetir de outra forma?`,
    `Não entendi bem. Pode explicar melhor?`
  ];
  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

// Obter contexto dos projetos
function getProjectsContext() {
  try {
    // Tentar acessar projetos do script projetos.js
    let projects = [];
    
    if (typeof window.getAllProjects === 'function') {
      projects = window.getAllProjects();
    } else if (typeof getAllProjects === 'function') {
      projects = getAllProjects();
    } else if (typeof allProjects !== 'undefined' && Array.isArray(allProjects)) {
      projects = allProjects;
    } else {
      // Tentar carregar do localStorage como fallback
      try {
        const saved = localStorage.getItem('lucid_projetos');
        if (saved) {
          projects = JSON.parse(saved);
        }
      } catch (e) {
        console.error('Erro ao carregar projetos do localStorage:', e);
      }
    }
    
    if (Array.isArray(projects) && projects.length > 0) {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const lateProjects = projects.filter(p => {
        if (!p.data_fim || p.status === 'concluido' || p.status === 'cancelado') return false;
        return new Date(p.data_fim) < now;
      });
      
      const upcomingProjects = projects.filter(p => {
        if (!p.data_fim || p.status === 'concluido' || p.status === 'cancelado') return false;
        const endDate = new Date(p.data_fim);
        return endDate >= now && endDate <= in7Days;
      });
      
      const statusCount = {};
      projects.forEach(p => {
        statusCount[p.status] = (statusCount[p.status] || 0) + 1;
      });
      
      return {
        totalProjects: projects.length,
        projects: projects.slice(0, 10), // Limitar a 10 para contexto
        lateProjects: lateProjects.length,
        upcomingProjects: upcomingProjects.length,
        statusCount
      };
    }
  } catch (error) {
    console.error('Erro ao obter contexto dos projetos:', error);
  }
  
  return {
    totalProjects: 0,
    projects: [],
    lateProjects: 0,
    upcomingProjects: 0,
    statusCount: {}
  };
}

// Funções auxiliares
function getStatusText(status) {
  const statusMap = {
    'planejamento': 'Planejamento',
    'em_andamento': 'Em Andamento',
    'pausado': 'Pausado',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado'
  };
  return statusMap[status] || status;
}

function getPriorityText(priority) {
  const priorityMap = {
    'baixa': 'Baixa',
    'normal': 'Normal',
    'alta': 'Alta',
    'urgente': 'Urgente'
  };
  return priorityMap[priority] || priority;
}

function getDaysUntil(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Scroll para o final
function scrollToBottom() {
  if (chatMessages) {
    // Scroll suave para melhor UX
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: 'smooth'
    });
  }
}

// Salvar histórico no localStorage
function saveChatHistory() {
  try {
    localStorage.setItem('lucid-chat-history', JSON.stringify(chatHistory));
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
  }
}

// Carregar histórico do localStorage
function loadChatHistory() {
  try {
    const saved = localStorage.getItem('lucid-chat-history');
    if (saved) {
      chatHistory = JSON.parse(saved);
      // Renderizar histórico (limitar a últimas 20 mensagens)
      const recentHistory = chatHistory.slice(-20);
      recentHistory.forEach(msg => {
        if (msg.role !== 'system') {
          addMessageToDOM(msg.role, msg.content);
        }
      });
    }
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
  }
}

// Adicionar mensagem ao DOM (sem animação)
function addMessageToDOM(role, content) {
  const welcome = chatMessages.querySelector('.chat-ia-welcome');
  if (welcome) {
    welcome.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-ia-message ${role}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'chat-ia-message-avatar';
  avatar.innerHTML = role === 'user' 
    ? '<i class="fas fa-user"></i>' 
    : '<i class="fas fa-robot"></i>';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'chat-ia-message-content';
  contentDiv.innerHTML = formatMessage(content);
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);
  
  chatMessages.appendChild(messageDiv);
}

// Função para usar API real da OpenAI
async function callRealAPI(userMessage, context, apiKey) {
  try {
    // Preparar contexto detalhado dos projetos para o sistema
    let contextString = '';
    
    if (context.totalProjects > 0) {
      contextString = `\n\nCONTEXTO ATUAL DO USUÁRIO:\n` +
        `- Total de projetos: ${context.totalProjects}\n` +
        `- Projetos atrasados: ${context.lateProjects}\n` +
        `- Projetos com prazo próximo (7 dias): ${context.upcomingProjects}\n` +
        `- Distribuição por status: ${JSON.stringify(context.statusCount)}\n`;
      
      if (context.projects.length > 0) {
        contextString += `\nProjetos principais (últimos ${Math.min(5, context.projects.length)}):\n`;
        context.projects.slice(0, 5).forEach((p, idx) => {
          const daysLeft = p.data_fim ? getDaysUntil(p.data_fim) : null;
          contextString += `${idx + 1}. ${p.nome} - Status: ${p.status}, Prioridade: ${p.prioridade || 'normal'}`;
          if (daysLeft !== null) {
            contextString += daysLeft < 0 ? `, Prazo VENCIDO há ${Math.abs(daysLeft)} dias` : `, Prazo em ${daysLeft} dias`;
          }
          if (p.cliente) contextString += `, Cliente: ${p.cliente}`;
          contextString += '\n';
        });
      }
    } else {
      contextString = '\n\nCONTEXTO: O usuário ainda não tem projetos cadastrados na plataforma.';
    }
    
    // Adicionar nome do usuário ao contexto se disponível
    if (userName) {
      contextString += `\n\nNome do usuário: ${userName} (use este nome naturalmente na conversa quando fizer sentido, mas não force).`;
    }
    
    // Adicionar instruções sobre entendimento de contexto
    contextString += `\n\nIMPORTANTE - ENTENDIMENTO INTELIGENTE:
    - Se o usuário perguntar sobre "agenda", entenda que é sobre projetos/prazos
    - Se perguntar "não me perder" ou "organização", ofereça dicas práticas de gestão
    - Se perguntar "o que fazer amanhã/hoje/próximo", liste os projetos com prazos nessas datas
    - Se perguntar "preciso fazer" ou "tenho que fazer", mostre projetos pendentes/importantes
    - Seja PROATIVO e ÚTIL, não apenas literal nas interpretações
    - Tente INFERIR pelo contexto o que o usuário realmente quer saber
    - Sempre relacione perguntas sobre TEMPO com projetos que têm prazos nessas datas`;
    
    const response = await fetch(CHAT_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: CHAT_CONFIG.model,
        messages: [
          { role: 'system', content: CHAT_CONFIG.systemPrompt + contextString },
          ...chatHistory.slice(-10).map(msg => ({ role: msg.role, content: msg.content })),
          { role: 'user', content: userMessage }
        ],
        temperature: 0.9, // Aumentado ainda mais para respostas mais naturais e variadas
        max_tokens: 1500,
        presence_penalty: 0.4, // Aumentado para mais variação
        frequency_penalty: 0.4 // Aumentado para evitar repetições
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro na API OpenAI:', errorData);
      
      // Mensagens de erro mais amigáveis
      if (response.status === 401) {
        throw new Error('Chave da API inválida. Verifique as configurações.');
      } else if (response.status === 429) {
        throw new Error('Muitas requisições. Aguarde um momento e tente novamente.');
      } else {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error('Resposta inválida da API');
    }
    
  } catch (error) {
    console.error('Erro ao chamar API OpenAI:', error);
    
    // Fallback para mock em caso de erro, mas informar o usuário
    console.log('⚠️ Usando resposta mock devido ao erro');
    
    // Adicionar mensagem de fallback mais amigável
    const mockResponse = await generateMockResponse(userMessage, context);
    return mockResponse + '\n\n*Nota: Estou usando respostas básicas no momento. Para respostas mais completas, verifique a configuração da API.*';
  }
}

