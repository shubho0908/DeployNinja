import { FaReact, FaAngular } from "react-icons/fa";
import { RiNextjsFill } from "react-icons/ri";
import { IoLogoVue } from "react-icons/io5";

export const getProjectIcon = (framework: string) => {
  switch (framework) {
    case "React":
      return <FaReact className="w-15 h-15 text-blue-500" />;
    case "Next.js":
      return <RiNextjsFill className="w-15 h-15 text-foreground" />;
    case "Vue":
      return <IoLogoVue className="w-15 h-15 text-green-500" />;
    case "Angular":
      return <FaAngular className="w-15 h-15 text-red-600/80" />;
    default:
      return <FaReact className="w-15 h-15 text-blue-500" />;
  }
};

export const getLatestDeployment = (deployments: any[]) => {
  if (!deployments || deployments.length === 0) return null;

  const sortedDeployments = [...deployments].sort((a, b) => {
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return dateB - dateA;
  });

  return sortedDeployments[0];
};