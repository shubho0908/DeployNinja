"use client";

import ProjectCardPage from "@/components/pages/ProjectCard";
import withAuthRequired from "@/utils/withAuthRequired";

function ProjectCardWrapper() {
  return <ProjectCardPage />;
}

export default withAuthRequired(ProjectCardWrapper);
