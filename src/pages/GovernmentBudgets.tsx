import { Routes, Route } from "react-router-dom";
import GovernmentBudgetsDashboard from "@/components/Dashboard/GovernmentBudgetsDashboard";
import GrantsApp from "@/components/Grants/GrantsApp";
import BudgetAuthorizationsPage from "@/components/GovernmentBudgets/BudgetAuthorizationsPage";

export default function GovernmentBudgets() {
  return (
    <Routes>
      <Route path="/" element={<GovernmentBudgetsDashboard />} />
      <Route path="/grants" element={<GrantsApp />} />
      <Route path="/authorizations" element={<BudgetAuthorizationsPage />} />
    </Routes>
  );
}