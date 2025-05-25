// firebase_analise.js - Sistema de análise e tabulação de dados para o questionário COPSOQ II versão média (87 perguntas)
// Adaptado para processar múltiplas respostas do Firebase

// Estrutura das dimensões, perguntas e cálculo de risco (mantida)
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
    "Confiança Horizontal": { perguntas: [40, 41, 42], invertida: true, descricao: "Avalia a confiança entre os colegas de trabalho" }, // Nota: 40, 41 são invertidas na escala original, mas a dimensão é positiva
    "Confiança Vertical": { perguntas: [43, 44, 45], invertida: true, descricao: "Avalia a confiança entre trabalhadores e gestão" }, // Nota: 45 é invertida na escala original, mas a dimensão é positiva
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
    // "Comportamentos Ofensivos" (73-76) e "Fatores Adicionais" (77-87) são tratados separadamente ou conforme necessidade
};

// Mapeamento de Categorias (simplificado, pode ser expandido)
const CATEGORIAS_DIMENSOES = {
    "Demandas no Trabalho": ["Exigências Quantitativas", "Ritmo de Trabalho", "Exigências Cognitivas", "Exigências Emocionais"],
    "Organização e Conteúdo": ["Influência no Trabalho", "Possibilidades de Desenvolvimento", "Previsibilidade", "Transparência do Papel Laboral", "Recompensas"],
    "Relações Sociais e Liderança": ["Apoio Social de Colegas", "Apoio Social de Superiores", "Comunidade Social no Trabalho", "Qualidade da Liderança", "Confiança Horizontal", "Confiança Vertical", "Justiça e Respeito"],
    "Interface Trabalho-Indivíduo": ["Auto-eficácia", "Significado do Trabalho", "Compromisso Face ao Local de Trabalho", "Satisfação no Trabalho", "Insegurança Laboral", "Conflito Trabalho/Família"],
    "Saúde e Bem-estar": ["Saúde Geral", "Problemas em Dormir", "Burnout", "Stress", "Sintomas Depressivos"]
};

// Função para inverter pontuação (1=5, 2=4, 3=3, 4=2, 5=1)
function inverterPontuacao(valor) {
    if (valor >= 1 && valor <= 5) {
        return 6 - valor;
    }
    return valor; // Retorna o valor original se não estiver na escala 1-5
}

// Função para determinar o nível de risco de uma dimensão (média 1-5)
function determinarRisco(media, isInvertida) {
    // Para dimensões onde ALTO é BOM (invertida = true)
    if (isInvertida) {
        if (media >= 3.6) return 'baixo'; // Bom
        if (media >= 2.6) return 'medio'; // Médio
        return 'alto'; // Ruim
    }
    // Para dimensões onde ALTO é RUIM (invertida = false)
    else {
        if (media >= 3.6) return 'alto'; // Ruim
        if (media >= 2.6) return 'medio'; // Médio
        return 'baixo'; // Bom
    }
}

// Função principal para calcular os resultados agregados
function calcularResultadosCOPSOQ(respostasArray) {
    if (!respostasArray || respostasArray.length === 0) {
        return null; // Retorna nulo se não houver respostas
    }

    const numRespostas = respostasArray.length;
    const somasPorPergunta = {};
    const contagemPorPergunta = {};

    // Inicializa somas e contagens
    for (let i = 1; i <= 87; i++) {
        somasPorPergunta[`q${i}`] = 0;
        contagemPorPergunta[`q${i}`] = 0;
    }

    // Processa cada resposta individual
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

    // Calcula a média para cada pergunta
    const mediasPorPergunta = {};
    for (let i = 1; i <= 87; i++) {
        const key = `q${i}`;
        if (contagemPorPergunta[key] > 0) {
            mediasPorPergunta[key] = somasPorPergunta[key] / contagemPorPergunta[key];
        } else {
            mediasPorPergunta[key] = null; // Ou 0, ou outra indicação de ausência de dados
        }
    }

    // Calcula a média e o risco para cada dimensão
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
                // Inverte a pontuação se a DIMENSÃO for positiva (onde alto é bom)
                if (config.invertida) {
                    mediaPergunta = inverterPontuacao(mediaPergunta);
                }
                somaMediaPerguntasDimensao += mediaPergunta;
                countPerguntasDimensao++;
            }
        });

        if (countPerguntasDimensao > 0) {
            const mediaDimensao = somaMediaPerguntasDimensao / countPerguntasDimensao;
            // O risco é determinado pela média já ajustada (invertida se necessário)
            // Portanto, usamos isInvertida = false na função determinarRisco, pois a inversão já foi feita.
            const riscoDimensao = determinarRisco(mediaDimensao, false); // Risco baseado na média (alto = ruim)

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

    // Calcula a média geral (média das médias das dimensões)
    const mediaGeral = countMediasGerais > 0 ? somaMediasGerais / countMediasGerais : null;

    // Calcula médias por categoria
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
             // Poderia adicionar outras métricas por categoria aqui
        };
    }

    // Retorna o objeto de resultados processados
    return {
        totalRespostas: numRespostas,
        mediaGeral: mediaGeral,
        dimensoes: resultadosDimensoes.filter(d => d.media !== null), // Filtra dimensões sem dados
        niveisRisco: niveisRisco,
        categorias: resultadosCategorias
        // Adicionar outros dados agregados se necessário (ex: por demografia)
    };
}

// Exemplo de como usar (será chamado pelo script do dashboard_medio.html):
// const respostasDoFirebase = [ {q1: '3', q2: '4', ...}, {q1: '2', q2: '5', ...} ];
// const resultados = calcularResultadosCOPSOQ(respostasDoFirebase);
// console.log(resultados);

