# Annamacharya University Management Portal

Student, Faculty, HOD and hidden Admin portal for a college department management project.

## What is included

- Student registration and login
- Faculty registration and login with a protected faculty code
- HOD registration and login with a protected HOD code
- Hidden admin dashboard at `/admin`
- Admin access through generated admin key, not email/password
- No admin tab or admin button on the public portal
- Separate role dashboards after login
- Faculty access to student attendance, internal marks, external marks, performance and CGPA updates
- HOD access to both student records and faculty profile management
- Server-side role protection so students cannot access faculty/HOD/Admin APIs
- 10-digit-only phone number validation in the browser and backend
- Branches include CSE, AI, AIML, AIDS, Data Science, Cyber Security, IT, ECE, EEE, Mechanical, Civil and H&S
- CSV student report export
- Local JSON database with hashed passwords and seeded demo data

## Demo accounts

| Role | Email / Username | Password |
| --- | --- | --- |
| Student | `student@annamacharya.edu.in` or `john.doe` | `Student123` |
| Faculty | `faculty@annamacharya.edu.in` or `dr.kavya` | `Faculty123` |
| HOD | `hod@annamacharya.edu.in` or `cse.hod` | `Hod123` |

## Admin key

Admin does not use email login.

Generate a strong admin key:

```bash
npm run admin:key
```

Use that value as `ADMIN_KEY` in your `.env` file or deployment environment variables.

Admin page:

```text
http://localhost:3000/admin
```

After deployment:

```text
https://your-site-name.onrender.com/admin
```

If `ADMIN_KEY` is not set locally, the server creates `data/admin-key.txt` on first run. That file is ignored by Git.

## Registration codes

Use these for demo registration unless you change them in environment variables:

- Faculty code: `FAC-AU-2026`
- HOD code: `HOD-AU-2026`

## Run locally

```bash
node server.js
```

Open:

```text
http://localhost:3000
```

The app creates `data/db.json` automatically on first start.

## Database setup

This version uses a local JSON database so the project runs without installing MySQL, MongoDB, Prisma or any paid service.

- Database file: `data/db.json`
- Created automatically when you run `node server.js`
- Passwords are stored as hashes, not plain text
- `data/db.json` and `data/admin-key.txt` are ignored by Git so demo data/private keys are not accidentally pushed
- To reset local demo data, stop the server and remove `data/db.json`; it will be recreated on the next start

For a real hosted project, upgrade the database to Supabase Postgres or another hosted database. The current local JSON database is perfect for college demo/project review, but free hosting services may clear local files during redeploys.

Supabase note: Supabase is PostgreSQL, not SQLite. You cannot run a live SQLite database inside Supabase. Use:

- `database/supabase-schema.sql` for Supabase Postgres
- `database/sqlite-schema.sql` only as a local SQLite planning/reference file
- Supabase Storage only for uploaded files/backups, not as the live database engine

## Optional environment variables

Create a `.env` file or set these in your deployment platform:

```bash
PORT=3000
FACULTY_REGISTRATION_CODE=FAC-AU-2026
HOD_REGISTRATION_CODE=HOD-AU-2026
ADMIN_KEY=your_generated_admin_key
```

## GitHub push steps

From this project folder:

```bash
git remote add origin https://github.com/paradesi7777siri-blip/YOUR_REPOSITORY_NAME.git
git push -u origin main
```

Replace `YOUR_REPOSITORY_NAME` with the actual repository name you create on GitHub.

## Deployment: best free platform

This project uses a Node backend, so GitHub Pages alone will not work because it only hosts static files.

Best free/simple deployment for this project: Render Web Service.

1. Push this folder to a GitHub repository.
2. Open Render and create a new Web Service.
3. Connect your GitHub repository.
4. Set runtime to Node.
5. Build command: `npm install`
6. Start command: `node server.js`.
7. Generate an admin key locally with `npm run admin:key`.
8. Add environment variables for `FACULTY_REGISTRATION_CODE`, `HOD_REGISTRATION_CODE`, and `ADMIN_KEY`.
9. Deploy and open the generated Render URL.
10. Admin page is available only at `/admin`.

Important: the built-in JSON database is best for demo deployment. For a real public portal, use Render for the Node app plus Supabase free Postgres for the database.

Other options: Koyeb, Railway, Fly.io, or any VPS with Node 18+ can also run it with the same start command.

## Supabase setup steps

Use Supabase when you are ready to replace `data/db.json` with hosted server-side data.

1. Create a Supabase project.
2. Open SQL Editor.
3. Paste and run `database/supabase-schema.sql`.
4. Create a Storage bucket named `portal-files` if you want to store uploaded images, documents, or SQLite backup files.
5. In your deployment platform, add Supabase environment variables later when the backend storage layer is upgraded:

```text
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=portal-files
```

Current version note: these Supabase variables are documented for the next database upgrade step. The app currently runs on the built-in local JSON database.

## Project structure

```text
server.js          Backend, auth, APIs, static file server
public/index.html Frontend shell
public/styles.css UI styling based on the supplied design
public/app.js     Role dashboards and frontend API calls
public/assets     Uploaded Annamacharya logo images
database/         Supabase Postgres and local SQLite reference schemas
data/db.json      Auto-generated local database
data/admin-key.txt Auto-generated local admin key when ADMIN_KEY is not set
```
