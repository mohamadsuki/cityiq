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
    console.log('Starting budget analysis...');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    const { budgetData, totalIncome, totalExpenses, incomeDeviation, expenseDeviation } = await req.json();

    console.log('Received data:', { 
      budgetDataLength: budgetData?.length, 
      totalIncome, 
      totalExpenses, 
      incomeDeviation, 
      expenseDeviation,
      hasOpenAIKey: !!openAIApiKey
    });

    // Validate input data
    if (!budgetData || !Array.isArray(budgetData) || budgetData.length === 0) {
      throw new Error('Invalid or empty budget data provided');
    }

    if (typeof totalIncome !== 'number' || typeof totalExpenses !== 'number') {
      throw new Error('Invalid total income or expenses data');
    }

    // Create a structured data summary for OpenAI
    const dataStructure = budgetData.map((item: any) => {
      // Validate each item
      if (!item || typeof item !== 'object') {
        console.warn('Invalid budget item:', item);
        return null;
      }
      
      return {
        category: item.category_name || 'לא מוגדר',
        type: item.category_type || 'unknown',
        budget: item.budget_amount || 0,
        actual: item.actual_amount || 0,
        execution: item.cumulative_execution || 0,
        deviation: item.budget_deviation || 0,
        deviationPercent: item.budget_deviation_percentage || 0
      };
    }).filter(item => item !== null);

    const prompt = `
    בתור אנליסט תקציב מומחה ומומחה להצגת נתונים, נתח את נתוני התקציב הרגיל הבאים והצג אותם בצורה מובנת וחכמה:

    ## סיכום כללי:
    - סה"כ הכנסות (תקציב יחסי לתקופה): ${totalIncome?.toLocaleString('he-IL')} ₪
    - סה"כ הוצאות (תקציב יחסי לתקופה): ${totalExpenses?.toLocaleString('he-IL')} ₪
    - סטיית הכנסות (ביצוע מצטבר מול תקציב יחסי): ${incomeDeviation?.toLocaleString('he-IL')} ₪
    - סטיית הוצאות (ביצוע מצטבר מול תקציב יחסי): ${expenseDeviation?.toLocaleString('he-IL')} ₪
    
    ## נתונים מפורטים:
    ${dataStructure.slice(0, 15).map((item: any) => 
      `**${item.category}** (${item.type === 'income' ? 'הכנסה' : 'הוצאה'}):
      - תקציב מאושר: ${item.budget?.toLocaleString('he-IL')} ₪
      - תקציב יחסי לתקופה: ${item.actual?.toLocaleString('he-IL')} ₪
      - ביצוע מצטבר: ${item.execution?.toLocaleString('he-IL')} ₪
      - סטיה: ${item.deviation?.toLocaleString('he-IL')} ₪ (${item.deviationPercent?.toFixed(1)}%)`
    ).join('\n\n')}

    אנא ספק ניתוח קצר ומובן שכולל:

    ## 📊 הצגת הנתונים המרכזיים
    ## 📈 ניתוח מגמות ודפוסים  
    ## ⚠️ אזורי תשומת לב
    ## 💡 תובנות והמלצות
    ## 🎯 סיכום מנהלים

    התשובה צריכה להיות בעברית, מובנית עם אמוג'י, וכוללת הן הצגת הנתונים והן ניתוח מעמיק אך קצר.
    `;

    console.log('Sending request to OpenAI...');

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
            content: 'אתה אנליסט תקציב מומחה ומומחה להצגת נתונים המתמחה בניתוח תקציבי עיריות ורשויות מקומיות בישראל. אתה יודע להציג נתונים בצורה ברורה ומובנת ולספק תובנות מעשיות.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 1200,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response data:', data);
    
    const analysis = data.choices?.[0]?.message?.content;
    console.log('Extracted analysis:', analysis);

    if (!analysis) {
      console.error('No analysis content in OpenAI response');
      throw new Error('No analysis content received from OpenAI');
    }

    console.log('Budget analysis completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      analysis: analysis 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-budget function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check the Edge Function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});