import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { budgetData, totalIncome, totalExpenses, incomeDeviation, expenseDeviation } = await req.json();

    console.log('Analyzing budget data:', { totalIncome, totalExpenses, incomeDeviation, expenseDeviation });

    const prompt = `
    בתור אנליסט תקציב מומחה, נתח את נתוני התקציב הרגיל הבאים:

    סה"כ הכנסות: ${totalIncome?.toLocaleString('he-IL')} ₪
    סה"כ הוצאות: ${totalExpenses?.toLocaleString('he-IL')} ₪
    סטיית הכנסות: ${incomeDeviation?.toLocaleString('he-IL')} ₪
    סטיית הוצאות: ${expenseDeviation?.toLocaleString('he-IL')} ₪
    
    נתונים מפורטים:
    ${budgetData.map((item: any) => `${item.category_name}: תקציב ${item.budget_amount?.toLocaleString('he-IL')} ₪, ביצוע ${item.actual_amount?.toLocaleString('he-IL')} ₪`).join('\n')}

    אנא ספק ניתוח המכיל:
    1. 🎯 מצב התקציב הכללי (עודף/גירעון)
    2. 📊 מגמות מרכזיות בהכנסות והוצאות
    3. ⚠️ אזורי חשש או הזדמנויות
    4. 💡 המלצות לשיפור ניהול התקציב
    5. 🔍 נקודות חשובות לתשומת לב

    התשובה צריכה להיות בעברית, מובנית וברורה לקוראים ישראלים.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: 'אתה אנליסט תקציב מומחה המתמחה בניתוח תקציבי עיריות ורשויות מקומיות בישראל. תמיד תן תשובות מעשיות ומובנות בעברית.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    console.log('Budget analysis completed successfully');

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-budget function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});