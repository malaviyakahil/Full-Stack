import { createRoot } from "react-dom/client";
import "./assets/css/style.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home";
import App from "./App";
import RegisterForm from "./pages/RegisterForm";
import LoginForm from "./pages/LoginForm";
import { Provider } from "react-redux";
import { store } from "./store/store.js";
import Dashboard from "./pages/Dashboard.jsx";
import MyVideos from "./pages/MyVideos.jsx";
import UploadVideoForm from "./pages/UploadVideoForm.jsx";
import VideoDashboard from "./VideoDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";
import HomeDashboard from "./HomeDashboard.jsx";
import SingleVideo from "./pages/SingleVideo.jsx";
import EditVideoForm from "./pages/EditVideoForm.jsx";
import ProfileDashboard from "./ProfileDashboard.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import SettingDashboard from "./SettingDashboard.jsx";
import EditProfileForm from "./pages/EditProfileForm.jsx";
import ChangePasswordForm from "./pages/ChangePasswordForm.jsx";

let router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/register",
    element: <RegisterForm />,
  },
  {
    path: "/login",
    element: <LoginForm />,
  },
  {
    path: "/app",
    element: <App />,
    children: [
      {
        path: "dashboard",
        element: <HomeDashboard />,
        children: [
          {
            path: "all",
            element: <Dashboard />,
          },
          {
            path: "single-video/:ownerId/:videoId",
            element: <SingleVideo />,
          },
        ],
      },
      {
        path: "profile",
        element: <ProfileDashboard />,
        children: [
          {
            path: "details",
            element: <MyProfile />,
          },
        ],
      },
      {
        path: "my-videos",
        element: <VideoDashboard />,
        children: [
          {
            path: "uploaded-videos",
            element: <MyVideos />,
          },
          {
            path: "upload-video",
            element: <UploadVideoForm />,
          },
          {
            path: "edit-video/:id",
            element: <EditVideoForm />,
          },
        ],
      },
      {
        path: "settings",
        element: <SettingDashboard/>,
        children: [
          {
            path: "edit-profile",
            element: <EditProfileForm />,
          },
          {
            path: "change-password",
            element: <ChangePasswordForm />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>,
);
