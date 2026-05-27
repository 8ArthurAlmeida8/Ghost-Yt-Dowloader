<div align="center">

<img src="static/logo.png" alt="GYD Logo" width="120"/>

# 👻 Ghost Yt Downloader

**GYD** é uma aplicação desktop open-source para download de vídeos e áudios do YouTube em altíssima qualidade — roda localmente no seu PC, sem extensões, sem anúncios, sem limite.

[![Python](https://img.shields.io/badge/Python-3.8+-4a8a3a?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.x-2e5a2e?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![yt-dlp](https://img.shields.io/badge/yt--dlp-latest-6a9a55?style=flat-square)](https://github.com/yt-dlp/yt-dlp)
[![License](https://img.shields.io/badge/license-MIT-8fb87a?style=flat-square)](LICENSE)

</div>

---

## ✨ Funcionalidades

- 🎵 **Download de Áudio** — MP3 em alta qualidade
- 🎬 **Download de Vídeo** — MP4 em até 4K
- 📋 **Suporte a Playlists** — selecione quais vídeos baixar
- 🕘 **Histórico de Downloads** — com thumbnails e links diretos
- 🌐 **Interface Web Local** — abre direto no navegador
- ⚡ **Roda em segundo plano** — processo silencioso no fundo
- 🧩 **Sem dependências online** — 100% local na sua máquina

---

## 🖥️ Demonstração

> A interface roda no seu navegador padrão logo após iniciar o `app.pyw`.

```
http://127.0.0.1:5000
```

---

## 🚀 Como instalar (Primeira vez)

> **Leia o arquivo `PASSO_A_PASSO.txt`** incluído na raiz do projeto para instruções detalhadas com todos os comandos.

### Resumo rápido:

**1. Clone o repositório**
```bash
git clone https://github.com/8ArthurAlmeida8/Ghost-Yt-Downloader.git
cd Ghost-Yt-Downloader
```

**2. Crie um ambiente virtual**
```bash
python -m venv venv
```

**3. Ative o ambiente virtual**
```bash
# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate
```

**4. Instale as dependências**
```bash
pip install -r requirements.txt
```

**5. Execute o aplicativo**
```bash
python app.pyw
```

O navegador abrirá automaticamente em `http://127.0.0.1:5000`.

---

## 📦 Dependências

| Pacote | Função |
|---|---|
| `Flask` | Servidor web local |
| `yt-dlp` | Motor de extração do YouTube |
| `flask-cors` | Comunicação entre páginas |

> ⚠️ **FFmpeg é obrigatório** para converter MP3 e mesclar vídeos em 4K.
> Baixe em: https://ffmpeg.org/download.html

---

## 📁 Estrutura do Projeto

```
Ghost-Yt-Downloader/
├── app.pyw              # Backend Flask (servidor)
├── requirements.txt     # Dependências Python
├── PASSO_A_PASSO.txt    # Guia de instalação detalhado
├── templates/
│   └── index.html       # Interface principal
├── static/
│   ├── style.css        # Design System
│   ├── script.js        # Lógica do frontend
│   └── logo.png         # Logotipo
├── downloads/           # Arquivos baixados ficam aqui
└── ffmpeg/              # FFmpeg (opcional, local)
```

---

## ⚙️ Como usar

1. **Abra o app** — execute `app.pyw` (ou `python app.pyw`)
2. **Cole o link** — qualquer vídeo ou playlist do YouTube
3. **Clique em "Buscar Mídia"**
4. **Escolha o formato** — MP3 (áudio) ou MP4 (vídeo)
5. **Clique em "Iniciar Download"**
6. Quando terminar, o arquivo aparece no histórico e na pasta `/downloads`

---

## 🛑 Encerrando o servidor

Clique no botão **"Encerrar"** no canto superior direito da interface, ou feche o terminal.

---

## ⚠️ Aviso Legal

Este projeto é destinado ao **uso pessoal e educacional**. O download de conteúdo do YouTube pode violar os [Termos de Serviço do YouTube](https://www.youtube.com/t/terms). Use com responsabilidade e respeite os direitos autorais dos criadores.

---

## 👨‍💻 Autor

Feito por **Arthur Almeida**

[![GitHub](https://img.shields.io/badge/GitHub-8ArthurAlmeida8-8fb87a?style=flat-square&logo=github)](https://github.com/8ArthurAlmeida8)
