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
    const supervisorGrid = document.getElementById("leadership-supervisor-grid");

    if (!supervisorGrid) {
        return;
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
            return;
        }

        supervisorGrid.innerHTML = buildStatusCard(
            "No supervisors published yet",
            "Add supervisors in the CMS to automatically populate this section."
        );
    }

    loadLeadershipDataWithRetry()
        .then(applyLeadershipData)
        .catch(function (error) {
            console.error("Unable to load leadership content from Sanity:", error);
            // Keep skeleton cards visible when CMS is temporarily unavailable.
        });
})();