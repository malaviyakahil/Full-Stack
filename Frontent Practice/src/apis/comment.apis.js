import axiosInstance from "./axiosInstance";

const getComments = async (videoId) => {
  return axiosInstance.get(`/comment/get-comments/${videoId}`);
};

const addComment = async (videoId, formData) => {
  return axiosInstance.post(`/comment/add-comment/${videoId}`, formData);
};

const likeComment = async (id) => {
  return axiosInstance.post(`/comment/like-comment/${id}`);
};

const disLikeComment = async (id) => {
  return axiosInstance.post(`/comment/dislike-comment/${id}`);
};

const deleteCommentReview = async (id) => {
  return axiosInstance.post(`/comment/delete-comment-review/${id}`);
};

const takeHeart = async (id) => {
  return axiosInstance.post(`/comment/take-heart/${id}`);
};

const giveHeart = async (id) => {
  return axiosInstance.post(`/comment/give-heart/${id}`);
};

const pin = async (id) => {
  return axiosInstance.post(`/comment/pin/${id}`);
};

const unPin = async (id) => {
  return axiosInstance.post(`/comment/un-pin/${id}`);
};

const deleteComment = async (id) => {
  return axiosInstance.post(`/comment/delete-comment/${id}`);
};

const editComment = async (id, formData) => {
  return axiosInstance.post(`/comment/edit-comment/${id}`, formData);
};

export {
  getComments,
  addComment,
  likeComment,
  disLikeComment,
  deleteCommentReview,
  takeHeart,
  giveHeart,
  pin,
  unPin,
  deleteComment,
  editComment,
};
