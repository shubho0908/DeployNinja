"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { signIn } from "next-auth/react";

const Login = () => {

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Deploy your projects with confidence
          </p>
        </div>
        <div className="glass-card p-8 rounded-lg space-y-6">
          <Button
            onClick={() => signIn("github")}
            className="w-full py-6 text-lg flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-black"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
