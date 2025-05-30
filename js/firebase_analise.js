// firebase_analise.js - Script para análise de dados do COPSOQ II (Versão Média)
// Integração com Firebase para dashboard dinâmico

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
        
        console.log('Firebase inicializado com sucesso. Buscando dados...');
        
        // Referência para elementos do DOM
        const empresaSelect = document.getElementById('empresa-select');
        const totalRespostasElement = document.getElementById('total-respostas');
        const mediaGeralElement = document.getElementById('media-geral');
        const dimensoesCriticasElement = document.getElementById('dimensoes-criticas');
        const dataAtualizacaoElement = document.getElementById('data-atualizacao');
        const totalParticipantesElement = document.getElementById('total-participantes');
        const dimensoesCriticasContainer = document.getElementById('dimensoes-criticas-container');
        const dimensoesPositivasContainer = document.getElementById('dimensoes-positivas-container');
        const resultadosTabela = document.getElementById('resultados-tabela').getElementsByTagName('tbody')[0];
        
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
        
        // Função para atualizar o dashboard com base nas respostas
        function atualizarDashboard(respostas, empresaFiltro) {
            // Filtrar respostas pela empresa selecionada
            const respostasFiltradas = empresaFiltro === 'todas' 
                ? respostas 
                : respostas.filter(r => r.empresa === empresaFiltro);
            
            // Atualizar estatísticas gerais
            const totalRespostas = respostasFiltradas.length;
            totalRespostasElement.textContent = totalRespostas;
            
            // Contar participantes únicos (por timestamp)
            const participantesUnicos = new Set();
            respostasFiltradas.forEach(r => participantesUnicos.add(r.timestamp));
            totalParticipantesElement.textContent = participantesUnicos.size;
            
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
            
            // Atualizar tabela de resultados
            let htmlTabela = '';
            mediasDimensoes.forEach(d => {
                htmlTabela += `
                    <tr>
                        <td>${d.titulo}</td>
                        <td>${d.media.toFixed(1)}</td>
                        <td class="${getClasseRisco(d.risco)}">${d.risco}</td>
                    </tr>
                `;
            });
            resultadosTabela.innerHTML = htmlTabela;
            
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
            
            // Calcular médias por categoria
            const mediasCategorias = [];
            
            categorias.forEach(categoria => {
                let somaCategoria = 0;
                let countCategoria = 0;
                
                categoria.dimensoes.forEach(dimensaoId => {
                    const dimensao = mediasDimensoes.find(d => d.id === dimensaoId);
                    if (dimensao && dimensao.media > 0) {
                        somaCategoria += dimensao.media;
                        countCategoria++;
                    }
                });
                
                const mediaCategoria = countCategoria > 0 ? somaCategoria / countCategoria : 0;
                const risco = mediaCategoria >= 3.5 ? 'Alto' : (mediaCategoria >= 2.5 ? 'Médio' : 'Baixo');
                
                mediasCategorias.push({
                    titulo: categoria.titulo,
                    media: mediaCategoria,
                    risco: risco
                });
            });
            
            // Atualizar gráfico por categoria
            const ctxCategorias = document.getElementById('categorias-chart').getContext('2d');
            if (window.categoriasChart) {
                window.categoriasChart.destroy();
            }
            
            window.categoriasChart = new Chart(ctxCategorias, {
                type: 'bar',
                data: {
                    labels: mediasCategorias.map(c => c.titulo),
                    datasets: [{
                        label: 'Média',
                        data: mediasCategorias.map(c => c.media),
                        backgroundColor: mediasCategorias.map(c => {
                            switch (c.risco) {
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
                        borderColor: mediasCategorias.map(c => {
                            switch (c.risco) {
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
                                    const categoria = mediasCategorias[index];
                                    return 'Risco: ' + categoria.risco;
                                }
                            }
                        }
                    }
                }
            });
            
            // Atualizar data de atualização
            const dataAtual = new Date();
            const dataFormatada = dataAtual.toLocaleDateString('pt-BR') + ' ' + dataAtual.toLocaleTimeString('pt-BR');
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
                console.log(`${respostas.length} respostas encontradas.`);
                
                // Popular select de empresas
                popularSelectEmpresas(respostas);
                
                // Atualizar dashboard com todas as respostas inicialmente
                atualizarDashboard(respostas, 'todas');
                
                // Adicionar event listener para o select de empresas
                empresaSelect.addEventListener('change', () => {
                    const empresaSelecionada = empresaSelect.value;
                    atualizarDashboard(respostas, empresaSelecionada);
                });
            } catch (error) {
                console.error('Erro ao processar dados do Firebase:', error);
                alert('Ocorreu um erro ao processar os dados. Por favor, recarregue a página ou contate o administrador.');
            }
        }, (error) => {
            console.error('Erro ao buscar dados do Firebase:', error);
            alert('Ocorreu um erro ao buscar os dados. Por favor, verifique sua conexão ou contate o administrador.');
        });
    } catch (error) {
        console.error('Erro ao inicializar o dashboard:', error);
        document.body.innerHTML = '<div class="alert alert-danger m-5" role="alert"><h4>Erro de Inicialização</h4><p>Não foi possível inicializar o dashboard. Por favor, recarregue a página ou contate o administrador.</p><p><small>Detalhe do erro: ' + error.message + '</small></p></div>';
    }
});
