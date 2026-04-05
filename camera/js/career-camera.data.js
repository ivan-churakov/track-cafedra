(() => {
    const CC = (window.CareerCamera = window.CareerCamera || {});

    CC.IT_PROFESSIONS = new Set([
        'Программист',
        'Веб-разработчик',
        'Мобильный разработчик',
        'Backend-разработчик',
        'Frontend-разработчик',
        'DevOps-инженер',
        'Тестировщик (QA)',
        'Системный администратор',
        'Аналитик данных',
        'Специалист по ИИ/ML',
        'Бизнес-аналитик',
        'Архитектор ПО',
        'Менеджер IT-проектов',
        'Администратор БД'
    ]);

    CC.TVP_PROFESSIONS = new Set([
        'Игровой разработчик',
        '3D-художник',
        'VR/AR разработчик',
        'Геймдизайнер',
        'Технический художник',
        'Разработчик игровых движков',
        'Аниматор игр',
        'Разработчик симуляторов',
        'Специалист по смешанной реальности'
    ]);

    // Для расчёта очков в determineProfession (исторически "IT-профессии" исключали 'Программист')
    CC.IT_PROFESSIONS_FOR_SCORING = new Set([
        'Веб-разработчик',
        'Мобильный разработчик',
        'Backend-разработчик',
        'Frontend-разработчик',
        'DevOps-инженер',
        'Тестировщик (QA)',
        'Системный администратор',
        'Аналитик данных',
        'Специалист по ИИ/ML',
        'Бизнес-аналитик',
        'Архитектор ПО',
        'Менеджер IT-проектов',
        'Администратор БД'
    ]);

    // Для бонусов дисциплин (включает несколько "технических" базовых профессий)
    CC.IT_PROFESSIONS_FOR_TOPICS = new Set([
        'Программист',
        'Дизайнер',
        'Инженер',
        'Архитектор',
        ...CC.IT_PROFESSIONS_FOR_SCORING
    ]);

    CC.getProfessionType = (profession) => {
        if (CC.IT_PROFESSIONS.has(profession.name)) return 'IT';
        if (CC.TVP_PROFESSIONS.has(profession.name)) return 'TVP';
        return 'OTHER';
    };

    CC.professions = null;
    CC.professionsLoadPromise = null;

    CC.loadProfessions = async () => {
        if (Array.isArray(CC.professions) && CC.professions.length > 0) return CC.professions;
        if (CC.professionsLoadPromise) return CC.professionsLoadPromise;

        CC.professionsLoadPromise = (async () => {
            const res = await fetch('data/professions.json', { cache: 'no-cache' });
            if (!res.ok) throw new Error(`Не удалось загрузить professions.json (${res.status})`);
            const json = await res.json();

            if (!Array.isArray(json)) throw new Error('professions.json должен быть массивом');
            CC.professions = json;
            return CC.professions;
        })();

        return CC.professionsLoadPromise;
    };

    CC.topicsData = null;
    CC.topicsLoadPromise = null;

    CC.loadTopics = async () => {
        if (CC.topicsData && CC.topicsData.profiles) return CC.topicsData;
        if (CC.topicsLoadPromise) return CC.topicsLoadPromise;

        CC.topicsLoadPromise = (async () => {
            const res = await fetch('data/topics-data.json', { cache: 'no-cache' });
            if (!res.ok) throw new Error(`Не удалось загрузить topics-data.json (${res.status})`);
            const json = await res.json();
            CC.topicsData = json;
            return CC.topicsData;
        })();

        return CC.topicsLoadPromise;
    };
})();
