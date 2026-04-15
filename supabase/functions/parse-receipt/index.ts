import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Home', 'Other'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 is required' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'low' },
              },
              {
                type: 'text',
                text: `Parse this receipt image and return a JSON object with exactly these fields:
- amount: the total amount paid as a number (e.g. 12.50), or null if not found
- vendor: the business/store name as a string, or null if not found
- category: one of ${CATEGORIES.join(', ')} that best matches this purchase, or "Other" if unsure

Respond with only valid JSON, nothing else.`,
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 150,
      }),
    });

    if (!openAiRes.ok) {
      const body = await openAiRes.text();
      throw new Error(`OpenAI error ${openAiRes.status}: ${body}`);
    }

    const data = await openAiRes.json();
    const raw = JSON.parse(data.choices[0].message.content);

    const result = {
      amount: typeof raw.amount === 'number' ? raw.amount : null,
      vendor: typeof raw.vendor === 'string' ? raw.vendor : null,
      category: CATEGORIES.includes(raw.category) ? raw.category : 'Other',
    };

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
