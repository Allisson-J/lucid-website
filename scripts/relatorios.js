/* ============================================
   RELATÓRIOS - Sistema de Relatórios e Analytics
   ============================================ */

let allLeads = [];
let allProjetos = [];
let allEquipes = [];
let allTarefas = [];
let allMembros = [];
let charts = {};
let currentFilters = {
  periodo: 30,
  dataInicio: null,
  dataFim: null,
  tipoRelatorio: 'all'
};

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Sistema de Relatórios inicializando...');
  
  // Verificar autenticação
  const authenticated = typeof requireAuth !== 'undefined' ? await requireAuth() : await isAuthenticated();
  if (!authenticated) {
    window.location.href = 'login.html';
    return;
  }
  
  // Configurar eventos
  setupEventListeners();
  
  // Carregar dados
  await loadAllData();
  
  // Renderizar relatórios
  await renderReports();
  
  // Mostrar informações do usuário
  if (typeof getCurrentUser !== 'undefined') {
    const user = await getCurrentUser();
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl && user) {
      userInfoEl.textContent = user.email || 'Usuário';
    }
  }
  
  console.log('✅ Sistema de Relatórios carregado!');
});

// Configurar event listeners
function setupEventListeners() {
  // Botão atualizar
  document.getElementById('btnRefresh').addEventListener('click', async () => {
    await loadAllData();
    await renderReports();
  });
  
  // Botão exportar PDF
  document.getElementById('btnExportPDF').addEventListener('click', exportToPDF);
  
  // Filtros
  document.getElementById('filterPeriodo').addEventListener('change', function() {
    currentFilters.periodo = this.value;
    if (this.value === 'custom') {
      document.getElementById('customDateRange').style.display = 'flex';
      document.getElementById('customDateRangeEnd').style.display = 'flex';
    } else {
      document.getElementById('customDateRange').style.display = 'none';
      document.getElementById('customDateRangeEnd').style.display = 'none';
      currentFilters.dataInicio = null;
      currentFilters.dataFim = null;
      renderReports();
    }
  });
  
  document.getElementById('filterDataInicio').addEventListener('change', function() {
    currentFilters.dataInicio = this.value;
    renderReports();
  });
  
  document.getElementById('filterDataFim').addEventListener('change', function() {
    currentFilters.dataFim = this.value;
    renderReports();
  });
  
  document.getElementById('filterTipoRelatorio').addEventListener('change', function() {
    currentFilters.tipoRelatorio = this.value;
    renderReports();
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
}

// Carregar todos os dados
async function loadAllData() {
  await Promise.all([
    loadLeads(),
    loadProjetos(),
    loadEquipes(),
    loadTarefas(),
    loadMembros()
  ]);
}

// Carregar leads
async function loadLeads() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            allLeads = data.map(lead => ({
              id: lead.id,
              name: lead.name,
              email: lead.email,
              phone: lead.phone || '',
              status: lead.status,
              createdAt: lead.created_at
            }));
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar leads do Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem('lucid_leads');
    allLeads = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Erro ao carregar leads:', error);
    allLeads = [];
  }
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
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            allProjetos = data;
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
  } catch (error) {
    console.error('❌ Erro ao carregar projetos:', error);
    allProjetos = [];
  }
}

// Carregar equipes
async function loadEquipes() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('equipes')
            .select('*')
            .eq('ativa', true)
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            allEquipes = data;
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar equipes do Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem('lucid_equipes');
    allEquipes = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Erro ao carregar equipes:', error);
    allEquipes = [];
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
            .order('created_at', { ascending: false });
          
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

// Carregar membros
async function loadMembros() {
  try {
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('equipes_membros')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            allMembros = data;
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar membros do Supabase:', error);
        }
      }
    }
    
    // Fallback: localStorage
    const stored = localStorage.getItem('lucid_equipes_membros');
    allMembros = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Erro ao carregar membros:', error);
    allMembros = [];
  }
}

