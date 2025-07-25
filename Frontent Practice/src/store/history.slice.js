import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getHistory } from "../apis/user.apis";

let fetchHistory = createAsyncThunk("fetchHistory", async () => {
  try {
    let res = await getHistory();
    return res.data;
  } catch (error) {
    return rejectWithValue(error?.message);
  }
});

let historySlice = createSlice({
  name: "history",
  initialState: {
    data: null,
    error: null,
    loading: false,
  },
  reducers: {
    clearHistory: (state) => {
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
    setHistory: (state, action) => {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchHistory.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchHistory.fulfilled, (state, action) => {
      state.data = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchHistory.rejected, (state) => {
      state.error = false;
    });
  },
});

let { clearHistory, deleteFromHsitory, addToHistory, setHistory } =
  historySlice.actions;

export {
  clearHistory,
  historySlice,
  fetchHistory,
  deleteFromHsitory,
  addToHistory,
  setHistory,
};
