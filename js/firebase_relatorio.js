// firebase_relatorio.js - Script para buscar dados do Firebase, processar e popular o relatório detalhado
// Adaptado para filtrar por empresa e atualizado para 87 perguntas

document.addEventListener("DOMContentLoaded", function() {
    // --- Configuração e Lógica de Cálculo (Atualizada para 87 perguntas) ---
    const DIMENSOES_CONFIG = {
        "Exigências Quantitativas": { perguntas: [1, 2, 3], invertida: false, descricao: "Relaciona-se com a carga de trabalho e sua distribuição temporal" },
        "Ritmo de Trabalho": { perguntas: [4], invertida: false, descricao: "Relaciona-se com a velocidade e intensidade do trabalho" },
        "Exigências Cognitivas": { perguntas: [5, 6, 7], invertida: false, descricao: "Relaciona-se com as demandas cognitivas do trabalho" },
        "Exigências Emocionais": { perguntas: [8], invertida: false, descricao: "Relaciona-se com o envolvimento emocional no trabalho" },
        "Influência no Trabalho": { perguntas: [9, 10, 11, 12], invertida: false, descricao: "Avalia o grau de influência que o trabalhador tem sobre o seu próprio trabalho" },
        "Possibilidades de Desenvolvimento": { perguntas: [13, 14, 15], invertida: false, descricao: "Avalia as oportunidades de desenvolvimento de habilidades no trabalho" },
        "Previsibilidade": { perguntas: [16, 17], invertida: false, descricao: "Avalia o grau de informação sobre mudanças e decisões no trabalho" },
        "Transparência do Papel Laboral": { perguntas: [18, 19, 20], invertida: false, descricao: "Avalia a clareza dos objetivos e responsabilidades no trabalho" },
        "Recompensas": { perguntas: [21, 22, 23], invertida: false, descricao: "Avalia o reconhecimento e valorização no trabalho" },
        "Conflitos Laborais": { perguntas: [24, 25, 26], invertida: true, descricao: "Avalia a existência de demandas contraditórias no trabalho" },
        "Apoio Social de Colegas": { perguntas: [27, 28, 29], invertida: false, descricao: "Avalia o apoio recebido dos colegas de trabalho" },
        "Apoio Social de Superiores": { perguntas: [30, 31, 32], invertida: false, descricao: "Avalia o apoio recebido dos superiores hierárquicos" },
        "Comunidade Social no Trabalho": { perguntas: [33, 34, 35], invertida: false, descricao: "Avalia o sentimento de pertença e cooperação no ambiente de trabalho" },
        "Qualidade da Liderança": { perguntas: [36, 37, 38, 39], invertida: false, descricao: "Avalia a percepção sobre a qualidade da gestão" },
        "Confiança Horizontal": { perguntas: [40, 41, 42], invertida: true, descricao: "Avalia a confiança entre os colegas de trabalho" },
        "Confiança Vertical": { perguntas: [43, 44, 45, 46], invertida: false, descricao: "Avalia a confiança entre trabalhadores e gestão" },
        "Justiça e Respeito": { perguntas: [47, 48, 49, 50], invertida: false, descricao: "Avalia a percepção de justiça e respeito no ambiente de trabalho" },
        "Auto-eficácia": { perguntas: [51, 52], invertida: false, descricao: "Avalia a percepção de capacidade para resolver problemas" },
        "Significado do Trabalho": { perguntas: [53, 54, 55], invertida: false, descricao: "Avalia o quanto o trabalho tem significado e importância para o indivíduo" },
        "Compromisso Face ao Local de Trabalho": { perguntas: [56, 57], invertida: false, descricao: "Avalia o grau de envolvimento com o local de trabalho" },
        "Satisfação no Trabalho": { perguntas: [58, 59, 60, 61], invertida: false, descricao: "Avalia o grau de satisfação com diversos aspectos do trabalho" },
        "Insegurança Laboral": { perguntas: [62, 63, 64, 65], invertida: true, descricao: "Avalia o grau de insegurança em relação ao emprego" },
        "Saúde Geral": { perguntas: [66], invertida: false, descricao: "Avalia a percepção do estado de saúde geral" },
        "Conflitos Trabalho-Família": { perguntas: [67, 68, 69], invertida: true, descricao: "Avalia o impacto do trabalho na vida familiar" },
        "Problemas em Dormir": { perguntas: [70, 71, 72, 73], invertida: true, descricao: "Avalia a qualidade do sono" },
        "Burnout": { perguntas: [74, 75, 76, 77], invertida: true, descricao: "Avalia sintomas de esgotamento físico e emocional" },
        "Estresse": { perguntas: [78, 79, 80, 81], invertida: true, descricao: "Avalia sintomas de estresse" },
        "Comportamentos Ofensivos": { perguntas: [82, 83, 84, 85, 86, 87], invertida: true, descricao: "Avalia a exposição a comportamentos ofensivos no trabalho" }
    };

    const CATEGORIAS_DIMENSOES = {
        "Demandas no Trabalho": ["Exigências Quantitativas", "Ritmo de Trabalho", "Exigências Cognitivas", "Exigências Emocionais"],
        "Organização e Conteúdo": ["Influência no Trabalho", "Possibilidades de Desenvolvimento", "Previsibilidade", "Transparência do Papel Laboral", "Recompensas"],
        "Relações Sociais e Liderança": ["Apoio Social de Colegas", "Apoio Social de Superiores", "Comunidade Social no Trabalho", "Qualidade da Liderança", "Confiança Horizontal", "Confiança Vertical", "Justiça e Respeito"],
        "Interface Trabalho-Indivíduo": ["Auto-eficácia", "Significado do Trabalho", "Compromisso Face ao Local de Trabalho", "Satisfação no Trabalho", "Insegurança Laboral", "Conflitos Trabalho-Família"],
        "Saúde e Bem-estar": ["Saúde Geral", "Problemas em Dormir", "Burnout", "Estresse", "Comportamentos Ofensivos"]
    };

    function inverterPontuacao(valor) {
        if (valor >= 1 && valor <= 5) return 6 - valor;
        return valor;
    }

    function determinarRisco(media, isInvertida) {
        if (isInvertida) {
            if (media <= 2.33) return { nivel: "baixo", classe: "baixo-risco" };
            if (media <= 3.66) return { nivel: "médio", classe: "medio-risco" };
            return { nivel: "alto", classe: "alto-risco" };
        } else {
            if (media >= 3.66) return { nivel: "baixo", classe: "baixo-risco" };
            if (media >= 2.33) return { nivel: "médio", classe: "medio-risco" };
            return { nivel: "alto", classe: "alto-risco" };
        }
    }

    // --- Inicialização do Firebase e Busca de Dados ---
    try {
        // Verificar se o Firebase já foi inicializado
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        const database = firebase.database();
        const respostasRef = database.ref('respostas');
        
        console.log('Firebase inicializado com sucesso para relatório. Buscando dados...');
        
        // Elementos do DOM
        const empresaSelect = document.getElementById('empresa-select');
        const dataRelatorioElement = document.getElementById('data-relatorio');
        const totalRespostasElement = document.getElementById('total-respostas');
        const resultadosContainer = document.getElementById('resultados-container');
        const loadingElement = document.getElementById('loading');
        
        // Atualizar data do relatório
        const dataAtual = new Date();
        dataRelatorioElement.textContent = dataAtual.toLocaleDateString('pt-BR');
        
        // Função para buscar e processar dados
        function buscarDados(empresaFiltro = 'todas') {
            loadingElement.style.display = 'block';
            resultadosContainer.style.display = 'none';
            
            respostasRef.once('value')
                .then(snapshot => {
                    const respostas = snapshot.val();
                    
                    if (!respostas) {
                        console.log('Nenhuma resposta encontrada no Firebase.');
                        loadingElement.style.display = 'none';
                        resultadosContainer.innerHTML = '<div class="alert alert-warning">Nenhuma resposta encontrada.</div>';
                        resultadosContainer.style.display = 'block';
                        return;
                    }
                    
                    console.log(`Total de respostas encontradas: ${Object.keys(respostas).length}`);
                    
                    // Filtrar por empresa se necessário
                    let respostasFiltradas = [];
                    let empresasUnicas = new Set();
                    
                    Object.keys(respostas).forEach(key => {
                        const resposta = respostas[key];
                        if (resposta.empresa) {
                            empresasUnicas.add(resposta.empresa);
                        }
                        
                        if (empresaFiltro === 'todas' || resposta.empresa === empresaFiltro) {
                            respostasFiltradas.push(resposta);
                        }
                    });
                    
                    // Atualizar select de empresas
                    if (!empresaSelect.hasChildNodes()) {
                        const todasOption = document.createElement('option');
                        todasOption.value = 'todas';
                        todasOption.textContent = 'Todas as Empresas';
                        empresaSelect.appendChild(todasOption);
                        
                        Array.from(empresasUnicas).sort().forEach(empresa => {
                            const option = document.createElement('option');
                            option.value = empresa;
                            option.textContent = empresa;
                            empresaSelect.appendChild(option);
                        });
                        
                        empresaSelect.value = empresaFiltro;
                    }
                    
                    // Processar dados filtrados
                    processarDados(respostasFiltradas);
                })
                .catch(error => {
                    console.error('Erro ao buscar dados:', error);
                    loadingElement.style.display = 'none';
                    resultadosContainer.innerHTML = `<div class="alert alert-danger">Erro ao buscar dados: ${error.message}</div>`;
                    resultadosContainer.style.display = 'block';
                });
        }
        
        // Função para processar dados e gerar relatório
        function processarDados(respostas) {
            console.log(`Processando ${respostas.length} respostas...`);
            totalRespostasElement.textContent = respostas.length;
            
            // Calcular médias por dimensão
            const resultadosDimensoes = {};
            
            Object.keys(DIMENSOES_CONFIG).forEach(dimensao => {
                const config = DIMENSOES_CONFIG[dimensao];
                let somaValores = 0;
                let contRespostas = 0;
                
                respostas.forEach(resposta => {
                    config.perguntas.forEach(numPergunta => {
                        const valorResposta = parseInt(resposta[`q${numPergunta}`]);
                        if (!isNaN(valorResposta)) {
                            const valorAjustado = config.invertida ? inverterPontuacao(valorResposta) : valorResposta;
                            somaValores += valorAjustado;
                            contRespostas++;
                        }
                    });
                });
                
                const media = contRespostas > 0 ? somaValores / contRespostas : 0;
                const risco = determinarRisco(media, config.invertida);
                
                resultadosDimensoes[dimensao] = {
                    media: media.toFixed(2),
                    risco: risco.nivel,
                    classe: risco.classe,
                    descricao: config.descricao
                };
            });
            
            // Gerar HTML do relatório
            let htmlRelatorio = '';
            
            // Resumo geral
            htmlRelatorio += `
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Resumo Geral</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Total de Respostas:</strong> ${respostas.length}</p>
                        <p><strong>Data do Relatório:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
            `;
            
            // Resultados por categoria
            Object.keys(CATEGORIAS_DIMENSOES).forEach(categoria => {
                htmlRelatorio += `
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">${categoria}</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Dimensão</th>
                                            <th>Média</th>
                                            <th>Nível de Risco</th>
                                            <th>Descrição</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                `;
                
                CATEGORIAS_DIMENSOES[categoria].forEach(dimensao => {
                    const resultado = resultadosDimensoes[dimensao];
                    if (resultado) {
                        htmlRelatorio += `
                            <tr>
                                <td>${dimensao}</td>
                                <td>${resultado.media}</td>
                                <td><span class="badge ${resultado.classe}">${resultado.risco}</span></td>
                                <td>${resultado.descricao}</td>
                            </tr>
                        `;
                    }
                });
                
                htmlRelatorio += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // Recomendações baseadas nos resultados
            htmlRelatorio += `
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">Recomendações</h5>
                    </div>
                    <div class="card-body">
                        <p>Com base nos resultados obtidos, recomenda-se:</p>
                        <ul>
            `;
            
            // Gerar recomendações dinâmicas baseadas nos resultados
            const dimensoesAltoRisco = Object.keys(resultadosDimensoes).filter(dim => 
                resultadosDimensoes[dim].risco === "alto"
            );
            
            if (dimensoesAltoRisco.length > 0) {
                htmlRelatorio += `<li><strong>Atenção prioritária</strong> às dimensões com alto risco: ${dimensoesAltoRisco.join(", ")}.</li>`;
                
                dimensoesAltoRisco.forEach(dim => {
                    if (dim === "Exigências Quantitativas" || dim === "Ritmo de Trabalho") {
                        htmlRelatorio += `<li>Revisar a distribuição de carga de trabalho e prazos para reduzir pressão excessiva.</li>`;
                    } else if (dim === "Conflitos Laborais") {
                        htmlRelatorio += `<li>Implementar processos de mediação de conflitos e melhorar a comunicação interna.</li>`;
                    } else if (dim === "Insegurança Laboral") {
                        htmlRelatorio += `<li>Melhorar a comunicação sobre estabilidade e perspectivas futuras da organização.</li>`;
                    } else if (dim.includes("Estresse") || dim.includes("Burnout")) {
                        htmlRelatorio += `<li>Desenvolver programas de bem-estar e gerenciamento de estresse para os colaboradores.</li>`;
                    }
                });
            } else {
                htmlRelatorio += `<li>Manter as boas práticas atuais, pois não foram identificadas dimensões de alto risco.</li>`;
            }
            
            const dimensoesMedioRisco = Object.keys(resultadosDimensoes).filter(dim => 
                resultadosDimensoes[dim].risco === "médio"
            );
            
            if (dimensoesMedioRisco.length > 0) {
                htmlRelatorio += `<li>Monitorar e implementar melhorias graduais nas dimensões de médio risco.</li>`;
            }
            
            htmlRelatorio += `
                            <li>Realizar nova avaliação em 6-12 meses para acompanhar a evolução dos indicadores.</li>
                            <li>Envolver os colaboradores na discussão dos resultados e na elaboração de planos de ação.</li>
                        </ul>
                    </div>
                </div>
            `;
            
            // Exibir relatório
            loadingElement.style.display = 'none';
            resultadosContainer.innerHTML = htmlRelatorio;
            resultadosContainer.style.display = 'block';
        }
        
        // Evento para mudança de empresa selecionada
        if (empresaSelect) {
            empresaSelect.addEventListener('change', function() {
                buscarDados(this.value);
            });
        }
        
        // Iniciar busca de dados
        buscarDados('todas');
        
    } catch (error) {
        console.error('Erro ao inicializar Firebase:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('resultados-container').innerHTML = `
            <div class="alert alert-danger">
                Erro ao inicializar o sistema: ${error.message}
            </div>
        `;
        document.getElementById('resultados-container').style.display = 'block';
    }
});
