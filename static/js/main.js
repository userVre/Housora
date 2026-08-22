// ===== PRIVACY-AWARE PRODUCT ANALYTICS =====
(function() {
    var analytics = window.HousoraAnalytics = window.HousoraAnalytics || {};
    var initialized = false;
    var pageviewCaptured = false;
    var identifiedUserId = null;
    var CONSENT_KEY = 'housora-consent-v2';
    var CONSENT_VERSION = 2;
    function consent() {
        try {
            var value = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
            if (!value || value.version !== CONSENT_VERSION || !value.expiresAt || value.expiresAt <= Date.now()) return null;
            return value;
        } catch (_) { return null; }
    }
    analytics.isAllowed = function() { var value = consent(); return !!(value && value.analytics === true); };
    analytics.consentHeader = function() {
        var value = consent();
        return value && value.analytics === true ? 'v2;analytics=1;timestamp=' + value.timestamp : 'v2;analytics=0';
    };
    analytics.init = function() {
        if (!analytics.isAllowed() || !window.posthog || !window.HousoraPostHog || !window.HousoraPostHog.key || !window.HousoraPostHog.host) return;
        if (!initialized) {
            initialized = true;
            window.posthog.init(window.HousoraPostHog.key, {
                api_host: window.HousoraPostHog.host,
                autocapture: false,
                capture_pageview: false,
                capture_pageleave: false,
                capture_dead_clicks: false,
                capture_exceptions: false,
                capture_heatmaps: false,
                capture_performance: false,
                disable_session_recording: true,
                disable_surveys: true,
                advanced_disable_feature_flags_on_first_load: true,
                opt_out_capturing_by_default: true,
                opt_out_capturing_persistence_type: 'local_storage',
                persistence: 'localStorage',
                person_profiles: 'identified_only',
                respect_dnt: true,
                before_send: function(event) {
                    if (!event || !event.properties) return event;
                    ['$current_url', '$referrer'].forEach(function(key) {
                        if (!event.properties[key]) return;
                        try {
                            var url = new URL(event.properties[key], window.location.origin);
                            event.properties[key] = url.origin + url.pathname;
                        } catch (_) { delete event.properties[key]; }
                    });
                    delete event.properties.$search_engine;
                    delete event.properties.$search_keyword;
                    return event;
                }
            });
        }
        try {
            window.posthog.opt_in_capturing();
            if (!pageviewCaptured) {
                pageviewCaptured = true;
                window.posthog.capture('$pageview', { $current_url: window.location.origin + window.location.pathname });
            }
        } catch (_) {}
        if (window.Clerk && window.Clerk.user) analytics.identify(window.Clerk.user);
    };
    analytics.applyConsent = function(isAllowed) {
        if (isAllowed) {
            analytics.init();
            return;
        }
        identifiedUserId = null;
        if (!initialized || !window.posthog) return;
        try { if (window.posthog.stopSessionRecording) window.posthog.stopSessionRecording(); } catch (_) {}
        try { window.posthog.opt_out_capturing({ clear_persistence: true }); } catch (_) {
            try { window.posthog.opt_out_capturing(); } catch (_) {}
        }
        try { window.posthog.reset(); } catch (_) {}
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
    analytics.reset = function() {
        if (!identifiedUserId) return;
        identifiedUserId = null;
        if (!window.posthog || !initialized) return;
        var allowed = analytics.isAllowed();
        try { window.posthog.opt_out_capturing(); } catch (_) {}
        try { window.posthog.reset(); } catch (_) {}
        if (allowed) {
            try { window.posthog.opt_in_capturing(); } catch (_) {}
        }
    };
    window.addEventListener('clerk:ready', function(e) {
        if (analytics.isAllowed()) analytics.init();
        if (e.detail && e.detail.clerk) analytics.identify(e.detail.clerk.user);
    });
})();

function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function scrollBehavior() {
    return prefersReducedMotion() ? 'auto' : 'smooth';
}

// Images that change after page load must stop using any server-rendered
// <picture> sources. Browsers prefer a matching <source> over the fallback
// <img src>, so changing only img.src can otherwise leave the old image visible.
function setDynamicImageSource(image, source) {
    if (!image) return;
    image.dataset.dynamicSource = 'true';
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    var picture = image.parentElement && image.parentElement.tagName === 'PICTURE' ? image.parentElement : null;
    if (picture) picture.querySelectorAll('source').forEach(function(candidate) { candidate.remove(); });
    image.src = source || '';
}

// ===== BEFORE/AFTER SLIDER =====
function initSliders() {
    document.querySelectorAll('.demo-slider-container').forEach(function(container) {
        var handle = container.querySelector('.demo-slider-handle');
        var divider = container.querySelector('.demo-slider-divider');
        var beforeLayer = container.querySelector('.demo-slider-before');
        if (!handle || !beforeLayer) return;

        var isDragging = false;

        handle.setAttribute('role', 'slider');
        handle.setAttribute('tabindex', '0');
        handle.setAttribute('aria-label', 'Before and after comparison');
        handle.setAttribute('aria-orientation', 'horizontal');
        handle.setAttribute('aria-valuemin', '5');
        handle.setAttribute('aria-valuemax', '95');

        function updateSlider(pct) {
            pct = Math.max(5, Math.min(95, pct));
            handle.style.left = pct + '%';
            if (divider) divider.style.left = pct + '%';
            beforeLayer.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
            handle.setAttribute('aria-valuenow', String(Math.round(pct)));
            handle.setAttribute('aria-valuetext', Math.round(pct) + '% before image visible');
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

        handle.addEventListener('keydown', function(e) {
            var current = Number(handle.getAttribute('aria-valuenow')) || 15;
            var next = current;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next -= 5;
            else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next += 5;
            else if (e.key === 'PageDown') next -= 10;
            else if (e.key === 'PageUp') next += 10;
            else if (e.key === 'Home') next = 5;
            else if (e.key === 'End') next = 95;
            else return;
            e.preventDefault();
            updateSlider(next);
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
    if (slides.length <= 1 || prefersReducedMotion()) return;
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
    if (slides.length <= 1 || prefersReducedMotion()) return;
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
    var signedIn = !!(window.Clerk && window.Clerk.user && window.Clerk.session);
    var guestTrialUsed = false;
    try { guestTrialUsed = localStorage.getItem('housora_guest_generation_used') === '1'; } catch (_) {}
    if (!signedIn && guestTrialUsed) {
        if (window.housoraOpenAuth) window.housoraOpenAuth('signup', { redirect: window.location.pathname + window.location.search });
        throw new Error('Your free guest design is used. Create an account to get 3 more generations.');
    }
    var sessionToken = signedIn ? await window.Clerk.session.getToken() : '';
    if (signedIn && !sessionToken) throw new Error('Could not verify your session. Please sign in again.');
    var image = await fileToBase64(file);
    var endpoint = '/api/generate';
    var startedAt = Date.now();
    window.HousoraAnalytics.track('generation_started', { tool: document.body.dataset.tool || document.title.split('|')[0].trim() || 'design' });
    try {
        var requestHeaders = {
            'Content-Type': 'application/json',
            'X-Housora-Analytics-Consent': window.HousoraAnalytics.consentHeader()
        };
        if (sessionToken) requestHeaders.Authorization = 'Bearer ' + sessionToken;
        var response = await fetch(endpoint, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify({ prompt: String(prompt || '').trim(), image: image })
        });
        if (!response.ok) {
            var payload = await response.json().catch(function() { return {}; });
            var apiError = payload.error && typeof payload.error === 'object' ? payload.error.message : payload.error;
            if (!signedIn && (payload.error && payload.error.code === 'guest_trial_used' || response.status === 401 || response.status === 403)) {
                try { localStorage.setItem('housora_guest_generation_used', '1'); } catch (_) {}
                if (window.housoraOpenAuth) window.housoraOpenAuth('signup', { redirect: window.location.pathname + window.location.search });
            }
            throw new Error(apiError || 'Generation failed.');
        }
        var blob = await response.blob();
        if (!blob.size || !blob.type.startsWith('image/')) throw new Error('Image provider did not return an image.');
        var resultUrl = await new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function() { resolve(reader.result); };
            reader.onerror = function() { reject(new Error('Could not prepare the generated image.')); };
            reader.readAsDataURL(blob);
        });
        var elapsed = Date.now() - startedAt;
        if (!signedIn) {
            try { localStorage.setItem('housora_guest_generation_used', '1'); } catch (_) {}
        }
        window.HousoraAnalytics.track('generation_succeeded', { duration_bucket: elapsed < 10000 ? 'under_10s' : elapsed < 30000 ? '10_to_30s' : elapsed < 60000 ? '30_to_60s' : 'over_60s' });
        return resultUrl;
    } catch (error) {
        var elapsed = Date.now() - startedAt;
        window.HousoraAnalytics.track('generation_failed', { duration_bucket: elapsed < 10000 ? 'under_10s' : elapsed < 30000 ? '10_to_30s' : elapsed < 60000 ? '30_to_60s' : 'over_60s' });
        throw error;
    }
}

async function requestHousoraGeneration(prompt, file) {
    return generateImage(prompt, file);
}

function initReferenceStyleTool() {
    var page = document.querySelector('.reference-style-page');
    if (!page || page.dataset.housoraInitialized === 'true') return false;
    page.dataset.housoraInitialized = 'true';
    var referenceInput = document.getElementById('referenceFileInput');
    var roomInput = document.getElementById('referenceRoomFileInput');
    var referenceZone = document.getElementById('referenceUploadZone');
    var roomZone = document.getElementById('referenceRoomUploadZone');
    var referencePreview = document.getElementById('referencePreview');
    var roomPreview = document.getElementById('referenceRoomPreview');
    var generateBtn = document.getElementById('referenceGenerateBtn');
    var generateHelp = document.getElementById('referenceGenerateHelp');
    var referenceFile = null;
    var roomFile = null;
    var errorEl = document.createElement('p');
    errorEl.className = 'reference-field-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.setAttribute('aria-live', 'polite');
    if (generateBtn && generateBtn.parentElement) generateBtn.parentElement.appendChild(errorEl);

    function showReferenceError(message, target) {
        errorEl.textContent = message;
        if (target) { target.setAttribute('aria-invalid', 'true'); target.focus(); }
    }
    function clearReferenceError() {
        errorEl.textContent = '';
        referenceZone.removeAttribute('aria-invalid');
        roomZone.removeAttribute('aria-invalid');
    }
    function updateReferenceState() {
        var ready = !!(referenceFile || preloaded) && !!roomFile;
        generateBtn.disabled = !ready;
        if (generateHelp) generateHelp.textContent = ready ? 'Both images are ready.' : 'Add both images to continue.';
    }

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
        input.addEventListener('change', function() { if (this.files && this.files[0]) { clearReferenceError(); setter(this.files[0]); preview(this.files[0], zone, image, emptyText); updateReferenceState(); } });
    }
    bind(referenceInput, referenceZone, referencePreview, function(file) { referenceFile = file; }, 'Reference image');
    bind(roomInput, roomZone, roomPreview, function(file) { roomFile = file; }, 'Room image');

    var preloaded = page.getAttribute('data-reference-src');
    if (preloaded && referencePreview) { referencePreview.src = preloaded; referencePreview.hidden = false; referenceZone.querySelector('span').hidden = true; }
    updateReferenceState();
    generateBtn.addEventListener('click', function() {
        clearReferenceError();
        if (!referenceFile && !preloaded) { showReferenceError('Please upload a reference image first.', referenceZone); return; }
        if (!roomFile) { showReferenceError('Please upload your room photo first.', roomZone); return; }
        var room = document.getElementById('referenceRoomType')?.value || 'Living Room';
        var style = document.getElementById('referenceStyleSelect')?.value || 'the reference image style';
        var palette = document.getElementById('referencePalette')?.value || 'natural';
        var prompt = 'Redesign the uploaded room photo using the visual style, materials, colors, furniture language, lighting mood, and composition cues from the uploaded reference image. Preserve the room photo architecture, camera angle, windows, doors, proportions, and perspective. Room type: ' + room + '. Style direction: ' + style + '. Color palette: ' + palette + '. Return one photorealistic result with no text, watermark, collage, or extra rooms.';
        var original = generateBtn.innerHTML;
        generateBtn.disabled = true; generateBtn.setAttribute('aria-busy', 'true'); generateBtn.innerHTML = 'Generating...';
        requestHousoraGeneration(prompt, roomFile).then(showGeneratedHousoraImage).catch(function(error) { showReferenceError(error.message || 'Generation failed. Please try again.'); }).finally(function() { generateBtn.removeAttribute('aria-busy'); generateBtn.innerHTML = original; updateReferenceState(); });
    });
}

function housoraStoredLikes() {
    try { return JSON.parse(localStorage.getItem('housora_workspace_likes') || '[]'); }
    catch (_) { return []; }
}

function saveHousoraLikes(likes) {
    try { localStorage.setItem('housora_workspace_likes', JSON.stringify(likes.slice(0, 30))); } catch (_) {}
}

function toggleGeneratedLike(imageUrl, title, button) {
    var likes = housoraStoredLikes();
    var key = 'generated:' + imageUrl;
    var index = likes.findIndex(function(item) { return item.path === key; });
    if (index >= 0) likes.splice(index, 1);
    else likes.unshift({ title: title || 'AI design', image: imageUrl, path: key, generated: true });
    saveHousoraLikes(likes);
    var saved = index < 0;
    if (button) {
        button.setAttribute('aria-pressed', saved ? 'true' : 'false');
        button.textContent = saved ? 'Saved to My likes' : 'Save to My likes';
    }
    return saved;
}

function syncGeneratedLikeButton(button, imageUrl, title) {
    if (!button || !imageUrl) return;
    var saved = housoraStoredLikes().some(function(item) { return item.path === 'generated:' + imageUrl; });
    button.setAttribute('aria-pressed', saved ? 'true' : 'false');
    button.textContent = saved ? 'Saved to My likes' : 'Save to My likes';
    button.onclick = function() { toggleGeneratedLike(imageUrl, title, button); };
}

function showGeneratedHousoraImage(imageUrl) {
    var workspaceResult = document.getElementById('workspaceResult');
    var workspaceImage = document.getElementById('workspaceResultImage');
    if (workspaceResult && workspaceImage) {
        workspaceImage.src = imageUrl;
        workspaceImage.alt = 'AI-generated room redesign';
        workspaceResult.hidden = false;
        document.body.classList.add('workspace-result-ready');
        syncGeneratedLikeButton(document.getElementById('workspaceLikeBtn'), imageUrl, 'AI room redesign');
        workspaceResult.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
        var workspaceProject = localStorage.getItem('housora_current_project');
        if (workspaceProject && window.convexClient && window.Clerk && window.Clerk.user) {
            persistGeneratedProjectImage(workspaceProject, imageUrl);
        }
        return;
    }
    var target = document.querySelector('#heroPreviewImg, #uploadPreviewImg, .generated-result img');
    if (target) {
        target.src = imageUrl;
        target.alt = 'AI-generated room redesign';
    }
    var result = document.querySelector('.generated-result');
    if (!result) {
        result = document.createElement('div');
        result.className = 'generated-result ph-no-capture';
        result.setAttribute('tabindex', '-1');
        var label = document.createElement('p');
        label.className = 'generated-result-label';
        label.textContent = 'YOUR AI DESIGN';
        var resultImage = document.createElement('img');
        resultImage.alt = 'AI-generated room redesign';
        var download = document.createElement('a');
        download.className = 'btn-primary';
        download.download = 'housora-design.png';
        download.textContent = 'DOWNLOAD DESIGN';
        var like = document.createElement('button');
        like.type = 'button';
        like.className = 'btn-secondary generated-like-button';
        result.append(label, resultImage, download, like);
        var host = document.querySelector('.id-configure-section, .create-page') || document.body;
        host.appendChild(result);
    }
    var img = result.querySelector('img');
    var link = result.querySelector('a');
    img.src = imageUrl;
    link.href = imageUrl;
    syncGeneratedLikeButton(result.querySelector('.generated-like-button'), imageUrl, 'AI room redesign');
    result.style.display = 'block';
    var currentProject = localStorage.getItem('housora_current_project');
    if (currentProject && window.convexClient && window.Clerk && window.Clerk.user) {
        persistGeneratedProjectImage(currentProject, imageUrl);
    }
    result.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    result.focus({ preventScroll: true });
}

async function persistGeneratedProjectImage(projectId, dataUrl) {
    try {
        var uploadUrl = await window.convexClient.mutation('uploads:generateUploadUrl', {});
        var blob = await (await fetch(dataUrl)).blob();
        var uploadResponse = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': blob.type || 'image/png' }, body: blob });
        if (!uploadResponse.ok) throw new Error('Image upload failed');
        var storageId = (await uploadResponse.json()).storageId;
        await window.convexClient.mutation('uploads:saveUpload', { storageId: storageId, fileName: 'generated-design.png' });
        try {
            await window.convexClient.mutation('projects:appendGeneratedImage', { projectId: projectId, storageId: storageId });
        } catch (_) {
            // Supports the currently deployed backend while it is upgraded.
            await window.convexClient.mutation('projects:updateProject', { projectId: projectId, afterImageStorageId: storageId });
        }
        return storageId;
    } catch (error) {
        console.warn('[Projects] Could not save generated image:', error);
        return null;
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
        promptInput.removeAttribute('aria-invalid');
        uploadBtn.removeAttribute('aria-invalid');
    }
    function updateSubmitState() {
        var hasPrompt = promptInput.value.trim().length > 0;
        var hasImage = selectedFile !== null;
        var enabled = hasPrompt && hasImage;
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
            setDynamicImageSource(previewImg, e.target.result);
            preview.style.display = 'block';
        uploadBtn.classList.add('has-image');
            window.HousoraAnalytics.track('image_uploaded', { file_type: file.type, file_size_bucket: file.size < 1000000 ? 'small' : file.size < 5000000 ? 'medium' : 'large' });
        };
        reader.readAsDataURL(file);
    }
    function clearPreview() {
        selectedFile = null;
        if (preview) preview.style.display = 'none';
        if (previewImg) setDynamicImageSource(previewImg, '');
        if (uploadBtn) uploadBtn.classList.remove('has-image');
        if (fileInput) fileInput.value = '';
        updateSubmitState();
    }

    // Public “Start free design” actions begin with authentication so every
    // new designer lands in the persistent AI-tools workspace after sign-in.
    uploadBtn.addEventListener('click', function() {
        window.location.href = '/sign-in?redirect=%2Fapp%2Fhome';
    });

    // ---- Keyboard: Enter/Space on upload button ----
    uploadBtn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            uploadBtn.click();
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
            showError('Upload a room photo and describe the design you want.');
            promptInput.setAttribute('aria-invalid', 'true');
            uploadBtn.setAttribute('aria-invalid', 'true');
            promptInput.focus();
            return;
        }

        if (!prompt) {
            showError('Please describe what you want (e.g. "Make it modern Scandinavian").');
            promptInput.setAttribute('aria-invalid', 'true');
            promptInput.focus();
            return;
        }

        if (!hasImage) {
            showError('Please upload a photo of your room to redesign.');
            uploadBtn.setAttribute('aria-invalid', 'true');
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

    // Initial state
    updateSubmitState();
}

// ===== HERO BAR MOBILE =====
function initHeroBarMobile() {
    var promptInput = document.getElementById('heroPromptInputMobile');
    var fileInput = document.getElementById('heroFileInputMobile');
    var uploadBtn = document.getElementById('heroUploadBtnMobile');
    var submitBtn = document.getElementById('heroSubmitBtnMobile');
    var errorEl = document.getElementById('heroBarError');
    if (!promptInput || !fileInput || !uploadBtn || !submitBtn) return;

    var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    var MAX_SIZE = 10 * 1024 * 1024;
    var selectedFile = null;

    function showError(message, target) {
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            errorEl.setAttribute('role', 'alert');
            errorEl.setAttribute('aria-live', 'assertive');
        }
        if (target) target.setAttribute('aria-invalid', 'true');
    }

    function clearError() {
        if (errorEl) { errorEl.textContent = ''; errorEl.style.display = 'none'; }
        promptInput.removeAttribute('aria-invalid');
        uploadBtn.removeAttribute('aria-invalid');
    }

    function updateSubmitState() {
        var hasPrompt = promptInput.value.trim().length > 0;
        var hasImage = selectedFile !== null;
        var enabled = hasPrompt && hasImage;
        submitBtn.disabled = !enabled;
        submitBtn.style.opacity = enabled ? '1' : '0.45';
        submitBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
    }

    uploadBtn.addEventListener('click', function() {
        window.location.href = '/sign-in?redirect=%2Fapp%2Fhome';
    });
    uploadBtn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); uploadBtn.click(); }
    });

    fileInput.addEventListener('change', function() {
        if (!this.files || !this.files.length) return;
        var file = this.files[0];
        clearError();
        if (ALLOWED_TYPES.indexOf(file.type) === -1) { this.value = ''; showError('Upload a JPG, PNG, or WebP image.', uploadBtn); uploadBtn.focus(); return; }
        if (file.size > MAX_SIZE) { this.value = ''; showError('The room photo must be 10 MB or smaller.', uploadBtn); uploadBtn.focus(); return; }
        selectedFile = file;
        updateSubmitState();
    });

    promptInput.addEventListener('input', function() { clearError(); updateSubmitState(); });
    promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!submitBtn.disabled) submitBtn.click(); }
    });

    submitBtn.addEventListener('click', function() {
        var prompt = promptInput.value.trim();
        var hasImage = selectedFile !== null;
        clearError();
        if (!prompt || !hasImage) {
            showError(!hasImage ? 'Upload a room photo before generating.' : 'Describe the design you want.', !hasImage ? uploadBtn : promptInput);
            (!hasImage ? uploadBtn : promptInput).focus();
            return;
        }

        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.innerHTML = '<span class="hero-submit-spinner"></span>';

        requestHousoraGeneration(prompt, selectedFile).then(function(imageUrl) {
            showGeneratedHousoraImage(imageUrl);
        }).catch(function(error) {
            showError(error.message || 'Generation failed. Please try again.');
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
        if (afterImg) setDynamicImageSource(afterImg, source === 'style' ? (styleImages[currentStyle] || roomAfterImages[currentRoom]) : (roomAfterImages[currentRoom] || styleImages[currentStyle] || roomAfterImages.living));
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
            window.location.href = '/sign-in?redirect=%2Fapp%2Fhome';
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
    uploadZone.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
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
        el.setAttribute('role', 'alert');
        el.textContent = msg;
        uploadZone.appendChild(el);
        uploadZone.setAttribute('aria-invalid', 'true');
        var templateError = document.getElementById('toolUploadError');
        if (templateError) templateError.textContent = msg;
    }

    function showUploadProgress(percent) {
        var existing = uploadZone.querySelector('.upload-progress');
        if (existing) existing.remove();
        var el = document.createElement('div');
        el.className = 'upload-progress';
        var track = document.createElement('div');
        track.className = 'upload-progress-track';
        var fill = document.createElement('div');
        fill.className = 'upload-progress-fill';
        fill.style.width = Math.max(0, Math.min(100, Number(percent) || 0)) + '%';
        var text = document.createElement('p');
        text.textContent = 'Uploading… ' + Math.round(Number(percent) || 0) + '%';
        track.appendChild(fill);
        el.append(track, text);
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
        uploadZone.removeAttribute('aria-invalid');
        var uploadError = document.getElementById('toolUploadError');
        if (uploadError) uploadError.textContent = '';

        // Show preview immediately using FileReader. The user's image must keep
        // its natural aspect ratio; generated demo crops are handled separately.
        var reader = new FileReader();
        reader.onload = function(e) {
            var beforeImg = document.querySelector('.demo-before img');
            if (beforeImg) {
                setDynamicImageSource(beforeImg, e.target.result);
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
        preview.replaceChildren();
        var img = document.createElement('img');
        img.id = 'uploadPreviewImg';
        img.alt = 'Uploaded room photo preview';
        var readyText = document.createElement('p');
        readyText.textContent = 'Photo ready — activate the upload area to replace it.';
        var removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'upload-remove';
        removeButton.textContent = 'Remove photo';
        preview.append(img, readyText, removeButton);
        img.src = dataUrl;
        img.title = fileName || 'Uploaded room photo';
        removeButton.addEventListener('click', function(e) {
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
            uploadZone.focus();
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
    const drawerBreakpoint = window.matchMedia('(max-width: 900px)');
    const isWorkspaceSidebar = document.body.classList.contains('workspace-surface');
    var returnFocus = null;
    function setBackgroundInert(inert) {
        document.querySelectorAll('.workspace-app-shell > .content-wrapper, .workspace-app-shell > .create-header').forEach(function(element) {
            element.inert = inert;
            element.setAttribute('aria-hidden', inert ? 'true' : 'false');
        });
    }
    function syncSidebarMode() {
        if (!sidebarNav) return;
        var isPersistent = isWorkspaceSidebar && !drawerBreakpoint.matches;
        if (isPersistent) {
            sidebarNav.classList.remove('open');
            sidebarNav.setAttribute('aria-hidden', 'false');
            sidebarNav.inert = false;
            if (sidebarOverlay) sidebarOverlay.classList.remove('open');
            if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            setBackgroundInert(false);
        } else if (!sidebarNav.classList.contains('open')) {
            sidebarNav.setAttribute('aria-hidden', 'true');
            sidebarNav.inert = true;
        }
    }
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    syncSidebarMode();
    function openSidebar() {
        returnFocus = document.activeElement;
        if (sidebarNav) sidebarNav.classList.add('open');
        if (sidebarOverlay) sidebarOverlay.classList.add('open');
        if (sidebarNav) { sidebarNav.setAttribute('aria-hidden', 'false'); sidebarNav.inert = false; }
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        if (isWorkspaceSidebar && drawerBreakpoint.matches) setBackgroundInert(true);
        if (sidebarClose) sidebarClose.focus();
    }
    function closeSidebar() {
        if (sidebarNav) sidebarNav.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('open');
        if (sidebarNav) { sidebarNav.setAttribute('aria-hidden', 'true'); sidebarNav.inert = true; }
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        setBackgroundInert(false);
        if (menuToggle && menuToggle.focus) menuToggle.focus();
    }
    if (menuToggle) menuToggle.addEventListener('click', openSidebar);
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
    if (sidebarNav) sidebarNav.addEventListener('click', function(event) {
        if (isWorkspaceSidebar && drawerBreakpoint.matches && event.target.closest('a[href]')) closeSidebar();
    });
    drawerBreakpoint.addEventListener('change', syncSidebarMode);
    document.querySelectorAll('.sidebar-section-header').forEach(function(header) {
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');
        function toggleSection() {
            const links = this.nextElementSibling;
            if (links && links.classList.contains('sidebar-links')) {
                var isOpen = links.classList.toggle('open');
                this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                const arrow = this.querySelector('.chevron');
                if (arrow) arrow.classList.toggle('rotated', isOpen);
            }
        }
        header.addEventListener('click', function() {
            toggleSection.call(this);
        });
        header.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleSection.call(this); }
        });
    });
    if (sidebarNav) sidebarNav.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') { event.preventDefault(); closeSidebar(); return; }
        if (event.key !== 'Tab') return;
        var focusable = Array.from(sidebarNav.querySelectorAll('a[href], button, [tabindex="0"]')).filter(function(el) { return !el.disabled && el.offsetParent !== null; });
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
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
        if (target) { target.scrollIntoView({ behavior: scrollBehavior(), block: 'center' }); target.focus({ preventScroll: true }); }
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
    var error = document.getElementById('toolGenerationError');

    function showToolError(message, target) {
        if (error) error.textContent = message;
        if (target) { target.setAttribute('aria-invalid', 'true'); target.focus(); }
    }

    function clearToolError() {
        if (error) error.textContent = '';
        uploadZone.removeAttribute('aria-invalid');
    }

    function selectedProjectId() {
        var fromUrl = new URL(window.location.href).searchParams.get('project');
        if (fromUrl && /^[A-Za-z0-9_-]{1,160}$/.test(fromUrl)) return fromUrl;
        try { return localStorage.getItem('housora_current_project'); } catch (_) { return null; }
    }

    function requireProject() {
        var projectId = selectedProjectId();
        if (projectId) {
            try { localStorage.setItem('housora_current_project', projectId); } catch (_) {}
            return true;
        }
        if (!error) return false;
        error.replaceChildren(document.createTextNode('Create a project before generating so your design has a home. '));
        var link = document.createElement('a');
        link.href = '/projects';
        link.textContent = 'Create a project';
        error.appendChild(link);
        return false;
    }

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

    uploadZone.addEventListener('housora:file-selected', clearToolError);
    uploadZone.addEventListener('housora:file-cleared', function() { generateBtn.disabled = true; clearToolError(); });
    generateBtn.addEventListener('click', function() {
        var file = window.__HousoraToolFile;
        clearToolError();
        if (!file) { showToolError('Please upload a photo first.', uploadZone); return; }
        if (!window.Clerk || !window.Clerk.user) {
            window.location.href = '/sign-up?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
            return;
        }
        if (!requireProject()) return;
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
        generateBtn.textContent = 'Generating…';
        requestHousoraGeneration(buildPrompt(), file).then(function(imageUrl) {
            showGeneratedHousoraImage(imageUrl);
        }).catch(function(error) {
            showToolError(error.message || 'Generation failed. Please try again.', generateBtn);
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
    document.querySelectorAll('.room-type-grid, .style-grid, .palette-grid').forEach(function(grid) {
        grid.setAttribute('role', 'radiogroup');
        var section = grid.closest('.sidebar-section');
        var label = section && section.querySelector('.sidebar-label');
        if (label) grid.setAttribute('aria-label', label.textContent.trim());
    });
    document.querySelectorAll('.room-option, .style-option, .palette-option').forEach(function(opt) {
        opt.setAttribute('role', 'radio');
        opt.setAttribute('tabindex', opt.classList.contains('active') ? '0' : '-1');
        opt.setAttribute('aria-checked', opt.classList.contains('active') ? 'true' : 'false');
        function selectOption() {
            const grid = this.parentElement;
            grid.querySelectorAll('.room-option, .style-option, .palette-option').forEach(function(o) {
                o.classList.remove('active');
                o.setAttribute('aria-checked', 'false');
                o.setAttribute('tabindex', '-1');
            });
            this.classList.add('active');
            this.setAttribute('aria-checked', 'true');
            this.setAttribute('tabindex', '0');
        }
        opt.addEventListener('click', selectOption);
        opt.addEventListener('keydown', function(event) {
            var options = Array.from(this.parentElement.querySelectorAll('[role="radio"]'));
            var index = options.indexOf(this);
            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                selectOption.call(this);
                return;
            }
            var direction = (event.key === 'ArrowRight' || event.key === 'ArrowDown') ? 1 : (event.key === 'ArrowLeft' || event.key === 'ArrowUp') ? -1 : 0;
            if (!direction) return;
            event.preventDefault();
            var next = options[(index + direction + options.length) % options.length];
            selectOption.call(next);
            next.focus();
        });
    });
    document.querySelectorAll('.tab-item, .tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.tab-item, .tab').forEach(function(t) { t.classList.remove('tab-active', 'active'); t.removeAttribute('aria-current'); });
            this.classList.add('tab-active', 'active');
            this.setAttribute('aria-current', 'page');
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
    document.querySelectorAll('.room-option[data-room]').forEach(function(el) { el.classList.toggle('active', el.getAttribute('data-room') === room); });
    document.querySelectorAll('.style-option[data-style]').forEach(function(el) { el.classList.toggle('active', el.getAttribute('data-style') === style); });
    document.querySelectorAll('.palette-option[data-palette]').forEach(function(el) { el.classList.toggle('active', el.getAttribute('data-palette') === palette); });
    var budgetInput = document.getElementById('workspaceBudget');
    var budgetAmount = document.querySelector('.budget-amount');
    if (budgetInput) budgetInput.value = budget;
    if (budgetAmount) budgetAmount.textContent = '$' + Number(budget).toLocaleString();
    var inputPhoto = document.querySelector('.workspace-input-photo');
    var fileInput = document.getElementById('workspaceFileInput');
    var uploadButton = document.getElementById('workspaceUploadBtn');
    var replaceButton = document.getElementById('workspaceReplacePhoto');
    var uploadError = document.getElementById('workspaceUploadError');
    var overlay = document.querySelector('.analyzing-overlay');
    var statusTitle = document.getElementById('workspaceStatusTitle');
    var statusText = document.getElementById('workspaceStatusText');
    var pctEl = document.getElementById('analyzePct');
    var uploadedPhoto = null;
    var prompt = document.getElementById('workspacePrompt');
    var generateBtn = document.getElementById('workspaceGenerateBtn');
    var sendBtn = document.querySelector('.page-workspace .send-btn');
    var promptError = document.getElementById('workspacePromptError');
    var result = document.getElementById('workspaceResult');
    var resultImage = document.getElementById('workspaceResultImage');
    var downloadButton = document.getElementById('workspaceDownloadBtn');
    var shareButton = document.getElementById('workspaceShareBtn');
    var startOverButton = document.getElementById('workspaceStartOverBtn');
    var actionStatus = document.getElementById('workspaceActionStatus');
    var allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    var maxSize = 10 * 1024 * 1024;
    var homePrompt = params.get('prompt');
    if (prompt && homePrompt && !prompt.value.trim()) prompt.value = homePrompt.slice(0, 500);
    function updateWorkspaceSubmitState() {
        var ready = !!window.__HousoraToolFile && !!(prompt && prompt.value.trim());
        if (generateBtn) generateBtn.disabled = !ready;
        if (sendBtn) sendBtn.disabled = !ready;
    }
    function clearUploadError() { if (uploadError) uploadError.textContent = ''; }
    function showUploadError(message) {
        if (uploadError) uploadError.textContent = message;
        if (uploadButton) uploadButton.focus();
    }
    function setWorkspacePhoto(file, source, persist) {
        window.__HousoraToolFile = file;
        document.body.classList.remove('workspace-empty');
        if (overlay) overlay.classList.remove('empty-state');
        if (inputPhoto) { setDynamicImageSource(inputPhoto, source); inputPhoto.alt = 'Your uploaded room photo'; }
        if (statusTitle) statusTitle.textContent = 'ROOM PHOTO READY';
        if (statusText) statusText.textContent = 'Choose a room, style, palette, and budget, then describe the result you want.';
        if (pctEl) pctEl.textContent = file.name || 'Ready';
        if (uploadButton) uploadButton.hidden = true;
        if (replaceButton) replaceButton.hidden = false;
        if (prompt && !prompt.value.trim()) prompt.value = 'Redesign this ' + room + ' in a ' + style + ' style with a ' + palette + ' palette.';
        clearUploadError();
        updateWorkspaceSubmitState();
        if (persist) {
            try { sessionStorage.setItem('housora_first_design_photo', source); } catch (_) {}
        }
    }
    function acceptWorkspaceFile(file) {
        clearUploadError();
        if (!file) return;
        if (allowedTypes.indexOf(file.type) === -1) { showUploadError('Choose a JPG, PNG, or WebP image.'); return; }
        if (file.size > maxSize) { showUploadError('This image is larger than 10 MB. Choose a smaller file.'); return; }
        var reader = new FileReader();
        reader.onload = function() { setWorkspacePhoto(file, reader.result, true); };
        reader.onerror = function() { showUploadError('This image could not be read. Try another file.'); };
        reader.readAsDataURL(file);
    }
    if (uploadButton) uploadButton.addEventListener('click', function() { if (fileInput) fileInput.click(); });
    if (replaceButton) replaceButton.addEventListener('click', function() { if (fileInput) fileInput.click(); });
    if (fileInput) fileInput.addEventListener('change', function() { acceptWorkspaceFile(this.files && this.files[0]); this.value = ''; });
    if (overlay) {
        overlay.addEventListener('dragover', function(event) { event.preventDefault(); overlay.classList.add('is-dragging'); });
        overlay.addEventListener('dragleave', function() { overlay.classList.remove('is-dragging'); });
        overlay.addEventListener('drop', function(event) {
            event.preventDefault(); overlay.classList.remove('is-dragging');
            acceptWorkspaceFile(event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]);
        });
    }
    try { uploadedPhoto = sessionStorage.getItem('housora_first_design_photo'); } catch (e) {}
    if (uploadedPhoto) {
        fetch(uploadedPhoto).then(function(response) { return response.blob(); }).then(function(blob) {
            var restoredFile = new File([blob], 'room-upload.' + ((blob.type || '').split('/')[1] || 'png'), { type: blob.type || 'image/png' });
            setWorkspacePhoto(restoredFile, uploadedPhoto, false);
        }).catch(function() { document.body.classList.add('workspace-empty'); });
    } else document.body.classList.add('workspace-empty');
    if (prompt) {
        if (!uploadedPhoto) prompt.placeholder = 'Upload a room photo before describing your design';
        prompt.addEventListener('input', function() {
            prompt.removeAttribute('aria-invalid');
            if (promptError) promptError.textContent = '';
            updateWorkspaceSubmitState();
        });
    }
    if (sendBtn && generateBtn) sendBtn.addEventListener('click', function() { generateBtn.click(); });
    if (downloadButton) downloadButton.addEventListener('click', function() {
        if (!resultImage || !resultImage.src) return;
        var link = document.createElement('a');
        link.href = resultImage.src; link.download = 'housora-design.png';
        document.body.appendChild(link); link.click(); link.remove();
        if (actionStatus) actionStatus.textContent = 'Download started.';
    });
    if (shareButton) shareButton.addEventListener('click', async function() {
        if (!resultImage || !resultImage.src) return;
        try {
            var blob = await (await fetch(resultImage.src)).blob();
            var file = new File([blob], 'housora-design.png', { type: blob.type || 'image/png' });
            if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
                await navigator.share({ title: 'My Housora design', files: [file] });
                if (actionStatus) actionStatus.textContent = 'Design shared.';
            } else if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })]);
                if (actionStatus) actionStatus.textContent = 'Design copied to your clipboard.';
            } else throw new Error('Sharing is not supported');
        } catch (error) {
            if (error && error.name === 'AbortError') return;
            if (actionStatus) actionStatus.textContent = 'Sharing is unavailable here. Use Download instead.';
        }
    });
    if (startOverButton) startOverButton.addEventListener('click', function() {
        try { sessionStorage.removeItem('housora_first_design_photo'); } catch (_) {}
        window.__HousoraToolFile = null;
        document.body.classList.add('workspace-empty');
        document.body.classList.remove('workspace-result-ready');
        if (overlay) overlay.classList.add('empty-state');
        if (inputPhoto) { setDynamicImageSource(inputPhoto, '/static/images/room-before.jpg'); inputPhoto.alt = 'Example room photo placeholder'; }
        if (statusTitle) statusTitle.textContent = 'UPLOAD A ROOM TO BEGIN';
        if (pctEl) pctEl.textContent = 'No photo selected';
        if (statusText) statusText.textContent = 'Choose a JPG, PNG, or WebP image up to 10 MB. Your photo stays private and is used only for the design you request.';
        if (uploadButton) uploadButton.hidden = false;
        if (replaceButton) replaceButton.hidden = true;
        if (result) result.hidden = true;
        if (prompt) prompt.value = '';
        if (actionStatus) actionStatus.textContent = '';
        updateWorkspaceSubmitState();
        if (uploadButton) uploadButton.focus();
    });
    updateWorkspaceSubmitState();
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
    function addTextElement(tag, text, className) {
        var element = document.createElement(tag);
        if (className) element.className = className;
        element.textContent = text;
        card.appendChild(element);
    }
    function render(status) {
        card.replaceChildren();
        if (!status || !status.plan || status.plan === 'free') {
            addTextElement('h2', 'Your current plan');
            addTextElement('p', 'No paid plan is active yet. Choose a plan above whenever you are ready.');
            return;
        }
        var interval = status.subscriptionBillingInterval === 'yearly' ? 'yearly' : 'monthly';
        var end = status.subscriptionEnd ? new Date(status.subscriptionEnd).toLocaleDateString() : 'managed through Whop';
        addTextElement('h2', 'Active plan: ' + String(status.plan).toUpperCase());
        addTextElement('p', String(status.credits || 0) + ' image credits available this month. Billing: ' + interval + '.');
        addTextElement('p', 'Cancel future renewals in Whop, or contact support for a refund review. Subscription end: ' + end + '.', 'plan-status-note');
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
        document.querySelectorAll('.pricing-card, .workspace-plan-card').forEach(function(card) {
            var monthly = card.querySelector('.price-monthly');
            var annual = card.querySelector('.price-annual');
            var originalMonthly = card.querySelector('.price-original-monthly');
            var originalAnnual = card.querySelector('.price-original-annual');
            var periodEl = card.querySelector('.price-period');
            var annualTotal = card.querySelector('.annual-total');
            var annualTotalLabel = card.querySelector('.annual-total-label');
            var monthlyBillingNote = card.querySelector('.monthly-billing-note');
            var yearlyBillingNote = card.querySelector('.yearly-billing-note');
            if (monthly) { monthly.hidden = period !== 'monthly'; monthly.style.display = period === 'monthly' ? 'inline' : 'none'; }
            if (annual) { annual.hidden = period !== 'yearly'; annual.style.display = period === 'yearly' ? 'inline' : 'none'; }
            if (originalMonthly) { originalMonthly.hidden = period !== 'monthly'; originalMonthly.style.display = period === 'monthly' ? 'inline' : 'none'; }
            if (originalAnnual) { originalAnnual.hidden = period !== 'yearly'; originalAnnual.style.display = period === 'yearly' ? 'inline' : 'none'; }
            if (periodEl && periodEl.hasAttribute('data-billing-period')) {
                var localizedPeriod = window.HousoraI18n && window.HousoraI18n.t
                    ? window.HousoraI18n.t('pricing.per_month')
                    : ' / month';
                periodEl.textContent = localizedPeriod;
            }
            if (annualTotal) { annualTotal.hidden = period !== 'yearly'; annualTotal.style.display = period === 'yearly' ? 'inline' : 'none'; }
            if (annualTotalLabel) { annualTotalLabel.hidden = period !== 'yearly'; annualTotalLabel.style.display = period === 'yearly' ? 'inline' : 'none'; }
            if (monthlyBillingNote) { monthlyBillingNote.hidden = period !== 'monthly'; monthlyBillingNote.style.display = period === 'monthly' ? 'inline' : 'none'; }
            if (yearlyBillingNote) { yearlyBillingNote.hidden = period !== 'yearly'; yearlyBillingNote.style.display = period === 'yearly' ? 'inline' : 'none'; }
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
        if (caption) caption.textContent = 'Yearly includes about 2 months free compared with paying the promotional monthly rate.';
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
    var pendingCheckoutButton = null;
    var termsAccepted = document.getElementById('checkout-terms-accepted');
    var immediatePerformance = document.getElementById('checkout-immediate-performance');
    var legalError = document.getElementById('checkout-legal-error');
    var legalNotice = document.getElementById('checkout-legal-notice');
    var continueButton = document.getElementById('checkout-legal-continue');
    var closeButton = document.getElementById('checkout-legal-close');

    function closeLegalNotice() {
        if (!legalNotice) return;
        legalNotice.hidden = true;
        if (legalError) { legalError.hidden = true; legalError.textContent = ''; }
        if (pendingCheckoutButton && typeof pendingCheckoutButton.focus === 'function') pendingCheckoutButton.focus();
        pendingCheckoutButton = null;
    }

    async function startCheckout(self) {
            if (!termsAccepted || !immediatePerformance || !termsAccepted.checked || !immediatePerformance.checked) {
                if (legalError) {
                    legalError.textContent = 'Please accept both checkout acknowledgements before continuing.';
                    legalError.hidden = false;
                }
                var firstUnchecked = !termsAccepted || !termsAccepted.checked ? termsAccepted : immediatePerformance;
                if (firstUnchecked && typeof firstUnchecked.focus === 'function') firstUnchecked.focus();
                return;
            }
            if (legalError) {
                legalError.textContent = '';
                legalError.hidden = true;
            }
            var monthlyPlan = self.getAttribute('data-plan-monthly');
            var yearlyPlan = self.getAttribute('data-plan-yearly');
            var isYearly = document.getElementById('yearlyBtn') && document.getElementById('yearlyBtn').classList.contains('active');
            var planId = isYearly ? yearlyPlan : monthlyPlan;

            if (!planId || !planId.trim()) {
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

                var isLocalKtor = /^(127\.0\.0\.1|localhost)$/.test(window.location.hostname);
                var res = await fetch(isLocalKtor ? '/whop/checkout' : '/api/whop/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Bearer ' + sessionToken,
                        'X-Housora-Analytics-Consent': window.HousoraAnalytics.consentHeader()
                    },
                    body: new URLSearchParams({
                        planId: planId,
                        termsAccepted: 'true',
                        immediatePerformanceRequested: 'true',
                        legalVersion: '2026-08-13'
                    }).toString()
                });
                var data = await res.json();
                if (data.error) {
                    var checkoutErrorCode = data.error.code || 'checkout_failed';
                    var checkoutErrorMessage = data.error.message || (typeof data.error === 'string' ? data.error : 'Checkout could not be started.');
                    window.HousoraAnalytics.track('checkout_failed', { error_code: String(checkoutErrorCode).slice(0, 80) });
                    showCheckoutError(checkoutErrorMessage);
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
    }

    document.querySelectorAll('.whop-checkout').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            pendingCheckoutButton = this;
            if (legalNotice) {
                legalNotice.hidden = false;
                if (legalError) { legalError.hidden = true; legalError.textContent = ''; }
                setTimeout(function() { (termsAccepted || legalNotice).focus(); }, 0);
                return;
            }
            startCheckout(this);
        });
    });
    if (continueButton) continueButton.addEventListener('click', function() {
        if (!pendingCheckoutButton) return;
        var selectedButton = pendingCheckoutButton;
        if (!termsAccepted || !immediatePerformance || !termsAccepted.checked || !immediatePerformance.checked) {
            if (legalError) {
                legalError.textContent = 'Please confirm both items before continuing.';
                legalError.hidden = false;
            }
            var firstUnchecked = !termsAccepted || !termsAccepted.checked ? termsAccepted : immediatePerformance;
            if (firstUnchecked && typeof firstUnchecked.focus === 'function') firstUnchecked.focus();
            return;
        }
        if (legalNotice) legalNotice.hidden = true;
        startCheckout(selectedButton);
    });
    if (closeButton) closeButton.addEventListener('click', closeLegalNotice);
    if (legalNotice) legalNotice.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') closeLegalNotice();
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
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }); target.focus({ preventScroll: true }); }
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

    var consentKey = 'housora-consent-v2';
    var consentVersion = 2;
    var consentLifetimeMs = 180 * 24 * 60 * 60 * 1000;
    var savedConsent = null;
    try {
        savedConsent = JSON.parse(localStorage.getItem(consentKey) || 'null');
        if (!savedConsent || savedConsent.version !== consentVersion || !savedConsent.expiresAt || savedConsent.expiresAt <= Date.now()) {
            savedConsent = null;
            localStorage.removeItem(consentKey);
        }
        localStorage.removeItem('housora-consent-v1');
        localStorage.removeItem('cookiebot-consent');
    } catch (_) { savedConsent = null; }
    var defaults = { necessary: true, analytics: false };
    var previouslyFocused = null;
    var preferencesOpen = false;
    function setPreferences(open) {
        preferencesOpen = open;
        panel.classList.toggle('preferences-open', open);
        panel.setAttribute('role', open ? 'dialog' : 'region');
        if (open) panel.setAttribute('aria-modal', 'true');
        else panel.removeAttribute('aria-modal');
    }
    function applyConsentToControls(consent) {
        panel.querySelectorAll('.cookiebot-checkbox').forEach(function(cb) {
            cb.checked = cb.name === 'necessary' ? true : consent[cb.name] === true;
            var row = cb.closest('.cookiebot-toggle-row');
            var toggle = row ? row.querySelector('.cookiebot-toggle') : null;
            if (toggle) toggle.classList.toggle('active', cb.checked);
        });
    }
    function saveConsent(consent) {
        var now = Date.now();
        savedConsent = {
            necessary: true,
            analytics: consent.analytics === true,
            version: consentVersion,
            timestamp: now,
            expiresAt: now + consentLifetimeMs
        };
        localStorage.setItem(consentKey, JSON.stringify(savedConsent));
        panel.style.display = 'none';
        panel.setAttribute('aria-hidden', 'true');
        setPreferences(false);
        if (window.HousoraAnalytics) window.HousoraAnalytics.applyConsent(savedConsent.analytics);
        if (window.gtag) {
            window.gtag('consent', 'update', {
                analytics_storage: savedConsent.analytics ? 'granted' : 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
            });
        }
        window.dispatchEvent(new CustomEvent('housora:consent-changed', { detail: { analytics: savedConsent.analytics, version: consentVersion } }));
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    }
    applyConsentToControls(savedConsent || defaults);
    panel.style.display = savedConsent ? 'none' : 'block';
    panel.setAttribute('aria-hidden', savedConsent ? 'true' : 'false');
    if (savedConsent && window.HousoraAnalytics) window.HousoraAnalytics.applyConsent(savedConsent.analytics === true);

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

    // Allow analytics. This must not depend on the current checkbox value.
    var okBtn = document.getElementById('cookiebot-ok-btn');
    if (okBtn) {
        okBtn.addEventListener('click', function() {
            saveConsent({ necessary: true, analytics: true });
        });
    }

    var necessaryBtn = document.getElementById('cookiebot-necessary-btn');
    if (necessaryBtn) necessaryBtn.addEventListener('click', function() {
        saveConsent({ necessary: true, analytics: false });
    });
    var saveBtn = document.getElementById('cookiebot-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', function() {
        var consent = { necessary: true, analytics: false };
        panel.querySelectorAll('.cookiebot-checkbox').forEach(function(cb) { consent[cb.name] = cb.checked; });
        saveConsent(consent);
    });
    var manageBtn = document.getElementById('cookiebot-manage-btn');
    if (manageBtn) manageBtn.addEventListener('click', function() {
        previouslyFocused = this;
        setPreferences(true);
        var analyticsChoice = panel.querySelector('input[name="analytics"]');
        if (analyticsChoice) analyticsChoice.focus();
    });

    var settingsBtn = document.getElementById('cookie-settings-btn');
    if (settingsBtn) settingsBtn.addEventListener('click', function() {
        previouslyFocused = this;
        applyConsentToControls(savedConsent || defaults);
        panel.style.display = 'block';
        panel.setAttribute('aria-hidden', 'false');
        setPreferences(true);
        var firstChoice = panel.querySelector('input[name="analytics"]');
        if (firstChoice) firstChoice.focus();
    });
    panel.addEventListener('keydown', function(event) {
        if (!preferencesOpen) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            setPreferences(false);
            if (previouslyFocused) previouslyFocused.focus();
            return;
        }
        if (event.key !== 'Tab') return;
        var items = Array.from(panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')).filter(function(el) { return el.offsetParent !== null; });
        if (!items.length) return;
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
        else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
    });
}

