const CONTENT_API_BASE = "https://tfs-admin-xi.vercel.app/api/content";
const shortlistStorageKey = "tfs-shortlist";

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
    setShortlist(getShortlist().filter((i) => i !== id));
}

function updateShortlistCount(el) {
    if (el) el.textContent = String(getShortlist().length);
}

function showToast(message) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        Object.assign(toast.style, {
            position: "fixed", bottom: "2rem", right: "2rem",
            background: "#132545", color: "#fff",
            padding: "0.85em 1.4em", borderRadius: "12px",
            boxShadow: "0 4px 24px rgba(8,30,66,0.18)",
            fontSize: "0.88rem", fontFamily: "inherit",
            zIndex: "2000", pointerEvents: "none"
        });
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = "1";
    window.setTimeout(() => { toast.style.opacity = "0"; }, 1800);
}

function populateSelect(id, rawValues, labelFn) {
    const select = document.getElementById(id);
    if (!select) return;
    const values = [...new Set(rawValues.filter(Boolean))].sort();
    const current = select.value;
    select.innerHTML = '<option value="">All</option>';
    values.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = labelFn ? labelFn(v) : v;
        select.appendChild(opt);
    });
    if (current) select.value = current;
}

function toLabel(value) {
    return String(value || "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderItemCard(item, options = {}) {
    const {
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

    const logoHtml = item.logo
        ? `<img class="item-logo" src="${item.logo}" alt="${item.name} logo" onerror="this.style.display='none'">`
        : `<div class="item-logo-placeholder"><i class="fa-solid fa-building-columns" aria-hidden="true"></i></div>`;

    const isSaved = shortlistEnabled && isShortlisted(item.id);
    const starSrc = isSaved ? "/explore/assets/solid-star.webp" : "/explore/assets/empty-star.webp";

    card.innerHTML = `
        <div class="item-card-top">
            ${logoHtml}
            <div>
                <div class="item-name">${item.name}</div>
                <div class="item-location">${item.location || ""}</div>
            </div>
        </div>
        <div class="item-tags">${tagsHtml}</div>
        <div class="item-desc">${item.desc || item.description || ""}</div>
        <div class="item-actions">
            <button class="btn-details" type="button">${detailsLabel}</button>
            ${shortlistEnabled ? `<button class="btn-shortlist${isSaved ? " filled" : ""}" type="button" aria-label="${isSaved ? "Remove from" : "Add to"} shortlist"><img class="shortlist-star-icon" src="${starSrc}" alt=""></button>` : ""}
        </div>
    `;

    card.querySelector(".btn-details")?.addEventListener("click", () => {
        if (typeof onDetailsClick === "function") onDetailsClick(item);
    });

    if (shortlistEnabled) {
        card.querySelector(".btn-shortlist")?.addEventListener("click", () => {
            if (typeof onShortlistToggle === "function") onShortlistToggle(item.id);
        });
    }

    return card;
}

function clearAndRender(container, elements) {
    if (!container) return;
    container.innerHTML = "";
    elements.forEach((el) => container.appendChild(el));
}

async function initUniversitiesPage() {
    const grid = document.getElementById("university-grid");
    if (!grid) return;

    grid.innerHTML = '<div class="empty-state">Loading universities…</div>';

    let universities;
    try {
        const response = await fetch(CONTENT_API_BASE + "/universities", {
            headers: { Accept: "application/json" },
            cache: "no-store"
        });
        if (!response.ok) throw new Error();
        const payload = await response.json();
        universities = Array.isArray(payload.universities) ? payload.universities : [];
    } catch {
        grid.innerHTML = '<div class="empty-state">Unable to load universities right now. Please try again later.</div>';
        return;
    }

    populateSelect("filter-country", universities.map((u) => u.region), toLabel);
    populateSelect("filter-language", universities.map((u) => u.language), toLabel);
    populateSelect("filter-type", universities.map((u) => u.type), toLabel);
    populateSelect("filter-program", universities.flatMap((u) => u.program || []), toLabel);

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
    const filterForm = document.getElementById("filter-form");

    const maxTuition = Math.max(...universities.map((u) => u.tuition || 0), 10000);
    if (tuitionInput) {
        tuitionInput.max = maxTuition;
        tuitionInput.value = maxTuition;
    }
    if (tuitionValue) tuitionValue.textContent = `0 – ${maxTuition.toLocaleString()}`;

    function getFilters() {
        return {
            country: document.getElementById("filter-country")?.value || "",
            tuition: Number(tuitionInput?.value || 0),
            language: document.getElementById("filter-language")?.value || "",
            program: document.getElementById("filter-program")?.value || "",
            type: document.getElementById("filter-type")?.value || "",
        };
    }

    function getFiltered() {
        const f = getFilters();
        return universities.filter((u) => {
            if (f.country && u.region !== f.country) return false;
            if (f.language && u.language !== f.language) return false;
            if (f.type && u.type !== f.type) return false;
            if (f.program && !(u.program || []).includes(f.program)) return false;
            if (f.tuition < maxTuition && u.tuition > f.tuition) return false;
            return true;
        });
    }

    function refreshCount() { updateShortlistCount(shortlistCount); }

    function toggleShortlist(id) {
        if (isShortlisted(id)) { removeFromShortlist(id); } else { addToShortlist(id); showToast("Added to shortlist"); }
        refreshCount();
        renderGrid();
    }

    function openDetails(university) {
        if (!detailsModal || !detailsTitle || !detailsBody) return;
        const tagsHtml = (university.tags || []).map((t) => `<span class="item-tag">${t}</span>`).join("");
        const logoHtml = university.logo
            ? `<img class="item-logo" src="${university.logo}" alt="${university.name} logo" style="margin-bottom:12px">`
            : "";
        detailsTitle.textContent = university.name;
        detailsBody.innerHTML = `${logoHtml}<div class="item-location" style="margin-bottom:10px">${university.location || ""}</div><div class="item-tags" style="margin-bottom:12px">${tagsHtml}</div><p class="item-desc" style="overflow:visible;-webkit-line-clamp:unset">${university.desc || ""}</p>`;
        detailsModal.classList.remove("hidden");
    }

    function renderGrid() {
        const filtered = getFiltered();
        if (!filtered.length) {
            grid.innerHTML = '<div class="empty-state">No universities match your filters.</div>';
            return;
        }
        clearAndRender(grid, filtered.map((u) => renderItemCard(u, {
            detailsLabel: "View details",
            onDetailsClick: openDetails,
            shortlistEnabled: true,
            onShortlistToggle: toggleShortlist,
        })));
    }

    function renderShortlistModal() {
        if (!shortlistList) return;
        const ids = getShortlist();
        if (!ids.length) {
            shortlistList.innerHTML = '<div class="empty-state">Your shortlist is empty.</div>';
            return;
        }
        const saved = ids.map((id) => universities.find((u) => u.id === id)).filter(Boolean);
        clearAndRender(shortlistList, saved.map((u) => renderItemCard(u, {
            detailsLabel: "View details",
            onDetailsClick: openDetails,
            shortlistEnabled: true,
            onShortlistToggle: (id) => {
                removeFromShortlist(id);
                refreshCount();
                renderShortlistModal();
                renderGrid();
            },
        })));
    }

    filterForm?.addEventListener("submit", (e) => { e.preventDefault(); renderGrid(); });
    filterForm?.addEventListener("reset", () => {
        window.setTimeout(() => {
            if (tuitionInput) tuitionInput.value = maxTuition;
            if (tuitionValue) tuitionValue.textContent = `0 – ${maxTuition.toLocaleString()}`;
            renderGrid();
        }, 0);
    });

    tuitionInput?.addEventListener("input", () => {
        if (tuitionValue) tuitionValue.textContent = `0 – ${Number(tuitionInput.value).toLocaleString()}`;
    });

    shortlistIcon?.addEventListener("click", () => { renderShortlistModal(); shortlistModal?.classList.remove("hidden"); });
    shortlistClose?.addEventListener("click", () => shortlistModal?.classList.add("hidden"));
    shortlistModal?.addEventListener("click", (e) => { if (e.target === shortlistModal) shortlistModal.classList.add("hidden"); });

    detailsClose?.addEventListener("click", () => detailsModal?.classList.add("hidden"));
    detailsModal?.addEventListener("click", (e) => { if (e.target === detailsModal) detailsModal.classList.add("hidden"); });

    refreshCount();
    renderGrid();
}

async function initScholarshipsPage() {
    const grid = document.getElementById("scholarship-grid");
    if (!grid) return;

    grid.innerHTML = '<div class="empty-state">Loading scholarships…</div>';

    let scholarships;
    try {
        const response = await fetch(CONTENT_API_BASE + "/scholarships", {
            headers: { Accept: "application/json" },
            cache: "no-store"
        });
        if (!response.ok) throw new Error();
        const payload = await response.json();
        scholarships = Array.isArray(payload.scholarships) ? payload.scholarships : [];
    } catch {
        grid.innerHTML = '<div class="empty-state">Unable to load scholarships right now. Please try again later.</div>';
        return;
    }

    populateSelect("filter-country", scholarships.map((s) => s.country), toLabel);
    populateSelect("filter-level", scholarships.map((s) => s.level), toLabel);

    const amountInput = document.getElementById("filter-amount");
    const amountValue = document.getElementById("amount-value");
    const form = document.getElementById("scholarship-filter-form");

    const maxAmount = Math.max(...scholarships.map((s) => s.amount || 0), 25000);
    if (amountInput) { amountInput.max = maxAmount; amountInput.value = maxAmount; }
    if (amountValue) amountValue.textContent = `0 – ${maxAmount.toLocaleString()}`;

    function getFilters() {
        return {
            country: document.getElementById("filter-country")?.value || "",
            level: document.getElementById("filter-level")?.value || "",
            amount: Number(amountInput?.value || 0),
        };
    }

    function getFiltered() {
        const f = getFilters();
        return scholarships.filter((s) => {
            if (f.country && s.country !== f.country) return false;
            if (f.level && s.level !== f.level) return false;
            if (f.amount < maxAmount && s.amount > f.amount) return false;
            return true;
        });
    }

    function renderScholarships() {
        const filtered = getFiltered();
        if (!filtered.length) {
            grid.innerHTML = '<div class="empty-state">No scholarships match your filters.</div>';
            return;
        }
        clearAndRender(grid, filtered.map((s) => renderItemCard(
            { ...s, id: `scholarship:${s.id}` },
            { detailsLabel: "View details", shortlistEnabled: false }
        )));
    }

    form?.addEventListener("submit", (e) => { e.preventDefault(); renderScholarships(); });
    form?.addEventListener("reset", () => {
        window.setTimeout(() => {
            if (amountInput) amountInput.value = maxAmount;
            if (amountValue) amountValue.textContent = `0 – ${maxAmount.toLocaleString()}`;
            renderScholarships();
        }, 0);
    });

    amountInput?.addEventListener("input", () => {
        if (amountValue) amountValue.textContent = `0 – ${Number(amountInput.value).toLocaleString()}`;
    });

    renderScholarships();
}

initUniversitiesPage();
initScholarshipsPage();
