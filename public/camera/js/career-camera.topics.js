(() => {
    const CC = (window.CareerCamera = window.CareerCamera || {});

    CC.determineProfile = (profession) => {
        if (CC.TVP_PROFESSIONS.has(profession.name)) return 'TVP';
        return 'RKBP';
    };

    CC.getRecommendedTopics = (profession) => {
        const profile = CC.determineProfile(profession);
        const profileData = CC.topicsData.profiles[profile];

        const allTopics = [
            ...profileData.topics.red,
            ...profileData.topics.green,
            ...profileData.topics.blue,
            ...profileData.topics.orange
        ];

        const professionKeywords = {
            'Программист': ['программирование', 'разработка', 'алгоритм', 'структуры данных', 'язык', 'приложение', 'веб', 'мобильный', 'бэкенд', 'база данных', 'тестирование', 'информатика', 'технологии программирования'],
            'Дизайнер': ['дизайн', 'интерфейс', 'пользовательский', 'проектирование', 'кроссплатформенный', 'веб', 'мобильный', 'приложение'],
            'Предприниматель': ['управление', 'проект', 'бизнес', 'процесс', 'клиент', 'ресурс', 'предприятие', 'документооборот', 'конфигурация', 'жизненный цикл', 'экономический'],
            'Маркетолог': ['управление', 'клиент', 'анализ', 'бизнес', 'процесс', 'документооборот', 'предприятие'],
            'Инженер': ['проектирование', 'моделирование', 'система', 'архитектура', 'инфраструктура', 'конфигурирование', 'администрирование', 'база данных'],
            'Архитектор': ['проектирование', 'дизайн', 'архитектура', 'моделирование', 'система', 'интерфейс', 'кроссплатформенный'],
            'Психолог': ['психология', 'педагогика', 'социальный', 'коммуникация'],
            'Учитель': ['психология', 'педагогика', 'социальный', 'коммуникация', 'культура речи'],
            'Врач': ['безопасность', 'жизнедеятельность', 'культура'],
            'Писатель': ['культура речи', 'русский язык', 'коммуникация', 'история'],
            'Веб-разработчик': ['веб', 'разработка', 'приложение', 'программирование', 'язык', 'технологии программирования', 'информатика', 'база данных', 'бэкенд'],
            'Мобильный разработчик': ['мобильный', 'приложение', 'разработка', 'кроссплатформенный', 'программирование', 'язык', 'технологии программирования', 'дизайн', 'интерфейс'],
            'Backend-разработчик': ['бэкенд', 'разработка', 'база данных', 'программирование', 'язык', 'технологии программирования', 'архитектура', 'система', 'администрирование'],
            'Frontend-разработчик': ['веб', 'разработка', 'интерфейс', 'пользовательский', 'дизайн', 'программирование', 'язык', 'технологии программирования'],
            'DevOps-инженер': ['операционные системы', 'сетевые технологии', 'инфраструктура', 'система', 'администрирование', 'конфигурирование', 'инфокоммуникационные'],
            'Тестировщик (QA)': ['тестирование', 'приложение', 'кроссплатформенный', 'разработка', 'система', 'проектирование'],
            'Системный администратор': ['операционные системы', 'сетевые технологии', 'администрирование', 'инфраструктура', 'система', 'конфигурирование', 'инфокоммуникационные'],
            'Аналитик данных': ['данные', 'управление данными', 'большие данные', 'статистика', 'вероятность', 'анализ', 'информационно-аналитические'],
            'Специалист по ИИ/ML': ['искусственный интеллект', 'большие данные', 'алгоритм', 'структуры данных', 'математический', 'статистика', 'вероятность', 'моделирование'],
            'Бизнес-аналитик': ['бизнес', 'процесс', 'анализ', 'моделирование', 'управление', 'клиент', 'ресурс', 'предприятие', 'информационно-аналитические', 'экономический'],
            'Архитектор ПО': ['архитектура', 'система', 'проектирование', 'моделирование', 'разработка', 'инфраструктура', 'конфигурирование'],
            'Менеджер IT-проектов': ['управление', 'проект', 'разработка', 'система', 'бизнес', 'процесс', 'жизненный цикл'],
            'Администратор БД': ['база данных', 'проектирование', 'администрирование', 'данные', 'управление данными', 'система'],
            'Игровой разработчик': ['игр', 'разработка', 'моделирование', 'трехмерное', 'пространств', 'симулятор', 'мультиплеер', 'анимационн', 'графическ'],
            '3D-художник': ['трехмерное', 'моделирование', 'игр', 'пространств', 'анимационн', 'графическ', 'визуальн'],
            'VR/AR разработчик': ['смешанной реальности', 'виртуальн', 'разработка', 'пространств', 'трехмерное', 'моделирование'],
            'Геймдизайнер': ['игр', 'разработка', 'игровых', 'пространств', 'моделирование', 'симулятор'],
            'Технический художник': ['графическ', 'процессор', 'визуальн', 'моделирование', 'трехмерное', 'игр'],
            'Разработчик игровых движков': ['графическ', 'процессор', 'игр', 'разработка', 'архитектура', 'система'],
            'Аниматор игр': ['анимационн', 'моделирование', 'трехмерное', 'игр', 'пространств'],
            'Разработчик симуляторов': ['симулятор', 'алгоритм', 'моделирование', 'разработка', 'игр'],
            'Специалист по смешанной реальности': ['смешанной реальности', 'виртуальн', 'разработка', 'пространств', 'трехмерное']
        };

        const keywords = professionKeywords[profession.name] || ['программирование', 'разработка', 'система'];

        const recommended = allTopics
            .map((topic) => {
                let score = 0;
                const titleLower = topic.title.toLowerCase();

                keywords.forEach((keyword) => {
                    if (titleLower.includes(keyword.toLowerCase())) score += 10;
                });

                if (CC.IT_PROFESSIONS_FOR_TOPICS.has(profession.name)) {
                    if (profileData.topics.green.includes(topic) || profileData.topics.blue.includes(topic)) score += 5;
                }

                if (CC.TVP_PROFESSIONS.has(profession.name)) {
                    if (profileData.topics.orange.includes(topic)) score += 10;
                    if (profileData.topics.blue.includes(topic)) score += 5;
                }

                if (['Предприниматель', 'Маркетолог'].includes(profession.name)) {
                    if (profileData.topics.orange.includes(topic)) score += 5;
                }

                return { topic, score };
            })
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map((item) => item.topic);

        return { topics: recommended, profile: profileData };
    };

    CC.parseHours = (str) => {
        if (!str || typeof str !== 'string') return 0;
        const m = str.match(/(\d+)\s*(?:час|часов|часа)/);
        return m ? parseInt(m[1], 10) : 0;
    };

    CC.formatCourse = (course) => {
        if (!course || course.length === 0) return '';
        if (course.length === 1) return `${course[0]} курс`;
        return `${course[0]}–${course[course.length - 1]} курс`;
    };

    CC.displayRecommendedTopics = (profession) => {
        if (!CC.topicsData) {
            const topicsListEl = CC.ui.recommendedTopics;
            if (topicsListEl) {
                topicsListEl.innerHTML = '';
                const p = document.createElement('p');
                p.style.textAlign = 'center';
                p.style.opacity = '0.9';
                p.textContent = 'Загрузка дисциплин...';
                topicsListEl.appendChild(p);
            }

            CC.loadTopics()
                .then(() => CC.displayRecommendedTopics(profession))
                .catch(() => {
                    if (!topicsListEl) return;
                    topicsListEl.innerHTML = '';
                    const p = document.createElement('p');
                    p.style.textAlign = 'center';
                    p.style.opacity = '0.9';
                    p.textContent = 'Не удалось загрузить дисциплины кафедры.';
                    topicsListEl.appendChild(p);
                });
            return;
        }

        const result = CC.getRecommendedTopics(profession);
        const recommendedTopics = result.topics;
        const profileData = result.profile;
        const topicsListEl = CC.ui.recommendedTopics;

        if (!topicsListEl) return;

        topicsListEl.innerHTML = '';

        const profileInfo = document.createElement('div');
        profileInfo.className = 'profile-info';
        profileInfo.innerHTML = `
            <div class="profile-badge">
                <strong>Рекомендуемый профиль:</strong> ${profileData.profile} (${profileData.profileShort})
            </div>
        `;
        topicsListEl.appendChild(profileInfo);

        if (recommendedTopics.length === 0) {
            const noTopicsMsg = document.createElement('p');
            noTopicsMsg.style.textAlign = 'center';
            noTopicsMsg.style.opacity = '0.9';
            noTopicsMsg.textContent = 'Рекомендуем изучить все дисциплины кафедры КБ9 для всестороннего развития!';
            topicsListEl.appendChild(noTopicsMsg);
            return;
        }

        recommendedTopics.forEach((topic) => {
            const card = document.createElement('div');
            card.className = 'topic-card';

            const creditUnit = topic.creditUnit || '';
            const courseStr = CC.formatCourse(topic.course);
            const headerLine = [creditUnit, courseStr].filter(Boolean).join('  |  ');

            const lecH = CC.parseHours(topic.lecture);
            const prH = CC.parseHours(topic.practice);
            const totalH = lecH + prH;
            const lecPct = totalH > 0 ? (lecH / totalH) * 100 : 0;
            const prPct = totalH > 0 ? (prH / totalH) * 100 : 0;

            let loadHtml = '';
            if (totalH > 0) {
                loadHtml = `
                    <div class="topic-legend-row">
                        <span class="topic-legend-item topic-legend-lecture"><span class="topic-legend-swatch"></span>Лекции</span>
                        <span class="topic-legend-item topic-legend-practice"><span class="topic-legend-swatch"></span>Практика</span>
                        <span class="topic-legend-total">Всего ${totalH} ч</span>
                    </div>
                    <div class="topic-load-bar">
                        <span class="topic-load-seg topic-load-lecture" style="width:${lecPct}%">${lecH > 0 ? lecH + ' ч' : ''}</span>
                        <span class="topic-load-seg topic-load-practice" style="width:${prPct}%">${prH > 0 ? prH + ' ч' : ''}</span>
                    </div>
                `;
            }

            const attestRows = [];
            if (topic.test) attestRows.push(`<div class="topic-attest-row"><span class="topic-attest-type">Зачёт</span><span class="topic-attest-term">${topic.test}</span></div>`);
            if (topic.exam) attestRows.push(`<div class="topic-attest-row"><span class="topic-attest-type">Экзамен</span><span class="topic-attest-term">${topic.exam}</span></div>`);

            const attestSection = attestRows.length > 0
                ? `<div class="topic-section topic-section-attest">
                    <div class="topic-section-title"><span class="topic-section-line"></span><span class="topic-section-text">Аттестация</span><span class="topic-section-line"></span></div>
                    <div class="topic-attest">${attestRows.join('')}</div>
                   </div>`
                : '';

            const loadSection = totalH > 0
                ? `<div class="topic-section topic-section-load">
                    <div class="topic-section-title"><span class="topic-section-line"></span><span class="topic-section-text">Нагрузка</span><span class="topic-section-line"></span></div>
                    <div class="topic-load">${loadHtml}</div>
                   </div>`
                : '';

            card.innerHTML = `
                <div class="topic-title">${topic.title}</div>
                <div class="topic-meta">${headerLine}</div>
                ${loadSection}
                ${attestSection}
            `;

            topicsListEl.appendChild(card);
        });
    };
})();

