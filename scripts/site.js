(function () {
    const devNotice = document.getElementById("dev-notice");
    const devNoticeClose = document.getElementById("dev-notice-close");
    const devNoticeKey = "tfs-dev-notice-dismissed";
    const menuToggle = document.getElementById("menu-toggle");
    const mobileMenu = document.getElementById("mobile-menu");
    const galleryStack = document.getElementById("gallery-stack");

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

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && !devNotice.hidden) {
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
}());
