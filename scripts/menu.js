/* ============================================
   MENU RESPONSIVO
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('nav');
  const navLinks = document.querySelectorAll('nav a');

  // Toggle menu mobile
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      nav.classList.toggle('active');
      const icon = menuToggle.querySelector('i') || menuToggle;
      icon.textContent = nav.classList.contains('active') ? '✕' : '☰';
    });
  }

  // Fechar menu ao clicar em um link
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth < 768) {
        nav.classList.remove('active');
        const icon = menuToggle.querySelector('i') || menuToggle;
        icon.textContent = '☰';
      }
    });
  });

  // Fechar menu ao redimensionar a janela
  window.addEventListener('resize', function() {
    if (window.innerWidth >= 768) {
      nav.classList.remove('active');
    }
  });

  // Adicionar classe scrolled ao header
  const header = document.querySelector('header');
  let lastScroll = 0;

  window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });
});

