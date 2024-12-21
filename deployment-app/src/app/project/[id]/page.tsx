"use client";

import { use } from "react";
import ProjectDetails from "@/components/pages/ProjectDetails";
import withAuthRequired from "@/utils/withAuthRequired";

function ProjectWrapper({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params promise using `use`
  const { id } = use(params);

  return <ProjectDetails projectId={id} />;
}

export default withAuthRequired(ProjectWrapper);
