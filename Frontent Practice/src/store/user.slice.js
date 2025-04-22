import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

let fetchCurrentUser = createAsyncThunk("fetchCurrentUser", async () => {
  let res = await axios.get("http://localhost:8000/user/get-current-user", {
    withCredentials: true,
  });
  return res.data;
});

let currentUserSlice = createSlice({
  name: "user",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentUser: (state, action) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
    updateCurrentUser: (state, action) => {    
      state.data = action.payload?.data?.data;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCurrentUser.pending, (state, action) => {
      state.loading = true;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.data = action.payload.data;
      state.loading = false;
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.error = false;
    });
  },
});

let { clearCurrentUser,updateCurrentUser } = currentUserSlice.actions;

export { currentUserSlice, fetchCurrentUser,clearCurrentUser ,updateCurrentUser};