// Mobile footer accordions retain the full desktop sitemap without creating a long first view.
function initFooterAccordions() {
    document.querySelectorAll('.footer-accordion-trigger').forEach(function(trigger) {
        var content = document.getElementById(trigger.getAttribute('aria-controls'));
        if (!content) return;
        trigger.addEventListener('click', function() {
            if (!window.matchMedia('(max-width: 700px)').matches) return;
            var expanded = trigger.getAttribute('aria-expanded') === 'true';
            trigger.setAttribute('aria-expanded', String(!expanded));
            content.hidden = expanded;
        });
    });
    function syncFooter() {
        var mobile = window.matchMedia('(max-width: 700px)').matches;
        document.querySelectorAll('.footer-accordion-trigger').forEach(function(trigger) {
            var content = document.getElementById(trigger.getAttribute('aria-controls'));
            if (!content) return;
            if (mobile) { trigger.setAttribute('aria-expanded', 'false'); content.hidden = true; }
            else { trigger.setAttribute('aria-expanded', 'true'); content.hidden = false; }
        });
    }
    syncFooter();
    window.addEventListener('resize', syncFooter);
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
    window.Housora.getImagesRemaining = window.Housora.getCredits;
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

function initWorkspaceAccountPages() {
    var usagePage = document.querySelector('.workspace-usage-page');
    var planPage = document.querySelector('.workspace-plan-page');
    if (!usagePage && !planPage) return;
    var stateRoot = usagePage || planPage;
    if (stateRoot.dataset.housoraInitialized === 'true') return false;
    stateRoot.dataset.housoraInitialized = 'true';
    var allowanceByPlan = { free: 3, standard: 100, pro: 190 };
    var loadAttempt = 0;
    function setText(id, value) { var element = document.getElementById(id); if (element) { element.textContent = value; element.classList.remove('workspace-value-skeleton'); element.removeAttribute('aria-label'); } }
    function setProgress(id, percent) { var element = document.getElementById(id); if (element) { var value = Math.max(0, Math.min(100, percent)); element.style.width = value + '%'; var track = element.parentElement; if (track && track.getAttribute('role') === 'progressbar') track.setAttribute('aria-valuenow', String(value)); } }
    function friendlyPlan(plan) { var value = String(plan || 'free'); return value.charAt(0).toUpperCase() + value.slice(1); }
    function render(status) {
        status = status || { plan: 'free', credits: 0, subscriptionStatus: 'inactive' };
        var plan = String(status.plan || 'free').toLowerCase();
        var remaining = Math.max(0, Number(status.credits) || 0);
        var allowance = allowanceByPlan[plan] || Math.max(remaining, 1);
        var used = Math.max(0, allowance - remaining);
        var percent = allowance ? Math.round((used / allowance) * 100) : 0;
        var planName = friendlyPlan(plan);
        var menuPlan = document.getElementById('workspace-user-menu-plan');
        if (menuPlan) menuPlan.textContent = planName + ' · ' + remaining.toLocaleString() + ' left';
        var interval = status.subscriptionBillingInterval === 'yearly' ? 'yearly' : 'monthly';
        var end = status.subscriptionEnd ? new Date(status.subscriptionEnd).toLocaleDateString() : (plan === 'free' ? 'No renewal date' : 'Managed through checkout');
        var state = String(status.subscriptionStatus || (plan === 'free' ? 'active' : 'active')).replace(/_/g, ' ');

        setText('usage-remaining-value', remaining.toLocaleString());
        setText('usage-remaining-caption', remaining === 1 ? '1 image ready to use' : remaining.toLocaleString() + ' images ready to use');
        setText('usage-used-value', used.toLocaleString());
        setText('usage-allowance-value', allowance.toLocaleString());
        setText('usage-plan-caption', planName + ' plan · ' + interval + ' billing');
        setText('usage-percent-label', percent + '% used');
        setText('usage-breakdown-used', used.toLocaleString() + (used === 1 ? ' image' : ' images'));
        setText('usage-plan-name', planName);
        setText('usage-plan-status', state.charAt(0).toUpperCase() + state.slice(1));
        setText('usage-plan-end', end);
        setProgress('usage-large-progress', percent);
        var summary = document.getElementById('workspaceUsageSummary');
        if (summary) { summary.classList.remove('workspace-usage-loading'); summary.setAttribute('aria-busy', 'false'); }
        var loadError = document.getElementById('workspaceUsageError');
        if (loadError) loadError.hidden = true;

        setText('workspace-plan-page-name', planName);
        setText('workspace-plan-page-usage', remaining.toLocaleString() + ' of ' + allowance.toLocaleString() + ' images remaining');
        setProgress('workspace-plan-page-progress', Math.round((remaining / allowance) * 100));
        document.querySelectorAll('.workspace-plan-card').forEach(function(card) {
            var current = card.getAttribute('data-plan-key') === plan;
            card.classList.toggle('is-current', current);
            var label = card.querySelector('.workspace-plan-current-label');
            var action = card.querySelector('.workspace-plan-action');
            if (label) label.hidden = !current;
            if (action) {
                action.hidden = current;
                action.setAttribute('aria-hidden', current ? 'true' : 'false');
            }
        });
    }
    function renderUnavailable(message) {
        setText('usage-remaining-value', 'Unavailable');
        setText('usage-used-value', 'Unavailable');
        setText('usage-allowance-value', 'Unavailable');
        setText('usage-percent-label', 'Unavailable');
        setText('usage-breakdown-used', 'Unavailable');
        setText('usage-remaining-caption', message);
        setText('workspace-plan-page-usage', message);
        var summary = document.getElementById('workspaceUsageSummary');
        if (summary) { summary.classList.remove('workspace-usage-loading'); summary.setAttribute('aria-busy', 'false'); }
        var loadError = document.getElementById('workspaceUsageError');
        if (loadError) loadError.hidden = false;
    }
    function load() {
        loadAttempt += 1;
        var convexAuth = window.housoraConvexAuthState;
        if (convexAuth && (convexAuth.status === 'session-missing' || convexAuth.status === 'token-failure')) {
            renderUnavailable(convexAuth.error || 'Your sign-in session could not be verified. Refresh or sign in again.');
            return;
        }
        var authReady = window.housoraAuthState && window.housoraAuthState.status === 'ready';
        if (!authReady || !window.convexClient) {
            if (loadAttempt < 50) window.setTimeout(load, 120);
            else renderUnavailable('Usage is temporarily unavailable. Refresh to try again.');
            return;
        }
        if (!window.Clerk || !window.Clerk.user) {
            renderUnavailable('Sign in to view your allowance.');
            return;
        }
        window.convexClient.query('users:getSubscriptionStatus', { clerkId: window.Clerk.user.id })
            .then(render)
            .catch(function() { renderUnavailable('Usage is temporarily unavailable. Refresh to try again.'); });
    }
    load();
    document.getElementById('workspaceUsageRetry')?.addEventListener('click', function() { loadAttempt = 0; load(); });
    window.addEventListener('clerk:ready', function() { loadAttempt = 0; load(); });
    window.addEventListener('housora:convex-auth-state', function() { loadAttempt = 0; load(); });
    return true;
}

// ===== WORKSPACE HOME =====
function initWorkspaceHome() {
    var home = document.querySelector('.workspace-home');
    if (!home || home.dataset.housoraInitialized === 'true') return false;
    home.dataset.housoraInitialized = 'true';
    var promptInput = document.getElementById('workspace-home-prompt');
    var recentGrid = document.getElementById('workspaceRecentGrid');
    var status = document.getElementById('workspaceHomeStatus');
    var empty = document.getElementById('workspaceHomeEmpty');
    var likedGrid = document.getElementById('workspaceLikedGrid');
    var likesEmpty = document.getElementById('workspaceLikesEmpty');
    var likeButtons = Array.from(document.querySelectorAll('.workspace-like-button'));
    var loadAttempt = 0;
    var skeletons = document.getElementById('workspaceHomeSkeletons');

    // The home library is a small state machine.  Rendering one state at a
    // time prevents a stale empty/error message from remaining alongside the
    // final project cards after Clerk or Convex becomes available.
    function setLibraryState(next, message) {
        if (skeletons) skeletons.hidden = next !== 'loading';
        if (recentGrid) recentGrid.hidden = next !== 'populated';
        if (empty) empty.hidden = next !== 'empty';
        if (status) {
            status.replaceChildren();
            status.hidden = next === 'populated' || next === 'empty';
            if (message) status.append(document.createTextNode(message));
            if (next === 'error') {
                var retry = document.createElement('button');
                retry.type = 'button';
                retry.className = 'workspace-inline-retry';
                retry.textContent = 'Retry';
                retry.addEventListener('click', function() { loadAttempt = 0; setLibraryState('loading', 'Loading your latest images…'); loadRecent(); });
                status.append(document.createTextNode(' '), retry);
            }
        }
    }
    function setCardImage(image, source, alt) {
        image.src = source || '/static/images/room-after.jpg';
        image.alt = alt;
        image.width = 800;
        image.height = 560;
        image.loading = 'lazy';
        image.addEventListener('error', function() {
            if (image.dataset.fallbackApplied) { image.classList.add('media-unavailable'); return; }
            image.dataset.fallbackApplied = 'true';
            image.src = '/static/images/room-after.jpg';
            image.alt = alt + ' — image preview unavailable';
        }, { once: true });
    }

    document.querySelectorAll('[data-home-prompt]').forEach(function(button) {
        button.addEventListener('click', function() {
            if (!promptInput) return;
            promptInput.value = button.getAttribute('data-home-prompt') || '';
            promptInput.focus();
        });
    });

    function storedLikes() {
        try { return JSON.parse(localStorage.getItem('housora_workspace_likes') || '[]'); }
        catch (_) { return []; }
    }
    function saveLikes(likes) {
        try { localStorage.setItem('housora_workspace_likes', JSON.stringify(likes)); } catch (_) {}
    }
    function renderLikes() {
        if (!likedGrid || !likesEmpty) return;
        var likes = storedLikes();
        likedGrid.replaceChildren();
        likesEmpty.hidden = likes.length > 0;
        likes.forEach(function(item) {
            var article = document.createElement('article');
            article.className = 'workspace-liked-card';
            var link = document.createElement('a');
            link.href = item.path || '/examples';
            var image = document.createElement('img');
            setCardImage(image, item.image, (item.title || 'Saved design') + ' inspiration');
            var copy = document.createElement('div');
            var title = document.createElement('h3');
            title.textContent = item.title || 'Saved inspiration';
            var detail = document.createElement('p');
            detail.textContent = 'Open this design tool →';
            copy.append(title, detail);
            link.append(image, copy);
            article.appendChild(link);
            likedGrid.appendChild(article);
        });
        likeButtons.forEach(function(button) {
            var active = likes.some(function(item) { return item.path === button.getAttribute('data-like-path'); });
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            button.textContent = active ? '♥' : '♡';
            button.setAttribute('aria-label', (active ? 'Remove ' : 'Save ') + (button.getAttribute('data-like-title') || 'example') + (active ? ' from My likes' : ' to My likes'));
        });
    }
    likeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            var path = button.getAttribute('data-like-path');
            var likes = storedLikes();
            var existing = likes.findIndex(function(item) { return item.path === path; });
            if (existing >= 0) likes.splice(existing, 1);
            else likes.unshift({ title: button.getAttribute('data-like-title'), image: button.getAttribute('data-like-image'), path: path });
            saveLikes(likes.slice(0, 12));
            renderLikes();
        });
    });
    renderLikes();

    function renderRecent(projects) {
        if (!recentGrid || !empty) return;
        recentGrid.replaceChildren();
        var usable = (projects || []).filter(function(project) { return project.afterImageUrl || project.beforeImageUrl; }).slice(0, 4);
        setLibraryState(usable.length ? 'populated' : 'empty');
        usable.forEach(function(project) {
            var article = document.createElement('article');
            article.className = 'workspace-recent-card';
            var link = document.createElement('a');
            link.href = '/design?project=' + encodeURIComponent(project._id);
            var image = document.createElement('img');
            setCardImage(image, project.afterImageUrl || project.beforeImageUrl, 'Preview of ' + (project.title || 'Untitled project'));
            var copy = document.createElement('div');
            var title = document.createElement('h3');
            title.textContent = project.title || 'Untitled project';
            var date = document.createElement('p');
            date.textContent = 'Updated ' + new Date(project.updatedAt || project.createdAt).toLocaleDateString();
            copy.append(title, date);
            link.append(image, copy);
            article.appendChild(link);
            recentGrid.appendChild(article);
        });
    }
    function loadRecent() {
        loadAttempt += 1;
        var convexAuth = window.housoraConvexAuthState;
        if (convexAuth && (convexAuth.status === 'session-missing' || convexAuth.status === 'token-failure')) {
            setLibraryState('error', convexAuth.error || 'Your library session could not be verified.');
            return;
        }
        var authReady = window.housoraAuthState && window.housoraAuthState.status === 'ready';
        if (!authReady || !window.convexClient) {
            if (loadAttempt < 50) window.setTimeout(loadRecent, 120);
            else setLibraryState('error', 'Your library is temporarily unavailable.');
            return;
        }
        if (!window.Clerk || !window.Clerk.user) {
            setLibraryState('signed-out', 'Sign in to view your latest images.');
            return;
        }
        setLibraryState('loading', 'Loading your latest images…');
        window.convexClient.query('projects:listProjects', {})
            .then(renderRecent)
            .catch(function() { setLibraryState('error', 'Your latest images could not be loaded.'); });
        window.convexClient.query('users:getSubscriptionStatus', { clerkId: window.Clerk.user.id })
            .then(function(result) {
                var credit = document.getElementById('workspace-sidebar-credits');
                if (credit) credit.textContent = Math.max(0, Number(result && result.credits) || 0) + ' left';
                var menuPlan = document.getElementById('workspace-user-menu-plan');
                if (menuPlan) {
                    var planName = String(result && result.plan || 'free');
                    menuPlan.textContent = planName.charAt(0).toUpperCase() + planName.slice(1) + ' · ' + Math.max(0, Number(result && result.credits) || 0) + ' left';
                }
            }).catch(function() {});
    }
    loadRecent();
    window.addEventListener('clerk:ready', function() { loadAttempt = 0; loadRecent(); });
    window.addEventListener('housora:convex-auth-state', function() { loadAttempt = 0; loadRecent(); });
    return true;
}

