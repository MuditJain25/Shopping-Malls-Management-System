-- V2: demo seed ported from frontend/src/lib/mockData.js (string ids mapped m1->1, s1->1, ...).
-- Manual INSERTs bypassing the API must use ids >= 90000 (DESIGN §6-D11).

-- Malls --
INSERT INTO Mall (mall_id, mall_area_sqft, opening_date, street, city, state, pincode, latitude, longitude, image_url, description) VALUES
(1, 1850000, '2019-03-15', '100 Heritage Plaza', 'New York', 'NY', '10001', 40.7128, -74.006,
 'https://images.pexels.com/photos/19335727/pexels-photo-19335727.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
 'A premier shopping destination in the heart of Manhattan featuring 200+ luxury and lifestyle brands across 5 floors.'),
(2, 1200000, '2021-07-20', '45 Tech Park Avenue', 'San Jose', 'CA', '95110', 37.3382, -121.8863,
 'https://images.pexels.com/photos/16155275/pexels-photo-16155275.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
 'Silicon Valley lifestyle mall blending retail, dining, and entertainment with cutting-edge design.'),
(3, 950000, '2018-11-05', '78 Lakeshore Drive', 'Chicago', 'IL', '60601', 41.8781, -87.6298,
 'https://images.pexels.com/photos/16547727/pexels-photo-16547727.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
 'A lakeside shopping experience with stunning views, featuring 150+ stores and a flagship food court.');

INSERT INTO Mall_Contact_Number (mall_id, contact_number) VALUES
(1, '+1-212-555-0100'), (1, '+1-212-555-0101'),
(2, '+1-408-555-0200'),
(3, '+1-312-555-0300'), (3, '+1-312-555-0301');

