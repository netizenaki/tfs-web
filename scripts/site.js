(function () {
    const devNotice = document.getElementById("dev-notice");
    const devNoticeClose = document.getElementById("dev-notice-close");
    const devNoticeKey = "tfs-dev-notice-dismissed";
    const menuToggle = document.getElementById("menu-toggle");
    const mobileMenu = document.getElementById("mobile-menu");
    const galleryStack = document.getElementById("gallery-stack");
    const heroSearchInput = document.getElementById("hero-search-input");
    const heroSearchButton = document.getElementById("hero-search-button");
    const searchModal = document.getElementById("search-modal");
    const searchModalInput = document.getElementById("search-modal-input");
    const searchModalClose = document.getElementById("search-modal-close");
    const searchClearFilters = document.getElementById("search-clear-filters");
    const searchShowResults = document.getElementById("search-show-results");
    const searchModalCheckboxes = searchModal ? searchModal.querySelectorAll('input[type="checkbox"]') : [];
    const searchableCards = document.querySelectorAll(".page-blog .blog-card, .page-blog .podcast-card");
    const blogSearchEmpty = document.getElementById("blog-search-empty");
    const globeMarkers = document.querySelectorAll(".globe-marker");
    const destinationInfoCard = document.getElementById("destination-info-card");
    const destinationCardCountry = document.getElementById("destination-card-country");
    const destinationCardFlag = document.getElementById("destination-card-flag");
    const destinationCardDescription = document.getElementById("destination-card-description");
    const destinationCardBenefits = document.getElementById("destination-card-benefits");
    const destinationCardCta = document.getElementById("destination-card-cta");

    function closeDevNotice() {
        if (!devNotice) {
            return;
        }
        devNotice.hidden = true;
        document.body.classList.remove("notice-open");
        try {
            localStorage.setItem(devNoticeKey, "true");
        } catch (error) {
            // Ignore storage failures and just close the modal for this session.
        }
    }

    function openSearchModal() {
        if (!searchModal) {
            return;
        }

        searchModal.hidden = false;
        document.body.classList.add("search-open");

        if (searchModalInput && heroSearchInput) {
            searchModalInput.value = heroSearchInput.value;
            window.setTimeout(function () {
                searchModalInput.focus();
                searchModalInput.select();
            }, 0);
        }
    }

    function closeSearchModal() {
        if (!searchModal) {
            return;
        }

        searchModal.hidden = true;
        document.body.classList.remove("search-open");
    }

    function syncHeroSearchValue() {
        if (!heroSearchInput || !searchModalInput) {
            return;
        }

        heroSearchInput.value = searchModalInput.value.trim();
    }

    function filterContent() {
    if (!heroSearchInput || searchableCards.length === 0) return;

    const query = heroSearchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    // Reset if empty
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

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener("click", function () {
            const expanded = menuToggle.getAttribute("aria-expanded") === "true";
            menuToggle.setAttribute("aria-expanded", String(!expanded));
            mobileMenu.classList.toggle("open");
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

        if (heroSearchButton) {
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

    

        
    } else if (searchModal && heroSearchInput) {
        heroSearchInput.addEventListener("focus", function () {
            heroSearchInput.blur();
            openSearchModal();
        });

        heroSearchInput.addEventListener("click", openSearchModal);

        if (heroSearchButton) {
            heroSearchButton.addEventListener("click", openSearchModal);
        }

        if (searchModalClose) {
            searchModalClose.addEventListener("click", closeSearchModal);
        }

        searchModal.addEventListener("click", function (event) {
            if (event.target === searchModal) {
                closeSearchModal();
            }
        });

        if (searchClearFilters) {
            searchClearFilters.addEventListener("click", function () {
                if (searchModalInput) {
                    searchModalInput.value = "";
                    searchModalInput.focus();
                }

                searchModalCheckboxes.forEach(function (checkbox) {
                    checkbox.checked = false;
                });

                heroSearchInput.value = "";
            });
        }

        if (searchShowResults) {
            searchShowResults.addEventListener("click", function () {
                syncHeroSearchValue();
                closeSearchModal();
            });
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
    }

    function updateDestinationCard(marker) {
        if (!marker || !destinationInfoCard) {
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

        positionDestinationCard(marker);
    }

    if (globeMarkers.length > 0 && destinationInfoCard) {
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
            positionDestinationCard(activeMarker);
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        if (searchModal && !searchModal.hidden) {
            closeSearchModal();
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

    // Click any visible card
    grid.querySelectorAll('.blog-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            openLightbox(index);
        });
    });

    // Controls
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
}());