function initWorkspaceChrome() {
    if (document.documentElement.dataset.housoraWorkspaceChromeInitialized === 'true') return false;
    document.documentElement.dataset.housoraWorkspaceChromeInitialized = 'true';
    var menu = document.getElementById('workspace-account-menu');
    var trigger = document.getElementById('workspace-user-trigger');
    var topProfile = document.getElementById('workspace-profile-button');
    var openProfile = document.getElementById('workspace-open-profile');
    var settingsButton = document.getElementById('workspace-open-settings');
    var settingsLinks = document.getElementById('workspace-settings-links');
    var chromePlanAttempt = 0;
    function loadAccountPlanSummary() {
        if (!window.Clerk || !window.Clerk.loaded || !window.Clerk.user || !window.convexClient) {
            if (chromePlanAttempt < 10) {
                chromePlanAttempt += 1;
                window.setTimeout(loadAccountPlanSummary, 300);
            }
            return;
        }
        window.convexClient.query('users:getSubscriptionStatus', { clerkId: window.Clerk.user.id })
            .then(function(status) {
                var plan = String(status && status.plan || 'free');
                var remaining = Math.max(0, Number(status && status.credits) || 0);
                var planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
                var menuPlan = document.getElementById('workspace-user-menu-plan');
                if (menuPlan) menuPlan.textContent = planLabel + ' · ' + remaining.toLocaleString() + ' left';
            })
            .catch(function() {});
    }
    function setMenu(open) {
        if (!menu || !trigger) return;
        menu.hidden = !open;
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
            var first = menu.querySelector('a, button');
            if (first) first.focus();
        }
    }
    function toggleMenu() { setMenu(!!menu && menu.hidden); }
    if (trigger) trigger.addEventListener('click', toggleMenu);
    if (topProfile) topProfile.addEventListener('click', toggleMenu);
    if (settingsButton && settingsLinks) {
        settingsButton.addEventListener('click', function() {
            var open = settingsLinks.hidden;
            settingsLinks.hidden = !open;
            settingsButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }
    if (openProfile) openProfile.addEventListener('click', function() {
        if (window.Clerk && typeof window.Clerk.openUserProfile === 'function') window.Clerk.openUserProfile();
        else window.location.href = '/sign-in?redirect=' + encodeURIComponent(window.location.pathname);
    });
    document.addEventListener('click', function(event) {
        if (!menu || menu.hidden || !trigger) return;
        if (!menu.contains(event.target) && !trigger.contains(event.target) && (!topProfile || !topProfile.contains(event.target))) setMenu(false);
    });
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && menu && !menu.hidden) { setMenu(false); trigger.focus(); return; }
        if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
        var target = event.target;
        if (target && /input|textarea|select/i.test(target.tagName)) return;
        var prompt = document.getElementById('workspace-home-prompt');
        if (prompt) { event.preventDefault(); prompt.focus(); }
    });
    loadAccountPlanSummary();
    window.addEventListener('clerk:ready', function() { chromePlanAttempt = 0; loadAccountPlanSummary(); });
    window.addEventListener('housora:convex-auth-state', function() { chromePlanAttempt = 0; loadAccountPlanSummary(); });
    return true;
}

