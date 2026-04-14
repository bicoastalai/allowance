import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { transactions, dailyAllowance, currentBalance } = await req.json();

    const totalSpent: number = transactions.reduce(
      (sum: number, t: { amount: number }) => sum + Number(t.amount),
      0,
    );

    const categoryTotals: Record<string, number> = {};
    for (const t of transactions) {
      categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + Number(t.amount);
    }
    const topCategory =
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

    const userMessage =
      `This month I've spent $${totalSpent.toFixed(2)} total. ` +
      `My daily allowance is $${Number(dailyAllowance).toFixed(2)}. ` +
      `My current balance is $${Number(currentBalance).toFixed(2)}. ` +
      `My top spending category this month is ${topCategory}. ` +
      `Give me a brief, personalized spending insight.`;

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
            role: 'system',
            content:
              'You are a friendly spending coach for a budgeting app. Be concise, specific, and encouraging. Maximum 2 sentences.',
          },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!openAiRes.ok) {
      const body = await openAiRes.text();
      throw new Error(`OpenAI error ${openAiRes.status}: ${body}`);
    }

    const data = await openAiRes.json();
    const insight: string = data.choices[0].message.content;

    return new Response(JSON.stringify({ insight }), {
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