// Obter período de filtro
function getFilterDateRange() {
  const now = new Date();
  let startDate, endDate;
  
  if (currentFilters.periodo === 'custom' && currentFilters.dataInicio && currentFilters.dataFim) {
    startDate = new Date(currentFilters.dataInicio);
    endDate = new Date(currentFilters.dataFim);
    endDate.setHours(23, 59, 59, 999);
  } else {
    const days = parseInt(currentFilters.periodo) || 30;
    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
  }
  
  return { startDate, endDate };
}

// Filtrar dados por período
function filterDataByPeriod(data, dateField = 'createdAt') {
  const { startDate, endDate } = getFilterDateRange();
  
  return data.filter(item => {
    const itemDate = new Date(item[dateField] || item.created_at);
    return itemDate >= startDate && itemDate <= endDate;
  });
}

// Renderizar relatórios
async function renderReports() {
  const { startDate, endDate } = getFilterDateRange();
  
  // Filtrar dados
  const leadsFiltrados = filterDataByPeriod(allLeads, 'createdAt');
  const projetosFiltrados = filterDataByPeriod(allProjetos, 'created_at');
  
  // Atualizar métricas
  updateMetrics(leadsFiltrados, projetosFiltrados);
  
  // Renderizar gráficos
  renderConversionChart(leadsFiltrados);
  renderLeadsStatusChart(leadsFiltrados);
  renderProductivityChart(projetosFiltrados);
  renderTimelineChart(projetosFiltrados);
  renderTeamPerformanceChart();
  renderLeadsEvolutionChart(leadsFiltrados);
  
  // Renderizar tabelas
  renderTopProjectsTable(projetosFiltrados);
  renderTopTeamsTable();
}

// Atualizar métricas
function updateMetrics(leads, projetos) {
  // Total de leads
  const totalLeads = leads.length;
  document.getElementById('metricTotalLeads').textContent = totalLeads;
  
  // Taxa de conversão
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const taxaConversao = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;
  document.getElementById('metricTaxaConversao').textContent = `${taxaConversao}%`;
  
  // Total de projetos
  const totalProjetos = projetos.length;
  document.getElementById('metricTotalProjetos').textContent = totalProjetos;
  
  // Produtividade média (projetos concluídos / total)
  const projetosConcluidos = projetos.filter(p => p.status === 'concluido').length;
  const produtividade = totalProjetos > 0 ? ((projetosConcluidos / totalProjetos) * 100).toFixed(1) : 0;
  document.getElementById('metricProdutividade').textContent = `${produtividade}%`;
  
  // Calcular mudanças (comparar com período anterior)
  const { startDate } = getFilterDateRange();
  const previousPeriodDays = parseInt(currentFilters.periodo) || 30;
  const previousEndDate = new Date(startDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - previousPeriodDays);
  
  const previousLeads = allLeads.filter(l => {
    const date = new Date(l.createdAt || l.created_at);
    return date >= previousStartDate && date <= previousEndDate;
  });
  
  const previousProjetos = allProjetos.filter(p => {
    const date = new Date(p.created_at);
    return date >= previousStartDate && date <= previousEndDate;
  });
  
  // Mudança de leads
  const leadsChange = previousLeads.length > 0 
    ? (((totalLeads - previousLeads.length) / previousLeads.length) * 100).toFixed(1)
    : totalLeads > 0 ? '100' : '0';
  const leadsChangeEl = document.getElementById('metricLeadsChange');
  leadsChangeEl.textContent = `${leadsChange >= 0 ? '+' : ''}${leadsChange}%`;
  leadsChangeEl.className = `metric-change ${leadsChange >= 0 ? 'positive' : 'negative'}`;
  
  // Mudança de projetos
  const projetosChange = previousProjetos.length > 0
    ? (((totalProjetos - previousProjetos.length) / previousProjetos.length) * 100).toFixed(1)
    : totalProjetos > 0 ? '100' : '0';
  const projetosChangeEl = document.getElementById('metricProjetosChange');
  projetosChangeEl.textContent = `${projetosChange >= 0 ? '+' : ''}${projetosChange}%`;
  projetosChangeEl.className = `metric-change ${projetosChange >= 0 ? 'positive' : 'negative'}`;
}

