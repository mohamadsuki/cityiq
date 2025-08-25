import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    
    // Test basic functionality first
    const testAnalysis = `
## 📊 הצגת הנתונים המרכזיים
מצב התקציב מאוזן עם סה"כ הכנסות והוצאות של ₪42,751 לכל אחד.

## 📈 ניתוח מגמות ודפוסים
- ביצוע הכנסות: 89.8% מהתקציב היחסי
- ביצוע הוצאות: 89.7% מהתקציב היחסי
- מאזן חיובי קל של ₪36

## ⚠️ אזורי תשומת לב
- חלק מסעיפי ההכנסות מבוצעים בשיעור נמוך
- צריך לעקוב אחר הביצוע ברבעון הבא

## 💡 תובנות והמלצות
- לשפר תהליכי גביית הכנסות
- לבקר את תחזיות התקציב

## 🎯 סיכום מנהלים
התקציב מאוזן ומנוהל טוב, עם מרווח בטיחות קטן.`;

    console.log('Returning test analysis');
    
    return new Response(JSON.stringify({ 
      success: true,
      analysis: testAnalysis 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in function:', error);
    return new Response(JSON.stringify({ 
      error: 'Function error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});