// ===== PROJECTS =====
function initHousoraProjects() {
    var grid = document.getElementById('projectsGrid');
    var empty = document.getElementById('projectsEmpty');
    var message = document.getElementById('projectsMessage');
    var newBtn = document.getElementById('newProjectBtn');
    var authGate = document.getElementById('projectsAuthGate');
    var signInBtn = document.getElementById('projectsSignInBtn');
    var skeletons = document.getElementById('projectsSkeletons');
    var errorState = document.getElementById('projectsError');
    var retry = document.getElementById('projectsRetry');
    var toolbar = document.getElementById('projectsToolbar');
    var dialogBackdrop = document.getElementById('projectDialogBackdrop');
    var dialogInput = document.getElementById('projectNameInput');
    var dialogError = document.getElementById('projectDialogError');
    var dialogSubmit = document.getElementById('projectDialogSubmit');
    var dialogClose = document.getElementById('projectDialogClose');
    var dialogCancel = document.getElementById('projectDialogCancel');
    var emptyCreateBtn = document.getElementById('projectsEmptyCreateBtn');
    // This renderer owns the project-area listeners and dynamic cards.  It can
    // be called by auth recovery as often as needed, but it must only bind
    // itself once for the current server-rendered page.
    if (!grid || grid.dataset.housoraInitialized === 'true') return false;
    grid.dataset.housoraInitialized = 'true';

    function authReady() {
        return !!(window.housoraAuthState && window.housoraAuthState.status === 'ready') || !!(window.Clerk && window.Clerk.loaded);
    }
    function userSignedIn() { return !!(window.Clerk && window.Clerk.user); }
    function clientReady() { return !!window.convexClient; }
    function showMessage(text, isError) {
        if (message) { message.textContent = text; message.classList.toggle('is-error', !!isError); }
    }
    function closeCreateDialog() {
        if (!dialogBackdrop) return;
        dialogBackdrop.hidden = true;
        if (newBtn) newBtn.focus();
    }
    function openCreateDialog() {
        if (!userSignedIn()) { window.location.href = '/sign-in?redirect=/projects'; return; }
        if (!clientReady()) { showMessage('Your project library is still connecting. Try again in a moment.', true); return; }
        if (!dialogBackdrop || !dialogInput) return;
        dialogBackdrop.hidden = false;
        if (dialogError) dialogError.textContent = '';
        dialogInput.value = '';
        window.setTimeout(function() { dialogInput.focus(); }, 0);
    }
    function createNamedProject() {
        var title = dialogInput && dialogInput.value.trim();
        if (!title) {
            if (dialogError) dialogError.textContent = 'Give your project a name to continue.';
            if (dialogInput) dialogInput.focus();
            return;
        }
        if (!clientReady() || !dialogSubmit) return;
        dialogSubmit.disabled = true;
        dialogSubmit.textContent = 'Creating…';
        window.convexClient.mutation('projects:createProject', {
            title: title, roomType: 'Unassigned', style: 'Unassigned'
        }).then(function(id) {
            window.HousoraAnalytics.track('project_created');
            localStorage.setItem('housora_current_project', id);
            window.location.href = '/projects?project=' + encodeURIComponent(id);
        }).catch(function(error) {
            if (dialogError) dialogError.textContent = error.message || 'Could not create the project. Please try again.';
            dialogSubmit.disabled = false;
            dialogSubmit.textContent = 'Create project';
        });
    }
    function selectedProjectId() { return new URL(window.location.href).searchParams.get('project'); }
    function renderProjectDetail(project) {
        if (!project) return;
        if (toolbar) toolbar.hidden = true;
        if (empty) empty.style.display = 'none';
        grid.style.display = 'block';
        grid.replaceChildren();
        var detail = document.createElement('article');
        detail.className = 'project-detail';
        var back = document.createElement('a');
        back.className = 'project-detail-back'; back.href = '/projects'; back.textContent = '← All projects';
        var eyebrow = document.createElement('span'); eyebrow.className = 'workspace-eyebrow'; eyebrow.textContent = 'PROJECT';
        var title = document.createElement('h2'); title.textContent = project.title || 'Untitled Project';
        var copy = document.createElement('p');
        var imageUrls = project.imageUrls && project.imageUrls.length ? project.imageUrls : (project.afterImageUrl ? [project.afterImageUrl] : []);
        var hasImage = imageUrls.length > 0 || !!project.beforeImageUrl;
        copy.textContent = hasImage ? 'Your generated designs are saved here. Download any version or continue creating in this project.' : 'This project is ready for its first room design.';
        var actions = document.createElement('div'); actions.className = 'project-detail-actions';
        var editor = document.createElement('a'); editor.className = 'project-detail-primary'; editor.href = '/interior-design?project=' + encodeURIComponent(project._id); editor.textContent = hasImage ? 'Create another design' : 'Create first design';
        actions.appendChild(editor);
        detail.append(back, eyebrow, title, copy);
        if (hasImage) {
            var gallery = document.createElement('div'); gallery.className = 'project-detail-gallery';
            (imageUrls.length ? imageUrls : [project.beforeImageUrl]).forEach(function(imageUrl, index) {
                var figure = document.createElement('figure');
                var image = document.createElement('img'); image.src = imageUrl; image.alt = 'Saved design ' + (index + 1) + ' for ' + (project.title || 'project');
                var download = document.createElement('a'); download.className = 'project-detail-secondary'; download.href = imageUrl; download.download = (project.title || 'housora-design').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-' + (index + 1) + '.png'; download.textContent = 'Download image';
                figure.append(image, download); gallery.appendChild(figure);
            });
            detail.appendChild(gallery);
        } else {
            var emptyArt = document.createElement('div'); emptyArt.className = 'project-detail-empty-art'; emptyArt.textContent = 'Your first design will appear here.'; detail.appendChild(emptyArt);
        }
        detail.appendChild(actions); grid.appendChild(detail);
    }
    function showSignedOutState() {
        if (authGate) authGate.style.display = 'block';
        if (newBtn) newBtn.style.display = 'none';
        grid.style.display = 'none';
        if (empty) empty.style.display = 'none';
        showMessage('');
        if (authGate && !authGate.querySelector('.projects-signup-link')) {
            var signup = document.createElement('a');
            signup.href = '/sign-up?redirect=/projects';
            signup.className = 'projects-signup-link btn-secondary';
            signup.textContent = 'Create an account';
            authGate.appendChild(signup);
        }
    }
    function render(projects) {
        if (skeletons) skeletons.hidden = true;
        if (errorState) errorState.hidden = true;
        var selectedId = selectedProjectId();
        var selected = selectedId && projects.find(function(project) { return project._id === selectedId; });
        if (selected) { renderProjectDetail(selected); return; }
        if (toolbar) toolbar.hidden = projects.length === 0;
        grid.replaceChildren();
        if (!projects.length) {
            grid.style.display = 'none';
            if (empty) {
                empty.style.display = 'block';
                if (!empty.querySelector('.projects-empty-cta')) {
                    var emptyCta = document.createElement('a');
                    emptyCta.href = '/app/home#workspace-tools';
                    emptyCta.className = 'projects-empty-cta btn-primary';
                    emptyCta.textContent = 'Choose a tool';
                    empty.appendChild(emptyCta);
                }
            }
            return;
        }
        grid.style.display = 'grid';
        if (empty) empty.style.display = 'none';
        projects.forEach(function(project) {
            var card = document.createElement('article');
            card.className = 'project-card';
            card.dataset.projectId = project._id;
            card.tabIndex = 0;
            card.setAttribute('role', 'link');
            var preview = project.afterImageUrl || project.beforeImageUrl || '/static/images/room-after.jpg';
            var previewWrap = document.createElement('div');
            previewWrap.className = 'project-preview';
            var image = document.createElement('img');
            image.alt = 'Preview of ' + (project.title || 'Untitled Project');
            image.src = preview;
            var deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'project-delete-btn';
            deleteButton.setAttribute('aria-label', 'Delete ' + (project.title || 'untitled project'));
            deleteButton.textContent = '×';
            previewWrap.append(image, deleteButton);
            var info = document.createElement('div');
            info.className = 'project-info';
            var name = document.createElement('h2');
            name.className = 'project-name';
            name.textContent = project.title || 'Untitled Project';
            var date = document.createElement('p');
            date.className = 'project-date';
            date.textContent = 'Updated ' + new Date(project.updatedAt || project.createdAt).toLocaleDateString();
            info.append(name, date);
            card.append(previewWrap, info);
            function openProject() {
                window.HousoraAnalytics.track('project_opened');
                localStorage.setItem('housora_current_project', project._id);
                window.location.href = '/projects?project=' + encodeURIComponent(project._id);
            }
            card.addEventListener('click', openProject);
            card.addEventListener('keydown', function(event) {
                if (event.target === card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openProject(); }
            });
            deleteButton.addEventListener('click', function(event) {
                event.stopPropagation();
                if (!confirm('Delete this project? This cannot be undone.')) return;
                window.HousoraAnalytics.track('project_deleted');
                window.convexClient.mutation('projects:deleteProject', { projectId: project._id })
                    .then(function() { if (localStorage.getItem('housora_current_project') === project._id) localStorage.removeItem('housora_current_project'); load(); }).catch(function(error) { showMessage(error.message || 'Could not delete the project.', true); });
            });
            grid.appendChild(card);
        });
    }
    function load(attempt) {
        attempt = attempt || 0;
        var convexAuth = window.housoraConvexAuthState;
        if (convexAuth && (convexAuth.status === 'session-missing' || convexAuth.status === 'token-failure')) {
            if (authGate) authGate.style.display = 'none';
            if (skeletons) skeletons.hidden = true;
            if (errorState) errorState.hidden = false;
            showMessage(convexAuth.error || 'Your project library session could not be verified. Refresh or sign in again.', true);
            return;
        }
        if (!authReady()) {
            if (authGate) authGate.style.display = 'none';
            if (newBtn) newBtn.style.display = 'none';
            grid.style.display = 'none';
            if (empty) empty.style.display = 'none';
            showMessage('Preparing your projects…');
            if (attempt < 50) window.setTimeout(function() { load(attempt + 1); }, 120);
            return;
        }
        if (!userSignedIn()) { showSignedOutState(); return; }
        if (!clientReady()) {
            if (authGate) authGate.style.display = 'none';
            if (newBtn) newBtn.style.display = 'none';
            grid.style.display = 'none';
            if (empty) empty.style.display = 'none';
            showMessage(attempt < 50 ? 'Connecting to your project library…' : 'Your project library is temporarily unavailable. Refresh the page to try again.', attempt >= 50);
            if (attempt < 50) window.setTimeout(function() { load(attempt + 1); }, 120);
            return;
        }
        if (authGate) authGate.style.display = 'none';
        if (newBtn) newBtn.style.display = '';
        grid.style.display = '';
        showMessage('Loading your projects…');
        if (skeletons) skeletons.hidden = false;
        if (errorState) errorState.hidden = true;
        window.convexClient.query('projects:listProjects', {})
            .then(function(projects) { showMessage(''); render(projects || []); })
            .catch(function(error) {
                showMessage('', false);
                if (skeletons) skeletons.hidden = true;
                if (errorState) errorState.hidden = false;
                if (errorState) {
                    var detail = errorState.querySelector('.projects-error-detail');
                    if (!detail) {
                        detail = document.createElement('p');
                        detail.className = 'projects-error-detail';
                        errorState.appendChild(detail);
                    }
                    detail.textContent = 'We could not reach your project library. Retry, or refresh after checking your connection.';
                }
            });
    }
    if (newBtn) newBtn.addEventListener('click', openCreateDialog);
    if (emptyCreateBtn) emptyCreateBtn.addEventListener('click', openCreateDialog);
    if (dialogSubmit) dialogSubmit.addEventListener('click', createNamedProject);
    if (dialogInput) dialogInput.addEventListener('keydown', function(event) { if (event.key === 'Enter') { event.preventDefault(); createNamedProject(); } });
    if (dialogClose) dialogClose.addEventListener('click', closeCreateDialog);
    if (dialogCancel) dialogCancel.addEventListener('click', closeCreateDialog);
    if (dialogBackdrop) dialogBackdrop.addEventListener('click', function(event) { if (event.target === dialogBackdrop) closeCreateDialog(); });
    document.addEventListener('keydown', function(event) { if (event.key === 'Escape' && dialogBackdrop && !dialogBackdrop.hidden) closeCreateDialog(); });
    if (signInBtn) signInBtn.addEventListener('click', function() {
        if (window.housoraOpenAuth) window.housoraOpenAuth('signin');
        else window.location.href = '/sign-in?redirect=/projects';
    });
    if (retry) retry.addEventListener('click', function() { load(0); });
    load();
    window.addEventListener('clerk:ready', function() { setTimeout(function() { load(0); }, 0); });
    window.addEventListener('housora:convex-auth-state', function() { load(0); });
    // The bootstrap script can finish before this page script is evaluated.
    // Re-check the already-ready state so the gate cannot remain stuck on
    // “Sign in” after a successful Clerk session is available.
    if (window.housoraAuthState && window.housoraAuthState.status === 'ready') {
        setTimeout(function() { load(0); }, 0);
    }
    return true;
}

