/*
  # Create Community Insights Table

  1. New Tables
    - `community_insights`
      - `id` (uuid, primary key) - Unique identifier for each insight
      - `property_id` (uuid, foreign key) - References saved_properties table
      - `user_id` (uuid) - User who created the insight (optional for anonymous)
      - `category` (text) - Type of insight: 'Noise', 'Traffic', 'Neighbors', 'Red Flag', 'Pro', 'General'
      - `note` (text) - The actual insight/comment from the user
      - `created_at` (timestamptz) - Timestamp when insight was created

  2. Security
    - Enable RLS on `community_insights` table
    - Add policy for public users to read all insights
    - Add policy for authenticated users to insert insights
    - Add policy for users to update/delete their own insights

  3. Indexes
    - Index on property_id for faster lookups
    - Index on created_at for chronological ordering
*/

CREATE TABLE IF NOT EXISTS community_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES saved_properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  category text NOT NULL,
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read insights"
  ON community_insights
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert insights"
  ON community_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own insights"
  ON community_insights
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON community_insights
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_community_insights_property_id 
  ON community_insights(property_id);

CREATE INDEX IF NOT EXISTS idx_community_insights_created_at 
  ON community_insights(created_at DESC);