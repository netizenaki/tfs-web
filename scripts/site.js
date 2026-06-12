(function () {
    window.addEventListener('DOMContentLoaded', function () {
        var globe = document.querySelector('.globe-map');
        if (globe && globe.tagName === 'VIDEO') {
            globe.playbackRate = 0.5;
        }
    });
    const devNotice = document.getElementById("dev-notice");
    const devNoticeClose = document.getElementById("dev-notice-close");
    const devNoticeKey = "tfs-dev-notice-dismissed";
    const menuToggle = document.getElementById("menu-toggle");
    const mobileMenu = document.getElementById("mobile-menu");
    const galleryStack = document.getElementById("gallery-stack");
    const heroSearchInput = document.getElementById("hero-search-input");
    const heroSearchButton = document.getElementById("hero-search-button");
    const searchableCards = document.querySelectorAll(".page-blog .blog-card, .page-blog .podcast-card");
    const blogSearchEmpty = document.getElementById("blog-search-empty");
    const globeMarkers = document.querySelectorAll(".globe-marker");
    const destinationInfoCard = document.getElementById("destination-info-card");
    const destinationSideRail = document.getElementById("destination-side-rail");
    const destinationSideList = document.getElementById("destination-side-list");
    const destinationCardCountry = document.getElementById("destination-card-country");
    const destinationCardFlag = document.getElementById("destination-card-flag");
    const destinationCardDescription = document.getElementById("destination-card-description");
    const destinationCardBenefits = document.getElementById("destination-card-benefits");
    const destinationCardCta = document.getElementById("destination-card-cta");
    const destinationSpotCards = document.querySelectorAll(".destination-spot-card");

    function updateDestinationSpotCards(activeCountry) {
        if (destinationSpotCards.length === 0) {
            return;
        }

        destinationSpotCards.forEach(function (card) {
            const cardCountry = (card.dataset.country || "").trim();
            card.classList.toggle("is-active", cardCountry === activeCountry);
        });
    }

    function updateDestinationSideRail(activeMarker) {
        if (!destinationSideRail || !destinationSideList || globeMarkers.length === 0) {
            return;
        }

        const alternatives = Array.from(globeMarkers).filter(function (marker) {
            return marker !== activeMarker;
        }).slice(0, 3);

        destinationSideList.innerHTML = "";
        alternatives.forEach(function (marker) {
            const item = document.createElement("li");
            const link = document.createElement("a");
            const flag = marker.dataset.flag || "";
            const country = marker.dataset.country || "Destination";
            const href = marker.dataset.ctaHref || "destination-countries.html";
            link.href = href;
            link.textContent = (flag ? flag + " " : "") + country;
            item.appendChild(link);
            destinationSideList.appendChild(item);
        });

        const infoOnLeft = destinationInfoCard ? destinationInfoCard.classList.contains("align-left") : false;
        destinationSideRail.classList.toggle("align-left", !infoOnLeft);
        destinationSideRail.classList.toggle("align-right", infoOnLeft);
    }

    function closeDevNotice() {
        if (!devNotice) {
            return;
        }
        devNotice.hidden = true;
        document.body.classList.remove("notice-open");
        try {
            localStorage.setItem(devNoticeKey, "true");
        } catch (error) {
        }
    }

    function filterContent() {
    if (!heroSearchInput || searchableCards.length === 0) return;

    const query = heroSearchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    if (query === "") {
        searchableCards.forEach(card => card.classList.remove("is-hidden"));
        if (blogSearchEmpty) blogSearchEmpty.hidden = true;
        return;
    }

    searchableCards.forEach(function (card) {
        const text = card.textContent.toLowerCase();
        const matches = text.includes(query);

        card.classList.toggle("is-hidden", !matches);

        if (matches) visibleCount++;
    });

    if (blogSearchEmpty) {
        blogSearchEmpty.hidden = visibleCount !== 0;
    }
    }

    if (devNotice && devNoticeClose) {
        try {
            if (!localStorage.getItem(devNoticeKey)) {
                devNotice.hidden = false;
                document.body.classList.add("notice-open");
            }
        } catch (error) {
            devNotice.hidden = false;
            document.body.classList.add("notice-open");
        }

        devNoticeClose.addEventListener("click", closeDevNotice);
        devNotice.addEventListener("click", function (event) {
            if (event.target === devNotice) {
                closeDevNotice();
            }
        });

    }

    function openMobileMenu() {
        menuToggle.setAttribute("aria-expanded", "true");
        mobileMenu.classList.add("open");
        document.documentElement.classList.add("mob-nav-open");
        mobileMenu.setAttribute("tabindex", "-1");
        mobileMenu.focus();
    }

    function closeMobileMenu() {
        menuToggle.setAttribute("aria-expanded", "false");
        mobileMenu.classList.remove("open");
        document.documentElement.classList.remove("mob-nav-open");
        document.querySelectorAll(".mob-trigger").forEach(function (btn) {
            btn.setAttribute("aria-expanded", "false");
            var sub = btn.nextElementSibling;
            if (sub) { sub.classList.remove("is-open"); }
        });
    }

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener("click", function () {
            if (mobileMenu.classList.contains("open")) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        var mobCloseBtn = document.getElementById("mob-close");
        if (mobCloseBtn) {
            mobCloseBtn.addEventListener("click", closeMobileMenu);
        }

        mobileMenu.addEventListener("click", function (e) {
            if (e.target === mobileMenu) { closeMobileMenu(); }
        });

        document.querySelectorAll(".mob-trigger").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var isOpen = btn.getAttribute("aria-expanded") === "true";
                btn.setAttribute("aria-expanded", String(!isOpen));
                var sub = btn.nextElementSibling;
                if (sub) { sub.classList.toggle("is-open"); }
            });
        });

        mobileMenu.querySelectorAll(".mob-link:not(.mob-trigger), .mob-sub-link, .mob-cta").forEach(function (el) {
            el.addEventListener("click", closeMobileMenu);
        });
    }

    if (galleryStack) {
        const galleryImageFiles = (galleryStack.dataset.images || "").split(",").map(function (src) {
            return src.trim();
        }).filter(Boolean);

        function showGalleryEmptyState() {
            galleryStack.innerHTML = "<p class=\"gallery-empty\">No gallery images found. Add image files to the gallery folder.</p>";
        }

        if (galleryImageFiles.length === 0) {
            showGalleryEmptyState();
        } else {
            galleryImageFiles.forEach(function (src, index) {
                const image = document.createElement("img");
                image.src = src;
                image.alt = "Activity gallery image " + (index + 1);
                image.className = "gallery-photo";
                image.loading = "lazy";
                image.decoding = "async";
                image.addEventListener("error", function () {
                    image.remove();
                    if (galleryStack.children.length === 0) {
                        showGalleryEmptyState();
                    }
                });
                galleryStack.appendChild(image);
            });
        }
    }

    if (document.body.classList.contains("page-blog") && heroSearchInput) {
        heroSearchInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                filterContent();
            }
        });

        if (heroSearchButton) {
            heroSearchButton.addEventListener("click", filterContent);
        }
    }

    function positionDestinationCard(marker) {
        if (!destinationInfoCard || !marker) {
            return;
        }

        const visual = destinationInfoCard.closest(".destination-visual");
        const globe = visual ? visual.querySelector(".soft-globe") : null;
        if (!visual) {
            return;
        }

        if (window.matchMedia("(max-width: 768px)").matches) {
            destinationInfoCard.style.top = "";
            destinationInfoCard.style.bottom = "";
            destinationInfoCard.style.left = "";
            destinationInfoCard.style.right = "";
            destinationInfoCard.style.transform = "";
            destinationInfoCard.classList.add("align-right");
            destinationInfoCard.classList.remove("align-left");
            return;
        }

        const markerRect = marker.getBoundingClientRect();
        const visualRect = visual.getBoundingClientRect();
        const globeRect = globe ? globe.getBoundingClientRect() : visualRect;
        const markerCenterX = markerRect.left + markerRect.width / 2;
        const cardWidth = Math.min(destinationInfoCard.offsetWidth, visualRect.width - 24);
        const sidePadding = 12;
        const gap = 24;
        const globeLeft = globeRect.left - visualRect.left;
        const globeRight = globeRect.right - visualRect.left;
        const preferredRightLeft = globeRight + gap;
        const preferredLeftLeft = globeLeft - cardWidth - gap;
        const fitsOnRight = preferredRightLeft + cardWidth <= visualRect.width - sidePadding;
        const fitsOnLeft = preferredLeftLeft >= sidePadding;
        const shouldAlignLeft = markerCenterX < globeRect.left + globeRect.width / 2;
        let cardLeft;
        let isLeftSide;

        if (shouldAlignLeft && fitsOnLeft) {
            cardLeft = preferredLeftLeft;
            isLeftSide = true;
        } else if (!shouldAlignLeft && fitsOnRight) {
            cardLeft = preferredRightLeft;
            isLeftSide = false;
        } else if (fitsOnRight) {
            cardLeft = preferredRightLeft;
            isLeftSide = false;
        } else if (fitsOnLeft) {
            cardLeft = preferredLeftLeft;
            isLeftSide = true;
        } else {
            cardLeft = Math.max(sidePadding, Math.min(visualRect.width - cardWidth - sidePadding, preferredRightLeft));
            isLeftSide = cardLeft + cardWidth / 2 < globeLeft + (globeRight - globeLeft) / 2;
        }

        destinationInfoCard.style.top = "50%";
        destinationInfoCard.style.bottom = "auto";
        destinationInfoCard.style.left = cardLeft + "px";
        destinationInfoCard.style.right = "auto";
        destinationInfoCard.style.transform = "translateY(-50%)";
        destinationInfoCard.classList.toggle("align-left", isLeftSide);
        destinationInfoCard.classList.toggle("align-right", !isLeftSide);

        updateDestinationSideRail(marker);
    }

    function updateDestinationCard(marker) {
        if (!marker) {
            return;
        }

        const country = marker.dataset.country || "";
        const flag = marker.dataset.flag || "";
        const description = marker.dataset.description || "";
        const benefits = (marker.dataset.benefits || "").split("|").map(function (item) {
            return item.trim();
        }).filter(Boolean);
        const ctaLabel = marker.dataset.ctaLabel || "Explore Destination";
        const ctaHref = marker.dataset.ctaHref || "destination-countries.html";

        globeMarkers.forEach(function (item) {
            item.classList.toggle("is-active", item === marker);
        });

        updateDestinationSpotCards(country);

        if (destinationCardCountry) {
            destinationCardCountry.textContent = country;
        }
        if (destinationCardFlag) {
            destinationCardFlag.textContent = flag;
        }
        if (destinationCardDescription) {
            destinationCardDescription.textContent = description;
        }
        if (destinationCardBenefits) {
            destinationCardBenefits.innerHTML = "";
            benefits.forEach(function (benefit) {
                const listItem = document.createElement("li");
                listItem.textContent = benefit;
                destinationCardBenefits.appendChild(listItem);
            });
        }
        if (destinationCardCta) {
            destinationCardCta.textContent = ctaLabel;
            destinationCardCta.setAttribute("href", ctaHref);
        }

        if (destinationInfoCard) {
            positionDestinationCard(marker);
        }
        updateDestinationSideRail(marker);
    }

    if (globeMarkers.length > 0) {
        globeMarkers.forEach(function (marker) {
            marker.addEventListener("mouseenter", function () {
                updateDestinationCard(marker);
            });

            marker.addEventListener("focus", function () {
                updateDestinationCard(marker);
            });
        });

        const initialMarker = document.querySelector(".globe-marker.is-active") || globeMarkers[0];
        updateDestinationCard(initialMarker);

        window.addEventListener("resize", function () {
            const activeMarker = document.querySelector(".globe-marker.is-active") || globeMarkers[0];
            updateDestinationCard(activeMarker);
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        if (mobileMenu && mobileMenu.classList.contains("open")) {
            closeMobileMenu();
            return;
        }

        if (devNotice && !devNotice.hidden) {
            closeDevNotice();
        }
    });

    const revealItems = document.querySelectorAll(".reveal, .stagger");
    if (revealItems.length === 0) {
        return;
    }

    if (!("IntersectionObserver" in window)) {
        revealItems.forEach(function (item) {
            item.classList.add("show");
        });
        return;
    }

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    revealItems.forEach(function (item) {
        observer.observe(item);
    });

  const grid = document.querySelector('.blog-detail-hero-grid');

if (grid) {
    let cards = Array.from(grid.children);

    const allImages = cards.map(card => {
        const img = card.querySelector('img');
        return img ? img.src : null;
    }).filter(Boolean);

    const total = cards.length;

    if (total > 4) {
        const extraCount = total - 4;

        cards.slice(4).forEach(card => card.remove());

        const lastCard = grid.children[3];

        const overlay = document.createElement('div');
        overlay.className = 'more-overlay';
        overlay.textContent = `+${extraCount}`;

        lastCard.appendChild(overlay);
    }

    const visibleCount = Math.min(total, 4);
    grid.classList.add(`items-${visibleCount}`);

   
    const lightbox = document.getElementById('fb-lightbox');
    const lightboxImg = lightbox.querySelector('.fb-lightbox-image');
    const closeBtn = lightbox.querySelector('.fb-close');
    const prevBtn = lightbox.querySelector('.fb-prev');
    const nextBtn = lightbox.querySelector('.fb-next');

    let currentIndex = 0;

    function openLightbox(index) {
        currentIndex = index;
        lightboxImg.src = allImages[currentIndex];
        lightbox.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.hidden = true;
        document.body.style.overflow = '';
    }

    function showNext() {
        currentIndex = (currentIndex + 1) % allImages.length;
        lightboxImg.src = allImages[currentIndex];
    }

    function showPrev() {
        currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
        lightboxImg.src = allImages[currentIndex];
    }

    grid.querySelectorAll('.blog-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            openLightbox(index);
        });
    });

    closeBtn.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', showNext);
    prevBtn.addEventListener('click', showPrev);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (lightbox.hidden) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });
}

    /* ── All carousels: infinite loop, all viewports ───── */
    function initListingCarousels() {
        document.querySelectorAll('.page-home .pathway-grid, .page-pathways .pathway-grid, .page-destinations .region-showcase').forEach(function (grid) {
            if (grid.dataset.carouselInit) { return; }
            grid.dataset.carouselInit = 'listing';

            var originals = Array.from(grid.children);
            var n = originals.length;
            if (n === 0) { return; }

            /* Clone all cards at each end for seamless infinite loop */
            originals.forEach(function (card) {
                var clone = card.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                grid.appendChild(clone);
            });
            for (var i = n - 1; i >= 0; i--) {
                var clone = originals[i].cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                grid.insertBefore(clone, grid.firstChild);
            }

            var GAP = 16;

            function step() {
                var c = grid.firstElementChild;
                return c ? c.offsetWidth + GAP : 0;
            }

            function applyStates() {
                var cc = grid.scrollLeft + grid.clientWidth / 2;
                Array.from(grid.children).forEach(function (card) {
                    var dist = Math.abs((card.offsetLeft + card.offsetWidth / 2) - cc);
                    var t = Math.min(dist / (card.offsetWidth + GAP), 1);
                    card.style.transform = 'scale(' + (1 - 0.10 * t).toFixed(4) + ')';
                    card.style.opacity   = (1 - 0.42 * t).toFixed(4);
                    card.style.filter    = t > 0.02 ? 'blur(' + (4 * t).toFixed(2) + 'px)' : 'none';
                    card.classList.toggle('carousel-active', t < 0.1);
                });
            }

            /* Instant jump without triggering snap animation */
            function silentJump(to) {
                grid.style.scrollSnapType = 'none';
                grid.scrollLeft = to;
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        grid.style.scrollSnapType = '';
                    });
                });
            }

            /* After scroll settles: if in clone zone, jump to real equivalent */
            function checkLoop() {
                var s = step();
                if (s === 0) { return; }
                var realStart = n * s;
                var cur = grid.scrollLeft;
                if (cur >= realStart + n * s - s / 2) {
                    silentJump(cur - n * s);
                } else if (cur < realStart - s / 2) {
                    silentJump(cur + n * s);
                }
            }

            /* Mouse-wheel: one scroll per gesture, ignore until card settles */
            var isHovered = false;
            var wheelLocked = false;
            grid.addEventListener('mouseenter', function () { isHovered = true; });
            grid.addEventListener('mouseleave', function () { isHovered = false; });
            grid.addEventListener('wheel', function (e) {
                if (!isHovered) { return; }
                if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { return; }
                e.preventDefault();
                if (wheelLocked) { return; }
                wheelLocked = true;

                /* Find the card whose center is closest to the viewport center */
                var cc = grid.scrollLeft + grid.clientWidth / 2;
                var children = Array.from(grid.children);
                var idx = 0, minDist = Infinity;
                children.forEach(function (card, i) {
                    var d = Math.abs((card.offsetLeft + card.offsetWidth / 2) - cc);
                    if (d < minDist) { minDist = d; idx = i; }
                });

                var dir = e.deltaY > 0 ? 1 : -1;
                var target = children[idx + dir];
                if (!target) { wheelLocked = false; return; }

                /* Scroll to exact card center — no snap conflict */
                var to = target.offsetLeft + target.offsetWidth / 2 - grid.clientWidth / 2;
                grid.style.scrollSnapType = 'none';
                grid.scrollTo({ left: to, behavior: 'smooth' });
            }, { passive: false });

            var rafPending = false;
            var stopTimer;

            grid.addEventListener('scroll', function () {
                Array.from(grid.children).forEach(function (c) { c.style.transition = 'none'; });
                if (!rafPending) {
                    rafPending = true;
                    requestAnimationFrame(function () { rafPending = false; applyStates(); });
                }
                clearTimeout(stopTimer);
                stopTimer = setTimeout(function () {
                    Array.from(grid.children).forEach(function (c) { c.style.transition = ''; });
                    grid.style.scrollSnapType = '';
                    applyStates();
                    checkLoop();
                    wheelLocked = false;
                }, 80);
            }, { passive: true });

            /* Position at first real card (index n, after n prepended clones)
               and paint initial focused state. Use IO so layout is fully
               computed before we read offsetLeft — fixes below-fold carousels. */
            var started = false;
            function start() {
                if (started) { return; }
                started = true;
                var cardW = grid.firstElementChild ? grid.firstElementChild.offsetWidth : 0;
                var contW = grid.clientWidth;
                if (cardW > 0 && contW > 0) {
                    var sp = Math.max(16, (contW - cardW) / 2);
                    grid.style.paddingLeft = sp + 'px';
                    grid.style.paddingRight = sp + 'px';
                }
                var s = step();
                if (s > 0) { grid.scrollLeft = n * s; }
                applyStates();
            }

            /* Fire immediately if card widths are already computed */
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    if (step() > 0) { start(); }
                });
            });

            /* Fallback: wait until the section enters the viewport */
            if ('IntersectionObserver' in window) {
                var io = new IntersectionObserver(function (entries) {
                    if (entries[0].isIntersecting) { start(); io.disconnect(); }
                }, { threshold: 0.05 });
                io.observe(grid);
            }
        });
    }

    /* ── Articles carousel: finite, starts on last (newest) card ── */
    function initArticlesCarousel() {
        document.querySelectorAll('.page-home .articles-grid').forEach(function (grid) {
            if (grid.dataset.carouselInit) { return; }
            grid.dataset.carouselInit = 'articles';

            var GAP = 16;

            function applyStates() {
                var cc = grid.scrollLeft + grid.clientWidth / 2;
                Array.from(grid.children).forEach(function (card) {
                    var dist = Math.abs((card.offsetLeft + card.offsetWidth / 2) - cc);
                    var t = Math.min(dist / (card.offsetWidth + GAP), 1);
                    card.style.transform = 'scale(' + (1 - 0.10 * t).toFixed(4) + ')';
                    card.style.opacity   = (1 - 0.42 * t).toFixed(4);
                    card.style.filter    = t > 0.02 ? 'blur(' + (4 * t).toFixed(2) + 'px)' : 'none';
                    card.classList.toggle('carousel-active', t < 0.1);
                });
            }

            var rafPending = false;
            var stopTimer;
            var wheelLocked = false;
            var isHovered = false;

            grid.addEventListener('scroll', function () {
                Array.from(grid.children).forEach(function (c) { c.style.transition = 'none'; });
                if (!rafPending) {
                    rafPending = true;
                    requestAnimationFrame(function () { rafPending = false; applyStates(); });
                }
                clearTimeout(stopTimer);
                stopTimer = setTimeout(function () {
                    Array.from(grid.children).forEach(function (c) { c.style.transition = ''; });
                    grid.style.scrollSnapType = '';
                    applyStates();
                    wheelLocked = false;
                }, 80);
            }, { passive: true });

            grid.addEventListener('mouseenter', function () { isHovered = true; });
            grid.addEventListener('mouseleave', function () { isHovered = false; });
            grid.addEventListener('wheel', function (e) {
                if (!isHovered) { return; }
                if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { return; }
                e.preventDefault();
                if (wheelLocked) { return; }
                wheelLocked = true;
                var cc = grid.scrollLeft + grid.clientWidth / 2;
                var children = Array.from(grid.children);
                var idx = 0, minDist = Infinity;
                children.forEach(function (card, i) {
                    var d = Math.abs((card.offsetLeft + card.offsetWidth / 2) - cc);
                    if (d < minDist) { minDist = d; idx = i; }
                });
                var dir = e.deltaY > 0 ? 1 : -1;
                var target = children[idx + dir];
                if (!target) { wheelLocked = false; return; }
                var to = target.offsetLeft + target.offsetWidth / 2 - grid.clientWidth / 2;
                grid.style.scrollSnapType = 'none';
                grid.scrollTo({ left: to, behavior: 'smooth' });
            }, { passive: false });

            var started = false;
            function start() {
                if (started) { return; }
                started = true;
                var cardW = grid.firstElementChild ? grid.firstElementChild.offsetWidth : 0;
                var contW = grid.clientWidth;
                if (cardW > 0 && contW > 0) {
                    var sp = Math.max(16, (contW - cardW) / 2);
                    grid.style.paddingLeft = sp + 'px';
                    grid.style.paddingRight = sp + 'px';
                }
                /* Scroll to first card (latest article) */
                var first = grid.firstElementChild;
                if (first) {
                    grid.scrollLeft = first.offsetLeft + first.offsetWidth / 2 - grid.clientWidth / 2;
                }
                applyStates();
            }

            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    if (grid.firstElementChild && grid.firstElementChild.offsetWidth > 0) { start(); }
                });
            });

            if ('IntersectionObserver' in window) {
                var io = new IntersectionObserver(function (entries) {
                    if (entries[0].isIntersecting) { start(); io.disconnect(); }
                }, { threshold: 0.05 });
                io.observe(grid);
            }
        });
    }

    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            initListingCarousels();
            initArticlesCarousel();
        });
    });
}());
