/*
  # Create Saved Properties Table

  1. New Tables
    - `saved_properties`
      - `id` (uuid, primary key) - Unique identifier for each saved property
      - `address` (text) - Full property address
      - `county_sqft` (integer) - Square footage from county records
      - `county_bedrooms` (integer) - Bedrooms from county records
      - `county_bathrooms` (numeric) - Bathrooms from county records
      - `county_year_built` (integer) - Year built from county records
      - `listing_sqft` (integer) - Square footage from listing
      - `listing_bedrooms` (integer) - Bedrooms from listing
      - `listing_bathrooms` (numeric) - Bathrooms from listing
      - `listing_year_built` (integer) - Year built from listing
      - `created_at` (timestamptz) - When the property was saved
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `saved_properties` table
    - Add policy for public access (since no auth is implemented)

  3. Important Notes
    - This table stores property comparisons for due diligence
    - County data represents official records
    - Listing data is user-entered from Zillow/Redfin
    - Discrepancies are calculated on the client side
*/

CREATE TABLE IF NOT EXISTS saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  county_sqft integer,
  county_bedrooms integer,
  county_bathrooms numeric(3,1),
  county_year_built integer,
  listing_sqft integer,
  listing_bedrooms integer,
  listing_bathrooms numeric(3,1),
  listing_year_built integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- Allow public access for reading and writing (no auth required)
CREATE POLICY "Allow public read access"
  ON saved_properties
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access"
  ON saved_properties
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON saved_properties
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create index for faster address lookups
CREATE INDEX IF NOT EXISTS idx_saved_properties_address ON saved_properties(address);
CREATE INDEX IF NOT EXISTS idx_saved_properties_created_at ON saved_properties(created_at DESC);