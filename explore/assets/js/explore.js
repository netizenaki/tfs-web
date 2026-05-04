const shortlistStorageKey = "tfs-shortlist";

const universities = [
    {
        id: "tum",
        name: "Technical University of Munich",
        logo: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Logo_TUM.svg",
        location: "Munich, Germany",
        tags: ["Public", "English", "Scholarship available"],
        desc: "One of Europe's top universities, offering programs in engineering, natural sciences, life sciences, medicine, and social sciences.",
        tuition: 0,
        language: "english",
        program: ["cs", "engineering", "business"],
        type: "public",
        region: "germany",
    },
    {
        id: "lmum",
        name: "Ludwig Maximilian University of Munich",
        logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/LMU_Muenchen_Logo.svg",
        location: "Munich, Germany",
        tags: ["Public", "English"],
        desc: "Renowned for research and teaching, LMU offers a wide range of programs and is one of Germany's oldest universities.",
        tuition: 0,
        language: "english",
        program: ["cs", "business", "design"],
        type: "public",
        region: "germany",
    },
    {
        id: "htw",
        name: "HTW Berlin",
        logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/HTW_Berlin_Logo.svg",
        location: "Berlin, Germany",
        tags: ["Applied Sciences", "English"],
        desc: "Berlin's largest university of applied sciences, offering practice-oriented programs in engineering, business, and design.",
        tuition: 500,
        language: "english",
        program: ["cs", "business", "design"],
        type: "applied",
        region: "germany",
    },
];

const scholarships = [
    {
        id: "daad-epos",
        name: "DAAD EPOS",
        logo: "/assets/logo.png",
        location: "Germany",
        tags: ["Postgraduate", "Full Funding"],
        desc: "Supports development-related postgraduate study with tuition and monthly stipend coverage.",
        amount: 18000,
        country: "germany",
        level: "postgraduate",
    },
    {
        id: "chevening",
        name: "Chevening Scholarship",
        logo: "/assets/logo.png",
        location: "United Kingdom",
        tags: ["Postgraduate", "Full Funding"],
        desc: "UK government scholarship for future global leaders pursuing one-year master's degrees.",
        amount: 22000,
        country: "uk",
        level: "postgraduate",
    },
    {
        id: "erasmus-mundus",
        name: "Erasmus Mundus Joint Masters",
        logo: "/assets/logo.png",
        location: "Europe",
        tags: ["Masters", "Mobility"],
        desc: "Covers participation costs and travel for selected joint masters programs across Europe.",
        amount: 16000,
        country: "europe",
        level: "masters",
    },
];

function getShortlist() {
    try {
        return JSON.parse(localStorage.getItem(shortlistStorageKey) || "[]");
    } catch {
        return [];
    }
}

function setShortlist(list) {
    localStorage.setItem(shortlistStorageKey, JSON.stringify(list));
}

function isShortlisted(id) {
    return getShortlist().includes(id);
}

function addToShortlist(id) {
    const list = getShortlist();
    if (!list.includes(id)) {
        list.push(id);
        setShortlist(list);
    }
}

function removeFromShortlist(id) {
    const list = getShortlist().filter((itemId) => itemId !== id);
    setShortlist(list);
}

function updateShortlistCount(countElement) {
    if (!countElement) {
        return;
    }
    countElement.textContent = String(getShortlist().length);
}

function showToast(message) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.style.position = "fixed";
        toast.style.bottom = "2rem";
        toast.style.right = "2rem";
        toast.style.background = "#222";
        toast.style.color = "#fff";
        toast.style.padding = "1em 1.5em";
        toast.style.borderRadius = "12px";
        toast.style.boxShadow = "0 2px 16px 0 rgba(0,0,0,0.13)";
        toast.style.zIndex = "2000";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = "1";
    window.setTimeout(() => {
        toast.style.opacity = "0";
    }, 1400);
}

