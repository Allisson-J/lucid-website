/* ============================================
   LOGIN PAGE - Lógica de Login
   ============================================ */

document.addEventListener('DOMContentLoaded', async function() {
  // Se já estiver autenticado, redirecionar para Portal
  const authenticated = await isAuthenticated();
  if (authenticated) {
    window.location.href = 'portal.html';
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  const submitButton = loginForm.querySelector('button[type="submit"]');

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validação
    if (!email || !password) {
      showMessage('Por favor, preencha todos os campos.', 'error');
      return;
    }

    // Desabilitar botão durante login
    submitButton.disabled = true;
    submitButton.textContent = 'Entrando...';

    // Tentar login (agora é async)
    const result = await login(email, password);

    submitButton.disabled = false;
    submitButton.textContent = 'Entrar';

    if (result.success) {
      showMessage(result.message, 'success');
      setTimeout(() => {
        window.location.href = 'portal.html';
      }, 1000);
    } else {
      showMessage(result.message, 'error');
    }
  });

  function showMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = `form-message ${type}`;
    loginMessage.style.display = 'block';

    if (type === 'success') {
      loginMessage.style.background = 'rgba(34, 197, 94, 0.1)';
      loginMessage.style.border = '1px solid rgba(34, 197, 94, 0.3)';
      loginMessage.style.color = '#22c55e';
    } else {
      loginMessage.style.background = 'rgba(239, 68, 68, 0.1)';
      loginMessage.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      loginMessage.style.color = '#ef4444';
    }
  }
});

