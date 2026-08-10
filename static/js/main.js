// ===== PRIVACY-AWARE PRODUCT ANALYTICS =====
(function() {
    var analytics = window.HousoraAnalytics = window.HousoraAnalytics || {};
    var initialized = false;
    var identifiedUserId = null;
    function consent() {
        try {
            var value = JSON.parse(localStorage.getItem('housora-consent-v1') || 'null');
            if (value) return value;
            var legacy = JSON.parse(localStorage.getItem('cookiebot-consent') || 'null');
            if (legacy) return { necessary: true, preferences: !!legacy.preferences, analytics: !!legacy.statistics, marketing: !!legacy.marketing };
        } catch (_) { return null; }
        return null;
    }
    analytics.isAllowed = function() { var value = consent(); return !!(value && value.analytics === true); };
    analytics.init = function() {
        if (initialized || !analytics.isAllowed() || !window.posthog || !window.HousoraPostHog || !window.HousoraPostHog.key) return;
        initialized = true;
        window.posthog.init(window.HousoraPostHog.key, {
            api_host: window.HousoraPostHog.host,
            autocapture: true, capture_pageview: true, capture_pageleave: true,
            disable_session_recording: false,
            session_recording: { maskAllInputs: true, blockClass: 'ph-no-capture' },
            persistence: 'localStorage+cookie', person_profiles: 'identified_only'
        });
        analytics.track('analytics_consent_granted');
        if (window.Clerk && window.Clerk.user) analytics.identify(window.Clerk.user);
    };
    analytics.track = function(name, properties) {
        if (!initialized || !window.posthog || !analytics.isAllowed()) return;
        try { window.posthog.capture(name, properties || {}); } catch (_) {}
    };
    analytics.identify = function(user) {
        if (!initialized || !window.posthog || !user || !user.id || identifiedUserId === user.id) return;
        identifiedUserId = user.id;
        try { window.posthog.identify(user.id, { plan: window.HousoraUserPlan || 'unknown' }); } catch (_) {}
    };
    analytics.reset = function() { identifiedUserId = null; if (window.posthog && initialized) { try { window.posthog.reset(); } catch (_) {} } };
    window.addEventListener('clerk:ready', function(e) {
        analytics.init();
        if (e.detail && e.detail.clerk) analytics.identify(e.detail.clerk.user);
    });
})();

// ===== BEFORE/AFTER SLIDER =====
function initSliders() {
    document.querySelectorAll('.demo-slider-container').forEach(function(container) {
        var handle = container.querySelector('.demo-slider-handle');
        var divider = container.querySelector('.demo-slider-divider');
        var beforeLayer = container.querySelector('.demo-slider-before');
        if (!handle || !beforeLayer) return;

        var isDragging = false;

        function updateSlider(pct) {
            pct = Math.max(5, Math.min(95, pct));
            handle.style.left = pct + '%';
            if (divider) divider.style.left = pct + '%';
            beforeLayer.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
        }

        function getPct(clientX) {
            var rect = container.getBoundingClientRect();
            return ((clientX - rect.left) / rect.width) * 100;
        }

        // Mouse events
        handle.addEventListener('mousedown', function(e) {
            isDragging = true;
            e.preventDefault();
            container.style.cursor = 'ew-resize';
        });
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            e.preventDefault();
            updateSlider(getPct(e.clientX));
        });
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                container.style.cursor = '';
            }
        });

        // Touch events
        handle.addEventListener('touchstart', function(e) {
            isDragging = true;
        }, { passive: true });
        document.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            updateSlider(getPct(e.touches[0].clientX));
        }, { passive: true });
        document.addEventListener('touchend', function() {
            isDragging = false;
        });

        // Click on container to jump
        container.addEventListener('click', function(e) {
            if (e.target === handle || handle.contains(e.target)) return;
            updateSlider(getPct(e.clientX));
        });

        // Set initial state (15% from left = 15% of image is "before")
        updateSlider(15);
    });
}

// ===== HERO TEXT ROTATION =====
function initHeroRotation() {
    // CreatePage and tool pages each own their rotating headline. The pages
    // already include a scoped rotator, so a global query here made desktop
    // and mobile headlines fight each other and randomly hide the wrong word.
}

function initHeroSlideshow() {
    // ToolPageTemplate owns its slideshow. Keep this initializer for the
    // CreatePage slideshow only so two timers do not animate the same images.
    if (document.body.classList.contains('page-tool')) return;
    var slides = document.querySelectorAll('.hero-desktop-slide');
    if (slides.length <= 1) return;
    var current = 0;
    var mainInterval = null;
    function startSlideshow() {
        mainInterval = setInterval(function() {
            slides[current].classList.remove('hero-desktop-slide--active');
            current = (current + 1) % slides.length;
            slides[current].classList.add('hero-desktop-slide--active');
        }, 3000);
    }
    startSlideshow();
    var slideshow = document.querySelector('.hero-desktop-slideshow');
    if (slideshow) {
        slideshow.addEventListener('mouseenter', function() {
            if (mainInterval) { clearInterval(mainInterval); mainInterval = null; }
        });
        slideshow.addEventListener('mouseleave', function() {
            if (!mainInterval) startSlideshow();
        });
    }
}

function initMobileHeroSlideshow() {
    if (document.body.classList.contains('page-tool')) return;
    var slides = document.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;
    var current = 0;
    setInterval(function() {
        slides[current].classList.remove('hero-slide--active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('hero-slide--active');
    }, 3000);
}

function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() {
            var dataUrl = String(reader.result || '');
            var commaIndex = dataUrl.indexOf(',');
            resolve(commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1));
        };
        reader.onerror = function() { reject(new Error('Could not read the selected image.')); };
        reader.readAsDataURL(file);
    });
}

async function generateImage(prompt, file) {
    if (!file) throw new Error('Please upload a room image first.');
    var reservation = null;
    var signedIn = window.convexClient && window.Clerk && window.Clerk.user && window.Housora && (window.Housora.deductImages || window.Housora.deductCredits);
    if (!signedIn) {
        var guestUsed = false;
        try { guestUsed = localStorage.getItem('housora_guest_generation_used') === '1'; } catch (_) {}
        if (guestUsed) {
            if (window.housoraOpenAuth) window.housoraOpenAuth('signup', { redirect: window.location.pathname + window.location.search });
            throw new Error('Your free design has been used. Sign up or sign in to create another image.');
        }
    }
    if (signedIn) {
        reservation = await (window.Housora.deductImages || window.Housora.deductCredits)(1);
        if (!reservation) throw new Error('You do not have any image generations remaining on your plan.');
    }
    var image = await fileToBase64(file);
    var endpoint = '/api/generate';
    var startedAt = Date.now();
    window.HousoraAnalytics.track('generation_started', { tool: document.body.dataset.tool || document.title.split('|')[0].trim() || 'design' });
    try {
        var response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: String(prompt || '').trim(), image: image })
        });
        if (!response.ok) {
            var payload = await response.json().catch(function() { return {}; });
            throw new Error(payload.error || 'Generation failed.');
        }
        var blob = await response.blob();
        if (!blob.size || !blob.type.startsWith('image/')) throw new Error('Image provider did not return an image.');
        var resultUrl = await new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function() { resolve(reader.result); };
            reader.onerror = function() { reject(new Error('Could not prepare the generated image.')); };
            reader.readAsDataURL(blob);
        });
        if (reservation && reservation.generationId) {
            await window.convexClient.mutation('users:completeGeneration', { generationId: reservation.generationId, outputImageUrl: resultUrl });
        }
        if (!signedIn) {
            try { localStorage.setItem('housora_guest_generation_used', '1'); } catch (_) {}
        }
        window.HousoraAnalytics.track('generation_succeeded', { duration_ms: Date.now() - startedAt });
        return resultUrl;
    } catch (error) {
        if (reservation && reservation.generationId && window.convexClient) {
            await window.convexClient.mutation('users:failGeneration', { generationId: reservation.generationId }).catch(function() {});
        }
        window.HousoraAnalytics.track('generation_failed', { duration_ms: Date.now() - startedAt, error_code: error && error.message ? String(error.message).slice(0, 80) : 'unknown' });
        throw error;
    }
}

async function requestHousoraGeneration(prompt, file) {
    return generateImage(prompt, file);
}

