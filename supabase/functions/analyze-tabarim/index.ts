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
    console.log('Starting tabarim analysis...');
    
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
    const { tabarimData, totalApprovedBudget, totalIncomeActual, totalExpenseActual, totalSurplusDeficit } = requestBody;

    console.log('Data received:', {
      tabarimDataLength: tabarimData?.length,
      totalApprovedBudget,
      totalIncomeActual,
      totalExpenseActual,
      totalSurplusDeficit,
      hasUserId: !!userId
    });

    // Extract period information from tabarim data
    const allTextData = tabarimData.map(item => 
      `${item.tabar_name || ''} ${item.domain || ''} ${JSON.stringify(item)}`
    ).join(' ');
    
    let detectedPeriod = '';
    let detectedYear = '';
    let detectedMonth = '';
    let detectedQuarter = '';
    
    // Enhanced quarter detection patterns
    const quarterPatterns = [
      { pattern: /רבעון ראשון|רבעון 1|Q1|קוורטר 1/i, quarter: 'רבעון ראשון' },
      { pattern: /רבעון שני|רבעון 2|Q2|קוורטר 2/i, quarter: 'רבעון שני' },
      { pattern: /רבעון שלישי|רבעון 3|Q3|קוורטר 3/i, quarter: 'רבעון שלישי' },
      { pattern: /רבעון רביעי|רבעון 4|Q4|קוורטר 4/i, quarter: 'רבעון רביעי' }
    ];
    
    // Month to quarter mapping
    const monthToQuarter = (month) => {
      const monthNum = parseInt(month);
      if (monthNum >= 1 && monthNum <= 3) return 'רבעון ראשון';
      if (monthNum >= 4 && monthNum <= 6) return 'רבעון שני';
      if (monthNum >= 7 && monthNum <= 9) return 'רבעון שלישי';
      if (monthNum >= 10 && monthNum <= 12) return 'רבעון רביעי';
      return '';
    };
    
    // Enhanced year detection
    const yearPattern = /20\d{2}/g;
    const yearMatches = allTextData.match(yearPattern);
    if (yearMatches) {
      detectedYear = yearMatches[yearMatches.length - 1];
    }
    
    // Month/Year format detection (MM/YYYY, M/YYYY)
    const monthYearPattern = /(\d{1,2})\/(\d{4})/g;
    const monthYearMatches = [...allTextData.matchAll(monthYearPattern)];
    if (monthYearMatches.length > 0) {
      const latestMatch = monthYearMatches[monthYearMatches.length - 1];
      detectedMonth = latestMatch[1];
      detectedYear = latestMatch[2];
    }
    
    // Quarter detection
    quarterPatterns.forEach(({ pattern, quarter }) => {
      if (pattern.test(allTextData)) {
        detectedQuarter = quarter;
      }
    });
    
    // Hebrew month names detection
    const hebrewMonths = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    let detectedHebrewMonth = '';
    hebrewMonths.forEach((month, index) => {
      if (allTextData.includes(month)) {
        detectedHebrewMonth = month;
        detectedMonth = (index + 1).toString();
      }
    });
    
    // Build comprehensive period string
    if (detectedQuarter && detectedYear) {
      detectedPeriod = `${detectedQuarter} ${detectedYear}`;
    } else if (detectedMonth && detectedYear) {
      const quarterFromMonth = monthToQuarter(detectedMonth);
      const monthName = detectedHebrewMonth || `${detectedMonth}`;
      detectedPeriod = `${monthName}/${detectedYear} ${quarterFromMonth}`;
    } else if (detectedYear) {
      detectedPeriod = `שנת ${detectedYear}`;
    } else {
      detectedPeriod = `שנת ${new Date().getFullYear()} (לא זוהתה תקופה ספציפית)`;
    }
    
    // Calculate additional insights
    const totalTabarim = tabarimData?.length || 0;
    const deficitTabarim = tabarimData?.filter(item => item.surplus_deficit < 0).length || 0;
    const surplusTabarim = tabarimData?.filter(item => item.surplus_deficit > 0).length || 0;
    const balancedTabarim = tabarimData?.filter(item => item.surplus_deficit === 0).length || 0;
    
    // Domain analysis
    const domainStats = tabarimData?.reduce((acc, item) => {
      const domain = item.domain || 'אחר';
      if (!acc[domain]) {
        acc[domain] = { count: 0, budget: 0, deficit: 0 };
      }
      acc[domain].count += 1;
      acc[domain].budget += item.approved_budget || 0;
      if (item.surplus_deficit < 0) {
        acc[domain].deficit += Math.abs(item.surplus_deficit);
      }
      return acc;
    }, {} as Record<string, { count: number; budget: number; deficit: number }>);
    
    // Create enhanced analysis prompt  
    const prompt = `אתה אנליסט פיננסי מומחה המתמחה בניתוח תב"רים של רשויות מקומיות. נתח את נתוני התב"רים הבאים בעברית ובצורה מפורטת ומקצועית.

**פרטי התקופה והמקור:**
תקופת הדיווח: ${detectedPeriod}
שנת תקציב: ${new Date().getFullYear()}
מקור הנתונים: קובץ אקסל שהועלה למערכת

**סיכום תב"רים מרכזי לתקופה:**
- סה"כ תקציב מאושר: ${totalApprovedBudget?.toLocaleString('he-IL')} ₪
- סה"כ הכנסה בפועל: ${totalIncomeActual?.toLocaleString('he-IL')} ₪
- סה"כ הוצאה בפועל: ${totalExpenseActual?.toLocaleString('he-IL')} ₪
- סה"כ עודף/גירעון: ${totalSurplusDeficit?.toLocaleString('he-IL')} ₪
- מספר תב"רים: ${totalTabarim}
- תב"רים בגירעון: ${deficitTabarim}
- תב"רים בעודף: ${surplusTabarim}

**ספק ניתוח תמציתי הכולל:**

## תקופת הדיווח: ${detectedPeriod}

## מצב תב"רים כללי
תמונת מצב קצרה של התב"רים - האם הרשות מנהלת היטב את הפרויקטים או דורשת התערבות.

## ממצאים מרכזיים
• רמת ביצוע התב"רים - האם תקינה או דורשת שיפור
• שליטה בפרויקטים - האם יש חריגות משמעותיות
• תחומים בולטים הדורשים תשומת לב

## המלצות מיידיות (מקסימום 4)
המלצות קונקרטיות לפעולות הנדרשות:
• שיפור ניהול פרויקטים ספציפיים
• בקרת הוצאות חיונית
• אזהרות על סיכונים בתב"רים ספציפיים

מספר תב"רים: ${totalTabarim}
סטטוס כללי: ${totalSurplusDeficit > 0 ? 'עודף כולל' : totalSurplusDeficit < 0 ? 'גירעון כולל' : 'מאוזן'}`;

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
            content: `אתה אנליסט פיננסי מומחה המתמחה בניתוח תב"רים של רשויות מקומיות בישראל. 
            תפקידך לספק ניתוח מקצועי, תמציתי ומעשי של נתוני התב"רים.
            
            כללים חשובים:
            1. כתוב בעברית בלבד
            2. השתמש במונחים פיננסיים מקצועיים
            3. התמקד בממצאים המשמעותיים ביותר לתב"רים
            4. ספק המלצות מעשיות קצרות ותכליתיות
            5. הימנע לחלוטין משימוש באימוג'י
            6. הדגש סיכונים פיננסיים וחוזקות בצורה פורמלית
            7. התייחס לתקופה הספציפית של הנתונים שזוהתה מהאקסל
            8. הגבל את התשובה ל-250 מילים מקסימום בלבד
            9. השתמש בנקודות תבליט קצרות ומרוכזות
            10. התמקד רק במידע החיוני והמעשי ביותר
            11. התחל תמיד בציון התקופה הספציפית מהנתונים
            12. כתוב ניתוח קצר וחד, ללא הרחבות מיותרות`
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 600
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
      choicesLength: data.choices?.length,
      hasContent: !!data.choices?.[0]?.message?.content,
      contentLength: data.choices?.[0]?.message?.content?.length
    });
    
    const analysis = data.choices?.[0]?.message?.content;
    
    if (!analysis || analysis.trim().length === 0) {
      console.error('No valid analysis content:', { analysis, data });
      return new Response(JSON.stringify({ 
        error: 'No analysis content received',
        debug: { hasData: !!data, hasChoices: !!data.choices, response: data }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save analysis to database if user is authenticated
    if (userId && supabaseUrl && supabaseServiceKey) {
      console.log('Saving tabarim analysis to database...');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const analysisData = {
        user_id: userId,
        analysis_text: analysis,
        analysis_type: 'tabarim',
        total_approved_budget: totalApprovedBudget,
        total_income_actual: totalIncomeActual,
        total_expense_actual: totalExpenseActual,
        total_surplus_deficit: totalSurplusDeficit,
        analysis_data: {
          tabarim_data: tabarimData,
          domain_stats: domainStats,
          summary_stats: {
            total_tabarim: totalTabarim,
            deficit_tabarim: deficitTabarim,
            surplus_tabarim: surplusTabarim,
            balanced_tabarim: balancedTabarim
          },
          timestamp: new Date().toISOString()
        }
      };

      // Check if analysis exists for this user and year
      const { data: existingAnalysis } = await supabase
        .from('tabarim_analysis')
        .select('id')
        .eq('user_id', userId)
        .eq('year', new Date().getFullYear())
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
          .insert([{...analysisData, year: new Date().getFullYear()}]);
      }
      
      console.log('Tabarim analysis saved successfully');
    }

    return new Response(JSON.stringify({ 
      success: true,
      analysis: analysis,
      period: detectedPeriod
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-tabarim function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});