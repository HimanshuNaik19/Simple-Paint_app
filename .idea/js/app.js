(function () {
    'use strict';
    const canvas = document.getElementById('paintCanvas');
    const hitMissEl = document.getElementById('hitMiss');
    const resetBtn = document.getElementById('resetBtn');

    if (!canvas || !hitMissEl || !resetBtn) {
        return;
    }

    const ctx = canvas.getContext('2d');
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    const circles = [];
    let hue = 0;

    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let previewRadius = 0;

    let lastSyntheticClickTime = 0;

    let resizeRAF = 0;

    function setCanvasSize() {
        const rect = canvas.getBoundingClientRect();
        dpr = Math.max(1, window.devicePixelRatio || 1);

        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        redraw();
    }

    function debounceResize() {
        if (resizeRAF) cancelAnimationFrame(resizeRAF);
        resizeRAF = requestAnimationFrame(setCanvasSize);
    }

    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        return { x, y };
    }

    function distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function pointInCircle(px, py, circle) {
        const dx = px - circle.x;
        const dy = py - circle.y;
        return (dx * dx + dy * dy) <= (circle.r * circle.r);
    }

    function findTopmostCircleAt(px, py) {
        for (let i = circles.length - 1; i >= 0; i--) {
            if (pointInCircle(px, py, circles[i])) {
                return i;
            }
        }
        return -1;
    }

    function nextColor() {
        const color = `hsl(${hue}, 75%, 55%)`;
        hue = (hue + 37) % 360;
        return color;
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }

    function drawCircle(x, y, r, fill, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.restore();
    }

    function redraw() {
        clearCanvas();
        for (const c of circles) {
            drawCircle(c.x, c.y, c.r, c.fill, 1);
        }
        if (isDragging && previewRadius > 0) {
            drawCircle(dragStart.x, dragStart.y, previewRadius, 'hsl(210, 10%, 20%)', 0.12);
            ctx.save();
            ctx.beginPath();
            ctx.arc(dragStart.x, dragStart.y, previewRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(55,65,81,0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
    }

    function showHitMiss(text, clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const localX = clientX - rect.left;
        const localY = clientY - rect.top;

        hitMissEl.textContent = text;
        hitMissEl.style.left = `${localX}px`;
        hitMissEl.style.top = `${localY}px`;
        hitMissEl.style.opacity = '1';

        window.clearTimeout(showHitMiss._timer);
        showHitMiss._timer = window.setTimeout(() => {
            hitMissEl.style.opacity = '0';
        }, 700);
    }

    function onMouseDown(evt) {
        const pos = getMousePos(evt);
        isDragging = true;
        dragStart = pos;
        previewRadius = 0;
        redraw();
    }

    function onMouseMove(evt) {
        if (!isDragging) return;
        const pos = getMousePos(evt);
        previewRadius = distance(dragStart, pos);
        redraw();
    }

    function onMouseUp(evt) {
        if (!isDragging) return;
        const pos = getMousePos(evt);
        const r = distance(dragStart, pos);
        const CLICK_THRESHOLD = 3;

        if (r < CLICK_THRESHOLD) {

            const idx = findTopmostCircleAt(pos.x, pos.y);
            showHitMiss(idx >= 0 ? 'Hit' : 'Miss', evt.clientX, evt.clientY);
            lastSyntheticClickTime = Date.now();

        } else {

            const fill = nextColor();
            circles.push({ x: dragStart.x, y: dragStart.y, r, fill });
            redraw();
        }

        isDragging = false;
        previewRadius = 0;
    }

    function onClick(evt) {
        if (Date.now() - lastSyntheticClickTime < 250) {
            return;
        }
        const pos = getMousePos(evt);
        const idx = findTopmostCircleAt(pos.x, pos.y);
        showHitMiss(idx >= 0 ? 'Hit' : 'Miss', evt.clientX, evt.clientY);
    }

    function onDblClick(evt) {
        const pos = getMousePos(evt);
        const idx = findTopmostCircleAt(pos.x, pos.y);
        if (idx >= 0) {
            circles.splice(idx, 1);
            redraw();
        }
    }

    function onReset() {
        circles.length = 0;
        hue = 0;
        redraw();
    }

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('dblclick', onDblClick);
    resetBtn.addEventListener('click', onReset);
    window.addEventListener('resize', debounceResize);

    setCanvasSize();
    redraw();
})();