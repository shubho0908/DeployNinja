"use client";

import withAuthRequired from "@/utils/withAuthRequired";
import Dashboard from "@/components/pages/DashboardPage";

function DashboardWrapper() {
  return <Dashboard />;
}

export default withAuthRequired(DashboardWrapper);
