/*
  # Add Watchlist and Checklist Features

  1. New Columns
    - `checklist_data` (jsonb)
      - Stores the state of the interactive checklist with categories
      - Each item has a category, label, and completed status
    - `is_verified` (boolean)
      - Tracks if the user has physically visited the property
      - Verified via GPS proximity check
    - `latitude` (decimal)
      - Stores property latitude for GPS verification
    - `longitude` (decimal)
      - Stores property longitude for GPS verification
    - `notes` (text)
      - Optional notes about the property

  2. Changes
    - Add new columns to saved_properties table with safe defaults
    - Maintain backward compatibility with existing data

  3. Security
    - No changes to RLS policies needed
    - Existing policies cover new columns
*/

-- Add new columns to saved_properties table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_properties' AND column_name = 'checklist_data'
  ) THEN
    ALTER TABLE saved_properties ADD COLUMN checklist_data jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_properties' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE saved_properties ADD COLUMN is_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_properties' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE saved_properties ADD COLUMN latitude decimal(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_properties' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE saved_properties ADD COLUMN longitude decimal(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_properties' AND column_name = 'notes'
  ) THEN
    ALTER TABLE saved_properties ADD COLUMN notes text;
  END IF;
END $$;
