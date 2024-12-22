"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Github, Rocket, Lock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
    } else {
      setLoading(false);
      if (session) {
        router.replace("/projects");
      }
    }
  }, [session, status, router]);

  const handleGitHubLogin = () => {
    signIn("github");
  };

  const features = [
    { icon: <Lock className="h-4 w-4" />, text: "Secure Authentication" },
    { icon: <Github className="h-4 w-4" />, text: "Access Your Repositories" },
    { icon: <Rocket className="h-4 w-4" />, text: "Start Deploying Instantly" },
  ];

  if (loading || session) {
    return null;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <motion.div
        className="hidden lg:flex flex-col justify-center p-12 bg-muted/10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-md">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 100,
            }}
          >
            <Link
              href="/"
              className="text-2xl font-bold mb-8 inline-flex items-center gap-2"
            >
              <Rocket className="h-6 w-6" />
              DeployNinja
            </Link>
          </motion.div>

          <h1 className="text-4xl font-bold mb-4">Welcome to DeployNinja</h1>
          <p className="text-muted-foreground mb-8">
            Connect your GitHub account and start deploying your projects in
            seconds.
          </p>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={item}
                className="flex items-center gap-3 text-sm"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {feature.icon}
                </div>
                <span>{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <div className="flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Sign In</h2>
            <p className="text-muted-foreground">to continue to DeployNinja</p>
          </div>

          <div className="space-y-4">
            <Button
              className="w-full relative overflow-hidden group"
              size="lg"
              onClick={handleGitHubLogin}
            >
              <motion.div
                className="absolute inset-0 bg-primary/10"
                initial={false}
                whileHover={{ scale: 1.5 }}
                transition={{ duration: 0.4 }}
              />
              <span className="relative flex items-center justify-center">
                <Github className="mr-2 h-5 w-5" />
                Continue with GitHub
              </span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
