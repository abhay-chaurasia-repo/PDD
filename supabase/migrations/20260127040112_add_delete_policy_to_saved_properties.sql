/*
  # Add DELETE Policy to Saved Properties

  1. Security Changes
    - Add DELETE policy to allow public users to delete their saved properties
    - Policy allows anyone to delete from the saved_properties table
    - This matches the existing permissive access pattern for public users

  2. Notes
    - The table already has RLS enabled
    - Existing policies allow public SELECT, INSERT, and UPDATE
    - This adds the missing DELETE capability
*/

-- Add DELETE policy for saved_properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_properties' 
    AND policyname = 'Allow public delete'
  ) THEN
    CREATE POLICY "Allow public delete"
      ON saved_properties
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;