// Renderizar gráfico de conversão de leads
function renderConversionChart(leads) {
  const ctx = document.getElementById('chartConversaoLeads');
  if (!ctx) return;
  
  const total = leads.length;
  const converted = leads.filter(l => l.status === 'converted').length;
  const qualified = leads.filter(l => l.status === 'qualified').length;
  const contacted = leads.filter(l => l.status === 'contacted').length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? '#e6e6e6' : '#1a1f2e';
  const gridColor = isDark ? '#1f2430' : '#e1e8ed';
  
  if (charts.conversaoLeads) {
    charts.conversaoLeads.destroy();
  }
  
  charts.conversaoLeads = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Convertidos', 'Qualificados', 'Contatados', 'Novos'],
      datasets: [{
        data: [converted, qualified, contacted, newLeads],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(77, 166, 255, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(107, 114, 128, 0.8)'
        ],
        borderColor: [
          '#22c55e',
          '#4da6ff',
          '#f59e0b',
          '#6b7280'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Renderizar gráfico de leads por status
function renderLeadsStatusChart(leads) {
  const ctx = document.getElementById('chartLeadsStatus');
  if (!ctx) return;
  
  const statusCounts = {
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length
  };
  
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? '#e6e6e6' : '#1a1f2e';
  const gridColor = isDark ? '#1f2430' : '#e1e8ed';
  
  if (charts.leadsStatus) {
    charts.leadsStatus.destroy();
  }
  
  charts.leadsStatus = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Novos', 'Contatados', 'Qualificados', 'Convertidos'],
      datasets: [{
        label: 'Leads',
        data: [statusCounts.new, statusCounts.contacted, statusCounts.qualified, statusCounts.converted],
        backgroundColor: [
          'rgba(107, 114, 128, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(77, 166, 255, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ],
        borderColor: [
          '#6b7280',
          '#f59e0b',
          '#4da6ff',
          '#22c55e'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            stepSize: 1
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        }
      }
    }
  });
}

// Renderizar gráfico de produtividade por projeto
function renderProductivityChart(projetos) {
  const ctx = document.getElementById('chartProdutividadeProjetos');
  if (!ctx) return;
  
  // Calcular produtividade (baseado em tarefas concluídas)
  const projetosComProdutividade = projetos.slice(0, 10).map(projeto => {
    const tarefasProjeto = allTarefas.filter(t => t.projeto_id === projeto.id);
    const totalTarefas = tarefasProjeto.length;
    const tarefasConcluidas = tarefasProjeto.filter(t => t.status === 'concluida').length;
    const produtividade = totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0;
    
    return {
      nome: projeto.nome || projeto.titulo || 'Sem nome',
      produtividade: Math.round(produtividade)
    };
  }).sort((a, b) => b.produtividade - a.produtividade);
  
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? '#e6e6e6' : '#1a1f2e';
  const gridColor = isDark ? '#1f2430' : '#e1e8ed';
  
  if (charts.produtividadeProjetos) {
    charts.produtividadeProjetos.destroy();
  }
  
  charts.produtividadeProjetos = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: projetosComProdutividade.map(p => p.nome.length > 15 ? p.nome.substring(0, 15) + '...' : p.nome),
      datasets: [{
        label: 'Produtividade (%)',
        data: projetosComProdutividade.map(p => p.produtividade),
        backgroundColor: 'rgba(77, 166, 255, 0.8)',
        borderColor: '#4da6ff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Produtividade: ${context.parsed.x}%`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: textColor,
            callback: function(value) {
              return value + '%';
            }
          },
          grid: {
            color: gridColor
          }
        },
        y: {
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        }
      }
    }
  });
}

