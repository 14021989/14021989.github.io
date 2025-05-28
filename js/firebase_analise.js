// firebase_analise.js - Script para análise de dados do COPSOQ II (Versão Média)
// Integração com Firebase para dashboard dinâmico

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Firebase (usando configuração do firebase_config.js)
    if (typeof firebase === 'undefined') {
        console.error('Firebase não está definido. Verifique se o script do Firebase foi carregado corretamente.');
        return;
    }

    try {
        // Verificar se o Firebase já foi inicializado
        if (!firebase.apps || !firebase.apps.length) {
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
            { id: 'autoEficacia', titulo: 'Auto-eficácia', perguntas: [51, 52], inverter: false, descricao: 'Avalia a percepção de capacidade para resolver problemas' },
            { id: 'significadoTrabalho', titulo: 'Significado do Trabalho', perguntas: [53, 54, 55], inverter: false, descricao: 'Avalia o quanto o trabalho tem significado e importância para o indivíduo' },
            { id: 'compromissoTrabalho', titulo: 'Compromisso Face ao Local de Trabalho', perguntas: [56, 57], inverter: false, descricao: 'Avalia o grau de envolvimento com o local de trabalho' },
            { id: 'satisfacaoTrabalho', titulo: 'Satisfação no Trabalho', perguntas: [58, 59, 60, 61], inverter: false, descricao: 'Avalia o grau de satisfação com diversos aspectos do trabalho' },
            { id: 'insegurancaLaboral', titulo: 'Insegurança Laboral', perguntas: [62, 63, 64, 65], inverter: true, descricao: 'Avalia o grau de insegurança em relação ao emprego' },
            { id: 'saudeGeral', titulo: 'Saúde Geral', perguntas: [66], inverter: false, descricao: 'Avalia a percepção do estado de saúde geral' },
            { id: 'conflitosTrabalhoFamilia', titulo: 'Conflitos Trabalho-Família', perguntas: [67, 68, 69], inverter: true, descricao: 'Avalia o impacto do trabalho na vida familiar' },
            { id: 'problemasSono', titulo: 'Problemas em Dormir', perguntas: [70, 71, 72, 73], inverter: true, descricao: 'Avalia a qualidade do sono' },
            { id: 'burnout', titulo: 'Burnout', perguntas: [74, 75, 76, 77], inverter: true, descricao: 'Avalia sintomas de esgotamento físico e emocional' },
            { id: 'estresse', titulo: 'Estresse', perguntas: [78, 79, 80, 81], inverter: true, descricao: 'Avalia sintomas de estresse' },
            { id: 'comportamentosOfensivos', titulo: 'Comportamentos Ofensivos', perguntas: [82, 83, 84, 85, 86, 87], inverter: true, descricao: 'Avalia a exposição a comportamentos ofensivos no trabalho' }
        ];

        // Função para calcular o nível de risco com base na média
        function calcularRisco(media, inverter) {
            if (inverter) {
                if (media <= 2.33) return 'baixo';
                if (media <= 3.66) return 'medio';
                return 'alto';
            } else {
                if (media >= 3.66) return 'baixo';
                if (media >= 2.33) return 'medio';
                return 'alto';
            }
        }

        // Função para buscar e processar dados do Firebase
        function buscarDados(empresaFiltro = 'todas') {
            console.log(`Buscando dados para empresa: ${empresaFiltro}`);
            
            respostasRef.once('value')
                .then(snapshot => {
                    const respostas = snapshot.val();
                    
                    if (!respostas) {
                        console.log('Nenhuma resposta encontrada no Firebase.');
                        atualizarDashboardSemDados();
                        return;
                    }
                    
                    console.log(`Total de respostas encontradas: ${Object.keys(respostas).length}`);
                    
                    // Filtrar por empresa se necessário
                    let respostasFiltradas = [];
                    let empresasUnicas = new Set();
                    
                    Object.keys(respostas).forEach(key => {
                        const resposta = respostas[key];
                        
                        // Adicionar empresa à lista de empresas únicas
                        if (resposta.empresa) {
                            empresasUnicas.add(resposta.empresa);
                        }
                        
                        // Filtrar por empresa se não for 'todas'
                        if (empresaFiltro === 'todas' || resposta.empresa === empresaFiltro) {
                            respostasFiltradas.push(resposta);
                        }
                    });
                    
                    // Atualizar o select de empresas
                    atualizarSelectEmpresas(empresasUnicas, empresaFiltro);
                    
                    // Processar dados filtrados
                    processarDados(respostasFiltradas);
                })
                .catch(error => {
                    console.error('Erro ao buscar dados do Firebase:', error);
                    atualizarDashboardSemDados();
                });
        }
        
        // Função para atualizar o select de empresas
        function atualizarSelectEmpresas(empresasUnicas, empresaSelecionada) {
            // Limpar opções existentes, mantendo apenas a opção "Todas as Empresas"
            while (empresaSelect.options.length > 1) {
                empresaSelect.remove(1);
            }
            
            // Adicionar empresas ao select
            empresasUnicas.forEach(empresa => {
                const option = document.createElement('option');
                option.value = empresa;
                option.textContent = empresa;
                if (empresa === empresaSelecionada) {
                    option.selected = true;
                }
                empresaSelect.appendChild(option);
            });
        }
        
        // Função para processar os dados e atualizar o dashboard
        function processarDados(respostas) {
            if (respostas.length === 0) {
                console.log('Nenhuma resposta encontrada após filtro.');
                atualizarDashboardSemDados();
                return;
            }
            
            // Atualizar informações básicas
            totalRespostasElement.textContent = respostas.length;
            totalParticipantesElement.textContent = respostas.length;
            dataAtualizacaoElement.textContent = new Date().toLocaleDateString('pt-BR');
            
            // Calcular médias por dimensão
            const resultadosDimensoes = calcularMediasPorDimensao(respostas);
            
            // Calcular média geral
            const mediaGeral = calcularMediaGeral(resultadosDimensoes);
            mediaGeralElement.textContent = mediaGeral.toFixed(1);
            
            // Identificar dimensões críticas e positivas
            const dimensoesPorRisco = classificarDimensoesPorRisco(resultadosDimensoes);
            dimensoesCriticasElement.textContent = dimensoesPorRisco.alto.length;
            
            // Atualizar seções de dimensões críticas e positivas
            atualizarDimensoesCriticas(dimensoesPorRisco.alto);
            atualizarDimensoesPositivas(dimensoesPorRisco.baixo);
            
            // Atualizar tabela de resultados
            atualizarTabelaResultados(resultadosDimensoes);
            
            // Atualizar gráficos
            atualizarGraficos(resultadosDimensoes, dimensoesPorRisco);
        }
        
        // Função para calcular médias por dimensão
        function calcularMediasPorDimensao(respostas) {
            const resultados = [];
            
            dimensoes.forEach(dimensao => {
                let somaTotal = 0;
                let contadorRespostas = 0;
                
                // Para cada pergunta da dimensão
                dimensao.perguntas.forEach(numeroPergunta => {
                    // Para cada resposta
                    respostas.forEach(resposta => {
                        const valorResposta = parseInt(resposta[`q${numeroPergunta}`]);
                        if (!isNaN(valorResposta)) {
                            somaTotal += valorResposta;
                            contadorRespostas++;
                        }
                    });
                });
                
                // Calcular média
                const media = contadorRespostas > 0 ? somaTotal / contadorRespostas : 0;
                const risco = calcularRisco(media, dimensao.inverter);
                
                resultados.push({
                    ...dimensao,
                    media: media,
                    risco: risco
                });
            });
            
            return resultados;
        }
        
        // Função para calcular média geral
        function calcularMediaGeral(resultadosDimensoes) {
            const somaMedias = resultadosDimensoes.reduce((soma, dimensao) => soma + dimensao.media, 0);
            return resultadosDimensoes.length > 0 ? somaMedias / resultadosDimensoes.length : 0;
        }
        
        // Função para classificar dimensões por nível de risco
        function classificarDimensoesPorRisco(resultadosDimensoes) {
            const classificacao = {
                alto: [],
                medio: [],
                baixo: []
            };
            
            resultadosDimensoes.forEach(dimensao => {
                classificacao[dimensao.risco].push(dimensao);
            });
            
            return classificacao;
        }
        
        // Função para atualizar seção de dimensões críticas
        function atualizarDimensoesCriticas(dimensoesCriticas) {
            dimensoesCriticasContainer.innerHTML = '';
            
            if (dimensoesCriticas.length === 0) {
                dimensoesCriticasContainer.innerHTML = '<div class="col-12"><p class="text-center">Nenhuma dimensão crítica identificada.</p></div>';
                return;
            }
            
            dimensoesCriticas.forEach(dimensao => {
                const card = document.createElement('div');
                card.className = 'col-md-4 mb-3';
                card.innerHTML = `
                    <div class="card risk-high">
                        <div class="card-body">
                            <h5 class="card-title">${dimensao.titulo}</h5>
                            <p class="card-text">Média: ${dimensao.media.toFixed(1)}</p>
                            <p class="card-text small">${dimensao.descricao}</p>
                        </div>
                    </div>
                `;
                dimensoesCriticasContainer.appendChild(card);
            });
        }
        
        // Função para atualizar seção de dimensões positivas
        function atualizarDimensoesPositivas(dimensoesPositivas) {
            dimensoesPositivasContainer.innerHTML = '';
            
            if (dimensoesPositivas.length === 0) {
                dimensoesPositivasContainer.innerHTML = '<div class="col-12"><p class="text-center">Nenhuma dimensão positiva identificada.</p></div>';
                return;
            }
            
            dimensoesPositivas.forEach(dimensao => {
                const card = document.createElement('div');
                card.className = 'col-md-4 mb-3';
                card.innerHTML = `
                    <div class="card risk-low">
                        <div class="card-body">
                            <h5 class="card-title">${dimensao.titulo}</h5>
                            <p class="card-text">Média: ${dimensao.media.toFixed(1)}</p>
                            <p class="card-text small">${dimensao.descricao}</p>
                        </div>
                    </div>
                `;
                dimensoesPositivasContainer.appendChild(card);
            });
        }
        
        // Função para atualizar tabela de resultados
        function atualizarTabelaResultados(resultadosDimensoes) {
            resultadosTabela.innerHTML = '';
            
            resultadosDimensoes.forEach(dimensao => {
                const row = document.createElement('tr');
                
                // Adicionar classe de cor conforme o risco
                if (dimensao.risco === 'alto') {
                    row.className = 'table-danger';
                } else if (dimensao.risco === 'medio') {
                    row.className = 'table-warning';
                } else {
                    row.className = 'table-success';
                }
                
                row.innerHTML = `
                    <td>${dimensao.titulo}</td>
                    <td>${dimensao.media.toFixed(1)}</td>
                    <td>${dimensao.risco.charAt(0).toUpperCase() + dimensao.risco.slice(1)}</td>
                    <td>${dimensao.descricao}</td>
                `;
                
                resultadosTabela.appendChild(row);
            });
        }
        
        // Função para atualizar gráficos
        function atualizarGraficos(resultadosDimensoes, dimensoesPorRisco) {
            // Gráfico de dimensões
            const dimensoesChart = new Chart(
                document.getElementById('dimensoes-chart'),
                {
                    type: 'bar',
                    data: {
                        labels: resultadosDimensoes.map(d => d.titulo),
                        datasets: [{
                            label: 'Média',
                            data: resultadosDimensoes.map(d => d.media),
                            backgroundColor: resultadosDimensoes.map(d => {
                                if (d.risco === 'alto') return '#e53935';
                                if (d.risco === 'medio') return '#ffb300';
                                return '#43a047';
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
                                max: 5
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                }
            );
            
            // Gráfico de categorias
            const categoriasChart = new Chart(
                document.getElementById('categorias-chart'),
                {
                    type: 'pie',
                    data: {
                        labels: ['Exigências', 'Organização e Conteúdo', 'Relações Sociais', 'Interface Trabalho-Indivíduo', 'Saúde e Bem-estar'],
                        datasets: [{
                            data: [4, 6, 7, 5, 6], // Valores fixos para categorias
                            backgroundColor: ['#e53935', '#ffb300', '#43a047', '#1e88e5', '#8e24aa']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                }
            );
            
            // Gráfico de riscos
            const riscosChart = new Chart(
                document.getElementById('riscos-chart'),
                {
                    type: 'doughnut',
                    data: {
                        labels: ['Alto Risco', 'Médio Risco', 'Baixo Risco'],
                        datasets: [{
                            data: [
                                dimensoesPorRisco.alto.length,
                                dimensoesPorRisco.medio.length,
                                dimensoesPorRisco.baixo.length
                            ],
                            backgroundColor: ['#e53935', '#ffb300', '#43a047']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                }
            );
        }
        
        // Função para atualizar dashboard quando não há dados
        function atualizarDashboardSemDados() {
            totalRespostasElement.textContent = '0';
            mediaGeralElement.textContent = '0.0';
            dimensoesCriticasElement.textContent = '0';
            totalParticipantesElement.textContent = '0';
            dataAtualizacaoElement.textContent = new Date().toLocaleDateString('pt-BR');
            
            dimensoesCriticasContainer.innerHTML = '<div class="col-12"><p class="text-center">Nenhum dado disponível.</p></div>';
            dimensoesPositivasContainer.innerHTML = '<div class="col-12"><p class="text-center">Nenhum dado disponível.</p></div>';
            resultadosTabela.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum dado disponível.</td></tr>';
            
            // Criar gráficos vazios
            new Chart(document.getElementById('dimensoes-chart'), {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: []
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            
            new Chart(document.getElementById('categorias-chart'), {
                type: 'pie',
                data: {
                    labels: ['Sem dados'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#cccccc']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            
            new Chart(document.getElementById('riscos-chart'), {
                type: 'doughnut',
                data: {
                    labels: ['Sem dados'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#cccccc']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        // Evento de mudança no select de empresas
        empresaSelect.addEventListener('change', function() {
            buscarDados(this.value);
        });
        
        // Evento para o botão de gerar PDF
        document.getElementById('generate-pdf-btn').addEventListener('click', function() {
            document.getElementById('pdf-instructions').classList.add('show');
        });
        
        // Iniciar busca de dados
        buscarDados('todas');
        
    } catch (error) {
        console.error('Erro ao inicializar Firebase ou processar dados:', error);
    }
});
