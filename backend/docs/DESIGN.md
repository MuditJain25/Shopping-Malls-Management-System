# Shopping Malls Management — Spring Boot Backend — Design (v2.1, Google-Auth revision)

> Status: **DESIGN FROZEN FOR REVIEW — NO CODE YET**
> Constraints: `frontend/*` untouched. `database/mall_schema.sql` untouched (source of truth).
> All DB changes below are **planned deltas** to be applied as Flyway migrations, not edits to the original file.
> Ground truth for UI shape: `frontend/src/lib/api.js`, `frontend/src/lib/mockData.js`.
> This doc supersedes v1.0. It incorporates user decisions dated 2026-09-30.

---

## 0. Decisions locked (user-confirmed)

| # | Decision |
|---|---|
| D-AUTH | No password auth. Google login only. No `password_hash`, no email/password signup/login. |
| D-IDS | All PK/FK IDs are `INT` (not BIGINT, not VARCHAR). `AUTO_INCREMENT` via JPA `IDENTITY`. |
| D-MALL-COLS | Add `Mall.image_url`, `Mall.description` (required — present in mock, absent in schema). |
| D-LISTING | `Store.listing_media` is ONE single image URL string (no array, no new table). See §6-D2. v2.1 revision: single-URL per user answer. |
| D-TOSHOW | `Store_Sells_Product.to_show` is `BOOLEAN`. |
| D-REVENUE | `Revenue_Information` UNCHANGED + revenue endpoints DEFERRED entirely (pending, not even accept-but-ignore). See §16-P2. |
| D-TXN | `Financial_Transaction.sender/receiver` stay `VARCHAR` (no FK). But `sender_type/receiver_type` must be added (missing in schema, present in mock). |
| D-EMP-MALL | `Employee.mall_id` added, `NOT NULL`, `ON DELETE RESTRICT` (confirmed). |
| D-MGR-MALL | `Mall_Manager.mall_id` is `NOT NULL` (manager must belong to a mall), `ON DELETE RESTRICT` (confirmed). |
| D-STORE-MALL | `Store.mall_id` is `NOT NULL`, `ON DELETE RESTRICT` (confirmed v2.1). |
| D-FINAL | `Bid_Event.final_allocation BOOLEAN` kept as-is for now (committed schema). Workaround in §6-D10. |
| D-BIDPK | `Bid` composite PK `(user_id, bid_id)` + composite FK `(store_id, event_id)` kept as-is (committed). Workarounds in §6-D11. |
| D-PROD-IMG | Add `Product.image_url`. |
| D-PAGING | Removed on this branch — list endpoints return plain arrays. `master` retains the paginated version. |
| D-ANALYTICS | No analytics endpoint for MVP. Deferred. |
| D-MEDIA | Image/media are external URLs only (Pexels). No upload endpoint. |
| D-DISCOUNT | `Discount_Offer` entity needed (full CRUD: GET/POST/PUT/DELETE, confirmed v2.1). |
| D-OVERSEES | `EE_Oversees_Mall` needed (`GET /executives/{id}/malls`). |
| D-CORS | Dev origin `http://localhost:5173`. Prod TBD. |
| D-EXEC | No public executive creation. Seed demo executives only. `shop_manager` inferred from `Employee.current_designation = 'Shop Manager'`. |

**What "file upload" meant (Q3):** an alternative `POST /api/stores/{id}/media` with `multipart/form-data` that would store binary images server-side (local disk / S3) instead of URL strings. Since D-MEDIA = URLs only, **no upload endpoint is designed**. `image_url` / `listing_media` are plain URL strings supplied by the client.

---

## 1. Goals / Non-goals

**Goals:**
- 1:1 server coverage for every `api*.js` function + the 5 missing mutations the UI performs by direct array push/splice (`POST /stores/{id}/products`, `POST /tenants`, `DELETE /tenants/{id}`, `DELETE /employees/{id}`, `PATCH /employees/{id}/leave-requests/{rid}`).
- Google-login auth with role derivation, no passwords.
- Minimal schema deltas, all listed in §6, none applied to `mall_schema.sql` itself.
- `snake_case` JSON matching mock keys so future frontend switch is mechanical.

**Non-goals (MVP):**
- Analytics (`GET /analytics/mall/{id}`) — deferred.
- `Revenue_Information.month/amount/submitted_date` persistence — deferred.
- `Bid_Event.final_allocation` string migration — deferred.
- File upload, notifications, search index, caching, rate limiting.

---

## 2. Assumptions (A1–A5 confirmed)

- A1: `api.js` header comment is the intended contract; direct `mockData` imports in pages are tech debt to be replaced later by API calls.
- A2: MySQL 8, database `mall_db`.
- A3: 6 roles: `customer, tenant, shop_manager, mall_manager, executive, employee`. `shop_manager` is a view over `employee` (designation check), not a table.
- A4: JSON is `snake_case` (`mall_id`, `store_id`, …).
- A5 (revised): auth is Google ID-token exchange → app JWT, not server sessions.

---

## 3. Tech stack

```
Java 21 | Spring Boot 3.3.x | Maven
spring-boot-starter-web, spring-boot-starter-data-jpa,
spring-boot-starter-security, spring-boot-starter-validation,
mysql-connector-j, flyway-core + flyway-mysql,
google-api-client (GoogleIdTokenVerifier),
jjwt-api + jjwt-impl + jjwt-jackson (app JWT),
springdoc-openapi-starter-webmvc-ui,
lombok, mapstruct
```

No new table for auth. No password encoder needed (no passwords). `BCrypt` dependency dropped.

---

## 4. Project structure (fewest files that cover the contract)