function initReferenceStyleTool() {
    var page = document.querySelector('.reference-style-page');
    if (!page) return;
    var referenceInput = document.getElementById('referenceFileInput');
    var roomInput = document.getElementById('referenceRoomFileInput');
    var referenceZone = document.getElementById('referenceUploadZone');
    var roomZone = document.getElementById('referenceRoomUploadZone');
    var referencePreview = document.getElementById('referencePreview');
    var roomPreview = document.getElementById('referenceRoomPreview');
    var generateBtn = document.getElementById('referenceGenerateBtn');
    var referenceFile = null;
    var roomFile = null;

    function preview(file, zone, image, emptyText) {
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function() { image.src = reader.result; image.hidden = false; zone.querySelector('span').hidden = true; };
        reader.readAsDataURL(file);
        zone.setAttribute('aria-label', emptyText + ': ' + file.name);
    }
    function bind(input, zone, image, setter, emptyText) {
        zone.addEventListener('click', function() { input.click(); });
        zone.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
        input.addEventListener('change', function() { if (this.files && this.files[0]) { setter(this.files[0]); preview(this.files[0], zone, image, emptyText); } });
    }
    bind(referenceInput, referenceZone, referencePreview, function(file) { referenceFile = file; }, 'Reference image');
    bind(roomInput, roomZone, roomPreview, function(file) { roomFile = file; }, 'Room image');

    var preloaded = page.getAttribute('data-reference-src');
    if (preloaded && referencePreview) { referencePreview.src = preloaded; referencePreview.hidden = false; referenceZone.querySelector('span').hidden = true; }
    generateBtn.addEventListener('click', function() {
        if (!referenceFile && !preloaded) { alert('Please upload a reference image first.'); return; }
        if (!roomFile) { alert('Please upload your room photo first.'); return; }
        var room = document.getElementById('referenceRoomType')?.value || 'Living Room';
        var style = document.getElementById('referenceStyleSelect')?.value || 'the reference image style';
        var palette = document.getElementById('referencePalette')?.value || 'natural';
        var prompt = 'Redesign the uploaded room photo using the visual style, materials, colors, furniture language, lighting mood, and composition cues from the uploaded reference image. Preserve the room photo architecture, camera angle, windows, doors, proportions, and perspective. Room type: ' + room + '. Style direction: ' + style + '. Color palette: ' + palette + '. Return one photorealistic result with no text, watermark, collage, or extra rooms.';
        var original = generateBtn.innerHTML;
        generateBtn.disabled = true; generateBtn.setAttribute('aria-busy', 'true'); generateBtn.innerHTML = 'Generating...';
        requestHousoraGeneration(prompt, roomFile).then(showGeneratedHousoraImage).catch(function(error) { alert(error.message || 'Generation failed. Please try again.'); }).finally(function() { generateBtn.disabled = false; generateBtn.removeAttribute('aria-busy'); generateBtn.innerHTML = original; });
    });
}

function showGeneratedHousoraImage(imageUrl) {
    var target = document.querySelector('#heroPreviewImg, #uploadPreviewImg, .generated-result img');
    if (target) {
        target.src = imageUrl;
        target.alt = 'AI-generated room redesign';
    }
    var result = document.querySelector('.generated-result');
    if (!result) {
        result = document.createElement('div');
        result.className = 'generated-result ph-no-capture';
        result.innerHTML = '<p class="generated-result-label">YOUR AI DESIGN</p><img alt="AI-generated room redesign"><a class="btn-primary" download="housora-design.png">DOWNLOAD DESIGN</a>';
        var host = document.querySelector('.id-configure-section, .create-page') || document.body;
        host.appendChild(result);
    }
    var img = result.querySelector('img');
    var link = result.querySelector('a');
    img.src = imageUrl;
    link.href = imageUrl;
    result.style.display = 'block';
    var currentProject = localStorage.getItem('housora_current_project');
    if (currentProject && window.convexClient && window.Clerk && window.Clerk.user) {
        persistGeneratedProjectImage(currentProject, imageUrl);
    }
    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function persistGeneratedProjectImage(projectId, dataUrl) {
    try {
        var uploadUrl = await window.convexClient.mutation('uploads:generateUploadUrl', {});
        var blob = await (await fetch(dataUrl)).blob();
        var uploadResponse = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': blob.type || 'image/png' }, body: blob });
        if (!uploadResponse.ok) throw new Error('Image upload failed');
        var storageId = (await uploadResponse.json()).storageId;
        var permanentUrl = await window.convexClient.query('uploads:getStorageUrl', { storageId: storageId });
        if (!permanentUrl) throw new Error('Image URL was not created');
        await window.convexClient.mutation('projects:updateProject', { projectId: projectId, afterImageUrl: permanentUrl });
    } catch (error) {
        console.warn('[Projects] Could not save generated image:', error);
    }
}

// ===== HERO BAR INTERACTIONS =====
function initHeroBar() {
    var promptInput = document.getElementById('heroPromptInput');
    var fileInput = document.getElementById('heroFileInput');
    var uploadBtn = document.getElementById('heroUploadBtn');
    var submitBtn = document.getElementById('heroSubmitBtn');
    var preview = document.getElementById('heroPreview');
    var previewImg = document.getElementById('heroPreviewImg');
    var previewRemove = document.getElementById('heroPreviewRemove');
    var errorEl = document.getElementById('heroBarError');

    if (!promptInput || !fileInput || !uploadBtn || !submitBtn) return;
    if (preview) preview.classList.add('ph-no-capture');

    var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    var MAX_SIZE = 10 * 1024 * 1024;
    var selectedFile = null;

    // ---- Helpers ----
    function showError(msg) {
        if (!errorEl) return;
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
        errorEl.setAttribute('role', 'alert');
        errorEl.setAttribute('aria-live', 'assertive');
    }
    function clearError() {
        if (!errorEl) return;
        errorEl.textContent = '';
        errorEl.style.display = 'none';
        errorEl.removeAttribute('role');
        errorEl.removeAttribute('aria-live');
    }
    function updateSubmitState() {
        var hasPrompt = promptInput.value.trim().length > 0;
        var hasImage = selectedFile !== null;
        var enabled = hasPrompt || hasImage;
        submitBtn.disabled = !enabled;
        if (enabled) {
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        } else {
            submitBtn.style.opacity = '0.45';
            submitBtn.style.cursor = 'not-allowed';
        }
    }
    function showPreview(file) {
        if (!preview || !previewImg) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        uploadBtn.classList.add('has-image');
            window.HousoraAnalytics.track('image_uploaded', { file_type: file.type, file_size_bucket: file.size < 1000000 ? 'small' : file.size < 5000000 ? 'medium' : 'large' });
        };
        reader.readAsDataURL(file);
    }
    function clearPreview() {
        selectedFile = null;
        if (preview) preview.style.display = 'none';
        if (previewImg) previewImg.src = '';
        if (uploadBtn) uploadBtn.classList.remove('has-image');
        if (fileInput) fileInput.value = '';
        updateSubmitState();
    }

    // ---- Upload button opens file input ----
    uploadBtn.addEventListener('click', function() {
        clearError();
        var studio = document.getElementById('designStudio');
        if (studio) studio.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var demoBtn = document.getElementById('demoPhotoBtn');
        if (demoBtn) window.setTimeout(function() { demoBtn.focus(); }, 450);
    });

    // ---- Keyboard: Enter/Space on upload button ----
    uploadBtn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            var studio = document.getElementById('designStudio');
            if (studio) studio.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // ---- File input change ----
    fileInput.addEventListener('change', function() {
        if (!this.files || !this.files.length) return;
        var file = this.files[0];
        clearError();

        if (ALLOWED_TYPES.indexOf(file.type) === -1) {
            showError('Invalid file type. Please upload a JPG, PNG, or WebP image.');
            this.value = '';
            return;
        }
        if (file.size > MAX_SIZE) {
            showError('File is too large. Maximum size is 10 MB.');
            this.value = '';
            return;
        }

        selectedFile = file;
        showPreview(file);
        updateSubmitState();
    });

    // ---- Prompt input enables/disables submit ----
    promptInput.addEventListener('input', function() {
        clearError();
        updateSubmitState();
    });

    // ---- Prompt input: Enter submits (Shift+Enter for newline) ----
    promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!submitBtn.disabled) submitBtn.click();
        }
    });

    // ---- Remove preview ----
    if (previewRemove) {
        previewRemove.addEventListener('click', function() {
            clearPreview();
        });
        previewRemove.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clearPreview();
            }
        });
    }

    // ---- Submit button click ----
    submitBtn.addEventListener('click', function() {
        clearError();
        var prompt = promptInput.value.trim();
        var hasImage = selectedFile !== null;

        if (!prompt && !hasImage) {
            showError('Please enter a design prompt or upload a photo of your room.');
            promptInput.focus();
            return;
        }

        if (!prompt) {
            showError('Please describe what you want (e.g. "Make it modern Scandinavian").');
            promptInput.focus();
            return;
        }

        if (!hasImage) {
            showError('Please upload a photo of your room to redesign.');
            uploadBtn.focus();
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.style.opacity = '0.6';
        submitBtn.innerHTML = '<span class="hero-submit-spinner"></span>';

        requestHousoraGeneration(prompt, selectedFile).then(function(imageUrl) {
            showGeneratedHousoraImage(imageUrl);
        }).catch(function(error) {
            showError(error.message);
        }).finally(function() {
            submitBtn.disabled = false;
            submitBtn.setAttribute('aria-busy', 'false');
            submitBtn.style.opacity = '1';
            submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
        });
    });

    // ---- Focus management: focus-visible for keyboard users ----
    submitBtn.addEventListener('focus', function() {
        if (this.disabled) this.blur();
    });

    // Initial state
    updateSubmitState();
}