// ===== IMAGE AND LIKES LIBRARY =====
function initWorkspaceLibrary() {
    var grid = document.getElementById('workspaceLibraryGrid');
    var empty = document.getElementById('workspaceLibraryEmpty');
    var status = document.getElementById('workspaceLibraryStatus');
    if (!grid || grid.dataset.housoraInitialized === 'true') return false;
    grid.dataset.housoraInitialized = 'true';
    var isImages = window.location.pathname === '/app/images';
    function setState(message, emptyState) {
        if (status) { status.textContent = message || ''; status.hidden = !message; }
        if (empty) empty.hidden = !emptyState;
        grid.hidden = !!emptyState;
    }
    function makeCard(item, project) {
        var card = document.createElement('article'); card.className = 'workspace-library-card';
        var image = document.createElement('img'); image.src = item.image; image.alt = item.title || 'Saved Housora design';
        var content = document.createElement('div');
        var title = document.createElement('h2'); title.textContent = item.title || 'Untitled design';
        var meta = document.createElement('p'); meta.textContent = project ? 'Saved in project' : 'Saved to My likes';
        var actions = document.createElement('div'); actions.className = 'workspace-library-card-actions';
        var open = document.createElement('a'); open.className = 'workspace-library-open';
        open.href = project ? '/projects?project=' + encodeURIComponent(project._id) : '/interior-design'; open.textContent = project ? 'Open project' : 'Create a design';
        var download = document.createElement('a'); download.className = 'workspace-library-download'; download.href = item.image; download.download = 'housora-design.png'; download.textContent = 'Download';
        actions.append(open, download); content.append(title, meta, actions); card.append(image, content); grid.appendChild(card);
    }
    function renderLikes() {
        grid.replaceChildren();
        var likes = housoraStoredLikes();
        if (!likes.length) { setState('', true); return; }
        setState('', false);
        likes.forEach(function(item) { if (item.image) makeCard(item, null); });
    }
    function renderImages(projects) {
        grid.replaceChildren();
        var images = projects.flatMap(function(project) {
            var urls = project.imageUrls && project.imageUrls.length ? project.imageUrls : (project.afterImageUrl ? [project.afterImageUrl] : []);
            return urls.map(function(imageUrl, index) { return { project: project, imageUrl: imageUrl, index: index }; });
        });
        if (!images.length) { setState('', true); return; }
        setState('', false);
        images.forEach(function(item) { makeCard({ title: item.project.title + (item.index ? ' · Design ' + (item.index + 1) : ''), image: item.imageUrl }, item.project); });
    }
    function load(attempt) {
        attempt = attempt || 0;
        if (!isImages) { renderLikes(); return; }
        if (!window.Clerk || !window.Clerk.user || !window.convexClient) {
            if (attempt < 50) { window.setTimeout(function() { load(attempt + 1); }, 120); return; }
            setState('Your image library is temporarily unavailable. Refresh to try again.', false); return;
        }
        setState('Loading your images…', false);
        window.convexClient.query('projects:listProjects', {}).then(renderImages).catch(function() {
            setState('Your image library could not be loaded. Refresh to try again.', false);
        });
    }
    load();
    window.addEventListener('clerk:ready', function() { load(0); });
    window.addEventListener('housora:convex-auth-state', function() { load(0); });
    return true;
}

