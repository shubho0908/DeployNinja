import { createAsyncThunk } from "@reduxjs/toolkit";
import { DeploymentModel } from "@/types/schemas/Deployment";
import { API, handleApiError } from "./util";
import { getSession } from "next-auth/react";
import { DeploymentStatus } from "@prisma/client";

export interface GetDeploymentsResponse {
  deployments: DeploymentModel[];
}

export interface UpdateDeploymentResponse {
  status: number;
  message: string;
  data: DeploymentModel;
}

export const startDeployment = createAsyncThunk<
  DeploymentModel,
  {
    projectId: string;
    deploymentParams: DeploymentModel;
    requestMaker: string;
  },
  { rejectValue: string }
>(
  "deployment/startDeployment",
  async ({ projectId, deploymentParams, requestMaker }, { rejectWithValue }) => {
    try {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error("Authentication required");
      }

      const response = await API.post(
        `/deploy?projectId=${projectId}`,
        deploymentParams,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Request-Maker": requestMaker,
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      return response.data.data.deployment as DeploymentModel;
    } catch (error) {
      const errorMessage = await handleApiError(error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const getDeployments = createAsyncThunk<
  GetDeploymentsResponse,
  string,
  { rejectValue: string }
>("deployment/getDeployments", async (projectId, { rejectWithValue }) => {
  try {
    const session = await getSession();
    if (!session?.accessToken) {
      throw new Error("Authentication required");
    }

    const response = await API.get(`/deploy?projectId=${projectId}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
    return { deployments: response.data.data } as GetDeploymentsResponse;
  } catch (error) {
    const errorMessage = await handleApiError(error);
    return rejectWithValue(errorMessage);
  }
});

export const updateDeployment = createAsyncThunk<
  UpdateDeploymentResponse,
  { deploymentId: string; deploymentStatus: DeploymentStatus },
  { rejectValue: string }
>(
  "deployment/updateDeployment",
  async ({ deploymentId, deploymentStatus }, { rejectWithValue }) => {
    try {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error("Authentication required");
      }

      const response = await API.patch(
        `/deploy?deploymentId=${deploymentId}`,
        {
          deploymentStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      return response.data as UpdateDeploymentResponse;
    } catch (error) {
      const errorMessage = await handleApiError(error);
      return rejectWithValue(errorMessage);
    }
  }
);