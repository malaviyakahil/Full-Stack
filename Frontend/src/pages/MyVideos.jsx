import { useEffect } from "react";
import { fetchcurrentUserVideos } from "../store/userVideos.slice";
import UserVideos from "../components/UserVideos";
import { useDispatch, useSelector } from "react-redux";

const MyVideos = () => {
  let { fetched } = useSelector((store) => store.currentUserVideos);
  let dispatch = useDispatch();

  useEffect(() => {
    if (!fetched) {
      dispatch(fetchcurrentUserVideos());
    }
  }, []);

  return <UserVideos />;
};

export default MyVideos;
