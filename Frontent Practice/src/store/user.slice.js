import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

let fetchCurrentUser = createAsyncThunk(
  "fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      let res = await axios.get("http://localhost:8000/user/get-current-user", {
        withCredentials: true,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(err.response?.data?.message || "Failed to user ");
    }
  },
);

let currentUserSlice = createSlice({
  name: "user",
  initialState: {
    data: null,
    loading: false,
    error: null,
    fetched :false
  },
  reducers: {
    clearCurrentUser: (state, action) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.fetched = false;
    },
    updateCurrentUser: (state, action) => {
      state.data = { ...state.data, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCurrentUser.pending, (state, action) => {
      state.loading = true;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.data = action.payload.data;
      state.loading = false;
      state.fetched = true
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

let { clearCurrentUser, updateCurrentUser } = currentUserSlice.actions;

export {
  currentUserSlice,
  fetchCurrentUser,
  clearCurrentUser,
  updateCurrentUser,
};
