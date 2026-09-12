// ═══════════════════════════════════════════════════════════════
// MOCK DATA — Frontend dummy data for the Mall Management app.
// Replace these with real API calls to your Spring Boot backend.
// See src/lib/api.js for the commented-out integration code.
// ═══════════════════════════════════════════════════════════════

const mallImages = [
  'https://images.pexels.com/photos/19335727/pexels-photo-19335727.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/16155275/pexels-photo-16155275.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/16547727/pexels-photo-16547727.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

const storeImages = [
  'https://images.pexels.com/photos/8386651/pexels-photo-8386651.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/5531542/pexels-photo-5531542.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/5531709/pexels-photo-5531709.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8311880/pexels-photo-8311880.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

export const productImages = {
  fashion: [
    'https://images.pexels.com/photos/13632832/pexels-photo-13632832.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/8146450/pexels-photo-8146450.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/13094187/pexels-photo-13094187.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/38561616/pexels-photo-38561616.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/8146448/pexels-photo-8146448.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  ],
  electronics: [
    'https://images.pexels.com/photos/8346914/pexels-photo-8346914.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/7989742/pexels-photo-7989742.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/18311089/pexels-photo-18311089.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/4533076/pexels-photo-4533076.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  ],
  home: [
    'https://images.pexels.com/photos/11112735/pexels-photo-11112735.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/31338030/pexels-photo-31338030.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/35266317/pexels-photo-35266317.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/20557088/pexels-photo-20557088.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  ],
  beauty: [
    'https://images.pexels.com/photos/36339062/pexels-photo-36339062.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/24602077/pexels-photo-24602077.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/4841273/pexels-photo-4841273.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
    'https://images.pexels.com/photos/35976902/pexels-photo-35976902.jpeg?auto=compress&cs=tinysrgb&h=400&w=400',
  ],
};

const propertyImages = [
  'https://images.pexels.com/photos/4534504/pexels-photo-4534504.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/7078223/pexels-photo-7078223.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/6772837/pexels-photo-6772837.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

// ── Malls ──────────────────────────────────────────────────────
export const malls = [
  {
    mall_id: 'm1',
    mall_area_sqft: 1850000,
    opening_date: '2019-03-15',
    street: '100 Heritage Plaza',
    city: 'New York',
    state: 'NY',
    pincode: '10001',
    latitude: 40.7128,
    longitude: -74.006,
    contact_numbers: ['+1-212-555-0100', '+1-212-555-0101'],
    imageUrl: mallImages[0],
    description: 'A premier shopping destination in the heart of Manhattan featuring 200+ luxury and lifestyle brands across 5 floors.',
  },
  {
    mall_id: 'm2',
    mall_area_sqft: 1200000,
    opening_date: '2021-07-20',
    street: '45 Tech Park Avenue',
    city: 'San Jose',
    state: 'CA',
    pincode: '95110',
    latitude: 37.3382,
    longitude: -121.8863,
    contact_numbers: ['+1-408-555-0200'],
    imageUrl: mallImages[1],
    description: 'Silicon Valley\'s newest lifestyle mall blending retail, dining, and entertainment with cutting-edge design.',
  },
  {
    mall_id: 'm3',
    mall_area_sqft: 950000,
    opening_date: '2018-11-05',
    street: '78 Lakeshore Drive',
    city: 'Chicago',
    state: 'IL',
    pincode: '60601',
    latitude: 41.8781,
    longitude: -87.6298,
    contact_numbers: ['+1-312-555-0300', '+1-312-555-0301'],
    imageUrl: mallImages[2],
    description: 'A lakeside shopping experience with stunning views, featuring 150+ stores and a flagship food court.',
  },
];

// ── Stores ─────────────────────────────────────────────────────
export const stores = [
  { store_id: 's1', shop_number: 'G-12', floor: 1, area_sqft: 2400, store_name: 'Urban Threads', status: 'occupied', listing_media: [storeImages[0]], mall_id: 'm1' },
  { store_id: 's2', shop_number: 'G-15', floor: 1, area_sqft: 1800, store_name: 'Tech Haven', status: 'occupied', listing_media: [storeImages[1]], mall_id: 'm1' },
  { store_id: 's3', shop_number: 'F2-08', floor: 2, area_sqft: 3200, store_name: 'Glow Beauty Bar', status: 'occupied', listing_media: [storeImages[2]], mall_id: 'm1' },
  { store_id: 's4', shop_number: 'F3-03', floor: 3, area_sqft: 1500, store_name: 'Nest & Home', status: 'occupied', listing_media: [storeImages[3]], mall_id: 'm1' },
  { store_id: 's5', shop_number: 'G-22', floor: 1, area_sqft: 2800, store_name: 'Prime Retail Space', status: 'available', listing_media: [propertyImages[0], propertyImages[1], propertyImages[2]], mall_id: 'm1' },
  { store_id: 's6', shop_number: 'F2-14', floor: 2, area_sqft: 1200, store_name: 'Boutique Corner', status: 'available', listing_media: [propertyImages[1], propertyImages[0]], mall_id: 'm1' },
  { store_id: 's7', shop_number: 'G-05', floor: 1, area_sqft: 3000, store_name: 'Silicon Styles', status: 'occupied', listing_media: [storeImages[0]], mall_id: 'm2' },
  { store_id: 's8', shop_number: 'F2-10', floor: 2, area_sqft: 2000, store_name: 'Gadget Galaxy', status: 'occupied', listing_media: [storeImages[1]], mall_id: 'm2' },
  { store_id: 's9', shop_number: 'G-18', floor: 1, area_sqft: 2600, store_name: 'Lakeside Fashion', status: 'occupied', listing_media: [storeImages[2]], mall_id: 'm3' },
  { store_id: 's10', shop_number: 'F2-06', floor: 2, area_sqft: 1600, store_name: 'Corner Cafe Space', status: 'available', listing_media: [propertyImages[2], propertyImages[0]], mall_id: 'm3' },
];

// ── Products ───────────────────────────────────────────────────
export const products = [
  { product_id: 'p1', product_name: 'Classic Cotton Shirt', category: 'Fashion', price: 49.99, imageUrl: productImages.fashion[0] },
  { product_id: 'p2', product_name: 'Summer Tee Collection', category: 'Fashion', price: 29.99, imageUrl: productImages.fashion[1] },
  { product_id: 'p3', product_name: 'Minimalist Gray Shirt', category: 'Fashion', price: 39.99, imageUrl: productImages.fashion[2] },
  { product_id: 'p4', product_name: 'Denim Jacket Premium', category: 'Fashion', price: 89.99, imageUrl: productImages.fashion[3] },
  { product_id: 'p5', product_name: 'Designer Clothing Rack', category: 'Fashion', price: 59.99, imageUrl: productImages.fashion[4] },
  { product_id: 'p6', product_name: 'Casual Color Tees', category: 'Fashion', price: 24.99, imageUrl: productImages.fashion[5] },
  { product_id: 'p7', product_name: 'Pro Laptop Bundle', category: 'Electronics', price: 1299.0, imageUrl: productImages.electronics[0] },
  { product_id: 'p8', product_name: 'Gaming Controller Set', category: 'Electronics', price: 79.99, imageUrl: productImages.electronics[1] },
  { product_id: 'p9', product_name: 'Wireless Audio Kit', category: 'Electronics', price: 199.99, imageUrl: productImages.electronics[2] },
  { product_id: 'p10', product_name: 'Creator Camera Gear', category: 'Electronics', price: 549.0, imageUrl: productImages.electronics[3] },
  { product_id: 'p11', product_name: 'Accent Armchair', category: 'Home & Decor', price: 349.0, imageUrl: productImages.home[0] },
  { product_id: 'p12', product_name: 'Modern Bookshelf', category: 'Home & Decor', price: 229.0, imageUrl: productImages.home[1] },
  { product_id: 'p13', product_name: 'Wall Shelf Display', category: 'Home & Decor', price: 149.0, imageUrl: productImages.home[2] },
  { product_id: 'p14', product_name: 'Minimalist Credenza', category: 'Home & Decor', price: 499.0, imageUrl: productImages.home[3] },
  { product_id: 'p15', product_name: 'Hydrating Face Cream', category: 'Beauty', price: 45.0, imageUrl: productImages.beauty[0] },
  { product_id: 'p16', product_name: 'Skincare Serum Set', category: 'Beauty', price: 89.0, imageUrl: productImages.beauty[1] },
  { product_id: 'p17', product_name: 'Premium Skincare Kit', category: 'Beauty', price: 129.0, imageUrl: productImages.beauty[2] },
  { product_id: 'p18', product_name: 'Violet Cosmetic Jar', category: 'Beauty', price: 34.0, imageUrl: productImages.beauty[3] },
];

// ── Store-Sells-Product junction ───────────────────────────────
export const storeProducts = [
  { store_id: 's1', product_id: 'p1', to_show: true },
  { store_id: 's1', product_id: 'p2', to_show: true },
  { store_id: 's1', product_id: 'p3', to_show: false },
  { store_id: 's1', product_id: 'p4', to_show: true },
  { store_id: 's1', product_id: 'p6', to_show: false },
  { store_id: 's2', product_id: 'p7', to_show: true },
  { store_id: 's2', product_id: 'p8', to_show: true },
  { store_id: 's2', product_id: 'p9', to_show: false },
  { store_id: 's2', product_id: 'p10', to_show: true },
  { store_id: 's3', product_id: 'p15', to_show: true },
  { store_id: 's3', product_id: 'p16', to_show: true },
  { store_id: 's3', product_id: 'p17', to_show: false },
  { store_id: 's3', product_id: 'p18', to_show: true },
  { store_id: 's4', product_id: 'p11', to_show: true },
  { store_id: 's4', product_id: 'p12', to_show: false },
  { store_id: 's4', product_id: 'p13', to_show: true },
  { store_id: 's4', product_id: 'p14', to_show: false },
  { store_id: 's7', product_id: 'p1', to_show: true },
  { store_id: 's7', product_id: 'p4', to_show: true },
  { store_id: 's8', product_id: 'p7', to_show: true },
  { store_id: 's8', product_id: 'p9', to_show: true },
  { store_id: 's9', product_id: 'p2', to_show: true },
  { store_id: 's9', product_id: 'p5', to_show: true },
  { store_id: 's9', product_id: 'p6', to_show: false },
];

// ── Tenants ────────────────────────────────────────────────────
export const tenants = [
  { tenant_id: 't1', business_name: 'Urban Threads LLC', business_type: 'Fashion Retail', email: 'owner@urbanthreads.com', date_registered: '2019-04-01', phone_number: '+1-212-555-1001', store_ids: ['s1', 's9'] },
  { tenant_id: 't2', business_name: 'Tech Haven Inc', business_type: 'Electronics Retail', email: 'contact@techhaven.com', date_registered: '2019-06-15', phone_number: '+1-212-555-1002', store_ids: ['s2', 's8'] },
  { tenant_id: 't3', business_name: 'Glow Beauty Co', business_type: 'Beauty & Cosmetics', email: 'hello@glowbeauty.com', date_registered: '2020-01-20', phone_number: '+1-212-555-1003', store_ids: ['s3'] },
  { tenant_id: 't4', business_name: 'Nest & Home', business_type: 'Home & Decor', email: 'info@nestandhome.com', date_registered: '2020-09-10', phone_number: '+1-212-555-1004', store_ids: ['s4'] },
];

// ── Employees ──────────────────────────────────────────────────
export const employees = [
  // Store employees (store_id set)
  { employee_id: 'e1', first_name: 'Marcus', last_name: 'Chen', email: 'marcus@urbanthreads.com', date_of_joining: '2019-05-01', base_salary: 4200, current_designation: 'Shop Manager', phone_number: '+1-212-555-2001', store_id: 's1', mall_id: 'm1' },
  { employee_id: 'e2', first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@urbanthreads.com', date_of_joining: '2020-02-15', base_salary: 3200, current_designation: 'Sales Associate', phone_number: '+1-212-555-2002', store_id: 's1', mall_id: 'm1' },
  { employee_id: 'e3', first_name: 'David', last_name: 'Kim', email: 'david@techhaven.com', date_of_joining: '2019-07-01', base_salary: 4500, current_designation: 'Shop Manager', phone_number: '+1-212-555-2003', store_id: 's2', mall_id: 'm1' },
  { employee_id: 'e4', first_name: 'Lisa', last_name: 'Wang', email: 'lisa@glowbeauty.com', date_of_joining: '2020-02-01', base_salary: 3800, current_designation: 'Beautician', phone_number: '+1-212-555-2004', store_id: 's3', mall_id: 'm1' },
  { employee_id: 'e5', first_name: 'Robert', last_name: 'Brown', email: 'robert@nestandhome.com', date_of_joining: '2020-10-01', base_salary: 3600, current_designation: 'Sales Associate', phone_number: '+1-212-555-2005', store_id: 's4', mall_id: 'm1' },
  { employee_id: 'e6', first_name: 'Emily', last_name: 'Davis', email: 'emily@urbanthreads.com', date_of_joining: '2021-03-01', base_salary: 3400, current_designation: 'Sales Associate', phone_number: '+1-312-555-2006', store_id: 's9', mall_id: 'm3' },
  // Direct mall employees (store_id null)
  { employee_id: 'e7', first_name: 'James', last_name: 'Wilson', email: 'jwilson@heritageplaza.com', date_of_joining: '2019-03-20', base_salary: 5200, current_designation: 'Security Lead', phone_number: '+1-212-555-2007', store_id: null, mall_id: 'm1' },
  { employee_id: 'e8', first_name: 'Patricia', last_name: 'Garcia', email: 'pgarcia@heritageplaza.com', date_of_joining: '2019-04-10', base_salary: 4800, current_designation: 'Maintenance Supervisor', phone_number: '+1-212-555-2008', store_id: null, mall_id: 'm1' },
  { employee_id: 'e9', first_name: 'Thomas', last_name: 'Anderson', email: 'tanderson@heritageplaza.com', date_of_joining: '2020-01-15', base_salary: 3500, current_designation: 'Customer Service', phone_number: '+1-212-555-2009', store_id: null, mall_id: 'm1' },
];

// ── Mall Managers ──────────────────────────────────────────────
export const mallManagers = [
  { manager_id: 'mm1', first_name: 'Daniel', last_name: 'Foster', email: 'dfoster@heritageplaza.com', date_joined: '2019-03-01', phone_number: '+1-212-555-3001', mall_id: 'm1' },
  { manager_id: 'mm2', first_name: 'Christina', last_name: 'Lee', email: 'clee@techparkmall.com', date_joined: '2021-06-01', phone_number: '+1-408-555-3002', mall_id: 'm2' },
  { manager_id: 'mm3', first_name: 'Michael', last_name: 'Bennett', email: 'mbennett@lakeshore.com', date_joined: '2018-10-01', phone_number: '+1-312-555-3003', mall_id: 'm3' },
];

// ── Enterprise Executives ───────────────────────────────────────
export const executives = [
  { executive_id: 'ex1', first_name: 'Victoria', last_name: 'Hayes', email: 'vhayes@mallhub.com', date_joined: '2018-01-01', phone_number: '+1-212-555-4001', oversees_mall_ids: ['m1', 'm2', 'm3'] },
];

// ── Bid Events ─────────────────────────────────────────────────
export const bidEvents = [
  { event_id: 'be1', start_date: '2026-08-20', end_date: '2026-09-15', final_allocation: null, minimum_bid_amount: 5000, minimum_bid_increment: 250, store_id: 's5', status: 'open' },
  { event_id: 'be2', start_date: '2026-08-25', end_date: '2026-09-30', final_allocation: null, minimum_bid_amount: 3500, minimum_bid_increment: 100, store_id: 's6', status: 'open' },
  { event_id: 'be3', start_date: '2026-07-01', end_date: '2026-08-10', final_allocation: 'Awarded to BlueSky Ventures', minimum_bid_amount: 4000, minimum_bid_increment: 200, store_id: 's10', status: 'finalized' },
];

// ── Bids ───────────────────────────────────────────────────────
export const bids = [
  { bid_id: 'b1', user_id: 'u1', event_id: 'be1', bid_amount: 5000, round_number: 1, bid_date: '2026-08-20T10:00:00Z', status: 'outbid', bidder_name: 'Alex Morgan' },
  { bid_id: 'b2', user_id: 'u2', event_id: 'be1', bid_amount: 5250, round_number: 2, bid_date: '2026-08-21T14:30:00Z', status: 'outbid', bidder_name: 'Jordan Blake' },
  { bid_id: 'b3', user_id: 'u3', event_id: 'be1', bid_amount: 5500, round_number: 3, bid_date: '2026-08-22T09:15:00Z', status: 'outbid', bidder_name: 'Sam Rivera' },
  { bid_id: 'b4', user_id: 'u4', event_id: 'be1', bid_amount: 5750, round_number: 4, bid_date: '2026-08-23T16:45:00Z', status: 'winning', bidder_name: 'Taylor Quinn' },
  { bid_id: 'b5', user_id: 'u5', event_id: 'be2', bid_amount: 3500, round_number: 1, bid_date: '2026-08-25T11:00:00Z', status: 'outbid', bidder_name: 'Casey Brooks' },
  { bid_id: 'b6', user_id: 'u6', event_id: 'be2', bid_amount: 3600, round_number: 2, bid_date: '2026-08-26T13:20:00Z', status: 'winning', bidder_name: 'Morgan Hayes' },
  { bid_id: 'b7', user_id: 'u7', event_id: 'be3', bid_amount: 4200, round_number: 1, bid_date: '2026-07-02T10:00:00Z', status: 'outbid', bidder_name: 'BlueSky Ventures' },
  { bid_id: 'b8', user_id: 'u8', event_id: 'be3', bid_amount: 4400, round_number: 2, bid_date: '2026-07-05T15:00:00Z', status: 'winning', bidder_name: 'BlueSky Ventures' },
];

// ── Financial Transactions ────────────────────────────────────
export const transactions = [
  { transaction_id: 'ft1', amount: 12000, sender: 'Urban Threads LLC', receiver: 'Heritage Plaza Mall', sender_type: 'tenant', receiver_type: 'mall', transaction_date: '2026-08-01', remarks: 'Monthly rent payment - August' },
  { transaction_id: 'ft2', amount: 8500, sender: 'Tech Haven Inc', receiver: 'Heritage Plaza Mall', sender_type: 'tenant', receiver_type: 'mall', transaction_date: '2026-08-01', remarks: 'Monthly rent payment - August' },
  { transaction_id: 'ft3', amount: 6200, sender: 'Glow Beauty Co', receiver: 'Heritage Plaza Mall', sender_type: 'tenant', receiver_type: 'mall', transaction_date: '2026-08-03', remarks: 'Monthly rent payment - August' },
  { transaction_id: 'ft4', amount: 4800, sender: 'Nest & Home', receiver: 'Heritage Plaza Mall', sender_type: 'tenant', receiver_type: 'mall', transaction_date: '2026-08-05', remarks: 'Monthly rent payment - August' },
  { transaction_id: 'ft5', amount: 11500, sender: 'Urban Threads LLC', receiver: 'Lakeshore Mall', sender_type: 'tenant', receiver_type: 'mall', transaction_date: '2026-08-02', remarks: 'Monthly rent payment - August' },
  { transaction_id: 'ft6', amount: 9800, sender: 'Tech Haven Inc', receiver: 'Tech Park Mall', sender_type: 'tenant', receiver_type: 'mall', transaction_date: '2026-08-04', remarks: 'Monthly rent payment - August' },
];

// ── Revenue Information ────────────────────────────────────────
export const revenueInfo = [
  { tenant_id: 't1', information_id: 'ri1', description: 'August 2026 revenue report', month: 'August 2026', amount: 84500, submitted_date: '2026-08-25' },
  { tenant_id: 't1', information_id: 'ri2', description: 'July 2026 revenue report', month: 'July 2026', amount: 78200, submitted_date: '2026-07-28' },
  { tenant_id: 't2', information_id: 'ri3', description: 'August 2026 revenue report', month: 'August 2026', amount: 112000, submitted_date: '2026-08-24' },
  { tenant_id: 't2', information_id: 'ri4', description: 'July 2026 revenue report', month: 'July 2026', amount: 98700, submitted_date: '2026-07-30' },
  { tenant_id: 't3', information_id: 'ri5', description: 'August 2026 revenue report', month: 'August 2026', amount: 56300, submitted_date: '2026-08-26' },
  { tenant_id: 't4', information_id: 'ri6', description: 'August 2026 revenue report', month: 'August 2026', amount: 42100, submitted_date: '2026-08-23' },
];

// ── Discount Offers ────────────────────────────────────────────
export const discountOffers = [
  { store_id: 's1', offer_id: 'do1', start_date: '2026-08-15', end_date: '2026-09-15', description: 'Back to School Sale — 30% off all cotton shirts' },
  { store_id: 's2', offer_id: 'do2', start_date: '2026-08-20', end_date: '2026-09-05', description: 'Bundle & Save — $200 off laptop + accessory combos' },
  { store_id: 's3', offer_id: 'do3', start_date: '2026-09-01', end_date: '2026-09-30', description: 'Glow Up September — Buy 2 skincare items, get 1 free' },
  { store_id: 's9', offer_id: 'do4', start_date: '2026-08-25', end_date: '2026-09-10', description: 'End of Summer Clearance — Up to 50% off' },
];

// ── Leave Requests ─────────────────────────────────────────────
export const leaveRequests = [
  { e_id: 'e1', request_id: 'lr1', start_date: '2026-09-10', end_date: '2026-09-12', status: 'pending', reason: 'Family event out of town' },
  { e_id: 'e2', request_id: 'lr2', start_date: '2026-08-28', end_date: '2026-08-30', status: 'approved', reason: 'Medical appointment' },
  { e_id: 'e7', request_id: 'lr3', start_date: '2026-09-05', end_date: '2026-09-06', status: 'pending', reason: 'Personal matters' },
  { e_id: 'e4', request_id: 'lr4', start_date: '2026-08-15', end_date: '2026-08-18', status: 'rejected', reason: 'Insufficient coverage' },
  { e_id: 'e3', request_id: 'lr5', start_date: '2026-09-15', end_date: '2026-09-20', status: 'pending', reason: 'Vacation — pre-approved verbally' },
];

// ── Payroll Records ────────────────────────────────────────────
export const payrollRecords = [
  { e_id: 'e1', record_id: 'pr1', amount: 4200, record_type: 'salary', issue_date: '2026-08-31' },
  { e_id: 'e1', record_id: 'pr2', amount: 500, record_type: 'bonus', issue_date: '2026-08-31' },
  { e_id: 'e2', record_id: 'pr3', amount: 3200, record_type: 'salary', issue_date: '2026-08-31' },
  { e_id: 'e3', record_id: 'pr4', amount: 4500, record_type: 'salary', issue_date: '2026-08-31' },
  { e_id: 'e4', record_id: 'pr5', amount: 3800, record_type: 'salary', issue_date: '2026-08-31' },
  { e_id: 'e7', record_id: 'pr6', amount: 5200, record_type: 'salary', issue_date: '2026-08-31' },
  { e_id: 'e8', record_id: 'pr7', amount: 4800, record_type: 'salary', issue_date: '2026-08-31' },
];

// ── Attendance ────────────────────────────────────────────────
export const attendanceRecords = [
  { e_id: 'e1', date: '2026-08-28', check_in_time: '08:55', check_out_time: '17:05' },
  { e_id: 'e1', date: '2026-08-27', check_in_time: '09:02', check_out_time: '17:10' },
  { e_id: 'e1', date: '2026-08-26', check_in_time: '08:58', check_out_time: '17:00' },
  { e_id: 'e2', date: '2026-08-28', check_in_time: '09:15', check_out_time: null },
  { e_id: 'e2', date: '2026-08-27', check_in_time: '09:05', check_out_time: '17:15' },
  { e_id: 'e7', date: '2026-08-28', check_in_time: '07:45', check_out_time: '18:00' },
  { e_id: 'e7', date: '2026-08-27', check_in_time: '07:50', check_out_time: '18:05' },
];

// ── Demo Users (for mock sign-in) ──────────────────────────────
export const demoUsers = [
  { id: 'u1', email: 'customer@demo.com', password: 'demo123', role: 'customer', firstName: 'Alex', lastName: 'Morgan', profileId: 'u1' },
  { id: 'u2', email: 'tenant@demo.com', password: 'demo123', role: 'tenant', firstName: 'James', lastName: 'O\'Connor', profileId: 't1' },
  { id: 'u3', email: 'shopmgr@demo.com', password: 'demo123', role: 'shop_manager', firstName: 'Marcus', lastName: 'Chen', profileId: 'e1' },
  { id: 'u4', email: 'mallmgr@demo.com', password: 'demo123', role: 'mall_manager', firstName: 'Daniel', lastName: 'Foster', profileId: 'mm1' },
  { id: 'u5', email: 'exec@demo.com', password: 'demo123', role: 'executive', firstName: 'Victoria', lastName: 'Hayes', profileId: 'ex1' },
  { id: 'u6', email: 'employee@demo.com', password: 'demo123', role: 'employee', firstName: 'Sarah', lastName: 'Johnson', profileId: 'e2' },
];

// ── Helper functions ───────────────────────────────────────────
export function getMallById(id) { return malls.find(m => m.mall_id === id); }
export function getStoreById(id) { return stores.find(s => s.store_id === id); }
export function getProductById(id) { return products.find(p => p.product_id === id); }
export function getTenantById(id) { return tenants.find(t => t.tenant_id === id); }
export function getEmployeeById(id) { return employees.find(e => e.employee_id === id); }
export function getStoresByMall(mallId) { return stores.filter(s => s.mall_id === mallId); }
export function getStoresByTenant(tenantId) {
  const tenant = tenants.find(t => t.tenant_id === tenantId);
  if (!tenant) return [];
  return stores.filter(s => tenant.store_ids.includes(s.store_id));
}
export function getEmployeesByStore(storeId) { return employees.filter(e => e.store_id === storeId); }
export function getEmployeesByMall(mallId) { return employees.filter(e => e.mall_id === mallId); }
export function getProductsByStore(storeId) {
  return storeProducts
    .filter(sp => sp.store_id === storeId)
    .map(sp => ({ ...getProductById(sp.product_id), to_show: sp.to_show }));
}
export function getTopSellingProducts(mallId) {
  const mallStores = getStoresByMall(mallId).map(s => s.store_id);
  return storeProducts
    .filter(sp => sp.to_show && mallStores.includes(sp.store_id))
    .map(sp => ({ ...getProductById(sp.product_id), store: getStoreById(sp.store_id) }));
}
export function getBidsByEvent(eventId) { return bids.filter(b => b.event_id === eventId); }
export function getWinningBid(eventId) {
  const eventBids = getBidsByEvent(eventId);
  return eventBids.find(b => b.status === 'winning') || null;
}
export function getCurrentBidAmount(eventId) {
  const winning = getWinningBid(eventId);
  return winning ? winning.bid_amount : 0;
}
export function getTransactionsByTenant(tenantId) {
  const tenant = getTenantById(tenantId);
  if (!tenant) return [];
  return transactions.filter(t => t.sender === tenant.business_name);
}
export function getRevenueByTenant(tenantId) { return revenueInfo.filter(r => r.tenant_id === tenantId); }
export function getLeaveRequestsByEmployee(empId) { return leaveRequests.filter(l => l.e_id === empId); }
export function getLeaveRequestsByStore(storeId) {
  const storeEmps = getEmployeesByStore(storeId);
  const empIds = storeEmps.map(e => e.employee_id);
  return leaveRequests.filter(l => empIds.includes(l.e_id));
}
export function getLeaveRequestsByMall(mallId) {
  const mallEmps = getEmployeesByMall(mallId);
  const empIds = mallEmps.map(e => e.employee_id);
  return leaveRequests.filter(l => empIds.includes(l.e_id));
}
export function getAttendanceByStore(storeId) {
  const storeEmps = getEmployeesByStore(storeId);
  const empIds = storeEmps.map(e => e.employee_id);
  return attendanceRecords.filter(a => empIds.includes(a.e_id));
}
export function getAttendanceByMall(mallId) {
  const mallEmps = getEmployeesByMall(mallId);
  const empIds = mallEmps.map(e => e.employee_id);
  return attendanceRecords.filter(a => empIds.includes(a.e_id));
}
export function getPayrollByEmployee(empId) { return payrollRecords.filter(p => p.e_id === empId); }
export function getAttendanceByEmployee(empId) { return attendanceRecords.filter(a => a.e_id === empId); }
export function getManagerByMall(mallId) { return mallManagers.find(mm => mm.mall_id === mallId); }
export function getAvailableStores(mallId) {
  return getStoresByMall(mallId).filter(s => s.status === 'available');
}
export function getBidEventsByMall(mallId) {
  const mallStores = getStoresByMall(mallId).map(s => s.store_id);
  return bidEvents.filter(be => mallStores.includes(be.store_id));
}
