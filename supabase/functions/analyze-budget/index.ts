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

    // Extract period information from budget data - check all possible fields
    const allTextData = budgetData.map(item => 
      `${item.category_name || ''} ${item.excel_cell_ref || ''} ${JSON.stringify(item)}`
    ).join(' ');
    
    let detectedPeriod = '';
    let detectedYear = '';
    let detectedMonth = '';
    let detectedQuarter = '';
    
    // Enhanced quarter detection patterns with month-based detection
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
      detectedYear = yearMatches[yearMatches.length - 1]; // Take the most recent year
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
      'יולי', 'אוגוסט', 'סeptember', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    let detectedHebrewMonth = '';
    hebrewMonths.forEach((month, index) => {
      if (allTextData.includes(month)) {
        detectedHebrewMonth = month;
        detectedMonth = (index + 1).toString();
      }
    });
    
    // Build comprehensive period string with automatic quarter detection
    if (detectedQuarter && detectedYear) {
      detectedPeriod = `${detectedQuarter} ${detectedYear}`;
    } else if (detectedMonth && detectedYear) {
      // Automatically determine quarter from month
      const quarterFromMonth = monthToQuarter(detectedMonth);
      const monthName = detectedHebrewMonth || `${detectedMonth}`;
      detectedPeriod = `${monthName}/${detectedYear} ${quarterFromMonth}`;
    } else if (detectedYear) {
      detectedPeriod = `שנת ${detectedYear}`;
    } else {
      detectedPeriod = `שנת ${new Date().getFullYear()} (לא זוהתה תקופה ספציפית)`;
    }
    
    // Calculate additional insights
    const totalItems = budgetData?.length || 0;
    const incomeItems = budgetData?.filter(item => item.category_type === 'income').length || 0;
    const expenseItems = budgetData?.filter(item => item.category_type === 'expense').length || 0;
    const highDeviations = budgetData?.filter(item => Math.abs(item.budget_deviation_percentage || 0) > 15).length || 0;
    const balanceRatio = totalExpenses > 0 ? ((totalIncome / totalExpenses) * 100).toFixed(1) : '0';
    
    // Create enhanced analysis prompt  
    const prompt = `אתה אנליסט פיננסי מומחה המתמחה בניתוח תקציבי רשויות מקומיות. נתח את נתוני התקציב הבאים בעברית ובצורה מפורטת ומקצועית.

**פרטי התקופה והמקור:**
תקופת הדיווח: ${detectedPeriod}
שנת תקציב: ${new Date().getFullYear()}
מקור הנתונים: קובץ אקסל שהועלה למערכת

**סיכום כספי מרכזי לתקופה:**
- סה"כ הכנסות מתוכננות: ${totalIncome?.toLocaleString('he-IL')} ₪
- סה"כ הוצאות מתוכננות: ${totalExpenses?.toLocaleString('he-IL')} ₪
- סטיית הכנסות: ${incomeDeviation?.toLocaleString('he-IL')} ₪
- סטיית הוצאות: ${expenseDeviation?.toLocaleString('he-IL')} ₪
- מאזן תקופתי: ${((totalIncome || 0) - (totalExpenses || 0)).toLocaleString('he-IL')} ₪

**ספק ניתוח תמציתי הכולל:**

## תקופת הדיווח: ${detectedPeriod}

## מצב פיננסי כללי
תמונת מצב קצרה של התקציב - האם הרשות במצב טוב או דורש התערבות.

## ממצאים מרכזיים
• רמת הכנסות - האם תקינה או דורשת שיפור
• שליטה בהוצאות - האם יש חריגות משמעותיות
• סעיפים בולטים הדורשים תשומת לב

## המלצות מיידיות (מקסימום 4)
המלצות קונקרטיות לפעולות הנדרשות:
• פעולות גבייה ספציפיות
• בקרת הוצאות חיונית
• אזהרות על סיכונים

התקציב הכולל: ${(totalIncome || 0).toLocaleString('he-IL')} ₪ הכנסות, ${(totalExpenses || 0).toLocaleString('he-IL')} ₪ הוצאות
סטטוס: ${totalIncome > totalExpenses ? 'עודף תקציבי' : totalIncome < totalExpenses ? 'גירעון תקציבי' : 'מאוזן'}`;

    console.log('Calling OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano-2025-08-07', // Using the cheapest OpenAI model
        messages: [
          { 
            role: 'system', 
            content: `אתה אנליסט פיננסי מומחה המתמחה בניתוח תקציבי רשויות מקומיות בישראל. 
            תפקידך לספק ניתוח מקצועי, תמציתי ומעשי של נתוני התקציב.
            
            כללים חשובים:
            1. כתוב בעברית בלבד
            2. השתמש במונחים פיננסיים מקצועיים
            3. התמקד בממצאים המשמעותיים ביותר
            4. ספק המלצות מעשיות קצרות ותכליתיות
            5. הימנע לחלוטין משימוש באימוג'י
            6. הדגש סיכונים פיננסיים וחוזקות בצורה פורמלית
            7. התייחס לתקופה הספציפית של הנתונים שזוהתה מהאקסל
            8. הגבל את התשובה ל-400 מילים מקסימום
            9. השתמש בנקודות תבליט לבהירות
            10. התמקד רק במידע פרקטי ומעשי ותמציתי
            11. התחל תמיד בציון התקופה הספציפית מהנתונים`
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 800 // Using max_completion_tokens for GPT-5 - shortened for concise analysis
        // Note: temperature parameter is not supported in GPT-5
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