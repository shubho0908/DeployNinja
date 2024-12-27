"use client";

import { use } from "react";
import DeploymentDetails from "@/views/DeploymentDetails";
import withAuthRequired from "@/utils/withAuthRequired";

function ProjectDeploymentWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <DeploymentDetails deploymentId={id} />;
}

export default withAuthRequired(ProjectDeploymentWrapper);
