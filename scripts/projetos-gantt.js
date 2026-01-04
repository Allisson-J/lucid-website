/* ============================================
   GANTT, CALENDAR E TIMELINE - Projetos
   ============================================ */

let currentGanttDate = new Date();
let currentCalendarDate = new Date();

// Renderizar visualização Gantt
function renderGanttView(projects) {
  const container = document.getElementById('ganttContainer');
  if (!container) return;
  
  const ganttMonthYear = document.getElementById('ganttMonthYear');
  if (ganttMonthYear) {
    ganttMonthYear.textContent = currentGanttDate.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    }).replace(/^\w/, c => c.toUpperCase());
  }
  
  // Renderizar lista de projetos
  const projectsList = document.getElementById('ganttProjectsList');
  if (projectsList) {
    projectsList.innerHTML = projects.map(project => `
      <div class="gantt-project-row" title="${escapeHtml(project.nome)}">
        ${escapeHtml(project.nome)}
      </div>
    `).join('');
  }
  
  // Renderizar timeline e barras
  renderGanttTimeline(projects);
  
  // Configurar controles
  setupGanttControls();
}

// Renderizar timeline do Gantt
function renderGanttTimeline(projects) {
  const timelineContainer = document.getElementById('ganttTimeline');
  const barsContainer = document.getElementById('ganttBars');
  
  if (!timelineContainer || !barsContainer) return;
  
  // Calcular primeiro e último dia do mês
  const year = currentGanttDate.getFullYear();
  const month = currentGanttDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  
  // Gerar cabeçalho dos dias
  timelineContainer.innerHTML = '';
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.toDateString() === today.toDateString();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    const dayHeader = document.createElement('div');
    dayHeader.className = `gantt-day-header ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`;
    dayHeader.textContent = `${day}`;
    dayHeader.setAttribute('data-day', day);
    timelineContainer.appendChild(dayHeader);
  }
  
  // Gerar barras Gantt
  barsContainer.innerHTML = '';
  projects.forEach((project, index) => {
    const row = document.createElement('div');
    row.className = 'gantt-bar-row';
    
    if (project.data_inicio && project.data_fim) {
      const startDate = new Date(project.data_inicio);
      const endDate = new Date(project.data_fim);
      
      // Calcular posição e largura da barra
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();
      const startMonth = startDate.getMonth();
      const endMonth = endDate.getMonth();
      
      // Se o projeto está dentro do mês atual
      if ((startMonth === month || endMonth === month) || 
          (startMonth < month && endMonth > month)) {
        const barStart = Math.max(1, startMonth === month ? startDay : 1);
        const barEnd = Math.min(daysInMonth, endMonth === month ? endDay : daysInMonth);
        const barWidth = (barEnd - barStart + 1) * 60; // 60px por dia
        const barLeft = (barStart - 1) * 60;
        
        // Verificar se está atrasado
        const isAtrasado = new Date(project.data_fim) < new Date() && project.status !== 'concluido';
        
        // Definir classe baseada no status
        let statusClass = '';
        if (project.status === 'concluido') {
          statusClass = 'concluido';
        } else if (isAtrasado) {
          statusClass = 'atrasado';
        } else {
          statusClass = project.status || 'planejamento';
        }
        
        const bar = document.createElement('div');
        bar.className = `gantt-bar ${statusClass}`;
        bar.style.left = `${barLeft}px`;
        bar.style.width = `${barWidth}px`;
        bar.textContent = project.nome.length > 20 ? project.nome.substring(0, 20) + '...' : project.nome;
        bar.title = `${project.nome} - ${formatDate(project.data_inicio)} a ${formatDate(project.data_fim)}`;
        bar.addEventListener('click', () => editProject(project.id));
        
        row.appendChild(bar);
      }
    }
    
    barsContainer.appendChild(row);
  });
}

// Configurar controles do Gantt
function setupGanttControls() {
  const prevBtn = document.getElementById('ganttPrevMonth');
  const nextBtn = document.getElementById('ganttNextMonth');
  const todayBtn = document.getElementById('ganttToday');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentGanttDate.setMonth(currentGanttDate.getMonth() - 1);
      const filteredProjects = getFilteredProjects();
      renderGanttView(filteredProjects);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentGanttDate.setMonth(currentGanttDate.getMonth() + 1);
      const filteredProjects = getFilteredProjects();
      renderGanttView(filteredProjects);
    });
  }
  
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      currentGanttDate = new Date();
      const filteredProjects = getFilteredProjects();
      renderGanttView(filteredProjects);
    });
  }
}