```
backend/
  pom.xml
  src/main/java/com/mallhub/
    MallHubApplication.java
    config/
      SecurityConfig.java       // stateless, permit list, JwtAuthFilter wiring
      CorsConfig.java           // http://localhost:5173, Authorization header, maxAge 3600
      WebConfig.java            // Jackson SNAKE_CASE, JSR-310 dates, Pageable resolver
      OpenApiConfig.java        // /v3/api-docs, bearer scheme
      GoogleConfig.java         // GoogleIdTokenVerifier bean (clientId from yml)
    auth/
      GoogleTokenVerifier.java  // verify Google ID token → GooglePrincipal(email, given, family, sub)
      AppTokenProvider.java     // issue/validate app JWT (HS256, 24h, claims role/profile)
      JwtAuthFilter.java        // OncePerRequestFilter, sets SecurityContext from app JWT
      AuthService.java          // exchange() + role derivation (see §8)
    controller/
      AuthController.java
      MallController.java
      StoreController.java
      ProductController.java
      BidEventController.java
      BidController.java
      TenantController.java
      EmployeeController.java   // employees + leave + payroll + attendance sub-resources
      MallManagerController.java
      ExecutiveController.java
      DiscountOfferController.java
      HealthController.java
    dto/
      request/
        GoogleLoginRequest.java      // { id_token }
        PlaceBidRequest.java         // { user_id, bid_amount, bidder_name }
        FinalizeRequest.java         // { final_allocation }
        ProductCreateRequest.java    // { product_name, category, price, image_url }
        TenantCreateRequest.java     // { business_name, business_type, email, phone_number, store_ids[] }
        EmployeeCreateRequest.java   // { first_name, last_name, email, phone_number, current_designation, base_salary, store_id }
        LeaveApplyRequest.java       // { start_date, end_date, reason }
        LeaveDecisionRequest.java    // { status: approved|rejected }
        RevenueSubmitRequest.java    // { description, month, amount } (month/amount accepted but NOT persisted until migration — see §16)
        ManagerCreateRequest.java    // { first_name, last_name, email, phone_number, mall_id }
        VisibilityRequest.java       // { to_show: boolean }
        OfferCreateRequest.java      // { start_date, end_date, description }
      response/
        UserResponse.java            // { id, email, role, first_name, last_name, profile_id, profile_type }
        AuthResponse.java            // { token, user }
        MallResponse.java            // mall_id, mall_area_sqft, opening_date, street, city, state, pincode, latitude, longitude, contact_numbers[], image_url, description
        StoreResponse.java           // store_id, shop_number, floor, area_sqft, store_name, status, listing_media (single URL string), mall_id
        ProductResponse.java         // product_id, product_name, category, price, image_url, to_show (nullable unless in store context), store (nullable for top-selling)
        BidEventResponse.java        // event_id, store_id, start_date, end_date, status, minimum_bid_amount, minimum_bid_increment, final_allocation (boolean for now), winning_bid (derived, nullable)
        BidResponse.java             // bid_id, user_id, event_id, store_id, bid_amount, round_number, bid_date, status, bidder_name
        TenantResponse.java          // tenant_id, business_name, business_type, email, date_registered, phone_number, store_ids[]
        EmployeeResponse.java
        ManagerResponse.java
        ExecutiveResponse.java       // executive_id, first_name, last_name, email, date_joined, phone_number, oversees_mall_ids[]
        RevenueResponse.java         // tenant_id, information_id, description (+ month, amount, submitted_date as nullable until migration)
        TransactionResponse.java     // transaction_id, amount, sender, receiver, sender_type, receiver_type, transaction_date, remarks
        LeaveResponse.java / PayrollResponse.java / AttendanceResponse.java / OfferResponse.java
        ApiError.java                // { timestamp, status, error, message, path }
    entity/  (table → class, all IDs INT, see §5)
      Mall, MallContactNumber, MallManager, EnterpriseExecutive, ExecutiveOverseesMall,
      Store, Product, StoreProduct (+ StoreProductId @Embeddable),
      Tenant, StoreTenant, RevenueInformation, DiscountOffer,
      Employee, LeaveRequest, PayrollRecord, Attendance (+ AttendanceId @Embeddable),
      AppUserAsUser (reuses User table — no new table), BidEvent, Bid (+ BidId @Embeddable), FinancialTransaction
    repository/ (one JpaRepository per aggregate; derived query methods only, no @Query unless noted)
      MallRepository, StoreRepository, ProductRepository, StoreProductRepository,
      TenantRepository, StoreTenantRepository, EmployeeRepository, LeaveRequestRepository,
      PayrollRepository, AttendanceRepository, MallManagerRepository, ExecutiveRepository,
      OverseesRepository, BidEventRepository, BidRepository, TransactionRepository,
      UserRepository, OfferRepository, RevenueRepository
    service/ (+ impl/ — one impl per interface)
      AuthService, MallService, StoreService, ProductService, BidService, BidEventService,
      TenantService, EmployeeService, AttendanceService, LeaveService,
      ManagerService, ExecutiveService, OfferService, TransactionService
    exception/
      GlobalExceptionHandler.java (404/400/409/422 → ApiError)
      ResourceNotFoundException, BadRequestException, ConflictException
  src/main/resources/
    application.yml / application-dev.yml / application-prod.yml
    db/migration/V1__deltas.sql   // §6 deltas (does NOT touch mall_schema.sql)
    db/migration/V2__seed.sql     // port of mockData.js with INT ids (see §13)
  src/test/java/com/mallhub/
    AuthServiceTest, BidServiceTest (concurrency), AttendanceServiceTest, MallControllerTest
```

Rule: no `*Util` for single-use code. MapStruct mappers only where entity↔DTO diverges (Mall↔contact_numbers, BidEvent↔winning_bid).

---

## 5. Domain model (INT ids, deltas applied conceptually)

- `Mall(mall_id INT AI PK, mall_area_sqft FLOAT, opening_date DATE, street, city, state, pincode, latitude FLOAT, longitude FLOAT, image_url VARCHAR(1000), description TEXT)` + `MallContactNumber(mall_id FK, contact_number)` 1:N.
- `Store(store_id INT AI PK, shop_number VARCHAR(20), floor INT, area_sqft FLOAT, store_name, status VARCHAR(20) [occupied|available], listing_media VARCHAR(1000) single image URL, mall_id INT NOT NULL FK→Mall ON DELETE RESTRICT)`.
  - `shop_number` MUST be VARCHAR: mock uses `G-12`, `F2-08` — INT cannot store these. This is not an "ID" so D-IDS does not apply.
  - `listing_media` v2.1: SINGLE URL string (not array). Seed picks `listing_media[0]` from mock arrays. Frontend `listing_media[0]` indexing will need a one-line change at integration (string vs array) — documented break, accepted.