// ===== EXAMPLES COLLECTION =====
function initExamplesCollection() {
    var cards = Array.from(document.querySelectorAll('[data-example]'));
    var search = document.getElementById('examples-search');
    var room = document.getElementById('examples-room-filter');
    var style = document.getElementById('examples-style-filter');
    var count = document.getElementById('examples-result-count');
    if (!cards.length || !search || !room || !style || search.dataset.housoraInitialized === 'true') return false;
    search.dataset.housoraInitialized = 'true';
    function update() {
        var query = search.value.trim().toLowerCase();
        var visible = 0;
        cards.forEach(function(card) {
            var rooms = (card.dataset.rooms || '').toLowerCase();
            var haystack = (card.textContent + ' ' + (card.dataset.style || '') + ' ' + rooms).toLowerCase();
            var matches = (!query || haystack.includes(query)) && (!room.value || rooms.includes(room.value)) && (!style.value || card.dataset.style === style.value);
            card.hidden = !matches;
            card.classList.toggle('is-room-filtered', Boolean(room.value));
            card.querySelectorAll('.style-room-tile[data-room]').forEach(function(tile) {
                tile.hidden = Boolean(room.value) && tile.dataset.room !== room.value;
            });
            if (matches) visible += 1;
        });
        if (count) count.textContent = visible + (visible === 1 ? ' style' : ' styles') + ' shown' + (room.value ? ' · ' + room.options[room.selectedIndex].text + ' view' : '');
    }
    [search, room, style].forEach(function(control) { control.addEventListener('input', update); control.addEventListener('change', update); });
    document.querySelectorAll('.style-item a[href^="#style-"]').forEach(function(link) {
        link.addEventListener('click', function() {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) { style.value = target.dataset.style || ''; update(); }
        });
    });
    update();
    return true;
}