// ===== HERO BAR MOBILE =====
function initHeroBarMobile() {
    var promptInput = document.getElementById('heroPromptInputMobile');
    var fileInput = document.getElementById('heroFileInputMobile');
    var uploadBtn = document.getElementById('heroUploadBtnMobile');
    var submitBtn = document.getElementById('heroSubmitBtnMobile');
    if (!promptInput || !fileInput || !uploadBtn || !submitBtn) return;

    var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    var MAX_SIZE = 10 * 1024 * 1024;
    var selectedFile = null;

    function updateSubmitState() {
        var hasPrompt = promptInput.value.trim().length > 0;
        var hasImage = selectedFile !== null;
        var enabled = hasPrompt || hasImage;
        submitBtn.disabled = !enabled;
        submitBtn.style.opacity = enabled ? '1' : '0.45';
        submitBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
    }

    uploadBtn.addEventListener('click', function() {
        var studio = document.getElementById('designStudio');
        if (studio) studio.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var demoBtn = document.getElementById('demoPhotoBtn');
        if (demoBtn) window.setTimeout(function() { demoBtn.focus(); }, 450);
    });
    uploadBtn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); uploadBtn.click(); }
    });

    fileInput.addEventListener('change', function() {
        if (!this.files || !this.files.length) return;
        var file = this.files[0];
        if (ALLOWED_TYPES.indexOf(file.type) === -1) { this.value = ''; return; }
        if (file.size > MAX_SIZE) { this.value = ''; return; }
        selectedFile = file;
        updateSubmitState();
    });

    promptInput.addEventListener('input', function() { updateSubmitState(); });
    promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!submitBtn.disabled) submitBtn.click(); }
    });

    submitBtn.addEventListener('click', function() {
        var prompt = promptInput.value.trim();
        var hasImage = selectedFile !== null;
        if (!prompt && !hasImage) return;

        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.innerHTML = '<span class="hero-submit-spinner"></span>';

        requestHousoraGeneration(prompt, selectedFile).then(function(imageUrl) {
            showGeneratedHousoraImage(imageUrl);
        }).catch(function(error) {
            var errorEl = document.getElementById('heroBarError');
            if (errorEl) { errorEl.textContent = error.message; errorEl.style.display = 'block'; }
        }).finally(function() {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
        });
    });

    updateSubmitState();
}

// ===== ROOM/STYLE SELECTORS =====
function initCreateSelectors() {
    var roomImages = {
        'living': { before: '/static/images/room-before.jpg', after: '/static/images/room-after.jpg' },
        'dining': { before: '/static/images/interior-before.jpg', after: '/static/images/interior-after.jpg' },
        'bedroom': { before: '/static/images/try-before.jpg', after: '/static/images/try-after.jpg' }
    };
    var styleImages = {
        'minimalist': '/static/images/layout-after.jpg',
        'scandinavian': '/static/images/room-after.jpg',
        'modern': '/static/images/interior-after.jpg',
        'japandi': '/static/images/s-warm-min.jpg',
        'industrial': '/static/images/interior-industrial.jpg',
        'luxury': '/static/images/s-luxury-render.jpg'
    };
    var roomAfterImages = {
        'living': '/static/images/room-after.jpg',
        'dining': '/static/images/interior-after.jpg',
        'bedroom': '/static/images/try-after.jpg',
        'kitchen': '/static/images/kitchen-after.jpg',
        'bathroom': '/static/images/bathroom-minimalist.jpg',
        'office': '/static/images/interior-after.jpg'
    };

    var currentRoom = 'living';
    var currentStyle = 'scandinavian';

    // The homepage has one upload entry point: the first-design configurator.
    var demoInput = document.getElementById('demoPhotoInput');
    var demoBtn = document.getElementById('demoPhotoBtn');
    var demoPreview = document.getElementById('demoPhotoPreview');
    var demoPreviewImg = document.getElementById('demoPhotoPreviewImg');
    var demoRemove = document.getElementById('demoPhotoRemove');
    var demoName = document.getElementById('demoPhotoName');
    var demoError = document.getElementById('demoPhotoError');
    var demoFile = null;
    function showDemoError(message) {
        if (!demoError) return;
        demoError.textContent = message;
        demoError.style.display = 'block';
    }
    function clearDemoUpload() {
        demoFile = null;
        if (demoInput) demoInput.value = '';
        if (demoPreview) demoPreview.style.display = 'none';
        if (demoPreviewImg) demoPreviewImg.src = '';
        if (demoName) demoName.textContent = '';
        if (demoError) demoError.style.display = 'none';
    }
    if (demoBtn && demoInput) {
        demoBtn.addEventListener('click', function() { demoInput.click(); });
        demoInput.addEventListener('change', function() {
            var file = this.files && this.files[0];
            if (!file) return;
            if (['image/jpeg', 'image/png', 'image/webp'].indexOf(file.type) === -1) {
                showDemoError('Please upload a JPG, PNG, or WebP image.');
                this.value = '';
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                showDemoError('This image is too large. The maximum size is 10 MB.');
                this.value = '';
                return;
            }
            demoFile = file;
            if (demoName) demoName.textContent = file.name;
            var reader = new FileReader();
            reader.onload = function(e) {
                if (demoPreviewImg) demoPreviewImg.src = e.target.result;
                if (demoPreview) demoPreview.style.display = 'flex';
                if (demoError) demoError.style.display = 'none';
                try { sessionStorage.setItem('housora_first_design_photo', e.target.result); } catch (storageError) { console.warn('Could not preserve upload for workspace handoff', storageError); }
            };
            reader.readAsDataURL(file);
        });
    }
    if (demoRemove) demoRemove.addEventListener('click', clearDemoUpload);

    function updateDemoImages(source) {
        var afterImg = document.querySelector('.demo-slider-after img');
        // Keep the same neutral “before” room as a stable reference. Only the
        // after mockup changes when the user chooses a room or style.
        if (afterImg) afterImg.src = source === 'style' ? (styleImages[currentStyle] || roomAfterImages[currentRoom]) : (roomAfterImages[currentRoom] || styleImages[currentStyle] || roomAfterImages.living);
    }

    // Room selector
    document.querySelectorAll('.demo-style-pill[data-room]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.demo-style-pill[data-room]').forEach(function(b) {
                b.classList.remove('demo-style-pill-active');
            });
            this.classList.add('demo-style-pill-active');
            currentRoom = this.getAttribute('data-room');
            updateDemoImages('room');
        });
    });

    // Style selector
    document.querySelectorAll('.demo-style-pill[data-style]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.demo-style-pill[data-style]').forEach(function(b) {
                b.classList.remove('demo-style-pill-active');
            });
            this.classList.add('demo-style-pill-active');
            currentStyle = this.getAttribute('data-style');
            updateDemoImages('style');
        });
    });

    // Budget slider
    var budgetSlider = document.getElementById('budgetSlider');
    var budgetAmount = document.getElementById('budgetAmount');
    if (budgetSlider && budgetAmount) {
        budgetSlider.addEventListener('input', function() {
            budgetAmount.textContent = '$' + parseInt(this.value).toLocaleString();
        });
    }

    // Start button
    var startBtn = document.getElementById('demoStartBtn');
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            if (!demoFile) {
                if (demoInput) demoInput.click();
                else if (demoBtn) demoBtn.focus();
                return;
            }
            var room = document.querySelector('.demo-style-pill[data-room].demo-style-pill-active');
            var style = document.querySelector('.demo-style-pill[data-style].demo-style-pill-active');
            var budget = document.getElementById('budgetSlider');
            var roomValue = room ? room.getAttribute('data-room') : 'living';
            var styleValue = style ? style.getAttribute('data-style') : 'scandinavian';
            var budgetValue = budget ? budget.value : '5000';
            try { sessionStorage.setItem('housora_first_design_options', JSON.stringify({ room: roomValue, style: styleValue, palette: 'neutral', budget: budgetValue })); } catch (storageError) {}
            window.location.href = '/design?room=' + encodeURIComponent(roomValue) + '&style=' + encodeURIComponent(styleValue) + '&budget=' + encodeURIComponent(budgetValue);
        });
    }
}

