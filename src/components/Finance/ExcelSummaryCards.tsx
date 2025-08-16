import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

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
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSummaryData(data);
      } catch (error) {
        console.error('Error parsing summary data:', error);
      }
    }
  }, []);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "₪0M";
    }
    const millions = amount / 1000000;
    return `₪${millions.toLocaleString('he-IL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  };

  const formatPercentage = (percentage: number | null | undefined) => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
      return "0%";
    }
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Income Section */}
      <div className="col-span-full">
        <h3 className="text-lg font-semibold mb-3 text-primary">הכנסות</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">הכנסות שנתי מתוכננות</div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(summaryData.plannedIncomeYearly)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">הכנסות לתקופה מתוכננות</div>
              <div className="text-2xl font-bold text-secondary">
                {formatCurrency(summaryData.plannedIncomePeriod)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">הכנסות לתקופה בפועל</div>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(summaryData.actualIncomePeriod)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">סטייה מהתקציב</div>
              <div className={`text-2xl font-bold ${(summaryData.incomeDeviation || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPercentage(summaryData.incomeDeviation)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expenses Section */}
      <div className="col-span-full mt-6">
        <h3 className="text-lg font-semibold mb-3 text-orange-600">הוצאות</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">הוצאות שנתי מתוכננות</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summaryData.plannedExpensesYearly)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">הוצאות לתקופה מתוכננות</div>
              <div className="text-2xl font-bold text-orange-500">
                {formatCurrency(summaryData.plannedExpensesPeriod)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">הוצאות לתקופה בפועל</div>
              <div className="text-2xl font-bold text-orange-700">
                {formatCurrency(summaryData.actualExpensesPeriod)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">סטייה מהתקציב</div>
              <div className={`text-2xl font-bold ${(summaryData.expensesDeviation || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPercentage(summaryData.expensesDeviation)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}