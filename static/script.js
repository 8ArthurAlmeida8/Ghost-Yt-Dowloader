document.addEventListener('DOMContentLoaded', () => {
    const urlForm = document.getElementById('urlForm');
    const urlInput = document.getElementById('urlInput');
    const searchBtn = document.getElementById('searchBtn');
    
    const selectionArea = document.getElementById('selectionArea');
    const mediaTitle = document.getElementById('mediaTitle');
    const mediaType = document.getElementById('mediaType');
    const playlistContainer = document.getElementById('playlistContainer');
    const playlistItems = document.getElementById('playlistItems');
    const selectAll = document.getElementById('selectAll');
    const selectedCount = document.getElementById('selectedCount');
    const downloadBtn = document.getElementById('downloadBtn');
    
    const statusArea = document.getElementById('statusArea');
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('progressBar');
    const downloadLink = document.getElementById('downloadLink');
    const errorMsg = document.getElementById('errorMsg');

    const historicoArea = document.getElementById('historicoArea');
    const historicoList = document.getElementById('historicoList');
    const clearHistoricoBtn = document.getElementById('clearHistoricoBtn');
    const shutdownBtn = document.getElementById('shutdownBtn');

    let currentMediaInfo = null;

    function customConfirm(title, message, confirmText = "Confirmar") {
        return new Promise((resolve) => {
            const modal = document.getElementById('customConfirmModal');
            const titleEl = document.getElementById('confirmTitle');
            const messageEl = document.getElementById('confirmMessage');
            const okBtn = document.getElementById('confirmOkBtn');
            const cancelBtn = document.getElementById('confirmCancelBtn');

            if (!modal) return resolve(confirm(message));

            titleEl.textContent = title;
            messageEl.textContent = message;
            okBtn.textContent = confirmText;

            modal.style.display = 'flex';

            const close = (result) => {
                modal.style.display = 'none';
                okBtn.onclick = null;
                cancelBtn.onclick = null;
                resolve(result);
            };

            okBtn.onclick = () => close(true);
            cancelBtn.onclick = () => close(false);
        });
    }

    if (shutdownBtn) {
        shutdownBtn.addEventListener('click', async () => {
            const isConfirmed = await customConfirm(
                "Encerrar Servidor", 
                "Tem certeza que deseja encerrar o servidor MYD? O sistema parará de funcionar e você poderá fechar esta tela.", 
                "Encerrar"
            );
            
            if (isConfirmed) {
                try {
                    await fetch('/api/shutdown', { method: 'POST' });
                } catch (e) {
                    // Erro esperado ao matar o servidor
                }
                document.body.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100vh; flex-direction:column; color:white;"><h1>Servidor Encerrado</h1><p>Pode fechar esta janela com seguranca.</p></div>';
            }
        });
    }

    // ── Detectar palavra "historico" no campo de URL ─────────────────────────
    urlInput.addEventListener('input', () => {
        if (urlInput.value.trim().toLowerCase() === 'historico') {
            urlInput.value = '';
            showHistorico();
        }
    });

    urlForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = urlInput.value.trim();
        if (!url) return;

        // Reset UI
        searchBtn.classList.add('loading');
        searchBtn.disabled = true;
        errorMsg.style.display = 'none';
        selectionArea.classList.remove('active');
        statusArea.classList.remove('active');
        historicoArea.classList.remove('active');

        try {
            const response = await fetch('/api/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao buscar informações');
            }

            currentMediaInfo = { url, ...data };
            showSelectionArea(data);

        } catch (error) {
            showError(error.message);
        } finally {
            searchBtn.classList.remove('loading');
            searchBtn.disabled = false;
        }
    });

    // ── Histórico ─────────────────────────────────────────────────────────────
    async function showHistorico() {
        resetAllAreas();
        historicoArea.classList.add('active');

        try {
            const res = await fetch('/api/historico');
            const items = await res.json();
            renderHistorico(items);
        } catch {
            historicoList.innerHTML = '<p class="historico-empty"><span>⚠️</span>Erro ao carregar histórico.</p>';
        }
    }

    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '';
        if (bytes < 1024 * 1024) return ` · ${(bytes / 1024).toFixed(0)} KB`;
        return ` · ${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function renderHistorico(items) {
        if (!items || items.length === 0) {
            historicoList.innerHTML = `
                <div class="historico-empty">
                    <span>📭</span>
                    Nenhum download registrado ainda.<br>
                    Baixe algo e ele vai aparecer aqui!
                </div>`;
            return;
        }

        historicoList.innerHTML = items.map(item => {
            const badgeClass = item.is_playlist ? 'badge-zip' : (item.format === 'MP4' ? 'badge-mp4' : 'badge-mp3');
            const badgeLabel = item.is_playlist ? 'ZIP' : item.format;
            const size = formatBytes(item.size_bytes);

            // Thumbnail ou placeholder
            const thumbHtml = item.thumbnail
                ? `<img class="historico-thumb" src="${item.thumbnail}" alt="thumb" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'historico-thumb-placeholder\\'>🎵</div>'">`
                : `<div class="historico-thumb-placeholder">${item.format === 'MP4' ? '🎬' : '🎵'}</div>`;

            // Titulo clicavel se houver URL de origem
            const titleHtml = item.source_url
                ? `<a class="historico-item-title" href="${item.source_url}" target="_blank" title="Abrir no YouTube: ${item.title}">${item.title}</a>`
                : `<div class="historico-item-title" title="${item.title}">${item.title}</div>`;

            return `
                <div class="historico-item">
                    ${thumbHtml}
                    <div class="historico-info">
                        ${titleHtml}
                        <div class="historico-meta">${item.downloaded_at}${size}${item.is_playlist ? ' · Playlist' : ''}</div>
                    </div>
                    <span class="historico-badge ${badgeClass}">${badgeLabel}</span>
                </div>`;
        }).join('');
    }

    clearHistoricoBtn.addEventListener('click', async () => {
        const isConfirmed = await customConfirm(
            "Limpar Histórico",
            "Deseja realmente limpar todo o histórico de downloads? Esta ação não pode ser desfeita.",
            "Limpar Tudo"
        );
        if (!isConfirmed) return;

        await fetch('/api/historico/clear', { method: 'DELETE' });
        renderHistorico([]);
    });

    // ── UI Helpers ────────────────────────────────────────────────────────────
    function resetAllAreas() {
        selectionArea.classList.remove('active');
        statusArea.classList.remove('active');
        historicoArea.classList.remove('active');
        errorMsg.style.display = 'none';
    }

    function showSelectionArea(data) {
        mediaTitle.textContent = data.title;
        selectionArea.classList.add('active');
        
        if (data.is_playlist) {
            mediaType.textContent = `Playlist (${data.entries.length} vídeos encontrados)`;
            playlistContainer.style.display = 'block';
            renderPlaylistItems(data.entries);
            updateSelectedCount();
        } else {
            mediaType.textContent = 'Vídeo Único';
            playlistContainer.style.display = 'none';
        }
    }

    function renderPlaylistItems(entries) {
        playlistItems.innerHTML = '';
        selectAll.checked = true;
        
        entries.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'playlist-item';
            div.innerHTML = `
                <label class="checkbox-container">
                    <input type="checkbox" class="item-checkbox" value="${entry.index}" checked>
                    <span class="checkmark"></span>
                </label>
                <span class="item-title" title="${entry.title}">${entry.index}. ${entry.title}</span>
            `;
            playlistItems.appendChild(div);
        });

        const checkboxes = document.querySelectorAll('.item-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                updateSelectedCount();
                const allChecked = Array.from(checkboxes).every(c => c.checked);
                selectAll.checked = allChecked;
            });
        });
    }

    selectAll.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
        });
        updateSelectedCount();
    });

    function updateSelectedCount() {
        const checked = document.querySelectorAll('.item-checkbox:checked').length;
        selectedCount.textContent = `${checked} selecionado(s)`;
        downloadBtn.disabled = checked === 0;
    }

    downloadBtn.addEventListener('click', async () => {
        if (!currentMediaInfo) return;

        const formatType = document.querySelector('input[name="formatOption"]:checked').value;

        let selectedIndices = null;
        if (currentMediaInfo.is_playlist) {
            const checked = document.querySelectorAll('.item-checkbox:checked');
            selectedIndices = Array.from(checked).map(cb => parseInt(cb.value));
            
            if (selectedIndices.length === 0) return;
        }

        selectionArea.classList.remove('active');
        statusArea.classList.add('active');
        downloadLink.classList.remove('active');
        errorMsg.style.display = 'none';
        progressBar.style.width = '0%';
        statusText.textContent = 'Iniciando download...';

        try {
            const response = await fetch('/api/start_download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    url: currentMediaInfo.url,
                    selected_indices: selectedIndices,
                    format: formatType
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao iniciar download');
            }

            pollStatus(data.task_id);

        } catch (error) {
            showError(error.message);
        }
    });

    async function pollStatus(taskId) {
        try {
            const response = await fetch(`/api/status/${taskId}`);
            const data = await response.json();

            if (data.status === 'error') {
                showError(data.error || 'Erro durante o download. Verifique se o vídeo é público e o FFmpeg está instalado.');
                return;
            }

            if (data.status === 'completed') {
                finishDownload(taskId, data.title, data.is_playlist, data.format);
                return;
            }

            if (data.status === 'downloading') {
                statusText.textContent = `Baixando... ${data.percent}`;
                progressBar.style.width = data.percent.replace('%', '') + '%';
            } else if (data.status.startsWith('Baixando') || data.status.startsWith('Processando')) {
                statusText.textContent = `${data.status} ${data.percent !== '100%' && data.percent !== '0%' ? ' - ' + data.percent : ''}`;
                progressBar.style.width = data.percent.replace('%', '') + '%';
            } else {
                statusText.textContent = data.status;
                if (data.percent) {
                    progressBar.style.width = data.percent.replace('%', '') + '%';
                }
            }

            setTimeout(() => pollStatus(taskId), 1000);

        } catch (error) {
            showError('Perda de conexão com o servidor');
        }
    }

    function finishDownload(taskId, title, isPlaylist, formatType) {
        statusText.textContent = 'Concluído com sucesso!';
        progressBar.style.width = '100%';
        
        downloadLink.href = `/api/download/${taskId}`;
        let formatLabel = isPlaylist ? '(ZIP)' : (formatType === 'mp4' ? '(MP4)' : '(MP3)');
        downloadLink.innerHTML = `Baixar: ${title} <b>${formatLabel}</b>`;
        downloadLink.classList.add('active');
    }

    function showError(msg) {
        selectionArea.classList.remove('active');
        statusArea.classList.remove('active');
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }
});

