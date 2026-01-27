import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// 1. UPDATED INTERFACE WITH CORRECT CASING
interface AttomPropertyResponse {
  status: {
    code: number;
    msg: string;
  };
  property: Array<{
    address: { oneLine: string };
    summary: {
      yearBuilt?: number; // Corrected from yearbuilt
    };
    building: {
      size: {
        universalSize?: number; // Corrected from universalsize
      };
      rooms: {
        bedrooms?: number;
        bathsTotal?: number; // Corrected from bathstotal
      };
    };
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address) {
      return new Response(JSON.stringify({ error: "Address required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const attomResponse = await fetch(
      `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile?address=${encodeURIComponent(address)}`,
      {
        headers: {
          apikey: Deno.env.get("ATTOM_API_KEY") || "",
          Accept: "application/json",
        },
      }
    );

    const data: AttomPropertyResponse = await attomResponse.json();

    if (!data.property || data.property.length === 0) {
      return new Response(JSON.stringify({ error: "No property found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const property = data.property[0];

    // 2. UPDATED MAPPING WITH CORRECT CASING
    const propertyData = {
      address: property.address.oneLine,
      sqft: property.building?.size?.universalSize || null, // Corrected
      bedrooms: property.building?.rooms?.bedrooms || null,
      bathrooms: property.building?.rooms?.bathsTotal || null, // Corrected
      yearBuilt: property.summary?.yearBuilt || null, // Corrected
    };

    return new Response(JSON.stringify(propertyData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
