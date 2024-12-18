import { createAsyncThunk } from "@reduxjs/toolkit";
import { DeploymentModel } from "@/types/models/Deployment.model";
import { API, handleApiError } from "./util";
import { auth } from "@/auth";

export interface GetDeploymentsResponse {
  deployments: DeploymentModel[];
}

export const getDeployments = createAsyncThunk<
  GetDeploymentsResponse,
  string,
  { rejectValue: string }
>(
  "deployment/getDeployments",
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/deploy?projectId=${projectId}`);
      return { deployments: response.data } as GetDeploymentsResponse;
    } catch (error) {
      const errorMessage = await handleApiError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const startDeployment = createAsyncThunk<
  DeploymentModel,
  { deploymentData: DeploymentModel; requestMaker: string },
  { rejectValue: string }
>(
  "deployment/startDeployment",
  async ({ deploymentData, requestMaker }, { rejectWithValue }) => {
    try {
      const session = await auth();
      const response = await API.post(
        `/deploy?projectId=${deploymentData.projectId}`,
        deploymentData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Request-Maker": requestMaker,
            "Authorization": `Bearer ${session?.accessToken}`,
          },
        }
      );
      return response.data as DeploymentModel;
    } catch (error) {
      const errorMessage = await handleApiError(error);
      return rejectWithValue(errorMessage);
    }
  }
);