function renderItemCard(item, options = {}) {
    const {
        detailsHref = "#",
        detailsLabel = "View details",
        onDetailsClick,
        shortlistEnabled = false,
        onShortlistToggle,
    } = options;

    const card = document.createElement("article");
    card.className = "item-card";

    const tagsHtml = (item.tags || [])
        .map((tag) => `<span class="item-tag">${tag}</span>`)
        .join("");

    const isSaved = shortlistEnabled && isShortlisted(item.id);
    const shortlistIconSrc = isSaved ? "/explore/assets/solid-star.webp" : "/explore/assets/empty-star.webp";

    card.innerHTML = `
        <img class="item-logo" src="${item.logo}" alt="${item.name} logo">
        <div class="item-name">${item.name}</div>
        <div class="item-location">${item.location}</div>
        <div class="item-tags">${tagsHtml}</div>
        <div class="item-desc">${item.desc || item.description || ""}</div>
        <div class="item-actions">
            <a class="btn-primary" href="${detailsHref}">${detailsLabel}</a>
            ${shortlistEnabled ? `<button class="btn-shortlist${isSaved ? " filled" : ""}" title="Shortlist"><img class="shortlist-star-icon" src="${shortlistIconSrc}" alt="Shortlist"></button>` : ""}
        </div>
    `;

    if (shortlistEnabled) {
        const shortlistButton = card.querySelector(".btn-shortlist");
        shortlistButton?.addEventListener("click", (event) => {
            event.preventDefault();
            if (typeof onShortlistToggle === "function") {
                onShortlistToggle(item.id);
            }
        });
    }

    if (typeof onDetailsClick === "function") {
        const detailsButton = card.querySelector(".btn-primary");
        detailsButton?.addEventListener("click", (event) => {
            event.preventDefault();
            onDetailsClick(item);
        });
    }

    return card;
}

function clearAndRender(container, elements) {
    if (!container) {
        return;
    }
    container.innerHTML = "";
    for (const element of elements) {
        container.appendChild(element);
    }
}

function initUniversitiesPage() {
    const grid = document.getElementById("university-grid");
    if (!grid) {
        return;
    }

    const filterForm = document.getElementById("filter-form");
    const tuitionInput = document.getElementById("filter-tuition");
    const tuitionValue = document.getElementById("tuition-value");
    const shortlistCount = document.getElementById("shortlist-count");
    const shortlistIcon = document.getElementById("shortlist-icon");
    const shortlistModal = document.getElementById("shortlist-modal");
    const shortlistList = document.getElementById("shortlist-list");
    const shortlistClose = document.getElementById("close-shortlist");
    const detailsModal = document.getElementById("university-details-modal");
    const detailsTitle = document.getElementById("university-details-title");
    const detailsBody = document.getElementById("university-details-body");
    const detailsClose = document.getElementById("close-university-details");

    function getFilters() {
        return {
            country: document.getElementById("filter-country")?.value || "",
            tuition: Number(document.getElementById("filter-tuition")?.value || 0),
            language: document.getElementById("filter-language")?.value || "",
            program: document.getElementById("filter-program")?.value || "",
            type: document.getElementById("filter-type")?.value || "",
        };
    }

    function getFilteredUniversities() {
        const filters = getFilters();
        return universities.filter((university) => {
            if (filters.country && university.region !== filters.country) return false;
            if (filters.language && university.language !== filters.language) return false;
            if (filters.type && university.type !== filters.type) return false;
            if (filters.program && !university.program.includes(filters.program)) return false;
            if (filters.tuition && university.tuition > filters.tuition) return false;
            return true;
        });
    }

    function refreshShortlistCount() {
        updateShortlistCount(shortlistCount);
    }

    function toggleShortlist(universityId) {
        if (isShortlisted(universityId)) {
            removeFromShortlist(universityId);
        } else {
            addToShortlist(universityId);
            showToast("Added to shortlist");
        }

        refreshShortlistCount();
        renderUniversityGrid();
    }

    function openUniversityDetails(university) {
        if (!detailsModal || !detailsTitle || !detailsBody) {
            return;
        }

        const tagsHtml = (university.tags || [])
            .map((tag) => `<span class="item-tag">${tag}</span>`)
            .join("");

        detailsTitle.textContent = university.name;
        detailsBody.innerHTML = `
            <img class="item-logo" src="${university.logo}" alt="${university.name} logo">
            <div class="item-location">${university.location}</div>
            <div class="item-tags">${tagsHtml}</div>
            <p class="item-desc">${university.desc || ""}</p>
        `;

        detailsModal.classList.remove("hidden");
    }

    function renderUniversityGrid() {
        const filteredUniversities = getFilteredUniversities();

        if (filteredUniversities.length === 0) {
            grid.innerHTML = '<div class="empty-state">No universities found for your filters.</div>';
            return;
        }

        const cards = filteredUniversities.map((university) =>
            renderItemCard(university, {
                detailsHref: "#",
                detailsLabel: "View details",
                onDetailsClick: openUniversityDetails,
                shortlistEnabled: true,
                onShortlistToggle: toggleShortlist,
            })
        );

        clearAndRender(grid, cards);
    }

    function renderShortlistModal() {
        if (!shortlistList) {
            return;
        }

        const shortlistedIds = getShortlist();
        if (shortlistedIds.length === 0) {
            shortlistList.innerHTML = '<div class="empty-state">Your shortlist is empty.</div>';
            return;
        }

        const cards = shortlistedIds
            .map((id) => universities.find((university) => university.id === id))
            .filter(Boolean)
            .map((university) =>
                renderItemCard(university, {
                    detailsHref: "#",
                    detailsLabel: "View details",
                    onDetailsClick: openUniversityDetails,
                    shortlistEnabled: true,
                    onShortlistToggle: (idToRemove) => {
                        removeFromShortlist(idToRemove);
                        refreshShortlistCount();
                        renderShortlistModal();
                        renderUniversityGrid();
                    },
                })
            );

        clearAndRender(shortlistList, cards);
    }

    if (filterForm) {
        filterForm.addEventListener("submit", (event) => {
            event.preventDefault();
            renderUniversityGrid();
        });
    }

    if (tuitionInput && tuitionValue) {
        tuitionValue.textContent = `0 - ${tuitionInput.value}`;
        tuitionInput.addEventListener("input", (event) => {
            tuitionValue.textContent = `0 - ${event.target.value}`;
        });
    }

    shortlistIcon?.addEventListener("click", () => {
        renderShortlistModal();
        shortlistModal?.classList.remove("hidden");
    });

    shortlistClose?.addEventListener("click", () => {
        shortlistModal?.classList.add("hidden");
    });

    detailsClose?.addEventListener("click", () => {
        detailsModal?.classList.add("hidden");
    });

    refreshShortlistCount();
    renderUniversityGrid();
}

