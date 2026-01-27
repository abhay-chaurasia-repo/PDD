import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase, SavedProperty, ChecklistItem } from '../lib/supabase';

interface PropertyDetailProps {
  property: SavedProperty;
  onBack: () => void;
  onUpdate: () => void;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'roof', category: 'Physical Audit', label: 'Inspect roof condition', completed: false },
  { id: 'hvac', category: 'Physical Audit', label: 'Check HVAC system age & function', completed: false },
  { id: 'windows', category: 'Physical Audit', label: 'Examine windows for damage', completed: false },
  { id: 'foundation', category: 'Physical Audit', label: 'Inspect foundation for cracks', completed: false },
  { id: 'plumbing', category: 'Physical Audit', label: 'Test water pressure & drainage', completed: false },
  { id: 'electrical', category: 'Physical Audit', label: 'Check electrical panel & outlets', completed: false },
  { id: 'hoa', category: 'Legal/Financial', label: 'Review HOA fees & restrictions', completed: false },
  { id: 'flood', category: 'Legal/Financial', label: 'Verify flood zone status', completed: false },
  { id: 'taxes', category: 'Legal/Financial', label: 'Research property tax history', completed: false },
  { id: 'permits', category: 'Legal/Financial', label: 'Check for unpermitted additions', completed: false },
  { id: 'neighborhood', category: 'Neighborhood', label: 'Walk the neighborhood', completed: false },
  { id: 'schools', category: 'Neighborhood', label: 'Research school ratings', completed: false },
  { id: 'crime', category: 'Neighborhood', label: 'Check crime statistics', completed: false },
  { id: 'noise', category: 'Neighborhood', label: 'Visit at different times for noise levels', completed: false },
];

export default function PropertyDetail({ property, onBack, onUpdate }: PropertyDetailProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    property.checklist_data && property.checklist_data.length > 0
      ? property.checklist_data
      : DEFAULT_CHECKLIST
  );
  const [notes, setNotes] = useState(property.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleVerifyVisit = async () => {
    if (!property.latitude || !property.longitude) {
      setVerificationMessage('Property coordinates not available. Add them to enable verification.');
      return;
    }

    setIsVerifying(true);
    setVerificationMessage('');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;
      const distance = calculateDistance(
        userLat,
        userLon,
        property.latitude,
        property.longitude
      );

      if (distance <= 100) {
        const { error } = await supabase
          .from('saved_properties')
          .update({ is_verified: true })
          .eq('id', property.id);

        if (error) throw error;

        setVerificationMessage('Visit verified! You are at the property.');
        onUpdate();
      } else {
        setVerificationMessage(
          `You are ${Math.round(distance)} meters away. Get within 100 meters to verify.`
        );
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationMessage('Unable to verify location. Please enable location services.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChecklistToggle = async (itemId: string) => {
    const updatedChecklist = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    setChecklist(updatedChecklist);

    try {
      const { error } = await supabase
        .from('saved_properties')
        .update({ checklist_data: updatedChecklist })
        .eq('id', property.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from('saved_properties')
        .update({ notes })
        .eq('id', property.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const groupedChecklist = checklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const completedCount = checklist.filter((item) => item.completed).length;
  const progress = Math.round((completedCount / checklist.length) * 100);

  const getMismatchInfo = () => {
    const mismatches = [];
    if (property.county_sqft && property.listing_sqft) {
      const diff = Math.abs(property.county_sqft - property.listing_sqft);
      const percentage = (diff / property.county_sqft) * 100;
      if (percentage > 10) {
        mismatches.push({
          field: 'Square Footage',
          county: property.county_sqft,
          listing: property.listing_sqft,
          percentage,
        });
      }
    }
    if (property.county_bedrooms && property.listing_bedrooms && property.county_bedrooms !== property.listing_bedrooms) {
      mismatches.push({
        field: 'Bedrooms',
        county: property.county_bedrooms,
        listing: property.listing_bedrooms,
      });
    }
    if (property.county_bathrooms && property.listing_bathrooms && property.county_bathrooms !== property.listing_bathrooms) {
      mismatches.push({
        field: 'Bathrooms',
        county: property.county_bathrooms,
        listing: property.listing_bathrooms,
      });
    }
    if (property.county_year_built && property.listing_year_built && property.county_year_built !== property.listing_year_built) {
      mismatches.push({
        field: 'Year Built',
        county: property.county_year_built,
        listing: property.listing_year_built,
      });
    }
    return mismatches;
  };

  const mismatches = getMismatchInfo();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-3 bg-gray-900 text-yellow-400 rounded-lg hover:bg-gray-800 font-semibold mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Watchlist
        </button>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">
              {property.address}
            </h1>
            {property.is_verified && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-lg text-sm font-semibold">
                <CheckCircle className="w-5 h-5" />
                Verified Visit
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <div className="text-gray-400 text-sm">County Sq Ft</div>
              <div className="font-bold text-xl">{property.county_sqft?.toLocaleString() || '—'}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Bedrooms</div>
              <div className="font-bold text-xl">{property.county_bedrooms || '—'}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Bathrooms</div>
              <div className="font-bold text-xl">{property.county_bathrooms || '—'}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Year Built</div>
              <div className="font-bold text-xl">{property.county_year_built || '—'}</div>
            </div>
          </div>

          {mismatches.length > 0 && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-400 mb-3">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-lg">Data Mismatches Detected</h3>
              </div>
              <div className="space-y-2">
                {mismatches.map((mismatch, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-semibold">{mismatch.field}:</span> County reports{' '}
                    {mismatch.county}, listing claims {mismatch.listing}
                    {mismatch.percentage && (
                      <span className="text-red-300">
                        {' '}
                        ({mismatch.percentage.toFixed(0)}% difference)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!property.is_verified && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">GPS Verification</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {property.latitude && property.longitude
                      ? 'Verify your physical visit to this property using your device location.'
                      : 'Add property coordinates to enable GPS verification.'}
                  </p>
                  <button
                    onClick={handleVerifyVisit}
                    disabled={isVerifying || !property.latitude || !property.longitude}
                    className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 disabled:bg-gray-700 disabled:text-gray-500 font-semibold flex items-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4" />
                        Verify My Visit
                      </>
                    )}
                  </button>
                  {verificationMessage && (
                    <p className="mt-3 text-sm font-semibold text-yellow-400">
                      {verificationMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-yellow-400">Due Diligence Checklist</h2>
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-400">{progress}%</div>
              <div className="text-sm text-gray-400">
                {completedCount} of {checklist.length} completed
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-3 mb-8">
            <div
              className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="space-y-6">
            {Object.entries(groupedChecklist).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-lg font-bold text-white mb-3 border-b border-gray-700 pb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleChecklistToggle(item.id)}
                        className="w-5 h-5 rounded border-2 border-gray-600 bg-gray-700 checked:bg-yellow-400 checked:border-yellow-400 cursor-pointer"
                      />
                      <span
                        className={`flex-1 ${
                          item.completed ? 'text-gray-500 line-through' : 'text-white'
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.completed && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
            placeholder="Add your notes about this property..."
            className="w-full h-32 px-4 py-3 bg-gray-800 text-white rounded-lg border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 resize-none"
          />
          <div className="text-xs text-gray-500 mt-2">
            {isSavingNotes ? 'Saving...' : 'Notes are saved automatically'}
          </div>
        </div>
      </div>
    </div>
  );
}
