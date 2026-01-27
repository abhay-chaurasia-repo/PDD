import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  completed: boolean;
}

export interface SavedProperty {
  id?: string;
  address: string;
  county_sqft: number | null;
  county_bedrooms: number | null;
  county_bathrooms: number | null;
  county_year_built: number | null;
  listing_sqft: number | null;
  listing_bedrooms: number | null;
  listing_bathrooms: number | null;
  listing_year_built: number | null;
  checklist_data?: ChecklistItem[];
  is_verified?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}
