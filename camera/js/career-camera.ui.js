(() => {
    const CC = (window.CareerCamera = window.CareerCamera || {});

    CC.IS_HIDDEN_CLASS = 'is-hidden';

    CC.ui = {
        video: document.getElementById('video'),
        captureCanvas: document.getElementById('captureCanvas'),
        contourCanvas: document.getElementById('contourCanvas'),
        overlay: document.getElementById('overlay'),
        scanLine: document.getElementById('scanLine'),
        startCameraBtn: document.getElementById('startCameraBtn'),
        analyzeBtn: document.getElementById('analyzeBtn'),
        retryBtn: document.getElementById('retryBtn'),
        status: document.getElementById('status'),
        resultSection: document.getElementById('resultSection'),
        techProgressWrap: document.getElementById('techProgressWrap'),
        techProgressBar: document.getElementById('techProgressBar'),
        techProgressLabel: document.getElementById('techProgressLabel'),
        professionIcon: document.getElementById('professionIcon'),
        professionName: document.getElementById('professionName'),
        professionDescription: document.getElementById('professionDescription'),
        professionSkills: document.getElementById('professionSkills'),
        matchPercentage: document.getElementById('matchPercentage'),
        professionSalary: document.getElementById('professionSalary'),
        otherProfessions: document.getElementById('otherProfessions'),
        recommendedTopics: document.getElementById('recommendedTopics')
    };

    CC.show = (el) => {
        if (!el) return;
        el.classList.remove(CC.IS_HIDDEN_CLASS);
    };

    CC.hide = (el) => {
        if (!el) return;
        el.classList.add(CC.IS_HIDDEN_CLASS);
    };

    CC.setStatus = (text, type) => {
        if (!CC.ui.status) return;
        CC.ui.status.textContent = text;
        CC.ui.status.className = `status-message ${type}`;
    };
})();
