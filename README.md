# tfs-web
Static website for The Forward Society, a youth-led social enterprise empowering students through education, skills, and opportunities.

## CMS Workflow (Sanity Studio)

This project now uses Sanity Studio as the content management interface.

### Current architecture

- Editors manage leadership content in Sanity Studio.
- Public site reads leadership content directly from Sanity's query API.
- No custom admin dashboard is required for the content workflow.

### Main site setup

1. Open `scripts/site-cms-config.js` and verify:
	- `sanity.projectId`
	- `sanity.dataset`
	- `sanity.apiVersion`
	- `sanity.leadershipDocumentId`
2. In Sanity project settings, allow CORS for your website origin.
3. Publish leadership content in Sanity Studio.

### Do we need Node.js on the main site?

- No, not for the current read-only CMS usage.
- The main site can stay static and fetch published content directly from Sanity CDN.
- Node is only needed if you later add server-only logic (private tokens, webhooks, secure mutations, etc.).

## UI Consistency Rules

Use these rules for all pages to keep typography and layout consistent.

### Font Size Scale

- Base text: `text-base`
- Supporting or metadata text: `text-sm`
- Main page title (`h1`): `text-4xl sm:text-5xl`
- Section heading (`h2`): `text-3xl sm:text-4xl`
- Card heading (`h3`): `text-2xl`
- Buttons and nav links: `text-sm font-medium`

### Spacing and Layout

- Section vertical spacing: `py-16` (desktop can use `lg:py-20`)
- Content width wrappers:
	- Main content: `max-w-6xl`
	- Header/footer nav: `max-w-7xl`
- Card spacing: `p-6` or `p-8`

### Visual Style

- Keep colors neutral and light (`white`, `gray`, `slate` ranges)
- Use rounded containers/cards (`rounded-2xl` or `rounded-3xl`)
- Keep borders subtle (`border-gray-200` / `border-slate-200`)
- Avoid introducing one-off font-size utilities unless necessary