// Renderizar gráfico de timeline de projetos
function renderTimelineChart(projetos) {
  const ctx = document.getElementById('chartTimelineProjetos');
  if (!ctx) return;
  
  const { startDate, endDate } = getFilterDateRange();
  const dias = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const labels = [];
  const projetosPorDia = new Array(dias).fill(0);
  const concluidosPorDia = new Array(dias).fill(0);
  
  for (let i = 0; i < dias; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
  }
  
  projetos.forEach(projeto => {
    const dataInicio = new Date(projeto.data_inicio || projeto.created_at);
    const dataFim = projeto.data_fim ? new Date(projeto.data_fim) : null;
    
    if (dataInicio >= startDate && dataInicio <= endDate) {
      const diaIndex = Math.floor((dataInicio - startDate) / (1000 * 60 * 60 * 24));
      if (diaIndex >= 0 && diaIndex < dias) {
        projetosPorDia[diaIndex]++;
        if (projeto.status === 'concluido' && dataFim && dataFim <= endDate) {
          const diaFimIndex = Math.floor((dataFim - startDate) / (1000 * 60 * 60 * 24));
          if (diaFimIndex >= 0 && diaFimIndex < dias) {
            concluidosPorDia[diaFimIndex]++;
          }
        }
      }
    }
  });
  
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? '#e6e6e6' : '#1a1f2e';
  const gridColor = isDark ? '#1f2430' : '#e1e8ed';
  
  if (charts.timelineProjetos) {
    charts.timelineProjetos.destroy();
  }
  
  charts.timelineProjetos = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Projetos Criados',
          data: projetosPorDia,
          borderColor: '#4da6ff',
          backgroundColor: 'rgba(77, 166, 255, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Projetos Concluídos',
          data: concluidosPorDia,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            stepSize: 1
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          ticks: {
            color: textColor,
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            color: gridColor
          }
        }
      }
    }
  });
}

// Renderizar gráfico de performance da equipe
function renderTeamPerformanceChart() {
  const ctx = document.getElementById('chartPerformanceEquipe');
  if (!ctx) return;
  
  // Calcular performance por equipe
  const performanceEquipes = allEquipes.slice(0, 10).map(equipe => {
    const membrosEquipe = allMembros.filter(m => m.equipe_id === equipe.id && m.convite_status === 'aceito');
    const projetosEquipe = allProjetos.filter(p => p.equipe_id === equipe.id);
    const tarefasEquipe = allTarefas.filter(t => {
      const projeto = allProjetos.find(p => p.id === t.projeto_id);
      return projeto && projeto.equipe_id === equipe.id;
    });
    const tarefasConcluidas = tarefasEquipe.filter(t => t.status === 'concluida').length;
    
    const performance = tarefasEquipe.length > 0 
      ? (tarefasConcluidas / tarefasEquipe.length) * 100 
      : 0;
    
    return {
      nome: equipe.nome || 'Sem nome',
      membros: membrosEquipe.length,
      projetos: projetosEquipe.length,
      tarefasConcluidas: tarefasConcluidas,
      totalTarefas: tarefasEquipe.length,
      performance: Math.round(performance)
    };
  }).sort((a, b) => b.performance - a.performance);
  
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? '#e6e6e6' : '#1a1f2e';
  const gridColor = isDark ? '#1f2430' : '#e1e8ed';
  
  if (charts.performanceEquipe) {
    charts.performanceEquipe.destroy();
  }
  
  charts.performanceEquipe = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: performanceEquipes.map(e => e.nome.length > 15 ? e.nome.substring(0, 15) + '...' : e.nome),
      datasets: [{
        label: 'Performance (%)',
        data: performanceEquipes.map(e => e.performance),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: '#22c55e',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const equipe = performanceEquipes[context.dataIndex];
              return [
                `Performance: ${context.parsed.y}%`,
                `Membros: ${equipe.membros}`,
                `Projetos: ${equipe.projetos}`,
                `Tarefas: ${equipe.tarefasConcluidas}/${equipe.totalTarefas}`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: textColor,
            callback: function(value) {
              return value + '%';
            }
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        }
      }
    }
  });
}

