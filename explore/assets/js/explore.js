const CONTENT_API_BASE = (window.TFSCmsConfig && window.TFSCmsConfig.contentApiBase) || "https://tfs-admin-xi.vercel.app/api/content";
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
    select.innerHTML = '<option value="">All</option>';
    values.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = labelFn ? labelFn(v) : v;
        select.appendChild(opt);
    });
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

    let universities;

    filterForm?.addEventListener("submit", (e) => { e.preventDefault(); renderGrid(); });
    filterForm?.addEventListener("reset", () => { window.setTimeout(renderGrid, 0); });
    shortlistIcon?.addEventListener("click", () => { renderShortlistModal(); shortlistModal?.classList.remove("hidden"); });
    shortlistClose?.addEventListener("click", () => shortlistModal?.classList.add("hidden"));
    shortlistModal?.addEventListener("click", (e) => { if (e.target === shortlistModal) shortlistModal.classList.add("hidden"); });
    detailsClose?.addEventListener("click", () => detailsModal?.classList.add("hidden"));
    detailsModal?.addEventListener("click", (e) => { if (e.target === detailsModal) detailsModal.classList.add("hidden"); });

    grid.innerHTML = '<div class="empty-state">Loading universities…</div>';

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

    populateSelect("filter-country", universities.map((u) => u.country), toLabel);
    populateSelect("filter-type", universities.map((u) => u.type), toLabel);

    function getFilters() {
        return {
            country: document.getElementById("filter-country")?.value || "",
            type: document.getElementById("filter-type")?.value || "",
            level: document.getElementById("filter-level")?.value || ""
        };
    }

    function getFiltered() {
        const f = getFilters();
        return universities.filter((u) => {
            if (f.country && u.country !== f.country) return false;
            if (f.type && u.type !== f.type) return false;
            if (f.level && !(u.levels || []).includes(f.level)) return false;
            return true;
        });
    }

    function refreshCount() { updateShortlistCount(shortlistCount); }

    function toggleShortlist(id) {
        if (isShortlisted(id)) { removeFromShortlist(id); } else { addToShortlist(id); showToast("Added to shortlist"); }
        refreshCount();
        renderGrid();
    }

    function rankBadge(label, value) {
        if (!value) return "";
        return `<span class="item-tag">${label} #${value}</span>`;
    }

    function openDetails(university) {
        if (!detailsModal || !detailsTitle || !detailsBody) return;
        const logoHtml = university.logo
            ? `<img class="item-logo" src="${university.logo}" alt="${university.name} logo" style="margin-bottom:12px">`
            : "";
        const location = [university.city, university.country].filter(Boolean).join(", ");
        const rankHtml = [rankBadge("QS", university.qsRank), rankBadge("THE", university.theRank)].filter(Boolean).join(" ");
        const levelTagsHtml = (university.levels || []).map((l) => `<span class="item-tag">${l}</span>`).join(" ");
        const websiteHtml = university.website
            ? `<p style="margin-top:12px"><a href="${university.website}" target="_blank" rel="noopener noreferrer" class="item-website-link">Visit official website &rarr;</a></p>`
            : "";
        detailsTitle.textContent = university.name;
        detailsBody.innerHTML = `${logoHtml}<div class="item-location" style="margin-bottom:8px">${location}</div>${university.type ? `<div class="item-location" style="margin-bottom:8px">${university.type}</div>` : ""}<div class="item-tags" style="margin-bottom:8px">${rankHtml}</div>${levelTagsHtml ? `<div class="item-tags" style="margin-bottom:12px">${levelTagsHtml}</div>` : ""}${university.knownFor ? `<p class="item-desc" style="overflow:visible;-webkit-line-clamp:unset"><strong>Known for:</strong> ${university.knownFor}</p>` : ""}${websiteHtml}`;
        detailsModal.classList.remove("hidden");
    }

    function renderUniversityCard(u) {
        const location = [u.city, u.country].filter(Boolean).join(", ");
        const rankHtml = [rankBadge("QS", u.qsRank), rankBadge("THE", u.theRank)].filter(Boolean).join(" ");
        const levelTags = (u.levels || []).map((l) => `<span class="item-tag">${l}</span>`).join("");
        return renderItemCard(
            { ...u, location, tags: [], desc: (levelTags ? `<div class="item-tags" style="margin-bottom:4px">${levelTags}</div>` : "") + (u.knownFor || "") },
            { detailsLabel: "View details", onDetailsClick: () => openDetails(u), shortlistEnabled: true, onShortlistToggle: toggleShortlist }
        );
    }

    function renderGrid() {
        if (!universities) return;
        const filtered = getFiltered();
        if (!filtered.length) {
            grid.innerHTML = '<div class="empty-state">No universities match your filters.</div>';
            return;
        }
        clearAndRender(grid, filtered.map(renderUniversityCard));
    }

    function renderShortlistModal() {
        if (!shortlistList || !universities) return;
        const ids = getShortlist();
        if (!ids.length) {
            shortlistList.innerHTML = '<div class="empty-state">Your shortlist is empty.</div>';
            return;
        }
        const saved = ids.map((id) => universities.find((u) => u.id === id)).filter(Boolean);
        clearAndRender(shortlistList, saved.map((u) => renderItemCard(
            { ...u, location: [u.city, u.country].filter(Boolean).join(", "), tags: [], desc: u.knownFor || "" },
            {
                detailsLabel: "View details",
                onDetailsClick: () => openDetails(u),
                shortlistEnabled: true,
                onShortlistToggle: (id) => { removeFromShortlist(id); refreshCount(); renderShortlistModal(); renderGrid(); },
            }
        )));
    }

    refreshCount();
    renderGrid();
}

