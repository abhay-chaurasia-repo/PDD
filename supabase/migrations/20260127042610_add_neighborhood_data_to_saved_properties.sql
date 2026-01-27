/*
  # Add Neighborhood Data Column

  1. Changes
    - Add `neighborhood_data` (jsonb) column to saved_properties table
      - Stores school ratings, market data, and other neighborhood context
      - Sourced from ATTOM API when property is saved
      - Default empty object for backward compatibility

  2. Security
    - No changes to RLS policies needed
    - Existing policies cover the new column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_properties' AND column_name = 'neighborhood_data'
  ) THEN
    ALTER TABLE saved_properties ADD COLUMN neighborhood_data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;