-- V3: point one seeded row per role at a real Google account so each role can be
-- reached with "Sign in with Google". Only one row per role is switched; every other
-- row keeps its placeholder address, since those are display-only data with no login.
-- New migration rather than an edit to V2: V2 is already applied and Flyway
-- validates its checksum.

UPDATE `User` SET email = 'sudarshan.kulkarni.cse24@itbhu.ac.in' WHERE user_id = 1;
UPDATE Tenant SET email = '6000pro1140@gmail.com' WHERE tenant_id = 1;
UPDATE Employee SET email = 'sudarshnamogha@gmail.com' WHERE employee_id = 1;
UPDATE Employee SET email = 'sudarshan.m.kulkarni@gmail.com' WHERE employee_id = 2;
UPDATE Mall_Manager SET email = 'clashquest001@gmail.com' WHERE manager_id = 1;
UPDATE Enterprise_Executive SET email = 'amoghsudarshan@gmail.com' WHERE executive_id = 1;