// ===== PRODUCT HOTSPOTS =====
function initHotspots() {
    var products = {
        'demoHotspot1': { name: 'Oak Block Coffee Table', brand: 'HAY', price: '$1,970' },
        'demoHotspot2': { name: 'Woven Lounge Chair', brand: 'Muuto', price: '$2,450' },
        'demoHotspot3': { name: 'Pendant Light', brand: 'Muuto', price: '$892' }
    };

    var activeHotspot = null;

    document.querySelectorAll('.demo-hotspot').forEach(function(hotspot) {
        var dot = hotspot.querySelector('.demo-hotspot-dot');
        if (!dot) return;

        dot.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = hotspot.id;

            // Toggle active state
            if (activeHotspot === hotspot) {
                hotspot.classList.remove('demo-hotspot-active');
                activeHotspot = null;
                return;
            }

            // Deactivate previous
            if (activeHotspot) activeHotspot.classList.remove('demo-hotspot-active');

            // Activate this one
            hotspot.classList.add('demo-hotspot-active');
            activeHotspot = hotspot;

            // Update card content if product data exists
            var product = products[id];
            if (product) {
                var nameEl = hotspot.querySelector('.demo-hotspot-card-name');
                var brandEl = hotspot.querySelector('.demo-hotspot-card-brand');
                var priceEl = hotspot.querySelector('.demo-hotspot-card-price');
                if (nameEl) nameEl.textContent = product.name;
                if (brandEl) brandEl.innerHTML = product.brand + ' &bull; <span class="demo-hotspot-card-price">' + product.price + '</span>';
            }

            // Clamp card to viewport
            var card = hotspot.querySelector('.demo-hotspot-card');
            if (card) {
                requestAnimationFrame(function() {
                    var cardRect = card.getBoundingClientRect();
                    var viewportW = window.innerWidth;
                    var viewportH = window.innerHeight;

                    // Horizontal clamp
                    if (cardRect.left < 8) {
                        card.style.transform = 'translateX(' + (8 - cardRect.left - (hotspot.offsetWidth / 2)) + 'px) translateY(0)';
                    } else if (cardRect.right > viewportW - 8) {
                        card.style.transform = 'translateX(' + (viewportW - 8 - cardRect.right + (hotspot.offsetWidth / 2)) + 'px) translateY(0)';
                    }

                    // If card goes above viewport, show below instead
                    if (cardRect.top < 8) {
                        card.style.bottom = 'auto';
                        card.style.top = 'calc(100% + 10px)';
                        card.style.setProperty('--arrow-top', 'auto');
                    }
                });
            }
        });
    });

    // Close on click outside
    document.addEventListener('click', function() {
        if (activeHotspot) {
            activeHotspot.classList.remove('demo-hotspot-active');
            activeHotspot = null;
        }
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && activeHotspot) {
            activeHotspot.classList.remove('demo-hotspot-active');
            activeHotspot = null;
        }
    });
}

// ===== FILE UPLOAD =====
function initUpload() {
    var uploadZone = document.getElementById('uploadZone');
    var fileInput = document.getElementById('fileInput');
    if (!uploadZone || !fileInput) return;

    var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    var MAX_SIZE = 10 * 1024 * 1024; // 10MB

    uploadZone.addEventListener('click', function(e) {
        // Keep the input mounted in the DOM so the user can replace a photo.
        if (e.target && e.target.closest && e.target.closest('.upload-remove')) return;
        fileInput.click();
    });
    uploadZone.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', function() { this.classList.remove('dragover'); });
    uploadZone.addEventListener('drop', function(e) {
        e.preventDefault(); this.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', function() { if (this.files.length) handleFileUpload(this.files[0]); });

    function showUploadError(msg) {
        var existing = uploadZone.querySelector('.upload-error');
        if (existing) existing.remove();
        var el = document.createElement('div');
        el.className = 'upload-error';
        el.style.cssText = 'color:#c53030;font-size:12px;margin-top:8px;text-align:center;';
        el.textContent = msg;
        uploadZone.appendChild(el);
        setTimeout(function() { el.remove(); }, 5000);
    }

    function showUploadProgress(percent) {
        var existing = uploadZone.querySelector('.upload-progress');
        if (existing) existing.remove();
        var el = document.createElement('div');
        el.className = 'upload-progress';
        el.style.cssText = 'margin-top:8px;text-align:center;';
        el.innerHTML = '<div style="background:#e5e5e5;border-radius:4px;height:6px;overflow:hidden;"><div style="background:#1a1a1a;height:100%;width:' + percent + '%;transition:width 0.3s;"></div></div><p style="font-size:11px;color:#999;margin-top:4px;">Uploading... ' + percent + '%</p>';
        uploadZone.appendChild(el);
    }

    function handleFileUpload(file) {
        // Validate file type
        if (ALLOWED_TYPES.indexOf(file.type) === -1) {
            showUploadError('Invalid file type. Please upload JPG, PNG, or WebP.');
            return;
        }
        // Validate file size
        if (file.size > MAX_SIZE) {
            showUploadError('File too large. Maximum size is 10MB.');
            return;
        }

        window.__HousoraToolFile = file;

        // Show preview immediately using FileReader. The user's image must keep
        // its natural aspect ratio; generated demo crops are handled separately.
        var reader = new FileReader();
        reader.onload = function(e) {
            var beforeImg = document.querySelector('.demo-before img');
            if (beforeImg) {
                beforeImg.src = e.target.result;
                beforeImg.classList.add('uploaded-user-image');
            }
            renderUploadPreview(e.target.result, file.name);
        };
        reader.readAsDataURL(file);

        // Store file reference for later use by generation
        var zone = document.getElementById('uploadZone');
        if (zone) {
            zone.setAttribute('data-file-name', file.name);
            zone.setAttribute('data-file-data', 'local');
        }

        uploadZone.style.border = '2px solid #2bbbad';
        var generateBtn = document.getElementById('generateBtn');
        if (generateBtn) generateBtn.disabled = false;
        uploadZone.dispatchEvent(new CustomEvent('housora:file-selected', { detail: { file: file } }));
        window.HousoraAnalytics.track('image_uploaded', { file_type: file.type, file_size_bucket: file.size < 1000000 ? 'small' : file.size < 5000000 ? 'medium' : 'large' });
    }

    function renderUploadPreview(dataUrl, fileName) {
        var placeholder = uploadZone.querySelector('.id-upload-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        var preview = uploadZone.querySelector('.upload-preview');
        if (!preview) {
            preview = document.createElement('div');
            preview.className = 'upload-preview';
            uploadZone.appendChild(preview);
        }
        preview.classList.add('ph-no-capture');
        preview.innerHTML = '<img id="uploadPreviewImg" alt="Uploaded room photo"><p>Photo ready — click to replace.</p><button type="button" class="upload-remove">Remove photo</button>';
        var img = preview.querySelector('#uploadPreviewImg');
        img.src = dataUrl;
        img.title = fileName || 'Uploaded room photo';
        preview.querySelector('.upload-remove').addEventListener('click', function(e) {
            e.stopPropagation();
            window.__HousoraToolFile = null;
            fileInput.value = '';
            uploadZone.style.border = '';
            preview.remove();
            if (placeholder) placeholder.style.display = '';
            var beforeImg = document.querySelector('.demo-before img.uploaded-user-image');
            if (beforeImg) beforeImg.classList.remove('uploaded-user-image');
            var generateBtn = document.getElementById('generateBtn');
            if (generateBtn) generateBtn.disabled = true;
            uploadZone.dispatchEvent(new CustomEvent('housora:file-cleared'));
            window.HousoraAnalytics.track('image_upload_removed');
        });
    }
}

// ===== FAQ ACCORDION =====
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(function(q) {
        function toggleQuestion() {
            const answer = this.nextElementSibling;
            if (!answer) return;
            const isOpen = !answer.classList.contains('hidden');
            document.querySelectorAll('.faq-answer').forEach(function(a) {
                a.classList.add('hidden');
                var control = a.id ? document.querySelector('[aria-controls="' + a.id + '"]') : null;
                if (control) control.setAttribute('aria-expanded', 'false');
            });
            document.querySelectorAll('.faq-toggle').forEach(function(t) { t.textContent = '+'; });
            document.querySelectorAll('.faq-question i').forEach(function(i) { i.style.transform = 'rotate(0deg)'; });
            if (!isOpen) {
                answer.classList.remove('hidden');
                this.setAttribute('aria-expanded', 'true');
                const toggle = this.querySelector('.faq-toggle');
                if (toggle) toggle.textContent = '-';
                const chevron = this.querySelector('i');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            }
        }
        q.addEventListener('click', toggleQuestion);
        q.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleQuestion.call(this);
            }
        });
    });
}

// ===== SIDEBAR NAVIGATION =====
function initSidebar() {
    const menuToggle = document.getElementById('sidebar-toggle');
    const sidebarNav = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarClose = document.getElementById('sidebar-close');
    function openSidebar() {
        if (sidebarNav) sidebarNav.classList.add('open');
        if (sidebarOverlay) sidebarOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        if (sidebarNav) sidebarNav.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }
    if (menuToggle) menuToggle.addEventListener('click', openSidebar);
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
    document.querySelectorAll('.sidebar-section-header').forEach(function(header) {
        header.addEventListener('click', function() {
            const links = this.nextElementSibling;
            if (links && links.classList.contains('sidebar-links')) {
                links.classList.toggle('open');
                const arrow = this.querySelector('.chevron');
                if (arrow) arrow.classList.toggle('rotated');
            }
        });
    });
}

function initTransparentHeader() {
    var header = document.querySelector('.create-header');
    if (!header) return;
    function update() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', update, { passive: true });
    update();
}

function initStartDesignFocus() {
    if (window.location.hash !== '#heroUploadBtn' && window.location.hash !== '#try-it-now') return;
    window.setTimeout(function() {
        var target = document.getElementById(window.location.hash.slice(1));
        if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (window.location.hash === '#heroUploadBtn') target.focus(); }
    }, 80);
}