- `Product(product_id INT AI PK, product_name, category, price DECIMAL(10,2), image_url VARCHAR(1000))`.
- `StoreProduct(store_id FK, product_id FK, to_show BOOLEAN NOT NULL DEFAULT FALSE, PK(store_id,product_id))`.
- `Tenant(tenant_id INT AI PK, business_name, business_type, email UNIQUE, date_registered DATE, phone_number)` + `StoreTenant(store_id, tenant_id, PK both)` M:N.
- `RevenueInformation(tenant_id FK, information_id INT, description TEXT, PK(tenant_id, information_id))` — UNCHANGED for MVP (month/amount deferred).
- `DiscountOffer(store_id FK, offer_id INT, start_date DATE, end_date DATE, description TEXT, PK(store_id,offer_id))` — weak entity of Store.
- `Employee(employee_id INT AI PK, first_name, last_name, email UNIQUE, date_of_joining DATE, base_salary DECIMAL, current_designation, phone_number, store_id NULL FK→Store ON DELETE SET NULL, mall_id NOT NULL FK→Mall ON DELETE RESTRICT)`.
  - `store_id` nullable (direct mall staff `e7–e9` have `store_id=null` in mock). `mall_id` never null per D-EMP-MALL.
- `LeaveRequest(employee_id FK, request_id INT, start_date, end_date DATE, status VARCHAR(20) [pending|approved|rejected], reason TEXT, PK(employee_id,request_id))`.
- `PayrollRecord(employee_id FK, record_id INT, amount DECIMAL, record_type VARCHAR(50), issue_date DATE, PK(employee_id,record_id))`.
- `Attendance(employee_id FK, date DATE, check_in_time TIME NULL, check_out_time TIME NULL, PK(employee_id,date))`.
- `MallManager(manager_id INT AI PK, first_name, last_name, email UNIQUE, date_joined DATE, phone_number, mall_id NOT NULL FK→Mall ON DELETE RESTRICT)` — per D-MGR-MALL.
- `EnterpriseExecutive(executive_id INT AI PK, first_name, last_name, email UNIQUE, date_joined DATE, phone_number)` + `ExecutiveOverseesMall(executive_id FK, mall_id FK, PK both)`.
- `User(user_id INT AI PK, first_name, last_name, email UNIQUE, phone_number NULL, google_sub VARCHAR(255) UNIQUE NULL)` — reuses committed `User` table + one nullable column for Google linkage. No password column. Role is DERIVED (see §8), not stored.
- `BidEvent(store_id FK, event_id INT, start_date DATE, end_date DATE, final_allocation BOOLEAN NULL, minimum_bid_amount DECIMAL, minimum_bid_increment DECIMAL, status VARCHAR(20) DEFAULT 'open', PK(store_id,event_id))`.
  - `status` is a required delta (schema lacks it; mock filters `status=open/finalized` everywhere). `final_allocation` kept BOOLEAN per D-FINAL.
- `Bid(user_id FK→User, bid_id INT, event_id INT NULL, store_id INT NULL, bid_amount DECIMAL, round_number INT, bid_date DATETIME, status VARCHAR(20) [winning|outbid], bidder_name VARCHAR(255), PK(user_id,bid_id), FK(store_id,event_id)→BidEvent ON DELETE SET NULL)` — kept per D-BIDPK.
- `FinancialTransaction(transaction_id INT AI PK, amount DECIMAL, sender VARCHAR(255), receiver VARCHAR(255), sender_type VARCHAR(50), receiver_type VARCHAR(50), transaction_date DATE, remarks TEXT)` — isolated, no FKs.

---

## 6. Planned DB deltas — complete list (apply as `V1__deltas.sql`; `mall_schema.sql` NOT edited)

> Each item: reason → exact ALTER. All are additive except type narrowings flagged.

- **D1 — Mall media columns (required, D-MALL-COLS).** Mock `malls[].imageUrl/description` have nowhere to go.
  ```sql
  ALTER TABLE Mall ADD COLUMN image_url VARCHAR(1000) NULL, ADD COLUMN description TEXT NULL;
  ```
- **D2 — Store.listing_media single URL (revised v2.1, DECIDED).**
  Per user answer: ONE image URL per store (the listing image shown during bidding). No array, no delimiter, no extra table.
  ```sql
  ALTER TABLE Store MODIFY COLUMN listing_media VARCHAR(1000) NULL;
  -- Stores ONE URL. Seed uses mock listing_media[0]. DTO exposes a plain string (not array).
  -- Known break: frozen frontend does listing_media[0] (expects array). At integration, change to direct string use.
  ```
- **D3 — Store.shop_number type (required, BLOCKER).** Mock uses `G-12`, `F2-08`, `F3-03` — `INT` cannot store these; every seed insert would fail.
  ```sql
  ALTER TABLE Store MODIFY COLUMN shop_number VARCHAR(20) NULL;
  ```
- **D4 — Store_Sells_Product.to_show → BOOLEAN (required, D-TOSHOW).**
  ```sql
  ALTER TABLE Store_Sells_Product MODIFY COLUMN to_show BOOLEAN NOT NULL DEFAULT FALSE;
  ```
- **D5 — Product.image_url (required, D-PROD-IMG).** Mock `products[].imageUrl` has nowhere to go.
  ```sql
  ALTER TABLE Product ADD COLUMN image_url VARCHAR(1000) NULL;
  ```
- **D6 — Employee.mall_id NOT NULL (required, D-EMP-MALL).** Mock `employees[].mall_id` always set.
  ```sql
  ALTER TABLE Employee ADD COLUMN mall_id INT NOT NULL,
    ADD CONSTRAINT fk_emp_mall FOREIGN KEY (mall_id) REFERENCES Mall(mall_id) ON DELETE RESTRICT;
  -- store_id stays nullable (ON DELETE SET NULL) for direct mall staff.
  ```
