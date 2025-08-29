import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 Starting analyze-tabarim function');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not found');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client for authenticated operations
    let user = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader && supabaseUrl && supabaseServiceRoleKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      const token = authHeader.replace('Bearer ', '');
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        user = data.user;
        console.log('✅ User authenticated:', user.id);
      }
    }

    const { 
      tabarimData, 
      totalApprovedBudget, 
      totalIncomeActual, 
      totalExpenseActual,
      totalSurplusDeficit 
    } = await req.json();

    console.log('📊 Received tabarim data:', {
      itemCount: tabarimData?.length || 0,
      totalApprovedBudget,
      totalIncomeActual,
      totalExpenseActual,
      totalSurplusDeficit
    });

    if (!tabarimData || tabarimData.length === 0) {
      return new Response(JSON.stringify({ error: 'No tabarim data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Detect reporting period
    let reportingPeriod = "תקופה לא מוגדרת";
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    if (currentMonth <= 3) {
      reportingPeriod = `רבעון ראשון ${currentYear}`;
    } else if (currentMonth <= 6) {
      reportingPeriod = `רבעון שני ${currentYear}`;
    } else if (currentMonth <= 9) {
      reportingPeriod = `רבעון שלישי ${currentYear}`;
    } else {
      reportingPeriod = `רבעון רביעי ${currentYear}`;
    }

    // Prepare detailed analysis prompt
    const prompt = `
נתח את נתוני התב"רים הבאים עבור ${reportingPeriod} וספק תובנות חשובות:

=== סיכום כספי כללי ===
• סה"כ תקציב מאושר: ₪${totalApprovedBudget?.toLocaleString() || '0'}
• סה"כ הכנסה בפועל: ₪${totalIncomeActual?.toLocaleString() || '0'}
• סה"כ הוצאה בפועל: ₪${totalExpenseActual?.toLocaleString() || '0'}
• סה"כ עודף/גירעון: ₪${totalSurplusDeficit?.toLocaleString() || '0'}

=== נתונים מפורטים לפי תב"ר ===
${tabarimData.map((item: any, index: number) => `
${index + 1}. תב"ר מספר: ${item.tabar_number || 'לא מוגדר'}
   שם: ${item.tabar_name || 'לא מוגדר'}
   תחום: ${item.domain || 'לא מוגדר'}
   מקור תקציב ראשי: ${item.funding_source1 || 'לא מוגדר'}
   תקציב מאושר: ₪${item.approved_budget?.toLocaleString() || '0'}
   הכנסה בפועל: ₪${item.income_actual?.toLocaleString() || '0'}
   הוצאה בפועל: ₪${item.expense_actual?.toLocaleString() || '0'}
   עודף/גירעון: ₪${item.surplus_deficit?.toLocaleString() || '0'}
`).join('')}

=== בקשה לניתוח ===
אנא ספק ניתוח מקצועי וממוקד הכולל:

1. **מצב כללי** - הערכה של הביצועים הכספיים הכוללים של התב"רים
2. **תב"רים מובילים** - זיהוי התב"רים הטובים ביותר מבחינת ביצוע תקציבי
3. **תחומים בבעיה** - זיהוי תב"רים או תחומים הזקוקים לתשומת לב
4. **ניתוח מקורות תקציב** - הערכת הביצועים לפי מקורות מימון שונים
5. **המלצות מעשיות** - צעדים קונקרטיים לשיפור

הגבל את התשובה ל-250 מילים ותן דגש על תובנות מעשיות ורלוונטיות.
`;

    console.log('🤖 Sending request to OpenAI...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'אתה מומחה בניתוח תקציבי עירוני המתמחה בתב"רים (תקציבי פיתוח). ספק ניתוחים מדויקים וממוקדים בעברית הכוללים תובנות מעשיות לשיפור הביצועים התקציביים.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.7
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('❌ OpenAI API error:', openAIResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${openAIResponse.status} - ${errorText}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIData = await openAIResponse.json();
    console.log('✅ OpenAI response received');

    const analysis = openAIData.choices?.[0]?.message?.content;
    if (!analysis) {
      console.error('❌ No analysis content in OpenAI response');
      return new Response(JSON.stringify({ error: 'No analysis generated' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save analysis to database if user is authenticated
    if (user && supabaseUrl && supabaseServiceRoleKey) {
      console.log('💾 Saving analysis to database...');
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      
      const analysisData = {
        user_id: user.id,
        year: currentYear,
        total_approved_budget: totalApprovedBudget,
        total_income_actual: totalIncomeActual,
        total_expense_actual: totalExpenseActual,
        total_surplus_deficit: totalSurplusDeficit,
        analysis_text: analysis,
        analysis_type: 'tabarim',
        analysis_data: {
          timestamp: new Date().toISOString(),
          reporting_period: reportingPeriod,
          tabarim_count: tabarimData.length,
          summary: 'Tabarim budget analysis completed'
        }
      };

      // First, try to find existing analysis for this user and year
      const { data: existingAnalysis, error: findError } = await supabase
        .from('tabarim_analysis')
        .select('id')
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .eq('analysis_type', 'tabarim')
        .maybeSingle();

      if (findError) {
        console.error('❌ Error finding existing analysis:', findError);
      }

      let saveError;
      if (existingAnalysis) {
        // Update existing analysis
        console.log('🔄 Updating existing analysis...');
        const { error } = await supabase
          .from('tabarim_analysis')
          .update({
            ...analysisData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAnalysis.id);
        saveError = error;
      } else {
        // Insert new analysis
        console.log('➕ Creating new analysis...');
        const { error } = await supabase
          .from('tabarim_analysis')
          .insert([analysisData]);
        saveError = error;
      }

      if (saveError) {
        console.error('❌ Error saving analysis:', saveError);
      } else {
        console.log('✅ Analysis saved successfully');
      }
    }

    return new Response(JSON.stringify({ 
      analysis,
      reportingPeriod 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in analyze-tabarim function:', error);
    return new Response(JSON.stringify({ 
      error: `Server error: ${error.message}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});