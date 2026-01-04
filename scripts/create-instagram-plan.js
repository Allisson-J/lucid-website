// ============================================
// CRIAÇÃO DE PLANO DE 30 DIAS - Instagram Lucid
// ============================================
// Execute este script no console do navegador na página projetos.html
// Ou adicione como função disponível globalmente

// Funções auxiliares para datas
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getDatePlusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// Template do plano (as datas serão calculadas na execução)
function getInstagramPlanTemplate() {
  const today = getTodayDate();
  return [
    {
      nome: 'Dia 1 - Apresentação da Lucid',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(0),
      data_fim: getDatePlusDays(0),
      cliente: 'Instagram Lucid',
      descricao: 'Post de apresentação da empresa: quem somos, o que fazemos, nossa missão. Use storytelling, vídeo ou carrossel.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 2 - Caso de Sucesso #1',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(1),
      data_fim: getDatePlusDays(1),
      cliente: 'Instagram Lucid',
      descricao: 'Post de case de sucesso: antes e depois, resultados alcançados, depoimento do cliente (se disponível).',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 3 - Dica Técnica: Automação',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(2),
      data_fim: getDatePlusDays(2),
      cliente: 'Instagram Lucid',
      descricao: 'Post educativo: dica rápida sobre automação de processos, benefícios, como funciona. Carrossel ou Reels.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 4 - Behind the Scenes',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(3),
      data_fim: getDatePlusDays(3),
      cliente: 'Instagram Lucid',
      descricao: 'Stories ou post mostrando o dia a dia da equipe, processo de trabalho, ambiente. Humanizar a marca.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 5 - Infográfico: Tecnologias',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(4),
      data_fim: getDatePlusDays(4),
      cliente: 'Instagram Lucid',
      descricao: 'Carrossel mostrando as tecnologias que utilizamos (Python, Power Automate, VBA, N8N). Design atrativo.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 6 - Pergunta Interativa',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(5),
      data_fim: getDatePlusDays(5),
      cliente: 'Instagram Lucid',
      descricao: 'Post com pergunta no feed usando sticker de perguntas nos Stories. Ex: "Qual processo você gostaria de automatizar?"',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 7 - Reels: Tutorial Rápido',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(6),
      data_fim: getDatePlusDays(6),
      cliente: 'Instagram Lucid',
      descricao: 'Reels com tutorial rápido (30-60s) sobre alguma automação simples ou dica técnica. Use trending audio.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 8 - Depoimento de Cliente',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(7),
      data_fim: getDatePlusDays(7),
      cliente: 'Instagram Lucid',
      descricao: 'Post com depoimento/testimonial de cliente. Quote card ou vídeo curto. Incluir nome e cargo.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 9 - Estatísticas/Infográfico',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(8),
      data_fim: getDatePlusDays(8),
      cliente: 'Instagram Lucid',
      descricao: 'Post com números/estatísticas: horas economizadas, projetos concluídos, resultados gerais. Design profissional.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 10 - FAQ: Perguntas Frequentes',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(9),
      data_fim: getDatePlusDays(9),
      cliente: 'Instagram Lucid',
      descricao: 'Carrossel respondendo perguntas frequentes sobre automação, processos, prazos, investimento.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 11 - Caso de Sucesso #2',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(10),
      data_fim: getDatePlusDays(10),
      cliente: 'Instagram Lucid',
      descricao: 'Segundo case de sucesso: diferentes indústria/setor, resultados específicos, processo utilizado.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 12 - Reels: Dia a Dia',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(11),
      data_fim: getDatePlusDays(11),
      cliente: 'Instagram Lucid',
      descricao: 'Reels mostrando um dia típico: reuniões, desenvolvimento, resultados. Usar áudio trendy e transições.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 13 - Dica Técnica: IA',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(12),
      data_fim: getDatePlusDays(12),
      cliente: 'Instagram Lucid',
      descricao: 'Post educativo sobre inteligência artificial aplicada a processos, benefícios práticos.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 14 - Comparação: Antes vs Depois',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(13),
      data_fim: getDatePlusDays(13),
      cliente: 'Instagram Lucid',
      descricao: 'Post comparativo: processo manual vs automatizado. Infográfico ou carrossel mostrando diferenças.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 15 - Call to Action: Orçamento',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(14),
      data_fim: getDatePlusDays(14),
      cliente: 'Instagram Lucid',
      descricao: 'Post com CTA claro: "Solicite seu orçamento", link na bio, botão direto. Design chamativo.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 16 - Reels: Benefícios em 60s',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(15),
      data_fim: getDatePlusDays(15),
      cliente: 'Instagram Lucid',
      descricao: 'Reels rápido listando 5 benefícios da automação. Uso de texto overlay, movimento, audio trending.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 17 - Parceria: Áurea',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(16),
      data_fim: getDatePlusDays(16),
      cliente: 'Instagram Lucid',
      descricao: 'Post sobre parceria com Áurea: sinergia, benefícios mútuos, projetos em conjunto. Tag Áurea.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 18 - Dica: Gestão de Projetos',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(17),
      data_fim: getDatePlusDays(17),
      cliente: 'Instagram Lucid',
      descricao: 'Post educativo sobre gestão de projetos, metodologias, dicas práticas. Carrossel informativo.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 19 - Caso de Sucesso #3',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(18),
      data_fim: getDatePlusDays(18),
      cliente: 'Instagram Lucid',
      descricao: 'Terceiro case: foco em ROI, economia de tempo/dinheiro, resultados mensuráveis.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 20 - Stories: Live/IGTV Preview',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(19),
      data_fim: getDatePlusDays(19),
      cliente: 'Instagram Lucid',
      descricao: 'Stories promovendo live ou IGTV sobre automação. Criar expectativa, marcar horário.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 21 - Reels: Mitos vs Verdades',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(20),
      data_fim: getDatePlusDays(20),
      cliente: 'Instagram Lucid',
      descricao: 'Reels desmistificando mitos sobre automação. Formato "Mito vs Verdade" com texto overlay.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 22 - Infográfico: Processos',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(21),
      data_fim: getDatePlusDays(21),
      cliente: 'Instagram Lucid',
      descricao: 'Carrossel explicando nosso processo: diagnóstico, planejamento, desenvolvimento, entrega.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 23 - Dica: Produtividade',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(22),
      data_fim: getDatePlusDays(22),
      cliente: 'Instagram Lucid',
      descricao: 'Post com dicas de produtividade usando automação. Conteúdo prático e aplicável.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 24 - Testemunho em Vídeo',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(23),
      data_fim: getDatePlusDays(23),
      cliente: 'Instagram Lucid',
      descricao: 'Post com vídeo curto de depoimento do cliente. Se não tiver, usar quote card estilizado.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 25 - Reels: Trending Challenge',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(24),
      data_fim: getDatePlusDays(24),
      cliente: 'Instagram Lucid',
      descricao: 'Reels participando de trend/challenge do momento, adaptado para o tema automação/tecnologia.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 26 - Infográfico: ROI',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(25),
      data_fim: getDatePlusDays(25),
      cliente: 'Instagram Lucid',
      descricao: 'Post mostrando cálculo de ROI de automação, exemplos práticos, retorno do investimento.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 27 - Caso de Sucesso #4',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(26),
      data_fim: getDatePlusDays(26),
      cliente: 'Instagram Lucid',
      descricao: 'Quarto case: resultado específico, métricas, impacto no negócio do cliente.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 28 - Reels: Pergunta e Resposta',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(27),
      data_fim: getDatePlusDays(27),
      cliente: 'Instagram Lucid',
      descricao: 'Reels respondendo perguntas recebidas nos Stories/comentários. Formato Q&A rápido.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 29 - Call to Action: Contato',
      status: 'planejamento',
      prioridade: 'alta',
      data_inicio: getDatePlusDays(28),
      data_fim: getDatePlusDays(28),
      cliente: 'Instagram Lucid',
      descricao: 'Post final com múltiplos CTAs: WhatsApp, email, link na bio. Design clean e direto.',
      orcamento: 0,
      membros: []
    },
    {
      nome: 'Dia 30 - Resumo: 30 Dias de Conteúdo',
      status: 'planejamento',
      prioridade: 'normal',
      data_inicio: getDatePlusDays(29),
      data_fim: getDatePlusDays(29),
      cliente: 'Instagram Lucid',
      descricao: 'Post de encerramento: carrossel com highlights dos 30 dias, agradecimento, convite para continuar acompanhando.',
      orcamento: 0,
      membros: []
    }
  ];
}