// ===== OPTION BUTTONS =====
function initOptionButtons() {
    document.querySelectorAll('.option-btn, .sel-btn, .id-card, .id-option-pill, .id-palette').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const group = this.closest('.id-config-section') || this.parentElement;
            group.querySelectorAll('.option-btn, .sel-btn, .id-card, .id-option-pill, .id-palette').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            group.querySelectorAll('.id-palette').forEach(function(b) { b.setAttribute('aria-pressed', b.classList.contains('active') ? 'true' : 'false'); });
        });
    });
}

// ===== SHARED AI TOOL CONFIGURATOR =====
function initToolConfigurator() {
    var generateBtn = document.getElementById('generateBtn');
    var uploadZone = document.getElementById('uploadZone');
    if (!generateBtn || !uploadZone) return;

    function selectedOptions() {
        return Array.from(document.querySelectorAll('.id-config-section')).map(function(section) {
            var label = section.querySelector('.id-config-label');
            var selected = section.querySelector('.active');
            var select = section.querySelector('select');
            if (!label) return null;
            if (select) return label.textContent.trim() + ': ' + select.value;
            if (!selected) return null;
            var value = selected.querySelector('.id-card-label, .id-palette-name') || selected;
            return label.textContent.trim() + ': ' + value.textContent.trim();
        }).filter(Boolean);
    }

    function buildPrompt() {
        var title = document.querySelector('.id-upload-title');
        var custom = document.querySelector('.id-custom-prompt');
        var options = selectedOptions();
        var prompt = [
            'Create a photorealistic architectural design edit from the uploaded image.',
            'Preserve the exact camera angle, perspective, room proportions, structural walls, ceiling height, windows, doors, openings, and lighting direction.',
            'Keep the image dimensions and composition stable; never stretch, warp, duplicate, or replace the architecture.',
            'Only change the requested finishes, furnishings, planting, or styling. Keep edges clean and materials physically believable.',
            'User selections: ' + (options.length ? options.join('; ') : 'use a restrained, contemporary direction') + '.',
            'Return one finished, high-quality result with no text, watermark, collage, or extra rooms.'
        ].join(' ');
        if (custom && custom.value.trim()) prompt += ' Additional user direction: ' + custom.value.trim() + '.';
        return prompt;
    }

    uploadZone.addEventListener('housora:file-cleared', function() { generateBtn.disabled = true; });
    generateBtn.addEventListener('click', function() {
        var file = window.__HousoraToolFile;
        if (!file) { alert('Please upload a photo first.'); return; }
        var original = generateBtn.innerHTML;
        var status = generateBtn.parentElement.querySelector('.id-generation-status');
        if (!status) {
            status = document.createElement('p');
            status.className = 'id-generation-status';
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
            generateBtn.parentElement.appendChild(status);
        }
        var steps = ['Preparing your room photo...', 'Applying the selected design direction...', 'Refining materials and lighting...'];
        var stepIndex = 0;
        status.textContent = steps[stepIndex];
        var statusTimer = window.setInterval(function() {
            stepIndex = Math.min(stepIndex + 1, steps.length - 1);
            status.textContent = steps[stepIndex];
        }, 3500);
        generateBtn.disabled = true;
        generateBtn.setAttribute('aria-busy', 'true');
        generateBtn.innerHTML = 'Generating...';
        requestHousoraGeneration(buildPrompt(), file).then(function(imageUrl) {
            showGeneratedHousoraImage(imageUrl);
        }).catch(function(error) {
            alert(error.message || 'Generation failed. Please try again.');
        }).finally(function() {
            window.clearInterval(statusTimer);
            status.textContent = '';
            generateBtn.disabled = false;
            generateBtn.removeAttribute('aria-busy');
            generateBtn.innerHTML = original;
        });
    });
}

// ===== WORKSPACE SIDEBAR OPTIONS =====
function initWorkspaceOptions() {
    document.querySelectorAll('.room-option, .style-option, .palette-option').forEach(function(opt) {
        opt.addEventListener('click', function() {
            const grid = this.parentElement;
            grid.querySelectorAll('.room-option, .style-option, .palette-option').forEach(function(o) { o.classList.remove('active'); });
            this.classList.add('active');
        });
    });
    document.querySelectorAll('.tab-item, .tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.tab-item, .tab').forEach(function(t) { t.classList.remove('tab-active', 'active'); });
            this.classList.add('tab-active', 'active');
        });
    });
}

// ===== HOMEPAGE -> WORKSPACE HANDOFF =====
function initWorkspaceHandoff() {
    if (!document.body.classList.contains('page-workspace')) return;
    var params = new URLSearchParams(window.location.search);
    var options = {};
    try { options = JSON.parse(sessionStorage.getItem('housora_first_design_options') || '{}'); } catch (e) {}
    var room = params.get('room') || options.room || 'living';
    var style = params.get('style') || options.style || 'scandinavian';
    var palette = options.palette || 'neutral';
    var budget = params.get('budget') || options.budget || '3000';
    var roomImages = {
        living: '/static/images/room-living.jpg', bedroom: '/static/images/room-bedroom.jpg', dining: '/static/images/room-dining.jpg'
    };
    var styleImages = {
        scandinavian: '/static/images/style-scandi.jpg', modern: '/static/images/style-modern.jpg', coastal: '/static/images/style-coastal.jpg'
    };
    document.querySelectorAll('.room-option[data-room]').forEach(function(el) { el.classList.toggle('active', el.getAttribute('data-room') === room); });
    document.querySelectorAll('.style-option[data-style]').forEach(function(el) { el.classList.toggle('active', el.getAttribute('data-style') === style); });
    document.querySelectorAll('.palette-option[data-palette]').forEach(function(el) { el.classList.toggle('active', el.getAttribute('data-palette') === palette); });
    var budgetInput = document.getElementById('workspaceBudget');
    var budgetAmount = document.querySelector('.budget-amount');
    if (budgetInput) budgetInput.value = budget;
    if (budgetAmount) budgetAmount.textContent = '$' + Number(budget).toLocaleString();
    var inputPhoto = document.querySelector('.workspace-input-photo');
    var photoCell = document.querySelector('.photo-cell-primary img');
    var uploadedPhoto = null;
    try { uploadedPhoto = sessionStorage.getItem('housora_first_design_photo'); } catch (e) {}
    if (uploadedPhoto) {
        document.body.classList.remove('workspace-empty');
        if (inputPhoto) inputPhoto.src = uploadedPhoto;
        if (photoCell) photoCell.src = uploadedPhoto;
        var overlay = document.querySelector('.analyzing-overlay');
        var statusTitle = document.getElementById('workspaceStatusTitle');
        var statusText = document.getElementById('workspaceStatusText');
        var pctEl = document.getElementById('analyzePct');
        var progressFill = document.getElementById('progressFill');
        if (overlay) overlay.classList.remove('empty-state');
        if (statusTitle) statusTitle.textContent = 'ROOM PHOTO READY';
        if (statusText) statusText.textContent = 'Choose a room, style, and palette, then describe the result you want.';
        if (pctEl) pctEl.textContent = 'Ready';
        if (progressFill) progressFill.style.width = '100%';
        fetch(uploadedPhoto).then(function(response) { return response.blob(); }).then(function(blob) {
            window.__HousoraToolFile = new File([blob], 'room-upload.png', { type: blob.type || 'image/png' });
        }).catch(function() {});
    } else document.body.classList.add('workspace-empty');
    var selectedStyleImage = document.querySelector('.workspace-photo-grid .photo-cell:nth-child(2) img');
    if (selectedStyleImage && styleImages[style]) selectedStyleImage.src = styleImages[style];
    var prompt = document.getElementById('workspacePrompt');
    if (prompt) {
        if (uploadedPhoto) prompt.value = 'Redesign this ' + room + ' in a ' + style + ' style with a ' + palette + ' palette.';
        else prompt.placeholder = 'Upload a room photo before describing your design';
    }
    if (budgetInput) budgetInput.addEventListener('input', function() { if (budgetAmount) budgetAmount.textContent = '$' + Number(this.value).toLocaleString(); });
}

// ===== WORKSPACE GENERATION PROGRESS =====
function initWorkspaceProgress() {
    // Progress is updated by real upload/generation events. Do not simulate
    // activity when no backend job is running.
}

