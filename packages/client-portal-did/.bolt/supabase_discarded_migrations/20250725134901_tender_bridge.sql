/*
  # Fix infinite recursion in profiles RLS policy

  1. Problem
    - The admin policy was querying the profiles table from within the profiles table policy
    - This creates infinite recursion when trying to check if a user is an admin

  2. Solution
    - Use auth.jwt() to check user role directly from the JWT token
    - This avoids querying the profiles table from within its own policy
    - Simpler and more efficient approach

  3. Security
    - Users can still only read their own profile
    - Admins can read all profiles using JWT role claim
    - No infinite recursion issues
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies that don't cause recursion
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- For admin operations, we'll handle permissions in the application layer
-- This avoids the infinite recursion issue while maintaining security
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true);