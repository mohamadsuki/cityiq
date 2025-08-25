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

    // Extract period information from budget data
    const periodInfo = budgetData?.find(item => 
      item.category_name && item.category_name.includes('לתקופה:')
    );
    const currentPeriod = periodInfo ? periodInfo.category_name : `תקופת דיווח: ${new Date().toLocaleDateString('he-IL')}`;
    
    // Calculate additional insights
    const totalItems = budgetData?.length || 0;
    const incomeItems = budgetData?.filter(item => item.category_type === 'income').length || 0;
    const expenseItems = budgetData?.filter(item => item.category_type === 'expense').length || 0;
    const highDeviations = budgetData?.filter(item => Math.abs(item.budget_deviation_percentage || 0) > 15).length || 0;
    const balanceRatio = totalExpenses > 0 ? ((totalIncome / totalExpenses) * 100).toFixed(1) : '0';
    
    // Create enhanced analysis prompt
    const prompt = `אתה אנליסט פיננסי מומחה המתמחה בניתוח תקציבי רשויות מקומיות. נתח את נתוני התקציב הבאים בעברית ובצורה מפורטת ומקצועית.

**📅 פרטי התקופה והמקור:**
${currentPeriod}
שנת תקציב: ${new Date().getFullYear()}
מקור הנתונים: קובץ אקסל שהועלה למערכת בתאריך ${new Date().toLocaleDateString('he-IL')}

**💰 סיכום כספי מרכזי לתקופה:**
- סה"כ הכנסות מתוכננות לתקופה: ${totalIncome?.toLocaleString('he-IL')} ₪
- סה"כ הוצאות מתוכננות לתקופה: ${totalExpenses?.toLocaleString('he-IL')} ₪
- סטיית הכנסות (ביצוע מול תוכנית): ${incomeDeviation?.toLocaleString('he-IL')} ₪
- סטיית הוצאות (ביצוע מול תוכנית): ${expenseDeviation?.toLocaleString('he-IL')} ₪
- יחס מאזן הכנסות/הוצאות: ${balanceRatio}%
- מאזן תקופתי: ${((totalIncome || 0) - (totalExpenses || 0)).toLocaleString('he-IL')} ₪

**📊 פילוח קטגוריות מהקובץ:**
- סה"כ פריטי תקציב: ${totalItems}
- קטגוריות הכנסות: ${incomeItems}
- קטגוריות הוצאות: ${expenseItems}
- חריגות משמעותיות (מעל 15%): ${highDeviations}

**אנא ספק ניתוח מקיף ומעמיק הכולל:**

## 📋 סיכום מנהלים מתקדם
תמונת מצב כללית של התקציב בתקופה הנוכחית - האם הרשות במצב פיננסי טוב, אילו אתגרים עיקריים קיימים ומה המסקנות החשובות ביותר לקבלת החלטות.

## 💰 ניתוח הכנסות מפורט
- ביצועי גבייה לעומת תוכנית התקופה הספציפית
- הערכת יעילות מקורות הכנסה שונים
- זיהוי הזדמנויות לשיפור הגבייה
- השוואה לביצועים צפויים בתקופה זו

## 🏛️ ניתוח הוצאות ובקרה תקציבית
- רמת שליטה בהוצאות יחסית לתוכנית התקופתית
- זיהוי סעיפים עם חריגות משמעותיות והסברים
- הערכת יעילות הוצאות לעומת השירותים הניתנים
- אזהרות על סיכונים פיננסיים

## ⚠️ נקודות דורשות תשומת לב מיידית
רשימה ממוקדת של סעיפים/תחומים הדורשים התערבות מיידית או ניטור צמוד, כולל הסבר הסיבות והשלכות אפשריות.

## 🎯 המלצות מעשיות ליישום מיידי
5-6 המלצות קונקרטיות וניתנות ליישום:
- פעולות לשיפור גבייה בתקופה הקרובה
- אמצעי בקרת הוצאות מותאמים לעונה
- שיפורי תהליכים דחופים
- הכנות ספציפיות לתקופות הבאות

## 📈 תחזית והשלכות עתידיות
- השלכות המצב הנוכחי על המשך השנה הכספית
- הערכת סיכונים ואתגרים צפויים לרבעון הבא
- הזדמנויות לשיפור הביצוע בהתבסס על המגמות הנוכחיות

## 🔍 תובנות נוספות מנתוני האקסל
- דפוסים מעניינים שנמצאו בנתונים
- השוואות בין קטגוריות שונות
- מדדי ביצוע מרכזיים למעקב עתידי

**הנחיות לכתיבה:**
- השתמש בשפה ברורה, מקצועית ומובנת למנהלים
- הוסף מספרים קונקרטיים, אחוזים ומדדים
- כתוב בכותרות בולטות עם אייקונים וסמלים
- התמקד בתובנות מעשיות ופעולות ניתנות ליישום
- התייחס לתקופת הדיווח הספציפית שמופיעה בקובץ
- הדגש נקודות חשובות ודחופות בבירור
- ספק ניתוח מפורט וממוקד ב-1000-1200 מילים

נתונים נוספים לצורך יצירת גרפים מתקדמים:
התקציב הכולל: ${(totalIncome || 0).toLocaleString('he-IL')} ₪ הכנסות, ${(totalExpenses || 0).toLocaleString('he-IL')} ₪ הוצאות
סטטוס כללי: ${totalIncome > totalExpenses ? 'עודף תקציבי' : totalIncome < totalExpenses ? 'גירעון תקציבי' : 'מאוזן'}

כלול בתשובה גם קטע נפרד:
## המלצות לויזואליזציות נתונים
פירוט של 3-4 גרפים הכי מתאימים עם הסבר מדוע כל אחד חשוב ומה הוא מציג.`;

    console.log('Calling OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `אתה אנליסט פיננסי מומחה המתמחה בניתוח תקציבי רשויות מקומיות בישראל. 
            תפקידך לספק ניתוח מקצועי, תמציתי ומעשי של נתוני התקציב.
            
            כללים חשובים:
            1. כתוב בעברית בלבד
            2. השתמש במונחים פיננסיים מקצועיים
            3. התמקד בממצאים המשמעותיים ביותר
            4. ספק המלצות מעשיות קצרות ותכליתיות
            5. הימנע לחלוטין משימוש באימוג'י
            6. הדגש סיכונים פיננסיים וחוזקות בצורה פורמלית
            7. התייחס לתקופה של הנתונים
            8. הגבל את התשובה ל-600 מילים מקסימום
            9. השתמש בנקודות תבליט לבהירות
            10. התמקד רק במידע פרקטי ומעשי`
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
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