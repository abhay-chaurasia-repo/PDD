import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')

    if (!address) {
      return new Response(JSON.stringify({ error: 'No address provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch(
      `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile?address=${encodeURIComponent(address)}`,
      {
        headers: {
          'apikey': Deno.env.get('ATTOM_API_KEY') || '',
          'Accept': 'application/json',
        },
      }
    )

    const data = await response.json()
    const property = data.property?.[0]

    if (!property) {
      return new Response(JSON.stringify({ error: 'Property not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // MAP DATA - Note the 'universalSize' with a capital S
    const mappedData = {
      sqft: property.building?.size?.universalSize || 0,
      bedrooms: property.building?.rooms?.beds || 0,
      bathrooms: property.building?.rooms?.bathstotal || 0,
      yearBuilt: property.summary?.yearbuilt || 0,
      address: property.address?.oneLine || address
    }

    return new Response(JSON.stringify(mappedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
