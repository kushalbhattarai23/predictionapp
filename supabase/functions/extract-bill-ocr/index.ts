import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is authenticated
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Starting OCR extraction for bill image...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a bill/receipt OCR expert. Extract all items from the bill image and return them as structured JSON data.
            
For each item found, extract:
- name: The item name/description (string)
- quantity: The quantity (number, default to 1 if not visible)
- rate: The unit price (number)
- amount: Total amount for this item (number, should be quantity * rate)

Return ONLY a valid JSON object with this structure:
{
  "items": [
    { "name": "Item Name", "quantity": 1, "rate": 100, "amount": 100 },
    ...
  ],
  "subtotal": number (optional),
  "discount": number (optional, any discount applied to the bill),
  "total": number (optional, final total after discount),
  "billTitle": "string" (optional, extracted from header if visible)
}

Be accurate with numbers. If you can't read something clearly, make your best guess based on context.
Look for discount, service charge, VAT, or any deductions mentioned on the receipt.
Do not include any markdown formatting, just pure JSON.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all items from this bill/receipt image and return the structured data:"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("AI response received:", JSON.stringify(data));

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "No content in AI response" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let extractedData;
    try {
      // Remove any markdown code blocks if present
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.slice(7);
      }
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.slice(3);
      }
      if (jsonContent.endsWith('```')) {
        jsonContent = jsonContent.slice(0, -3);
      }
      extractedData = JSON.parse(jsonContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse bill data", rawContent: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Successfully extracted bill data:", JSON.stringify(extractedData));

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in extract-bill-ocr:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