// ===== STYLE QUIZ =====
function initQuiz() {
    var quizCard = document.getElementById('quizCard');
    var quizResult = document.getElementById('quizResult');
    var quizOptions = document.getElementById('quizOptions');
    var quizQuestion = document.getElementById('quizQuestion');
    var quizProgressFill = document.getElementById('quizProgressFill');
    var quizProgressText = document.getElementById('quizProgressText');
    if (!quizCard || !quizOptions) return;

    var questions = [
        { q: 'Which living room appeals to you most?', opts: ['Minimalist white with clean lines', 'Warm wood tones and soft textures', 'Bold colors and eclectic mix', 'Industrial with exposed brick'] },
        { q: 'Pick your ideal bedroom:', opts: ['Simple platform bed, neutral tones', 'Layered textiles, earthy palette', 'Statement headboard, gold accents', 'Raw wood, metal fixtures'] },
        { q: 'Which kitchen do you prefer?', opts: ['Sleek handleless cabinets', 'Shaker style with brass hardware', 'Open shelving, industrial look', 'Cozy farmhouse with natural materials'] },
        { q: 'Choose your dream bathroom:', opts: ['Spa-like with floating vanity', 'Subway tile, vintage mirror', 'Bold patterned floor tiles', 'Natural stone, walk-in shower'] },
        { q: 'Which outdoor space do you love?', opts: ['Minimal patio with clean lines', 'Lush garden with seating areas', 'Deck with string lights', 'Courtyard with water feature'] },
        { q: 'Pick your ideal home office:', opts: ['Standing desk, white walls', 'Wood desk, plants, warm light', 'Built-in shelving, dark tones', 'Minimal floating desk'] },
        { q: 'Which dining room suits you?', opts: ['Round table, modern chairs', 'Long wood table, bench seating', 'Glass table, statement lighting', 'Farm table, mixed chairs'] },
        { q: 'Pick your color comfort zone:', opts: ['All whites and light grays', 'Warm beiges and browns', 'Deep blues and greens', 'Black, white, and red accents'] },
        { q: 'Your ideal flooring?', opts: ['Light oak hardwood', 'Warm walnut hardwood', 'Polished concrete', 'Patterned tile'] },
        { q: 'What matters most in design?', opts: ['Less is more', 'Comfort and warmth', 'Bold self-expression', 'Function first'] }
    ];
    var styles = ['Minimalist', 'Scandinavian', 'Modern', 'Industrial'];
    var currentQ = 0;
    var answers = [];

    function renderQuestion() {
        var q = questions[currentQ];
        quizQuestion.textContent = q.q;
        quizProgressText.textContent = 'Question ' + (currentQ + 1) + ' of ' + questions.length;
        quizProgressFill.style.width = ((currentQ + 1) / questions.length * 100) + '%';
        quizOptions.innerHTML = '';
        q.opts.forEach(function(opt, i) {
            var div = document.createElement('div');
            div.className = 'quiz-option';
            div.innerHTML = '<span>' + opt + '</span>';
            div.addEventListener('click', function() {
                answers.push(i);
                currentQ++;
                if (currentQ >= questions.length) {
                    showResult();
                } else {
                    renderQuestion();
                }
            });
            quizOptions.appendChild(div);
        });
    }

    function showResult() {
        var counts = [0, 0, 0, 0];
        answers.forEach(function(a) { counts[a]++; });
        var maxIdx = 0;
        counts.forEach(function(c, i) { if (c > counts[maxIdx]) maxIdx = i; });
        var resultStyle = styles[maxIdx];
        var descriptions = {
            'Minimalist': 'Clean lines, white spaces, and only essential furniture.',
            'Scandinavian': 'Light woods, soft neutrals, and clutter-free calm.',
            'Modern': 'Sleek finishes, neutral palette, and statement pieces.',
            'Industrial': 'Raw textures, metal accents, and open spaces.'
        };
        document.getElementById('quizResultTitle').textContent = 'Your Style: ' + resultStyle;
        document.getElementById('quizResultDesc').textContent = descriptions[resultStyle] || '';
        quizCard.style.display = 'none';
        quizResult.classList.remove('hidden');
    }

    renderQuestion();
}

function initPlanStatus() {
    var card = document.getElementById('planStatus');
    if (!card) return;
    function render(status) {
        if (!status || !status.plan || status.plan === 'free') {
            card.innerHTML = '<h3>Your current plan</h3><p>No paid plan is active yet. Choose a plan above whenever you are ready.</p>';
            return;
        }
        var end = status.subscriptionEnd ? new Date(status.subscriptionEnd).toLocaleDateString() : 'managed through Whop';
        card.innerHTML = '<h3>Active plan: ' + String(status.plan).toUpperCase() + '</h3><p>' + String(status.credits || 0) + ' image credits available. Billing status: ' + String(status.subscriptionStatus || 'active') + '.</p><p class="plan-status-note">Cancel future renewals in Whop, or contact support for a refund review. Subscription end: ' + end + '.</p>';
    }
    function load() {
        if (!window.Clerk || !window.Clerk.user || !window.convexClient) { render(null); return; }
        window.convexClient.query('users:getSubscriptionStatus', { clerkId: window.Clerk.user.id }).then(render).catch(function() { render(null); });
    }
    window.addEventListener('clerk:ready', load);
    setTimeout(load, 1200);
}
// ===== PRICING BILLING TOGGLE =====
function initPricingToggle() {
    var yearlyBtn = document.getElementById('yearlyBtn');
    var monthlyBtn = document.getElementById('monthlyBtn');
    if (!yearlyBtn || !monthlyBtn) return;

    function updatePrices(period) {
        document.querySelectorAll('.pricing-card').forEach(function(card) {
            var monthly = card.querySelector('.price-monthly');
            var annual = card.querySelector('.price-annual');
            var periodEl = card.querySelector('.price-period');
            var annualTotal = card.querySelector('.annual-total');
            var annualTotalLabel = card.querySelector('.annual-total-label');
            if (monthly) monthly.style.display = period === 'monthly' ? 'inline' : 'none';
            if (annual) annual.style.display = period === 'yearly' ? 'inline' : 'none';
            if (periodEl) periodEl.textContent = period === 'yearly' ? ' / month' : ' / month';
            if (annualTotal) annualTotal.style.display = period === 'yearly' ? 'inline' : 'none';
            if (annualTotalLabel) annualTotalLabel.style.display = period === 'yearly' ? 'inline' : 'none';
        });
        yearlyBtn.setAttribute('aria-pressed', period === 'yearly' ? 'true' : 'false');
        monthlyBtn.setAttribute('aria-pressed', period === 'monthly' ? 'true' : 'false');
    }

    updatePrices('monthly');

    yearlyBtn.addEventListener('click', function() {
        yearlyBtn.classList.add('active');
        monthlyBtn.classList.remove('active');
        updatePrices('yearly');
        var caption = document.getElementById('billing-caption');
        if (caption) caption.textContent = 'Yearly billing shows the monthly equivalent and the total charged today.';
    });
    monthlyBtn.addEventListener('click', function() {
        monthlyBtn.classList.add('active');
        yearlyBtn.classList.remove('active');
        updatePrices('monthly');
        var caption = document.getElementById('billing-caption');
        if (caption) caption.textContent = 'Pay monthly and cancel future renewals anytime.';
    });
}

// ===== WHOP CHECKOUT =====
function initWhopCheckout() {
    document.querySelectorAll('.whop-checkout').forEach(function(btn) {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            var self = this;
            var monthlyPlan = self.getAttribute('data-plan-monthly');
            var yearlyPlan = self.getAttribute('data-plan-yearly');
            var isYearly = document.getElementById('yearlyBtn') && document.getElementById('yearlyBtn').classList.contains('active');
            var planId = isYearly ? yearlyPlan : monthlyPlan;

            if (!planId || planId.indexOf('plan_') !== 0) {
                showCheckoutError('Invalid plan configuration.');
                return;
            }
            if (isYearly && yearlyPlan === monthlyPlan) {
                showCheckoutError('This annual plan is not configured in Whop yet. Please choose monthly billing or contact support.');
                return;
            }
            window.HousoraAnalytics.track('checkout_started', { billing_period: isYearly ? 'yearly' : 'monthly' });

            if (!window.Clerk || !window.Clerk.user) {
                window.location.href = '/sign-in?redirect=/pricing';
                return;
            }

            var originalText = self.textContent;
            self.textContent = 'Processing...';
            self.style.opacity = '0.7';
            self.style.pointerEvents = 'none';

            try {
                var sessionToken = await window.Clerk.session.getToken();
                if (!sessionToken) {
                    showCheckoutError('Could not get session token. Please sign in again.');
                    self.textContent = originalText;
                    self.style.opacity = '1';
                    self.style.pointerEvents = '';
                    return;
                }

                var res = await fetch('/api/whop/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Bearer ' + sessionToken
                    },
                    body: 'planId=' + encodeURIComponent(planId)
                });
                var data = await res.json();
                if (data.error) {
                    window.HousoraAnalytics.track('checkout_failed', { error_code: String(data.error).slice(0, 80) });
                    showCheckoutError(data.error);
                    self.textContent = originalText;
                    self.style.opacity = '1';
                    self.style.pointerEvents = '';
                    return;
                }
                if (data.mock) {
                    showMockCheckoutSuccess(planId, 'dev-user', self, originalText);
                } else {
                    window.HousoraAnalytics.track('checkout_redirected');
                    window.location.href = data.url;
                }
            } catch(err) {
                window.HousoraAnalytics.track('checkout_failed', { error_code: 'network' });
                showCheckoutError('Network error. Please try again.');
                self.textContent = originalText;
                self.style.opacity = '1';
                self.style.pointerEvents = '';
            }
        });
    });
}

