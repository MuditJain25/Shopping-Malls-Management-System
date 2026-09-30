Shopping Malls Management — Spring Boot Backend — Design Plan (v1.0)
Scope: design only, no frontend modifications (frontend/*:1 untouched), no code yet. All claims traced to frontend/src/lib/api.js:1, frontend/src/lib/mockData.js:1, database/mall_schema.sql:1.
1) Assumptions Made Explicit
#	Assumption
A1	frontend/src/lib/api.js:16 comment block is the intended contract; actual page code that imports mockData directly (CustomerDashboard.jsx:12, LandingPage.jsx:9 etc.) is tech debt you want replaced by API calls later
A2	MySQL is required (mall_schema.sql:5 = mall_db)
A3	6 roles from AuthPage.jsx:7 + App.jsx:13: customer, tenant, shop_manager, mall_manager, executive, employee — customer never persists beyond User; employee/shop_manager maps to Employee, tenant to Tenant, mall_manager to Mall_Manager, executive to Enterprise_Executive
A4	Frontend expects snake_case JSON (mall_id, store_id etc. throughout mockData)
A5	Auth will be stateless JWT (matches api.js:60 Authorization: Bearer) not server sessions
Pushback: Given AGENTS.md:1 Simplicity First, YAGNI says don't build Discount Offers, EE_Oversees_Mall admin UI, or file upload until requested — yet they exist in schema. Proposal excludes them from MVP unless you confirm.
2) Domain Trace — Real Flow End-to-End
Traced every caller:
- LandingPage.jsx:39 → search/filter malls locally → needs GET /api/malls + query param ?q=.
- BidPage.jsx:34 → bid validation minNextBid = highest + increment client-side; server must re-validate atomically.
- TenantDashboardComponents/ProductsView.jsx:18 toggles to_show (star) → PUT /stores/{id}/products/{pid}.
- MallManagerDashboardComponents/BiddingView.jsx:16 finalizes → PUT /bid-events/{id}/finalize sets status='finalized' and final_allocation string.
- EmployeeDashboardComponents/AttendanceView.jsx:46 check-in/out creates/updates today's Attendance row keyed by (e_id, date).
- ExecutiveDashboardComponents/CreateManagerView.jsx:11 creates manager → POST /api/managers.
Finding: api.js:16 lists ~33 endpoints but misses: POST /api/products, POST /api/tenants, DELETE /api/employees/{id}, PATCH /api/bid-events status. Current mock mutates arrays directly (TenantsView.jsx:16). Contract gaps below.
3) Schema Critique — database/mall_schema.sql Is Not Production-Ready
Must-fix before coding (shared function fix > per-caller patch):
 1. PK type mismatch — SQL uses INT PKs, frontend uses m1, t1, e1 strings (mockData.js:58). Choice: BIGINT AUTO_INCREMENT + DTO maps to string for backward compat or switch to VARCHAR(20) with UUID/prefixed ID. Recommended: BIGINT internally, expose String via DTO mall_id alias to avoid breaking frontend. Your call (Q1).
 2. Auth gap — User:207 has no password, role, profile_id. Need app_user table (or extend User) with password_hash, role ENUM, profile_id VARCHAR, profile_type ENUM. Otherwise POST /api/auth/login api.js:17 impossible.
 3. Mall missing columns — image_url, description present in malls:68 but absent in Mall:11. Add.
 4. Store.listing_media — VARCHAR(500) single string cannot hold listing_media: [url,url] (mockData.js:107). Needs store_media child table or JSON column. Propose store_media table (normalized).
 5. to_show — VARCHAR(255) should be BOOLEAN (storeProducts:138).
 6. Revenue_Information — missing month, amount, submitted_date (revenueInfo:230); currently only description.
 7. Financial_Transaction — missing sender_type, receiver_type (transactions:219); plus sender/receiver are denormalized strings vs FKs. Keep as VARCHAR for MVP but document.
 8. Employee — missing mall_id (employees:174 has mall_id: 'm1' for direct mall staff e7). Add nullable FK to Mall.
 9. Mall_Manager.mall_id comment says 1:N but real intent is many managers per mall; OK, but needs UNIQUE? keep nullable.
10. Bid_Event — final_allocation BOOLEAN vs mock String|null + status VARCHAR (bidEvents:200). Replace with final_allocation VARCHAR(500) + status ENUM('open','finalized','cancelled').
11. Bid PK — (user_id, bid_id) composite is pathological; bid_id alone should be PK. store_id, event_id composite FK is redundant — singleton event_id FK suffices if Bid_Event uses surrogate PK. Proposed fix: Bid: bid_id BIGINT PK, event_id FK, user_id FK, bidder_name VARCHAR.
12. Product.imageUrl missing; Product only has price, category. Add image_url.
Revised DDL will live in backend/src/main/resources/db/migration/V1__init.sql (Flyway). Option to keep legacy mall_schema.sql as reference and not execute.
4) Tech Stack — Ladder Check
1. Already exists? Reuse mall_schema.sql — partially, but fix.
2. Stdlib/platform? Spring Boot 3.3, Java 21, Spring Web, Data JPA, Validation, Security.
3. Installed dep? frontend/package.json:12 uses Vite+React — no backend yet.
4. One-liner? Use Spring Initializr.
Proposed:
Java 21 | Spring Boot 3.3.x | Maven | MySQL 8 | Spring Security + JWT (jjwt) | Spring Data JPA + Hibernate | Flyway | Lombok + MapStruct | springdoc-openapi | Jackson SnakeCase
Alt: Swap JWT for opaque token if you want DB session; JWT is fewer DB hits.
5) Project Structure — Minimal Files, Boring Wins
backend/
  pom.xml
  src/main/java/com/mallhub/
    MallHubApplication.java
    config/
      SecurityConfig.java          // filter chain, permit /api/auth/**, /api/malls GET
      JwtConfig.java / JwtAuthFilter.java / JwtTokenProvider.java
      CorsConfig.java              // allow VITE origin
      WebConfig.java               // snake_case Jackson
      OpenApiConfig.java
    controller/
      AuthController.java
      MallController.java
      StoreController.java
      ProductController.java       // includes PUT toggle
      BidEventController.java
      BidController.java
      TenantController.java
      EmployeeController.java      // + attendance/leave/payroll sub-resources
      MallManagerController.java
      ExecutiveController.java
      AnalyticsController.java
    dto/
      request/  LoginRequest, SignupRequest, CreateManagerRequest, PlaceBidRequest, FinalizeRequest, RevenueRequest, LeaveRequestDto, EmployeeCreateDto, ProductCreateDto, TenantCreateDto
      response/ UserResponse, MallResponse, StoreResponse, ProductResponse, BidEventResponse, BidResponse, TenantResponse, EmployeeResponse, ManagerResponse, ExecutiveResponse, RevenueResponse, AttendanceResponse, AnalyticsResponse, ApiResponse<T>, PageResponse<T>
    entity/
      Mall, MallContactNumber, MallManager, EnterpriseExecutive, ExecutiveOverseesMall,
      Store, StoreMedia, Product, StoreProduct (with @EmbeddedId StoreProductId),
      Tenant, StoreTenant, RevenueInformation, DiscountOffer,
      Employee, LeaveRequest, PayrollRecord, Attendance (with @EmbeddedId AttendanceId),
      AppUser, BidEvent, Bid, FinancialTransaction
    repository/
      (one JpaRepository per aggregate root; 13 total)
    service/
      AuthService, MallService, StoreService, ProductService, BidEventService, BidService,
      TenantService, EmployeeService, ManagerService, ExecutiveService, AnalyticsService
      impl/ (single impl per interface — no over-abstraction)
    security/
      UserDetailsServiceImpl, UserPrincipal
    exception/
      GlobalExceptionHandler, ResourceNotFoundException, BadRequestException, ConflictException
    mapper/
      MallMapper, StoreMapper, etc. (MapStruct)
    util/  Slug? not needed
  src/main/resources/
    application.yml               // dev/prod profiles, datasource, jwt.secret
    application-dev.yml
    db/migration/V1__init.sql    // corrected schema
    db/migration/V2__seed.sql    // ports mockData.js data
  src/test/java/com/mallhub/
    (one @SpringBootTest per controller + service unit)
Rule: One controller per aggregate, one service per controller. No *Util for single-use code.
6) Entity & DTO Catalog (excerpt)
- AppUser: id BIGINT PK, email UNIQUE, passwordHash, role ENUM, profileId VARCHAR, profileType ENUM, firstName, lastName — links demoUsers profileId to t1/e1/mm1 etc. Signup creates transient customer user with profileId = id.
- Mall: id BIGINT PK, areaSqft, openingDate, street, city, state, pincode, latitude, longitude, imageUrl, description, contactNumbers @OneToMany
- StoreMedia: id BIGINT PK, store @ManyToOne, mediaUrl
- StoreProductId: @Embeddable storeId+productId
- AttendanceId: @Embeddable employeeId+date (matches SQL PK employee_id, date).
- DTOs mirror mockData shape with snake_case via @JsonProperty / global PropertyNamingStrategy.SNAKE_CASE.
7) API Contract — Full Table (aligns with api.js:16 + gaps fixed)
Base: /api (matches VITE_API_BASE_URL comment api.js:58).
#	Method	Path	Request
 	Auth	 	 
1	POST	/auth/login	{email,password}
2	POST	/auth/signup	{firstName,lastName,email,password,role}
3	POST	/auth/logout	—
 	Malls	 	 
4	GET	/malls	?q=&city=
5	GET	/malls/{id}	—
6	GET	/malls/{id}/stores	—
7	GET	/malls/{id}/products/top	—
8	GET	/malls/{id}/managers	—
9	GET	/malls/{id}/employees	—
10	GET	/analytics/mall/{id}	—
11	GET	/stores/available	?mallId=
 	Stores & Products	 	 
12	GET	/stores/{id}	—
13	GET	/stores/{id}/products	—
14	PUT	/stores/{id}/products/{pid}	{to_show:boolean}
15	POST	/stores/{id}/products	{product_name,category,price,imageUrl}
16	GET	/stores/{id}/employees	—
 	Bid Events / Bids	 	 
17	GET	/bid-events	?mallId=&status=
18	GET	/malls/{id}/bid-events	—
19	GET	/bid-events/{id}	—
20	GET	/bid-events/{id}/bids	—
21	POST	/bid-events/{id}/bids	{userId,bidAmount,bidderName}
22	PUT	/bid-events/{id}/finalize	{final_allocation:String}
 	Tenants	 	 
23	GET	/tenants	—
24	GET	/tenants/{id}	—
25	POST	/tenants	{business_name,business_type,email,phone_number,store_ids}
26	DELETE	/tenants/{id}	—
27	GET	/tenants/{id}/stores	—
28	GET	/tenants/{id}/employees	(?storeId=)
29	POST	/tenants/{id}/employees	EmployeeCreateDto
30	DELETE	/employees/{id}	—
31	GET	/tenants/{id}/revenue	—
32	POST	/tenants/{id}/revenue	{description,month,amount}
33	GET	/tenants/{id}/transactions	—
 	Managers / Executives	 	 
34	GET	/managers	—
35	GET	/managers/{id}	—
36	POST	/managers	{first_name,last_name,email,phone_number,mall_id}
37	GET	/executives/{id}	—
38	GET	/executives/{id}/malls	—
 	Employee Self-Service	 	 
39	GET	/employees/{id}	—
40	GET	/employees/{id}/leave-requests	—
41	POST	/employees/{id}/leave-requests	{start_date,end_date,reason}
42	PATCH	/employees/{id}/leave-requests/{rid}	`{status:approved
43	GET	/employees/{id}/payroll	—
44	GET	/employees/{id}/attendance	?from=&to=
45	POST	/employees/{id}/attendance/check-in	—
46	POST	/employees/{id}/attendance/check-out	—
 	Misc	 	 
47	GET	/products/{id}	—
48	GET	/health	—
Uniform error shape: {timestamp, status, error, message, path} via GlobalExceptionHandler. Pagination: add PageResponse with page,size,total but keep simple list for MVP (frontend not paginated) — Q4 if you want paging.
8) Security Design
- SecurityConfig — csrf disabled, sessionCreationPolicy.STATELESS, authorizeHttpRequests: permit POST /api/auth/**, GET /api/malls/**, GET /api/stores/**, GET /api/bid-events/**, GET /health; everything else authenticated; role checks via @PreAuthorize("hasRole('EXECUTIVE')") or hasAnyRole.
- JwtTokenProvider — HS256, secret via app.jwt.secret (env), expiry 24h, claims sub=email, role, profileId. JwtAuthFilter extends OncePerRequestFilter populates SecurityContext.
- Password — BCryptPasswordEncoder. Seed demo users with demo123 hash.
- UserDetailsServiceImpl loads AppUser by email.
- CORS — CorsConfig allows http://localhost:5173 (Vite) allowCredentials false with Authorization header.
Tradeoff: JWT blacklist for logout requires DB/Redis; MVP just client discards token (stateless). Flag upgrade with ponytail: comment if you later need revocation.
9) Service Business Rules (root causes, not symptoms)
- Bids: race where two POST /bids at same minNextBid. Fix once in BidService.placeBid() with @Transactional + SELECT ... FOR UPDATE on BidEvent row + @Version optimistic fallback; validate event.status==open, bidAmount >= currentHighest+increment (bidEvents:200 min fields). Compute round_number = count+1, set previous winning to outbid.
- Finalize: idempotent; if already finalized return 409; freeing Store not required but TenantsView shows occupation side-effect — optionally do.
- Attendance: (employee_id, date) PK collision handled via findByEmployeeAndDate then save; check-in without row creates, second check-in updates time (matches api.js:342 leniency). Check-out without check-in → 404.
- Tenant↔Store: Store_Rented_By_Tenant M:N. Creating tenant with store_id sets Store.status='occupied' and inserts join row (from TenantsView.jsx:26).
- Analytics: totalRevenue = SUM(FinancialTransaction.amount WHERE receiver = mallName) — mallName derived from city mapping (AnalyticsView.jsx:6) is brittle; propose store-mall join instead (Q5).
10) Cross-Cutting
- Validation: jakarta.validation on every *Request DTO (@NotBlank @Email @Min).
- Jackson: application.yml property-naming-strategy: SNAKE_CASE + WRITE_DATES_AS_TIMESTAMPS: false.
- Exceptions: ResourceNotFoundException → 404, BadRequestException → 400, ConflictException → 409, MethodArgumentNotValidException → 422.
- Logging: logback-spring.xml, request ID filter.
- OpenAPI: springdoc at /v3/api-docs + Swagger UI.
11) Data Seeding
V2__seed.sql will port mockData.js:1 verbatim (malls m1-m3, stores s1-s10, products p1-p18, storeProducts 22 rows, tenants t1-t4 + joins, employees e1-e9, managers mm1-mm3, executive ex1 + oversees, bidEvents be1-be3, bids b1-b8, transactions ft1-ft6, revenueInfo ri1-ri6, leaveRequests lr1-lr5, payroll, attendance, app_users for demo). Image URLs stored as provided.
12) Frontend Integration Notes
- Must keep VITE_API_BASE_URL=http://localhost:8080/api and uncomment apiFetch blocks (api.js:58). Frontend currently mixes mockData direct imports + api.js; we will not touch frontend but will guarantee every api*.js function has a 1:1 server endpoint with matching JSON shape so switch is mechanical.
- All dates YYYY-MM-DD, datetimes ISO-8601 (bid_date), times HH:mm (attendance) — matches existing frontend parsing.
13) Implementation Phases (after approval)
1. Scaffold → pom.xml, application.yml, V1__init.sql, GlobalExceptionHandler, SecurityConfig stub → verify mvn spring-boot:run boots + /api/health 200.
2. Auth+Malls+Stores → AppUser, Mall, Store, StoreMedia entities/repos/services/controllers → seed + manual curl login.
3. Tenants/Employees/Products → remaining aggregates.
4. Bids/Attendance/Analytics → transactional paths + edge cases.
5. Seed parity test → script comparing mockData JSON vs GET /api/* responses.
14) Open Questions — Need Your Decision Before Coding
Q1 — ID strategy: Keep VARCHAR ids (m1, s1…) for 100% frontend compatibility, or migrate to BIGINT AUTO_INCREMENT with DTO string alias? Former is simplest (no mapping), latter is more DB-idiomatic.
Q2 — Signup roles: AuthPage.jsx:146 allows customer, tenant, mall_manager, executive, employee signup. Should shop_manager be selectable or inferred from employee.current_designation? Should executive creation be open signup or restricted?
Q3 — Missing endpoints: Confirm adding POST /stores/{id}/products, POST /tenants, DELETE /tenants/{id}, DELETE /employees/{id}, PATCH /leave-requests/{id} for pages that currently mutate arrays in place (TenantsView.jsx, EmployeesView.jsx).
Q4 — Pagination & filtering: Frontend today loads all rows. Want ?page=&size=&sort= on list endpoints (/malls, /tenants, /employees, /bid-events) or keep unpaged MVP?
Q5 — Analytics receiver: Current mock matches transaction.receiver string to city-derived mall name (ExecutiveDashboardComponents/AnalyticsView.jsx:17). Keep string match or normalize to FinancialTransaction.receiver_mall_id FK? FK is correct relationally but breaks seed parity.
Q6 — Schema authority: May I replace database/mall_schema.sql with corrected Flyway migrations, or must the original file remain the source of truth and we only add ALTER migrations?
Q7 — Passwords for seeded tenants/managers: Set all to demo123 hashed, or generate random and expose only via demoUsers?
Q8 — Media storage: Keep imageUrl/listing_media as external URLs (Pexels) as in mock, or add upload endpoint (POST /api/stores/{id}/media multipart)?
Q9 — CORS origin: Dev frontend origin is http://localhost:5173; prod? Confirm.
Q10 — Timeline: Is coding to start immediately after your answers, or do you want the design frozen as backend/docs/DESIGN.md for review first?