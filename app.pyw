import sys

try:
    import os
    import uuid
    import shutil
    import zipfile
    import json
    from datetime import datetime
    from flask import Flask, request, jsonify, render_template, send_file
    import yt_dlp
    import threading
except ImportError as e:
    print("\n[ERRO FATAL] Dependencias ausentes!")
    print(f"Detalhe do erro: {e}")
    print("\nO programa precisa de bibliotecas que nao estao instaladas neste computador.")
    print("Abra o terminal na pasta do projeto e instale-as usando o comando:")
    print("pip install -r requirements.txt")
    print("\n")
    input("Pressione Enter para fechar esta janela...")
    sys.exit(1)

app = Flask(__name__)

DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'downloads')
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

HISTORICO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.historico')
HISTORICO_FILE = os.path.join(HISTORICO_DIR, 'historico.json')
os.makedirs(HISTORICO_DIR, exist_ok=True)
if not os.path.exists(HISTORICO_FILE):
    with open(HISTORICO_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)

# Store download progress
download_progress = {}

class MyLogger(object):
    def __init__(self, task_id):
        self.task_id = task_id
    def debug(self, msg):
        pass
    def warning(self, msg):
        pass
    def error(self, msg):
        pass

def progress_hook(d, task_id):
    if d['status'] == 'downloading':
        percent = d.get('_percent_str', '0.0%')
        for escape in ['\x1b[0;94m', '\x1b[0m', '\x1b[0;32m', '\x1b[0;33m']:
            percent = percent.replace(escape, '')
        
        info = d.get('info_dict', {})
        playlist_index = info.get('playlist_index')
        playlist_count = info.get('playlist_count')
        
        status_text = 'downloading'
        if playlist_index and playlist_count:
            status_text = f'Baixando {playlist_index} de {playlist_count}'
            
        download_progress[task_id] = {
            'status': status_text, 
            'percent': percent.strip()
        }
    elif d['status'] == 'finished':
        info = d.get('info_dict', {})
        playlist_index = info.get('playlist_index')
        playlist_count = info.get('playlist_count')
        
        if playlist_index and playlist_count:
            status_text = f'Processando {playlist_index} de {playlist_count}...'
        else:
            status_text = 'Processando arquivo final (Isso pode levar alguns minutos em vídeos longos/4K)...'
            
        download_progress[task_id] = {'status': status_text, 'percent': '100%'}

def save_to_history(title, format_type, is_playlist, file_size_bytes=0, thumbnail='', source_url=''):
    """Registra um download concluido no historico local."""
    try:
        with open(HISTORICO_FILE, 'r', encoding='utf-8') as f:
            history = json.load(f)
    except Exception:
        history = []

    entry = {
        'id': str(uuid.uuid4()),
        'title': title,
        'format': format_type.upper(),
        'is_playlist': is_playlist,
        'size_bytes': file_size_bytes,
        'thumbnail': thumbnail,
        'source_url': source_url,
        'downloaded_at': datetime.now().strftime('%d/%m/%Y %H:%M')
    }
    history.insert(0, entry)  # mais recente primeiro
    # Manter apenas os ultimos 500 registros
    history = history[:500]

    with open(HISTORICO_FILE, 'w', encoding='utf-8') as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

def get_thumbnail(info):
    """Extrai a melhor URL de thumbnail disponivel."""
    thumb = info.get('thumbnail') or ''
    # Para playlists, tenta pegar o thumbnail do primeiro video disponivel
    if not thumb and 'entries' in info:
        for entry in (info.get('entries') or []):
            if entry and entry.get('thumbnail'):
                thumb = entry['thumbnail']
                break
            if entry and entry.get('id'):
                thumb = f"https://img.youtube.com/vi/{entry['id']}/hqdefault.jpg"
                break
    # Fallback para URL de video unico via ID
    if not thumb and info.get('id'):
        thumb = f"https://img.youtube.com/vi/{info['id']}/hqdefault.jpg"
    return thumb

