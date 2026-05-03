(function () {
    const config = window.TFSCmsConfig || {};
    const sanity = config.sanity || {};
    const contentApiBase = String(config.contentApiBase || "").trim().replace(/\/$/, "");

    const projectId = String(sanity.projectId || "").trim();
    const dataset = String(sanity.dataset || "production").trim();
    const apiVersion = String(sanity.apiVersion || "2026-04-24").trim();
    const useCdn = sanity.useCdn !== false;
    const leadershipDocumentType = String(sanity.leadershipDocumentType || "leadershipPage").trim();
    const blogDocumentType = String(sanity.blogDocumentType || "blogPost").trim();
    const leadershipLoadingDelay = 1200;

    if (!projectId || !dataset || !apiVersion) {
        renderMissingConfigState();
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

    function formatDate(value) {
        if (!value) {
            return "Unscheduled";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "Unscheduled";
        }

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function getSanityHost() {
        return useCdn ? ".apicdn.sanity.io" : ".api.sanity.io";
    }

    function getPublishedBlogFilter() {
        return '(!defined(status) || status == "published")';
    }

    function getContentApiBase() {
        if (contentApiBase) {
            return contentApiBase;
        }

        return "";
    }

    async function runQuery(query) {
        const url = "https://" + projectId + getSanityHost() + "/v" + apiVersion + "/data/query/" + dataset + "?query=" + encodeURIComponent(query);
        const response = await fetch(url, {
            cache: "no-store",
            headers: {
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error("Unable to load CMS content: " + errorText);
        }

        const payload = await response.json();
        return payload ? payload.result : null;
    }

    async function runContentRequest(pathname) {
        const baseUrl = getContentApiBase();

        if (!baseUrl) {
            throw new Error("Blog content API base URL is not configured.");
        }

        const response = await fetch(baseUrl + pathname, {
            cache: "no-store",
            headers: {
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error("Unable to load CMS content: " + errorText);
        }

        return response.json();
    }

    function normalizeDepartmentName(value) {
        const normalized = String(value || "")
            .toLowerCase()
            .replace(/&/g, " and ")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();

        const aliasMap = {
            hr: "human resources",
            "human resource": "human resources",
            "marketing communications": "marketing and communications",
            operations: "operations management"
        };

        return aliasMap[normalized] || normalized;
    }

    function renderMissingConfigState() {
        const blogLoading = document.getElementById("blog-loading");
        const blogEmpty = document.getElementById("blog-empty");
        const blogPostLoading = document.getElementById("blog-post-loading");
        const blogPostEmpty = document.getElementById("blog-post-empty");

        if (blogLoading) {
            blogLoading.hidden = true;
        }

        if (blogEmpty) {
            blogEmpty.hidden = false;
            blogEmpty.textContent = "Blog CMS is not configured yet.";
        }

        if (blogPostLoading) {
            blogPostLoading.hidden = true;
        }

        if (blogPostEmpty) {
            blogPostEmpty.hidden = false;
            blogPostEmpty.textContent = "Blog CMS is not configured yet.";
        }
    }

    function createLeadershipSkeleton(count) {
        return Array.from({ length: count }).map(function () {
            return [
                '<article class="team-card leadership-skeleton-card">',
                '<div class="supervisor-avatar skeleton-avatar"></div>',
                '<div class="supervisor-meta">',
                '<div class="skeleton-line skeleton-line-md"></div>',
                '<div class="skeleton-line skeleton-line-sm"></div>',
                '</div>',
                '</article>'
            ].join("");
        }).join("");
    }

    function setLeadershipGridLayout(grid, count) {
        grid.classList.remove("cols-1", "cols-2", "cols-3");

        if (count === 1) {
            grid.classList.add("cols-1");
        } else if (count === 2) {
            grid.classList.add("cols-2");
        } else {
            grid.classList.add("cols-3");
        }
    }

    function buildLeadershipCard(member) {
        return [
            '<article class="team-card">',
            '<p class="eyebrow eyebrow-tight-sm">' + escapeHtml(member.department) + '</p>',
            '<div class="supervisor-profile">',
            member.photo && member.photo.asset && member.photo.asset.url
                ? '<img class="supervisor-avatar-image" src="' + escapeHtml(member.photo.asset.url) + '" alt="' + escapeHtml(member.name) + '">' 
                : '<div class="supervisor-avatar"></div>',
            '<div class="supervisor-meta">',
            '<h3>' + escapeHtml(member.name) + '</h3>',
            '<p class="supervisor-role">' + escapeHtml(member.role) + '</p>',
            '</div>',
            '</div>',
            '<p class="copy-top-10">' + escapeHtml(member.description) + '</p>',
            '</article>'
        ].join("");
    }

    async function renderLeadershipPage() {
        const ceoName = document.getElementById("leadership-ceo-name");
        const ceoBio = document.getElementById("leadership-ceo-bio1");
        const ceoPhoto = document.getElementById("leadership-ceo-photo");
        const grids = Array.from(document.querySelectorAll("[data-department]"));

        if (!ceoName && !ceoBio && !ceoPhoto && !grids.length) {
            return;
        }

        const query = '*[_type == "' + leadershipDocumentType + '"][0]{ceoName, ceoBio1, ceoPhoto{asset->{url}}, supervisors[]{department, name, role, description, photo{asset->{url}}}}';

        try {
            const data = await runQuery(query);

            if (!data) {
                return;
            }

            if (ceoName) {
                ceoName.textContent = String(data.ceoName || "");
            }

            if (ceoBio) {
                ceoBio.textContent = String(data.ceoBio1 || "");
            }

            if (ceoPhoto && data.ceoPhoto && data.ceoPhoto.asset && data.ceoPhoto.asset.url) {
                ceoPhoto.style.backgroundImage = 'url("' + data.ceoPhoto.asset.url + '")';
            }

            grids.forEach(function (grid) {
                const expectedDepartment = normalizeDepartmentName(grid.getAttribute("data-department"));
                const supervisors = Array.isArray(data.supervisors) ? data.supervisors : [];
                const filtered = supervisors.filter(function (member) {
                    return normalizeDepartmentName(member.department) === expectedDepartment;
                });

                if (!filtered.length) {
                    setLeadershipGridLayout(grid, 3);
                    grid.classList.add("is-loading");
                    grid.innerHTML = createLeadershipSkeleton(3);
                    return;
                }

                setLeadershipGridLayout(grid, filtered.length);
                grid.classList.add("is-loading");
                window.setTimeout(function () {
                    grid.innerHTML = filtered.map(buildLeadershipCard).join("");
                    window.requestAnimationFrame(function () {
                        grid.classList.remove("is-loading");
                    });
                }, leadershipLoadingDelay);
            });
        } catch (error) {
            console.error(error);
        }
    }

    function normalizeBlogPost(item) {
        const safe = item || {};
        const bodyRaw = String(safe.bodyRaw || "");
        const excerpt = String(safe.excerpt || "").trim() || bodyRaw.replace(/\s+/g, " ").trim().slice(0, 160);

        return {
            id: String(safe._id || ""),
            title: String(safe.title || "Untitled post"),
            slug: String(safe.slug || ""),
            excerpt: excerpt,
            publishedAt: String(safe.publishedAt || safe._updatedAt || ""),
            updatedAt: String(safe._updatedAt || ""),
            category: String(safe.category || "General"),
            authorName: String(safe.authorName || "TFS Team"),
            coverImageUrl: String(safe.coverImageUrl || "assets/blog_placeholder.png"),
            body: Array.isArray(safe.body) ? safe.body : [],
            bodyRaw: bodyRaw
        };
    }

    function buildBlogCard(post) {
        const excerpt = post.excerpt || "More details coming soon.";

        return [
            '<article class="blog-card" data-search="' + escapeHtml((post.title + ' ' + excerpt + ' ' + post.category).toLowerCase()) + '">',
            '<a class="blog-card-link" href="blog-post.html?slug=' + encodeURIComponent(post.slug) + '">',
            '<div class="blog-card-art">',
            '<p class="blog-tag">' + escapeHtml(post.category) + '</p>',
            '<img class="blog-art-image" src="' + escapeHtml(post.coverImageUrl) + '" alt="' + escapeHtml(post.title) + ' cover image" loading="lazy" decoding="async">',
            '</div>',
            '<div class="blog-card-copy">',
            '<p class="blog-card-date">' + escapeHtml(formatDate(post.publishedAt)) + '</p>',
            '<h3>' + escapeHtml(post.title) + '</h3>',
            '<p class="blog-card-excerpt">' + escapeHtml(excerpt) + '</p>',
            '<span class="read-link"><span>Read post</span><span aria-hidden="true">→</span></span>',
            '</div>',
            '</a>',
            '</article>'
        ].join("");
    }

    function renderPortableText(blocks, bodyRaw) {
        if (Array.isArray(blocks) && blocks.length) {
            return blocks.map(function (block) {
                if (!block || typeof block !== "object") {
                    return "";
                }

                if (block._type === "block") {
                    const style = String(block.style || "normal").toLowerCase();
                    const children = Array.isArray(block.children) ? block.children : [];
                    const text = children.map(function (child) {
                        return escapeHtml(child && child.text ? child.text : "");
                    }).join("");

                    if (!text.trim()) {
                        return "";
                    }

                    if (style === "h2") {
                        return '<h2>' + text + '</h2>';
                    }

                    if (style === "h3") {
                        return '<h3>' + text + '</h3>';
                    }

                    if (style === "blockquote") {
                        return '<blockquote>' + text + '</blockquote>';
                    }

                    return '<p>' + text + '</p>';
                }

                if (block._type === "image" && block.asset && block.asset.url) {
                    return '<figure><img src="' + escapeHtml(String(block.asset.url || "")) + '" alt="Blog image" loading="lazy" decoding="async"></figure>';
                }

                return "";
            }).join("");
        }

        if (String(bodyRaw || "").trim()) {
            return String(bodyRaw || "").split(/\n\s*\n/).map(function (paragraph) {
                return '<p>' + escapeHtml(paragraph.trim()).replace(/\n/g, '<br>') + '</p>';
            }).join("");
        }

        return '<p>Content will be published soon.</p>';
    }

    function filterBlogPosts() {
        const blogGrid = document.getElementById("blog-post-grid");
        const blogSearchInput = document.getElementById("blog-search-input");
        const blogSearchEmpty = document.getElementById("blog-search-empty");

        if (!blogGrid || !blogSearchInput) {
            return;
        }

        const query = String(blogSearchInput.value || "").trim().toLowerCase();
        const cards = Array.from(blogGrid.querySelectorAll(".blog-card"));
        let visibleCount = 0;

        cards.forEach(function (card) {
            const haystack = String(card.getAttribute("data-search") || "");
            const matches = !query || haystack.indexOf(query) > -1;
            card.classList.toggle("is-hidden", !matches);

            if (matches) {
                visibleCount += 1;
            }
        });

        if (blogSearchEmpty) {
            blogSearchEmpty.hidden = visibleCount !== 0;
        }
    }

    function bindBlogSearch() {
        const blogSearchInput = document.getElementById("blog-search-input");
        const blogSearchButton = document.getElementById("blog-search-button");

        if (!blogSearchInput) {
            return;
        }

        blogSearchInput.addEventListener("input", filterBlogPosts);
        blogSearchInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                filterBlogPosts();
            }
        });

        if (blogSearchButton) {
            blogSearchButton.addEventListener("click", filterBlogPosts);
        }
    }

    async function renderBlogIndexPage() {
        const blogGrid = document.getElementById("blog-post-grid");
        const blogLoading = document.getElementById("blog-loading");
        const blogEmpty = document.getElementById("blog-empty");

        if (!blogGrid) {
            return;
        }

        try {
            const apiPayload = await runContentRequest("/blog-posts");
            const result = apiPayload && Array.isArray(apiPayload.posts)
                ? apiPayload.posts
                : [];
            const posts = (Array.isArray(result) ? result : []).map(normalizeBlogPost).filter(function (post) {
                return post.slug;
            });

            if (blogLoading) {
                blogLoading.hidden = true;
            }

            if (!posts.length) {
                if (blogEmpty) {
                    blogEmpty.hidden = false;
                }
                return;
            }

            blogGrid.innerHTML = posts.map(buildBlogCard).join("");
            blogGrid.hidden = false;
            bindBlogSearch();
        } catch (error) {
            console.error(error);
            if (blogLoading) {
                blogLoading.hidden = true;
            }
            if (blogEmpty) {
                blogEmpty.hidden = false;
                blogEmpty.textContent = "Unable to load blog posts right now.";
            }
        }
    }

    async function renderRelatedPosts(currentSlug) {
        const relatedPostGrid = document.getElementById("related-post-grid");

        if (!relatedPostGrid) {
            return;
        }

        try {
            const apiPayload = await runContentRequest("/blog-posts");
            const result = apiPayload && Array.isArray(apiPayload.posts)
                ? apiPayload.posts
                : [];
            const posts = (Array.isArray(result) ? result : []).map(normalizeBlogPost).filter(function (post) {
                return post.slug && post.slug !== currentSlug;
            }).slice(0, 3).filter(function (post) {
                return post.slug;
            });

            if (!posts.length) {
                relatedPostGrid.innerHTML = '<p class="blog-search-empty">No related posts yet.</p>';
                return;
            }

            relatedPostGrid.innerHTML = posts.map(buildBlogCard).join("");
        } catch (error) {
            console.error(error);
            relatedPostGrid.innerHTML = '<p class="blog-search-empty">Unable to load related posts.</p>';
        }
    }

    async function renderBlogPostPage() {
        const blogPostArticle = document.getElementById("blog-post-article");
        const blogPostLoading = document.getElementById("blog-post-loading");
        const blogPostEmpty = document.getElementById("blog-post-empty");

        if (!blogPostArticle && !blogPostLoading && !blogPostEmpty) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const slug = String(params.get("slug") || "").trim();

        if (!slug) {
            if (blogPostLoading) {
                blogPostLoading.hidden = true;
            }
            if (blogPostEmpty) {
                blogPostEmpty.hidden = false;
            }
            return;
        }

        try {
            const apiPayload = await runContentRequest("/blog-post/" + encodeURIComponent(slug));
            const postRaw = apiPayload || null;
            const post = postRaw ? normalizeBlogPost(postRaw) : null;

            if (blogPostLoading) {
                blogPostLoading.hidden = true;
            }

            if (!post || !post.slug) {
                if (blogPostEmpty) {
                    blogPostEmpty.hidden = false;
                }
                return;
            }

            const blogPostTitle = document.getElementById("blog-post-title");
            const blogPostCategory = document.getElementById("blog-post-category");
            const blogPostMeta = document.getElementById("blog-post-meta");
            const blogPostCover = document.getElementById("blog-post-cover");
            const blogPostExcerpt = document.getElementById("blog-post-excerpt");
            const blogPostContent = document.getElementById("blog-post-content");

            document.title = "The Forward Society | " + post.title;

            if (blogPostTitle) {
                blogPostTitle.textContent = post.title;
            }

            if (blogPostCategory) {
                blogPostCategory.textContent = post.category;
            }

            if (blogPostMeta) {
                blogPostMeta.textContent = "By " + post.authorName + ' • ' + formatDate(post.publishedAt);
            }

            if (blogPostCover) {
                if (post.coverImageUrl) {
                    blogPostCover.src = post.coverImageUrl;
                    blogPostCover.alt = post.title + " cover image";
                    blogPostCover.hidden = false;
                } else {
                    blogPostCover.hidden = true;
                }
            }

            if (blogPostExcerpt) {
                blogPostExcerpt.textContent = post.excerpt;
            }

            if (blogPostContent) {
                blogPostContent.innerHTML = renderPortableText(post.body, post.bodyRaw);
            }

            blogPostArticle.hidden = false;
            renderRelatedPosts(post.slug);
        } catch (error) {
            console.error(error);
            if (blogPostLoading) {
                blogPostLoading.hidden = true;
            }
            if (blogPostEmpty) {
                blogPostEmpty.hidden = false;
                blogPostEmpty.textContent = "Unable to load this blog post right now.";
            }
        }
    }

    renderLeadershipPage();
    renderBlogIndexPage();
    renderBlogPostPage();
})();