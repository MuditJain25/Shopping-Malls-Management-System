# Backend Reading Guide (viva prep)

> Code: `backend/src/main/java/com/mallhub/`. Stack: Java 17, Spring Boot 3.2.5,
> MySQL 8, JPA/Hibernate, Spring Security, Flyway, jjwt, google-api-client.
> Read this file top-to-bottom; it is ordered for someone seeing the code cold.

---

## 1. The 5-minute mental model

The backend is a plain **layered REST API**:

```
HTTP → Controller (routes, thin) → Service (rules, transactions) → Repository (DB) → MySQL
```

- **Entities** (`entity/`) are the database tables as Java classes. All IDs are `INT`.
- **Repositories** (`repository/`) are one-line interfaces — Spring writes the SQL for you.
- **Services** (`service/`) hold every business rule (bid validation, check-in logic, role lookup).
- **Controllers** (`controller/`) only map URLs to service calls. No `if` logic about rules lives here.
- **DTOs** (`dto/`) are the JSON shapes. Entities never leave the server; clients only see DTOs.
- **Security** (`security/` + `config/SecurityConfig.java`) decides who may call what.
- **Migrations** (`resources/db/migration/`) build the database: `V1__init.sql` creates tables,
  `V2__seed.sql` fills demo rows.

Two modes exist (same code, switch via `SPRING_PROFILES_ACTIVE`):
`demo` = login stubbed, all endpoints open (for Monday's demo).
Anything else = Google ID-token verification + app JWT required.

---

## 2. Folder map — what to open first

| # | Open this | Why |
|---|---|---|
| 1 | `MallHubApplication.java` | Entry point; nothing else to learn here |
| 2 | `controller/HealthController.java` | Smallest controller; shows the URL → method pattern |
| 3 | `entity/Mall.java`, `entity/Store.java` | Simplest entities; see §4 for the ID-column naming |
| 4 | `repository/StoreRepository.java` | Shows derived queries (`findByMallIdAndStatus` = auto SQL) |
| 5 | `service/StoreService.java` | Typical service: validation + mapping, `@Transactional` writes |
| 6 | `controller/StoreController.java` | Typical controller: full CRUD + sub-resources |
| 7 | `service/BidService.java` | The hardest logic (locking, bid math) — read after the above |
| 8 | `service/AuthService.java` + `security/` | Login + roles |
| 9 | `resources/db/migration/V1__init.sql` | The real schema (superset of `database/mall_schema.sql`) |
| 10 | `resources/db/migration/V2__seed.sql` | Demo data and the `m1→1, s1→1…` ID map |

Full inventory: **20 entities, 20 repositories, 9 services, 11 controllers,
4 DTO files + 2 paging helpers, 3 security classes, 2 config classes,
1 exception class + 1 handler, 1 smoke test.**

---

## 3. Request lifecycle (trace any endpoint this way)

Example: `GET /api/malls/1/stores`

1. `config/SecurityConfig.java` (`filterChain`) — is the path permitted? In `demo`, everything is.
2. `security/JwtAuthFilter.java` (`doFilterInternal`) — reads `Authorization: Bearer …`,
   validates the app JWT, stores `ROLE_*` in the security context. Bad/missing token =
   anonymous (allowed through in demo, rejected elsewhere).
3. `controller/MallController.java` (`stores`) — extracts `{id}`, calls the service.
4. `service/MallService.java` (`storesByMall`) — checks the mall exists
   (`ApiException.notFound` → 404 via the handler), loads stores, maps to DTOs.
5. `repository/StoreRepository.java` (`findByMallId`) — Spring generates
   `SELECT … FROM Store WHERE mall_id = ?`.
6. `exception/GlobalExceptionHandler.java` — converts any `ApiException` or validation
   failure into `{timestamp, status, error, message, path}` JSON.

Error codes to quote in viva: 404 not found, 400 bad request, 409 conflict
(already-finalized, double check-in), 422 validation (`@NotBlank`/`@Email`/`@Min` fail),
401 bad login, 403 forbidden.

---

## 4. Entities — conventions that explain 90% of the files

- Table names match the schema exactly (`@Table(name = "Store")`, `@Table(name = "Bid_Event")`).
  `AppUser` maps to `` `User` `` (backticks — `User` collides with a MySQL keyword).
- PK columns keep schema names: `@Column(name = "mall_id") private Integer mallId`.
- **No `@ManyToOne` anywhere — foreign keys are plain `Integer` fields**
  (e.g. `Store.mallId`, `Employee.storeId`). Deliberate: avoids lazy-loading bugs and keeps
  SQL predictable. Joins are done explicitly in services (e.g. `TenantService.storeIds`).
- Weak/composite keys use `@EmbeddedId` + static `Id` class with `equals`/`hashCode`
  (see `entity/StoreProduct.java`, `entity/Bid.java`, `entity/Attendance.java`).
- Non-obvious columns (each is a viva trap — know the reason):
  - `Store.shopNumber` is `VARCHAR`: values are `G-12`, `F2-08` — an `INT` column from the
    draft schema could not store them.
  - `Store.listingMedia` is ONE image URL string (DESIGN v2.1), not an array.
  - `StoreProduct.toShow` is `BOOLEAN` (the "top selling" star).
  - `Employee.mallId` is `NOT NULL`; `Employee.storeId` is nullable (direct mall staff).
  - `MallManager.mallId`, `Store.mallId` are `NOT NULL`, all with `ON DELETE RESTRICT`
    (deleting a mall with staff/stores is refused instead of cascading).
  - `BidEvent.status` (`open`/`finalized`) and `Bid.bidderName` were added — the draft
    schema lacked them but the UI needs them.
  - `BidEvent.finalAllocation` is still `BOOLEAN` (kept to honor the committed schema;
    the human-readable note is derived from the winning bid — full story in DESIGN §6-D10).
  - `User` gained only `google_sub`; **role is never stored** — it is derived at login.

---

## 5. Repositories — Spring writes the queries

Each is an interface extending `JpaRepository<Entity, KeyType>`; method names become SQL:

- `findByMallId`, `findByMallIdAndStatus`, `findByEmail`, `findByIdStoreId`
  (`Id` prefix = field inside the embedded composite key).
- Two hand-written queries exist, both in `repository/BidEventRepository.java`:
  `findForUpdate` uses `@Lock(PESSIMISTIC_WRITE)` — a row lock so two simultaneous bids
  can't both win (see §7, trace 2).

---

## 6. Services — all rules live here

| Service | Key methods → rules |
|---|---|
| `AuthService` | `exchange` → verify-or-stub (§8), `resolve` → fixed role precedence executive → mall_manager → tenant → employee/shop_manager → customer; `shop_manager` = employee whose designation is `Shop Manager`; unknown email auto-creates a `customer` User |
| `MallService` | `list(q, city)` search filter; `topProducts` = `to_show` links joined to product+store |
| `StoreService` | `addProduct` always links with `to_show=false`; `setVisibility` flips only; offers use per-store `MAX+1` ids |
| `BidService` | Place-bid math + locking; finalize guard (see §7 trace 2) |
| `TenantService` | `create` assigns stores (status → `occupied` + join rows); `delete` frees stores (→ `available` only if no other tenant holds them); transactions match `sender = business_name` |
| `EmployeeService` | Leave: `end ≥ start`, only `pending` decidable, decision is `approved`/`rejected`; attendance: check-in creates today's row, second check-in → 409, check-out needs a check-in, second check-out → 409 |
| `ManagerService` | `create` requires the mall to exist and the email to be unused in **all** role tables (email is the login key — it must resolve to exactly one role) |
| `ExecutiveService` | Read-only (no executive creation endpoint — seeded only) |
| `TransactionService` | `receiverFor` maps mall city → receiver string in ONE place (`New York → Heritage Plaza Mall…`); marked TODO for FK normalization |

---

## 7. Three end-to-end traces (memorize these)

**Trace A — `POST /api/auth/google {"email":"exec.demo@gmail.com"}` (demo mode)**
`AuthController.google` → `AuthService.exchange`: demo skips Google verification, takes the
email → `resolve` finds it in `Enterprise_Executive` → role `executive`, profileId `1` →
`AppTokenProvider.issue` signs a 24h JWT (claims: email, role, profileId) →
`{token, user}` returned. Try the other five demo emails from `V2__seed.sql` and predict
each role before sending.

**Trace B — `POST /api/bid-events/1/bids {"user_id":1,"bid_amount":6000,…}`**
`BidEventController.place` → `BidService.placeBid` (`@Transactional`):
1. Load event by `event_id` (seed keeps them unique).
2. Re-load with `findForUpdate` — row lock; concurrent bids serialize here.
3. Reject unless `status = open` (409) and `amount ≥ highest + increment` (400;
   `highest` = current `winning` bid or `minimum_bid_amount`).
4. Flip previous `winning` → `outbid`; insert new row (`bid_id` = global MAX+1,
   `round` = count+1, `status = winning`).
Snake_case matters: `user_id`, not `userId` (Jackson `SNAKE_CASE` mapping).

**Trace C — `POST /api/employees/3/attendance/check-in` twice**
First call: no row for today → create with `check_in_time=now` → 200.
Second call: row exists with check-in set → 409 "Already checked in today"
(deliberately strict — the old mock silently overwrote the real clock-in time).

---

## 8. Config, DTOs, paging, tests

- `resources/application.yml` — datasource, `ddl-auto: validate` (Hibernate never alters
  the schema; Flyway owns it), Jackson `SNAKE_CASE`, JWT/CORS settings.
  `application-demo.yml` — one flag: `app.auth.enabled=false`.
- DTOs are Java `record`s grouped by domain (`AuthDtos`, `MallDtos`, `BidDtos`,
  `PeopleDtos`) — immutable, no boilerplate. Requests carry `jakarta.validation`
  annotations (`@NotBlank`, `@Email`, `@Min`, `@NotNull`).
- Paging is optional by design: no `?page=` → plain JSON array (what the frozen frontend
  expects); with `?page=&size=&sort=` → `PageEnvelope` (`dto/Paging.java`, `dto/PageEnvelope.java`).
- `MallHubSmokeTest.java` — boots the app in `demo` profile, asserts `/api/health`
  is UP and `/api/malls` returns 3 rows. Run: `mvn test`.

---

## 9. Likely viva questions (with one-line answers)

1. *Why no passwords?* Google login only; demo profile stubs it (email, no token check).
2. *How are roles assigned?* Derived per login by email lookup with fixed precedence; only
   stored data is the domain rows themselves.
3. *Why `INT` ids?* Project decision (DESIGN D-IDS); frontend string ids (`m1`) must be
   adapted at integration.
4. *Why composite keys (`Bid`, `Attendance`)?* They mirror the committed schema; known
   trade-offs (non-unique `bid_id` alone, verbose JPA) are documented in DESIGN §6-D11.
5. *How do you prevent two winning bids?* Pessimistic row lock + `@Transactional` in
   `placeBid` (single shared guard instead of per-caller checks).
6. *Why no `@ManyToOne` relations?* Scalar FKs keep SQL explicit and avoid lazy-loading
   surprises at this scale.
7. *Flyway vs `ddl-auto: update`?* Migrations are reviewable/versioned; `validate` guarantees
   code matches the migrated schema.
8. *Why does finalize accept text it doesn't store?* `final_allocation` is still `BOOLEAN`
   per the frozen schema; persisting the note awaits the `VARCHAR` migration (pending P3).
9. *Revenue endpoints?* Deferred entirely (entity exists, no controller) — pending P2.
10. *N+1 queries (e.g. `topProducts` loops repos)?* Fine for tens of rows; would replace with
    a JPQL fetch-join at scale.
11. *What breaks if someone inserts rows by hand?* Weak-entity ids use per-parent `MAX+1`;
    hand inserts must use ids `≥ 90000` (reserved range in the seed header).
12. *Demo vs final mode?* One flag (`app.auth.enabled`) + `SecurityConfig` branch; final mode
    verifies Google tokens and enforces JWT + roles.

---

## 10. Glossary (schema ↔ UI words)

Mall = shopping centre · Store = shop unit (`occupied`/`available`) · Tenant = business renting
stores · listing_media = the store's display image · to_show = "Top Selling" star ·
BidEvent = auction for an available store · winning/outbid = bid states · Revenue_Information =
tenant's self-reported revenue (deferred) · Financial_Transaction = rent payments ·
Leave_Request / Payroll_Record / Attendance = employee self-service · oversees = which malls
an executive supervises.
