import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface BudgetItem {
  id: string;
  category_type: 'income' | 'expense';
  category_name: string;
  budget_amount: number;
  actual_amount: number;
  cumulative_execution: number;
  year: number;
  budget_deviation: number;
  budget_deviation_percentage: number;
}

interface SmartBudgetTableProps {
  budgetData: BudgetItem[];
}

const SmartBudgetTable: React.FC<SmartBudgetTableProps> = ({ budgetData }) => {
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "₪0";
    }
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  // Helper functions to categorize rows
  const isMainSummaryRow = (categoryName: string) => {
    return categoryName === 'סה"כ הכנסות' || categoryName === 'סה"כ הוצאות';
  };

  const isSubSummaryRow = (categoryName: string) => {
    return categoryName.includes('סה"כ') && !isMainSummaryRow(categoryName);
  };

  const isHeaderRow = (categoryName: string) => {
    return categoryName.includes('לתקופה:') || categoryName === 'הכנסות' || categoryName === 'הוצאות';
  };

  const isDetailRow = (item: BudgetItem) => {
    return !isMainSummaryRow(item.category_name) && 
           !isSubSummaryRow(item.category_name) && 
           !isHeaderRow(item.category_name);
  };

  // Separate and categorize data
  const incomeData = budgetData.filter(item => item.category_type === 'income');
  const expenseData = budgetData.filter(item => item.category_type === 'expense');

  const getRowIcon = (item: BudgetItem) => {
    if (isMainSummaryRow(item.category_name)) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (isSubSummaryRow(item.category_name)) {
      return <Info className="w-4 h-4 text-blue-600" />;
    }
    if (Math.abs(item.budget_deviation_percentage) > 20) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
    if (item.budget_deviation >= 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    return <TrendingDown className="w-4 h-4 text-orange-600" />;
  };

  const getRowStyle = (item: BudgetItem) => {
    if (isMainSummaryRow(item.category_name)) {
      return "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-t-2 border-blue-400 font-bold text-lg";
    }
    if (isSubSummaryRow(item.category_name)) {
      return "bg-blue-50/50 dark:bg-blue-950/20 font-semibold";
    }
    if (isHeaderRow(item.category_name)) {
      return "bg-gray-50 dark:bg-gray-900 font-medium italic text-gray-600 dark:text-gray-400";
    }
    return "hover:bg-gray-50 dark:hover:bg-gray-900";
  };

  const getDeviationBadge = (percentage: number) => {
    const absPercentage = Math.abs(percentage);
    if (absPercentage > 20) {
      return <Badge variant="destructive" className="text-xs">סטיה גבוהה</Badge>;
    }
    if (absPercentage > 10) {
      return <Badge variant="secondary" className="text-xs">סטיה בינונית</Badge>;
    }
    if (percentage >= 0) {
      return <Badge variant="default" className="text-xs bg-green-100 text-green-800">חיובי</Badge>;
    }
    return <Badge variant="outline" className="text-xs">רגיל</Badge>;
  };

  const renderDataSection = (data: BudgetItem[], title: string, titleColor: string) => (
    <div className="mb-8">
      <h3 className={`text-xl font-bold mb-4 ${titleColor} flex items-center gap-2`}>
        {title === 'הכנסות' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        {title}
      </h3>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-right p-3 font-semibold">קטגוריה</th>
              <th className="text-right p-3 font-semibold">תקציב מאושר</th>
              <th className="text-right p-3 font-semibold">תקציב יחסי</th>
              <th className="text-right p-3 font-semibold">ביצוע מצטבר</th>
              <th className="text-right p-3 font-semibold">סטיה</th>
              <th className="text-right p-3 font-semibold">סטיה %</th>
              <th className="text-right p-3 font-semibold">סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id} className={getRowStyle(item)}>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {getRowIcon(item)}
                    <span className={isMainSummaryRow(item.category_name) ? "font-bold" : ""}>
                      {item.category_name}
                    </span>
                  </div>
                </td>
                <td className="p-3 font-medium">{formatCurrency(item.budget_amount)}</td>
                <td className="p-3 font-medium">{formatCurrency(item.actual_amount)}</td>
                <td className="p-3 font-medium">{formatCurrency(item.cumulative_execution)}</td>
                <td className={`p-3 font-medium ${item.budget_deviation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(item.budget_deviation)}
                </td>
                <td className={`p-3 font-medium ${item.budget_deviation_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.budget_deviation_percentage.toFixed(1)}%
                </td>
                <td className="p-3">
                  {getDeviationBadge(item.budget_deviation_percentage)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">פריטי הכנסות</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {incomeData.filter(isDetailRow).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">פריטי הוצאות</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {expenseData.filter(isDetailRow).length}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">סטיות גבוהות</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {budgetData.filter(item => Math.abs(item.budget_deviation_percentage) > 20).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">שורות סיכום</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {budgetData.filter(item => isMainSummaryRow(item.category_name) || isSubSummaryRow(item.category_name)).length}
                </p>
              </div>
              <Info className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data tables */}
      {incomeData.length > 0 && renderDataSection(incomeData, 'הכנסות', 'text-green-700 dark:text-green-300')}
      {expenseData.length > 0 && renderDataSection(expenseData, 'הוצאות', 'text-red-700 dark:text-red-300')}
    </div>
  );
};

export default SmartBudgetTable;