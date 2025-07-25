import axiosInstance from "./axiosInstance";

const registerUser = async (formData) => {
  return axiosInstance.post("/user/register", formData);
};
const loginUser = async (formData) => {
  return axiosInstance.post("/user/login", formData);
};
const authMe = async () => {
  return axiosInstance.get("/user/auth-me");
};
const getCurrentUser = async () => {
  return axiosInstance.get("/user/get-current-user");
};
const logoutUser = async () => {
  return axiosInstance.post("/user/logout");
};
const getCurrentUserVideos = async ({ page, limit }) =>
  await axiosInstance.get("/user/get-current-user-videos", {
    params: { page, limit },
  });

const changePassword = async (formData) => {
  return axiosInstance.post("/user/change-password", formData);
};
const deleteUser = async (formData) => {
  return axiosInstance.post("/user/delete-user", formData);
};
const changeFullName = async (formData) => {
  return axiosInstance.post("/user/change-full-name", formData);
};
const changeAvatar = async (formData) => {
  return axiosInstance.post("/user/change-avatar", formData);
};
const changeCoverImage = async (formData) => {
  return axiosInstance.post("/user/change-cover-image", formData);
};
const removeCoverImage = async () => {
  return axiosInstance.post("/user/remove-cover-image");
};
const getHistory = async () => {
  return axiosInstance.get(`/user/get-history`);
};
const deleteHistory = async (id) => {
  return axiosInstance.post(`/user/delete-history/${id}`);
};
const getLikedVideos = async ({page,limit}) => {
  return axiosInstance.get(`/user/get-liked-videos`,{params:{page,limit}});
};
const getReviewStatus = async (videoId) => {
  return axiosInstance.post(`/user/get-review-status/${videoId}`);
};

export {
  registerUser,
  loginUser,
  authMe,
  getCurrentUser,
  getCurrentUserVideos,
  logoutUser,
  changePassword,
  deleteUser,
  changeFullName,
  changeAvatar,
  changeCoverImage,
  removeCoverImage,
  getHistory,
  deleteHistory,
  getLikedVideos,
  getReviewStatus
};