function showCheckoutError(msg) {
    var existing = document.querySelector('.checkout-error');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.className = 'checkout-error';
    el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;padding:14px 20px;z-index:10000;font-size:14px;color:#c53030;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-width:400px;text-align:center;';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 5000);
}

function showMockCheckoutSuccess(planId, clerkId, btn, originalText) {
    // Create mock success overlay
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:10001;display:flex;align-items:center;justify-content:center;';
    var card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:12px;padding:32px;max-width:400px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.2);';
    card.innerHTML = '<h3 style="margin:0 0 12px;font-size:18px;font-weight:700;">Mock Checkout Success</h3>'
        + '<p style="margin:0 0 8px;font-size:14px;color:#666;">Plan: ' + planId + '</p>'
        + '<p style="margin:0 0 20px;font-size:13px;color:#999;">This is a development simulation. In production, you would be redirected to Whop.</p>'
        + '<button id="mock-activate-btn" style="background:#1a1a1a;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer;">Activate Plan (Mock)</button>'
        + '<button id="mock-close-btn" style="background:none;border:none;padding:10px 16px;font-size:13px;color:#999;cursor:pointer;margin-left:8px;">Cancel</button>';
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('mock-activate-btn').addEventListener('click', function() {
        // In mock mode, update the UI to reflect the new plan
        var planType = btn.getAttribute('data-plan-type') || 'standard';
        alert('Mock: Plan "' + planType + '" activated! In production, the webhook would update your Convex account.');
        overlay.remove();
        btn.textContent = originalText;
        btn.style.opacity = '1';
        btn.style.pointerEvents = '';
    });
    document.getElementById('mock-close-btn').addEventListener('click', function() {
        overlay.remove();
        btn.textContent = originalText;
        btn.style.opacity = '1';
        btn.style.pointerEvents = '';
    });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(a) {
        a.addEventListener('click', function(e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });
}

// ===== COPY PROMO CODE =====
function initPromoCopy() {
    var promoCode = document.querySelector('.promo-code');
    if (promoCode) {
        promoCode.style.cursor = 'pointer';
        promoCode.title = 'Click to copy';
        promoCode.addEventListener('click', function() {
            var el = this;
            var code = (el.getAttribute('data-code') || el.textContent || '').trim();
            var original = el.textContent;
            function confirmCopy() {
                el.textContent = 'Copied to clipboard';
                el.setAttribute('aria-label', 'Promo code copied to clipboard');
                window.setTimeout(function() {
                    el.textContent = original;
                    el.setAttribute('aria-label', 'Copy promo code ' + code);
                }, 1800);
            }
            function fallbackCopy() {
                var input = document.createElement('textarea');
                input.value = code;
                input.setAttribute('readonly', '');
                input.style.position = 'fixed';
                input.style.opacity = '0';
                document.body.appendChild(input);
                input.select();
                var copied = false;
                try { copied = document.execCommand('copy'); } catch (_) {}
                input.remove();
                if (copied) confirmCopy();
            }
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(code).then(confirmCopy).catch(fallbackCopy);
            } else fallbackCopy();
        });
    }
}

// ===== TOOL PAGE STYLE GRID =====
function initToolStyleGrids() {
    document.querySelectorAll('.style-grid').forEach(function(grid) {
        grid.querySelectorAll('.style-thumb').forEach(function(thumb) {
            thumb.addEventListener('click', function() {
                grid.querySelectorAll('.style-thumb').forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
            });
        });
    });
    document.querySelectorAll('.config-option').forEach(function(opt) {
        opt.addEventListener('click', function() {
            var grid = this.parentElement;
            grid.querySelectorAll('.config-option').forEach(function(o) { o.classList.remove('active'); });
            this.classList.add('active');
        });
    });
}

