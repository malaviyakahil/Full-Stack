import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getCurrentUser } from "../apis/user.apis";

let fetchCurrentUser = createAsyncThunk(
  "fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      let res = await getCurrentUser()
      return res.data;
    } catch (error) {
      return rejectWithValue(error?.message);
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
    clearCurrentUser: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.fetched = false;
    },
    updateCurrentUser: (state, action) => {
      state.data = { ...state.data, ...action.payload };
    },
    deleteCoverImage: (state) => {
      state.data = { ...state.data,coverImage:"" };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.data = action.payload;
      state.loading = false;
      state.fetched = true
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

let { clearCurrentUser, updateCurrentUser,deleteCoverImage } = currentUserSlice.actions;

export {
  currentUserSlice,
  fetchCurrentUser,
  clearCurrentUser,
  updateCurrentUser,
  deleteCoverImage
};