- **D7 — Mall_Manager.mall_id NOT NULL (required, D-MGR-MALL).**
  ```sql
  ALTER TABLE Mall_Manager MODIFY COLUMN mall_id INT NOT NULL;
  -- Replace FK: DROP FOREIGN KEY … ON DELETE SET NULL; ADD CONSTRAINT fk_mgr_mall FOREIGN KEY (mall_id) REFERENCES Mall(mall_id) ON DELETE RESTRICT;
  -- RESTRICT (not CASCADE) so deleting a mall cannot silently wipe manager accounts; operator must reassign first.
  ```
- **D7b — Store.mall_id NOT NULL (required, D-STORE-MALL, confirmed v2.1).**
  ```sql
  ALTER TABLE Store MODIFY COLUMN mall_id INT NOT NULL;
  -- Replace FK: DROP FOREIGN KEY … ON DELETE SET NULL; ADD CONSTRAINT fk_store_mall FOREIGN KEY (mall_id) REFERENCES Mall(mall_id) ON DELETE RESTRICT;
  ```
- **D8 — User.google_sub (required for Google auth, minimal).** No password column ever added.
  ```sql
  ALTER TABLE User ADD COLUMN google_sub VARCHAR(255) NULL UNIQUE;
  -- Email remains the login key (verified by Google). google_sub stored for stability if user changes email.
  ```
- **D9 — Financial_Transaction sender/receiver types (required).** Mock `transactions[].sender_type/receiver_type` (`tenant`/`mall`) have nowhere to go; D-TXN keeps sender/receiver as strings.
  ```sql
  ALTER TABLE Financial_Transaction ADD COLUMN sender_type VARCHAR(50) NULL, ADD COLUMN receiver_type VARCHAR(50) NULL;
  ```
- **D10 — Bid_Event.status (required) + final_allocation keeps BOOLEAN (D-FINAL).**
  Schema has no `status` but every UI filter uses it (`bidEvents.filter(e=>e.status==='open')`, `BiddingView`, `BidPage`). `final_allocation BOOLEAN` cannot hold mock strings like `'Awarded to BlueSky Ventures'` — honest justification for keeping it:
  > Keep BOOLEAN now ONLY to honor the committed schema and unblock MVP status filtering (`open` vs `finalized`). MVP workaround: BOOLEAN = "is_allocated"; the human-readable allocation note is DERIVED at read time from the winning bid (`bidder_name + bid_amount`) and the `final_allocation` string sent by `PUT …/finalize` is accepted by the API but NOT persisted (documented data loss). Proper fix is pending (below) and must be applied before any legal/financial reliance on allocation notes.
  ```sql
  ALTER TABLE Bid_Event ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'open';
  -- PENDING (not in V1): ALTER TABLE Bid_Event MODIFY COLUMN final_allocation VARCHAR(500) NULL;
  ```
- **D11 — Bid composite PK kept (D-BIDPK). Known issues (major enough to name, not to block MVP):**
  1. `bid_id` alone is NOT unique (PK is `(user_id,bid_id)`) — frontend assumes global `bid_id` (`b1…b8`) unique; `GET /bids/{bid_id}` by id alone is ambiguous.
  2. Inserts need `store_id` resolved server-side from `event_id` (client only sends `eventId`).
  3. JPA mapping is verbose (`@EmbeddedId BidId(userId,bidId)` + composite `@ManyToOne` to `BidEvent`) — larger bug surface, slower joins.
  4. Ordering/pagination by `bid_id` alone is meaningless without `user_id`.
  Mitigation in V1 (no PK change): app-level `bid_id` sequence (max+1 or AUTO_INCREMENT surrogate emulated in service with `@Transactional` + unique index), always resolve `store_id` from event, expose `bid_id` as the public handle and keep `user_id` internal. Pending (not in V1): `ALTER TABLE Bid ADD UNIQUE (bid_id)` + eventual surrogate PK migration.
  - Manual DB inserts (D6-bypass, user-confirmed for checking/seed): SELECTs are always safe. INSERTs bypassing the API MUST use reserved high IDs (`>= 90000` for `bid_id/request_id/record_id/offer_id/information_id/event_id`, documented in `V2__seed.sql` header) so `MAX+1` generation never collides. Prefer seed-file inserts at start + API writes after; raw low-ID inserts will cause duplicate-key errors under concurrent API use.
- **D12 — AUTO_INCREMENT for inserts.** Committed schema declares `INT PRIMARY KEY` without autoincrement; JPA `@GeneratedValue(IDENTITY)` requires it.
  ```sql
  -- For each singleton-PK table (Mall, Store, Product, Tenant, Employee, Mall_Manager, Enterprise_Executive, User, Financial_Transaction):
  ALTER TABLE <T> MODIFY COLUMN <pk> INT NOT NULL AUTO_INCREMENT;
  -- Weak-entity second legs (request_id, record_id, offer_id, information_id, event_id, bid_id) remain app-assigned per-parent sequences (MAX+1 in service, locked per parent).
  ```
- **D13 — Bid.bidder_name.** Mock `bids[].bidder_name` has no column; useful for display without join.
  ```sql
  ALTER TABLE Bid ADD COLUMN bidder_name VARCHAR(255) NULL;
  ```

**Explicitly NOT in V1 (deferred, see §16):** `Revenue_Information(month,amount,submitted_date)`, `Bid_Event.final_allocation VARCHAR`, `Financial_Transaction.receiver_mall_id FK`, analytics tables.

---

## 7. DTOs & JSON shape

- Global Jackson `PropertyNamingStrategy.SNAKE_CASE`; dates `yyyy-MM-dd`, datetimes ISO-8601, times `HH:mm` (matches `BidPage`, `AttendanceView` parsing).
- IDs are JSON numbers (`INT`) — see §14-BREAK for frontend impact.
- `StoreResponse.listing_media`: plain STRING (single URL) per v2.1. Frontend `[0]` indexing must change at integration.
- `MallResponse.contact_numbers`: JSON array (from `Mall_Contact_Number`).
- `TenantResponse.store_ids`: JSON array (from `StoreTenant` join).
- `ExecutiveResponse.oversees_mall_ids`: JSON array (from `EE_Oversees_Mall`).
- `BidEventResponse`: includes `status`, `final_allocation` (boolean for now), plus derived `winning_bid: BidResponse|null` and `current_highest` for `BidPage` convenience.
- `ProductResponse`: `to_show` present only in store context; `store` embedded only in `/malls/{id}/products/top` (matches `getTopSellingProducts` join).