// ===== HOUSORA COOKIE CONSENT PANEL =====
function initCookiebot() {
    var panel = document.getElementById('cookiebot-panel');
    if (!panel) return;

    var savedConsent = null;
    try { savedConsent = JSON.parse(localStorage.getItem('housora-consent-v1') || 'null'); } catch (_) {}
    var defaults = { necessary: true, preferences: false, analytics: false, marketing: false };
    function applyConsentToControls(consent) {
        panel.querySelectorAll('.cookiebot-checkbox').forEach(function(cb) {
            cb.checked = cb.name === 'necessary' ? true : consent[cb.name] === true;
            var row = cb.closest('.cookiebot-toggle-row');
            var toggle = row ? row.querySelector('.cookiebot-toggle') : null;
            if (toggle) toggle.classList.toggle('active', cb.checked);
        });
    }
    function saveConsent(consent) {
        consent.necessary = true;
        consent.version = 1;
        consent.timestamp = Date.now();
        localStorage.setItem('housora-consent-v1', JSON.stringify(consent));
        panel.style.display = 'none';
        if (consent.analytics === true) window.HousoraAnalytics.init();
    }
    applyConsentToControls(savedConsent || defaults);
    panel.style.display = savedConsent ? 'none' : 'block';

    // Toggle switches
    panel.querySelectorAll('.cookiebot-checkbox').forEach(function(cb) {
        cb.addEventListener('change', function() {
            var row = this.closest('.cookiebot-toggle-row');
            var toggle = row ? row.querySelector('.cookiebot-toggle') : null;
            if (toggle) {
                toggle.classList.toggle('active', this.checked);
            }
        });
    });

    // Details button
    var detailsBtn = document.getElementById('cookiebot-details-btn');
    if (detailsBtn) {
        detailsBtn.addEventListener('click', function() {
            var toggles = panel.querySelector('.cookiebot-toggles');
            if (toggles) {
                var isVisible = toggles.style.display !== 'none';
                toggles.style.display = isVisible ? 'none' : 'flex';
                this.setAttribute('aria-expanded', isVisible ? 'false' : 'true');
                this.textContent = isVisible ? 'Show details ›' : 'Hide details';
            }
        });
    }

    // OK button — save consent and hide
    var okBtn = document.getElementById('cookiebot-ok-btn');
    if (okBtn) {
        okBtn.addEventListener('click', function() {
            var consent = { necessary: true, preferences: false, analytics: false, marketing: false };
            panel.querySelectorAll('.cookiebot-checkbox').forEach(function(cb) {
                consent[cb.name] = cb.checked;
            });
            saveConsent(consent);
        });
    }

    var necessaryBtn = document.getElementById('cookiebot-necessary-btn');
    if (necessaryBtn) necessaryBtn.addEventListener('click', function() {
        saveConsent({ necessary: true, preferences: false, analytics: false, marketing: false });
    });
    var saveBtn = document.getElementById('cookiebot-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', function() {
        var consent = { necessary: true, preferences: false, analytics: false, marketing: false };
        panel.querySelectorAll('.cookiebot-checkbox').forEach(function(cb) { consent[cb.name] = cb.checked; });
        saveConsent(consent);
    });

    var settingsBtn = document.getElementById('cookie-settings-btn');
    if (settingsBtn) settingsBtn.addEventListener('click', function() {
        applyConsentToControls(savedConsent || defaults);
        panel.style.display = 'block';
        panel.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
}

// ===== ENTERPRISE SLIDER =====
function initEnterpriseSlider() {
    var slider = document.getElementById('enterpriseSlider');
    if (!slider) return;
    var creditsDisplay = slider.parentElement.querySelector('.slider-credits');
    var priceDisplay = slider.closest('.pricing-card').querySelector('.price-current');
    slider.addEventListener('input', function() {
        var val = parseInt(this.value);
        var credits = Math.round(35000 + (val - 750) * 20);
        priceDisplay.textContent = '\u20AC' + val;
        creditsDisplay.textContent = credits.toLocaleString() + ' images / month';
    });
}

// ===== CONVEX CREDITS =====
function initConvexCredits() {
    window.Housora = window.Housora || {};
    window.Housora.getCredits = async function() {
        if (!window.convexClient || !window.Clerk || !window.Clerk.user) return 0;
        try {
            var result = await window.convexClient.query('users:getCredits', { clerkId: window.Clerk.user.id });
            return result || 0;
        } catch (e) {
            console.warn('[Convex] Failed to get image allowance:', e);
            return 0;
        }
    };
    window.Housora.deductCredits = async function(amount) {
        if (!window.convexClient || !window.Clerk || !window.Clerk.user) return false;
        try {
            return await window.convexClient.mutation('users:deductCredits', {
                clerkId: window.Clerk.user.id,
                amount: amount,
                toolType: 'design',
            });
        } catch (e) {
            console.warn('[Convex] Failed to reserve an image generation:', e);
            return false;
        }
    };
    window.Housora.getImagesRemaining = window.Housora.getCredits;
    window.Housora.deductImages = window.Housora.deductCredits;
    window.Housora.getSubscription = async function() {
        if (!window.convexClient || !window.Clerk || !window.Clerk.user) return null;
        try {
            return await window.convexClient.query('users:getSubscriptionStatus', { clerkId: window.Clerk.user.id });
        } catch (e) {
            console.warn('[Convex] Failed to get subscription:', e);
            return null;
        }
    };
}

// ===== PROJECTS =====
function initHousoraProjects() {
    var grid = document.getElementById('projectsGrid');
    var empty = document.getElementById('projectsEmpty');
    var message = document.getElementById('projectsMessage');
    var newBtn = document.getElementById('newProjectBtn');
    var authGate = document.getElementById('projectsAuthGate');
    var signInBtn = document.getElementById('projectsSignInBtn');
    if (!grid) return;

    function signedIn() { return window.convexClient && window.Clerk && window.Clerk.user; }
    function showMessage(text, isError) {
        if (message) { message.textContent = text; message.classList.toggle('is-error', !!isError); }
    }
    function showSignedOutState() {
        if (authGate) authGate.style.display = 'block';
        if (newBtn) newBtn.style.display = 'none';
        grid.style.display = 'none';
        if (empty) empty.style.display = 'none';
        showMessage('');
    }
    function render(projects) {
        grid.innerHTML = '';
        if (!projects.length) { if (empty) empty.style.display = 'block'; return; }
        if (empty) empty.style.display = 'none';
        projects.forEach(function(project) {
            var card = document.createElement('article');
            card.className = 'project-card';
            card.dataset.projectId = project._id;
            var preview = project.afterImageUrl || project.beforeImageUrl || '/static/images/room-after.jpg';
            card.innerHTML = '<div class="project-preview"><img alt="' + (project.title || 'Project') + '" src="' + preview + '"><button type="button" class="project-delete-btn" aria-label="Delete project">×</button></div>' +
                '<div class="project-info"><h2 class="project-name"></h2><p class="project-date"></p></div>';
            card.querySelector('.project-name').textContent = project.title || 'Untitled Project';
            card.querySelector('.project-date').textContent = 'Updated ' + new Date(project.updatedAt || project.createdAt).toLocaleDateString();
            card.addEventListener('click', function() {
                window.HousoraAnalytics.track('project_opened');
                localStorage.setItem('housora_current_project', project._id);
                window.location.href = '/create#project-' + encodeURIComponent(project._id);
            });
            card.querySelector('.project-delete-btn').addEventListener('click', function(event) {
                event.stopPropagation();
                if (!confirm('Delete this project? This cannot be undone.')) return;
                window.HousoraAnalytics.track('project_deleted');
                window.convexClient.mutation('projects:deleteProject', { projectId: project._id })
                    .then(load).catch(function(error) { showMessage(error.message || 'Could not delete the project.', true); });
            });
            grid.appendChild(card);
        });
    }
    function load() {
        if (!signedIn()) { showSignedOutState(); return; }
        if (authGate) authGate.style.display = 'none';
        if (newBtn) newBtn.style.display = '';
        grid.style.display = '';
        showMessage('Loading your projects…');
        window.convexClient.query('projects:listProjects', {})
            .then(function(projects) { showMessage(''); render(projects || []); })
            .catch(function(error) { showMessage(error.message || 'Projects could not be loaded.', true); });
    }
    if (newBtn) newBtn.addEventListener('click', function() {
        if (!signedIn()) { window.location.href = '/sign-in?redirect=/projects'; return; }
        newBtn.disabled = true;
        window.convexClient.mutation('projects:createProject', {
            title: 'Untitled Project', roomType: 'Living Room', style: 'Contemporary'
        }).then(function(id) {
            window.HousoraAnalytics.track('project_created');
            localStorage.setItem('housora_current_project', id);
            window.location.href = '/create#project-' + encodeURIComponent(id);
        }).catch(function(error) { showMessage(error.message || 'Could not create the project.', true); newBtn.disabled = false; });
    });
    if (signInBtn) signInBtn.addEventListener('click', function() {
        if (window.housoraOpenAuth) window.housoraOpenAuth('signin');
        else window.location.href = '/sign-in?redirect=/projects';
    });
    load();
    window.addEventListener('clerk:ready', function() { setTimeout(load, 0); });
    // The bootstrap script can finish before this page script is evaluated.
    // Re-check the already-ready state so the gate cannot remain stuck on
    // “Sign in” after a successful Clerk session is available.
    if (window.housoraAuthState && window.housoraAuthState.status === 'ready') {
        setTimeout(load, 0);
    }
}

// ===== TOOL CARD SLIDESHOW =====
function initToolCardSlideshow() {
    document.querySelectorAll('.create-tool-card').forEach(function(card) {
        var slideshow = card.querySelector('.create-tool-card__slideshow');
        if (!slideshow) return;
        var slides = slideshow.querySelectorAll('.create-tool-card__slide');
        if (slides.length <= 1) return;
        var current = 0;
        setInterval(function() {
            slides[current].classList.remove('create-tool-card__slide--active');
            current = (current + 1) % slides.length;
            slides[current].classList.add('create-tool-card__slide--active');
        }, 2500);
    });
}

// ===== TOOL PAGE GENERATE BUTTONS =====
function initToolGenerateButtons() {
    document.querySelectorAll('.btn-generate-full, .btn-design-room').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var file = window.__HousoraToolFile;
            var room = document.querySelector('.room-option.active .room-name');
            var style = document.querySelector('.style-option.active .style-name');
            var palette = document.querySelector('.palette-option.active .palette-name');
            var budget = document.querySelector('.budget-amount');
            var prompt = 'Redesign this ' + (room ? room.textContent.trim().toLowerCase() : 'room') + ' with a photorealistic interior design. Use the ' + (style ? style.textContent.trim() : 'selected') + ' style, the ' + (palette ? palette.textContent.trim() : 'neutral') + ' color palette, and keep the result within a ' + (budget ? budget.textContent.trim() : 'reasonable') + ' furniture budget while preserving the room architecture.';
            if (!file) {
                alert('Please upload a room photo first.');
                return;
            }
            var original = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = 'GENERATING...';
            requestHousoraGeneration(prompt, file).then(function(imageUrl) {
                showGeneratedHousoraImage(imageUrl);
            }).catch(function(error) {
                alert(error.message);
            }).finally(function() {
                btn.disabled = false;
                btn.innerHTML = original;
            });
        });
    });
}

// ===== INIT ALL =====
document.addEventListener('DOMContentLoaded', function() {
    initSliders();
    // Hero headlines are rotated by the page-specific markup scripts.
    initHeroSlideshow();
    initMobileHeroSlideshow();
    initHeroBar();
    initHeroBarMobile();
    initCreateSelectors();
    initHotspots();
    initUpload();
    initFAQ();
    initSidebar();
    initTransparentHeader();
    initStartDesignFocus();
    initOptionButtons();
    initToolConfigurator();
    initReferenceStyleTool();
    initPricingToggle();
    initPlanStatus();
    initWhopCheckout();
    handleCheckoutRedirects();
    initConvexCredits();
    initWorkspaceOptions();
    initWorkspaceHandoff();
    initWorkspaceProgress();
    initSmoothScroll();
    initPromoCopy();
    initEnterpriseSlider();
    initQuiz();
    initToolStyleGrids();
    initToolGenerateButtons();
    initToolCardSlideshow();
    initCookiebot();
    initGlobalImageFallback();
});

// ===== GLOBAL IMAGE FALLBACK =====
function initGlobalImageFallback() {
    document.addEventListener('error', function(e) {
        if (e.target.tagName !== 'IMG') return;
        var img = e.target;
        if (img.dataset.onerrorHandled) return;
        img.dataset.onerrorHandled = '1';
        if (!img.getAttribute('src') || img.getAttribute('src') === '') {
            img.style.visibility = 'hidden';
            img.style.width = '0';
            img.style.height = '0';
            return;
        }
        img.style.opacity = '0.3';
        if (!img.alt || img.alt === '') {
            img.alt = 'Image not available';
        }
    }, true);
}

// ===== CHECKOUT REDIRECT HANDLER =====
function handleCheckoutRedirects() {
    var params = new URLSearchParams(window.location.search);
    var checkout = params.get('checkout');
    var mockCheckout = params.get('mock_checkout');

    if (checkout === 'success') {
        window.HousoraAnalytics.track('subscription_completed');
        showCheckoutBanner('success', 'Payment successful! Your plan has been activated. Welcome to Housora Pro!');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (checkout === 'canceled') {
        window.HousoraAnalytics.track('checkout_canceled');
        showCheckoutBanner('error', 'Checkout was canceled. You can try again anytime.');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (mockCheckout) {
        showCheckoutBanner('success', 'Mock checkout for plan: ' + mockCheckout + ' (dev mode)');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function showCheckoutBanner(type, message) {
    var existing = document.querySelector('.checkout-banner');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.className = 'checkout-banner';
    var bgColor = type === 'success' ? '#f0fff4' : '#fff5f5';
    var borderColor = type === 'success' ? '#c6f6d5' : '#fed7d7';
    var textColor = type === 'success' ? '#276749' : '#c53030';
    el.style.cssText = 'position:fixed;top:72px;left:50%;transform:translateX(-50%);background:' + bgColor + ';border:1px solid ' + borderColor + ';border-radius:8px;padding:14px 24px;z-index:10000;font-size:14px;color:' + textColor + ';box-shadow:0 4px 12px rgba(0,0,0,0.1);max-width:500px;text-align:center;';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 8000);
}
