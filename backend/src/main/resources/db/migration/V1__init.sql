-- V1: full schema = database/mall_schema.sql + approved deltas (DESIGN §6).
-- mall_schema.sql itself is untouched; this file is the migration authority.
-- Conventions: INT AUTO_INCREMENT singleton PKs; weak-entity legs app-assigned (MAX+1, manual ids >= 90000).

CREATE TABLE IF NOT EXISTS Mall (
    mall_id         INT             PRIMARY KEY AUTO_INCREMENT,
    mall_area_sqft  DOUBLE,
    opening_date    DATE,
    street          VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(100),
    pincode         VARCHAR(20),
    latitude        FLOAT,
    longitude       FLOAT,
    image_url       VARCHAR(1000),
    description     TEXT
);

CREATE TABLE IF NOT EXISTS Mall_Contact_Number (
    mall_id         INT             NOT NULL,
    contact_number  VARCHAR(20)     NOT NULL,
    PRIMARY KEY (mall_id, contact_number),
    FOREIGN KEY (mall_id) REFERENCES Mall(mall_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Mall_Manager (
    manager_id      INT             PRIMARY KEY AUTO_INCREMENT,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(255),
    date_joined     DATE,
    phone_number    VARCHAR(20),
    mall_id         INT             NOT NULL,
    FOREIGN KEY (mall_id) REFERENCES Mall(mall_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Enterprise_Executive (
    executive_id    INT             PRIMARY KEY AUTO_INCREMENT,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(255),
    date_joined     DATE,
    phone_number    VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS EE_Oversees_Mall (
    executive_id    INT             NOT NULL,
    mall_id         INT             NOT NULL,
    PRIMARY KEY (executive_id, mall_id),
    FOREIGN KEY (executive_id) REFERENCES Enterprise_Executive(executive_id) ON DELETE CASCADE,
    FOREIGN KEY (mall_id) REFERENCES Mall(mall_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Store (
    store_id        INT             PRIMARY KEY AUTO_INCREMENT,
    shop_number     VARCHAR(20),
    floor           INT,
    area_sqft       DOUBLE,
    store_name      VARCHAR(255),
    status          VARCHAR(50),
    listing_media   VARCHAR(1000),
    mall_id         INT             NOT NULL,
    FOREIGN KEY (mall_id) REFERENCES Mall(mall_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Product (
    product_id      INT             PRIMARY KEY AUTO_INCREMENT,
    product_name    VARCHAR(255)    NOT NULL,
    category        VARCHAR(100),
    price           DECIMAL(10, 2),
    image_url       VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS Store_Sells_Product (
    store_id        INT             NOT NULL,
    product_id      INT             NOT NULL,
    to_show         BOOLEAN         NOT NULL DEFAULT FALSE,
    PRIMARY KEY (store_id, product_id),
    FOREIGN KEY (store_id) REFERENCES Store(store_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Tenant (
    tenant_id       INT             PRIMARY KEY AUTO_INCREMENT,
    business_name   VARCHAR(255)    NOT NULL,
    business_type   VARCHAR(100),
    email           VARCHAR(255),
    date_registered DATE,
    phone_number    VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS Store_Rented_By_Tenant (
    store_id        INT             NOT NULL,
    tenant_id       INT             NOT NULL,
    PRIMARY KEY (store_id, tenant_id),
    FOREIGN KEY (store_id) REFERENCES Store(store_id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES Tenant(tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Revenue_Information (
    tenant_id       INT             NOT NULL,
    information_id  INT             NOT NULL,
    description     TEXT,
    PRIMARY KEY (tenant_id, information_id),
    FOREIGN KEY (tenant_id) REFERENCES Tenant(tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Discount_Offer (
    store_id        INT             NOT NULL,
    offer_id        INT             NOT NULL,
    start_date      DATE,
    end_date        DATE,
    description     TEXT,
    PRIMARY KEY (store_id, offer_id),
    FOREIGN KEY (store_id) REFERENCES Store(store_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Employee (
    employee_id         INT             PRIMARY KEY AUTO_INCREMENT,
    first_name          VARCHAR(100)    NOT NULL,
    last_name           VARCHAR(100)    NOT NULL,
    email               VARCHAR(255),
    date_of_joining     DATE,
    base_salary         DECIMAL(10, 2),
    current_designation VARCHAR(100),
    phone_number        VARCHAR(20),
    store_id            INT,
    mall_id             INT             NOT NULL,
    FOREIGN KEY (store_id) REFERENCES Store(store_id) ON DELETE SET NULL,
    FOREIGN KEY (mall_id) REFERENCES Mall(mall_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Leave_Request (
    employee_id     INT             NOT NULL,
    request_id      INT             NOT NULL,
    start_date      DATE,
    end_date        DATE,
    status          VARCHAR(50),
    reason          TEXT,
    PRIMARY KEY (employee_id, request_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Payroll_Record (
    employee_id     INT             NOT NULL,
    record_id       INT             NOT NULL,
    amount          DECIMAL(10, 2),
    record_type     VARCHAR(100),
    issue_date      DATE,
    PRIMARY KEY (employee_id, record_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Attendance (
    employee_id     INT             NOT NULL,
    date            DATE            NOT NULL,
    check_in_time   TIME,
    check_out_time  TIME,
    PRIMARY KEY (employee_id, date),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `User` (
    user_id         INT             PRIMARY KEY AUTO_INCREMENT,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(255),
    phone_number    VARCHAR(20),
    google_sub      VARCHAR(255)    NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Bid_Event (
    store_id                INT             NOT NULL,
    event_id                INT             NOT NULL,
    start_date              DATE,
    end_date                DATE,
    final_allocation        BOOLEAN,
    minimum_bid_amount      DECIMAL(10, 2),
    minimum_bid_increment   DECIMAL(10, 2),
    status                  VARCHAR(20)     NOT NULL DEFAULT 'open',
    PRIMARY KEY (store_id, event_id),
    FOREIGN KEY (store_id) REFERENCES Store(store_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Bid (
    user_id         INT             NOT NULL,
    bid_id          INT             NOT NULL,
    event_id        INT,
    store_id        INT,
    bid_amount      DECIMAL(10, 2),
    round_number    INT,
    bid_date        DATETIME,
    status          VARCHAR(50),
    bidder_name     VARCHAR(255),
    PRIMARY KEY (user_id, bid_id),
    FOREIGN KEY (user_id) REFERENCES `User`(user_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id, event_id) REFERENCES Bid_Event(store_id, event_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Financial_Transaction (
    transaction_id      INT             PRIMARY KEY AUTO_INCREMENT,
    amount              DECIMAL(10, 2),
    sender              VARCHAR(255),
    receiver            VARCHAR(255),
    sender_type         VARCHAR(50),
    receiver_type       VARCHAR(50),
    transaction_date    DATE,
    remarks             TEXT
);

CREATE UNIQUE INDEX uq_manager_email ON Mall_Manager(email);
CREATE UNIQUE INDEX uq_tenant_email ON Tenant(email);
CREATE UNIQUE INDEX uq_employee_email ON Employee(email);
CREATE UNIQUE INDEX uq_executive_email ON Enterprise_Executive(email);
CREATE UNIQUE INDEX uq_user_email ON `User`(email);
