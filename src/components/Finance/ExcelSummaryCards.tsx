import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";

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

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "₪0";
    }
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const formatPercentage = (percentage: number | null | undefined) => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
      return "0%";
    }
    return `${percentage.toFixed(1)}%`;
  };

  const StatItem = ({ 
    icon: Icon, 
    label, 
    value, 
    colorClass = "text-primary" 
  }: { 
    icon: any; 
    label: string; 
    value: string; 
    colorClass?: string 
  }) => (
    <div className="flex items-center gap-3 p-4 bg-card rounded-lg border shadow-sm">
      <div className={`p-2 rounded-full bg-background ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-sm text-muted-foreground font-medium">{label}</div>
        <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Income Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="text-xl font-semibold text-green-600">הכנסות</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatItem
            icon={Target}
            label="הכנסות שנתי מתוכננות"
            value={formatCurrency(summaryData.plannedIncomeYearly)}
            colorClass="text-blue-600"
          />
          <StatItem
            icon={DollarSign}
            label="הכנסות לתקופה מתוכננות"
            value={formatCurrency(summaryData.plannedIncomePeriod)}
            colorClass="text-blue-500"
          />
          <StatItem
            icon={TrendingUp}
            label="הכנסות לתקופה בפועל"
            value={formatCurrency(summaryData.actualIncomePeriod)}
            colorClass="text-green-600"
          />
          <StatItem
            icon={summaryData.incomeDeviation && summaryData.incomeDeviation >= 0 ? TrendingUp : TrendingDown}
            label="סטייה מהתקציב"
            value={formatPercentage(summaryData.incomeDeviation)}
            colorClass={(summaryData.incomeDeviation || 0) >= 0 ? 'text-green-600' : 'text-red-600'}
          />
        </div>
      </div>

      {/* Expenses Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="h-5 w-5 text-orange-600" />
          <h3 className="text-xl font-semibold text-orange-600">הוצאות</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatItem
            icon={Target}
            label="הוצאות שנתי מתוכננות"
            value={formatCurrency(summaryData.plannedExpensesYearly)}
            colorClass="text-orange-600"
          />
          <StatItem
            icon={DollarSign}
            label="הוצאות לתקופה מתוכננות"
            value={formatCurrency(summaryData.plannedExpensesPeriod)}
            colorClass="text-orange-500"
          />
          <StatItem
            icon={TrendingDown}
            label="הוצאות לתקופה בפועל"
            value={formatCurrency(summaryData.actualExpensesPeriod)}
            colorClass="text-orange-700"
          />
          <StatItem
            icon={summaryData.expensesDeviation && summaryData.expensesDeviation <= 0 ? TrendingUp : TrendingDown}
            label="סטייה מהתקציב"
            value={formatPercentage(summaryData.expensesDeviation)}
            colorClass={(summaryData.expensesDeviation || 0) <= 0 ? 'text-green-600' : 'text-red-600'}
          />
        </div>
      </div>
    </div>
  );
}