function initScholarshipsPage() {
    const grid = document.getElementById("scholarship-grid");
    if (!grid) {
        return;
    }

    const form = document.getElementById("scholarship-filter-form");
    const countryInput = document.getElementById("filter-country");
    const levelInput = document.getElementById("filter-level");
    const amountInput = document.getElementById("filter-amount");
    const amountValue = document.getElementById("amount-value");

    function initializeFilters() {
        if (countryInput) {
            countryInput.value = "";
        }
        if (levelInput) {
            levelInput.value = "";
        }
        if (amountInput) {
            amountInput.value = amountInput.max || "25000";
        }
        if (amountInput && amountValue) {
            amountValue.textContent = `0 - ${amountInput.value}`;
        }
    }

    function getFilters() {
        return {
            country: countryInput?.value || "",
            level: levelInput?.value || "",
            amount: Number(amountInput?.value || 0),
        };
    }

    function getFilteredScholarships() {
        const filters = getFilters();

        return scholarships.filter((scholarship) => {
            if (filters.country && scholarship.country !== filters.country) return false;
            if (filters.level && scholarship.level !== filters.level) return false;
            if (filters.amount && scholarship.amount > filters.amount) return false;
            return true;
        });
    }

    function renderScholarships() {
        const filtered = getFilteredScholarships();
        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state">No scholarships found for your filters.</div>';
            return;
        }

        const cards = filtered.map((scholarship) =>
            renderItemCard(
                {
                    ...scholarship,
                    id: `scholarship:${scholarship.id}`,
                },
                {
                    detailsHref: "#",
                    detailsLabel: "View details",
                    shortlistEnabled: false,
                }
            )
        );

        clearAndRender(grid, cards);
    }

    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        renderScholarships();
    });

    if (amountInput && amountValue) {
        amountInput.addEventListener("input", (event) => {
            amountValue.textContent = `0 - ${event.target.value}`;
        });
    }

    initializeFilters();
    renderScholarships();
}

initUniversitiesPage();
initScholarshipsPage();
