-- Make first user an admin (replace with your actual email)
UPDATE "User" 
SET role = 'SUPER_ADMIN' 
WHERE email = 'pabloblanco0798@gmail.com';

-- Or if you want to create a specific admin user
-- INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
-- VALUES (
--   'admin-id', 
--   'admin@example.com', 
--   'Admin User', 
--   'SUPER_ADMIN', 
--   NOW(), 
--   NOW()
-- );