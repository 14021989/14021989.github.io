// firebase_analise.js - Sistema de análise e tabulação de dados para o questionário COPSOQ II versão média (87 perguntas)
// Adaptado para processar múltiplas respostas do Firebase e filtrar por empresa

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
            resultadosCategorias[nomeCategoria] = {
                 mediaGeral: countDimensoesCategoria > 0 ? somaMediasCategoria / countDimensoesCategoria : null
            };
        }

        return {
            totalRespostas: numRespostas,
            mediaGeral: mediaGeral,
            dimensoes: resultadosDimensoes.filter(d => d.media !== null),
            niveisRisco: niveisRisco,
            categorias: resultadosCategorias
        };
    }

    // --- Variável Global para Armazenar Todas as Respostas --- 
    let todasAsRespostas = [];

    // --- Função para Popular o Dropdown de Empresas --- 
    function popularDropdownEmpresas(respostas) {
        const selectEmpresa = document.getElementById('empresa-select');
        if (!selectEmpresa) return;

        // Limpa opções antigas (exceto a primeira "Todas as Empresas")
        while (selectEmpresa.options.length > 1) {
            selectEmpresa.remove(1);
        }

        // Extrai nomes únicos de empresas
        const nomesEmpresas = [...new Set(respostas.map(r => r.empresa).filter(Boolean))].sort(); // Filtra nulos/vazios e ordena

        // Adiciona opções ao dropdown
        nomesEmpresas.forEach(nome => {
            const option = document.createElement('option');
            option.value = nome;
            option.textContent = nome;
            selectEmpresa.appendChild(option);
        });
    }

    // --- Função Principal para Atualizar o Dashboard --- 
    function atualizarDashboard(respostasFiltradas) {
        const resultados = calcularResultadosCOPSOQ(respostasFiltradas);

        if (!resultados) {
            // Limpa o dashboard ou mostra mensagem de "sem dados para esta empresa"
            document.getElementById('total-participantes').textContent = '0';
            document.getElementById('data-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');
            document.getElementById('total-respostas').textContent = '0';
            document.getElementById('media-geral').textContent = 'N/A';
            document.getElementById('dimensoes-criticas').textContent = '0';
            document.getElementById('dimensoes-criticas-container').innerHTML = '<p>Sem dados para exibir.</p>';
            document.getElementById('dimensoes-positivas-container').innerHTML = '<p>Sem dados para exibir.</p>';
            document.getElementById('resultados-tabela').getElementsByTagName('tbody')[0].innerHTML = '<tr><td colspan="4">Sem dados para exibir.</td></tr>';
            // Limpar gráficos
            if (window.graficoDimensoes) window.graficoDimensoes.destroy();
            if (window.graficoCategorias) window.graficoCategorias.destroy();
            if (window.graficoRiscos) window.graficoRiscos.destroy();
            return;
        }

        // Atualizar informações gerais
        document.getElementById('total-participantes').textContent = resultados.totalRespostas;
        document.getElementById('data-atualizacao').textContent = new Date().toLocaleDateString('pt-BR');

        // Atualizar resumo estatístico
        document.getElementById('total-respostas').textContent = resultados.totalRespostas;
        document.getElementById('media-geral').textContent = resultados.mediaGeral ? resultados.mediaGeral.toFixed(1) : 'N/A';
        document.getElementById('dimensoes-criticas').textContent = resultados.niveisRisco.alto;

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
                        if (d.risco === 'alto') return '#e53935'; // Vermelho
                        if (d.risco === 'medio') return '#ffb300'; // Amarelo
                        return '#43a047'; // Verde
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
        const categoriasData = categoriasLabels.map(label => resultados.categorias[label].mediaGeral);
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

        // Preencher seções de dimensões críticas e positivas
        const dimensoesCriticasContainer = document.getElementById('dimensoes-criticas-container');
        const dimensoesPositivasContainer = document.getElementById('dimensoes-positivas-container');
        dimensoesCriticasContainer.innerHTML = '';
        dimensoesPositivasContainer.innerHTML = '';

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

        resultados.dimensoes.filter(d => d.risco === 'alto').forEach(d => dimensoesCriticasContainer.appendChild(criarCardDimensao(d)));
        resultados.dimensoes.filter(d => d.risco === 'baixo').forEach(d => dimensoesPositivasContainer.appendChild(criarCardDimensao(d)));

        if (dimensoesCriticasContainer.children.length === 0) {
            dimensoesCriticasContainer.innerHTML = '<p>Nenhuma dimensão crítica identificada para esta seleção.</p>';
        }
        if (dimensoesPositivasContainer.children.length === 0) {
            dimensoesPositivasContainer.innerHTML = '<p>Nenhuma dimensão positiva identificada para esta seleção.</p>';
        }

        // Preencher tabela de resultados detalhados
        const tabelaResultados = document.getElementById('resultados-tabela').getElementsByTagName('tbody')[0];
        tabelaResultados.innerHTML = ''; // Limpa tabela
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
            firebase.initializeApp(firebaseConfig);
            const database = firebase.database();
            const respostasRef = database.ref('respostas');
            const selectEmpresa = document.getElementById('empresa-select');

            respostasRef.on('value', (snapshot) => {
                const dadosFirebase = snapshot.val();
                todasAsRespostas = dadosFirebase ? Object.values(dadosFirebase) : [];

                // Popula o dropdown de empresas
                popularDropdownEmpresas(todasAsRespostas);

                // Atualiza o dashboard com a seleção atual (inicialmente "Todas")
                const empresaSelecionada = selectEmpresa ? selectEmpresa.value : 'todas';
                const respostasFiltradas = empresaSelecionada === 'todas' 
                    ? todasAsRespostas 
                    : todasAsRespostas.filter(r => r.empresa === empresaSelecionada);
                
                atualizarDashboard(respostasFiltradas);

            }, (error) => {
                console.error("Erro ao buscar dados do Firebase: ", error);
                alert("Erro ao carregar os dados do dashboard. Verifique a conexão e a configuração do Firebase.");
            });

            // Adiciona listener para o dropdown de empresas
            if (selectEmpresa) {
                selectEmpresa.addEventListener('change', (event) => {
                    const empresaSelecionada = event.target.value;
                    const respostasFiltradas = empresaSelecionada === 'todas' 
                        ? todasAsRespostas 
                        : todasAsRespostas.filter(r => r.empresa === empresaSelecionada);
                    
                    atualizarDashboard(respostasFiltradas);
                });
            }

        } else {
            console.error("Firebase ou firebaseConfig não definidos.");
            alert("Erro na configuração do Firebase. O dashboard não pode ser carregado.");
        }
    } catch (error) {
        console.error("Erro ao inicializar o Firebase ou processar dados: ", error);
        alert("Ocorreu um erro inesperado ao carregar o dashboard.");
    }

    // --- Lógica do Botão PDF (Mantida, mas pode precisar de adaptação para enviar dados filtrados) ---
    const pdfButton = document.getElementById('generate-pdf-btn');
    const pdfInstructions = document.getElementById('pdf-instructions');
    if (pdfButton) {
        pdfButton.addEventListener('click', () => {
            // Mostra as instruções primeiro
            if (pdfInstructions) {
                pdfInstructions.classList.add('show');
            }
            
            // Tenta enviar os dados atuais (filtrados) para o servidor Python local
            // A URL do servidor Python pode precisar ser ajustada
            const servidorPdfUrl = 'http://localhost:5000/gerar_pdf'; 
            const empresaSelecionada = document.getElementById('empresa-select')?.value || 'todas';
            const respostasParaPdf = empresaSelecionada === 'todas' 
                ? todasAsRespostas 
                : todasAsRespostas.filter(r => r.empresa === empresaSelecionada);
            
            const resultadosParaPdf = calcularResultadosCOPSOQ(respostasParaPdf);

            if (resultadosParaPdf) {
                fetch(servidorPdfUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        resultados: resultadosParaPdf, 
                        empresa: empresaSelecionada 
                    }),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro HTTP: ${response.status}`);
                    }
                    return response.blob(); // Espera um blob (arquivo PDF)
                })
                .then(blob => {
                    // Cria um link para download do PDF
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    // Define o nome do arquivo
                    const nomeArquivo = `Relatorio_COPSOQ_${empresaSelecionada === 'todas' ? 'Geral' : empresaSelecionada.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
                    a.download = nomeArquivo;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    if (pdfInstructions) {
                         pdfInstructions.classList.remove('show'); // Esconde instruções após sucesso
                    }
                })
                .catch(error => {
                    console.error('Erro ao gerar PDF:', error);
                    // Mantém as instruções visíveis se houver erro
                    alert('Erro ao conectar com o servidor de PDF. Verifique se ele está rodando e as instruções.');
                });
            } else {
                alert('Não há dados suficientes para gerar o PDF para a seleção atual.');
            }
        });
    }
});

