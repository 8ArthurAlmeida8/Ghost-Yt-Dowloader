#!/bin/bash
# Script de inicialização do GYD para Linux

echo "=================================================="
echo "    Iniciando Ghost YT Downloader (GYD)          "
echo "=================================================="

# Verifica se o ffmpeg está instalado
if ! command -v ffmpeg &> /dev/null
then
    echo "[!] FFmpeg não encontrado!"
    echo "O FFmpeg é necessário para mesclar vídeos em 4K e converter áudios."
    echo "Tentando instalar automaticamente via apt..."
    if command -v apt &> /dev/null; then
        sudo apt update && sudo apt install -y ffmpeg
    else
        echo "[ERRO] Não foi possível instalar o FFmpeg automaticamente."
        echo "Por favor, instale o ffmpeg usando o gerenciador de pacotes da sua distribuição."
        echo "Exemplo (Arch): sudo pacman -S ffmpeg"
        echo "Exemplo (Fedora): sudo dnf install ffmpeg"
        exit 1
    fi
fi

# Verifica se o python3 está instalado
if ! command -v python3 &> /dev/null
then
    echo "[ERRO] Python3 não encontrado! Por favor, instale o python3."
    exit 1
fi

# Cria o ambiente virtual se não existir
if [ ! -d "venv" ]; then
    echo "[+] Criando ambiente virtual isolado..."
    
    # Verifica se python3-venv está instalado (necessário no Ubuntu/Debian)
    if ! python3 -m venv venv &> /dev/null; then
        echo "[!] O pacote python3-venv não foi encontrado."
        echo "Tentando instalar automaticamente..."
        if command -v apt &> /dev/null; then
            sudo apt install -y python3-venv
            python3 -m venv venv
        else
            echo "[ERRO] Instale o python3-venv manualmente."
            exit 1
        fi
    fi
fi

# Ativa o ambiente virtual
source venv/bin/activate

# Instala as dependências
echo "[+] Atualizando dependências..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1

echo "[+] Iniciando o Servidor GYD..."
# O app.py já tentará abrir o navegador, rodamos no terminal para manter logs.
python3 app.py
