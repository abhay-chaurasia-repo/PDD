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
    address: {
      oneLine: string;
      latitude?: string;
      longitude?: string;
    };
    summary: {
      yearBuilt?: number;
    };
    building: {
      size: {
        universalSize?: number;
      };
      rooms: {
        bedrooms?: number;
        bathsTotal?: number;
      };
    };
    school?: {
      elementarySchool?: {
        name?: string;
        rating?: number;
        distance?: number;
      };
      middleSchool?: {
        name?: string;
        rating?: number;
        distance?: number;
      };
      highSchool?: {
        name?: string;
        rating?: number;
        distance?: number;
      };
    };
    area?: {
      mediaSalePrice?: number;
      medianSalePriceRange?: string;
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
      sqft: property.building?.size?.universalSize || null,
      bedrooms: property.building?.rooms?.bedrooms || null,
      bathrooms: property.building?.rooms?.bathsTotal || null,
      yearBuilt: property.summary?.yearBuilt || null,
      latitude: property.address?.latitude ? parseFloat(property.address.latitude) : null,
      longitude: property.address?.longitude ? parseFloat(property.address.longitude) : null,
      neighborhood: {
        schools: {
          elementary: property.school?.elementarySchool ? {
            name: property.school.elementarySchool.name || null,
            rating: property.school.elementarySchool.rating || null,
            distance: property.school.elementarySchool.distance || null,
          } : null,
          middle: property.school?.middleSchool ? {
            name: property.school.middleSchool.name || null,
            rating: property.school.middleSchool.rating || null,
            distance: property.school.middleSchool.distance || null,
          } : null,
          high: property.school?.highSchool ? {
            name: property.school.highSchool.name || null,
            rating: property.school.highSchool.rating || null,
            distance: property.school.highSchool.distance || null,
          } : null,
        },
        marketData: {
          medianSalePrice: property.area?.mediaSalePrice || null,
          priceRange: property.area?.medianSalePriceRange || null,
        },
      },
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
