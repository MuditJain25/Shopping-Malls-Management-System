# Shopping Malls Management System

Monorepo: `frontend/` (React + Vite, mock data) and `backend/` (Spring Boot 3 + MySQL 8).
Backend design decisions live in `backend/docs/DESIGN.md`.

## Prerequisites (one-time setup, already done on this machine)

- Java 17, Node.js 18+, MySQL 8 binaries installed.
- Portable Maven at `%LOCALAPPDATA%\Temp\opencode\maven-tmp\apache-maven-3.9.9\bin\mvn.cmd`
  (re-download from https://archive.apache.org/dist/maven/maven-3/3.9.9/ if missing).
- Frontend dependencies installed (`frontend/node_modules` exists; otherwise run `npm install` in `frontend/`).

## Start after a restart (in this order)

All commands in PowerShell. Replace `<repo>` with this folder's path.

**1. MySQL** (local instance, root with no password, data in Temp):
```powershell
Start-Process -FilePath "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" `
  -ArgumentList "--datadir=$env:LOCALAPPDATA\Temp\opencode\mysql-data --port=3306 --console" `
  -WindowStyle Hidden
mysqladmin -u root --port=3306 ping   # expect: mysqld is alive
```

**2. Backend** (demo profile = login stubbed, no Google setup needed):
```powershell
cd <repo>\backend
$env:SPRING_PROFILES_ACTIVE = "demo"
java -jar target\mallhub-backend-0.1.0.jar
```
Wait ~60s on cold boot, then check http://localhost:8080/api/health → `{"status":"UP"}`.
Flyway migrates and seeds `mall_db` automatically on first run.

**3. Frontend**:
```powershell
cd <repo>\frontend
npm run dev
```
Open http://localhost:5173/ and sign in with any demo account (password `demo123`):
`customer@demo.com`, `tenant@demo.com`, `shopmgr@demo.com`,
`mallmgr@demo.com`, `exec@demo.com`, `employee@demo.com`.

## Rebuilding the backend jar (only after Java changes)

```powershell
cd <repo>\backend
& "$env:LOCALAPPDATA\Temp\opencode\maven-tmp\apache-maven-3.9.9\bin\mvn.cmd" -q package -DskipTests
```

## Troubleshooting

- **Port in use**: `Get-Process -Name java,mysqld,node | Stop-Process -Force`, then start over.
- **Keep the machine awake** while running; sleep kills the background servers.
- **Temp cleanup risk**: the MySQL data dir and portable Maven live under
  `%LOCALAPPDATA%\Temp\opencode\`. If a disk cleaner wipes Temp, re-init MySQL
  (`mysqld --initialize-insecure --datadir=...`) and re-download Maven (links above),
  then rebuild the jar — no source changes are lost (they live in this repo).
- **Sleep/lock note**: background `java`/`mysqld`/`npm` processes die on sleep;
  just repeat the three steps above.
