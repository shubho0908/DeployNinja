import BlurFade from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import SparklesText from "@/components/ui/sparkles-text";
import { ArrowLeft, Rocket } from "lucide-react";
import Link from "next/link";
import React from "react";

function NotFound() {
  return (
    <>
      <main className="min-h-screen w-full h-full">
        <section className="relative top-32 pb-16 w-full">
          <BlurFade key="not-found" delay={0.25 + 0.5 * 0.05} inView>
            <div className="container flex items-center justify-center flex-col w-full mx-auto px-4 gap-8">
              <Rocket className="h-40 w-40 text-foreground mb-2" />
              <SparklesText text="404 - Not Found" />
              <p className="text text-muted-foreground">
                The page you are looking for doesn't exist.
              </p>
              <Button asChild>
                <Link href="/projects" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Projects
                </Link>
              </Button>
            </div>
          </BlurFade>
        </section>
      </main>
    </>
  );
}

export default NotFound;
