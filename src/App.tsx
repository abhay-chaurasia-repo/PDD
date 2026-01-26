import { useState } from 'react';
import { Home, Save, Check, Loader2 } from 'lucide-react';
import { supabase, SavedProperty } from './lib/supabase';

interface PropertyData {
  sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  yearBuilt: number | null;
}

interface Mismatch {
  field: string;
  severity: 'error' | 'warning' | 'none';
  percentage: number | null;
  message: string;
}

function App() {
  const [address, setAddress] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCountyData, setIsLoadingCountyData] = useState(false);

  const [countyData, setCountyData] = useState<PropertyData>({
    sqft: null,
    bedrooms: null,
    bathrooms: null,
    yearBuilt: null,
  });

  const [listingData, setListingData] = useState<PropertyData>({
    sqft: null,
    bedrooms: null,
    bathrooms: null,
    yearBuilt: null,
  });

  const handleAddressSubmit = async () => {
    if (!address.trim()) return;

    setShowComparison(true);
    setIsLoadingCountyData(true);
    setCountyData({
      sqft: null,
      bedrooms: null,
      bathrooms: null,
      yearBuilt: null,
    });

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/property-data?address=${encodeURIComponent(address)}`;
      const token = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('Fetching property data from:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': token,
          'Content-Type': 'application/json',
        },
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching property data:', errorData);
        throw new Error(errorData.error || 'Failed to fetch property data');
      }

      const data = await response.json();
      console.log('API response data:', data);

      if (data.address) {
        setAddress(data.address);
      }

      setCountyData({
        sqft: data.sqft,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        yearBuilt: data.yearBuilt,
      });
    } catch (error) {
      console.error('Error fetching county data:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      setCountyData({
        sqft: null,
        bedrooms: null,
        bathrooms: null,
        yearBuilt: null,
      });
    } finally {
      setIsLoadingCountyData(false);
    }
  };

  const calculateMismatch = (
    field: string,
    county: number | null,
    listing: number | null
  ): Mismatch => {
    if (county === null || listing === null) {
      return {
        field,
        severity: 'none',
        percentage: null,
        message: '',
      };
    }

    const diff = Math.abs(county - listing);
    const percentage = (diff / county) * 100;

    if (percentage === 0) {
      return {
        field,
        severity: 'none',
        percentage: 0,
        message: 'Match',
      };
    }

    if (percentage > 10) {
      const direction = listing > county ? 'larger' : 'smaller';
      return {
        field,
        severity: 'error',
        percentage,
        message: `Listing is ${percentage.toFixed(0)}% ${direction} than county record`,
      };
    }

    const direction = listing > county ? 'larger' : 'smaller';
    return {
      field,
      severity: 'warning',
      percentage,
      message: `Listing is ${percentage.toFixed(0)}% ${direction} than county record`,
    };
  };

  const mismatches = {
    sqft: calculateMismatch('Square Footage', countyData.sqft, listingData.sqft),
    bedrooms: calculateMismatch('Bedrooms', countyData.bedrooms, listingData.bedrooms),
    bathrooms: calculateMismatch('Bathrooms', countyData.bathrooms, listingData.bathrooms),
    yearBuilt: calculateMismatch('Year Built', countyData.yearBuilt, listingData.yearBuilt),
  };

  const handleSaveProperty = async () => {
    setIsSaving(true);
    try {
      const propertyData: SavedProperty = {
        address,
        county_sqft: countyData.sqft,
        county_bedrooms: countyData.bedrooms,
        county_bathrooms: countyData.bathrooms,
        county_year_built: countyData.yearBuilt,
        listing_sqft: listingData.sqft,
        listing_bedrooms: listingData.bedrooms,
        listing_bathrooms: listingData.bathrooms,
        listing_year_built: listingData.yearBuilt,
      };

      const { error } = await supabase
        .from('saved_properties')
        .insert(propertyData);

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving property:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!showComparison) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400 rounded-lg mb-6">
              <Home className="w-12 h-12 text-black" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              Paste your listing—
              <br />
              get the county reality
            </h1>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddressSubmit()}
              placeholder="Enter property address..."
              className="w-full px-6 py-6 text-xl md:text-2xl bg-white text-black border-4 border-yellow-400 rounded-lg focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 placeholder-gray-500"
              style={{ minHeight: '72px' }}
            />
            <button
              onClick={handleAddressSubmit}
              disabled={!address.trim()}
              className="w-full px-6 py-6 text-xl md:text-2xl font-bold bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 active:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
              style={{ minHeight: '72px' }}
            >
              Check Property
            </button>
          </div>

          <p className="text-gray-400 text-center mt-8 text-lg">
            Verify listing claims against official county records in seconds
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="mb-6">
          <button
            onClick={() => {
              setShowComparison(false);
              setAddress('');
              setIsLoadingCountyData(false);
              setCountyData({
                sqft: null,
                bedrooms: null,
                bathrooms: null,
                yearBuilt: null,
              });
              setListingData({
                sqft: null,
                bedrooms: null,
                bathrooms: null,
                yearBuilt: null,
              });
            }}
            className="flex items-center gap-2 px-4 py-3 bg-gray-900 text-yellow-400 rounded-lg hover:bg-gray-800 font-semibold"
            style={{ minHeight: '48px' }}
          >
            <Home className="w-5 h-5" />
            New Search
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 break-words">
            {address}
          </h2>
        </div>

        <div className="bg-gray-900 rounded-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-yellow-400">
                  <th className="text-left p-4 md:p-6 text-lg md:text-xl font-bold text-yellow-400">
                    Property Detail
                  </th>
                  <th className="text-center p-4 md:p-6 text-lg md:text-xl font-bold text-yellow-400">
                    County Record
                  </th>
                  <th className="text-center p-4 md:p-6 text-lg md:text-xl font-bold text-yellow-400">
                    Listing Entry
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  className={`border-b border-gray-800 ${
                    mismatches.sqft.severity === 'error'
                      ? 'bg-red-950'
                      : mismatches.sqft.severity === 'warning'
                      ? 'bg-yellow-950'
                      : ''
                  }`}
                >
                  <td className="p-4 md:p-6 font-semibold text-base md:text-lg">
                    Square Footage
                  </td>
                  <td className="p-4 md:p-6 text-center text-xl md:text-2xl font-bold">
                    {isLoadingCountyData ? (
                      <div className="flex items-center justify-center gap-2 text-yellow-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Fetching Public Records...</span>
                      </div>
                    ) : (
                      countyData.sqft?.toLocaleString() || '—'
                    )}
                  </td>
                  <td className="p-4 md:p-6">
                    <input
                      type="number"
                      value={listingData.sqft || ''}
                      onChange={(e) =>
                        setListingData({
                          ...listingData,
                          sqft: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="Enter sqft"
                      className="w-full px-4 py-3 text-xl md:text-2xl text-center bg-black text-white border-2 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      style={{ minHeight: '56px' }}
                    />
                    {mismatches.sqft.severity !== 'none' && (
                      <p
                        className={`text-sm mt-2 font-semibold ${
                          mismatches.sqft.severity === 'error'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {mismatches.sqft.message}
                      </p>
                    )}
                  </td>
                </tr>

                <tr
                  className={`border-b border-gray-800 ${
                    mismatches.bedrooms.severity === 'error'
                      ? 'bg-red-950'
                      : mismatches.bedrooms.severity === 'warning'
                      ? 'bg-yellow-950'
                      : ''
                  }`}
                >
                  <td className="p-4 md:p-6 font-semibold text-base md:text-lg">
                    Bedrooms
                  </td>
                  <td className="p-4 md:p-6 text-center text-xl md:text-2xl font-bold">
                    {isLoadingCountyData ? (
                      <div className="flex items-center justify-center gap-2 text-yellow-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Fetching Public Records...</span>
                      </div>
                    ) : (
                      countyData.bedrooms || '—'
                    )}
                  </td>
                  <td className="p-4 md:p-6">
                    <input
                      type="number"
                      value={listingData.bedrooms || ''}
                      onChange={(e) =>
                        setListingData({
                          ...listingData,
                          bedrooms: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="Enter count"
                      className="w-full px-4 py-3 text-xl md:text-2xl text-center bg-black text-white border-2 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      style={{ minHeight: '56px' }}
                    />
                    {mismatches.bedrooms.severity !== 'none' && (
                      <p
                        className={`text-sm mt-2 font-semibold ${
                          mismatches.bedrooms.severity === 'error'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {mismatches.bedrooms.message}
                      </p>
                    )}
                  </td>
                </tr>

                <tr
                  className={`border-b border-gray-800 ${
                    mismatches.bathrooms.severity === 'error'
                      ? 'bg-red-950'
                      : mismatches.bathrooms.severity === 'warning'
                      ? 'bg-yellow-950'
                      : ''
                  }`}
                >
                  <td className="p-4 md:p-6 font-semibold text-base md:text-lg">
                    Bathrooms
                  </td>
                  <td className="p-4 md:p-6 text-center text-xl md:text-2xl font-bold">
                    {isLoadingCountyData ? (
                      <div className="flex items-center justify-center gap-2 text-yellow-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Fetching Public Records...</span>
                      </div>
                    ) : (
                      countyData.bathrooms || '—'
                    )}
                  </td>
                  <td className="p-4 md:p-6">
                    <input
                      type="number"
                      step="0.5"
                      value={listingData.bathrooms || ''}
                      onChange={(e) =>
                        setListingData({
                          ...listingData,
                          bathrooms: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      placeholder="Enter count"
                      className="w-full px-4 py-3 text-xl md:text-2xl text-center bg-black text-white border-2 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      style={{ minHeight: '56px' }}
                    />
                    {mismatches.bathrooms.severity !== 'none' && (
                      <p
                        className={`text-sm mt-2 font-semibold ${
                          mismatches.bathrooms.severity === 'error'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {mismatches.bathrooms.message}
                      </p>
                    )}
                  </td>
                </tr>

                <tr
                  className={`${
                    mismatches.yearBuilt.severity === 'error'
                      ? 'bg-red-950'
                      : mismatches.yearBuilt.severity === 'warning'
                      ? 'bg-yellow-950'
                      : ''
                  }`}
                >
                  <td className="p-4 md:p-6 font-semibold text-base md:text-lg">
                    Year Built
                  </td>
                  <td className="p-4 md:p-6 text-center text-xl md:text-2xl font-bold">
                    {isLoadingCountyData ? (
                      <div className="flex items-center justify-center gap-2 text-yellow-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Fetching Public Records...</span>
                      </div>
                    ) : (
                      countyData.yearBuilt || '—'
                    )}
                  </td>
                  <td className="p-4 md:p-6">
                    <input
                      type="number"
                      value={listingData.yearBuilt || ''}
                      onChange={(e) =>
                        setListingData({
                          ...listingData,
                          yearBuilt: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="Enter year"
                      className="w-full px-4 py-3 text-xl md:text-2xl text-center bg-black text-white border-2 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      style={{ minHeight: '56px' }}
                    />
                    {mismatches.yearBuilt.severity !== 'none' && (
                      <p
                        className={`text-sm mt-2 font-semibold ${
                          mismatches.yearBuilt.severity === 'error'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {mismatches.yearBuilt.message}
                      </p>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={handleSaveProperty}
          disabled={isSaving}
          className="w-full px-6 py-6 text-xl md:text-2xl font-bold bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 active:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 transition-colors flex items-center justify-center gap-3"
          style={{ minHeight: '72px' }}
        >
          <Save className="w-6 h-6" />
          {isSaving ? 'Saving...' : 'Save Property'}
        </button>
      </div>

      {showSuccess && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-up z-50">
          <div className="bg-white rounded-full p-1">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <span className="font-semibold text-lg">
            Property saved to your watchlist
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