// Renderizar visualização de calendário
function renderCalendarView(projects) {
  const container = document.getElementById('calendarContainer');
  if (!container) return;
  
  const calendarMonthYear = document.getElementById('calendarMonthYear');
  if (calendarMonthYear) {
    calendarMonthYear.textContent = currentCalendarDate.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    }).replace(/^\w/, c => c.toUpperCase());
  }
  
  const calendarGrid = document.getElementById('calendarGrid');
  if (!calendarGrid) return;
  
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  const today = new Date();
  
  // Nomes dos dias da semana
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  calendarGrid.innerHTML = '';
  
  // Cabeçalhos dos dias
  dayNames.forEach(dayName => {
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = dayName;
    calendarGrid.appendChild(header);
  });
  
  // Dias do mês anterior (para preencher início)
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = document.createElement('div');
    day.className = 'calendar-day other-month';
    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = prevMonthLastDay - i;
    day.appendChild(dayNumber);
    day.appendChild(document.createElement('div')).className = 'calendar-day-events';
    calendarGrid.appendChild(day);
  }
  
  // Dias do mês atual
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.toDateString() === today.toDateString();
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${isToday ? 'today' : ''}`;
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'calendar-day-events';
    
    // Adicionar projetos que começam ou terminam neste dia
    projects.forEach(project => {
      if (project.data_inicio === dateString || project.data_fim === dateString) {
        const event = document.createElement('div');
        event.className = `calendar-event ${project.status || 'planejamento'}`;
        event.textContent = project.nome.length > 15 ? project.nome.substring(0, 15) + '...' : project.nome;
        event.title = `${project.nome} - ${formatDate(project.data_inicio)} a ${formatDate(project.data_fim)}`;
        event.addEventListener('click', (e) => {
          e.stopPropagation();
          editProject(project.id);
        });
        eventsContainer.appendChild(event);
      }
    });
    
    dayElement.appendChild(eventsContainer);
    calendarGrid.appendChild(dayElement);
  }
  
  // Configurar controles do calendário
  setupCalendarControls();
}

// Configurar controles do calendário
function setupCalendarControls() {
  const prevBtn = document.getElementById('calendarPrevMonth');
  const nextBtn = document.getElementById('calendarNextMonth');
  const todayBtn = document.getElementById('calendarToday');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      const filteredProjects = getFilteredProjects();
      renderCalendarView(filteredProjects);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      const filteredProjects = getFilteredProjects();
      renderCalendarView(filteredProjects);
    });
  }
  
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      currentCalendarDate = new Date();
      const filteredProjects = getFilteredProjects();
      renderCalendarView(filteredProjects);
    });
  }
}

// Renderizar visualização Timeline
function renderTimelineView(projects) {
  const timelineContent = document.getElementById('timelineContent');
  if (!timelineContent) return;
  
  // Ordenar projetos por data de início
  const sortedProjects = [...projects].filter(p => p.data_inicio).sort((a, b) => {
    return new Date(a.data_inicio) - new Date(b.data_inicio);
  });
  
  timelineContent.innerHTML = '<div class="timeline-line"></div>';
  
  sortedProjects.forEach(project => {
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    
    const date = document.createElement('div');
    date.className = 'timeline-date';
    date.textContent = formatDate(project.data_inicio);
    
    const projectElement = document.createElement('div');
    projectElement.className = 'timeline-project';
    projectElement.addEventListener('click', () => editProject(project.id));
    
    const title = document.createElement('div');
    title.className = 'timeline-project-title';
    title.textContent = project.nome;
    
    const meta = document.createElement('div');
    meta.className = 'timeline-project-meta';
    meta.innerHTML = `
      <span><i class="fas fa-flag"></i> ${STATUS_OPTIONS[project.status] || project.status}</span>
      ${project.data_fim ? `<span><i class="fas fa-calendar-check"></i> ${formatDate(project.data_fim)}</span>` : ''}
      ${project.cliente ? `<span><i class="fas fa-user"></i> ${escapeHtml(project.cliente)}</span>` : ''}
    `;
    
    projectElement.appendChild(title);
    if (project.descricao) {
      const desc = document.createElement('div');
      desc.style.cssText = 'color: var(--text-secondary); font-size: 0.9rem; margin-top: var(--spacing-xs);';
      desc.textContent = project.descricao.length > 100 ? project.descricao.substring(0, 100) + '...' : project.descricao;
      projectElement.appendChild(desc);
    }
    projectElement.appendChild(meta);
    
    timelineItem.appendChild(date);
    timelineItem.appendChild(projectElement);
    timelineContent.appendChild(timelineItem);
  });
  
  if (sortedProjects.length === 0) {
    timelineContent.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: var(--spacing-xl);">Nenhum projeto com data de início encontrado.</p>';
  }
}

