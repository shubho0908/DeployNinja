import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getUser, GetUserResponse } from "../api/userApi";
import { User } from "@/types/models/User.model";

interface UserState {
  user: User | null;
}

const initialState: UserState = {
  user: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      getUser.fulfilled,
      (state, action: PayloadAction<GetUserResponse>) => {
        state.user = action.payload.user; // Update user state
      }
    );
  },
});

export default userSlice.reducer;