---

## 8. Auth design (Google only)

**Flow (exchange pattern):**
1. Frontend uses Google Identity Services button → obtains Google `credential` (ID token, ~1h).
2. `POST /api/auth/google { "id_token": "<google jwt>" }`.
3. Backend `GoogleTokenVerifier` (google-api-client, `audience = app.google.client-id`) verifies signature/expiry/aud, extracts `email (verified), given_name, family_name, sub`.
4. `AuthService.exchange()` derives role by email lookup, priority order:
   `Enterprise_Executive.email → executive` → `Mall_Manager.email → mall_manager` → `Tenant.email → tenant` → `Employee.email → employee|shop_manager (if current_designation ILIKE 'shop manager')` → else `User.email → customer`, else CREATE `User(first,last,email,google_sub)` → `customer`.
   - `profile_id` = the matched row's INT id (`executive_id / manager_id / tenant_id / employee_id / user_id`); `profile_type` = table name. For `customer` without other profile, `profile_id = user_id`.
   - No executive creation endpoint. No role parameter honored (prevents privilege escalation via self-signup with `role=executive`).
5. `AppTokenProvider` issues app JWT (HS256, `app.jwt.secret` from env, 24h, claims `sub=email, role, profile_id, profile_type`) → `200 { token, user }`. `user` shape matches old `apiLogin` return (`id, email, role, firstName, lastName, profileId`) but `id`/`profileId` are INT now.
6. Subsequent calls send `Authorization: Bearer <appJWT>`; `JwtAuthFilter` validates and sets `Authentication(authorities=[ROLE_<ROLE>])`.
7. Logout is client-side (discard tokens). `POST /api/auth/logout → {success:true}` kept as no-op for `api.js` compat.
8. `GET /api/auth/me` returns current `UserResponse` from app JWT.

**SecurityConfig:**
- `csrf.disable(), sessionCreationPolicy.STATELESS`.
- Permit: `POST /api/auth/**`, `GET /api/health`, `GET /api/malls/**`, `GET /api/stores/**`, `GET /api/products/**`, `GET /api/bid-events/**`, `GET /api/offers/**` (public discovery like landing page). Everything else `authenticated`.
- Method security: `@PreAuthorize("hasRole('EXECUTIVE')")` for `POST /managers`; `hasAnyRole('MALL_MANAGER','EXECUTIVE')` for tenant create/delete, finalize; `hasAnyRole('TENANT','MALL_MANAGER')` for employee write; self-or-manager checks in service (not just annotation) for payroll/attendance/leave.
- CORS: `allowedOrigins=${app.cors.allowed-origins:http://localhost:5173}`, `allowedHeaders=*`, `methods=GET,POST,PUT,PATCH,DELETE,OPTIONS`, no credentials (Bearer, not cookies).

**Demo mode — login disabled (2-day project update, NOT final):**
- Goal: demo without GCP OAuth setup. No `GOOGLE_CLIENT_ID` needed.
- Profile `demo`: `app.auth.enabled=false`. `SecurityConfig` permits ALL `/api/**` (no JWT check). `JwtAuthFilter` logs but never rejects.
- `POST /api/auth/google` accepts `{ "email": "<placeholder>" }` (no `id_token` verification) and returns role-derived `{token,user}` with `token=demo-token-<role>` (opaque, unauthenticated). `GET /api/auth/me` accepts `?email=` for the same stub. Any unknown email → `customer` (auto-created `User` row as in §8.4).
- Method-security annotations are relaxed to permit-all under `demo` (single `@Profile("!demo")` guard on the method-security config, not per controller — one switch).
- ponytail: demo mode is insecure by design (no identity proof). NEVER deploy beyond localhost demo. Final build uses profile `dev/prod` with `app.auth.enabled=true` and real `GoogleTokenVerifier`; the stub class stays but is inactive outside `demo` (upgrade path: delete `DemoAuthController` before final submission if required by evaluator).

---

## 9. API contract (base `/api`)

All list endpoints return plain JSON arrays, ordered in SQL (see §11). Write `201` returns created body; `DELETE` returns `204`.