def download_media_task(url, task_id, selected_indices=None, format_type='mp3'):
    task_dir = os.path.join(DOWNLOAD_DIR, task_id)
    os.makedirs(task_dir, exist_ok=True)
    
    ydl_opts = {
        'outtmpl': os.path.join(task_dir, '%(title)s.%(ext)s'),
        'logger': MyLogger(task_id),
        'progress_hooks': [lambda d: progress_hook(d, task_id)],
        'quiet': True,
        'noplaylist': False,
        'ignoreerrors': True
    }
    
    cookies_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cookies.txt')
    if os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path
    
    if format_type == 'mp3':
        ydl_opts['format'] = 'bestaudio/best'
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]
    else: # mp4
        ydl_opts['format'] = 'bestvideo+bestaudio[ext=m4a]/best[ext=mp4]/best'
        ydl_opts['merge_output_format'] = 'mp4'
    
    if selected_indices and isinstance(selected_indices, list):
        ydl_opts['playlist_items'] = ','.join(map(str, selected_indices))
        
    try:
        download_progress[task_id] = {'status': 'Preparando download...', 'percent': '0%'}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            
            if not info:
                raise Exception("Não foi possível extrair informações. O vídeo pode ser privado.")

            is_playlist = 'entries' in info
            ext_to_check = '.mp3' if format_type == 'mp3' else '.mp4'

            if is_playlist:
                downloaded_files = [f for f in os.listdir(task_dir) if f.endswith(ext_to_check)]
                
                if len(downloaded_files) == 0:
                    raise Exception(f"Nenhum arquivo {ext_to_check.upper()} foi gerado (possivelmente indisponível ou erro).")
                elif len(downloaded_files) == 1:
                    media_file = os.path.join(task_dir, downloaded_files[0])
                    final_path = os.path.join(DOWNLOAD_DIR, f"{task_id}_{downloaded_files[0]}")
                    shutil.move(media_file, final_path)
                    shutil.rmtree(task_dir, ignore_errors=True)
                    
                    download_progress[task_id] = {
                        'status': 'completed', 
                        'file_path': final_path,
                        'title': downloaded_files[0].replace(ext_to_check, ''),
                        'is_playlist': False,
                        'format': format_type
                    }
                    fsize = os.path.getsize(final_path) if os.path.exists(final_path) else 0
                    thumb = get_thumbnail(info)
                    save_to_history(downloaded_files[0].replace(ext_to_check, ''), format_type, False, fsize, thumb, url)
                else:
                    zip_filename = os.path.join(DOWNLOAD_DIR, f"{task_id}.zip")
                    download_progress[task_id] = {'status': 'Compactando arquivos...', 'percent': '100%'}
                    
                    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
                        for file in downloaded_files:
                            file_path = os.path.join(task_dir, file)
                            zipf.write(file_path, file)
                    
                    shutil.rmtree(task_dir, ignore_errors=True)
                    
                    playlist_title = info.get('title', 'Playlist')
                    download_progress[task_id] = {
                        'status': 'completed', 
                        'file_path': zip_filename,
                        'title': playlist_title,
                        'is_playlist': True,
                        'format': format_type
                    }
                    fsize = os.path.getsize(zip_filename) if os.path.exists(zip_filename) else 0
                    thumb = get_thumbnail(info)
                    save_to_history(playlist_title, format_type, True, fsize, thumb, url)
            else:
                media_file = None
                for file in os.listdir(task_dir):
                    if file.endswith(ext_to_check):
                        media_file = os.path.join(task_dir, file)
                        break
                        
                if media_file:
                    final_path = os.path.join(DOWNLOAD_DIR, f"{task_id}_{os.path.basename(media_file)}")
                    shutil.move(media_file, final_path)
                    shutil.rmtree(task_dir, ignore_errors=True)
                    
                    download_progress[task_id] = {
                        'status': 'completed', 
                        'file_path': final_path,
                        'title': info.get('title', 'Media'),
                        'is_playlist': False,
                        'format': format_type
                    }
                    fsize = os.path.getsize(final_path) if os.path.exists(final_path) else 0
                    thumb = get_thumbnail(info)
                    save_to_history(info.get('title', 'Media'), format_type, False, fsize, thumb, url)
                else:
                    raise Exception(f"Arquivo {ext_to_check.upper()} não encontrado após a conversão.")
                    
    except Exception as e:
        download_progress[task_id] = {'status': 'error', 'error': str(e)}
        shutil.rmtree(task_dir, ignore_errors=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/info', methods=['POST'])
def get_info():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'error': 'URL is required'}), 400
        
    ydl_opts = {
        'extract_flat': True,
        'quiet': True,
        'ignoreerrors': True
    }
    
    cookies_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cookies.txt')
    if os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if not info:
                return jsonify({'error': 'Não foi possível obter informações da URL.'}), 400
                
            if 'entries' in info:
                entries = []
                for idx, entry in enumerate(info['entries'], start=1):
                    if entry:
                        entries.append({
                            'index': idx,
                            'title': entry.get('title', 'Vídeo indisponível ou sem título')
                        })
                return jsonify({
                    'is_playlist': True,
                    'title': info.get('title', 'Playlist'),
                    'entries': entries
                })
            else:
                return jsonify({
                    'is_playlist': False,
                    'title': info.get('title', 'Vídeo'),
                })
    except Exception as e:
        return jsonify({'error': 'Erro ao buscar URL: ' + str(e)}), 500

