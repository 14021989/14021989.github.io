#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Servidor para geração de relatórios em PDF do COPSOQ II Versão Média (87 perguntas sequenciais)
Este script inicia um servidor Flask que recebe dados do dashboard
e gera relatórios em PDF utilizando WeasyPrint.
"""

import os
import json
import base64
from datetime import datetime
from flask import Flask, request, send_file, render_template, jsonify
from weasyprint import HTML, CSS
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Habilitar CORS para permitir requisições do frontend

# Diretório para salvar os PDFs gerados
OUTPUT_DIR = 'pdfs'
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

@app.route('/')
def index():
    """Página inicial do servidor"""
    return """
    <html>
    <head>
        <title>Servidor de Geração de PDF - COPSOQ II Versão Média (87 perguntas)</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #0d6efd; }
            .container { max-width: 800px; margin: 0 auto; }
            .info { background-color: #e7f3ff; padding: 20px; border-radius: 5px; }
            .success { color: #43a047; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Servidor de Geração de PDF - COPSOQ II</h1>
            <div class="info">
                <p>Este servidor está rodando corretamente e pronto para gerar relatórios em PDF.</p>
                <p>O servidor está escutando na porta 8000.</p>
                <p class="success">Status: Ativo</p>
                <p>Para gerar um relatório, acesse o dashboard e clique no botão "Gerar Relatório PDF".</p>
            </div>
            <p><small>Servidor iniciado em: {}</small></p>
        </div>
    </body>
    </html>
    """.format(datetime.now().strftime("%d/%m/%Y %H:%M:%S"))

@app.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    """
    Endpoint para gerar PDF a partir dos dados enviados pelo dashboard
    
    Espera receber um JSON com os dados do relatório:
    {
        "titulo": "Relatório de Fatores Psicossociais",
        "data": "22/05/2025",
        "totalParticipantes": 42,
        "mediaGeral": 3.7,
        "dimensoes": [...],
        "categorias": {...},
        "niveisRisco": {...},
        "recomendacoes": {...}
    }
    """
    try:
        # Obter dados do request
        data = request.json
        
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        # Nome do arquivo baseado na data e hora atual
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"relatorio_copsoq_{timestamp}.pdf"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        # Gerar HTML para o PDF
        html_content = render_template_from_data(data)
        
        # Gerar PDF usando WeasyPrint
        HTML(string=html_content).write_pdf(
            filepath,
            stylesheets=[
                CSS(string='''
                    @page {
                        size: A4;
                        margin: 2cm;
                    }
                    body {
                        font-family: "Segoe UI", Arial, sans-serif;
                        line-height: 1.5;
                        color: #333;
                    }
                    h1, h2, h3, h4 {
                        color: #0d6efd;
                        margin-top: 1.5em;
                        margin-bottom: 0.5em;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 2em;
                    }
                    .section {
                        margin-bottom: 2em;
                        page-break-inside: avoid;
                    }
                    .info-box {
                        background-color: #f8f9fa;
                        padding: 1em;
                        border-radius: 5px;
                        margin-bottom: 1em;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 1em;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    .risk-high {
                        background-color: #ffebee;
                    }
                    .risk-medium {
                        background-color: #fff8e1;
                    }
                    .risk-low {
                        background-color: #e8f5e9;
                    }
                    .recommendation {
                        background-color: #e3f2fd;
                        padding: 1em;
                        border-radius: 5px;
                        margin-bottom: 1em;
                    }
                    .footer {
                        text-align: center;
                        font-size: 0.8em;
                        margin-top: 2em;
                        color: #666;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                ''')
            ]
        )
        
        # Retornar o arquivo PDF
        return send_file(filepath, as_attachment=True)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def render_template_from_data(data):
    """
    Renderiza o template HTML para o PDF com base nos dados fornecidos
    
    Args:
        data (dict): Dados do relatório
        
    Returns:
        str: HTML renderizado
    """
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>{data.get('titulo', 'Relatório de Fatores Psicossociais')}</title>
    </head>
    <body>
        <div class="header">
            <h1>{data.get('titulo', 'Relatório de Fatores Psicossociais')}</h1>
            <p>Avaliação COPSOQ II - Versão Média (87 perguntas)</p>
        </div>
        
        <div class="section">
            <div class="info-box">
                <h2>Informações do Relatório</h2>
                <p><strong>Instrumento:</strong> Copenhagen Psychosocial Questionnaire II (COPSOQ II)</p>
                <p><strong>Versão:</strong> Média - 28 dimensões e 87 perguntas</p>
                <p><strong>Período de Coleta:</strong> 2025</p>
                <p><strong>Total de Participantes:</strong> {data.get('totalParticipantes', 'Indeterminado')}</p>
                <p><strong>Data de Geração do Relatório:</strong> {data.get('data', datetime.now().strftime('%d/%m/%Y'))}</p>
                <p><strong>Conformidade:</strong> NR-17 (Ergonomia) e NR-1 (Disposições Gerais)</p>
            </div>
        </div>
        
        <div class="section">
            <h2>Resumo Estatístico</h2>
            <p><strong>Total de Respostas:</strong> {data.get('totalRespostas', 0)}</p>
            <p><strong>Média Geral:</strong> {data.get('mediaGeral', 0)}</p>
            
            <p>Os resultados indicam que {round((data.get('niveisRisco', {}).get('alto', 0) / sum(data.get('niveisRisco', {}).values())) * 100) if sum(data.get('niveisRisco', {}).values()) > 0 else 0}% das dimensões avaliadas apresentam alto risco psicossocial, {round((data.get('niveisRisco', {}).get('medio', 0) / sum(data.get('niveisRisco', {}).values())) * 100) if sum(data.get('niveisRisco', {}).values()) > 0 else 0}% apresentam risco médio e {round((data.get('niveisRisco', {}).get('baixo', 0) / sum(data.get('niveisRisco', {}).values())) * 100) if sum(data.get('niveisRisco', {}).values()) > 0 else 0}% apresentam baixo risco.</p>
        </div>
    """
    
    # Adicionar tabela de resultados
    html += """
        <div class="section page-break">
            <h2>Resultados Detalhados</h2>
            <table>
                <thead>
                    <tr>
                        <th>Dimensão</th>
                        <th>Média</th>
                        <th>Nível de Risco</th>
                        <th>Descrição</th>
                    </tr>
                </thead>
                <tbody>
    """
    
    # Adicionar linhas da tabela
    dimensoes = data.get('dimensoes', [])
    for dimensao in dimensoes:
        risco_class = ""
        if dimensao.get('risco') == 'alto':
            risco_class = "risk-high"
        elif dimensao.get('risco') == 'medio':
            risco_class = "risk-medium"
        else:
            risco_class = "risk-low"
            
        html += f"""
                    <tr>
                        <td>{dimensao.get('titulo', '')}</td>
                        <td>{dimensao.get('media', 0):.2f}</td>
                        <td class="{risco_class}">{dimensao.get('risco', '').capitalize()}</td>
                        <td>{dimensao.get('descricao', '')}</td>
                    </tr>
        """
    
    html += """
                </tbody>
            </table>
        </div>
    """
    
    # Adicionar dimensões críticas
    html += """
        <div class="section page-break">
            <h2>Dimensões Críticas</h2>
            <p>As dimensões a seguir apresentaram os níveis mais elevados de risco psicossocial e requerem atenção prioritária:</p>
    """
    
    dimensoes_criticas = [d for d in dimensoes if d.get('risco') == 'alto']
    if dimensoes_criticas:
        for dimensao in dimensoes_criticas:
            html += f"""
                <div class="info-box risk-high">
                    <h3>{dimensao.get('titulo', '')}</h3>
                    <p><strong>Média:</strong> {dimensao.get('media', 0):.2f}</p>
                    <p>{dimensao.get('descricao', '')}</p>
                </div>
            """
    else:
        html += """
            <p>Nenhuma dimensão crítica identificada.</p>
        """
    
    # Adicionar recomendações
    html += """
        <div class="section page-break">
            <h2>Recomendações</h2>
    """
    
    # Recomendações prioritárias
    html += """
            <h3>Ações Prioritárias</h3>
            <p>Estas ações devem ser implementadas no curto prazo (1-3 meses) para mitigar os riscos psicossociais mais críticos:</p>
    """
    
    recomendacoes = data.get('recomendacoes', {})
    prioritarias = recomendacoes.get('prioritarias', [])
    
    if prioritarias:
        for rec in prioritarias:
            html += f"""
                <div class="recommendation">
                    <h4>{rec.get('dimensao', '')}</h4>
                    <p>{rec.get('descricao', '')}</p>
                    <ul>
            """
            
            for acao in rec.get('acoes', []):
                html += f"""
                        <li>{acao}</li>
                """
                
            html += """
                    </ul>
                </div>
            """
    else:
        html += """
            <p>Nenhuma recomendação prioritária identificada.</p>
        """
    
    # Recomendações secundárias
    html += """
            <h3>Ações Secundárias</h3>
            <p>Estas ações devem ser implementadas no médio prazo (3-6 meses) para melhorar as dimensões com risco moderado:</p>
    """
    
    secundarias = recomendacoes.get('secundarias', [])
    
    if secundarias:
        for rec in secundarias:
            html += f"""
                <div class="recommendation">
                    <h4>{rec.get('dimensao', '')}</h4>
                    <p>{rec.get('descricao', '')}</p>
                    <ul>
            """
            
            for acao in rec.get('acoes', []):
                html += f"""
                        <li>{acao}</li>
                """
                
            html += """
                    </ul>
                </div>
            """
    else:
        html += """
            <p>Nenhuma recomendação secundária identificada.</p>
        """
    
    # Ações de manutenção
    html += """
            <h3>Ações de Manutenção</h3>
            <p>Estas ações devem ser mantidas para preservar os pontos fortes identificados:</p>
    """
    
    manutencao = recomendacoes.get('manutencao', [])
    
    if manutencao:
        for rec in manutencao:
            html += f"""
                <div class="recommendation">
                    <h4>{rec.get('dimensao', '')}</h4>
                    <p>{rec.get('descricao', '')}</p>
                    <ul>
            """
            
            for acao in rec.get('acoes', []):
                html += f"""
                        <li>{acao}</li>
                """
                
            html += """
                    </ul>
                </div>
            """
    else:
        html += """
            <p>Nenhuma ação de manutenção identificada.</p>
        """
    
    html += """
        </div>
    """
    
    # Adicionar metodologia
    html += """
        <div class="section page-break">
            <h2>Metodologia</h2>
            <p>A avaliação dos fatores psicossociais foi realizada utilizando o Copenhagen Psychosocial Questionnaire II (COPSOQ II) em sua versão média, que compreende 28 dimensões e 87 perguntas numeradas sequencialmente. Este instrumento foi desenvolvido pelo National Research Centre for the Working Environment da Dinamarca e é amplamente utilizado e validado internacionalmente.</p>
            
            <p>O questionário foi aplicado online, com validação de e-mail para garantir a confidencialidade e a integridade dos dados. As respostas foram analisadas utilizando métodos estatísticos para calcular médias por dimensão e classificar os níveis de risco.</p>
            
            <p>Os níveis de risco foram classificados em três categorias:</p>
            <ul>
                <li><strong>Risco Baixo:</strong> Situação favorável, que deve ser mantida e potencializada.</li>
                <li><strong>Risco Médio:</strong> Situação intermediária, que requer atenção e monitoramento.</li>
                <li><strong>Risco Alto:</strong> Situação desfavorável, que requer intervenção prioritária.</li>
            </ul>
            
            <p>A classificação dos níveis de risco foi baseada nos tercis da população de referência, conforme estabelecido no manual do COPSOQ II versão portuguesa.</p>
        </div>
        
        <div class="section">
            <h2>Conclusão</h2>
            <p>A avaliação de fatores psicossociais utilizando o COPSOQ II versão média (87 perguntas) permitiu identificar os principais riscos psicossociais presentes no ambiente de trabalho, bem como os pontos fortes da organização.</p>
            
            <p>A implementação das recomendações apresentadas neste relatório contribuirá para a mitigação dos riscos psicossociais identificados e para a promoção de um ambiente de trabalho mais saudável e produtivo, em conformidade com as normas regulamentadoras NR-17 e NR-1.</p>
            
            <p>Recomenda-se a realização de nova avaliação após a implementação das ações recomendadas, para verificar a eficácia das intervenções e identificar novas oportunidades de melhoria.</p>
        </div>
        
        <div class="footer">
            <p>Relatório de Avaliação de Fatores Psicossociais no Trabalho - COPSOQ II (Versão Média)</p>
            <p>Baseado em: Kristensen, T. (2001) | Tradução e adaptação: Silva, C. et al. (2011)</p>
            <p>Em conformidade com a NR-17 (Ergonomia) e NR-1</p>
            <p>Período de Coleta: 2025 | Total de Participantes: Indeterminado</p>
        </div>
    </body>
    </html>
    """
    
    return html

@app.route('/dashboard_medio.html')
def serve_dashboard():
    """Serve o arquivo dashboard_medio.html"""
    return send_file('../dashboard_medio.html')

@app.route('/js/<path:path>')
def serve_js(path):
    """Serve arquivos JavaScript"""
    return send_file(f'../js/{path}')

if __name__ == '__main__':
    print("Iniciando servidor de geração de PDF na porta 8000...")
    print("Acesse http://localhost:8000/ para verificar o status")
    print("Para gerar um relatório, acesse o dashboard e clique no botão 'Gerar Relatório PDF'")
    # Abrir o navegador automaticamente
    import webbrowser
    webbrowser.open('http://localhost:8000/')
    # Iniciar o servidor
    app.run(host='0.0.0.0', port=8000, debug=True)
