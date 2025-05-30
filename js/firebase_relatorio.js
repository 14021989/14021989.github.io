// firebase_relatorio.js - Script para geração de relatório detalhado do COPSOQ II (Versão Média)
// Integração com Firebase para relatório dinâmico

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o Firebase está definido
    if (typeof firebase === 'undefined') {
        console.error('Firebase não está definido. Verifique se o script do Firebase foi carregado corretamente.');
        document.body.innerHTML = '<div class="alert alert-danger m-5" role="alert"><h4>Erro de Carregamento</h4><p>Não foi possível carregar o Firebase. Por favor, recarregue a página ou contate o administrador.</p></div>';
        return;
    }

    try {
        // Verificar se o Firebase já foi inicializado
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        const database = firebase.database();
        const respostasRef = database.ref('respostas');
        
        console.log('Firebase inicializado com sucesso. Buscando dados para relatório...');
        
        // Referência para elementos do DOM
        const empresaSelect = document.getElementById('empresa-select');
        const empresaNomeElement = document.getElementById('empresa-nome');
        const totalRespostasElement = document.getElementById('total-respostas');
        const mediaGeralElement = document.getElementById('media-geral');
        const dimensoesCriticasElement = document.getElementById('dimensoes-criticas');
        const dimensoesPositivasElement = document.getElementById('dimensoes-positivas');
        const dataGeracaoElement = document.getElementById('data-geracao');
        const dataAtualizacaoElement = document.getElementById('data-atualizacao');
        const dimensoesCriticasContainer = document.getElementById('dimensoes-criticas-container');
        const dimensoesPositivasContainer = document.getElementById('dimensoes-positivas-container');
        const resultadosTabela = document.getElementById('resultados-tabela').getElementsByTagName('tbody')[0];
        const recomendacoesLista = document.getElementById('recomendacoes-lista');
        
        // Definição das dimensões do COPSOQ II (Versão Média)
        const dimensoes = [
            { id: 'exigenciasQuantitativas', titulo: 'Exigências Quantitativas', perguntas: [1, 2, 3], inverter: false, descricao: 'Relaciona-se com a carga de trabalho e sua distribuição temporal' },
            { id: 'ritmoTrabalho', titulo: 'Ritmo de Trabalho', perguntas: [4], inverter: false, descricao: 'Relaciona-se com a velocidade e intensidade do trabalho' },
            { id: 'exigenciasCognitivas', titulo: 'Exigências Cognitivas', perguntas: [5, 6, 7], inverter: false, descricao: 'Relaciona-se com as demandas cognitivas do trabalho' },
            { id: 'exigenciasEmocionais', titulo: 'Exigências Emocionais', perguntas: [8], inverter: false, descricao: 'Relaciona-se com o envolvimento emocional no trabalho' },
            { id: 'influenciaTrabalho', titulo: 'Influência no Trabalho', perguntas: [9, 10, 11, 12], inverter: false, descricao: 'Avalia o grau de influência que o trabalhador tem sobre o seu próprio trabalho' },
            { id: 'possibilidadesDesenvolvimento', titulo: 'Possibilidades de Desenvolvimento', perguntas: [13, 14, 15], inverter: false, descricao: 'Avalia as oportunidades de desenvolvimento de habilidades no trabalho' },
            { id: 'previsibilidade', titulo: 'Previsibilidade', perguntas: [16, 17], inverter: false, descricao: 'Avalia o grau de informação sobre mudanças e decisões no trabalho' },
            { id: 'transparenciaPapel', titulo: 'Transparência do Papel Laboral', perguntas: [18, 19, 20], inverter: false, descricao: 'Avalia a clareza dos objetivos e responsabilidades no trabalho' },
            { id: 'recompensas', titulo: 'Recompensas', perguntas: [21, 22, 23], inverter: false, descricao: 'Avalia o reconhecimento e valorização no trabalho' },
            { id: 'conflitosLaborais', titulo: 'Conflitos Laborais', perguntas: [24, 25, 26], inverter: true, descricao: 'Avalia a existência de demandas contraditórias no trabalho' },
            { id: 'apoioSocialColegas', titulo: 'Apoio Social de Colegas', perguntas: [27, 28, 29], inverter: false, descricao: 'Avalia o apoio recebido dos colegas de trabalho' },
            { id: 'apoioSocialSuperiores', titulo: 'Apoio Social de Superiores', perguntas: [30, 31, 32], inverter: false, descricao: 'Avalia o apoio recebido dos superiores hierárquicos' },
            { id: 'comunidadeSocial', titulo: 'Comunidade Social no Trabalho', perguntas: [33, 34, 35], inverter: false, descricao: 'Avalia o sentimento de pertença e cooperação no ambiente de trabalho' },
            { id: 'qualidadeLideranca', titulo: 'Qualidade da Liderança', perguntas: [36, 37, 38, 39], inverter: false, descricao: 'Avalia a percepção sobre a qualidade da gestão' },
            { id: 'confiancaHorizontal', titulo: 'Confiança Horizontal', perguntas: [40, 41, 42], inverter: true, descricao: 'Avalia a confiança entre os colegas de trabalho' },
            { id: 'confiancaVertical', titulo: 'Confiança Vertical', perguntas: [43, 44, 45, 46], inverter: false, descricao: 'Avalia a confiança entre trabalhadores e gestão' },
            { id: 'justicaRespeito', titulo: 'Justiça e Respeito', perguntas: [47, 48, 49, 50], inverter: false, descricao: 'Avalia a percepção de justiça e respeito no ambiente de trabalho' },
            { id: 'autoeficacia', titulo: 'Autoeficácia', perguntas: [51, 52], inverter: false, descricao: 'Avalia a confiança do trabalhador em suas próprias capacidades' },
            { id: 'significadoTrabalho', titulo: 'Significado do Trabalho', perguntas: [53, 54, 55], inverter: false, descricao: 'Avalia o significado e propósito atribuído ao trabalho' },
            { id: 'comprometimentoTrabalho', titulo: 'Comprometimento com o Trabalho', perguntas: [56, 57, 58], inverter: false, descricao: 'Avalia o grau de envolvimento e identificação com o trabalho' },
            { id: 'satisfacaoTrabalho', titulo: 'Satisfação no Trabalho', perguntas: [59, 60, 61, 62], inverter: false, descricao: 'Avalia o grau de satisfação com diferentes aspectos do trabalho' },
            { id: 'insegurancaTrabalho', titulo: 'Insegurança no Trabalho', perguntas: [63, 64], inverter: true, descricao: 'Avalia a preocupação com a estabilidade no emprego' },
            { id: 'saudeGeral', titulo: 'Saúde Geral', perguntas: [65], inverter: false, descricao: 'Avalia a percepção geral de saúde' },
            { id: 'conflitosTrabalhoFamilia', titulo: 'Conflitos Trabalho-Família', perguntas: [66, 67, 68, 69], inverter: true, descricao: 'Avalia o equilíbrio entre vida profissional e pessoal' },
            { id: 'problemasSono', titulo: 'Problemas de Sono', perguntas: [70, 71, 72, 73], inverter: true, descricao: 'Avalia a qualidade do sono e problemas relacionados' },
            { id: 'burnout', titulo: 'Burnout', perguntas: [74, 75, 76, 77], inverter: true, descricao: 'Avalia sintomas de esgotamento físico e emocional' },
            { id: 'estresse', titulo: 'Estresse', perguntas: [78, 79, 80, 81], inverter: true, descricao: 'Avalia sintomas de estresse' },
            { id: 'comportamentosOfensivos', titulo: 'Comportamentos Ofensivos', perguntas: [82, 83, 84, 85, 86, 87], inverter: true, descricao: 'Avalia a exposição a comportamentos ofensivos no trabalho' }
        ];
        
        // Categorias do COPSOQ II
        const categorias = [
            { id: 'exigenciasPsicologicas', titulo: 'Exigências Psicológicas', dimensoes: ['exigenciasQuantitativas', 'ritmoTrabalho', 'exigenciasCognitivas', 'exigenciasEmocionais'] },
            { id: 'organizacaoTrabalho', titulo: 'Organização e Conteúdo do Trabalho', dimensoes: ['influenciaTrabalho', 'possibilidadesDesenvolvimento', 'significadoTrabalho', 'comprometimentoTrabalho'] },
            { id: 'relacoesInterpessoais', titulo: 'Relações Interpessoais e Liderança', dimensoes: ['previsibilidade', 'transparenciaPapel', 'recompensas', 'conflitosLaborais', 'apoioSocialColegas', 'apoioSocialSuperiores', 'comunidadeSocial', 'qualidadeLideranca'] },
            { id: 'valoresOrganizacionais', titulo: 'Valores no Local de Trabalho', dimensoes: ['confiancaHorizontal', 'confiancaVertical', 'justicaRespeito', 'autoeficacia'] },
            { id: 'saudeEfeitosPsicologicos', titulo: 'Saúde e Efeitos Psicológicos', dimensoes: ['satisfacaoTrabalho', 'insegurancaTrabalho', 'saudeGeral', 'conflitosTrabalhoFamilia', 'problemasSono', 'burnout', 'estresse', 'comportamentosOfensivos'] }
        ];
        
        // Função para calcular a média de uma dimensão
        function calcularMediaDimensao(respostas, dimensao) {
            let soma = 0;
            let count = 0;
            
            dimensao.perguntas.forEach(pergunta => {
                const valorPergunta = parseInt(respostas['p' + pergunta]);
                if (!isNaN(valorPergunta)) {
                    // Se a dimensão deve ser invertida, inverte a pontuação (6 - valor)
                    soma += dimensao.inverter ? (6 - valorPergunta) : valorPergunta;
                    count++;
                }
            });
            
            return count > 0 ? soma / count : 0;
        }
        
        // Função para determinar o nível de risco
        function determinarRisco(media, dimensao) {
            // Dimensões invertidas já foram ajustadas no cálculo da média
            if (media >= 3.5) {
                return 'Alto';
            } else if (media >= 2.5) {
                return 'Médio';
            } else {
                return 'Baixo';
            }
        }
        
        // Função para obter a classe CSS do risco
        function getClasseRisco(risco) {
            switch (risco) {
                case 'Alto':
                    return 'risk-high';
                case 'Médio':
                    return 'risk-medium';
                case 'Baixo':
                    return 'risk-low';
                default:
                    return '';
            }
        }
        
        // Função para gerar recomendações com base nas dimensões críticas
        function gerarRecomendacoes(dimensoesCriticas) {
            const recomendacoes = [
                'Realizar uma análise detalhada das dimensões críticas identificadas.',
                'Desenvolver planos de ação específicos para cada dimensão de alto risco.',
                'Monitorar periodicamente os fatores psicossociais para avaliar a eficácia das intervenções.'
            ];
            
            // Adicionar recomendações específicas para cada dimensão crítica
            dimensoesCriticas.forEach(dimensao => {
                switch (dimensao.id) {
                    case 'exigenciasQuantitativas':
                        recomendacoes.push('Revisar a distribuição da carga de trabalho entre os colaboradores.');
                        recomendacoes.push('Avaliar a necessidade de contratação ou redistribuição de tarefas.');
                        break;
                    case 'ritmoTrabalho':
                        recomendacoes.push('Analisar os prazos e metas estabelecidos para verificar se são realistas.');
                        recomendacoes.push('Implementar pausas regulares durante a jornada de trabalho.');
                        break;
                    case 'exigenciasEmocionais':
                        recomendacoes.push('Oferecer suporte psicológico aos colaboradores.');
                        recomendacoes.push('Implementar programas de gestão emocional e resiliência.');
                        break;
                    case 'conflitosLaborais':
                        recomendacoes.push('Estabelecer canais claros de comunicação para resolução de conflitos.');
                        recomendacoes.push('Promover treinamentos em comunicação não-violenta e resolução de conflitos.');
                        break;
                    case 'apoioSocialColegas':
                    case 'apoioSocialSuperiores':
                        recomendacoes.push('Desenvolver atividades de team building para fortalecer as relações interpessoais.');
                        recomendacoes.push('Implementar programas de mentoria e suporte entre pares.');
                        break;
                    case 'qualidadeLideranca':
                        recomendacoes.push('Oferecer treinamento em liderança para gestores.');
                        recomendacoes.push('Implementar avaliações 360° para feedback contínuo sobre a liderança.');
                        break;
                    case 'insegurancaTrabalho':
                        recomendacoes.push('Melhorar a comunicação sobre planos futuros da empresa e segurança no emprego.');
                        recomendacoes.push('Desenvolver programas de capacitação para aumentar a empregabilidade interna.');
                        break;
                    case 'conflitosTrabalhoFamilia':
                        recomendacoes.push('Implementar políticas de flexibilidade de horário e trabalho remoto quando possível.');
                        recomendacoes.push('Revisar a cultura de horas extras e trabalho fora do expediente.');
                        break;
                    case 'problemasSono':
                    case 'burnout':
                    case 'estresse':
                        recomendacoes.push('Implementar programas de bem-estar e qualidade de vida.');
                        recomendacoes.push('Oferecer recursos para gestão de estresse e técnicas de relaxamento.');
                        break;
                    case 'comportamentosOfensivos':
                        recomendacoes.push('Estabelecer e comunicar claramente políticas de tolerância zero para comportamentos ofensivos.');
                        recomendacoes.push('Implementar canais seguros para denúncias e garantir a confidencialidade.');
                        break;
                }
            });
            
            // Remover duplicatas
            return [...new Set(recomendacoes)];
        }
        
        // Função para atualizar o relatório com base nas respostas
        function atualizarRelatorio(respostas, empresaFiltro) {
            // Filtrar respostas pela empresa selecionada
            const respostasFiltradas = empresaFiltro === 'todas' 
                ? respostas 
                : respostas.filter(r => r.empresa === empresaFiltro);
            
            // Atualizar informações gerais
            empresaNomeElement.textContent = empresaFiltro === 'todas' ? 'Todas' : empresaFiltro;
            totalRespostasElement.textContent = respostasFiltradas.length;
            
            // Calcular médias das dimensões
            const mediasDimensoes = [];
            let somaMedias = 0;
            
            dimensoes.forEach(dimensao => {
                let somaDimensao = 0;
                let countDimensao = 0;
                
                respostasFiltradas.forEach(resposta => {
                    const mediaDimensaoResposta = calcularMediaDimensao(resposta, dimensao);
                    if (mediaDimensaoResposta > 0) {
                        somaDimensao += mediaDimensaoResposta;
                        countDimensao++;
                    }
                });
                
                const mediaDimensao = countDimensao > 0 ? somaDimensao / countDimensao : 0;
                const risco = determinarRisco(mediaDimensao, dimensao);
                
                mediasDimensoes.push({
                    id: dimensao.id,
                    titulo: dimensao.titulo,
                    media: mediaDimensao,
                    risco: risco,
                    descricao: dimensao.descricao
                });
                
                somaMedias += mediaDimensao;
            });
            
            // Calcular média geral
            const mediaGeral = mediasDimensoes.length > 0 ? somaMedias / mediasDimensoes.length : 0;
            mediaGeralElement.textContent = mediaGeral.toFixed(1);
            
            // Identificar dimensões críticas (alto risco)
            const dimensoesCriticas = mediasDimensoes.filter(d => d.risco === 'Alto');
            dimensoesCriticasElement.textContent = dimensoesCriticas.length;
            
            // Identificar dimensões positivas (baixo risco)
            const dimensoesPositivas = mediasDimensoes.filter(d => d.risco === 'Baixo');
            dimensoesPositivasElement.textContent = dimensoesPositivas.length;
            
            // Atualizar tabela de resultados
            let htmlTabela = '';
            mediasDimensoes.forEach(d => {
                htmlTabela += `
                    <tr>
                        <td>${d.titulo}</td>
                        <td>${d.media.toFixed(1)}</td>
                        <td class="${getClasseRisco(d.risco)}">${d.risco}</td>
                        <td>${d.descricao}</td>
                    </tr>
                `;
            });
            resultadosTabela.innerHTML = htmlTabela;
            
            // Atualizar container de dimensões críticas
            if (dimensoesCriticas.length > 0) {
                let htmlCriticas = '';
                dimensoesCriticas.forEach(d => {
                    htmlCriticas += `
                        <div class="card mb-3 ${getClasseRisco(d.risco)}">
                            <div class="card-body">
                                <h5 class="card-title">${d.titulo}</h5>
                                <p class="card-text">Média: ${d.media.toFixed(1)}</p>
                                <p class="card-text">${d.descricao}</p>
                            </div>
                        </div>
                    `;
                });
                dimensoesCriticasContainer.innerHTML = htmlCriticas;
            } else {
                dimensoesCriticasContainer.innerHTML = '<p class="text-center text-muted">Nenhuma dimensão crítica identificada.</p>';
            }
            
            // Atualizar container de dimensões positivas
            if (dimensoesPositivas.length > 0) {
                let htmlPositivas = '';
                dimensoesPositivas.forEach(d => {
                    htmlPositivas += `
                        <div class="card mb-3 ${getClasseRisco(d.risco)}">
                            <div class="card-body">
                                <h5 class="card-title">${d.titulo}</h5>
                                <p class="card-text">Média: ${d.media.toFixed(1)}</p>
                                <p class="card-text">${d.descricao}</p>
                            </div>
                        </div>
                    `;
                });
                dimensoesPositivasContainer.innerHTML = htmlPositivas;
            } else {
                dimensoesPositivasContainer.innerHTML = '<p class="text-center text-muted">Nenhuma dimensão positiva identificada.</p>';
            }
            
            // Atualizar gráfico de dimensões
            const ctx = document.getElementById('dimensoes-chart').getContext('2d');
            if (window.dimensoesChart) {
                window.dimensoesChart.destroy();
            }
            
            window.dimensoesChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: mediasDimensoes.map(d => d.titulo),
                    datasets: [{
                        label: 'Média',
                        data: mediasDimensoes.map(d => d.media),
                        backgroundColor: mediasDimensoes.map(d => {
                            switch (d.risco) {
                                case 'Alto':
                                    return 'rgba(220, 53, 69, 0.7)';
                                case 'Médio':
                                    return 'rgba(255, 193, 7, 0.7)';
                                case 'Baixo':
                                    return 'rgba(40, 167, 69, 0.7)';
                                default:
                                    return 'rgba(0, 123, 255, 0.7)';
                            }
                        }),
                        borderColor: mediasDimensoes.map(d => {
                            switch (d.risco) {
                                case 'Alto':
                                    return 'rgb(220, 53, 69)';
                                case 'Médio':
                                    return 'rgb(255, 193, 7)';
                                case 'Baixo':
                                    return 'rgb(40, 167, 69)';
                                default:
                                    return 'rgb(0, 123, 255)';
                            }
                        }),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 5,
                            title: {
                                display: true,
                                text: 'Média'
                            }
                        },
                        x: {
                            ticks: {
                                autoSkip: false,
                                maxRotation: 90,
                                minRotation: 45
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                afterLabel: function(context) {
                                    const index = context.dataIndex;
                                    const dimensao = mediasDimensoes[index];
                                    return [
                                        'Risco: ' + dimensao.risco,
                                        'Descrição: ' + dimensao.descricao
                                    ];
                                }
                            }
                        }
                    }
                }
            });
            
            // Gerar e atualizar recomendações
            const recomendacoes = gerarRecomendacoes(dimensoesCriticas);
            let htmlRecomendacoes = '';
            recomendacoes.forEach(recomendacao => {
                htmlRecomendacoes += `<li>${recomendacao}</li>`;
            });
            recomendacoesLista.innerHTML = htmlRecomendacoes;
            
            // Atualizar datas
            const dataAtual = new Date();
            const dataFormatada = dataAtual.toLocaleDateString('pt-BR') + ' ' + dataAtual.toLocaleTimeString('pt-BR');
            if (dataGeracaoElement) {
                dataGeracaoElement.textContent = dataFormatada;
            }
            if (dataAtualizacaoElement) {
                dataAtualizacaoElement.textContent = dataFormatada;
            }
        }
        
        // Função para popular o select de empresas
        function popularSelectEmpresas(respostas) {
            const empresas = new Set();
            respostas.forEach(resposta => {
                if (resposta.empresa) {
                    empresas.add(resposta.empresa);
                }
            });
            
            // Limpar opções existentes (exceto a primeira)
            while (empresaSelect.options.length > 1) {
                empresaSelect.remove(1);
            }
            
            // Adicionar novas opções
            empresas.forEach(empresa => {
                const option = document.createElement('option');
                option.value = empresa;
                option.textContent = empresa;
                empresaSelect.appendChild(option);
            });
        }
        
        // Buscar dados do Firebase
        respostasRef.on('value', (snapshot) => {
            try {
                const data = snapshot.val();
                if (!data) {
                    console.log('Nenhum dado encontrado no Firebase.');
                    return;
                }
                
                // Converter objeto de respostas em array
                const respostas = Object.values(data);
                console.log(`${respostas.length} respostas encontradas para o relatório.`);
                
                // Popular select de empresas
                popularSelectEmpresas(respostas);
                
                // Atualizar relatório com todas as respostas inicialmente
                atualizarRelatorio(respostas, 'todas');
                
                // Adicionar event listener para o select de empresas
                empresaSelect.addEventListener('change', () => {
                    const empresaSelecionada = empresaSelect.value;
                    atualizarRelatorio(respostas, empresaSelecionada);
                });
            } catch (error) {
                console.error('Erro ao processar dados do Firebase para relatório:', error);
                alert('Ocorreu um erro ao processar os dados para o relatório. Por favor, recarregue a página ou contate o administrador.');
            }
        }, (error) => {
            console.error('Erro ao buscar dados do Firebase para relatório:', error);
            alert('Ocorreu um erro ao buscar os dados para o relatório. Por favor, verifique sua conexão ou contate o administrador.');
        });
    } catch (error) {
        console.error('Erro ao inicializar o relatório:', error);
        document.body.innerHTML = '<div class="alert alert-danger m-5" role="alert"><h4>Erro de Inicialização</h4><p>Não foi possível inicializar o relatório. Por favor, recarregue a página ou contate o administrador.</p><p><small>Detalhe do erro: ' + error.message + '</small></p></div>';
    }
});