// Renderizar gráfico de evolução de leads
function renderLeadsEvolutionChart(leads) {
  const ctx = document.getElementById('chartEvolucaoLeads');
  if (!ctx) return;
  
  const { startDate, endDate } = getFilterDateRange();
  const dias = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const labels = [];
  const leadsPorDia = new Array(dias).fill(0);
  const acumulado = new Array(dias).fill(0);
  
  for (let i = 0; i < dias; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
  }
  
  leads.forEach(lead => {
    const dataLead = new Date(lead.createdAt || lead.created_at);
    if (dataLead >= startDate && dataLead <= endDate) {
      const diaIndex = Math.floor((dataLead - startDate) / (1000 * 60 * 60 * 24));
      if (diaIndex >= 0 && diaIndex < dias) {
        leadsPorDia[diaIndex]++;
      }
    }
  });
  
  let acumuladoTotal = 0;
  for (let i = 0; i < dias; i++) {
    acumuladoTotal += leadsPorDia[i];
    acumulado[i] = acumuladoTotal;
  }
  
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? '#e6e6e6' : '#1a1f2e';
  const gridColor = isDark ? '#1f2430' : '#e1e8ed';
  
  if (charts.evolucaoLeads) {
    charts.evolucaoLeads.destroy();
  }
  
  charts.evolucaoLeads = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Leads por Dia',
          data: leadsPorDia,
          borderColor: '#4da6ff',
          backgroundColor: 'rgba(77, 166, 255, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Acumulado',
          data: acumulado,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            stepSize: 1
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          ticks: {
            color: textColor,
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            color: gridColor
          }
        }
      }
    }
  });
}

// Renderizar tabela de top projetos
function renderTopProjectsTable(projetos) {
  const tbody = document.getElementById('tableTopProjetos');
  if (!tbody) return;
  
  const projetosComProdutividade = projetos.map(projeto => {
    const tarefasProjeto = allTarefas.filter(t => t.projeto_id === projeto.id);
    const totalTarefas = tarefasProjeto.length;
    const tarefasConcluidas = tarefasProjeto.filter(t => t.status === 'concluida').length;
    const taxaConclusao = totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0;
    
    return {
      ...projeto,
      totalTarefas,
      tarefasConcluidas,
      taxaConclusao: Math.round(taxaConclusao)
    };
  }).sort((a, b) => b.taxaConclusao - a.taxaConclusao).slice(0, 10);
  
  if (projetosComProdutividade.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum projeto encontrado</td></tr>';
    return;
  }
  
  tbody.innerHTML = projetosComProdutividade.map(projeto => {
    const statusLabels = {
      'planejamento': 'Planejamento',
      'em_andamento': 'Em Andamento',
      'pausado': 'Pausado',
      'concluido': 'Concluído',
      'cancelado': 'Cancelado'
    };
    
    const statusClass = `status-badge-inline status-${projeto.status || 'pendente'}`;
    const statusLabel = statusLabels[projeto.status] || projeto.status || 'Pendente';
    
    return `
      <tr>
        <td><strong>${escapeHtml(projeto.nome || projeto.titulo || 'Sem nome')}</strong></td>
        <td><span class="${statusClass}">${statusLabel}</span></td>
        <td>
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width: ${projeto.taxaConclusao}%"></div>
          </div>
          <small style="color: var(--text-tertiary);">${projeto.taxaConclusao}%</small>
        </td>
        <td>${projeto.totalTarefas}</td>
        <td><strong>${projeto.taxaConclusao}%</strong></td>
      </tr>
    `;
  }).join('');
}