async function initScholarshipsPage() {
    const grid = document.getElementById("scholarship-grid");
    if (!grid) return;

    const form = document.getElementById("scholarship-filter-form");
    const detailsModal = document.getElementById("scholarship-details-modal");
    const detailsTitle = document.getElementById("scholarship-details-title");
    const detailsBody = document.getElementById("scholarship-details-body");
    const detailsClose = document.getElementById("close-scholarship-details");

    let scholarships;

    form?.addEventListener("submit", (e) => { e.preventDefault(); renderScholarships(); });
    form?.addEventListener("reset", () => { window.setTimeout(renderScholarships, 0); });
    detailsClose?.addEventListener("click", () => detailsModal?.classList.add("hidden"));
    detailsModal?.addEventListener("click", (e) => { if (e.target === detailsModal) detailsModal.classList.add("hidden"); });

    grid.innerHTML = '<div class="empty-state">Loading scholarships…</div>';

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

    populateSelect("filter-country", scholarships.map((s) => s.host_country));

    function getFilters() {
        return {
            country: document.getElementById("filter-country")?.value || "",
            level: document.getElementById("filter-level")?.value || "",
            program_type: document.getElementById("filter-program-type")?.value || "",
            status: document.getElementById("filter-status")?.value || ""
        };
    }

    function getFiltered() {
        const f = getFilters();
        return scholarships.filter((s) => {
            if (f.country && s.host_country !== f.country) return false;
            if (f.level && !(s.level || []).includes(f.level)) return false;
            if (f.program_type && s.program_type !== f.program_type) return false;
            if (f.status && s.status !== f.status) return false;
            return true;
        });
    }

    function tag(text, style) {
        return `<span class="item-tag"${style ? ' style="' + style + '"' : ""}>${text}</span>`;
    }

    function statusColor(status) {
        if (status === "Open") return "background:#d1fae5;color:#065f46";
        if (status === "Closed") return "background:#fee2e2;color:#991b1b";
        return "background:#fef9c3;color:#854d0e";
    }

    function openDetails(s) {
        if (!detailsModal || !detailsTitle || !detailsBody) return;
        detailsTitle.textContent = s.name;

        const levelTags = (s.level || []).map((l) => tag(l)).join(" ");
        const fieldTags = (s.study_fields || []).map((f) => tag(f)).join(" ");

        const appDates = [
            s.application_open ? "Open: " + s.application_open : "",
            s.application_deadline ? "Deadline: " + s.application_deadline : ""
        ].filter(Boolean).join(" · ");

        const reqHtml = (s.requirements || []).length
            ? `<div class="sch-detail-section"><p class="sch-detail-label">Requirements</p>${s.requirements.map((r) => `<p class="sch-detail-row">• ${r}</p>`).join("")}</div>`
            : "";

        const additionalHtml = (s.additional_info || []).length
            ? `<div class="sch-detail-section"><p class="sch-detail-label">Additional Info</p>${s.additional_info.map((n) => `<p class="sch-detail-row">• ${n}</p>`).join("")}</div>`
            : "";

        const websiteHtml = s.official_url
            ? `<a href="${s.official_url}" target="_blank" rel="noopener noreferrer" class="item-website-link" style="display:inline-block;margin-top:14px">Visit official page &rarr;</a>`
            : "";

        const appFeeHtml = s.application_fee && s.application_fee.toLowerCase() !== "none"
            ? `<p class="sch-detail-row" style="color:#b45309;font-size:0.82rem;margin-top:6px">⚠ Application fee: ${s.application_fee}</p>`
            : "";

        detailsBody.innerHTML = [
            `<div class="item-location" style="margin-bottom:6px">${s.provider_type || ""}${s.host_country ? " · " + s.host_country : ""}</div>`,
            `<div style="margin-bottom:8px">${tag(s.status || "Unknown", statusColor(s.status))}${s.program_type ? " " + tag(s.program_type) : ""}</div>`,
            appFeeHtml,
            levelTags ? `<div class="item-tags" style="margin-top:8px;margin-bottom:10px">${levelTags}</div>` : "",
            fieldTags ? `<div class="item-tags" style="margin-bottom:10px">${fieldTags}</div>` : "",
            s.scholarship ? `<div class="sch-detail-section"><p class="sch-detail-label">Scholarship</p><p class="sch-detail-row">${s.scholarship}</p></div>` : "",
            s.benefit ? `<div class="sch-detail-section"><p class="sch-detail-label">Benefit</p><p class="sch-detail-row">${s.benefit}</p></div>` : "",
            s.duration ? `<div class="sch-detail-section"><p class="sch-detail-label">Duration</p><p class="sch-detail-row">${s.duration}</p></div>` : "",
            appDates ? `<div class="sch-detail-section"><p class="sch-detail-label">Application</p><p class="sch-detail-row">${appDates}</p></div>` : "",
            s.application_process ? `<div class="sch-detail-section"><p class="sch-detail-label">Application Process</p><p class="sch-detail-row">${s.application_process}</p></div>` : "",
            reqHtml,
            additionalHtml,
            websiteHtml
        ].join("");

        detailsModal.classList.remove("hidden");
    }

    function renderScholarshipCard(s) {
        const card = document.createElement("article");
        card.className = "item-card";
        const levelTags = (s.level || []).map((l) => `<span class="item-tag">${l}</span>`).join("");
        const statusStyle = statusColor(s.status);
        card.innerHTML = `
            <div class="item-card-top">
                <div class="item-logo-placeholder"><i class="fa-solid fa-award" aria-hidden="true"></i></div>
                <div>
                    <div class="item-name">${s.name}</div>
                    <div class="item-location">${s.provider_type || ""}${s.host_country ? " · " + s.host_country : ""}</div>
                </div>
            </div>
            <div class="item-tags" style="margin-bottom:4px">
                ${s.status ? `<span class="item-tag" style="${statusStyle}">${s.status}</span>` : ""}
                ${s.program_type ? `<span class="item-tag">${s.program_type}</span>` : ""}
            </div>
            <div class="item-tags">${levelTags}</div>
            <div class="item-desc">${s.scholarship || ""}</div>
            <div class="item-actions">
                <button class="btn-details" type="button">View details</button>
            </div>
        `;
        card.querySelector(".btn-details").addEventListener("click", () => openDetails(s));
        return card;
    }

    function renderScholarships() {
        if (!scholarships) return;
        const filtered = getFiltered();
        if (!filtered.length) {
            grid.innerHTML = '<div class="empty-state">No scholarships match your filters.</div>';
            return;
        }
        clearAndRender(grid, filtered.map(renderScholarshipCard));
    }

    renderScholarships();
}

if (document.getElementById("university-grid")) initUniversitiesPage();
if (document.getElementById("scholarship-grid")) initScholarshipsPage();
