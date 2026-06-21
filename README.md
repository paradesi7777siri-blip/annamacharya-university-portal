# Annamacharya University Management Portal

Student, Faculty and HOD registration/login portal for a college department management project.

## What is included

- Student registration and login
- Faculty registration and login with a protected faculty code
- HOD registration and login with a protected HOD code
- Separate role dashboards after login
- Faculty access to student attendance, internal marks, external marks, performance and CGPA updates
- HOD access to both student records and faculty profile management
- Server-side role protection so students cannot access faculty/HOD APIs
- CSV student report export
- Local JSON database with hashed passwords and seeded demo data

## Demo accounts

| Role | Email / Username | Password |
| --- | --- | --- |
| Student | `student@annamacharya.edu.in` or `john.doe` | `Student123` |
| Faculty | `faculty@annamacharya.edu.in` or `dr.kavya` | `Faculty123` |
| HOD | `hod@annamacharya.edu.in` or `cse.hod` | `Hod123` |

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

## Optional environment variables

Create a `.env` file or set these in your deployment platform:

```bash
PORT=3000
FACULTY_REGISTRATION_CODE=FAC-AU-2026
HOD_REGISTRATION_CODE=HOD-AU-2026
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

Recommended simple deployment: Render.

1. Push this folder to a GitHub repository.
2. Open Render and create a new Web Service.
3. Connect your GitHub repository.
4. Set runtime to Node.
5. Build command: leave blank or use `npm install`.
6. Start command: `node server.js`.
7. Add environment variables for `FACULTY_REGISTRATION_CODE` and `HOD_REGISTRATION_CODE`.
8. Deploy and open the generated Render URL.

Railway, Fly.io, or any VPS with Node 18+ can also run it with the same start command.

## Project structure

```text
server.js          Backend, auth, APIs, static file server
public/index.html Frontend shell
public/styles.css UI styling based on the supplied design
public/app.js     Role dashboards and frontend API calls
data/db.json      Auto-generated local database
```
