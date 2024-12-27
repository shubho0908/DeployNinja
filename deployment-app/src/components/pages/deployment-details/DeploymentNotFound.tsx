import { MdOutlineCloudOff } from "react-icons/md";
import BlurFade from "@/components/ui/blur-fade";

export const DeploymentNotFound = () => (
  <BlurFade key="deployment-not-found" delay={0.25 + 0.5 * 0.05} inView>
    <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
        <MdOutlineCloudOff className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="text-xl font-semibold">No Deployment Found</h3>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
        This project hasn't been deployed yet. Create your first deployment to get started.
      </p>
    </div>
  </BlurFade>
);