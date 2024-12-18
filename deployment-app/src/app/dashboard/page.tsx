"use client";

import withAuthRequired from "@/components/withAuthRequired";
import Dashboard from "@/components/Dashboard";

function DashboardWrapper() {
  return <Dashboard />;
}

export default withAuthRequired(DashboardWrapper);
