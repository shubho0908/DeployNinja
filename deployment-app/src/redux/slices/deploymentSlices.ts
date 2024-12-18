import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DeploymentModel } from "@/types/models/Deployment.model";
import {
  getDeployments,
  startDeployment,
  GetDeploymentsResponse,
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
  },
});

export default deploymentSlice.reducer;
