import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('Starting budget analysis...');
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    console.log('Request received with keys:', Object.keys(requestBody));

    const { budgetData, totalIncome, totalExpenses, incomeDeviation, expenseDeviation } = requestBody;

    console.log('Data validation:', {
      hasBudgetData: Array.isArray(budgetData),
      budgetDataLength: budgetData?.length,
      totalIncome: typeof totalIncome,
      totalExpenses: typeof totalExpenses
    });

    // Simple validation
    if (!Array.isArray(budgetData) || budgetData.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No budget data provided' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a simple prompt
    const prompt = `נתח את נתוני התקציב הבאים:

סה"כ הכנסות: ${totalIncome?.toLocaleString('he-IL')} ₪
סה"כ הוצאות: ${totalExpenses?.toLocaleString('he-IL')} ₪
סטיית הכנסות: ${incomeDeviation?.toLocaleString('he-IL')} ₪
סטיית הוצאות: ${expenseDeviation?.toLocaleString('he-IL')} ₪

ספק ניתוח קצר של:
1. מצב התקציב הכללי
2. עיקרי הממצאים
3. המלצות

תשובה בעברית, עד 500 מילים.`;

    console.log('Calling OpenAI API...');

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
            content: 'אתה אנליסט תקציב המתמחה בניתוח תקציבי עיריות בישראל. תן תשובות קצרות ומעשיות בעברית.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 800,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${response.status}`,
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    const analysis = data.choices?.[0]?.message?.content;
    
    if (!analysis) {
      console.error('No analysis content in response');
      return new Response(JSON.stringify({ 
        error: 'No analysis content received' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analysis completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      analysis: analysis 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-budget function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});