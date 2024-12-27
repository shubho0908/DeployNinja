"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Rocket, Search } from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";
import BlurFade from "@/components/ui/blur-fade";
import BlurIn from "@/components/ui/blur-in";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProjectGrid from "./ProjectGrid";
import { FaReact, FaAngular } from "react-icons/fa";
import { RiNextjsFill } from "react-icons/ri";
import { IoLogoVue } from "react-icons/io5";

export default function ProjectsPage() {
  const { user } = useSelector((state: RootState) => state.user);
  const { projects } = useSelector((state: RootState) => state.projects);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [frameworkFilter, setFrameworkFilter] = useState("all");

  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    const sortedProjects = [...projects].sort((a, b) => {
      const dateA = new Date(a.createdAt!).getTime();
      const dateB = new Date(b.createdAt!).getTime();
      return dateB - dateA;
    });

    return sortedProjects.filter((project) => {
      const matchesSearch =
        !searchQuery ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase());

      const now = new Date();
      const projectDate = new Date(project.createdAt!);
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const startOfProjectDay = new Date(
        projectDate.getFullYear(),
        projectDate.getMonth(),
        projectDate.getDate()
      );
      const diffTime = startOfToday.getTime() - startOfProjectDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let matchesTime = false;
      switch (timeFilter) {
        case "today":
          matchesTime = diffDays === 0;
          break;
        case "3days":
          matchesTime = diffDays <= 2;
          break;
        case "7days":
          matchesTime = diffDays <= 6;
          break;
        default:
          matchesTime = true;
      }

      const matchesFramework =
        frameworkFilter === "all" || project.framework === frameworkFilter;

      return matchesSearch && matchesTime && matchesFramework;
    });
  }, [projects, searchQuery, timeFilter, frameworkFilter]);

  return (
    <>
      <div className="min-h-screen p-8">
        <div className="max-w-7xl relative top-16 mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="font-bold">
              <BlurIn
                word={`${user?.name}'s Projects`}
                className="text-4xl font-bold text-black dark:text-white"
              />
            </h1>
            <BlurFade key="BUTTON" delay={0.25 + 1 * 0.05} inView>
              <Button asChild className="bg-primary text-primary-foreground">
                <Link href="/projects/create">
                  <Rocket className="h-4 w-4" />
                  New Project
                </Link>
              </Button>
            </BlurFade>
          </div>

          <BlurFade key="search" delay={0.25 + 0.5 * 0.05} inView>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 dark:bg-zinc-950 bg-white"
                />
              </div>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40 dark:bg-zinc-950 bg-white">
                  <SelectValue placeholder="Time filter" />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-950 bg-white">
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="3days">Last 3 days</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={frameworkFilter}
                onValueChange={setFrameworkFilter}
              >
                <SelectTrigger className="w-40 dark:bg-zinc-950 bg-white">
                  <SelectValue placeholder="Framework" />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-950 bg-white">
                  <SelectItem value="all">All frameworks</SelectItem>
                  <SelectItem value="React">
                    <span className="flex items-center gap-2">
                      <FaReact className="w-5 h-5 text-blue-500" />
                      React
                    </span>
                  </SelectItem>
                  <SelectItem value="Next.js">
                    <span className="flex items-center gap-2">
                      <RiNextjsFill className="w-5 h-5 text-foreground" />
                      Next.js
                    </span>
                  </SelectItem>
                  <SelectItem value="Vue">
                    <span className="flex items-center gap-2">
                      <IoLogoVue className="w-5 h-5 text-green-500" />
                      Vue
                    </span>
                  </SelectItem>
                  <SelectItem value="Angular">
                    <span className="flex items-center gap-2">
                      <FaAngular className="w-5 h-5 text-red-600/80" />
                      Angular
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </BlurFade>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ProjectGrid projects={filteredProjects} />
          </motion.div>
        </div>
      </div>
    </>
  );
}
