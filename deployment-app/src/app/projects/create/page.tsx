"use client";

import ProjectCardPage from "@/components/pages/create-project/CreateProjectCard";
import withAuthRequired from "@/utils/withAuthRequired";

function CreateProjectCardWrapper() {
  return <ProjectCardPage />;
}

export default withAuthRequired(CreateProjectCardWrapper);
