(function () {
    const config = window.TFSBridgeConfig || {};
    const adminBaseUrl = (config.adminBaseUrl || "").replace(/\/$/, "");
    const endpoints = config.endpoints || {};
    const leadershipEndpoint = endpoints.leadership || "";

    if (!adminBaseUrl || !leadershipEndpoint) {
        return;
    }

    const ceoName = document.getElementById("leadership-ceo-name");
    const ceoRole = document.getElementById("leadership-ceo-role");
    const ceoBio1 = document.getElementById("leadership-ceo-bio1");
    const ceoBio2 = document.getElementById("leadership-ceo-bio2");
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

    function buildSupervisorCard(supervisor) {
        const department = escapeHtml(supervisor.department || "Department");
        const name = escapeHtml(supervisor.name || "Unnamed Supervisor");
        const role = escapeHtml(supervisor.role || "Supervisor");
        const description = escapeHtml(supervisor.description || "");

        return [
            '<article class="team-card">',
            '    <p class="eyebrow eyebrow-tight-sm">' + department + "</p>",
            '    <div class="supervisor-profile">',
            '        <div class="supervisor-avatar" aria-hidden="true"></div>',
            '        <div class="supervisor-meta">',
            '            <h3>' + name + "</h3>",
            '            <p class="supervisor-role">' + role + "</p>",
            "        </div>",
            "    </div>",
            '    <p class="copy-top-10">' + description + "</p>",
            "</article>"
        ].join("\n");
    }

    async function loadLeadershipData() {
        const response = await fetch(adminBaseUrl + leadershipEndpoint, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Bridge fetch failed with status " + response.status);
        }

        return response.json();
    }

    function applyLeadershipData(data) {
        if (!data) {
            return;
        }

        if (ceoName && data.ceoName) {
            ceoName.textContent = data.ceoName;
        }

        if (ceoRole && data.ceoRole) {
            ceoRole.textContent = data.ceoRole;
        }

        if (ceoBio1 && data.ceoBio1) {
            ceoBio1.textContent = data.ceoBio1;
        }

        if (ceoBio2 && data.ceoBio2) {
            ceoBio2.textContent = data.ceoBio2;
        }

        if (Array.isArray(data.supervisors) && data.supervisors.length > 0) {
            supervisorGrid.innerHTML = data.supervisors.map(buildSupervisorCard).join("\n");
        }
    }

    loadLeadershipData()
        .then(applyLeadershipData)
        .catch(function (error) {
            console.error("Unable to load leadership content from admin bridge:", error);
        });
})();