<div align="center">

<img src="https://raw.githubusercontent.com/8ArthurAlmeida8/Ghost-Yt-Dowloader/main/assets/logo.png" alt="Ghost Yt Downloader Logo" width="160">

# 👻 Ghost Yt Downloader (Versão Linux)

**O aplicativo mais rápido e invisível para download de mídias do YouTube, agora otimizado para o pinguim! 🐧**

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Bash](https://img.shields.io/badge/Bash-Script-4EAA25?style=for-the-badge&logo=gnu-bash&logoColor=white)](https://www.gnu.org/software/bash/)
[![yt-dlp](https://img.shields.io/badge/Powered%20by-yt--dlp-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://github.com/yt-dlp/yt-dlp)

</div>

<br>

<div align="center">
  <blockquote>
    <p>Esta é a versão nativa para <strong>Linux</strong> do GYD. Ela não contém executáveis do Windows e utiliza um sistema inteligente de ambientes virtuais (venv) para não sujar o seu sistema operacional com dependências soltas.</p>
  </blockquote>
</div>

---

## 🌟 O que a Versão Linux tem de diferente?

A versão Linux herda todas as incríveis funcionalidades da versão principal (como cortes cirúrgicos de tempo, download de playlists, seleção de resolução de vídeo e qualidade de áudio), mas traz vantagens sob o capô:

- **Automação Absoluta:** O arquivo `start.sh` cuida de tudo. Ele baixa pacotes que faltam no sistema operacional (via `apt`), cria a bolha (venv) isolada e instala os pacotes do Python nela.
- **Leveza:** Não há arquivos `.exe` pesando a pasta (como o executável pré-compilado do FFmpeg do Windows). O programa usará o poderoso motor FFmpeg diretamente das bibliotecas do próprio Linux.
- **Terminal Amigável:** O servidor exibe logs no seu terminal para que você, usuário de Linux, consiga monitorar em tempo real as requisições que chegam de fundo.

---

## 🛠️ Como instalar e rodar?

1. Baixe os arquivos desta pasta `GYD (Linux)`.
2. Abra o terminal na pasta.
3. Dê permissão de execução ao script:
```bash
chmod +x start.sh
```
4. Rode o aplicativo:
```bash
./start.sh
```

**Pronto!** A mágica acontece, e a interface será aberta no seu navegador em `http://127.0.0.1:5000`. 
(Consulte o arquivo `PASSO_A_PASSO_LINUX.txt` para detalhes aprofundados do que o script faz por baixo dos panos).

---

## ✨ Recursos Base do GYD

- 🎵 **Áudio MP3 (Até 320kbps):** Com escolha de bitrates nativos do YouTube.
- 🎬 **Vídeo MP4 (Até 4K):** Liste e baixe em múltiplas resoluções.
- ✂️ **Recorte Preciso:** Use Início e Fim para baixar apenas um trecho do vídeo, pulando o download de partes inúteis usando seek ultra-rápido no próprio servidor do YT.
- 📋 **Playlists:** Selecione quais episódios ou músicas de uma playlist você quer baixar e receba em um prático arquivo `.zip`.
- 🔒 **Proteção de Servidor:** Ao fechar o servidor, você deve usar a senha (`MultiM1d1a`).

---

## ⚠️ Isenção de Responsabilidade

Este projeto foi construído apenas para **fins educacionais e uso pessoal e privado**. O download de materiais com direitos autorais pode infringir as políticas do [YouTube](https://www.youtube.com/t/terms) e leis locais. O desenvolvedor **não** se responsabiliza pelo mau uso da ferramenta.

---

<div align="center">
  <b>Desenvolvido com 💚 por Arthur Almeida</b><br>
  <a href="https://github.com/8ArthurAlmeida8">github.com/8ArthurAlmeida8</a>
</div>