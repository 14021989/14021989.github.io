#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para criar um servidor local simples que gera relatórios PDF a partir do dashboard
"""

import os
import json
import tempfile
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs
import webbrowser
import base64

# Importar o módulo de geração de PDF
from gerar_pdf import gerar_pdf

# Diretório base do projeto
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class PDFRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Manipula requisições GET"""
        if self.path == '/':
            # Redirecionar para o dashboard
            self.send_response(302)
            self.send_header('Location', '/dashboard.html')
            self.end_headers()
            return
        
        # Servir arquivos estáticos
        try:
            file_path = os.path.join(BASE_DIR, self.path.lstrip('/'))
            
            # Verificar se o arquivo existe
            if not os.path.exists(file_path) or os.path.isdir(file_path):
                self.send_error(404, "Arquivo não encontrado")
                return
            
            # Determinar o tipo de conteúdo
            content_type = 'text/html'
            if file_path.endswith('.css'):
                content_type = 'text/css'
            elif file_path.endswith('.js'):
                content_type = 'application/javascript'
            elif file_path.endswith('.json'):
                content_type = 'application/json'
            elif file_path.endswith('.png'):
                content_type = 'image/png'
            elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
                content_type = 'image/jpeg'
            elif file_path.endswith('.pdf'):
                content_type = 'application/pdf'
            
            # Enviar o arquivo
            with open(file_path, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            
        except Exception as e:
            self.send_error(500, str(e))
    
    def do_POST(self):
        """Manipula requisições POST"""
        if self.path == '/gerar_pdf':
            try:
                # Obter o tamanho do conteúdo
                content_length = int(self.headers['Content-Length'])
                
                # Ler os dados do corpo da requisição
                post_data = self.rfile.read(content_length).decode('utf-8')
                
                # Processar os dados do formulário
                form_data = parse_qs(post_data)
                
                # Se os dados foram enviados como JSON diretamente
                if 'dados' in form_data:
                    dados_json = form_data['dados'][0]
                    dados = json.loads(dados_json)
                else:
                    # Tentar extrair JSON do corpo da requisição
                    try:
                        dados = json.loads(post_data)
                    except:
                        self.send_error(400, "Dados inválidos")
                        return
                
                # Criar arquivo temporário para o PDF
                with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
                    pdf_path = tmp.name
                
                # Gerar o PDF
                if gerar_pdf(dados, pdf_path):
                    # Ler o arquivo PDF gerado
                    with open(pdf_path, 'rb') as f:
                        pdf_content = f.read()
                    
                    # Remover o arquivo temporário
                    os.unlink(pdf_path)
                    
                    # Enviar o PDF como resposta
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/pdf')
                    self.send_header('Content-Disposition', 'attachment; filename="relatorio_copsoq.pdf"')
                    self.send_header('Content-Length', str(len(pdf_content)))
                    self.end_headers()
                    self.wfile.write(pdf_content)
                else:
                    self.send_error(500, "Erro ao gerar PDF")
            
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404, "Endpoint não encontrado")

def run_server(port=8000):
    """Inicia o servidor HTTP"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, PDFRequestHandler)
    print(f"Servidor iniciado na porta {port}")
    print(f"Acesse http://localhost:{port}/dashboard.html no seu navegador")
    
    # Abrir o navegador automaticamente
    webbrowser.open(f"http://localhost:{port}/dashboard.html")
    
    # Iniciar o servidor
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
