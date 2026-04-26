(function () {
    const config = window.TFSCmsConfig || {};
    const sanity = config.sanity || {};

    const projectId = sanity.projectId;
    const dataset = sanity.dataset;
    const apiVersion = sanity.apiVersion;
    const documentId = sanity.leadershipDocumentId || "leadershipPageSingleton";
    const useCdn = sanity.useCdn !== false;

    if (!projectId || !dataset || !apiVersion) return;

    const ceoName = document.getElementById("leadership-ceo-name");
    const ceoBio = document.getElementById("leadership-ceo-bio1");
    const ceoPhoto = document.getElementById("leadership-ceo-photo");

    const sections = [
        { gridId: "hr-grid", viewportId: "hr-viewport" },
        { gridId: "marketing-grid", viewportId: "marketing-viewport" },
        { gridId: "operations-grid", viewportId: "operations-viewport" }
    ];

    const visibleCards = 3;
   const LOADING_DELAY = 1200;

    function escapeHtml(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function getImage(photo) {
        return photo?.asset?.url || "";
    }

    function normalizeDepartmentName(value) {
        const normalized = String(value || "")
            .toLowerCase()
            .replace(/&/g, " and ")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();

        const aliasMap = {
            "hr": "human resources",
            "human resource": "human resources",
            "marketing communications": "marketing and communications",
            "operations": "operations management"
        };

        return aliasMap[normalized] || normalized;
    }

    function buildCard(m) {
        return `
        <article class="team-card">
            <p class="eyebrow eyebrow-tight-sm">${escapeHtml(m.department)}</p>
            <div class="supervisor-profile">
                ${
                    m.photo?.asset?.url
                        ? `<img class="supervisor-avatar-image" src="${m.photo.asset.url}" alt="${escapeHtml(m.name)}">`
                        : `<div class="supervisor-avatar"></div>`
                }
                <div class="supervisor-meta">
                    <h3>${escapeHtml(m.name)}</h3>
                    <p class="supervisor-role">${escapeHtml(m.role)}</p>
                </div>
            </div>
            <p class="copy-top-10">${escapeHtml(m.description)}</p>
        </article>`;
    }

    function setupSlider(viewport, grid) {
        const cards = grid.querySelectorAll(".team-card");

        if (cards.length <= visibleCards) return;

        let index = 0;

        function update() {
            const offset = cards[index].offsetLeft;
            grid.style.transform = `translateX(-${offset}px)`;
        }

        viewport.addEventListener("wheel", (e) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

            e.preventDefault();

            if (e.deltaY > 0) index++;
            else index--;

            index = Math.max(0, Math.min(index, cards.length - visibleCards));
            update();
        }, { passive: false });

        let startX = 0;

        viewport.addEventListener("touchstart", e => {
            startX = e.touches[0].clientX;
        });

        viewport.addEventListener("touchend", e => {
            const diff = e.changedTouches[0].clientX - startX;

            if (Math.abs(diff) < 50) return;

            if (diff < 0) index++;
            else index--;

            index = Math.max(0, Math.min(index, cards.length - visibleCards));
            update();
        });
    }

    async function fetchData() {
        const query = `*[_type=="leadershipPage"][0]{
            ceoName,
            ceoBio1,
            ceoPhoto{asset->{url}},
            supervisors[]{
                department,
                name,
                role,
                description,
                photo{asset->{url}}
            }
        }`;

        const host = useCdn ? ".apicdn.sanity.io" : ".api.sanity.io";

        const res = await fetch(
            `https://${projectId}${host}/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`
        );

        const json = await res.json();
        return json.result;
    }

    function setGridLayout(grid, count) {
    grid.classList.remove("cols-1", "cols-2", "cols-3");

    if (count === 1) grid.classList.add("cols-1");
    else if (count === 2) grid.classList.add("cols-2");
    else grid.classList.add("cols-3");
}

function createSkeleton(count = 9) {
    return Array.from({ length: count }).map(() => `
        <article class="team-card leadership-skeleton-card">
            <div class="supervisor-avatar skeleton-avatar"></div>
            <div class="supervisor-meta">
                <div class="skeleton-line skeleton-line-md"></div>
                <div class="skeleton-line skeleton-line-sm"></div>
            </div>
        </article>
    `).join("");
}

 function render(data) {
    if (!data) return;

    if (ceoName) ceoName.textContent = data.ceoName;
    if (ceoBio) ceoBio.textContent = data.ceoBio1;

    if (ceoPhoto && data.ceoPhoto?.asset?.url) {
        ceoPhoto.style.backgroundImage = `url("${data.ceoPhoto.asset.url}")`;
    }

    sections.forEach(sec => {
        const grid = document.getElementById(sec.gridId);
        const viewport = document.getElementById(sec.viewportId);
        const expectedDepartment = normalizeDepartmentName(grid ? grid.getAttribute("data-department") : "");

        if (!grid || !viewport) return;

        const filtered = (data.supervisors || []).filter(
            m => normalizeDepartmentName(m.department) === expectedDepartment
        );

        
        if (filtered.length === 0) {
            setGridLayout(grid, 3); 
            grid.classList.add("is-loading");
            grid.innerHTML = createSkeleton(3);
            return;
        }

     
        setGridLayout(grid, filtered.length);
        grid.classList.add("is-loading");

        setTimeout(() => {
            grid.innerHTML = filtered.map(buildCard).join("");

            requestAnimationFrame(() => {
                grid.classList.remove("is-loading");
            });

            setupSlider(viewport, grid);
        }, LOADING_DELAY);
    });
}



    fetchData()
        .then(render)
        .catch(err => console.error(err));

})();