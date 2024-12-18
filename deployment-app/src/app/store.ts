import { configureStore } from "@reduxjs/toolkit";
import userReducer from "@/redux/slices/userSlices";
import projectReducer from "@/redux/slices/projectSlices";
import deploymentReducer from "@/redux/slices/deploymentSlices";

export const store = configureStore({
  reducer: {
    user: userReducer,
    projects: projectReducer,
    deployments: deploymentReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
