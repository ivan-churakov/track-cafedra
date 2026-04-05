(() => {
    const CC = (window.CareerCamera = window.CareerCamera || {});

    CC.analyzeImage = (canvas) => {
        const ctx = canvas.getContext('2d');

        // Анализируем автоматически центральную область кадра (там обычно находится человек)
        const width = canvas.width * 0.6;
        const height = canvas.height * 0.7;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2.5;

        const imageData = ctx.getImageData(x, y, width, height);
        const data = imageData.data;

        let brightness = 0;
        const samples = [];

        for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const pixelBrightness = (r + g + b) / 3;
            brightness += pixelBrightness;
            samples.push({ r, g, b, brightness: pixelBrightness });
        }

        brightness = brightness / samples.length;

        let colorSum = 0;
        samples.forEach((sample) => {
            const colorDiff =
                Math.abs(sample.r - sample.g) +
                Math.abs(sample.g - sample.b) +
                Math.abs(sample.b - sample.r);
            colorSum += colorDiff;
        });
        const colorVariance = colorSum / samples.length;

        const sortedBrightness = samples.map((s) => s.brightness).sort((a, b) => a - b);
        const minBright = sortedBrightness[0];
        const maxBright = sortedBrightness[sortedBrightness.length - 1];
        const contrast = maxBright - minBright;

        return CC.determineProfession(brightness, colorVariance, contrast);
    };

    CC.determineProfession = (brightness, colorVariance, contrast) => {
        console.log('📊 Анализ изображения:');
        console.log(`   Яркость: ${brightness.toFixed(1)} (0-255)`);
        console.log(`   Цветовое разнообразие: ${colorVariance.toFixed(1)}`);
        console.log(`   Контраст: ${contrast.toFixed(1)}`);

        const scores = CC.professions.map((prof) => {
            let score = 0;

            if (brightness > 120 && brightness < 180) score += 20;
            if (colorVariance > 30) score += 15;
            if (contrast > 50) score += 15;

            if (prof.name === 'Программист' && brightness > 100 && contrast > 40) score += 20;
            if (prof.name === 'Дизайнер' && colorVariance > 40) score += 25;
            if (prof.name === 'Врач' && brightness > 110 && brightness < 160) score += 20;
            if (prof.name === 'Учитель' && brightness > 100 && contrast > 30) score += 20;
            if (prof.name === 'Предприниматель' && brightness > 120) score += 20;
            if (prof.name === 'Психолог' && brightness > 100 && brightness < 170) score += 20;
            if (prof.name === 'Инженер' && contrast > 45) score += 20;
            if (prof.name === 'Маркетолог' && brightness > 120 && colorVariance > 35) score += 20;
            if (prof.name === 'Писатель' && brightness > 100 && brightness < 180) score += 20;
            if (prof.name === 'Архитектор' && contrast > 40 && colorVariance > 30) score += 20;

            if (CC.IT_PROFESSIONS_FOR_SCORING.has(prof.name)) {
                if (brightness > 100 && contrast > 40) score += 25;
                if (colorVariance > 25) score += 15;
            }

            if (prof.name === 'Веб-разработчик' && colorVariance > 35) score += 15;
            if (prof.name === 'Frontend-разработчик' && colorVariance > 40) score += 20;
            if (prof.name === 'Аналитик данных' && contrast > 50) score += 15;
            if (prof.name === 'Специалист по ИИ/ML' && brightness > 120 && contrast > 45) score += 20;

            if (CC.TVP_PROFESSIONS.has(prof.name)) {
                if (brightness > 110 && contrast > 45) score += 30;
                if (colorVariance > 40) score += 25;
            }

            if (prof.name === '3D-художник' && colorVariance > 45) score += 20;
            if (prof.name === 'Геймдизайнер' && brightness > 120 && colorVariance > 35) score += 20;
            if (prof.name === 'VR/AR разработчик' && contrast > 50 && brightness > 110) score += 25;

            return { profession: prof, score };
        });

        scores.sort((a, b) => b.score - a.score);

        const mainScore = scores[0].score;
        const matchPercentage = Math.min(95, Math.max(65, Math.round(mainScore)));

        const others = scores
            .slice(1, 4)
            .map((s) => ({ profession: s.profession, match: Math.min(90, Math.max(50, Math.round(s.score))) }));

        console.log(`✅ Рекомендуемая профессия: ${scores[0].profession.name} (${matchPercentage}%)`);

        return {
            main: scores[0].profession,
            match: matchPercentage,
            others
        };
    };
})();

