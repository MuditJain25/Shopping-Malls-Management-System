-- ============================================================
-- Mall Management System -- MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS mall_db;
USE mall_db;

-- ------------------------------------------------------------
-- Mall
-- ------------------------------------------------------------
CREATE TABLE Mall (
    mall_id         INT             PRIMARY KEY,
    mall_area_sqft  FLOAT,
    opening_date    DATE,
    street          VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(100),
    pincode         VARCHAR(20),
    latitude        FLOAT,
    longitude       FLOAT
);

-- Multivalued attribute of Mall
CREATE TABLE Mall_Contact_Number (
    mall_id         INT             NOT NULL,
    contact_number  VARCHAR(20)     NOT NULL,
    PRIMARY KEY (mall_id, contact_number),
    FOREIGN KEY (mall_id) REFERENCES Mall(mall_id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Mall_Manager  (1 Mall : N Managers)
-- ------------------------------------------------------------
CREATE TABLE Mall_Manager (
    manager_id      INT             PRIMARY KEY,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(255),
    date_joined     DATE,
    phone_number    VARCHAR(20),
    mall_id         INT,                          -- FK to Mall (N side)
    FOREIGN KEY (mall_id) REFERENCES Mall(mall_id)
        ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Enterprise_Executive  (M:N with Mall via Oversees)
-- ------------------------------------------------------------
CREATE TABLE Enterprise_Executive (
    executive_id    INT             PRIMARY KEY,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(255),
    date_joined     DATE,
    phone_number    VARCHAR(20)
);

CREATE TABLE EE_Oversees_Mall (
    executive_id    INT             NOT NULL,
    mall_id         INT             NOT NULL,
    PRIMARY KEY (executive_id, mall_id),
    FOREIGN KEY (executive_id) REFERENCES Enterprise_Executive(executive_id)
        ON DELETE CASCADE,
    FOREIGN KEY (mall_id)       REFERENCES Mall(mall_id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Store  (N side of Mall Has Store -- 1:N)
-- ------------------------------------------------------------
CREATE TABLE Store (
    store_id        INT             PRIMARY KEY,
    shop_number     INT,
    floor           INT,
    area_sqft       FLOAT,
    store_name      VARCHAR(255),
    status          VARCHAR(50),
    listing_media   VARCHAR(500),
    mall_id         INT,                          -- FK to Mall
    FOREIGN KEY (mall_id) REFERENCES Mall(mall_id)
        ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Product  (M:N with Store via Sells)
-- ------------------------------------------------------------
CREATE TABLE Product (
    product_id      INT             PRIMARY KEY,
    product_name    VARCHAR(255)    NOT NULL,
    category        VARCHAR(100),
    price           DECIMAL(10, 2)
);

CREATE TABLE Store_Sells_Product (
    store_id        INT             NOT NULL,
    product_id      INT             NOT NULL,
    to_show         VARCHAR(255),                 -- relationship attribute
    PRIMARY KEY (store_id, product_id),
    FOREIGN KEY (store_id)   REFERENCES Store(store_id)
        ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Tenant  (M:N with Store via Rented_By)
-- ------------------------------------------------------------
CREATE TABLE Tenant (
    tenant_id       INT             PRIMARY KEY,
    business_name   VARCHAR(255)    NOT NULL,
    business_type   VARCHAR(100),
    email           VARCHAR(255),
    date_registered DATE,
    phone_number    VARCHAR(20)
);

CREATE TABLE Store_Rented_By_Tenant (
    store_id        INT             NOT NULL,
    tenant_id       INT             NOT NULL,
    PRIMARY KEY (store_id, tenant_id),
    FOREIGN KEY (store_id)  REFERENCES Store(store_id)
        ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES Tenant(tenant_id)
        ON DELETE CASCADE
);

-- Weak entity of Tenant (Shared relationship)
CREATE TABLE Revenue_Information (
    tenant_id       INT             NOT NULL,
    information_id  INT             NOT NULL,
    description     TEXT,
    PRIMARY KEY (tenant_id, information_id),
    FOREIGN KEY (tenant_id) REFERENCES Tenant(tenant_id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Discount_Offer  (weak entity of Store via Offer -- 1:N)
-- ------------------------------------------------------------
CREATE TABLE Discount_Offer (
    store_id        INT             NOT NULL,
    offer_id        INT             NOT NULL,
    start_date      DATE,
    end_date        DATE,
    description     TEXT,
    PRIMARY KEY (store_id, offer_id),
    FOREIGN KEY (store_id) REFERENCES Store(store_id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Employee  (N side of Store Employs -- 1:N)
-- ------------------------------------------------------------
CREATE TABLE Employee (
    employee_id         INT             PRIMARY KEY,
    first_name          VARCHAR(100)    NOT NULL,
    last_name           VARCHAR(100)    NOT NULL,
    email               VARCHAR(255),
    date_of_joining     DATE,
    base_salary         DECIMAL(10, 2),
    current_designation VARCHAR(100),
    phone_number        VARCHAR(20),
    store_id            INT,                      -- FK to Store
    FOREIGN KEY (store_id) REFERENCES Store(store_id)
        ON DELETE SET NULL
);

-- Weak entity of Employee (Applies_For)
CREATE TABLE Leave_Request (
    employee_id     INT             NOT NULL,
    request_id      INT             NOT NULL,
    start_date      DATE,
    end_date        DATE,
    status          VARCHAR(50),
    reason          TEXT,
    PRIMARY KEY (employee_id, request_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
        ON DELETE CASCADE
);

-- Weak entity of Employee (Salary)
CREATE TABLE Payroll_Record (
    employee_id     INT             NOT NULL,
    record_id       INT             NOT NULL,
    amount          DECIMAL(10, 2),
    record_type     VARCHAR(100),
    issue_date      DATE,
    PRIMARY KEY (employee_id, record_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
        ON DELETE CASCADE
);

-- Weak entity of Employee (Tracks)
CREATE TABLE Attendance (
    employee_id     INT             NOT NULL,
    date            DATE            NOT NULL,
    check_in_time   TIME,
    check_out_time  TIME,
    PRIMARY KEY (employee_id, date),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- User  (1:N with Bid via Participates -- captured in Bid)
-- ------------------------------------------------------------
CREATE TABLE User (
    user_id         INT             PRIMARY KEY,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(255),
    phone_number    VARCHAR(20)
);

-- Weak entity of Store (For_Sale)
CREATE TABLE Bid_Event (
    store_id                INT             NOT NULL,
    event_id                INT             NOT NULL,
    start_date              DATE,
    end_date                DATE,
    final_allocation        BOOLEAN,
    minimum_bid_amount      DECIMAL(10, 2),
    minimum_bid_increment   DECIMAL(10, 2),
    PRIMARY KEY (store_id, event_id),
    FOREIGN KEY (store_id) REFERENCES Store(store_id)
        ON DELETE CASCADE
);

-- Weak entity of User (Participates)
-- event_id here is a non-PK FK pointing to Bid_Event
CREATE TABLE Bid (
    user_id         INT             NOT NULL,
    bid_id          INT             NOT NULL,
    event_id        INT,                          -- non-PK FK to Bid_Event
    store_id        INT,                          -- needed alongside event_id for composite FK
    bid_amount      DECIMAL(10, 2),
    round_number    INT,
    bid_date        DATE,
    status          VARCHAR(50),
    PRIMARY KEY (user_id, bid_id),
    FOREIGN KEY (user_id)              REFERENCES User(user_id)
        ON DELETE CASCADE,
    FOREIGN KEY (store_id, event_id)   REFERENCES Bid_Event(store_id, event_id)
        ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Financial_Transaction  (isolated -- no FKs)
-- ------------------------------------------------------------
CREATE TABLE Financial_Transaction (
    transaction_id      INT             PRIMARY KEY,
    amount              DECIMAL(10, 2),
    sender              VARCHAR(255),
    receiver            VARCHAR(255),
    transaction_date    DATE,
    remarks             TEXT
);