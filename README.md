# tfs-web
Static website for The Forward Society, a youth-led social enterprise empowering students through education, skills, and opportunities.

## Admin Content Platform (Sanity Backed)

This workspace now includes a separate admin host for managing content, and all admin runtime files live under `admin/`.

### What it does

- Admin server connects to Sanity using environment variables and manages content documents.
- Main site does not include Sanity logic; it only reads from an admin bridge endpoint.
- Leadership page (`leadership.html`) currently consumes bridge content for CEO and supervisor cards.

### Setup

1. Copy `admin/.env.example` to `admin/.env` and set:
	- `SANITY_PROJECT_ID`
	- `SANITY_DATASET`
	- `SANITY_API_VERSION`
	- `SANITY_WRITE_TOKEN`
	- `ALLOWED_PUBLIC_ORIGINS`
2. Change into `admin` and install dependencies with `npm install`.
3. Start the admin server from `admin` with `npm start`.
4. Open `http://localhost:5500/`.
5. Open `scripts/site-bridge-config.js` and set:
	- `adminBaseUrl` (separately hosted admin domain)
	- `endpoints.leadership` (bridge endpoint path)
6. In Sanity project settings, allow CORS for your admin host if needed.
7. Edit content in the admin page and save.

### Security note

- The Sanity write token stays on the admin server and is not exposed in browser code.
- Do not commit `admin/.env`.

### Bridge Contract Files

- API contract: `admin/bridge-api-spec.md`
- Sample response payload: `admin/bridge-sample-leadership.json`

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