// Renderizar tabela de top equipes
function renderTopTeamsTable() {
  const tbody = document.getElementById('tableTopEquipes');
  if (!tbody) return;
  
  const performanceEquipes = allEquipes.map(equipe => {
    const membrosEquipe = allMembros.filter(m => m.equipe_id === equipe.id && m.convite_status === 'aceito');
    const projetosEquipe = allProjetos.filter(p => p.equipe_id === equipe.id);
    const tarefasEquipe = allTarefas.filter(t => {
      const projeto = allProjetos.find(p => p.id === t.projeto_id);
      return projeto && projeto.equipe_id === equipe.id;
    });
    const tarefasConcluidas = tarefasEquipe.filter(t => t.status === 'concluida').length;
    
    const performance = tarefasEquipe.length > 0 
      ? (tarefasConcluidas / tarefasEquipe.length) * 100 
      : 0;
    
    return {
      ...equipe,
      membros: membrosEquipe.length,
      projetos: projetosEquipe.length,
      tarefasConcluidas,
      totalTarefas: tarefasEquipe.length,
      performance: Math.round(performance)
    };
  }).sort((a, b) => b.performance - a.performance).slice(0, 10);
  
  if (performanceEquipes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhuma equipe encontrada</td></tr>';
    return;
  }
  
  tbody.innerHTML = performanceEquipes.map(equipe => {
    let performanceClass = 'medio';
    if (equipe.performance >= 80) performanceClass = 'excelente';
    else if (equipe.performance >= 60) performanceClass = 'bom';
    else if (equipe.performance < 40) performanceClass = 'baixo';
    
    return `
      <tr>
        <td><strong>${escapeHtml(equipe.nome || 'Sem nome')}</strong></td>
        <td>${equipe.membros}</td>
        <td>${equipe.projetos}</td>
        <td>${equipe.tarefasConcluidas}</td>
        <td>
          <span class="performance-badge ${performanceClass}">
            ${equipe.performance}%
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// Exportar para PDF
async function exportToPDF() {
  try {
    if (typeof window.jsPDF === 'undefined') {
      alert('Biblioteca jsPDF não carregada. Recarregue a página.');
      return;
    }
    
    const { jsPDF } = window.jsPDF;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    
    // Título
    doc.setFontSize(20);
    doc.setTextColor(77, 166, 255);
    doc.text('Relatórios e Analytics - Lucid', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const { startDate, endDate } = getFilterDateRange();
    doc.text(
      `Período: ${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`,
      pageWidth / 2,
      yPos,
      { align: 'center' }
    );
    yPos += 15;
    
    // Métricas principais
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Métricas Principais', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    const totalLeads = filterDataByPeriod(allLeads, 'createdAt').length;
    const projetosFiltrados = filterDataByPeriod(allProjetos, 'created_at');
    const totalProjetos = projetosFiltrados.length;
    const convertedLeads = allLeads.filter(l => l.status === 'converted').length;
    const taxaConversao = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;
    const projetosConcluidos = projetosFiltrados.filter(p => p.status === 'concluido').length;
    const produtividade = totalProjetos > 0 ? ((projetosConcluidos / totalProjetos) * 100).toFixed(1) : 0;
    
    doc.text(`Total de Leads: ${totalLeads}`, 25, yPos);
    yPos += 7;
    doc.text(`Taxa de Conversão: ${taxaConversao}%`, 25, yPos);
    yPos += 7;
    doc.text(`Total de Projetos: ${totalProjetos}`, 25, yPos);
    yPos += 7;
    doc.text(`Produtividade Média: ${produtividade}%`, 25, yPos);
    yPos += 15;
    
    // Verificar se precisa de nova página
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }
    
    // Top Projetos
    doc.setFontSize(14);
    doc.text('Top 5 Projetos por Produtividade', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    const topProjetos = projetosFiltrados.map(projeto => {
      const tarefasProjeto = allTarefas.filter(t => t.projeto_id === projeto.id);
      const totalTarefas = tarefasProjeto.length;
      const tarefasConcluidas = tarefasProjeto.filter(t => t.status === 'concluida').length;
      const taxaConclusao = totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0;
      return { ...projeto, taxaConclusao: Math.round(taxaConclusao) };
    }).sort((a, b) => b.taxaConclusao - a.taxaConclusao).slice(0, 5);
    
    topProjetos.forEach((projeto, index) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(
        `${index + 1}. ${(projeto.nome || projeto.titulo || 'Sem nome').substring(0, 50)} - ${projeto.taxaConclusao}%`,
        25,
        yPos
      );
      yPos += 6;
    });
    
    // Nome do arquivo
    const fileName = `relatorio_lucid_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    if (typeof showToast !== 'undefined') {
      showToast('PDF exportado com sucesso!', 'success');
    } else {
      alert('PDF exportado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    if (typeof showToast !== 'undefined') {
      showToast('Erro ao exportar PDF.', 'error');
    } else {
      alert('Erro ao exportar PDF.');
    }
  }
}

// Função utilitária
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

