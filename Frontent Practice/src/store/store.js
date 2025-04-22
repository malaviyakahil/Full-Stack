import { configureStore } from "@reduxjs/toolkit";
import { currentUserSlice } from "./user.slice.js";
import { videosSlice } from "./videos.slice.js";
import { currentUserVideosSlice } from "./userVideos.slice.js";

export let store = configureStore({
  reducer: {
   currentUser:currentUserSlice.reducer,
   videos:videosSlice.reducer,
   currentUserVideos:currentUserVideosSlice.reducer,
  },
});