| Method | Path | Req body | Resp | Roles | Notes / mock source |
|---|---|---|---|---|---|
| POST | `/auth/google` | `{id_token}` | `{token,user}` | permit | replaces login+signup |
| GET | `/auth/me` | — | `User` | auth | |
| POST | `/auth/logout` | — | `{success:true}` | auth | no-op |
| GET | `/malls` | `?q=&city=&page…` | `Mall[]` or Page | permit | `q` searches city/state/description (`LandingPage.jsx:39`) |
| GET | `/malls/{id}` | — | `Mall` | permit | |
| GET | `/malls/{id}/stores` | — | `Store[]` | permit | |
| GET | `/malls/{id}/products/top` | — | `Product[]+store` | permit | `to_show=true` join |
| GET | `/malls/{id}/manager` | — | `Manager\|null` | mall_manager,exec | singular (mock `getManagerByMall` returns one) |
| GET | `/malls/{id}/employees` | `?storeId=` | `Employee[]` | mall_manager,exec | |
| GET | `/malls/{id}/bid-events` | `?status=` | `BidEvent[]` | permit | alias of filtered `/bid-events?mallId=` |
| GET | `/malls/{id}/offers` | — | `Offer[]` | permit | via mall's stores |
| GET | `/stores/available` | `?mallId=` | `Store[]` | permit | |
| GET | `/stores/{id}` | — | `Store` | permit | |
| GET | `/stores/{id}/products` | — | `Product[]` | auth | includes `to_show` |
| POST | `/stores/{id}/products` | ProductCreate | `Product 201` | tenant,shop_manager | **added** (`ProductsView.jsx:24`) |
| PUT | `/stores/{id}/products/{pid}` | `{to_show}` | `{success:true}` | tenant,shop_manager | star toggle |
| GET | `/stores/{id}/employees` | — | `Employee[]` | tenant,mall_manager | |
| GET | `/stores/{id}/offers` | — | `Offer[]` | permit | |
| POST | `/stores/{id}/offers` | OfferCreate | `Offer 201` | tenant,mall_manager | |
| PUT | `/stores/{id}/offers/{oid}` | OfferCreate | `Offer` | tenant,mall_manager | full CRUD confirmed v2.1 |
| DELETE | `/stores/{id}/offers/{oid}` | — | `204` | tenant,mall_manager | full CRUD confirmed v2.1 |
| GET | `/products/{id}` | — | `Product` | permit | optional |
| GET | `/bid-events` | `?mallId=&status=` | `BidEvent[]` | permit | |
| GET | `/bid-events/{id}` | — | `BidEvent` | permit | |
| GET | `/bid-events/{id}/bids` | — | `Bid[]` | permit | |
| POST | `/bid-events/{id}/bids` | `{user_id,bid_amount,bidder_name}` | `Bid 201` | customer+ | server validates increment, flips prev winning→outbid atomically |
| PUT | `/bid-events/{id}/finalize` | `{final_allocation}` | `BidEvent` | mall_manager | string accepted, not persisted (see §6-D10); sets `status=finalized`, `final_allocation=true`; 409 if already finalized |
| GET | `/tenants` | `?mallId=` | `Tenant[]` | exec,mall_manager | `mallId` filters via store join |
| GET | `/tenants/{id}` | — | `Tenant` | auth | |
| POST | `/tenants` | TenantCreate | `Tenant 201` | mall_manager,exec | **added** (`TenantsView.jsx:15`); assigns stores → sets `Store.status=occupied` + join rows |
| DELETE | `/tenants/{id}` | — | `204` | mall_manager,exec | **added**; frees stores → `available` |
| GET | `/tenants/{id}/stores` | — | `Store[]` | auth | |
| GET | `/tenants/{id}/employees` | — | `Employee[]` | tenant,mall_manager | aggregate over tenant stores |
| POST | `/tenants/{id}/employees` | EmployeeCreate | `Employee 201` | tenant | store must belong to tenant |
| GET | `/tenants/{id}/revenue` | — | `Revenue[]` | tenant,exec | DEFERRED v2.1 — not in MVP build (pending P2) |
| POST | `/tenants/{id}/revenue` | `{description,month,amount}` | `Revenue 201` | tenant | DEFERRED v2.1 — not in MVP build (pending P2) |
| GET | `/tenants/{id}/transactions` | — | `Txn[]` | tenant | `sender = tenant.business_name` |
| GET | `/employees/{id}` | — | `Employee` | self,manager,tenant | |
| DELETE | `/employees/{id}` | — | `204` | tenant,mall_manager | **added** (`EmployeesView.jsx:34`) |
| GET | `/employees/{id}/leave-requests` | — | `Leave[]` | self,manager | |
| POST | `/employees/{id}/leave-requests` | `{start_date,end_date,reason}` | `Leave 201 pending` | self | validates end≥start |
| PATCH | `/employees/{id}/leave-requests/{rid}` | `{status}` | `Leave` | tenant,mall_manager | **added** (approval; no api.js entry) |
| GET | `/employees/{id}/payroll` | — | `Payroll[]` | self,manager | |
| GET | `/employees/{id}/attendance` | `?from=&to=` | `Attendance[]` | self,manager | |
| POST | `/employees/{id}/attendance/check-in` | — | `Attendance` | self | upsert today; 409 if already checked-in (lenient update per `api.js:342`? strict 409 chosen — see §10) |
| POST | `/employees/{id}/attendance/check-out` | — | `Attendance` | self | 404 if no check-in |
| GET | `/managers` | — | `Manager[]` | exec | |
| GET | `/managers/{id}` | — | `Manager` | exec,mall_manager | |
| POST | `/managers` | ManagerCreate | `Manager 201` | exec | also links/creates User row for Google login by same email |
| GET | `/executives/{id}` | — | `Executive` | exec | |
| GET | `/executives/{id}/malls` | — | `Mall[]` | exec | via oversees join |
| GET | `/health` | — | `{status:UP}` | permit | |

Error shape (all failures): `{ timestamp, status, error, message, path }`. Validation failures → `422 { message, field_errors: {field:msg} }`.

---

## 10. Business rules (fix in shared service, not per caller)

