/* ============================================
   ANIMAÇÕES DE SCROLL E SCROLL SUAVE
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  // Scroll suave para links internos
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Ignorar links vazios ou apenas #
      if (href === '#' || href === '') {
        e.preventDefault();
        return;
      }

      const target = document.querySelector(href);
      
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Intersection Observer para animações de scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observar elementos para animação
  const animateElements = document.querySelectorAll('.card, .section-title, .section-subtitle, .mvv-card');
  animateElements.forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });

  // Adicionar delay aos cards do grid
  const cards = document.querySelectorAll('.grid .card');
  cards.forEach((card, index) => {
    card.classList.add('fade-in-up-delay');
    card.style.animationDelay = `${index * 0.1}s`;
  });

  // Adicionar delay aos cards MVV
  const mvvCards = document.querySelectorAll('.mvv-card');
  mvvCards.forEach((card, index) => {
    card.classList.add('fade-in-up-delay');
    card.style.animationDelay = `${index * 0.15}s`;
  });
});

