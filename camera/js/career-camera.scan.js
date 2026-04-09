(() => {
    const CC = (window.CareerCamera = window.CareerCamera || {});

    let scannerAnimationId = null;
    let scanY = 0;
    let lastRh = 0;
    let offscreenCanvas = null;
    let offscreenCtx = null;

    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    const EDGE_STEP = 2;
    const EDGE_THRESHOLD = 70;
    const SCAN_BAND = 35;
    const SCAN_SPEED = 2;
    const CAPTURE_SCAN_SPEED = 8;

    CC.getEdgePixels = (data, w, h) => {
        const edgePixels = [];
        for (let y = 1; y < h - 1; y += EDGE_STEP) {
            for (let x = 1; x < w - 1; x += EDGE_STEP) {
                let gx = 0;
                let gy = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const i = ((y + ky) * w + (x + kx)) * 4;
                        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        const idx = (ky + 1) * 3 + (kx + 1);
                        gx += gray * sobelX[idx];
                        gy += gray * sobelY[idx];
                    }
                }
                const mag = Math.sqrt(gx * gx + gy * gy);
                if (mag > EDGE_THRESHOLD) edgePixels.push({ x, y });
            }
        }
        return edgePixels;
    };

    function contourScannerLoop() {
        if (!CC.stream || !CC.ui.video.videoWidth) {
            scannerAnimationId = requestAnimationFrame(contourScannerLoop);
            return;
        }

        const w = CC.ui.video.videoWidth;
        const h = CC.ui.video.videoHeight;
        const contourCanvas = CC.ui.contourCanvas;
        const scanLineEl = CC.ui.scanLine;

        const fr = CC.getActiveFocusRectForSize(w, h);
        const rx = Math.max(0, Math.min(fr.x, w - 1));
        const ry = Math.max(0, Math.min(fr.y, h - 1));
        const rw = Math.max(1, Math.min(fr.width, w - rx));
        const rh = Math.max(1, Math.min(fr.height, h - ry));
        if (rh !== lastRh) {
            scanY = 0;
            lastRh = rh;
        }

        if (!offscreenCanvas || offscreenCanvas.width !== w) {
            offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = w;
            offscreenCanvas.height = h;
            offscreenCtx = offscreenCanvas.getContext('2d');
        }
        if (!contourCanvas) return;

        contourCanvas.width = w;
        contourCanvas.height = h;
        contourCanvas.style.display = 'block';

        offscreenCtx.drawImage(CC.ui.video, 0, 0);
        const imgData = offscreenCtx.getImageData(0, 0, w, h);
        const edgePixels = CC.getEdgePixels(imgData.data, w, h);

        scanY = (scanY + SCAN_SPEED) % Math.max(rh, 1);
        const scanCenter = ry + scanY;

        const ctx = contourCanvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.beginPath();
        ctx.rect(rx, ry, rw, rh);
        ctx.clip();

        const pixelSize = Math.max(1.5, Math.min(3, w / 240));

        edgePixels.forEach((p) => {
            if (p.x < rx || p.x >= rx + rw || p.y < ry || p.y >= ry + rh) return;
            const d = Math.abs(p.y - scanCenter);
            let alpha = 0;
            if (d < SCAN_BAND) {
                alpha = 1 - d / SCAN_BAND;
                alpha = 0.3 + alpha * 0.7;
            }
            if (alpha > 0) {
                ctx.shadowColor = '#00ff88';
                ctx.shadowBlur = 8;
                ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, pixelSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.shadowBlur = 0;
        ctx.restore();

        if (scanLineEl) {
            scanLineEl.style.top = rh > 0 ? (scanY / rh) * 100 + '%' : '0%';
        }

        scannerAnimationId = requestAnimationFrame(contourScannerLoop);
    }

    CC.startContourScanner = () => {
        scanY = 0;
        lastRh = 0;
        if (scannerAnimationId) cancelAnimationFrame(scannerAnimationId);
        scannerAnimationId = requestAnimationFrame(contourScannerLoop);
    };

    CC.stopContourScanner = () => {
        if (scannerAnimationId) {
            cancelAnimationFrame(scannerAnimationId);
            scannerAnimationId = null;
        }
    };

    CC.runCaptureScan = (edgePixels, w, h, onComplete) => {
        const contourCanvas = CC.ui.contourCanvas;
        const scanLineEl = CC.ui.scanLine;
        if (!contourCanvas || !scanLineEl) {
            onComplete();
            return;
        }

        const fr = CC.getActiveFocusRectForSize(w, h);
        const rx = Math.max(0, Math.min(fr.x, w - 1));
        const ry = Math.max(0, Math.min(fr.y, h - 1));
        const rw = Math.max(1, Math.min(fr.width, w - rx));
        const rh = Math.max(1, Math.min(fr.height, h - ry));

        let captureScanY = 0;

        function frame() {
            const scanCenter = ry + captureScanY;

            const ctx = contourCanvas.getContext('2d');
            ctx.clearRect(0, 0, w, h);
            ctx.save();
            ctx.beginPath();
            ctx.rect(rx, ry, rw, rh);
            ctx.clip();

            const pixelSize = Math.max(1.5, Math.min(3, w / 240));

            edgePixels.forEach((p) => {
                if (p.x < rx || p.x >= rx + rw || p.y < ry || p.y >= ry + rh) return;
                const d = Math.abs(p.y - scanCenter);
                let alpha = 0;
                if (d < SCAN_BAND) {
                    alpha = 1 - d / SCAN_BAND;
                    alpha = 0.3 + alpha * 0.7;
                }
                if (alpha > 0) {
                    ctx.shadowColor = '#00ff88';
                    ctx.shadowBlur = 8;
                    ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, pixelSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.shadowBlur = 0;
            ctx.restore();

            scanLineEl.style.top = rh > 0 ? (captureScanY / rh) * 100 + '%' : '0%';

            captureScanY += CAPTURE_SCAN_SPEED;
            if (captureScanY < rh + SCAN_BAND) {
                requestAnimationFrame(frame);
            } else {
                onComplete();
            }
        }

        requestAnimationFrame(frame);
    };
})();

