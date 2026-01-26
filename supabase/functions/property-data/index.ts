import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AttomPropertyResponse {
  status: {
    version: string;
    code: number;
    msg: string;
    total: number;
    transactionID: string;
  };
  property: Array<{
    identifier: {
      Id: number;
      fips: string;
      apn: string;
    };
    address: {
      country: string;
      countrySubd: string;
      line1: string;
      line2: string;
      locality: string;
      matchCode: string;
      oneLine: string;
      postal1: string;
      postal2: string;
      postal3: string;
    };
    summary: {
      yearbuilt?: number;
    };
    building: {
      size: {
        universalsize?: number;
      };
      rooms: {
        bedrooms?: number;
        bathstotal?: number;
      };
    };
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address) {
      return new Response(
        JSON.stringify({ error: "Address parameter is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const attomApiKey = Deno.env.get("ATTOM_API_KEY");
    if (!attomApiKey) {
      return new Response(
        JSON.stringify({ error: "ATTOM API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const attomUrl = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile?address=${encodeURIComponent(
      address
    )}`;

    const attomResponse = await fetch(attomUrl, {
      method: "GET",
      headers: {
        apikey: attomApiKey,
        Accept: "application/json",
      },
    });

    if (!attomResponse.ok) {
      const errorText = await attomResponse.text();
      console.error("ATTOM API error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch property data",
          details: errorText,
        }),
        {
          status: attomResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data: AttomPropertyResponse = await attomResponse.json();

    if (!data.property || data.property.length === 0) {
      return new Response(
        JSON.stringify({ error: "No property data found for this address" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const property = data.property[0];

    const propertyData = {
      address: property.address.oneLine,
      sqft: property.building?.size?.universalsize || null,
      bedrooms: property.building?.rooms?.bedrooms || null,
      bathrooms: property.building?.rooms?.bathstotal || null,
      yearBuilt: property.summary?.yearbuilt || null,
    };

    return new Response(JSON.stringify(propertyData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in property-data function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
