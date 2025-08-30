-- Promote existing user to admin by updating their username
-- Replace 'dimasset9809@gmail.com' with the actual email of the user you want to promote

UPDATE users 
SET username = 'admin_' || username,
    updated_at = NOW()
WHERE id IN (
    SELECT u.id 
    FROM users u
    JOIN auth.users au ON u.id = au.id
    WHERE au.email = 'dimasset9809@gmail.com'
    AND u.username NOT LIKE 'admin_%'
);

-- Verify the update
SELECT u.username, u.kota, u.provinsi, au.email
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'dimasset9809@gmail.com';
