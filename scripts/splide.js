/* ============================================
   SPLIDE SLIDER - Projetos
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  const projectsSlider = document.querySelector('.projects-slider');
  
  if (projectsSlider) {
    const splide = new Splide('.projects-slider', {
      type: 'loop',
      drag: 'free',
      perPage: 3,
      perMove: 1,
      gap: '2rem',
      pagination: true,
      arrows: true,
      autoplay: false,
      breakpoints: {
        1024: {
          perPage: 2,
          gap: '1.5rem',
        },
        640: {
          perPage: 1,
          gap: '1rem',
        },
      },
    });

    splide.mount();

    // Adicionar efeito de hover nos slides
    const slides = document.querySelectorAll('.splide__slide');
    slides.forEach(slide => {
      slide.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
      });
      
      slide.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
      });
    });
  }
});

