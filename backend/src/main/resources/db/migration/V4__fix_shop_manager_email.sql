-- Corrects the shop manager login address to the real Google account and removes
-- the throwaway customer row created while testing demo-mode sign-in.
UPDATE Employee
SET email = 'sudarshanamogha@gmail.com'
WHERE employee_id = 1 AND email = 'sudarshnamogha@gmail.com';

DELETE FROM `user`
WHERE email = 'sudarshanamogha@gmail.com';