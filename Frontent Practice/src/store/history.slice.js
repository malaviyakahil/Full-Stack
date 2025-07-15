import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

let fetchHistory = createAsyncThunk("fetchHistory", async () => {
  let res = await axios.get(`http://localhost:8000/user/get-history`, {
    withCredentials: true,
  });
  return res.data;
});

let historySlice = createSlice({
  name: "history",
  initialState: {
    data: null,
    error: null,
    loading: false,
  },
  reducers: {
    clearHistory: (state, action) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
    deleteFromHsitory: (state, action) => {
      state.data = state.data?.filter((video) => video._id !== action.payload);
    },
    addToHistory: (state, action) => {
      state.data?.unshift(action.payload);
      if (state.data?.length > 10) {
    state.data = state.data.slice(0, 10);
  }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchHistory.pending, (state, action) => {
      state.loading = true;
    });
    builder.addCase(fetchHistory.fulfilled, (state, action) => {
      state.data = action.payload.data;
      state.loading = false;
    });
    builder.addCase(fetchHistory.rejected, (state, action) => {
      state.error = false;
    });
  },
});

let { clearHistory, deleteFromHsitory, addToHistory } = historySlice.actions;

export {
  clearHistory,
  historySlice,
  fetchHistory,
  deleteFromHsitory,
  addToHistory,
};