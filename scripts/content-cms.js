(function () {
    const config = window.TFSCmsConfig || {};
    const sanityConfig = config.sanity || {};
    const projectId = String(sanityConfig.projectId || "").trim();
    const dataset = String(sanityConfig.dataset || "").trim();
    const apiVersion = String(sanityConfig.apiVersion || "").trim();
    const documentId = String(sanityConfig.leadershipDocumentId || "leadershipPageSingleton").trim();
    const useCdn = sanityConfig.useCdn !== false;

    if (!projectId || !dataset || !apiVersion) {
        return;
    }

    const ceoName = document.getElementById("leadership-ceo-name");
    const ceoBio1 = document.getElementById("leadership-ceo-bio1");
    const ceoPortrait = document.getElementById("leadership-ceo-photo");
    const supervisorViewport = document.getElementById("leadership-supervisor-viewport");
    const supervisorGrid = document.getElementById("leadership-supervisor-grid");
    const sliderHintLeft = document.getElementById("leadership-slider-hint-left");
    const sliderHintRight = document.getElementById("leadership-slider-hint-right");
    const visibleCards = 3;
    const sliderSmoothDurationMs = 460;
    const wheelDeltaThreshold = 44;
    const touchSwipeThreshold = 48;
    const dragSwipeThresholdMin = 18;
    const dragSwipeThresholdRatio = 0.045;
    const dragIntentThreshold = 4;
    const sliderState = {
        currentIndex: 0,
        totalSteps: 1,
        isActive: false,
        cardOffsets: []
    };
    let wheelScrollLocked = false;
    let wheelLockFallbackTimer = 0;
    let wheelDeltaBuffer = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchIsTracking = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragLastX = 0;
    let dragIsTracking = false;
    let dragMoved = false;

    if (!supervisorGrid) {
        return;
    }

    function updateSliderControls() {
        if (sliderHintLeft) {
            sliderHintLeft.hidden = !sliderState.isActive || sliderState.currentIndex <= 0;
        }

        if (sliderHintRight) {
            sliderHintRight.hidden = !sliderState.isActive || sliderState.currentIndex >= sliderState.totalSteps - 1;
        }
    }

    function resetSupervisorSlider() {
        sliderState.currentIndex = 0;
        sliderState.totalSteps = 1;
        sliderState.isActive = false;
        sliderState.cardOffsets = [];
        wheelDeltaBuffer = 0;
        touchIsTracking = false;
        dragIsTracking = false;
        dragMoved = false;
        releaseWheelScrollLock();

        if (supervisorViewport) {
            supervisorViewport.classList.remove("leadership-slider-dragging");
        }

        if (supervisorGrid) {
            supervisorGrid.classList.remove("leadership-grid-slider");
            supervisorGrid.style.transform = "";
            supervisorGrid.style.transitionDuration = "";
        }

        updateSliderControls();
    }

    function applySupervisorSliderPosition(smooth) {
        const targetOffset = sliderState.cardOffsets[sliderState.currentIndex] || 0;

        if (!supervisorGrid) {
            return;
        }

        supervisorGrid.style.transitionDuration = smooth ? String(sliderSmoothDurationMs) + "ms" : "0ms";
        supervisorGrid.style.transform = "translate3d(-" + String(targetOffset) + "px, 0, 0)";
    }

    function moveSupervisorSlider(nextIndex, smooth) {
        if (!sliderState.isActive) {
            return;
        }

        const boundedIndex = Math.max(0, Math.min(nextIndex, sliderState.totalSteps - 1));

        sliderState.currentIndex = boundedIndex;
        updateSliderControls();
        applySupervisorSliderPosition(smooth);
    }

    function measureSupervisorSliderCards() {
        const cards = supervisorGrid.querySelectorAll(".team-card");

        sliderState.cardOffsets = Array.prototype.map.call(cards, function (card) {
            return card.offsetLeft;
        });
    }

    function initializeSupervisorSlider() {
        const cards = supervisorGrid.querySelectorAll(".team-card");

        if (!cards.length || cards.length <= visibleCards || !supervisorViewport) {
            resetSupervisorSlider();
            return;
        }

        supervisorGrid.classList.add("leadership-grid-slider");
        sliderState.totalSteps = cards.length - visibleCards + 1;
        sliderState.currentIndex = 0;
        sliderState.isActive = true;
        measureSupervisorSliderCards();

        updateSliderControls();
        moveSupervisorSlider(0, false);
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getSanityImageUrl(photo) {
        if (!photo || typeof photo !== "object") {
            return "";
        }

        if (photo.asset && typeof photo.asset.url === "string") {
            return photo.asset.url;
        }

        if (typeof photo.asset === "string") {
            return photo.asset;
        }

        return "";
    }

    function buildSupervisorCard(supervisor) {
        const department = escapeHtml(supervisor.department || "Department");
        const name = escapeHtml(supervisor.name || "Unnamed Supervisor");
        const role = escapeHtml(supervisor.role || "Supervisor");
        const description = escapeHtml(supervisor.description || "");
        const photoUrl = getSanityImageUrl(supervisor.photo);
        const avatar = photoUrl
            ? '        <img class="supervisor-avatar-image" src="' + escapeHtml(photoUrl) + '" alt="' + name + '" loading="lazy">'
            : '        <div class="supervisor-avatar" aria-hidden="true"></div>';

        return [
            '<article class="team-card">',
            '    <p class="eyebrow eyebrow-tight-sm">' + department + "</p>",
            '    <div class="supervisor-profile">',
            avatar,
            '        <div class="supervisor-meta">',
            '            <h3>' + name + "</h3>",
            '            <p class="supervisor-role">' + role + "</p>",
            "        </div>",
            "    </div>",
            '    <p class="copy-top-10">' + description + "</p>",
            "</article>"
        ].join("\n");
    }

    function buildStatusCard(title, message) {
        return [
            '<article class="team-card leadership-status-card">',
            '    <p class="eyebrow eyebrow-tight-sm">Leadership</p>',
            '    <h3>' + escapeHtml(title) + '</h3>',
            '    <p class="copy-top-10">' + escapeHtml(message) + '</p>',
            '</article>'
        ].join("\n");
    }

    function wait(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function releaseWheelScrollLock() {
        if (wheelLockFallbackTimer) {
            window.clearTimeout(wheelLockFallbackTimer);
            wheelLockFallbackTimer = 0;
        }

        wheelScrollLocked = false;
    }

    function endMouseDragTracking() {
        dragIsTracking = false;
        dragMoved = false;

        if (supervisorViewport) {
            supervisorViewport.classList.remove("leadership-slider-dragging");
        }
    }

    function queueSliderMove(direction) {
        if (!sliderState.isActive || wheelScrollLocked || direction === 0) {
            return false;
        }

        const nextIndex = sliderState.currentIndex + direction;
        const boundedIndex = Math.max(0, Math.min(nextIndex, sliderState.totalSteps - 1));

        if (boundedIndex === sliderState.currentIndex) {
            return false;
        }

        wheelScrollLocked = true;
        moveSupervisorSlider(boundedIndex, true);

        if (wheelLockFallbackTimer) {
            window.clearTimeout(wheelLockFallbackTimer);
        }

        // Fallback unlock in case transitionend doesn't fire.
        wheelLockFallbackTimer = window.setTimeout(releaseWheelScrollLock, sliderSmoothDurationMs + 180);
        return true;
    }

    function getDragSwipeThreshold() {
        if (!supervisorViewport) {
            return dragSwipeThresholdMin;
        }

        const adaptive = Math.round(supervisorViewport.clientWidth * dragSwipeThresholdRatio);
        return Math.max(dragSwipeThresholdMin, adaptive);
    }

    async function loadLeadershipData() {
        const query = 'coalesce(*[_id == "' + documentId + '"][0], *[_type == "leadershipPage"] | order(_updatedAt desc)[0]){ceoName, ceoBio1, ceoPhoto{asset->{url}}, supervisors[]{department, name, role, description, photo{asset->{url}}}}';
        const host = useCdn ? ".apicdn.sanity.io" : ".api.sanity.io";
        const url = "https://" + projectId + host + "/v" + apiVersion + "/data/query/" + dataset + "?query=" + encodeURIComponent(query);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("CMS fetch failed with status " + response.status);
        }

        const payload = await response.json();
        return payload ? payload.result : null;
    }

    async function loadLeadershipDataWithRetry() {
        const maxAttempts = 3;
        const baseDelayMs = 700;
        let lastError = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                return await loadLeadershipData();
            } catch (error) {
                lastError = error;

                if (attempt < maxAttempts) {
                    const backoffDelay = baseDelayMs * attempt;
                    await wait(backoffDelay);
                }
            }
        }

        throw lastError;
    }

    function applyLeadershipData(data) {
        if (!data) {
            return;
        }

        if (ceoName && data.ceoName) {
            ceoName.textContent = data.ceoName;
        }

        if (ceoBio1 && data.ceoBio1) {
            ceoBio1.textContent = data.ceoBio1;
        }

        if (ceoPortrait) {
            const ceoPhotoUrl = getSanityImageUrl(data.ceoPhoto);
            if (ceoPhotoUrl) {
                ceoPortrait.style.backgroundImage = 'url("' + ceoPhotoUrl.replace(/"/g, '%22') + '")';
                ceoPortrait.style.backgroundSize = "cover";
                ceoPortrait.style.backgroundPosition = "center";
            }
        }

        if (Array.isArray(data.supervisors) && data.supervisors.length > 0) {
            supervisorGrid.innerHTML = data.supervisors.map(buildSupervisorCard).join("\n");
            initializeSupervisorSlider();
            return;
        }

        resetSupervisorSlider();
        supervisorGrid.innerHTML = buildStatusCard(
            "No supervisors published yet",
            "Add supervisors in the CMS to automatically populate this section."
        );
    }

    if (supervisorGrid) {
        supervisorGrid.addEventListener("transitionend", function (event) {
            if (event.propertyName !== "transform") {
                return;
            }

            wheelDeltaBuffer = 0;
            releaseWheelScrollLock();
        });
    }

    if (supervisorViewport) {
        supervisorViewport.addEventListener("wheel", function (event) {
            const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

            if (!sliderState.isActive || delta === 0) {
                return;
            }

            if (wheelScrollLocked) {
                event.preventDefault();
                return;
            }

            wheelDeltaBuffer += delta;

            if (Math.abs(wheelDeltaBuffer) < wheelDeltaThreshold) {
                return;
            }

            const direction = wheelDeltaBuffer > 0 ? 1 : -1;
            wheelDeltaBuffer = 0;

            if (queueSliderMove(direction)) {
                event.preventDefault();
            }
        }, {passive: false});

        supervisorViewport.addEventListener("mousedown", function (event) {
            if (event.button !== 0 || !sliderState.isActive || wheelScrollLocked) {
                return;
            }

            dragStartX = event.clientX;
            dragStartY = event.clientY;
            dragLastX = event.clientX;
            dragIsTracking = true;
            dragMoved = false;
            supervisorViewport.classList.add("leadership-slider-dragging");
        });

        supervisorViewport.addEventListener("mousemove", function (event) {
            if (!dragIsTracking) {
                return;
            }

            dragLastX = event.clientX;

            if (dragMoved) {
                event.preventDefault();
                return;
            }

            const deltaX = event.clientX - dragStartX;
            const deltaY = event.clientY - dragStartY;

            if (Math.abs(deltaX) > dragIntentThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
                dragMoved = true;
                event.preventDefault();
            }
        });

        window.addEventListener("mouseup", function (event) {
            if (!dragIsTracking) {
                return;
            }

            const endX = event.clientX || dragLastX;
            const deltaX = endX - dragStartX;
            const deltaY = event.clientY - dragStartY;
            const wasDragging = dragMoved;

            endMouseDragTracking();

            if (!wasDragging || wheelScrollLocked || !sliderState.isActive) {
                return;
            }

            if (Math.abs(deltaX) < getDragSwipeThreshold() || Math.abs(deltaX) <= Math.abs(deltaY)) {
                return;
            }

            const direction = deltaX < 0 ? 1 : -1;
            queueSliderMove(direction);
        });

        supervisorViewport.addEventListener("mouseleave", function () {
            if (dragIsTracking && !dragMoved) {
                endMouseDragTracking();
            }
        });

        window.addEventListener("blur", endMouseDragTracking);

        supervisorViewport.addEventListener("touchstart", function (event) {
            if (!sliderState.isActive || !event.touches || event.touches.length !== 1) {
                touchIsTracking = false;
                return;
            }

            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
            touchIsTracking = true;
        }, {passive: true});

        supervisorViewport.addEventListener("touchmove", function (event) {
            if (!touchIsTracking || !event.touches || event.touches.length !== 1) {
                return;
            }

            const deltaX = event.touches[0].clientX - touchStartX;
            const deltaY = event.touches[0].clientY - touchStartY;

            if (Math.abs(deltaX) > Math.abs(deltaY) && sliderState.isActive) {
                event.preventDefault();
            }
        }, {passive: false});

        supervisorViewport.addEventListener("touchend", function (event) {
            if (!touchIsTracking || !event.changedTouches || event.changedTouches.length !== 1) {
                touchIsTracking = false;
                return;
            }

            touchIsTracking = false;

            if (wheelScrollLocked || !sliderState.isActive) {
                return;
            }

            const deltaX = event.changedTouches[0].clientX - touchStartX;
            const deltaY = event.changedTouches[0].clientY - touchStartY;

            if (Math.abs(deltaX) < touchSwipeThreshold || Math.abs(deltaX) <= Math.abs(deltaY)) {
                return;
            }

            const direction = deltaX < 0 ? 1 : -1;

            if (queueSliderMove(direction)) {
                event.preventDefault();
            }
        }, {passive: false});

        supervisorViewport.addEventListener("touchcancel", function () {
            touchIsTracking = false;
        }, {passive: true});

        supervisorViewport.addEventListener("dragstart", function (event) {
            event.preventDefault();
        });
    }

    window.addEventListener("resize", function () {
        if (sliderState.isActive) {
            measureSupervisorSliderCards();
            moveSupervisorSlider(sliderState.currentIndex, false);
        }
    });

    loadLeadershipDataWithRetry()
        .then(applyLeadershipData)
        .catch(function (error) {
            console.error("Unable to load leadership content from Sanity:", error);
            // Keep skeleton cards visible when CMS is temporarily unavailable.
        });
})();