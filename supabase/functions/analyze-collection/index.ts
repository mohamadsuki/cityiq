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
    console.log('Starting collection analysis...');
    
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
    const { collectionData, totalAnnualBudget, totalRelativeBudget, totalActualCollection, totalSurplusDeficit } = requestBody;

    console.log('Collection data received:', {
      collectionDataLength: collectionData?.length,
      totalAnnualBudget,
      totalRelativeBudget,
      totalActualCollection,
      totalSurplusDeficit,
      hasUserId: !!userId
    });

    // Detect reporting period from data
    const allTextData = collectionData.map(item => 
      `${item.property_type || ''} ${item.excel_cell_ref || ''} ${JSON.stringify(item)}`
    ).join(' ');
    
    let detectedPeriod = '';
    let detectedYear = '';
    
    // Enhanced year detection
    const yearPattern = /20\d{2}/g;
    const yearMatches = allTextData.match(yearPattern);
    if (yearMatches) {
      detectedYear = yearMatches[yearMatches.length - 1];
    }
    
    // Build period string
    if (detectedYear) {
      detectedPeriod = `שנת ${detectedYear}`;
    } else {
      detectedPeriod = `שנת ${new Date().getFullYear()}`;
    }
    
    // Calculate collection performance metrics
    const collectionRate = totalRelativeBudget > 0 ? ((totalActualCollection / totalRelativeBudget) * 100).toFixed(1) : '0';
    const surplusRate = totalRelativeBudget > 0 ? ((totalSurplusDeficit / totalRelativeBudget) * 100).toFixed(1) : '0';
    const propertyTypes = collectionData?.length || 0;
    
    // Identify problematic property types
    const problematicTypes = collectionData?.filter(item => 
      (item.surplus_deficit || 0) < 0 && Math.abs(item.surplus_deficit || 0) > (item.relative_budget || 0) * 0.1
    ).length || 0;
    
    // Identify high performing types
    const highPerformingTypes = collectionData?.filter(item => 
      (item.surplus_deficit || 0) > (item.relative_budget || 0) * 0.1
    ).length || 0;

    const prompt = `אתה אנליסט פיננסי מומחה המתמחה בניתוח מערכות גביה של רשויות מקומיות. נתח את נתוני הגביה הבאים בעברית ובצורה מפורטה ומקצועית.

**פרטי התקופה והמקור:**
תקופת הדיווח: ${detectedPeriod}
מקור הנתונים: מערכת גביה עירונית

**סיכום גביה מרכזי לתקופה:**
- תקציב שנתי כולל: ${totalAnnualBudget?.toLocaleString('he-IL')} ₪
- תקציב יחסי לתקופה: ${totalRelativeBudget?.toLocaleString('he-IL')} ₪
- גביה בפועל: ${totalActualCollection?.toLocaleString('he-IL')} ₪
- עודף/גירעון כולל: ${totalSurplusDeficit?.toLocaleString('he-IL')} ₪
- אחוז ביצוע גביה: ${collectionRate}%

**נתונים נוספים:**
- סוגי נכסים בניתוח: ${propertyTypes}
- סוגי נכסים עם בעיות גביה: ${problematicTypes}
- סוגי נכסים עם ביצועים גבוהים: ${highPerformingTypes}

**ספק ניתוח תמציתי הכולל:**

## תקופת הדיווח: ${detectedPeriod}

## מצב גביה כללי
תמונת מצב קצרה של יעילות הגביה - האם הרשות גובה ביעילות או דורשת שיפור.

## ממצאים מרכזיים
• רמת הגביה - האם עומדת ביעדים או דורשת חיזוק
• סוגי נכסים בעייתיים - זיהוי נקודות חוכמה
• הזדמנויות לשיפור הגביה

## המלצות מיידיות (מקסימום 4)
המלצות קונקרטיות לפעולות הנדרשות:
• צעדי גביה ספציפיים
• מיקוד במגזרים בעייתיים
• אסטרטגיות לשיפור

יעילות גביה כוללת: ${collectionRate}% - ${parseFloat(collectionRate) >= 85 ? 'מצוינת' : parseFloat(collectionRate) >= 70 ? 'טובה' : parseFloat(collectionRate) >= 50 ? 'בינונית' : 'דורשת שיפור'}`;

    console.log('Calling OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano-2025-08-07',
        max_completion_tokens: 2000, // Increased token limit
        messages: [
          { 
            role: 'system', 
            content: `אתה אנליסט פיננסי מומחה המתמחה בניתוח מערכות גביה של רשויות מקומיות בישראל. 
            תפקידך לספק ניתוח מקצועי, תמציתי ומעשי של נתוני הגביה.
            
            כללים חשובים:
            1. כתוב בעברית בלבד
            2. השתמש במונחים של גביה עירונית מקצועיים
            3. התמקד בממצאים המשמעותיים ביותר בגביה
            4. ספק המלצות מעשיות קצרות ותכליתיות לשיפור הגביה
            5. הימנע לחלוטין משימוש באימוג'י
            6. הדגש בעיות גביה וחוזקות בצורה פורמלית
            7. התייחס לתקופה הספציפית של נתוני הגביה
            8. הגבל את התשובה ל-400 מילים מקסימום בלבד
            9. השתמש בנקודות תבליט קצרות ומרוכזות
            10. התמקד רק במידע החיוני לשיפור הגביה
            11. התחל תמיד בציון התקופה הספציפית מהנתונים
            12. כתוב ניתוח קצר וחד על יעילות הגביה`
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${response.status}`,
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('OpenAI response received:', {
      status: response.status,
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      hasContent: !!data.choices?.[0]?.message?.content,
      contentLength: data.choices?.[0]?.message?.content?.length || 0,
      finishReason: data.choices?.[0]?.finish_reason
    });

    if (!data.choices || data.choices.length === 0) {
      console.error('No choices in OpenAI response:', data);
      return new Response(JSON.stringify({ 
        error: 'לא התקבל תוכן מהמודל' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysis = data.choices[0].message.content;
    
    // Handle empty content or finish_reason issues
    if (!analysis || analysis.trim() === '' || data.choices[0].finish_reason === 'length') {
      console.error('Empty content or length limit exceeded:', {
        analysis: analysis,
        finishReason: data.choices[0].finish_reason,
        usage: data.usage
      });
      return new Response(JSON.stringify({ 
        error: 'התוכן שהתקבל ריק או חתוך - נסה שוב',
        debug: { finishReason: data.choices[0].finish_reason, usage: data.usage }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save analysis to database if user is authenticated
    if (userId && supabaseUrl && supabaseServiceKey) {
      console.log('Saving collection analysis to database...');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const analysisData = {
        user_id: userId,
        analysis_text: analysis,
        analysis_type: 'collection',
        total_approved_budget: totalAnnualBudget,
        total_income_actual: totalActualCollection,
        total_expense_actual: totalRelativeBudget,
        total_surplus_deficit: totalSurplusDeficit,
        analysis_data: {
          collection_data: collectionData,
          timestamp: new Date().toISOString(),
          collection_rate: parseFloat(collectionRate),
          reporting_period: detectedPeriod
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