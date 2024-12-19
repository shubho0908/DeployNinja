"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ComponentType } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/redux/hooks";
import { RootState } from "@/app/store";
import { getUser } from "@/redux/api/userApi";
import { getProjects } from "@/redux/api/projectApi";

export default function withAuthRequired<P extends object>(
  Component: ComponentType<P>
) {
  return function WithAuthRequired(props: P) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useSelector((state: RootState) => state.user);

    useEffect(() => {
      // Handle authentication routing
      if (status === "unauthenticated") {
        const isAuthPage =
          window.location.pathname === "/" ||
          window.location.pathname.includes("/login");
        router.replace(isAuthPage ? "/dashboard" : "/login");
        return;
      }

      // Handle data fetching
      const initializeUserData = async () => {
        if (!user && session) {
          try {
            await dispatch(getUser());
          } catch (error) {
            console.error("Failed to fetch user data:", error);
          }
        }
      };

      const initializeProjects = async () => {
        if (user?.id) {
          try {
            await dispatch(getProjects(user.id));
          } catch (error) {
            console.error("Failed to fetch projects:", error);
          }
        }
      };

      initializeUserData();
      if (user) initializeProjects();
    }, [status, router, dispatch, user, session]);

    // Don't render anything while loading or unauthorized
    if (status === "loading" || !session || !user) {
      return null;
    }

    return <Component {...props} />;
  };
}