- **Bids (`BidService.placeBid`, `@Transactional` + `PESSIMISTIC_WRITE` on BidEvent row):** reject if `event.status != open` (410/409) or `bid_amount < currentHighest + minimum_bid_increment` (400, message includes `min_next_bid`). `currentHighest = winning?.bid_amount ?? minimum_bid_amount` (mirrors `BidPage.jsx:31`). `round_number = count+1`. Flip previous `winning→outbid`, insert new `winning`. `bid_date = now()`. Resolve `store_id` from event (client does not send it). `bidder_name` defaults to Google name if absent.
- **Finalize (`BidEventService.finalize`):** idempotent guard (409 if `status=finalized`). Sets `status=finalized`, `final_allocation=true`. Accepted `final_allocation` string is validated non-blank but discarded (logged + `Warning: 199 allocation-note-not-persisted` header) until migration.
- **Tenant↔Store (`TenantService`):** create/update writes `StoreTenant` rows + flips `Store.status`; delete frees stores (`occupied→available` only if no other tenant holds them). All in one txn.
- **Attendance (`AttendanceService`):** PK `(employee_id,date)`. Check-in creates or 409 if `check_in_time` already set (stricter than mock's silent overwrite — prevents accidental double-tap wiping real clock-in; chosen deliberately). Check-out requires row + `check_in_time`, sets `check_out_time` (overwrite allowed once, second checkout 409).
- **Leave:** `end_date ≥ start_date`, else 400. Only `pending` can transition; `approved|rejected` terminal.
- **Product visibility:** `PUT` flips `StoreProduct.to_show` only (never creates Product).
- **Manager create:** `mall_id` required (D-MGR-MALL); email must be unique across `Mall_Manager`+`Tenant`+`Employee`+`Executive` to keep Google role derivation deterministic; else 409.
- **Role derivation precedence** fixed (§8.4) to avoid an email existing in two tables mapping nondeterministically.

---

## 11. Filtering / ordering (no pagination on this branch)

- Every list endpoint returns a plain JSON array. No `page`/`size`/`sort` params, no envelope.
- Ordering is applied in SQL: derived queries encode it in the method name
  (`findByMallId`, `findByStatusOrderByTransactionIdAsc`, ...); `@Query` methods take a
  `Sort` argument. This keeps row order deterministic without an envelope.
- Filtering is also in SQL, never in Java — see §6 and the repository `@Query` methods:
  `MallRepository.search` (q/city), `BidEventRepository.findByMallAndStatus`,
  `TenantRepository.findByMall`, `EmployeeRepository.findByMallIdAndStoreId`,
  `EmployeeRepository.findByTenant`, `OfferRepository.findByMall`, `StoreRepository.findByTenant`.
- Optional filters: `q` (malls search over city/state/description), `city`, `status`
  (stores/bids), `mallId`, `storeId`, `from`/`to` (attendance dates).
- **Pagination was removed only on the `no-pagination` branch** (demo). The `master`
  branch still has it — see §16-P8. No endpoint contract changes between the two:
  both return arrays to a client that sends no paging params.

---

## 12. Config & profiles

```yaml
# application.yml
server: { port: 8080 }
spring:
  datasource: { url: jdbc:mysql://localhost:3306/mall_db?createDatabaseIfNotExist=true, username: ${DB_USER:root}, password: ${DB_PASS:root} }
  jpa: { hibernate: { ddl-auto: validate }, properties.hibernate.format_sql: true }
  flyway: { enabled: true, locations: classpath:db/migration }
  jackson: { property-naming-strategy: SNAKE_CASE, serialization: { WRITE_DATES_AS_TIMESTAMPS: false } }
app:
  google: { client-id: ${GOOGLE_CLIENT_ID:} }
  jwt: { secret: ${APP_JWT_SECRET:change-me}, expiry-hours: 24 }
  cors: { allowed-origins: ${CORS_ORIGINS:http://localhost:5173} }
```

- `application-dev.yml`: `ddl-auto: none` (Flyway authoritative), `show-sql: true`.
- Secrets via env only; `google.client-id` + `jwt.secret` are required at boot (fail-fast if blank in prod profile).

---

## 13. Seeding (`V2__seed.sql`)

Port `mockData.js` with **INT ids** (mapping documented in seed header, e.g. `m1→1, m2→2, m3→3; s1→1 … s10→10; p1→1 …; t1→1 …; e1→1 …; mm1→1 …; ex1→1; be1→1 …` preserving per-parent groupings for weak entities). Includes:
- 3 malls (+ contact numbers, image_url, description), 10 stores (shop_number as `G-12` strings, listing_media as single URL = mock `listing_media[0]`), 18 products (+image_url), 22 store_products (`to_show` boolean), 4 tenants + 6 store_tenant joins, 9 employees (all with `mall_id`, `store_id` null for mall staff), 3 managers, 1 executive + 3 oversees rows, 3 bid events (`status` set, `final_allocation` true/false), 8 bids (+bidder_name), 6 transactions (+sender/receiver types), 4 offers, 5 leave, 7 payroll, 7 attendance, `User` rows for demo Google accounts (see below). Revenue seed DEFERRED with schema (pending P2).

Demo placeholder logins (work in BOTH modes; in `demo` mode no Google token needed — POST email only):
`customer.demo@gmail.com (customer), tenant.demo@gmail.com (→ t1 Urban Threads), shopmgr.demo@gmail.com (→ e1 Marcus), mallmgr.demo@gmail.com (→ mm1 Daniel), exec.demo@gmail.com (→ ex1 Victoria), employee.demo@gmail.com (→ e2 Sarah)`. Seeded in `V2__seed.sql` with matching `Tenant/Employee/Manager/Executive` emails so role derivation resolves without extra steps. In final Google mode the same addresses work once they are real Google accounts; no code change needed.

---

## 14. Frontend integration notes (read before coding phase)

- **BREAK-INT:** backend returns INT ids (`1`) where frozen frontend expects strings (`'m1'`). Impact: `===`/`includes` joins (`tenant.store_ids.includes(store.store_id)`), hardcoded `'s1'` in `TenantDashboard.jsx:26`, fallback `'m1'` in `MallManagerDashboard.jsx:20`, route interpolation `/malls/${id}`. **No backend workaround per D-IDS** — integration phase MUST update frontend to treat ids as opaque numbers (or strings of numbers). Backend guarantees ids are stable and unique; nothing else.
- **listing_media:** backend returns a plain string (single URL). Frozen frontend does `listing_media[0]` (array) — change to direct string use at integration.
- **Dates:** `YYYY-MM-DD`, datetimes ISO-8601, times `HH:mm` — matches current parsing, no change.
- **Auth switch:** frontend `AuthContext` + `AuthPage` must be replaced with Google Identity Services button + `POST /api/auth/google`; `getAuthHeaders()` Bearer uses app JWT. Role strings stay lowercase (`shop_manager` inferred).
- **Lists:** every list endpoint returns a plain array ordered in SQL — exactly what the frozen frontend expects, no envelope to unwrap.
- **Revenue:** endpoints + UI both deferred together (pending P2). No `amount/month` in MVP.

---

## 15. Doubts & open questions (also answered inline where decided)

> User asked to keep doubts here AND in this file.

- **[D1-INT — DECIDED but breaking]:** "What do you mean frontend uses strings — does it modify ids?" It does not mutate ids; it uses them as join keys + equality + URLs. Type matters because `"1" !== 1` and `"/malls/m1" ≠ "/malls/1"`. With D-IDS=INT, integration WILL require frontend id handling changes. Confirm you accept that deferred break (or else we would need a string-alias adapter, which you rejected).
- **[D2-MEDIA — DECIDED v2.1]:** single URL string per store (listing image shown during bidding). No delimiter, no array. Frontend `[0]` indexing breaks at integration by design (one-line fix).
- **[D3-FINAL — DECIDED with loss]:** Keeping `BOOLEAN` loses the allocation note string. Workaround derives display note from winning bid. Confirm acceptable for demo, and that no legal reliance will be placed on `final_allocation` until the `VARCHAR(500)` migration.
- **[D4-REVENUE — DECIDED v2.1]:** revenue endpoints + schema change fully deferred (pending P2). Not in MVP.
- **[D5-DELETE-RULE — DECIDED v2.1]:** `RESTRICT` on `Employee.mall_id`, `Mall_Manager.mall_id`, `Store.mall_id`. Mall cannot be deleted while referenced.
- **[D6-BID-ID — MITIGATED]:** App-level `bid_id` uniqueness via service sequence + future `UNIQUE(bid_id)` index. Confirm no external system inserts bids bypassing the API (which would break the sequence).
- **[D7-GOOGLE-ROLE — NEEDS CONFIRM]:** First Google login auto-creates `customer` User. Tenant/employee/manager/executive access requires their email to PRE-EXIST in the respective table (seeded or created by an authorized role). So onboarding flow is: admin creates tenant/employee/manager row with the person's Gmail → person clicks Google login → gets correct role. Confirm this flow matches your ops. Also confirm the 6 placeholder demo Gmail addresses in §13.
- **[D8-OFFERS — DECIDED v2.1]:** full CRUD on `/stores/{id}/offers` (GET/POST/PUT/DELETE) + `GET /malls/{id}/offers`.
- **[D9-SHOP_NUMBER — DECIDED]:** Changed to `VARCHAR(20)` (not an ID). Confirm no numeric sorting/arithmetic depends on it being INT.
- **[D10-EXEC-SEED — NEEDS EMAIL LIST]:** No executive creation endpoint. Provide the real Gmail(s) for the seeded executive(s), or confirm placeholders are fine for now.

---

## 16. Pending / deferred (not in MVP build)

| ID | Item | Trigger to implement |
|---|---|---|
| P1 | Analytics endpoint + service | New requirement + `Financial_Transaction.receiver_mall_id` normalization decision |
| P2 | Revenue endpoints + `Revenue_Information ADD (month, amount, submitted_date)` + seed | Deferred per v2.1 answer — not in MVP |
| P3 | `Bid_Event.final_allocation BOOLEAN → VARCHAR(500)` (+ keep `status`) | User approval; blocks legal allocation notes |
| P4 | `Bid ADD UNIQUE(bid_id)` → eventual surrogate PK | After P3, low priority |
| P5 | `Financial_Transaction.receiver_mall_id FK` normalization | If analytics revived |
| P6 | Frontend migration (INT ids, Google button, paged lists, listing_media string, revenue) | Separate frontend phase (currently forbidden) |
| P7 | Prod CORS origins, `GOOGLE_CLIENT_ID`, `APP_JWT_SECRET` rotation, HTTPS | Deploy phase |

---

## 17. Implementation phases (after this design is approved)

**2-day demo slice first (profile `demo`, auth disabled):** scaffold + health → malls/stores/products + seed → tenants/employees/managers/executives + stub auth → bid events/bids (read + place + finalize) + offers/transactions read. Skip: Google verifier wiring (stub only), revenue (deferred), analytics, strict role tests. Demo run: `SPRING_PROFILES_ACTIVE=demo mvn spring-boot:run`, login with any §13 placeholder email.

1. **Scaffold:** `pom.xml`, `application.yml`, `V1__deltas.sql` (§6), `GlobalExceptionHandler`, `SecurityConfig` (demo-permit + real guard behind `!demo`), `GET /api/health` → verify boot + Flyway validate.
2. **Core:** `Mall/Store/Product/StoreProduct` entities+repos+services+controllers + `V2__seed.sql` (malls/stores/products) → `curl` paged + unpaged lists.
3. **People:** `Tenant/Employee/Manager/Executive/Oversees/User` + Google exchange + role derivation → verify each demo Gmail gets correct role.
4. **Transactions:** `Bid/BidEvent` (locking test), `Attendance/Leave/Payroll`, `Offers` (full CRUD), `Transactions` → concurrency + validation tests. Revenue excluded (pending P2).
5. **Parity check:** script comparing `mockData.js` (mapped through INT translation table) vs `GET /api/*` responses; OpenAPI published.

**Success criteria:** boot clean, Flyway `validate` passes against unmodified `mall_schema.sql` + `V1` deltas, all §9 endpoints return `snake_case` JSON matching DTOs, `POST /bid-events/{id}/bids` rejects low bids under concurrent load, Google exchange returns correct role for each seeded email, paged + unpaged list shapes both verified.

---

## 18. Class/method sketch (hot paths only)

- `AuthController.exchange(GoogleLoginRequest) → AuthResponse` ; `me() → UserResponse`.
- `AuthService.exchange(idToken): AuthResponse` — verify → derive role → issue app JWT.
- `GoogleTokenVerifier.verify(idToken): GooglePrincipal` — throws `BadRequestException` on invalid aud/exp/signature.
- `AppTokenProvider.issue(email, role, profileId, profileType): String` ; `parse(token): AppClaims`.
- `BidService.placeBid(eventId, PlaceBidRequest): BidResponse` — `@Transactional`, `bidEventRepo.findByIdForUpdate(eventId)`, validate, flip, insert.
- `BidEventService.finalize(eventId, FinalizeRequest): BidEventResponse`.
- `StoreService.toStoreResponse(Store): StoreResponse` — direct single-URL mapping, no split.
- `TenantService.create(TenantCreateRequest): TenantResponse` — creates tenant + joins + flips store statuses.
- `AttendanceService.checkIn(empId)/checkOut(empId): AttendanceResponse`.
- `GlobalExceptionHandler`: `ResourceNotFound→404, BadRequest→400, Conflict→409, Validation→422, AccessDenied→403, GoogleVerify→401`.

---

*End of DESIGN v2.1 — decisions D2/D4/D5/D8/store-mall locked. Remaining: D6 (no bypass inserts?), D7 (onboarding flow + 6 demo Gmails), D10 (real executive Gmail(s)), plus GOOGLE_CLIENT_ID + prod CORS at build time.*
