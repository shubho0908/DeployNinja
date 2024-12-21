import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DeploymentModel } from "@/types/schemas/Deployment";
import {
  getDeployments,
  startDeployment,
  GetDeploymentsResponse,
  updateDeployment,
  UpdateDeploymentResponse,
} from "@/redux/api/deploymentApi";

interface DeploymentState {
  deployments: DeploymentModel[] | null;
}

const initialState: DeploymentState = {
  deployments: null,
};

const deploymentSlice = createSlice({
  name: "deployments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      getDeployments.fulfilled,
      (state, action: PayloadAction<GetDeploymentsResponse>) => {
        state.deployments = action.payload.deployments;
      }
    );
    builder.addCase(
      startDeployment.fulfilled,
      (state, action: PayloadAction<DeploymentModel>) => {
        if (state.deployments) {
          state.deployments.push(action.payload);
        } else {
          state.deployments = [action.payload];
        }
      }
    );
    builder.addCase(
      updateDeployment.fulfilled,
      (state, action: PayloadAction<UpdateDeploymentResponse>) => {
        if (state.deployments && action.payload.status === 200) {
          const updatedDeployment = action.payload.data;
          state.deployments = state.deployments.map((deployment) =>
            deployment.id === updatedDeployment.id ? updatedDeployment : deployment
          );
        }
      }
    );
  },
});

export default deploymentSlice.reducer;
