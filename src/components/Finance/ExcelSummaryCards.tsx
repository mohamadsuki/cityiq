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
    return `${percentage.toFixed(1)}%`;
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
    <div className="space-y-6">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Cards */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">הכנסות שנתי מתוכננות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {formatCurrency(summaryData.plannedIncomeYearly)}
            </div>
            <div className="text-xs text-green-600 mt-1">B25</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">הכנסות לתקופה מתוכננות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {formatCurrency(summaryData.plannedIncomePeriod)}
            </div>
            <div className="text-xs text-green-600 mt-1">D25</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">הכנסות לתקופה בפועל</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {formatCurrency(summaryData.actualIncomePeriod)}
            </div>
            <div className="text-xs text-blue-600 mt-1">F25</div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${(summaryData.incomeDeviation || 0) >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${(summaryData.incomeDeviation || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>סטייה הכנסות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summaryData.incomeDeviation || 0) >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {formatPercentage(summaryData.incomeDeviation)}
            </div>
            <div className={`text-xs mt-1 ${(summaryData.incomeDeviation || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>J25</div>
          </CardContent>
        </Card>

        {/* Expense Cards */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">הוצאות שנתי מתוכננות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">
              {formatCurrency(summaryData.plannedExpensesYearly)}
            </div>
            <div className="text-xs text-orange-600 mt-1">B50</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">הוצאות לתקופה מתוכננות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">
              {formatCurrency(summaryData.plannedExpensesPeriod)}
            </div>
            <div className="text-xs text-orange-600 mt-1">D50</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">הוצאות לתקופה בפועל</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {formatCurrency(summaryData.actualExpensesPeriod)}
            </div>
            <div className="text-xs text-red-600 mt-1">F50</div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${(summaryData.expensesDeviation || 0) <= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${(summaryData.expensesDeviation || 0) <= 0 ? 'text-green-700' : 'text-red-700'}`}>סטייה הוצאות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summaryData.expensesDeviation || 0) <= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {formatPercentage(summaryData.expensesDeviation)}
            </div>
            <div className={`text-xs mt-1 ${(summaryData.expensesDeviation || 0) <= 0 ? 'text-green-600' : 'text-red-600'}`}>J50</div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>השוואה כוללת - מתוכנן מול בפועל</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(Math.abs(value), true)}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(Math.abs(value)), 
                    name
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="מתוכנן" 
                  fill="#3b82f6" 
                  name="מתוכנן"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="בפועל" 
                  fill="#10b981" 
                  name="בפועל"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-sm text-muted-foreground mt-2 text-center">
            * הוצאות מוצגות כערכים שליליים לצורך השוואה
          </div>
        </CardContent>
      </Card>
    </div>
  );
}