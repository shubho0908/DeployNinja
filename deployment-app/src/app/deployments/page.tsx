"use client";

import withAuthRequired from "@/utils/withAuthRequired";
import AllDeployments from "@/views/AllDeployments";

function AllDeploymentsWrapper() {
  return (
    <>
      <AllDeployments />
    </>
  );
}

export default withAuthRequired(AllDeploymentsWrapper);
