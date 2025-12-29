/* ============================================
   FORMULÁRIO DE CONTATO
   ============================================ */

// Função para salvar lead (Supabase ou localStorage)
async function saveLead(formData) {
  // Verificar se Supabase está disponível
  if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
    const supabase = getSupabaseClient();
    
    // Tentar salvar no Supabase primeiro
    if (supabase && isSupabaseConfigured()) {
      try {

        const { data, error } = await supabase
          .from('leads')
          .insert([
            {
              name: formData.name,
              email: formData.email,
              phone: formData.phone || null,
              message: formData.message,
              status: 'new'
            }
          ])
          .select();

        if (error) {
          // Erro 42501 = violação de política RLS
          if (error.code === '42501' || error.message?.includes('row-level security')) {
            console.error('');
            console.error('═══════════════════════════════════════════════════════════');
            console.error('⚠️  ERRO 42501: Política RLS bloqueando inserção!');
            console.error('═══════════════════════════════════════════════════════════');
            console.error('');
            console.error('📋 SOLUÇÃO SIMPLES: Desabilitar RLS completamente');
            console.error('');
            console.error('🔗 Passos:');
            console.error('   1. Abra: DESABILITAR-RLS.sql');
            console.error('   2. Copie TODO o conteúdo');
            console.error('   3. Acesse: https://supabase.com/dashboard');
            console.error('   4. Selecione seu projeto');
            console.error('   5. Vá em: SQL Editor (menu lateral)');
            console.error('   6. Clique em: New Query');
            console.error('   7. Cole o SQL copiado');
            console.error('   8. Clique em: RUN (ou Ctrl+Enter)');
            console.error('   9. Verifique se apareceu "✅ RLS DESABILITADO"');
            console.error('  10. Limpe o cache (Ctrl+Shift+Delete) e recarregue (F5)');
            console.error('');
            console.error('═══════════════════════════════════════════════════════════');
            console.error('');
            
            // Mostrar alerta visual
            alert('⚠️ ERRO 42501: Política RLS bloqueando!\n\n📋 SOLUÇÃO SIMPLES:\n1. Abra: DESABILITAR-RLS.sql\n2. Copie TODO o conteúdo\n3. Cole no SQL Editor do Supabase\n4. Clique em RUN\n5. Verifique "✅ RLS DESABILITADO"\n6. Limpe cache e recarregue');
            
            throw error;
          }
          // Erro 401 = não autorizado (geralmente também é RLS)
          else if (error.code === 'PGRST301' || error.message?.includes('401') || error.message?.includes('permission')) {
            console.error('⚠️ Erro de permissão (401). Execute o SQL do arquivo CORRIGIR-RLS-SIMPLES.sql no SQL Editor do Supabase.');
            alert('⚠️ Erro de permissão!\n\nExecute o SQL do arquivo CORRIGIR-RLS-SIMPLES.sql no Supabase.');
            throw error;
          }
          
          // Outros erros
          console.error('❌ Erro do Supabase:', error.message);
          throw error;
        }

        console.log('✅ Lead salvo no Supabase com sucesso!', data);
        return Promise.resolve();
      } catch (error) {
        console.error('❌ Erro ao salvar no Supabase, usando localStorage como fallback:', error);
        // Continuar para salvar no localStorage como fallback
      }
    }
  }

  // Fallback: salvar no localStorage
  try {
    const leads = JSON.parse(localStorage.getItem('lucid_leads') || '[]');
    const newLead = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone || '',
      message: formData.message,
      status: 'new',
      createdAt: new Date().toISOString()
    };
    leads.unshift(newLead);
    localStorage.setItem('lucid_leads', JSON.stringify(leads));
    console.log('Lead salvo no localStorage com sucesso!');
    return Promise.resolve();
  } catch (e) {
    console.error('Erro ao salvar lead:', e);
    return Promise.reject(e);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  
  if (!contactForm) return;

  // Configurar botões de WhatsApp e Instagram
  const whatsappBtn = document.getElementById('whatsappBtn');
  const instagramBtn = document.getElementById('instagramBtn');
  
  if (whatsappBtn) {
    const whatsappNumber = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.whatsappNumber : '5581986919496';
    whatsappBtn.href = `https://wa.me/${whatsappNumber}`;
    // Estilos e animações são gerenciados via CSS (styles/social-buttons.css)
  }
  
  if (instagramBtn) {
    const instagramUrl = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.instagramUrl : 'https://instagram.com/lucid.social';
    instagramBtn.href = instagramUrl;
    // Estilos e animações são gerenciados via CSS (styles/social-buttons.css)
  }

  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Obter valores do formulário
    const formData = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      message: document.getElementById('message').value.trim()
    };

    // Validação básica
    if (!formData.name || !formData.email || !formData.message) {
      showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showMessage('Por favor, insira um email válido.', 'error');
      return;
    }

    // Simular envio (aqui você integraria com WhatsApp, Email ou Supabase)
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    // Salvar lead no CRM (Supabase ou localStorage)
    saveLead(formData).then(() => {
      // Mostrar mensagem de sucesso
      showMessage('Mensagem enviada com sucesso! Em breve entraremos em contato.', 'success');
      
      // Resetar formulário
      contactForm.reset();
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }).catch((error) => {
      console.error('Erro ao salvar lead:', error);
      showMessage('Erro ao enviar mensagem. Tente novamente mais tarde.', 'error');
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    });
  });
});

function showMessage(message, type) {
  // Remover mensagens anteriores
  const existingMessage = document.querySelector('.form-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `form-message ${type}`;
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: 6px;
    background: ${type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'};
    border: 1px solid ${type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'};
    color: ${type === 'error' ? '#ef4444' : '#22c55e'};
    font-size: 0.9rem;
  `;

  const form = document.getElementById('contactForm');
  form.insertBefore(messageDiv, form.firstChild);

  // Remover mensagem após 5 segundos
  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}