@app.route('/api/start_download', methods=['POST'])
def start_download():
    data = request.json
    url = data.get('url')
    selected_indices = data.get('selected_indices')
    format_type = data.get('format', 'mp3')
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400
        
    task_id = str(uuid.uuid4())
    download_progress[task_id] = {'status': 'Iniciando...', 'percent': '0%'}
    
    thread = threading.Thread(target=download_media_task, args=(url, task_id, selected_indices, format_type))
    thread.start()
    
    return jsonify({'task_id': task_id})

@app.route('/api/status/<task_id>')
def get_status(task_id):
    status = download_progress.get(task_id)
    if not status:
        return jsonify({'error': 'Task not found'}), 404
        
    response_data = {k: v for k, v in status.items() if k != 'file_path'}
    return jsonify(response_data)

@app.route('/api/download/<task_id>')
def download_file(task_id):
    status = download_progress.get(task_id)
    if not status or status.get('status') != 'completed':
        return "File not ready or not found", 404
        
    file_path = status.get('file_path')
    if file_path and os.path.exists(file_path):
        is_playlist = status.get('is_playlist')
        format_type = status.get('format', 'mp3')
        
        if is_playlist:
            ext = '.zip'
        else:
            ext = f'.{format_type}'
            
        title = status.get('title', 'download')
        safe_title = "".join([c for c in title if c.isalpha() or c.isdigit() or c in ' -_']).rstrip()
        if not safe_title:
            safe_title = "download"
        return send_file(file_path, as_attachment=True, download_name=f"{safe_title}{ext}")
    else:
        return "File not found on server", 404

@app.route('/api/historico')
def get_historico():
    try:
        with open(HISTORICO_FILE, 'r', encoding='utf-8') as f:
            history = json.load(f)
        return jsonify(history)
    except Exception as e:
        return jsonify([]), 200

@app.route('/api/historico/clear', methods=['DELETE'])
def clear_historico():
    try:
        with open(HISTORICO_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shutdown', methods=['POST'])
def shutdown():
    # Encerra o processo de forma forcada e imediata (mata o servidor em background)
    os._exit(0)

if __name__ == '__main__':
    try:
        import webbrowser
        from threading import Timer
        
        def open_browser():
            webbrowser.open_new("http://localhost:5000")
            
        print("Iniciando servidor na porta 5000...")
        # Abre o navegador apos 1 segundo (tempo para o servidor subir)
        Timer(1.0, open_browser).start()
        
        # debug=False impede que o Flask inicie em duplicidade (o que abriria 2 abas)
        app.run(debug=False, port=5000)
    except Exception as e:
        print(f"\n[ERRO CRITICO] O servidor encontrou um problema e parou: {e}")
        input("Pressione Enter para fechar a janela...")
