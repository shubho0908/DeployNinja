"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ComponentType } from "react";
import { useSelector } from "react-redux";
import { getUser } from "@/redux/api/userApi";
import { useAppDispatch } from "@/redux/hooks";
import { RootState } from "@/app/store";
import { getProjects } from "@/redux/api/projectApi";

export default function withAuthRequired<P extends object>(
  Component: ComponentType<P>
) {
  return function WithAuthRequired(props: P) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useSelector((state: RootState) => state.user);

    // Authentication check effect
    useEffect(() => {
      if (status === "unauthenticated") {
        router.replace("/login");
      }
      else{
        router.replace("/dashboard");
      }
    }, [status, router]);

    // User data fetching effect
    useEffect(() => {
      const fetchUser = async () => {
        try {
          await dispatch(getUser());
        } catch (error) {
          console.error(error);
          alert("Failed to fetch user data. Please try again later.");
        }
      };

      const fetchProjects = async () => {
        try {
          await dispatch(getProjects(user?.id!));
        } catch (error) {
          console.error(error);
          alert("Failed to fetch projects. Please try again later.");
        }
      };

      if (!user && session) {
        fetchUser();
      }

      if (user) {
        fetchProjects();
      }
    }, [dispatch, user, session]);

    // Show nothing while loading
    if (status === "loading") {
      return null;
    }

    // Show nothing while redirecting or if no session
    if (!session) {
      return null;
    }

    // Show nothing while fetching user data
    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };
}
