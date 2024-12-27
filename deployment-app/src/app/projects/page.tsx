"use client";

import withAuthRequired from "@/utils/withAuthRequired";
import Projects from "@/views/ProjectsPage";

function ProjectsPageWrapper() {
  return <Projects />;
}

export default withAuthRequired(ProjectsPageWrapper);
