"use client";

import withAuthRequired from "@/utils/withAuthRequired";
import AllDeployments from "@/components/pages/all-deployments/AllDeployments";

function AllDeploymentsWrapper() {
  return (
    <>
      <AllDeployments />
    </>
  );
}

export default withAuthRequired(AllDeploymentsWrapper);
