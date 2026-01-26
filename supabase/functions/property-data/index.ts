import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return new Response(JSON.stringify({ error: 'No address provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const attomApiKey = Deno.env.get('ATTOM_API_KEY');
    if (!attomApiKey) {
      console.error('ATTOM_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching property data for address:', address);

    const response = await fetch(
      `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address=${encodeURIComponent(address)}`,
      {
        headers: {
          'apikey': attomApiKey,
          'Accept': 'application/json',
        },
      }
    );

    console.log('ATTOM API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ATTOM API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to fetch from ATTOM API', details: errorText }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('ATTOM API response data:', JSON.stringify(data, null, 2));

    const property = data.property?.[0];

    if (!property) {
      console.error('No property found in response');
      return new Response(JSON.stringify({ error: 'Property not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mappedData = {
      sqft: property.building?.size?.universalSize || 0,
      bedrooms: property.building?.rooms?.beds || 0,
      bathrooms: property.building?.rooms?.bathstotal || 0,
      yearBuilt: property.summary?.yearbuilt || 0,
      address: property.address?.oneLine || address
    };

    console.log('Mapped data:', mappedData);

    return new Response(JSON.stringify(mappedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
