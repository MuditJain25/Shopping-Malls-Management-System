# MallHub Backend

Spring Boot 3.2 + MySQL 8. See `docs/DESIGN.md` for the full design.

## Run (demo mode — login disabled)

Requires MySQL on `localhost:3306` with a `mall_db` database
(user `root`, set `DB_USER`/`DB_PASS` env vars if different).

```powershell
$env:SPRING_PROFILES_ACTIVE = "demo"
.\mvnw.cmd spring-boot:run   # or mvn spring-boot:run
```

If `mvn` is not installed, any Maven 3.9 distribution works.

## Login (demo)

`POST /api/auth/google` with `{"email": "<placeholder>"}` — no token check.
Placeholders: `customer.demo@gmail.com`, `tenant.demo@gmail.com`,
`shopmgr.demo@gmail.com`, `mallmgr.demo@gmail.com`,
`exec.demo@gmail.com`, `employee.demo@gmail.com`.

## Final mode (Google login)

```powershell
$env:GOOGLE_CLIENT_ID = "<gcp-client-id>"
$env:APP_JWT_SECRET = "<32-char-min-secret>"
$env:SPRING_PROFILES_ACTIVE = "dev"   # or default profile
```

## Docs

- `docs/DESIGN.md` — frozen design, deltas, doubts, pending items.
- Swagger UI: `http://localhost:8080/swagger-ui.html` (after boot).
