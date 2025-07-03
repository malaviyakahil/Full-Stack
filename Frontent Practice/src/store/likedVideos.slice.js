import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

let fetchLikedVideos = createAsyncThunk("fetchLikedVideos", async () => {
  let res = await axios.get(`http://localhost:8000/user/get-liked-videos`, {
    withCredentials: true,
  });
  return res.data;
});

let likedVideosSlice = createSlice({
  name: "likedVideos",
  initialState: {
    data: null,
    error: null,
    loading: false,
  },
  reducers: {
    clearLikedVideos: (state, action) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
    deleteFromLikedVideos: (state, action) => {
      state.data = state.data?.filter((item) => item._id !== action.payload);
    },
    addToLikedVideos: (state, action) => {
      state.data?.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchLikedVideos.pending, (state, action) => {
      state.loading = true;
    });
    builder.addCase(fetchLikedVideos.fulfilled, (state, action) => {
      state.data = action.payload.data;
      state.loading = false;
    });
    builder.addCase(fetchLikedVideos.rejected, (state, action) => {
      state.error = false;
    });
  },
});

let { clearLikedVideos, deleteFromLikedVideos, addToLikedVideos } =
  likedVideosSlice.actions;

export {
  clearLikedVideos,
  likedVideosSlice,
  fetchLikedVideos,
  addToLikedVideos,
  deleteFromLikedVideos,
};
