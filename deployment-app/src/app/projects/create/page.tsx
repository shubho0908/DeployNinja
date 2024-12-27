"use client";

import ProjectCardPage from "@/views/CreateProjectCard";
import withAuthRequired from "@/utils/withAuthRequired";

function CreateProjectCardWrapper() {
  return <ProjectCardPage />;
}

export default withAuthRequired(CreateProjectCardWrapper);
