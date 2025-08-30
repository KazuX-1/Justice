-- Create RPC function to promote user to admin
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    result JSON;
BEGIN
    -- Find user by email
    SELECT u.id, u.username, au.email
    INTO user_record
    FROM users u
    JOIN auth.users au ON u.id = au.id
    WHERE au.email = user_email;
    
    -- Check if user exists
    IF user_record.id IS NULL THEN
        result := json_build_object(
            'success', false,
            'message', 'User tidak ditemukan'
        );
        RETURN result;
    END IF;
    
    -- Check if already admin
    IF user_record.username LIKE 'admin_%' THEN
        result := json_build_object(
            'success', false,
            'message', 'User sudah menjadi admin'
        );
        RETURN result;
    END IF;
    
    -- Update username to admin
    UPDATE users 
    SET username = 'admin_' || username,
        updated_at = NOW()
    WHERE id = user_record.id;
    
    result := json_build_object(
        'success', true,
        'message', 'User berhasil dipromosikan menjadi admin',
        'old_username', user_record.username,
        'new_username', 'admin_' || user_record.username
    );
    
    RETURN result;
END;
$$;