function initPublicSidebarAccountMenu() {
    var trigger = document.getElementById('sidebar-user-info');
    var menu = document.getElementById('sidebar-public-account-menu');
    if (!trigger || !menu || trigger.dataset.housoraInitialized === 'true') return false;
    trigger.dataset.housoraInitialized = 'true';
    trigger.addEventListener('click', function() {
        var opening = menu.hidden;
        menu.hidden = !opening;
        trigger.setAttribute('aria-expanded', String(opening));
    });
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && !menu.hidden) {
            menu.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();
        }
    });
    return true;
}

// ===== TOOL CARD SLIDESHOW =====
function initToolCardSlideshow() {
    if (prefersReducedMotion()) return;
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
            var isWorkspace = btn.classList.contains('btn-design-room');
            var promptInput = isWorkspace ? document.getElementById('workspacePrompt') : null;
            var errorEl = isWorkspace ? document.getElementById('workspacePromptError') : null;
            var room = document.querySelector('.room-option.active .room-name');
            var style = document.querySelector('.style-option.active .style-name');
            var palette = document.querySelector('.palette-option.active .palette-name');
            var budget = document.querySelector('.budget-amount');
            var prompt = 'Redesign this ' + (room ? room.textContent.trim().toLowerCase() : 'room') + ' with a photorealistic interior design. Use the ' + (style ? style.textContent.trim() : 'selected') + ' style, the ' + (palette ? palette.textContent.trim() : 'neutral') + ' color palette, and keep the result within a ' + (budget ? budget.textContent.trim() : 'reasonable') + ' furniture budget while preserving the room architecture.';
            if (promptInput && promptInput.value.trim()) prompt = promptInput.value.trim() + ' ' + prompt;
            if (!file) {
                if (errorEl) errorEl.textContent = 'Upload a room photo before generating.';
                return;
            }
            if (promptInput && !promptInput.value.trim()) {
                promptInput.setAttribute('aria-invalid', 'true');
                if (errorEl) errorEl.textContent = 'Describe the design you want before generating.';
                promptInput.focus();
                return;
            }
            if (errorEl) errorEl.textContent = '';
            var original = btn.innerHTML;
            btn.disabled = true;
            btn.setAttribute('aria-busy', 'true');
            btn.textContent = 'GENERATING…';
            requestHousoraGeneration(prompt, file).then(function(imageUrl) {
                showGeneratedHousoraImage(imageUrl);
            }).catch(function(error) {
                if (errorEl) {
                    errorEl.textContent = error.message || 'Generation failed. Please try again.';
                    errorEl.focus && errorEl.focus();
                }
            }).finally(function() {
                btn.disabled = false;
                btn.removeAttribute('aria-busy');
                btn.innerHTML = original;
            });
        });
    });
}

