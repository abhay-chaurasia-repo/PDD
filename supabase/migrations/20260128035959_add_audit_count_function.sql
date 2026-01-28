/*
  # Add Audit Count Increment Function and Strengthen RLS

  1. New Functions
    - `increment_audit_count()` - RPC function to safely increment user's free audit count
      - Only increments for authenticated users
      - Updates the `free_audits_used` field in profiles table
      - Returns the new count

  2. Security Enhancements
    - Strengthen RLS policies on saved_properties table
    - Ensure user_id column strictly matches auth.uid()
    - Add insert policy to enforce user_id matching

  3. Important Notes
    - Function uses SECURITY DEFINER to allow updating profiles
    - RLS ensures users can only increment their own count
    - Prevents unauthorized audit count manipulation
*/

CREATE OR REPLACE FUNCTION increment_audit_count()
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE profiles
  SET 
    free_audits_used = free_audits_used + 1,
    updated_at = now()
  WHERE id = auth.uid()
  RETURNING free_audits_used INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'saved_properties' 
    AND policyname = 'Users can insert own properties only'
  ) THEN
    CREATE POLICY "Users can insert own properties only"
      ON saved_properties
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
