# Annamacharya University Management Portal

Student, Faculty, HOD and private Admin portal for a college department management project.

## What is included

- Student registration and login
- Faculty registration and login with a protected faculty code
- HOD registration and login with a protected HOD code
- Private admin login with no public admin registration
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
| Admin | `admin@annamacharya.edu.in` or `admin` | `Admin123` |

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
- `data/db.json` is ignored by Git so demo data/private accounts are not accidentally pushed
- To reset local demo data, stop the server and remove `data/db.json`; it will be recreated on the next start

For a real hosted project, upgrade the database to Supabase Postgres or another hosted database. The current local JSON database is perfect for college demo/project review, but hosted services may clear local files during redeploys.

## Optional environment variables

Create a `.env` file or set these in your deployment platform:

```bash
PORT=3000
FACULTY_REGISTRATION_CODE=FAC-AU-2026
HOD_REGISTRATION_CODE=HOD-AU-2026
ADMIN_EMAIL=admin@annamacharya.edu.in
ADMIN_PASSWORD=Admin123
```

## GitHub push steps

From this project folder:

```bash
git init
git add .
git commit -m "Build Annamacharya University portal"
git branch -M main
git remote add origin https://github.com/paradesi7777siri-blip/YOUR_REPOSITORY_NAME.git
git push -u origin main
```

Replace `YOUR_REPOSITORY_NAME` with the actual repository name you create on GitHub.

## Deployment

This project uses a Node backend, so GitHub Pages alone will not work because it only hosts static files.

Best free/simple deployment for this project: Render Web Service.

1. Push this folder to a GitHub repository.
2. Open Render and create a new Web Service.
3. Connect your GitHub repository.
4. Set runtime to Node.
5. Build command: `npm install`
6. Start command: `node server.js`.
7. Add environment variables for `FACULTY_REGISTRATION_CODE`, `HOD_REGISTRATION_CODE`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
8. Deploy and open the generated Render URL.

Important: the built-in JSON database is best for demo deployment. For a real public portal, use Render for the Node app plus Supabase free Postgres for the database.

Other options: Koyeb, Railway, Fly.io, or any VPS with Node 18+ can also run it with the same start command.

## Project structure

```text
server.js          Backend, auth, APIs, static file server
public/index.html Frontend shell
public/styles.css UI styling based on the supplied design
public/app.js     Role dashboards and frontend API calls
public/assets     Uploaded Annamacharya logo images
data/db.json      Auto-generated local database
```
