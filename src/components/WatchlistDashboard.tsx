import { useEffect, useState } from 'react';
import { Home, CheckCircle, AlertCircle, Trash2, GraduationCap } from 'lucide-react';
import { supabase, SavedProperty } from '../lib/supabase';

interface WatchlistDashboardProps {
  onPropertySelect: (property: SavedProperty) => void;
  onNewSearch: () => void;
}

export default function WatchlistDashboard({ onPropertySelect, onNewSearch }: WatchlistDashboardProps) {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProperty = async (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to remove this property from your watchlist?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      setProperties(properties.filter(p => p.id !== propertyId));
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const calculateProgress = (property: SavedProperty): number => {
    if (!property.checklist_data || property.checklist_data.length === 0) {
      return 0;
    }
    const completed = property.checklist_data.filter(item => item.completed).length;
    return Math.round((completed / property.checklist_data.length) * 100);
  };

  const getMismatchCount = (property: SavedProperty): number => {
    let count = 0;
    if (property.county_sqft && property.listing_sqft) {
      const diff = Math.abs(property.county_sqft - property.listing_sqft);
      const percentage = (diff / property.county_sqft) * 100;
      if (percentage > 10) count++;
    }
    if (property.county_bedrooms && property.listing_bedrooms) {
      const diff = Math.abs(property.county_bedrooms - property.listing_bedrooms);
      const percentage = (diff / property.county_bedrooms) * 100;
      if (percentage > 10) count++;
    }
    if (property.county_bathrooms && property.listing_bathrooms) {
      const diff = Math.abs(property.county_bathrooms - property.listing_bathrooms);
      const percentage = (diff / property.county_bathrooms) * 100;
      if (percentage > 10) count++;
    }
    if (property.county_year_built && property.listing_year_built) {
      const diff = Math.abs(property.county_year_built - property.listing_year_built);
      const percentage = (diff / property.county_year_built) * 100;
      if (percentage > 10) count++;
    }
    return count;
  };

  const calculateNeighborhoodScore = (property: SavedProperty): number | null => {
    if (!property.neighborhood_data?.schools) return null;
    const schools = property.neighborhood_data.schools;
    const ratings = [
      schools.elementary?.rating,
      schools.middle?.rating,
      schools.high?.rating,
    ].filter((r): r is number => r !== null && r !== undefined);

    if (ratings.length === 0) return null;
    return Math.round(ratings.reduce((sum, r) => sum + r, 0) / ratings.length);
  };

  const getScoreBgColor = (score: number | null) => {
    if (!score) return 'bg-gray-700';
    if (score >= 8) return 'bg-green-600';
    if (score >= 6) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading watchlist...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
              My Watchlist
            </h1>
            <p className="text-gray-400 text-lg">
              {properties.length} {properties.length === 1 ? 'property' : 'properties'} saved
            </p>
          </div>
          <button
            onClick={onNewSearch}
            className="flex items-center gap-2 px-4 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 font-semibold"
          >
            <Home className="w-5 h-5" />
            New Search
          </button>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-900 rounded-lg mb-6">
              <Home className="w-12 h-12 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-400 mb-4">
              No properties saved yet
            </h2>
            <p className="text-gray-500 mb-8">
              Start by searching for a property and saving it to your watchlist
            </p>
            <button
              onClick={onNewSearch}
              className="px-6 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 font-semibold text-lg"
            >
              Search Properties
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {properties.map((property) => {
              const progress = calculateProgress(property);
              const mismatchCount = getMismatchCount(property);
              const neighborhoodScore = calculateNeighborhoodScore(property);

              return (
                <div
                  key={property.id}
                  className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition-colors border-2 border-transparent hover:border-yellow-400 relative"
                >
                  <button
                    onClick={(e) => handleDeleteProperty(e, property.id!)}
                    className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors z-10"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div
                    onClick={() => onPropertySelect(property)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 pr-12">
                        <div className="flex items-start gap-2 mb-3 flex-wrap">
                          <h3 className="text-xl md:text-2xl font-bold text-white">
                            {property.address}
                          </h3>
                          {property.is_verified && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-green-600 rounded-full text-sm font-semibold whitespace-nowrap">
                              <CheckCircle className="w-4 h-4" />
                              Verified
                            </div>
                          )}
                          {neighborhoodScore && (
                            <div className={`flex items-center gap-1 px-3 py-1 ${getScoreBgColor(neighborhoodScore)} rounded-full text-sm font-semibold whitespace-nowrap`}>
                              <GraduationCap className="w-4 h-4" />
                              {neighborhoodScore}/10
                            </div>
                          )}
                        </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <div className="text-gray-400">Sq Ft</div>
                          <div className="font-semibold text-white">
                            {property.county_sqft?.toLocaleString() || '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Beds</div>
                          <div className="font-semibold text-white">
                            {property.county_bedrooms || '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Baths</div>
                          <div className="font-semibold text-white">
                            {property.county_bathrooms || '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Year Built</div>
                          <div className="font-semibold text-white">
                            {property.county_year_built || '—'}
                          </div>
                        </div>
                      </div>

                      {mismatchCount > 0 && (
                        <div className="flex items-center gap-2 text-red-400 mb-3">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-semibold">
                            {mismatchCount} data {mismatchCount === 1 ? 'mismatch' : 'mismatches'} detected
                          </span>
                        </div>
                      )}
                    </div>

                      <div className="md:w-48">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Checklist</span>
                          <span className="text-sm font-bold text-yellow-400">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {property.checklist_data && property.checklist_data.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {property.checklist_data.filter(item => item.completed).length} of{' '}
                            {property.checklist_data.length} items
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
