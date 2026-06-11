document.addEventListener('DOMContentLoaded', () => {

    let currentStep = 1;
    let isPlaylistMode = false;

    window.nextStep = function(step) {
        if (step === 3 && isPlaylistMode) {
            // Pular step 3 (Recorte de Tempo) se for playlist
            step = 4;
        }
        document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none');
        document.getElementById('step' + step).style.display = 'block';
        currentStep = step;
    };

    window.prevStep = function(step) {
        if (step === 3 && isPlaylistMode) {
            // Pular step 3 (Recorte de Tempo) voltando para 2 se for playlist
            step = 2;
        }
        document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none');
        document.getElementById('step' + step).style.display = 'block';
        currentStep = step;
    };

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

    const audioQualitySelect = document.getElementById('audioQualitySelect');
    const videoQualitySelect = document.getElementById('videoQualitySelect');
    const qualitySelection = document.getElementById('qualitySelection');
    const videoQualityContainer = document.getElementById('videoQualityContainer');
    const formatRadios = document.querySelectorAll('input[name="formatOption"]');
    const timeSelection = document.getElementById('timeSelection');
    const startTimeInput = document.getElementById('startTimeInput');
    const endTimeInput = document.getElementById('endTimeInput');

    let currentMediaInfo = null;

    // Trocar entre campos de qualidade conforme formato selecionado
    formatRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'mp3') {
                qualitySelection.style.display = 'block';
                videoQualityContainer.style.display = 'none';
            } else {
                qualitySelection.style.display = 'none';
                videoQualityContainer.style.display = 'block';
            }
        });
    });

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

    function customPassword(actionText = 'Digite a senha:') {
        return new Promise((resolve) => {
            const modal = document.getElementById('customPasswordModal');
            const inputEl = document.getElementById('passwordInput');
            const okBtn = document.getElementById('passwordOkBtn');
            const cancelBtn = document.getElementById('passwordCancelBtn');
            if (!modal) return resolve(prompt('Digite a senha:'));
            inputEl.value = '';
            const msgEl = document.getElementById('passwordMessage');
            if (msgEl) msgEl.textContent = actionText;
            modal.style.display = 'flex';
            inputEl.focus();
            const close = (result) => {
                modal.style.display = 'none';
                okBtn.onclick = null;
                cancelBtn.onclick = null;
                inputEl.onkeyup = null;
                resolve(result);
            };
            okBtn.onclick = () => close(inputEl.value);
            cancelBtn.onclick = () => close(null);
            inputEl.onkeyup = (e) => { if (e.key === 'Enter') close(inputEl.value); };
        });
    }

    if (shutdownBtn) {
        shutdownBtn.addEventListener('click', async () => {
            const isConfirmed = await customConfirm(
                "Encerrar Servidor", 
                "Tem certeza que deseja encerrar o servidor GYD? O sistema parará de funcionar e você poderá fechar esta tela.", 
                "Encerrar"
            );
            
            if (isConfirmed) {
                try {
                    await fetch('/api/shutdown', { method: 'POST' });
                } catch (e) {}
                document.body.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100vh; flex-direction:column; color:white;"><h1>Servidor Encerrado</h1><p>Pode fechar esta janela com seguranca.</p></div>';
            }
        });
    }

    const checkIpBtn = document.getElementById('checkIpBtn');
    if (checkIpBtn) {
        checkIpBtn.addEventListener('click', async () => {
            const originalHtml = checkIpBtn.innerHTML;
            checkIpBtn.innerHTML = '<span>⏳</span> Testando...';
            checkIpBtn.disabled = true;
            try {
                const res = await fetch('/api/check_ip');
                const data = await res.json();
                if (data.status === 'ok') {
                    customConfirm("Diagnóstico de IP", "✅ " + data.message, "OK");
                } else if (data.status === 'blocked') {
                    customConfirm("ALERTA DE BLOQUEIO", "❌ " + data.message, "Entendi");
                } else {
                    customConfirm("Diagnóstico", "⚠️ " + data.message, "OK");
                }
            } catch (e) {
                customConfirm("Erro", "Falha ao conectar com o servidor para o diagnóstico.", "OK");
            } finally {
                checkIpBtn.innerHTML = originalHtml;
                checkIpBtn.disabled = false;
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
        window.nextStep(1);
        isPlaylistMode = data.is_playlist;
        
        if (videoQualitySelect) {
            videoQualitySelect.innerHTML = '';
            const resList = data.resolutions || [2160, 1440, 1080, 720, 480, 360, 240, 144];
            let hasSelected = false;
            resList.forEach((res, index) => {
                const option = document.createElement('option');
                option.value = res;
                let label = res + 'p';
                if (res >= 2160) label += ' (4K)';
                else if (res >= 1440) label += ' (2K)';
                else if (res >= 1080) label += ' (Full HD)';
                else if (res >= 720) label += ' (HD)';
                if (res === 1080 || (!hasSelected && index === 0)) {
                    option.selected = true;
                    if (res === 1080) hasSelected = true;
                }
                option.textContent = label;
                videoQualitySelect.appendChild(option);
            });
        }
        
        if (data.is_playlist) {
            mediaType.textContent = `Playlist (${data.entries.length} vídeos encontrados)`;
            playlistContainer.style.display = 'block';
            timeSelection.style.display = 'none';
            renderPlaylistItems(data.entries);
            updateSelectedCount();
        } else {
            mediaType.textContent = 'Vídeo Único';
            playlistContainer.style.display = 'none';
            timeSelection.style.display = 'block';
            startTimeInput.value = '';
            endTimeInput.value = '';
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
            const selectedQuality = formatType === 'mp3'
                ? (audioQualitySelect ? audioQualitySelect.value : '192')
                : (videoQualitySelect ? videoQualitySelect.value : null);

            const payload = {
                url: currentMediaInfo.url,
                selected_indices: selectedIndices,
                format: formatType,
                quality: selectedQuality
            };

            if (!currentMediaInfo.is_playlist) {
                payload.start_time = startTimeInput ? startTimeInput.value.trim() : '';
                payload.end_time = endTimeInput ? endTimeInput.value.trim() : '';
            }

            const response = await fetch('/api/start_download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
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

