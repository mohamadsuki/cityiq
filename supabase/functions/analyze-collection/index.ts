import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

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
    console.log('Starting collection analysis...');
    
    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from authorization header if available
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      } catch (error) {
        console.log('Could not get user from token:', error);
      }
    }

    // Parse request body
    const { 
      collectionData, 
      totalDebt = 0, 
      totalCash = 0, 
      totalInterest = 0, 
      totalIndexation = 0,
      totalNominalBalance = 0,
      totalRealBalance = 0
    } = await req.json();

    console.log('Collection data received:', {
      collectionDataLength: collectionData?.length || 0,
      totalDebt,
      totalCash,
      totalInterest,
      totalIndexation,
      totalNominalBalance,
      totalRealBalance,
      hasUserId: !!userId
    });

    if (!collectionData || collectionData.length === 0) {
      throw new Error('לא התקבלו נתוני גביה לניתוח');
    }

    // Detect reporting period from data
    const years = collectionData
      .map(item => item.source_year || item.year)
      .filter(year => year && year > 2020 && year <= new Date().getFullYear());
    const uniqueYears = [...new Set(years)];
    const detectedPeriod = uniqueYears.length > 0 ? 
      uniqueYears.sort().join('-') : 
      new Date().getFullYear().toString();

    // Enhanced collection rate calculation based on new structure
    const collectionRate = totalNominalBalance > 0 ? ((totalCash / totalNominalBalance) * 100).toFixed(1) : '0.0';
    const surplusRate = totalNominalBalance > 0 ? (((totalCash - totalDebt) / totalNominalBalance) * 100).toFixed(1) : '0.0';
    
    // Create enhanced collection analysis prompt
    const prompt = `נתח את נתוני הגביה הבאים:

**נתונים כלליים:**
- מספר רשומות משלמים: ${collectionData?.length || 0}
- סה"כ חובות: ₪${totalDebt.toLocaleString('he-IL')}
- סה"כ מזומן שנגבה: ₪${totalCash.toLocaleString('he-IL')}
- סה"כ ריבית: ₪${totalInterest.toLocaleString('he-IL')}
- סה"כ הצמדה: ₪${totalIndexation.toLocaleString('he-IL')}
- יתרה נומינלית: ₪${totalNominalBalance.toLocaleString('he-IL')}
- יתרה ריאלית: ₪${totalRealBalance.toLocaleString('he-IL')}
- שיעור גביה: ${collectionRate}%

**ניתוח מתקדם:**
${collectionData?.slice(0, 50).map(item => 
  `• ${item.payer_name || 'לא צוין'} (${item.service_description || item.property_type}): חוב ₪${(item.total_debt || 0).toLocaleString('he-IL')}, מזומן ₪${(item.cash || 0).toLocaleString('he-IL')}`
).join('\n')}

אנא ספק ניתוח מקצועי וחד הכולל:
1. **מצב כללי** - סיכום של מצב הגביה והחובות
2. **ניתוח לפי סוגי שירותים** - זיהוי סוגי שירותים עם חובות גבוהים
3. **ניתוח משלמים** - זיהוי משלמים עם חובות משמעותיים
4. **מגמות וביצועים** - השוואת שיעור הגביה והמזומן שנגבה
5. **המלצות פעולה** - צעדים קונקרטיים לשיפור הגביה

**חשוב:** הציג את הניתוח בצורה מקצועית ומובנה עם נתונים רלוונטיים בעברית.`;

    console.log('Calling OpenAI API...');
    
    // Call OpenAI API with enhanced prompt
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'אתה מומחה לניתוח נתונים פיננסיים ועירוניים. ספק ניתוחים מקצועיים, מדויקים ומובנים בעברית.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      }),
    });

    console.log('OpenAI response received:', {
      status: openAIResponse.status,
      hasChoices: !!openAIResponse,
      choicesLength: openAIResponse ? 'unknown' : 0,
      hasContent: !!openAIResponse,
      contentLength: openAIResponse ? 'unknown' : 0,
      finishReason: 'unknown'
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openAIData = await openAIResponse.json();

    if (!openAIData.choices || openAIData.choices.length === 0) {
      throw new Error('לא התקבלה תגובה תקינה מ-OpenAI');
    }

    const analysis = openAIData.choices[0].message.content;

    if (!analysis || analysis.trim().length === 0) {
      throw new Error('התקבל ניתוח ריק מ-OpenAI');
    }

    console.log('Analysis generated successfully, length:', analysis.length);

    // Save analysis to database if user is authenticated
    if (userId) {
      console.log('Saving analysis to database for user:', userId);
      
      const analysisData = {
        user_id: userId,
        year: new Date().getFullYear(),
        analysis_text: analysis,
        analysis_type: 'collection',
        total_approved_budget: totalNominalBalance,
        total_income_actual: totalCash,
        total_expense_actual: totalDebt,
        total_surplus_deficit: totalCash - totalDebt,
        analysis_data: {
          enhanced_collection_data: collectionData,
          timestamp: new Date().toISOString(),
          collection_rate: parseFloat(collectionRate),
          reporting_period: detectedPeriod,
          total_debt: totalDebt,
          total_cash: totalCash,
          total_interest: totalInterest,
          total_indexation: totalIndexation,
          total_nominal_balance: totalNominalBalance,
          total_real_balance: totalRealBalance
        }
      };

      // Check if analysis exists for this user and year
      const { data: existingAnalysis } = await supabase
        .from('tabarim_analysis')
        .select('id')
        .eq('user_id', userId)
        .eq('year', new Date().getFullYear())
        .eq('analysis_type', 'collection')
        .single();

      if (existingAnalysis) {
        // Update existing analysis
        await supabase
          .from('tabarim_analysis')
          .update(analysisData)
          .eq('id', existingAnalysis.id);
      } else {
        // Insert new analysis
        await supabase
          .from('tabarim_analysis')
          .insert([analysisData]);
      }
      
      console.log('Collection analysis saved successfully');
    }

    return new Response(JSON.stringify({ 
      success: true,
      analysis: analysis,
      reportingPeriod: detectedPeriod
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-collection function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});