-- Stores (listing_media = single URL = mock listing_media[0]) --
INSERT INTO Store (store_id, shop_number, floor, area_sqft, store_name, status, listing_media, mall_id) VALUES
(1, 'G-12', 1, 2400, 'Urban Threads', 'occupied', 'https://images.pexels.com/photos/8386651/pexels-photo-8386651.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
(2, 'G-15', 1, 1800, 'Tech Haven', 'occupied', 'https://images.pexels.com/photos/5531542/pexels-photo-5531542.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
(3, 'F2-08', 2, 3200, 'Glow Beauty Bar', 'occupied', 'https://images.pexels.com/photos/5531709/pexels-photo-5531709.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
(4, 'F3-03', 3, 1500, 'Nest & Home', 'occupied', 'https://images.pexels.com/photos/8311880/pexels-photo-8311880.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
(5, 'G-22', 1, 2800, 'Prime Retail Space', 'available', 'https://images.pexels.com/photos/4534504/pexels-photo-4534504.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
(6, 'F2-14', 2, 1200, 'Boutique Corner', 'available', 'https://images.pexels.com/photos/7078223/pexels-photo-7078223.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
(7, 'G-05', 1, 3000, 'Silicon Styles', 'occupied', 'https://images.pexels.com/photos/8386651/pexels-photo-8386651.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 2),
(8, 'F2-10', 2, 2000, 'Gadget Galaxy', 'occupied', 'https://images.pexels.com/photos/5531542/pexels-photo-5531542.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 2),
(9, 'G-18', 1, 2600, 'Lakeside Fashion', 'occupied', 'https://images.pexels.com/photos/5531709/pexels-photo-5531709.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 3),
(10, 'F2-06', 2, 1600, 'Corner Cafe Space', 'available', 'https://images.pexels.com/photos/6772837/pexels-photo-6772837.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 3);

-- Products --
INSERT INTO Product (product_id, product_name, category, price, image_url) VALUES
(1, 'Classic Cotton Shirt', 'Fashion', 49.99, 'https://images.pexels.com/photos/13632832/pexels-photo-13632832.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(2, 'Summer Tee Collection', 'Fashion', 29.99, 'https://images.pexels.com/photos/8146450/pexels-photo-8146450.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(3, 'Minimalist Gray Shirt', 'Fashion', 39.99, 'https://images.pexels.com/photos/13094187/pexels-photo-13094187.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(4, 'Denim Jacket Premium', 'Fashion', 89.99, 'https://images.pexels.com/photos/38561616/pexels-photo-38561616.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(5, 'Designer Clothing Rack', 'Fashion', 59.99, 'https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(6, 'Casual Color Tees', 'Fashion', 24.99, 'https://images.pexels.com/photos/8146448/pexels-photo-8146448.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(7, 'Pro Laptop Bundle', 'Electronics', 1299.00, 'https://images.pexels.com/photos/8346914/pexels-photo-8346914.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(8, 'Gaming Controller Set', 'Electronics', 79.99, 'https://images.pexels.com/photos/7989742/pexels-photo-7989742.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(9, 'Wireless Audio Kit', 'Electronics', 199.99, 'https://images.pexels.com/photos/18311089/pexels-photo-18311089.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(10, 'Creator Camera Gear', 'Electronics', 549.00, 'https://images.pexels.com/photos/4533076/pexels-photo-4533076.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(11, 'Accent Armchair', 'Home & Decor', 349.00, 'https://images.pexels.com/photos/11112735/pexels-photo-11112735.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(12, 'Modern Bookshelf', 'Home & Decor', 229.00, 'https://images.pexels.com/photos/31338030/pexels-photo-31338030.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(13, 'Wall Shelf Display', 'Home & Decor', 149.00, 'https://images.pexels.com/photos/35266317/pexels-photo-35266317.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(14, 'Minimalist Credenza', 'Home & Decor', 499.00, 'https://images.pexels.com/photos/20557088/pexels-photo-20557088.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(15, 'Hydrating Face Cream', 'Beauty', 45.00, 'https://images.pexels.com/photos/36339062/pexels-photo-36339062.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(16, 'Skincare Serum Set', 'Beauty', 89.00, 'https://images.pexels.com/photos/24602077/pexels-photo-24602077.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(17, 'Premium Skincare Kit', 'Beauty', 129.00, 'https://images.pexels.com/photos/4841273/pexels-photo-4841273.jpeg?auto=compress&cs=tinysrgb&h=400&w=400'),
(18, 'Violet Cosmetic Jar', 'Beauty', 34.00, 'https://images.pexels.com/photos/35976902/pexels-photo-35976902.jpeg?auto=compress&cs=tinysrgb&h=400&w=400');

INSERT INTO Store_Sells_Product (store_id, product_id, to_show) VALUES
(1,1,TRUE),(1,2,TRUE),(1,3,FALSE),(1,4,TRUE),(1,6,FALSE),
(2,7,TRUE),(2,8,TRUE),(2,9,FALSE),(2,10,TRUE),
(3,15,TRUE),(3,16,TRUE),(3,17,FALSE),(3,18,TRUE),
(4,11,TRUE),(4,12,FALSE),(4,13,TRUE),(4,14,FALSE),
(7,1,TRUE),(7,4,TRUE),
(8,7,TRUE),(8,9,TRUE),
(9,2,TRUE),(9,5,TRUE),(9,6,FALSE);

-- Tenants (emails double as demo login identities) --
INSERT INTO Tenant (tenant_id, business_name, business_type, email, date_registered, phone_number) VALUES
(1, 'Urban Threads LLC', 'Fashion Retail', 'tenant.demo@gmail.com', '2019-04-01', '+1-212-555-1001'),
(2, 'Tech Haven Inc', 'Electronics Retail', 'contact@techhaven.com', '2019-06-15', '+1-212-555-1002'),
(3, 'Glow Beauty Co', 'Beauty & Cosmetics', 'hello@glowbeauty.com', '2020-01-20', '+1-212-555-1003'),
(4, 'Nest & Home', 'Home & Decor', 'info@nestandhome.com', '2020-09-10', '+1-212-555-1004');

INSERT INTO Store_Rented_By_Tenant (store_id, tenant_id) VALUES
(1,1),(9,1),(2,2),(8,2),(3,3),(4,4);

-- Employees --
INSERT INTO Employee (employee_id, first_name, last_name, email, date_of_joining, base_salary, current_designation, phone_number, store_id, mall_id) VALUES
(1, 'Marcus', 'Chen', 'shopmgr.demo@gmail.com', '2019-05-01', 4200, 'Shop Manager', '+1-212-555-2001', 1, 1),
(2, 'Sarah', 'Johnson', 'employee.demo@gmail.com', '2020-02-15', 3200, 'Sales Associate', '+1-212-555-2002', 1, 1),
(3, 'David', 'Kim', 'david@techhaven.com', '2019-07-01', 4500, 'Shop Manager', '+1-212-555-2003', 2, 1),
(4, 'Lisa', 'Wang', 'lisa@glowbeauty.com', '2020-02-01', 3800, 'Beautician', '+1-212-555-2004', 3, 1),
(5, 'Robert', 'Brown', 'robert@nestandhome.com', '2020-10-01', 3600, 'Sales Associate', '+1-212-555-2005', 4, 1),
(6, 'Emily', 'Davis', 'emily@urbanthreads.com', '2021-03-01', 3400, 'Sales Associate', '+1-312-555-2006', 9, 3),
(7, 'James', 'Wilson', 'jwilson@heritageplaza.com', '2019-03-20', 5200, 'Security Lead', '+1-212-555-2007', NULL, 1),
(8, 'Patricia', 'Garcia', 'pgarcia@heritageplaza.com', '2019-04-10', 4800, 'Maintenance Supervisor', '+1-212-555-2008', NULL, 1),
(9, 'Thomas', 'Anderson', 'tanderson@heritageplaza.com', '2020-01-15', 3500, 'Customer Service', '+1-212-555-2009', NULL, 1);

-- Managers / executive (emails double as demo login identities) --
INSERT INTO Mall_Manager (manager_id, first_name, last_name, email, date_joined, phone_number, mall_id) VALUES
(1, 'Daniel', 'Foster', 'mallmgr.demo@gmail.com', '2019-03-01', '+1-212-555-3001', 1),
(2, 'Christina', 'Lee', 'clee@techparkmall.com', '2021-06-01', '+1-408-555-3002', 2),
(3, 'Michael', 'Bennett', 'mbennett@lakeshore.com', '2018-10-01', '+1-312-555-3003', 3);

INSERT INTO Enterprise_Executive (executive_id, first_name, last_name, email, date_joined, phone_number) VALUES
(1, 'Victoria', 'Hayes', 'exec.demo@gmail.com', '2018-01-01', '+1-212-555-4001');

INSERT INTO EE_Oversees_Mall (executive_id, mall_id) VALUES (1,1),(1,2),(1,3);

-- Users (bid FK targets; demo logins resolve via domain tables first) --
INSERT INTO `User` (user_id, first_name, last_name, email, phone_number, google_sub) VALUES
(1, 'Alex', 'Morgan', 'customer.demo@gmail.com', NULL, NULL),
(2, 'Jordan', 'Blake', 'bidder2.demo@gmail.com', NULL, NULL),
(3, 'Sam', 'Rivera', 'bidder3.demo@gmail.com', NULL, NULL),
(4, 'Taylor', 'Quinn', 'bidder4.demo@gmail.com', NULL, NULL),
(5, 'Casey', 'Brooks', 'bidder5.demo@gmail.com', NULL, NULL),
(6, 'Morgan', 'Hayes', 'bidder6.demo@gmail.com', NULL, NULL),
(7, 'Blue', 'Sky', 'bidder7.demo@gmail.com', NULL, NULL),
(8, 'Sky', 'Ventures', 'bidder8.demo@gmail.com', NULL, NULL);

-- Bid events --
INSERT INTO Bid_Event (store_id, event_id, start_date, end_date, final_allocation, minimum_bid_amount, minimum_bid_increment, status) VALUES
(5, 1, '2026-08-20', '2026-09-15', FALSE, 5000, 250, 'open'),
(6, 2, '2026-08-25', '2026-09-30', FALSE, 3500, 100, 'open'),
(10, 3, '2026-07-01', '2026-08-10', TRUE, 4000, 200, 'finalized');

INSERT INTO Bid (user_id, bid_id, event_id, store_id, bid_amount, round_number, bid_date, status, bidder_name) VALUES
(1, 1, 1, 5, 5000, 1, '2026-08-20 10:00:00', 'outbid', 'Alex Morgan'),
(2, 2, 1, 5, 5250, 2, '2026-08-21 14:30:00', 'outbid', 'Jordan Blake'),
(3, 3, 1, 5, 5500, 3, '2026-08-22 09:15:00', 'outbid', 'Sam Rivera'),
(4, 4, 1, 5, 5750, 4, '2026-08-23 16:45:00', 'winning', 'Taylor Quinn'),
(5, 5, 2, 6, 3500, 1, '2026-08-25 11:00:00', 'outbid', 'Casey Brooks'),
(6, 6, 2, 6, 3600, 2, '2026-08-26 13:20:00', 'winning', 'Morgan Hayes'),
(7, 7, 3, 10, 4200, 1, '2026-07-02 10:00:00', 'outbid', 'BlueSky Ventures'),
(8, 8, 3, 10, 4400, 2, '2026-07-05 15:00:00', 'winning', 'BlueSky Ventures');

-- Transactions --
INSERT INTO Financial_Transaction (transaction_id, amount, sender, receiver, sender_type, receiver_type, transaction_date, remarks) VALUES
(1, 12000, 'Urban Threads LLC', 'Heritage Plaza Mall', 'tenant', 'mall', '2026-08-01', 'Monthly rent payment - August'),
(2, 8500, 'Tech Haven Inc', 'Heritage Plaza Mall', 'tenant', 'mall', '2026-08-01', 'Monthly rent payment - August'),
(3, 6200, 'Glow Beauty Co', 'Heritage Plaza Mall', 'tenant', 'mall', '2026-08-03', 'Monthly rent payment - August'),
(4, 4800, 'Nest & Home', 'Heritage Plaza Mall', 'tenant', 'mall', '2026-08-05', 'Monthly rent payment - August'),
(5, 11500, 'Urban Threads LLC', 'Lakeshore Mall', 'tenant', 'mall', '2026-08-02', 'Monthly rent payment - August'),
(6, 9800, 'Tech Haven Inc', 'Tech Park Mall', 'tenant', 'mall', '2026-08-04', 'Monthly rent payment - August');

-- Discount offers --
INSERT INTO Discount_Offer (store_id, offer_id, start_date, end_date, description) VALUES
(1, 1, '2026-08-15', '2026-09-15', 'Back to School Sale - 30% off all cotton shirts'),
(2, 2, '2026-08-20', '2026-09-05', 'Bundle & Save - $200 off laptop + accessory combos'),
(3, 3, '2026-09-01', '2026-09-30', 'Glow Up September - Buy 2 skincare items, get 1 free'),
(9, 4, '2026-08-25', '2026-09-10', 'End of Summer Clearance - Up to 50% off');

-- Leave / payroll / attendance --
INSERT INTO Leave_Request (employee_id, request_id, start_date, end_date, status, reason) VALUES
(1, 1, '2026-09-10', '2026-09-12', 'pending', 'Family event out of town'),
(2, 2, '2026-08-28', '2026-08-30', 'approved', 'Medical appointment'),
(7, 3, '2026-09-05', '2026-09-06', 'pending', 'Personal matters'),
(4, 4, '2026-08-15', '2026-08-18', 'rejected', 'Insufficient coverage'),
(3, 5, '2026-09-15', '2026-09-20', 'pending', 'Vacation - pre-approved verbally');

INSERT INTO Payroll_Record (employee_id, record_id, amount, record_type, issue_date) VALUES
(1, 1, 4200, 'salary', '2026-08-31'),
(1, 2, 500, 'bonus', '2026-08-31'),
(2, 3, 3200, 'salary', '2026-08-31'),
(3, 4, 4500, 'salary', '2026-08-31'),
(4, 5, 3800, 'salary', '2026-08-31'),
(7, 6, 5200, 'salary', '2026-08-31'),
(8, 7, 4800, 'salary', '2026-08-31');

INSERT INTO Attendance (employee_id, date, check_in_time, check_out_time) VALUES
(1, '2026-08-28', '08:55', '17:05'),
(1, '2026-08-27', '09:02', '17:10'),
(1, '2026-08-26', '08:58', '17:00'),
(2, '2026-08-28', '09:15', NULL),
(2, '2026-08-27', '09:05', '17:15'),
(7, '2026-08-28', '07:45', '18:00'),
(7, '2026-08-27', '07:50', '18:05');

-- Keep AUTO_INCREMENT ahead of seeded ids --
ALTER TABLE Mall AUTO_INCREMENT = 100;
ALTER TABLE Store AUTO_INCREMENT = 100;
ALTER TABLE Product AUTO_INCREMENT = 100;
ALTER TABLE Tenant AUTO_INCREMENT = 100;
ALTER TABLE Employee AUTO_INCREMENT = 100;
ALTER TABLE Mall_Manager AUTO_INCREMENT = 100;
ALTER TABLE Enterprise_Executive AUTO_INCREMENT = 100;
ALTER TABLE `User` AUTO_INCREMENT = 100;
ALTER TABLE Financial_Transaction AUTO_INCREMENT = 100;
