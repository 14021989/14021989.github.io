// firebase_relatorio.js - Script para buscar dados do Firebase, processar e popular o relatório detalhado
// Adaptado para filtrar por empresa

document.addEventListener("DOMContentLoaded", function() {
    // --- Configuração e Lógica de Cálculo (Mantida) ---
    const DIMENSOES_CONFIG = {
        "Exigências Quantitativas": { perguntas: [1, 2, 3], invertida: false, descricao: "Relaciona-se com a carga de trabalho e sua distribuição temporal" },
        "Ritmo de Trabalho": { perguntas: [4], invertida: false, descricao: "Relaciona-se com a velocidade e intensidade do trabalho" },
        "Exigências Cognitivas": { perguntas: [5, 6, 7], invertida: false, descricao: "Relaciona-se com as demandas cognitivas do trabalho" },
        "Exigências Emocionais": { perguntas: [8], invertida: false, descricao: "Relaciona-se com o envolvimento emocional no trabalho" },
        "Influência no Trabalho": { perguntas: [9, 10, 11, 12], invertida: true, descricao: "Avalia o grau de influência que o trabalhador tem sobre o seu próprio trabalho" },
        "Possibilidades de Desenvolvimento": { perguntas: [13, 14, 15], invertida: true, descricao: "Avalia as oportunidades de desenvolvimento de habilidades no trabalho" },
        "Previsibilidade": { perguntas: [16, 17], invertida: true, descricao: "Avalia o grau de informação sobre mudanças e decisões no trabalho" },
        "Transparência do Papel Laboral": { perguntas: [18, 19, 20], invertida: true, descricao: "Avalia a clareza dos objetivos e responsabilidades no trabalho" },
        "Recompensas": { perguntas: [21, 22, 23], invertida: true, descricao: "Avalia o reconhecimento e valorização no trabalho" },
        "Conflitos Laborais": { perguntas: [24, 25, 26], invertida: false, descricao: "Avalia a existência de demandas contraditórias no trabalho" },
        "Apoio Social de Colegas": { perguntas: [27, 28, 29], invertida: true, descricao: "Avalia o apoio recebido dos colegas de trabalho" },
        "Apoio Social de Superiores": { perguntas: [30, 31, 32], invertida: true, descricao: "Avalia o apoio recebido dos superiores hierárquicos" },
        "Comunidade Social no Trabalho": { perguntas: [33, 34, 35], invertida: true, descricao: "Avalia o sentimento de pertença e cooperação no ambiente de trabalho" },
        "Qualidade da Liderança": { perguntas: [36, 37, 38, 39], invertida: true, descricao: "Avalia a percepção sobre a qualidade da gestão" },
        "Confiança Horizontal": { perguntas: [40, 41, 42], invertida: true, descricao: "Avalia a confiança entre os colegas de trabalho" },
        "Confiança Vertical": { perguntas: [43, 44, 45], invertida: true, descricao: "Avalia a confiança entre trabalhadores e gestão" },
        "Justiça e Respeito": { perguntas: [46, 47, 48], invertida: true, descricao: "Avalia a percepção de justiça e respeito no ambiente de trabalho" },
        "Auto-eficácia": { perguntas: [49, 50], invertida: true, descricao: "Avalia a percepção de capacidade para resolver problemas" },
        "Significado do Trabalho": { perguntas: [51, 52, 53], invertida: true, descricao: "Avalia o quanto o trabalho tem significado e importância para o indivíduo" },
        "Compromisso Face ao Local de Trabalho": { perguntas: [54, 55], invertida: true, descricao: "Avalia o grau de envolvimento com o local de trabalho" },
        "Satisfação no Trabalho": { perguntas: [56, 57, 58, 59], invertida: true, descricao: "Avalia o grau de satisfação com diversos aspectos do trabalho" },
        "Insegurança Laboral": { perguntas: [60], invertida: false, descricao: "Avalia a preocupação com a possibilidade de perder o emprego" },
        "Saúde Geral": { perguntas: [61], invertida: true, descricao: "Avalia a percepção geral sobre a própria saúde" },
        "Conflito Trabalho/Família": { perguntas: [62, 63, 64], invertida: false, descricao: "Avalia o impacto do trabalho na vida privada" },
        "Problemas em Dormir": { perguntas: [65, 66], invertida: false, descricao: "Avalia a qualidade do sono" },
        "Burnout": { perguntas: [67, 68], invertida: false, descricao: "Avalia sintomas de esgotamento físico e emocional" },
        "Stress": { perguntas: [69, 70], invertida: false, descricao: "Avalia sintomas de stress" },
        "Sintomas Depressivos": { perguntas: [71, 72], invertida: false, descricao: "Avalia sintomas depressivos" },
    };

    const CATEGORIAS_DIMENSOES = {
        "Demandas no Trabalho": ["Exigências Quantitativas", "Ritmo de Trabalho", "Exigências Cognitivas", "Exigências Emocionais"],
        "Organização e Conteúdo": ["Influência no Trabalho", "Possibilidades de Desenvolvimento", "Previsibilidade", "Transparência do Papel Laboral", "Recompensas"],
        "Relações Sociais e Liderança": ["Apoio Social de Colegas", "Apoio Social de Superiores", "Comunidade Social no Trabalho", "Qualidade da Liderança", "Confiança Horizontal", "Confiança Vertical", "Justiça e Respeito"],
        "Interface Trabalho-Indivíduo": ["Auto-eficácia", "Significado do Trabalho", "Compromisso Face ao Local de Trabalho", "Satisfação no Trabalho", "Insegurança Laboral", "Conflito Trabalho/Família"],
        "Saúde e Bem-estar": ["Saúde Geral", "Problemas em Dormir", "Burnout", "Stress", "Sintomas Depressivos"]
    };

    function inverterPontuacao(valor) {
        if (valor >= 1 && valor <= 5) return 6 - valor;
        return valor;
    }

    function determinarRisco(media, isInvertida) {
        if (isInvertida) {
            if (media >= 3.6) return 'baixo';
            if (media >= 2.6) return 'medio';
            return 'alto';
        } else {
            if (media >= 3.6) return 'alto';
            if (media >= 2.6) return 'medio';
            return 'baixo';
        }
    }

    function calcularResultadosCOPSOQ(respostasArray) {
        if (!respostasArray || respostasArray.length === 0) return null;

        const numRespostas = respostasArray.length;
        const somasPorPergunta = {};
        const contagemPorPergunta = {};

        for (let i = 1; i <= 87; i++) {
            somasPorPergunta[`q${i}`] = 0;
            contagemPorPergunta[`q${i}`] = 0;
        }

        respostasArray.forEach(resposta => {
            for (let i = 1; i <= 87; i++) {
                const key = `q${i}`;
                if (resposta[key] !== undefined && resposta[key] !== null && resposta[key] !== '') {
                    const valor = parseInt(resposta[key]);
                    if (!isNaN(valor) && valor >= 1 && valor <= 5) {
                        somasPorPergunta[key] += valor;
                        contagemPorPergunta[key]++;
                    }
                }
            }
        });

        const mediasPorPergunta = {};
        for (let i = 1; i <= 87; i++) {
            const key = `q${i}`;
            mediasPorPergunta[key] = contagemPorPergunta[key] > 0 ? somasPorPergunta[key] / contagemPorPergunta[key] : null;
        }

        const resultadosDimensoes = [];
        let somaMediasGerais = 0;
        let countMediasGerais = 0;
        const niveisRisco = { baixo: 0, medio: 0, alto: 0 };

        for (const nomeDimensao in DIMENSOES_CONFIG) {
            const config = DIMENSOES_CONFIG[nomeDimensao];
            let somaMediaPerguntasDimensao = 0;
            let countPerguntasDimensao = 0;

            config.perguntas.forEach(numPergunta => {
                const key = `q${numPergunta}`;
                if (mediasPorPergunta[key] !== null) {
                    let mediaPergunta = mediasPorPergunta[key];
                    if (config.invertida) {
                        mediaPergunta = inverterPontuacao(mediaPergunta);
                    }
                    somaMediaPerguntasDimensao += mediaPergunta;
                    countPerguntasDimensao++;
                }
            });

            if (countPerguntasDimensao > 0) {
                const mediaDimensao = somaMediaPerguntasDimensao / countPerguntasDimensao;
                const riscoDimensao = determinarRisco(mediaDimensao, false);

                resultadosDimensoes.push({
                    titulo: nomeDimensao,
                    media: mediaDimensao,
                    risco: riscoDimensao,
                    descricao: config.descricao
                });

                somaMediasGerais += mediaDimensao;
                countMediasGerais++;
                niveisRisco[riscoDimensao]++;
            } else {
                 resultadosDimensoes.push({
                    titulo: nomeDimensao,
                    media: null,
                    risco: 'N/A',
                    descricao: config.descricao
                });
            }
        }

        const mediaGeral = countMediasGerais > 0 ? somaMediasGerais / countMediasGerais : null;

        const resultadosCategorias = {};
        for (const nomeCategoria in CATEGORIAS_DIMENSOES) {
            let somaMediasCategoria = 0;
            let countDimensoesCategoria = 0;
            CATEGORIAS_DIMENSOES[nomeCategoria].forEach(nomeDimensao => {
                const dimensao = resultadosDimensoes.find(d => d.titulo === nomeDimensao);
                if (dimensao && dimensao.media !== null) {
                    somaMediasCategoria += dimensao.media;
                    countDimensoesCategoria++;
                }
            });
            resultadosCategorias[nomeCategoria] = countDimensoesCategoria > 0 ? somaMediasCategoria / countDimensoesCategoria : null;
        }

        return {
            totalRespostas: numRespostas,
            mediaGeral: mediaGeral,
            dimensoes: resultadosDimensoes.filter(d => d.media !== null),
            niveisRisco: niveisRisco,
            categorias: resultadosCategorias
        };
    }

    function gerarRecomendacoes(dimensoes) {
        const recomendacoes = {
            prioritarias: [],
            secundarias: [],
            manutencao: []
        };

        dimensoes.forEach(dimensao => {
            const rec = {
                dimensao: dimensao.titulo,
                descricao: dimensao.descricao,
                acoes: []
            };

            if (dimensao.risco === 'alto') {
                rec.acoes.push(`Revisar processos relacionados a ${dimensao.titulo}.`);
                rec.acoes.push(`Implementar ações de mitigação específicas para ${dimensao.titulo}.`);
                rec.acoes.push(`Oferecer suporte e treinamento focado em ${dimensao.titulo}.`);
                recomendacoes.prioritarias.push(rec);
            } else if (dimensao.risco === 'medio') {
                rec.acoes.push(`Monitorar indicadores relacionados a ${dimensao.titulo}.`);
                rec.acoes.push(`Coletar feedback dos colaboradores sobre ${dimensao.titulo}.`);
                rec.acoes.push(`Planejar ações preventivas para ${dimensao.titulo}.`);
                recomendacoes.secundarias.push(rec);
            } else {
                rec.acoes.push(`Manter as boas práticas atuais relacionadas a ${dimensao.titulo}.`);
                rec.acoes.push(`Reconhecer e valorizar os aspectos positivos de ${dimensao.titulo}.`);
                rec.acoes.push(`Compartilhar as práticas de sucesso de ${dimensao.titulo} com outras áreas.`);
                recomendacoes.manutencao.push(rec);
            }
        });

        return recomendacoes;
    }

    // --- Variável Global para Armazenar Todas as Respostas --- 
    let todasAsRespostas = [];

    // --- Função para Popular o Dropdown de Empresas --- 
    function popularDropdownEmpresas(respostas) {
        const selectEmpresa = document.getElementById('empresa-select');
        if (!selectEmpresa) return;

        while (selectEmpresa.options.length > 1) {
            selectEmpresa.remove(1);
        }

        const nomesEmpresas = [...new Set(respostas.map(r => r.empresa).filter(Boolean))].sort();

        nomesEmpresas.forEach(nome => {
            const option = document.createElement('option');
            option.value = nome;
            option.textContent = nome;
            selectEmpresa.appendChild(option);
        });
    }

    // --- Função Principal para Atualizar o HTML do Relatório --- 
    function atualizarRelatorioHTML(resultados, recomendacoes) {
        if (!resultados) {
            // Limpa o relatório ou mostra mensagem de "sem dados"
            document.getElementById('total-participantes').textContent = '0';
            document.getElementById('data-geracao').textContent = new Date().toLocaleDateString('pt-BR');
            document.getElementById('total-respostas').textContent = '0';
            document.getElementById('media-geral').textContent = 'N/A';
            document.getElementById('dimensoes-criticas').textContent = '0';
            document.getElementById('percentual-alto').textContent = '0%';
            document.getElementById('percentual-medio').textContent = '0%';
            document.getElementById('percentual-baixo').textContent = '0%';
            document.getElementById('categorias-criticas').textContent = 'Nenhuma';
            document.getElementById('conclusao-dimensoes-criticas').textContent = 'Nenhuma';
            document.getElementById('conclusao-dimensoes-positivas').textContent = 'Nenhuma';
            document.getElementById('dimensoes-criticas-container').innerHTML = '<p>Sem dados para exibir.</p>';
            document.getElementById('recomendacoes-prioritarias').innerHTML = '<p>Sem dados para exibir.</p>';
            document.getElementById('dimensoes-intermediarias-container').innerHTML = '<p>Sem dados para exibir.</p>';
            document.getElementById('recomendacoes-secundarias').innerHTML = '<p>Sem dados para exibir.</p>';
            document.getElementById('dimensoes-positivas-container').innerHTML = '<p>Sem dados para exibir.</p>';
            document.getElementById('acoes-manutencao').innerHTML = '<p>Sem dados para exibir.</p>';
            document.getElementById('resultados-tabela').getElementsByTagName('tbody')[0].innerHTML = '<tr><td colspan="4">Sem dados para exibir.</td></tr>';
            // Limpar gráficos
            if (window.graficoDimensoes) window.graficoDimensoes.destroy();
            if (window.graficoCategorias) window.graficoCategorias.destroy();
            if (window.graficoRiscos) window.graficoRiscos.destroy();
            return;
        }

        // Atualizar informações gerais
        document.getElementById('total-participantes').textContent = resultados.totalRespostas;
        document.getElementById('data-geracao').textContent = new Date().toLocaleDateString('pt-BR');

        // Atualizar resumo executivo
        document.getElementById('total-respostas').textContent = resultados.totalRespostas;
        document.getElementById('media-geral').textContent = resultados.mediaGeral ? resultados.mediaGeral.toFixed(1) : 'N/A';
        document.getElementById('dimensoes-criticas').textContent = resultados.niveisRisco.alto;

        const totalDimensoes = resultados.dimensoes.length;
        if (totalDimensoes > 0) {
            document.getElementById('percentual-alto').textContent = Math.round((resultados.niveisRisco.alto / totalDimensoes) * 100) + '%';
            document.getElementById('percentual-medio').textContent = Math.round((resultados.niveisRisco.medio / totalDimensoes) * 100) + '%';
            document.getElementById('percentual-baixo').textContent = Math.round((resultados.niveisRisco.baixo / totalDimensoes) * 100) + '%';
        }

        const dimensoesCriticasResumo = resultados.dimensoes.filter(d => d.risco === 'alto').map(d => d.titulo).slice(0, 3).join(', ');
        document.getElementById('categorias-criticas').textContent = dimensoesCriticasResumo || 'Nenhuma';
        document.getElementById('conclusao-dimensoes-criticas').textContent = dimensoesCriticasResumo || 'Nenhuma';

        const dimensoesPositivasResumo = resultados.dimensoes.filter(d => d.risco === 'baixo').map(d => d.titulo).slice(0, 3).join(', ');
        document.getElementById('conclusao-dimensoes-positivas').textContent = dimensoesPositivasResumo || 'Nenhuma';

        // Limpar gráficos antigos se existirem
        if (window.graficoDimensoes) window.graficoDimensoes.destroy();
        if (window.graficoCategorias) window.graficoCategorias.destroy();
        if (window.graficoRiscos) window.graficoRiscos.destroy();

        // Gerar Gráfico de Dimensões (Barra)
        const dimensoesOrdenadas = [...resultados.dimensoes].sort((a, b) => b.media - a.media);
        const ctxDimensoes = document.getElementById('dimensoes-chart').getContext('2d');
        window.graficoDimensoes = new Chart(ctxDimensoes, {
            type: 'bar',
            data: {
                labels: dimensoesOrdenadas.map(d => d.titulo),
                datasets: [{
                    label: 'Média por Dimensão',
                    data: dimensoesOrdenadas.map(d => d.media),
                    backgroundColor: dimensoesOrdenadas.map(d => {
                        if (d.risco === 'alto') return '#e53935';
                        if (d.risco === 'medio') return '#ffb300';
                        return '#43a047';
                    }),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                scales: { x: { beginAtZero: true, max: 5 } },
                plugins: { legend: { display: false } },
                responsive: true,
                maintainAspectRatio: false
            }
        });

        // Gerar Gráfico de Categorias (Radar)
        const categoriasLabels = Object.keys(resultados.categorias);
        const categoriasData = categoriasLabels.map(label => resultados.categorias[label]); // Ajuste aqui se a estrutura de categorias mudou
        const ctxCategorias = document.getElementById('categorias-chart').getContext('2d');
        window.graficoCategorias = new Chart(ctxCategorias, {
            type: 'radar',
            data: {
                labels: categoriasLabels,
                datasets: [{
                    label: 'Média por Categoria',
                    data: categoriasData,
                    fill: true,
                    backgroundColor: 'rgba(13, 110, 253, 0.2)',
                    borderColor: 'rgb(13, 110, 253)',
                    pointBackgroundColor: 'rgb(13, 110, 253)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(13, 110, 253)'
                }]
            },
            options: {
                elements: { line: { borderWidth: 3 } },
                scales: { r: { angleLines: { display: false }, suggestedMin: 0, suggestedMax: 5 } },
                responsive: true,
                maintainAspectRatio: false
            }
        });

        // Gerar Gráfico de Níveis de Risco (Pizza)
        const ctxRiscos = document.getElementById('riscos-chart').getContext('2d');
        window.graficoRiscos = new Chart(ctxRiscos, {
            type: 'pie',
            data: {
                labels: ['Alto Risco', 'Médio Risco', 'Baixo Risco'],
                datasets: [{
                    label: 'Distribuição de Risco',
                    data: [
                        resultados.niveisRisco.alto,
                        resultados.niveisRisco.medio,
                        resultados.niveisRisco.baixo
                    ],
                    backgroundColor: ['#e53935', '#ffb300', '#43a047'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } }
            }
        });

        // Preencher seções de dimensões e recomendações
        const dimensoesCriticasContainer = document.getElementById('dimensoes-criticas-container');
        const recomendacoesPrioritariasContainer = document.getElementById('recomendacoes-prioritarias');
        const dimensoesIntermediariasContainer = document.getElementById('dimensoes-intermediarias-container');
        const recomendacoesSecundariasContainer = document.getElementById('recomendacoes-secundarias');
        const dimensoesPositivasContainer = document.getElementById('dimensoes-positivas-container');
        const acoesManutencaoContainer = document.getElementById('acoes-manutencao');
        const tabelaResultados = document.getElementById('resultados-tabela').getElementsByTagName('tbody')[0];

        // Limpar containers
        dimensoesCriticasContainer.innerHTML = '';
        recomendacoesPrioritariasContainer.innerHTML = '';
        dimensoesIntermediariasContainer.innerHTML = '';
        recomendacoesSecundariasContainer.innerHTML = '';
        dimensoesPositivasContainer.innerHTML = '';
        acoesManutencaoContainer.innerHTML = '';
        tabelaResultados.innerHTML = '';

        function criarCardDimensao(dimensao) {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';
            const card = document.createElement('div');
            card.className = `card dimension-card risk-${dimensao.risco}`;
            card.innerHTML = `
                <div class="card-body">
                    <h6 class="card-title">${dimensao.titulo}</h6>
                    <p class="card-text"><small>${dimensao.descricao}</small></p>
                    <p class="card-text"><strong>Média: ${dimensao.media.toFixed(2)}</strong></p>
                </div>
            `;
            col.appendChild(card);
            return col;
        }

        function criarBlocoRecomendacao(rec) {
            const div = document.createElement('div');
            div.className = 'recommendation';
            let html = `<h5>${rec.dimensao}</h5><ul>`;
            rec.acoes.forEach(acao => {
                html += `<li>${acao}</li>`;
            });
            html += `</ul>`;
            div.innerHTML = html;
            return div;
        }

        // Preencher Dimensões Críticas e Recomendações Prioritárias
        const dimensoesCriticas = resultados.dimensoes.filter(d => d.risco === 'alto');
        if (dimensoesCriticas.length > 0) {
            dimensoesCriticas.forEach(d => dimensoesCriticasContainer.appendChild(criarCardDimensao(d)));
            recomendacoes.prioritarias.forEach(rec => recomendacoesPrioritariasContainer.appendChild(criarBlocoRecomendacao(rec)));
        } else {
            dimensoesCriticasContainer.innerHTML = '<p>Nenhuma dimensão crítica identificada para esta seleção.</p>';
            recomendacoesPrioritariasContainer.innerHTML = '<p>Nenhuma recomendação prioritária identificada para esta seleção.</p>';
        }

        // Preencher Dimensões Intermediárias e Recomendações Secundárias
        const dimensoesIntermediarias = resultados.dimensoes.filter(d => d.risco === 'medio');
        if (dimensoesIntermediarias.length > 0) {
            dimensoesIntermediarias.forEach(d => dimensoesIntermediariasContainer.appendChild(criarCardDimensao(d)));
            recomendacoes.secundarias.forEach(rec => recomendacoesSecundariasContainer.appendChild(criarBlocoRecomendacao(rec)));
        } else {
            dimensoesIntermediariasContainer.innerHTML = '<p>Nenhuma dimensão intermediária identificada para esta seleção.</p>';
            recomendacoesSecundariasContainer.innerHTML = '<p>Nenhuma recomendação secundária identificada para esta seleção.</p>';
        }

        // Preencher Dimensões Positivas e Ações de Manutenção
        const dimensoesPositivas = resultados.dimensoes.filter(d => d.risco === 'baixo');
        if (dimensoesPositivas.length > 0) {
            dimensoesPositivas.forEach(d => dimensoesPositivasContainer.appendChild(criarCardDimensao(d)));
            recomendacoes.manutencao.forEach(rec => acoesManutencaoContainer.appendChild(criarBlocoRecomendacao(rec)));
        } else {
            dimensoesPositivasContainer.innerHTML = '<p>Nenhuma dimensão positiva identificada para esta seleção.</p>';
            acoesManutencaoContainer.innerHTML = '<p>Nenhuma ação de manutenção identificada para esta seleção.</p>';
        }

        // Preencher tabela de resultados detalhados
        resultados.dimensoes.forEach(dimensao => {
            const row = tabelaResultados.insertRow();
            row.insertCell(0).textContent = dimensao.titulo;
            row.insertCell(1).textContent = dimensao.media.toFixed(2);
            const cellRisco = row.insertCell(2);
            cellRisco.textContent = dimensao.risco.charAt(0).toUpperCase() + dimensao.risco.slice(1);
            if (dimensao.risco === 'alto') cellRisco.style.color = '#e53935';
            else if (dimensao.risco === 'medio') cellRisco.style.color = '#ffb300';
            else cellRisco.style.color = '#43a047';
            row.insertCell(3).textContent = dimensao.descricao;
        });
    }

    // --- Inicialização do Firebase e Busca de Dados ---
    try {
        if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
            // Evita reinicializar se já foi inicializado (ex: por outro script na mesma página)
            if (!firebase.apps.length) {
                 firebase.initializeApp(firebaseConfig);
            } else {
                 firebase.app(); // if already initialized, use that one
            }
            const database = firebase.database();
            const respostasRef = database.ref('respostas');
            const selectEmpresa = document.getElementById('empresa-select');

            respostasRef.on('value', (snapshot) => {
                const dadosFirebase = snapshot.val();
                todasAsRespostas = dadosFirebase ? Object.values(dadosFirebase) : [];

                popularDropdownEmpresas(todasAsRespostas);

                const empresaSelecionada = selectEmpresa ? selectEmpresa.value : 'todas';
                const respostasFiltradas = empresaSelecionada === 'todas' 
                    ? todasAsRespostas 
                    : todasAsRespostas.filter(r => r.empresa === empresaSelecionada);
                
                const resultados = calcularResultadosCOPSOQ(respostasFiltradas);
                const recomendacoes = resultados ? gerarRecomendacoes(resultados.dimensoes) : null;
                atualizarRelatorioHTML(resultados, recomendacoes);

            }, (error) => {
                console.error("Erro ao buscar dados do Firebase: ", error);
                alert("Erro ao carregar os dados do relatório. Verifique a conexão e a configuração do Firebase.");
            });

            if (selectEmpresa) {
                selectEmpresa.addEventListener('change', (event) => {
                    const empresaSelecionada = event.target.value;
                    const respostasFiltradas = empresaSelecionada === 'todas' 
                        ? todasAsRespostas 
                        : todasAsRespostas.filter(r => r.empresa === empresaSelecionada);
                    
                    const resultados = calcularResultadosCOPSOQ(respostasFiltradas);
                    const recomendacoes = resultados ? gerarRecomendacoes(resultados.dimensoes) : null;
                    atualizarRelatorioHTML(resultados, recomendacoes);
                });
            }

        } else {
            console.error("Firebase ou firebaseConfig não definidos.");
            alert("Erro na configuração do Firebase. O relatório não pode ser carregado.");
        }
    } catch (error) {
        console.error("Erro ao inicializar o Firebase ou processar dados: ", error);
        alert("Ocorreu um erro inesperado ao carregar o relatório.");
    }

    // Botão de Impressão
    const printButton = document.querySelector('.print-btn');
    if (printButton) {
        printButton.addEventListener('click', () => {
            window.print();
        });
    }
});

