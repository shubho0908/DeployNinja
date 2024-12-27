"use client";

import React from "react";
import { Provider } from "react-redux";
import { store } from "@/app/store";

export const ReduxProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};
