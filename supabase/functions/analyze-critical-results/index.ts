import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reports } = await req.json();

    if (!reports || reports.length === 0) {
      return new Response(
        JSON.stringify({ warnings: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service is not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const systemPrompt = `You are a medical data analyzer. Your task is to analyze medical reports and identify critical health issues that require immediate attention.

For each report, extract numeric values (hemoglobin, cholesterol, blood sugar, iron, BMI, etc.) and compare them against normal ranges.

Flag any critical results with:
1. The parameter name
2. The actual value
3. The severity (critical/warning)
4. A clear recommendation

Normal ranges reference:
- Hemoglobin: Men 13.5-17.5 g/dL, Women 12-15.5 g/dL (critical if <8 or >20)
- Cholesterol: <200 mg/dL (critical if >240)
- Blood Sugar (fasting): 70-100 mg/dL (critical if <50 or >200)
- Iron: Men 60-170 μg/dL, Women 50-150 μg/dL (critical if <30 or >200)
- BMI: 18.5-24.9 (critical if <16 or >40)

Return ONLY a JSON array of warnings. Each warning must have:
{
  "parameter": "parameter name",
  "value": "actual value with unit",
  "severity": "critical" or "warning",
  "message": "clear recommendation",
  "reportName": "report name",
  "date": "report date"
}

If no critical issues found, return empty array [].`;

    const reportsText = reports.map((r: any) => 
      `Report: ${r.report_name}\nDate: ${r.created_at}\nContent: ${r.summary || r.extracted_text || ''}`
    ).join('\n\n---\n\n');

    console.log('Calling Lovable AI for critical results analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze these medical reports and identify any critical results:\n\n${reportsText}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to analyze reports' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ warnings: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let warnings = [];
    try {
      const parsed = JSON.parse(content);
      warnings = parsed.warnings || parsed || [];
    } catch {
      warnings = [];
    }

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({ warnings }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-critical-results function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
