import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryData {
  plannedIncomeYearly?: number;
  relativeBudgetPeriod?: number;
  actualIncomePeriod?: number;
  budgetDeviation?: number;
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
      return "₪0";
    }
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">הכנסות מתוכננות (שנתי) - B25</div>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(summaryData.plannedIncomeYearly)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">תקציב יחסי לתקופה - D25</div>
          <div className="text-2xl font-bold text-secondary">
            {formatCurrency(summaryData.relativeBudgetPeriod)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">הכנסות בפועל לתקופה - F25</div>
          <div className="text-2xl font-bold text-success">
            {formatCurrency(summaryData.actualIncomePeriod)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">סטייה מהתקציב - J25</div>
          <div className={`text-2xl font-bold ${(summaryData.budgetDeviation || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(summaryData.budgetDeviation)}
          </div>
        </CardContent>
      </Card>
    </>
  );
}