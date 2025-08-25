import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    const requestBody = await req.json();
    const { budgetData, totalIncome, totalExpenses, incomeDeviation, expenseDeviation } = requestBody;

    console.log('Data received:', {
      budgetDataLength: budgetData?.length,
      totalIncome,
      totalExpenses,
      hasUserId: !!userId
    });

    // Create analysis prompt
    const prompt = `נתח את נתוני התקציב הרגיל הבאים:

סה"כ הכנסות (תקציב יחסי לתקופה): ${totalIncome?.toLocaleString('he-IL')} ₪
סה"כ הוצאות (תקציב יחסי לתקופה): ${totalExpenses?.toLocaleString('he-IL')} ₪
סטיית הכנסות: ${incomeDeviation?.toLocaleString('he-IL')} ₪
סטיית הוצאות: ${expenseDeviation?.toLocaleString('he-IL')} ₪

ספק ניתוח מקצועי המכיל:

## 📊 הצגת הנתונים המרכזיים
- מצב התקציב הכללי (עודף/גירעון)
- יחס ביצוע לתקציב המתוכנן

## 📈 ניתוח מגמות ודפוסים
- ביצועי הכנסות מול תחזיות
- ביצועי הוצאות מול תקציב
- זיהוי מגמות חיוביות ושליליות

## ⚠️ אזורי תשומת לב
- סעיפים עם סטיות משמעותיות
- נקודות דורשות התייחסות מיידית

## 💡 תובנות והמלצות
- המלצות לשיפור גביית הכנסות
- המלצות לאופטימיזציה של הוצאות
- פעולות מומלצות לרבעון הבא

## 🎯 סיכום מנהלים
- הערכה כללית של מצב התקציב
- נקודות מפתח למקבלי החלטות

תשובה בעברית, מקצועית ומובנת, עד 800 מילים.`;

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
            content: 'אתה אנליסט תקציב מומחה המתמחה בניתוח תקציבי עיריות ורשויות מקומיות בישראל. תן תשובות מקצועיות, מובנות ומעשיות בעברית.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 1000,
      }),
    });

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
    const analysis = data.choices?.[0]?.message?.content;
    
    if (!analysis) {
      return new Response(JSON.stringify({ 
        error: 'No analysis content received' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save analysis to database if user is authenticated
    if (userId && supabaseUrl && supabaseServiceKey) {
      console.log('Saving analysis to database...');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const analysisData = {
        user_id: userId,
        analysis_text: analysis,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        income_deviation: incomeDeviation,
        expense_deviation: expenseDeviation,
        analysis_data: {
          budget_data: budgetData,
          timestamp: new Date().toISOString()
        }
      };

      // Check if analysis exists for this user and year
      const { data: existingAnalysis } = await supabase
        .from('budget_analysis')
        .select('id')
        .eq('user_id', userId)
        .eq('year', new Date().getFullYear())
        .single();

      if (existingAnalysis) {
        // Update existing analysis
        await supabase
          .from('budget_analysis')
          .update(analysisData)
          .eq('id', existingAnalysis.id);
      } else {
        // Insert new analysis
        await supabase
          .from('budget_analysis')
          .insert([analysisData]);
      }
      
      console.log('Analysis saved successfully');
    }

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
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});