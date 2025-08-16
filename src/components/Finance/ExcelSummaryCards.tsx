import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SummaryData {
  plannedIncomeYearly?: number;
  plannedIncomePeriod?: number;
  actualIncomePeriod?: number;
  incomeDeviation?: number;
  plannedExpensesYearly?: number;
  plannedExpensesPeriod?: number;
  actualExpensesPeriod?: number;
  expensesDeviation?: number;
}

export function ExcelSummaryCards() {
  const [summaryData, setSummaryData] = useState<SummaryData>({});

  useEffect(() => {
    // Read summary data from localStorage (saved by DataUploader)
    const stored = localStorage.getItem('regular_budget_summary');
    console.log('Stored summary data:', stored);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        console.log('Parsed summary data:', data);
        setSummaryData(data);
      } catch (error) {
        console.error('Error parsing summary data:', error);
      }
    }
  }, []);

  const formatCurrency = (amount: number | null | undefined, showThousands = false) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "₪0";
    }
    if (showThousands && amount >= 1000) {
      return `₪${(amount / 1000).toFixed(1)}K`;
    }
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const formatPercentage = (percentage: number | null | undefined) => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
      return "0%";
    }
    // Convert decimal to percentage (0.1 -> 10%)
    return `${(percentage * 100).toFixed(1)}%`;
  };

  // Prepare data for comparison chart
  const chartData = [
    {
      name: "הכנסות שנתי",
      מתוכנן: summaryData.plannedIncomeYearly || 0,
      בפועל: 0 // No yearly actual data available
    },
    {
      name: "הכנסות תקופה",
      מתוכנן: summaryData.plannedIncomePeriod || 0,
      בפועל: summaryData.actualIncomePeriod || 0
    },
    {
      name: "הוצאות שנתי", 
      מתוכנן: (summaryData.plannedExpensesYearly || 0) * -1,
      בפועל: 0 // No yearly actual data available
    },
    {
      name: "הוצאות תקופה",
      מתוכנן: (summaryData.plannedExpensesPeriod || 0) * -1,
      בפועל: (summaryData.actualExpensesPeriod || 0) * -1
    }
  ];

  return (
    <div className="w-full space-y-8">
      {/* Summary Cards Grid */}
      <div className="w-full space-y-6">
        {/* Income Cards Row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 min-h-[120px] flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-xs lg:text-sm font-medium text-green-700 leading-tight">
                הכנסות שנתי<br />מתוכננות
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex items-center">
              <div className="text-lg lg:text-xl font-bold text-green-800">
                {formatCurrency(summaryData.plannedIncomeYearly)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 min-h-[120px] flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-xs lg:text-sm font-medium text-blue-700 leading-tight">
                הכנסות לתקופה<br />מתוכננות
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex items-center">
              <div className="text-lg lg:text-xl font-bold text-blue-800">
                {formatCurrency(summaryData.plannedIncomePeriod)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 min-h-[120px] flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-xs lg:text-sm font-medium text-teal-700 leading-tight">
                הכנסות לתקופה<br />בפועל
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex items-center">
              <div className="text-lg lg:text-xl font-bold text-teal-800">
                {formatCurrency(summaryData.actualIncomePeriod)}
              </div>
            </CardContent>
          </Card>

          <Card className={`min-h-[120px] flex flex-col bg-gradient-to-br ${(summaryData.incomeDeviation || 0) >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className={`text-xs lg:text-sm font-medium leading-tight ${(summaryData.incomeDeviation || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                סטייה<br />הכנסות
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex items-center">
              <div className={`text-lg lg:text-xl font-bold ${(summaryData.incomeDeviation || 0) >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                {formatPercentage(summaryData.incomeDeviation)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expense Cards Row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 min-h-[120px] flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-xs lg:text-sm font-medium text-orange-700 leading-tight">
                הוצאות שנתי<br />מתוכננות
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex items-center">
              <div className="text-lg lg:text-xl font-bold text-orange-800">
                {formatCurrency(summaryData.plannedExpensesYearly)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 min-h-[120px] flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-xs lg:text-sm font-medium text-amber-700 leading-tight">
                הוצאות לתקופה<br />מתוכננות
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex items-center">
              <div className="text-lg lg:text-xl font-bold text-amber-800">
                {formatCurrency(summaryData.plannedExpensesPeriod)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 min-h-[120px] flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-xs lg:text-sm font-medium text-red-700 leading-tight">
                הוצאות לתקופה<br />בפועל
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex items-center">
              <div className="text-lg lg:text-xl font-bold text-red-800">
                {formatCurrency(summaryData.actualExpensesPeriod)}
              </div>
            </CardContent>
          </Card>

          <Card className={`min-h-[120px] flex flex-col bg-gradient-to-br ${(summaryData.expensesDeviation || 0) <= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className={`text-xs lg:text-sm font-medium leading-tight ${(summaryData.expensesDeviation || 0) <= 0 ? 'text-green-700' : 'text-red-700'}`}>
                סטייה<br />הוצאות
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex items-center">
              <div className={`text-lg lg:text-xl font-bold ${(summaryData.expensesDeviation || 0) <= 0 ? 'text-green-800' : 'text-red-800'}`}>
                {formatPercentage(summaryData.expensesDeviation)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="w-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-base lg:text-lg">השוואה כוללת - מתוכנן מול בפועל</CardTitle>
          </CardHeader>
          <CardContent className="w-full p-4 lg:p-6">
            <div className="w-full" style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                  barCategoryGap="15%"
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#666' }}
                    angle={0}
                    textAnchor="middle"
                    height={60}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#666' }}
                    tickFormatter={(value) => formatCurrency(Math.abs(value), true)}
                    width={70}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatCurrency(Math.abs(value)), 
                      name
                    ]}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '15px', fontSize: '13px' }}
                  />
                  <Bar 
                    dataKey="מתוכנן" 
                    fill="#3b82f6" 
                    name="מתוכנן"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar 
                    dataKey="בפועל" 
                    fill="#10b981" 
                    name="בפועל"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs lg:text-sm text-muted-foreground mt-3 text-center">
              * הוצאות מוצגות כערכים שליליים לצורך השוואה
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}