// Função para criar todos os projetos
async function createInstagramPlan() {
  console.log('🚀 Criando plano de 30 dias para Instagram...');
  
  if (typeof allProjects === 'undefined') {
    console.error('❌ Erro: allProjects não está definido. Certifique-se de estar na página projetos.html');
    return;
  }
  
  // Verificar se já existem projetos do plano
  const existingPlan = allProjects.filter(p => p.cliente === 'Instagram Lucid');
  if (existingPlan.length > 0) {
    const confirm = window.confirm(`Já existem ${existingPlan.length} projetos do plano Instagram. Deseja criar novamente? (Isso pode criar duplicatas)`);
    if (!confirm) {
      console.log('❌ Operação cancelada');
      return;
    }
  }
  
  // Obter template e calcular datas
  const INSTAGRAM_PLAN_30_DAYS = getInstagramPlanTemplate();
  
  try {
    // Tentar salvar diretamente no Supabase primeiro (mais eficiente)
    if (typeof getSupabaseClient !== 'undefined' && typeof isSupabaseConfigured !== 'undefined') {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured()) {
        try {
          const projectsToInsert = INSTAGRAM_PLAN_30_DAYS.map(p => ({
            nome: p.nome,
            status: p.status,
            prioridade: p.prioridade,
            data_inicio: p.data_inicio,
            data_fim: p.data_fim,
            cliente: p.cliente,
            descricao: p.descricao,
            orcamento: p.orcamento || 0,
            membros: p.membros || []
          }));
          
          const { data, error } = await supabase
            .from('projetos')
            .insert(projectsToInsert)
            .select();
          
          if (!error && data) {
            console.log(`✅ ${data.length} projetos criados no Supabase!`);
            // Recarregar projetos
            if (typeof loadProjects === 'function') {
              await loadProjects();
            }
            if (typeof renderProjects === 'function') {
              renderProjects();
            }
            if (typeof updateStats === 'function') {
              updateStats();
            }
            
            console.log(`🎉 Plano de 30 dias criado com sucesso! ${data.length} projetos adicionados.`);
            alert(`✅ Plano de 30 dias criado com sucesso!\n\n${data.length} projetos de postagem adicionados ao sistema.\n\nVocê pode visualizá-los na lista de projetos.`);
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erro ao salvar no Supabase, usando método local:', error);
        }
      }
    }
    
    // Método local (localStorage)
    // Adicionar cada projeto
    for (const projectData of INSTAGRAM_PLAN_30_DAYS) {
      // Criar projeto no formato esperado
      const newProject = {
        id: Date.now() + Math.random(), // ID temporário
        nome: projectData.nome,
        status: projectData.status,
        prioridade: projectData.prioridade,
        data_inicio: projectData.data_inicio,
        data_fim: projectData.data_fim,
        cliente: projectData.cliente,
        descricao: projectData.descricao,
        orcamento: projectData.orcamento || 0,
        membros: projectData.membros || [],
        created_at: new Date().toISOString()
      };
      
      // Adicionar à lista
      allProjects.push(newProject);
      console.log(`✅ Criado: ${newProject.nome}`);
    }
    
    // Salvar no localStorage
    localStorage.setItem('lucid_projetos', JSON.stringify(allProjects));
    console.log('💾 Projetos salvos no localStorage!');
    
    // Tentar salvar no Supabase usando função saveProjects
    if (typeof saveProjects === 'function') {
      await saveProjects();
    }
    
    // Recarregar visualização
    if (typeof renderProjects === 'function') {
      renderProjects();
    }
    if (typeof updateStats === 'function') {
      updateStats();
    }
    
    console.log(`🎉 Plano de 30 dias criado com sucesso! ${INSTAGRAM_PLAN_30_DAYS.length} projetos adicionados.`);
    alert(`✅ Plano de 30 dias criado com sucesso!\n\n${INSTAGRAM_PLAN_30_DAYS.length} projetos de postagem adicionados ao sistema.\n\nVocê pode visualizá-los na lista de projetos.`);
    
  } catch (error) {
    console.error('❌ Erro ao criar plano:', error);
    alert('Erro ao criar plano. Verifique o console para mais detalhes.');
  }
}

// Tornar função disponível globalmente
if (typeof window !== 'undefined') {
  window.createInstagramPlan = createInstagramPlan;
  console.log('✅ Função createInstagramPlan disponível! Execute: createInstagramPlan()');
}
