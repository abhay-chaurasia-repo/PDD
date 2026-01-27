/*
  # Secure Tables with User Authentication

  1. Changes to saved_properties
    - Add `user_id` (uuid) column referencing auth.users(id)
    - Remove public access policies
    - Ensure only authenticated users can access their own data

  2. Changes to community_insights
    - Update policies to require authentication
    - Change from public read to authenticated read

  3. Security Enhancements
    - All data is now scoped to authenticated users
    - No anonymous access to saved properties
    - Community insights require authentication to view
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_properties' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE saved_properties ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);

DROP POLICY IF EXISTS "Allow public read access" ON saved_properties;
DROP POLICY IF EXISTS "Allow public insert access" ON saved_properties;
DROP POLICY IF EXISTS "Allow public update access" ON saved_properties;
DROP POLICY IF EXISTS "Allow public delete" ON saved_properties;
DROP POLICY IF EXISTS "Users can view own properties" ON saved_properties;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'saved_properties' 
    AND policyname = 'Users can read own properties'
  ) THEN
    CREATE POLICY "Users can read own properties"
      ON saved_properties
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DROP POLICY IF EXISTS "Anyone can read insights" ON community_insights;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'community_insights' 
    AND policyname = 'Authenticated users can read all insights'
  ) THEN
    CREATE POLICY "Authenticated users can read all insights"
      ON community_insights
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;