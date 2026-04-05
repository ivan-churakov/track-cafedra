(() => {
    const CC = (window.CareerCamera = window.CareerCamera || {});
    const ui = CC.ui;

    if (CC.bootstrapped) return;
    CC.bootstrapped = true;

    CC.stream = null;
    CC.currentResult = null;

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
            CC.hide(ui.startCameraBtn);
            CC.show(ui.analyzeBtn);
            CC.show(ui.scanLine);
            CC.setStatus('Камера активирована! Нажмите "Анализировать", чтобы выполнить сканирование.', 'success');

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
        CC.show(ui.scanLine);

        CC.setStatus('Сканирование...', 'info');

        const imgData = ctx.getImageData(0, 0, ui.captureCanvas.width, ui.captureCanvas.height);
        const edgePixels = CC.getEdgePixels(imgData.data, ui.captureCanvas.width, ui.captureCanvas.height);

        CC.runCaptureScan(edgePixels, ui.captureCanvas.width, ui.captureCanvas.height, () => {
            CC.hide(ui.overlay);
            CC.hide(ui.scanLine);
            ui.contourCanvas.style.display = 'none';

            CC.setStatus('Анализ изображения...', 'info');
            const result = CC.analyzeImage(ui.captureCanvas);
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
            CC.show(ui.scanLine);
            CC.setStatus('Камера активирована! Нажмите "Анализировать", чтобы выполнить сканирование.', 'success');
            CC.startContourScanner();
        } catch (error) {
            CC.setStatus('Ошибка доступа к камере: ' + error.message, 'error');
            CC.show(ui.startCameraBtn);
        }
    });
})();

