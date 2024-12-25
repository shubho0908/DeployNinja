"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Code,
  Rocket,
  Shield,
  Zap,
  Globe,
  GitBranch,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedShinyText from "@/components/ui/animated-shiny-text";
import { cn } from "@/lib/utils";

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

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  const features = [
    {
      icon: <Rocket className="h-6 w-6" />,
      title: "Instant Deployment",
      description:
        "Deploy your projects in seconds with our automated pipeline",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Real-time Analytics",
      description: "Monitor your application's performance in real-time",
    },
  ];

  const steps = [
    {
      icon: <GitBranch className="h-8 w-8" />,
      title: "Connect Repository",
      description: "Link your GitHub repository with a single click",
    },
    {
      icon: <Terminal className="h-8 w-8" />,
      title: "Configure Build",
      description: "Set up your build commands and environment variables",
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Go Live",
      description: "Your project is live with a secure URL in minutes",
    },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "2.1s", label: "Avg. Deploy Time" },
    { value: "50ms", label: "Global Latency" },
  ];

  if (loading || session) {
    return null;
  }

  return (
    <main className="min-h-screen">
      <section className="relative top-32 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 0.5,
                type: "spring",
                stiffness: 100,
              }}
            >
              <div className="z-10 flex items-center justify-center">
                <div
                  className={cn(
                    "group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                  )}
                >
                  <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                    <Rocket className="h-4 w-4 mr-2" />
                    Modern Deployment Platform
                  </AnimatedShinyText>
                </div>
              </div>
            </motion.div>

            <h1 className="text-6xl font-bold my-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Deploy Your Projects with Confidence
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect your GitHub repository and deploy your web applications in
              seconds. No complex configurations required.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button asChild size="lg" className="group">
                <Link href="/login">
                  Get Started
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-3 gap-8 mt-24"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={item}
                className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-32 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-16">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[40%] h-[2px] bg-border" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="mt-32 py-16 bg-primary/5 rounded-2xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl font-bold mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
