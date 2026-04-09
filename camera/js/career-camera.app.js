(() => {
    const CC = (window.CareerCamera = window.CareerCamera || {});
    const ui = CC.ui;

    if (CC.bootstrapped) return;
    CC.bootstrapped = true;

    CC.stream = null;
    CC.currentResult = null;
    /** @type {{ x: number, y: number, width: number, height: number } | null} */
    CC.focusRect = null;

    const FOCUS_BOX_RATIO = 0.42;

    /** @type {{ x: number, y: number } | null} */
    let focusDragStart = null;

    function clientToBuffer(clientX, clientY, videoEl) {
        const rect = videoEl.getBoundingClientRect();
        const relX = (clientX - rect.left) / rect.width;
        const relY = (clientY - rect.top) / rect.height;
        const vw = videoEl.videoWidth;
        const vh = videoEl.videoHeight;
        const bufX = (1 - relX) * vw;
        const bufY = relY * vh;
        return { x: bufX, y: bufY };
    }

    function rectAroundPoint(cx, cy, w, h) {
        const side = Math.min(w, h) * FOCUS_BOX_RATIO;
        let x = cx - side / 2;
        let y = cy - side / 2;
        x = Math.max(0, Math.min(x, w - side));
        y = Math.max(0, Math.min(y, h - side));
        const rw = Math.min(side, w - x);
        const rh = Math.min(side, h - y);
        return { x, y, width: rw, height: rh };
    }

    function clampFocusRect(x, y, w, h, vw, vh) {
        x = Math.max(0, Math.min(x, vw));
        y = Math.max(0, Math.min(y, vh));
        w = Math.max(0, Math.min(w, vw - x));
        h = Math.max(0, Math.min(h, vh - y));
        return { x, y, width: w, height: h };
    }

    function rectFromDragCorners(x0, y0, x1, y1, vw, vh) {
        const x = Math.min(x0, x1);
        const y = Math.min(y0, y1);
        const w = Math.abs(x1 - x0);
        const h = Math.abs(y1 - y0);
        return clampFocusRect(x, y, w, h, vw, vh);
    }

    function finalizeFocusRectAfterDrag(rect, x0, y0, x1, y1, vw, vh) {
        const minSide = Math.max(28, Math.min(vw, vh) * 0.06);
        if (rect.width >= minSide && rect.height >= minSide) return rect;
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        return rectAroundPoint(cx, cy, vw, vh);
    }

    function syncFocusOverlay() {
        if (!ui.focusFrame || !ui.video || !CC.stream) return;
        const vw = ui.video.videoWidth;
        const vh = ui.video.videoHeight;
        if (!vw || !vh) return;

        const rect = CC.focusRect || CC.getDefaultAnalysisRect({ width: vw, height: vh });
        const leftPct = (1 - (rect.x + rect.width) / vw) * 100;
        const topPct = (rect.y / vh) * 100;
        const wPct = (rect.width / vw) * 100;
        const hPct = (rect.height / vh) * 100;

        ui.focusFrame.style.left = `${leftPct}%`;
        ui.focusFrame.style.top = `${topPct}%`;
        ui.focusFrame.style.width = `${wPct}%`;
        ui.focusFrame.style.height = `${hPct}%`;
        CC.show(ui.focusFrame);

        if (ui.scanLineRegion) {
            ui.scanLineRegion.style.left = `${leftPct}%`;
            ui.scanLineRegion.style.top = `${topPct}%`;
            ui.scanLineRegion.style.width = `${wPct}%`;
            ui.scanLineRegion.style.height = `${hPct}%`;
        }
    }

    function scheduleFocusOverlaySync() {
        if (ui.video.videoWidth) {
            syncFocusOverlay();
        } else {
            ui.video.addEventListener('loadedmetadata', syncFocusOverlay, { once: true });
        }
    }

    window.addEventListener('resize', () => {
        if (CC.stream) syncFocusOverlay();
    });

    function endFocusDrag(e) {
        if (focusDragStart === null || !CC.stream || !ui.video.videoWidth) return;
        const vw = ui.video.videoWidth;
        const vh = ui.video.videoHeight;
        const end = clientToBuffer(e.clientX, e.clientY, ui.video);
        const x0 = focusDragStart.x;
        const y0 = focusDragStart.y;
        const x1 = end.x;
        const y1 = end.y;
        focusDragStart = null;
        ui.video.classList.remove('is-focus-dragging');
        try {
            ui.video.releasePointerCapture(e.pointerId);
        } catch (_) {
            /* already released */
        }

        let rect = rectFromDragCorners(x0, y0, x1, y1, vw, vh);
        rect = finalizeFocusRectAfterDrag(rect, x0, y0, x1, y1, vw, vh);
        CC.focusRect = rect;
        syncFocusOverlay();
        CC.setStatus('Область анализа выбрана. Нажмите «Анализировать».', 'success');
    }

    function onVideoPointerDown(e) {
        if (!CC.stream || !ui.video.videoWidth) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        focusDragStart = clientToBuffer(e.clientX, e.clientY, ui.video);
        ui.video.classList.add('is-focus-dragging');
        try {
            ui.video.setPointerCapture(e.pointerId);
        } catch (_) {
            /* ignore */
        }

        const vw = ui.video.videoWidth;
        const vh = ui.video.videoHeight;
        CC.focusRect = rectFromDragCorners(
            focusDragStart.x,
            focusDragStart.y,
            focusDragStart.x,
            focusDragStart.y,
            vw,
            vh
        );
        syncFocusOverlay();
    }

    function onVideoPointerMove(e) {
        if (focusDragStart === null || !CC.stream || !ui.video.videoWidth) return;
        const cur = clientToBuffer(e.clientX, e.clientY, ui.video);
        const vw = ui.video.videoWidth;
        const vh = ui.video.videoHeight;
        CC.focusRect = rectFromDragCorners(focusDragStart.x, focusDragStart.y, cur.x, cur.y, vw, vh);
        syncFocusOverlay();
    }

    ui.video.addEventListener('pointerdown', onVideoPointerDown);
    ui.video.addEventListener('pointermove', onVideoPointerMove);
    ui.video.addEventListener('pointerup', endFocusDrag);
    ui.video.addEventListener('pointercancel', endFocusDrag);
    ui.video.addEventListener('lostpointercapture', () => {
        if (focusDragStart === null) return;
        focusDragStart = null;
        ui.video.classList.remove('is-focus-dragging');
    });

    function showTechProgressBar(onComplete) {
        if (!ui.techProgressWrap || !ui.techProgressBar || !ui.techProgressLabel) return;

        CC.show(ui.techProgressWrap);
        ui.techProgressBar.style.width = '0%';
        ui.techProgressLabel.textContent = '0%';

        const duration = 1800;
        const start = performance.now();

        function step(timestamp) {
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 1.5);
            const pct = Math.round(eased * 100);

            ui.techProgressBar.style.width = pct + '%';
            ui.techProgressLabel.textContent = pct + '%';

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                ui.techProgressLabel.textContent = '100%';
                setTimeout(() => {
                    if (typeof onComplete === 'function') onComplete();
                }, 800);
            }
        }

        requestAnimationFrame(step);
    }

    function hideTechProgressBar() {
        CC.hide(ui.techProgressWrap);
    }

    function renderMainProfession(mainProf, matchPercent) {
        ui.professionIcon.textContent = mainProf.icon;
        ui.professionName.textContent = mainProf.name;
        ui.professionDescription.textContent = mainProf.description;
        ui.matchPercentage.textContent = matchPercent + '%';

        if (ui.professionSalary && mainProf.salary) {
            if (mainProf.salary.note) {
                ui.professionSalary.innerHTML = `<strong>Зарплата:</strong> ${mainProf.salary.note}`;
            } else {
                const minFormatted = mainProf.salary.min.toLocaleString('ru-RU');
                const maxFormatted = mainProf.salary.max.toLocaleString('ru-RU');
                ui.professionSalary.innerHTML = `<strong>Зарплата:</strong> ${minFormatted} - ${maxFormatted} ${mainProf.salary.currency}/мес`;
            }
        }

        ui.professionSkills.innerHTML = '';
        mainProf.skills.forEach((skill) => {
            const li = document.createElement('li');
            li.textContent = skill;
            ui.professionSkills.appendChild(li);
        });
    }

    function renderOtherProfessions(result) {
        ui.otherProfessions.innerHTML = '';

        result.others.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'profession-mini';
            div.setAttribute('data-profession', item.profession.name);
            div.style.cursor = 'pointer';
            div.innerHTML = `
                <div class="profession-mini-icon">${item.profession.icon}</div>
                <div class="profession-mini-name">${item.profession.name}</div>
                <div class="profession-mini-match">${item.match}%</div>
            `;

            div.addEventListener('click', () => {
                document.querySelectorAll('.profession-mini').forEach((card) => {
                    card.classList.remove('selected');
                });
                div.classList.add('selected');

                // ВАЖНО: никаких прогресс-баров/перезагрузок — просто переключаем отображение.
                renderMainProfession(item.profession, item.match);
                CC.displayRecommendedTopics(item.profession);
            });

            ui.otherProfessions.appendChild(div);
        });
    }

    function displayResult(result) {
        CC.currentResult = result;

        renderMainProfession(result.main, result.match);
        renderOtherProfessions(result);

        CC.hide(ui.resultSection);
        CC.setStatus('Анализ завершен!', 'success');

        showTechProgressBar(() => {
            CC.hide(ui.techProgressWrap);
            CC.show(ui.resultSection);
        });

        CC.displayRecommendedTopics(result.main);
    }

    ui.startCameraBtn.addEventListener('click', async () => {
        try {
            try {
                await CC.loadProfessions();
            } catch (e) {
                CC.setStatus('Не удалось загрузить данные профессий. Проверьте `data/professions.json`.', 'error');
                return;
            }

            CC.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });

            ui.video.srcObject = CC.stream;
            CC.focusRect = null;
            CC.hide(ui.startCameraBtn);
            CC.show(ui.analyzeBtn);
            CC.show(ui.scanLineRegion || ui.scanLine);
            CC.setStatus(
                'Камера включена. Зажмите и выделите область на экране, затем нажмите «Анализировать».',
                'success'
            );

            scheduleFocusOverlaySync();
            CC.startContourScanner();
        } catch (error) {
            CC.setStatus('Ошибка доступа к камере: ' + error.message, 'error');
        }
    });

    ui.analyzeBtn.addEventListener('click', async () => {
        if (!CC.stream) {
            CC.setStatus('Сначала включите камеру!', 'error');
            return;
        }

        if (!Array.isArray(CC.professions) || CC.professions.length === 0) {
            CC.setStatus('Загрузка данных профессий...', 'info');
            try {
                await CC.loadProfessions();
            } catch (e) {
                CC.setStatus('Не удалось загрузить данные профессий. Проверьте `data/professions.json`.', 'error');
                return;
            }
        }

        CC.setStatus('Фиксация кадра...', 'info');
        CC.stopContourScanner();
        syncFocusOverlay();
        CC.hide(ui.focusFrame);

        ui.captureCanvas.width = ui.video.videoWidth;
        ui.captureCanvas.height = ui.video.videoHeight;
        const ctx = ui.captureCanvas.getContext('2d');
        ctx.drawImage(ui.video, 0, 0);

        if (CC.stream) {
            CC.stream.getTracks().forEach((track) => track.stop());
            CC.stream = null;
        }

        ui.video.srcObject = null;
        ui.video.classList.add(CC.IS_HIDDEN_CLASS);

        ui.captureCanvas.style.display = 'block';
        ui.captureCanvas.style.width = '100%';
        ui.captureCanvas.style.height = 'auto';
        ui.captureCanvas.style.transform = 'scaleX(-1)';

        ui.contourCanvas.width = ui.captureCanvas.width;
        ui.contourCanvas.height = ui.captureCanvas.height;
        ui.contourCanvas.style.display = 'block';
        CC.show(ui.scanLineRegion || ui.scanLine);

        CC.setStatus('Сканирование...', 'info');

        const imgData = ctx.getImageData(0, 0, ui.captureCanvas.width, ui.captureCanvas.height);
        const edgePixels = CC.getEdgePixels(imgData.data, ui.captureCanvas.width, ui.captureCanvas.height);

        CC.runCaptureScan(edgePixels, ui.captureCanvas.width, ui.captureCanvas.height, () => {
            CC.hide(ui.overlay);
            CC.hide(ui.scanLineRegion || ui.scanLine);
            ui.contourCanvas.style.display = 'none';

            CC.setStatus('Анализ изображения...', 'info');
            const analysisRect = CC.focusRect || CC.getDefaultAnalysisRect(ui.captureCanvas);
            const result = CC.analyzeImage(ui.captureCanvas, analysisRect);
            displayResult(result);

            CC.hide(ui.analyzeBtn);
            CC.show(ui.retryBtn);
        });
    });

    ui.retryBtn.addEventListener('click', async () => {
        CC.hide(ui.resultSection);
        CC.hide(ui.analyzeBtn);
        CC.hide(ui.retryBtn);
        hideTechProgressBar();

        CC.focusRect = null;

        ui.captureCanvas.style.display = 'none';
        if (ui.contourCanvas) ui.contourCanvas.style.display = 'none';

        CC.setStatus('Включение камеры...', 'info');

        try {
            CC.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });

            ui.video.srcObject = CC.stream;
            ui.video.classList.remove(CC.IS_HIDDEN_CLASS);
            CC.show(ui.overlay);
            CC.show(ui.analyzeBtn);
            CC.show(ui.scanLineRegion || ui.scanLine);
            CC.setStatus(
                'Камера включена. Зажмите и выделите область на экране, затем нажмите «Анализировать».',
                'success'
            );
            scheduleFocusOverlaySync();
            CC.startContourScanner();
        } catch (error) {
            CC.setStatus('Ошибка доступа к камере: ' + error.message, 'error');
            CC.show(ui.startCameraBtn);
        }
    });
})();

