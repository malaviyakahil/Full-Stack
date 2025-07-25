import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "multipart/form-data" },
});

axiosInstance.interceptors.response.use(
  (response) => {
    return {
      ...response,
      data: response.data?.data ?? response.data, 
    };
  },
  (error) => {
    error.message =
      error?.response?.data?.message ||
      error?.message ||
      'An unexpected error occurred.';
      console.log(error)
    return Promise.reject(error);
  }
);

export default axiosInstance;