// ===== INIT ALL =====
// A single guarded entry point keeps pages safe when a browser integration,
// test harness, or future partial-navigation layer invokes startup again.
function initHousoraPage() {
    if (window.__housoraPageInitialized) return false;
    window.__housoraPageInitialized = true;
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
    initWhopCheckout();
    initExamplesCollection();
    initPublicSidebarAccountMenu();
    handleCheckoutRedirects();
    initConvexCredits();
    initWorkspaceAccountPages();
    initWorkspaceHome();
    initWorkspaceLibrary();
    initWorkspaceChrome();
    initHousoraProjects();
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
    initFooterAccordions();
    initGlobalImageFallback();
    initResponsiveImages();
    return true;
}

window.initHousoraPage = initHousoraPage;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHousoraPage, { once: true });
} else {
    initHousoraPage();
}

// ===== RESPONSIVE LOCAL IMAGES =====
function initResponsiveImages() {
    fetch('/static/assets/responsive-images.json').then(function(response) {
        if (!response.ok) throw new Error('Responsive image manifest unavailable');
        return response.json();
    }).then(function(manifest) {
        document.querySelectorAll('img[src^="/static/images/"]').forEach(function(img) {
            if (img.dataset.dynamicSource === 'true' || img.dataset.responsive === 'false') return;
            var pathname = new URL(img.currentSrc || img.src, window.location.href).pathname;
            var entry = manifest.images && manifest.images[pathname];
            if (!entry || img.parentElement.tagName === 'PICTURE') return;
            var picture = document.createElement('picture');
            ['avif', 'webp'].forEach(function(format) {
                if (!entry.sources[format] || !entry.sources[format].length) return;
                var source = document.createElement('source');
                source.type = 'image/' + format;
                source.srcset = entry.sources[format].map(function(candidate) {
                    return candidate.path + ' ' + candidate.width + 'w';
                }).join(', ');
                source.sizes = img.getAttribute('sizes') || '(max-width: 640px) 100vw, ' + entry.width + 'px';
                picture.appendChild(source);
            });
            if (!img.hasAttribute('width')) img.width = entry.width;
            if (!img.hasAttribute('height')) img.height = entry.height;
            if (entry.placeholder) img.dataset.neutralPlaceholder = 'true';
            img.parentNode.insertBefore(picture, img);
            picture.appendChild(img);
        });
    }).catch(function() {
        // The optimized formats are progressive enhancement; JPEG remains.
    });
}

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
        img.classList.add('media-unavailable');
        img.dataset.mediaUnavailable = 'true';
        if (!img.hasAttribute('alt')) {
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
