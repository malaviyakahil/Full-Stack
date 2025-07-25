import axiosInstance from "./axiosInstance";

const getAllVideos = async ({ page, limit }) => {
  return await axiosInstance.get("/video/get-all-videos", {
    params: { page, limit },
  });
};

const uploadVideo = async (formData) => {
  return await axiosInstance.post(`/video/upload-video`, formData);
};

const deleteVideo = async (id) => {
  return await axiosInstance.post(`/video/delete-video/${id}`);
};

const changeVideoTitle = async (id, formData) => {
  return await axiosInstance.post(`/video/change-video-title/${id}`, formData);
};

const changeVideoDescription = async (id, formData) => {
  return await axiosInstance.post(
    `/video/change-video-description/${id}`,
    formData,
  );
};

const changeVideoThumbnail = async (id, formData) => {
  return await axiosInstance.post(
    `/video/change-video-thumbnail/${id}`,
    formData,
  );
};

const getVideo = async (id) => {
  return await axiosInstance.post(`/video/get-video/${id}`);
};

const likeVideo = async (id) => {
  return await axiosInstance.post(`/video/like-video/${id}`);
};

const disLikeVideo = async (id) => {
  return await axiosInstance.post(`/video/dislike-video/${id}`);
};

const deleteReview = async (videoId) => {
  return await axiosInstance.post(`/video/delete-review/${videoId}`);
};

export {
  getAllVideos,
  uploadVideo,
  deleteVideo,
  changeVideoTitle,
  changeVideoDescription,
  changeVideoThumbnail,
  getVideo,
  likeVideo,
  disLikeVideo,
  deleteReview,
};
