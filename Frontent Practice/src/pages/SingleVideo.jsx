import React, { useRef, useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { SlVolume2, SlVolumeOff } from "react-icons/sl";
import { IoSettingsOutline } from "react-icons/io5";
import { RiPictureInPictureLine } from "react-icons/ri";
import { PiPause, PiPlay } from "react-icons/pi";
import { BiExitFullscreen, BiFullscreen } from "react-icons/bi";
import { TbRewindBackward10, TbRewindForward10 } from "react-icons/tb";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { BiLike, BiDislike, BiSolidDislike, BiSolidLike } from "react-icons/bi";
import { IoShareSocialOutline } from "react-icons/io5";
import { PiDownloadSimpleBold } from "react-icons/pi";
import CommentSection from "../components/CommentSection";
import { useDispatch, useSelector } from "react-redux";
import { addToHistory } from "../store/history.slice.js";
import {
  addToLikedVideos,
  deleteFromLikedVideos,
} from "../store/likedVideos.slice.js";

const formatTime = (time) => {
  const minutes = Math.floor(time / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const SingleVideo = () => {
  const { ownerId, videoId } = useParams();
  const [video, setVideo] = useState({});
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const timeoutRef = useRef(null);

  const [loading, setLoading] = useState(true);
  let [subCount, setSubCount] = useState({
    count: 0,
    status: false,
    disabled: false,
  });
  let [channelDetails, setChannelDetails] = useState({});
  let [reviewCount, setReviewCount] = useState({
    like: { count: 0, status: false },
    dislike: { count: 0, status: false },
  });
  const [isExpanded, setIsExpanded] = useState(false);
  let currentUser = useSelector((store) => store.currentUser);
  const toggleExpanded = () => setIsExpanded(!isExpanded);
  let dispatch = useDispatch();
  const [selectedQuality, setSelectedQuality] = useState("");
  const [availableQualities, setAvailableQualities] = useState([]);
  const [videoSrc, setVideoSrc] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        let [videoRes, statusRes, reviewRes, detailsRes] = await Promise.all([
          axios.post(`http://localhost:8000/user/get-video/${videoId}`, [], {
            withCredentials: true,
          }),
          axios.post(
            `http://localhost:8000/user/get-sub-status/${ownerId}`,
            [],
            { withCredentials: true },
          ),
          axios.post(
            `http://localhost:8000/user/get-review-status/${videoId}`,
            [],
            { withCredentials: true },
          ),
          axios.get(
            `http://localhost:8000/user/get-channel-details/${ownerId}`,
            [],
            { withCredentials: true },
          ),
        ]);

        setSubCount({
          status: statusRes.data?.data,
          count: detailsRes.data?.data.subs,
        });
        setVideo(videoRes.data?.data);
        setAvailableQualities(videoRes.data?.data?.availableQualities);
        setSelectedQuality(videoRes.data?.data?.originalQuality);
        setReviewCount({
          like: {
            count: videoRes?.data?.data?.reviews?.Like,
            status: reviewRes.data?.data?.review === "Like",
          },
          dislike: {
            count: videoRes?.data?.data?.reviews?.Dislike,
            status: reviewRes.data?.data?.review === "Dislike",
          },
        });
        setChannelDetails(detailsRes.data?.data);

        if (videoRes.data.data.history._id) {
          dispatch(
            addToHistory({
              _id: videoRes.data?.data.history._id,
              video: {
                ...videoRes.data?.data,
                owner: { ...detailsRes.data?.data },
              },
            }),
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!video.video || !selectedQuality) return;

    const transformMap = {
      "144p": "w_256,h_144,c_scale",
      "240p": "w_426,h_240,c_scale",
      "360p": "w_640,h_360,c_scale",
      "480p": "w_854,h_480,c_scale",
      "720p": "w_1280,h_720,c_scale",
      "1080p": "w_1920,h_1080,c_scale",
    };

    const videoElement = videoRef.current;
    if (!videoElement) return;

    const currentTime = videoElement.currentTime;
    const wasPlaying = !videoElement.paused;

    const [, base] = video.video.split("/upload/");
    const transform = transformMap[selectedQuality];
    const newUrl =
      selectedQuality === video.originalQuality
        ? video.video
        : `https://res.cloudinary.com/malaviyakahil/video/upload/${transform}/${base}`;

    const restorePosition = () => {
      videoElement.currentTime = currentTime;
      videoElement.playbackRate = speed;
      if (wasPlaying) {
        videoElement.play().catch((err) => {
          console.warn("Resume failed after quality switch:", err);
        });
      }
      videoElement.removeEventListener("loadedmetadata", restorePosition);
    };

    videoElement.addEventListener("loadedmetadata", restorePosition);
    setVideoSrc(newUrl);
  }, [selectedQuality, video, speed]);

  useEffect(() => {
    if (loading) return;
    const video = videoRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setPlaying(false);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const handleFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const resetControlsTimer = () => {
      clearTimeout(timeoutRef.current);
      setShowControls(true);
      if (!showSettings) {
        timeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 1000);
      }
    };

    const container = containerRef.current;
    container.addEventListener("mousemove", resetControlsTimer);
    container.addEventListener("click", resetControlsTimer);
    container.addEventListener("touchstart", resetControlsTimer);

    resetControlsTimer();

    return () => {
      container.removeEventListener("mousemove", resetControlsTimer);
      container.removeEventListener("click", resetControlsTimer);
      container.removeEventListener("touchstart", resetControlsTimer);
    };
  }, [loading, showSettings]);

  const handleSeek = (e) => {
    const video = videoRef.current;
    const wasPlaying = !video.paused;

    if (wasPlaying) video.pause();

    const seekTarget = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = seekTarget;
    setProgress(parseFloat(e.target.value));

    if (wasPlaying) {
      setTimeout(() => {
        video.play().catch((err) => console.warn("Resume failed:", err));
      }, 60);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    videoRef.current.volume = vol;
    setVolume(vol);
    setMuted(vol === 0);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const isMobile = window.innerWidth < 768;

    try {
      if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        }
        if (isMobile && screen.orientation?.lock) {
          await screen.orientation.lock("landscape");
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        if (isMobile && screen.orientation?.unlock) {
          await screen.orientation.unlock();
        }
      }
    } catch (err) {
      console.warn("Fullscreen or orientation lock failed:", err);
    }
  };

  const togglePiP = async () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      if (videoRef.current !== document.pictureInPictureElement) {
        await videoRef.current.requestPictureInPicture();
      }
    }
  };

  const changeSpeed = (e) => {
    const newSpeed = parseFloat(e.target.value);
    videoRef.current.playbackRate = newSpeed;
    setSpeed(newSpeed);
  };

  const changeQuality = (e) => {
    const newQuality = e.target.value;
    setSelectedQuality(newQuality);
  };

  const skipBackward = () => {
    videoRef.current.currentTime = Math.max(
      0,
      videoRef.current.currentTime - 10,
    );
  };

  const skipForward = () => {
    videoRef.current.currentTime = Math.min(
      duration,
      videoRef.current.currentTime + 10,
    );
  };

  const subscribeToggle = () => {
    if (subCount.status) {
      setSubCount({
        ...subCount,
        status: false,
        count: subCount.count - 1,
      });
      axios.post(`http://localhost:8000/user/unsubscribe-to/${ownerId}`, [], {
        withCredentials: true,
      });
    } else {
      setSubCount({
        ...subCount,
        status: true,
        count: subCount.count + 1,
      });
      axios.post(`http://localhost:8000/user/subscribe-to/${ownerId}`, [], {
        withCredentials: true,
      });
    }
  };

  const likeToggle = () => {
    if (reviewCount.like.status) {
      setReviewCount({
        ...reviewCount,
        like: {
          status: false,
          count: reviewCount.like.count - 1,
        },
      });
      dispatch(deleteFromLikedVideos(videoId));
      axios.post(`http://localhost:8000/video/delete-review/${videoId}`, [], {
        withCredentials: true,
      });
    } else {
      dispatch(
        addToLikedVideos({
          _id:videoId,
          video: {
            ...video,
            owner: { ...channelDetails },
          },
        }),
      );
      if (reviewCount.dislike.status) {
        setReviewCount({
          like: {
            status: true,
            count: reviewCount.like.count + 1,
          },
          dislike: {
            status: false,
            count: reviewCount.dislike.count - 1,
          },
        });
      } else {
        setReviewCount({
          ...reviewCount,
          like: {
            status: true,
            count: reviewCount.like.count + 1,
          },
        });
      }
      axios.post(`http://localhost:8000/video/like-video/${videoId}`, [], {
        withCredentials: true,
      });
    }
  };

  const dislikeToggle = () => {
    if (reviewCount.dislike.status) {
      setReviewCount({
        ...reviewCount,
        dislike: {
          status: false,
          count: reviewCount.dislike.count - 1,
        },
      });
      axios.post(`http://localhost:8000/video/delete-review/${videoId}`, [], {
        withCredentials: true,
      });
    } else {
      dispatch(deleteFromLikedVideos(video._id));
      if (reviewCount.like.status) {
        setReviewCount({
          dislike: {
            status: true,
            count: reviewCount.dislike.count + 1,
          },
          like: {
            status: false,
            count: reviewCount.like.count - 1,
          },
        });
      } else {
        setReviewCount({
          ...reviewCount,
          dislike: {
            status: true,
            count: reviewCount.dislike.count + 1,
          },
        });
      }
      axios.post(`http://localhost:8000/video/dislike-video/${videoId}`, [], {
        withCredentials: true,
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-transparent text-white max-w-6xl mx-auto py-5 animate-pulse">
        <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-gradient-to-t from-black/70 to-transparent text-white text-sm">
            <div className="h-2 bg-gray-600 rounded-full w-full mb-3" />

            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-600 rounded" />
                <div className="w-20 h-2 bg-gray-600 rounded hidden md:block" />
                <div className="w-24 h-3 bg-gray-600 rounded" />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-600 rounded-full" />
                <div className="w-6 h-6 bg-gray-600 rounded-full" />
                <div className="w-6 h-6 bg-gray-600 rounded-full" />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-4 bg-gray-600 rounded hidden md:inline" />
                <div className="w-5 h-5 bg-gray-600 rounded" />
                <div className="w-5 h-5 bg-gray-600 rounded" />
                <div className="w-5 h-5 bg-gray-600 rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 w-3/5 h-5 bg-gray-700 rounded" />

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full" />
            <div>
              <div className="w-24 h-4 bg-gray-600 rounded mb-1" />
              <div className="w-20 h-3 bg-gray-600 rounded" />
            </div>
          </div>
          <div className="w-24 h-8 bg-gray-700 rounded-4xl" />
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-sm">
          <div className="w-20 h-8 bg-gray-700 rounded-4xl" />
          <div className="w-24 h-8 bg-gray-700 rounded-4xl" />
          <div className="w-20 h-8 bg-gray-700 rounded-4xl" />
          <div className="w-24 h-8 bg-gray-700 rounded-4xl" />
        </div>

        <div className="mt-5 w-full bg-gray-700 p-4 rounded-xl space-y-3">
          <div className="w-40 h-4 bg-gray-600 rounded" />
          <div className="w-full h-3 bg-gray-600 rounded" />
          <div className="w-full h-3 bg-gray-600 rounded" />
          <div className="w-1/2 h-3 bg-gray-600 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent text-white max-w-6xl mx-auto py-5">
      <div
        ref={containerRef}
        className={`relative w-full bg-black aspect-video max-w-screen-xl rounded-lg mx-auto mt-4 overflow-hidden ${
          theaterMode ? "xl:h-[80vh]" : ""
        }`}
      >
        <video
          ref={videoRef}
          className="w-full h-full transition-all"
          src={videoSrc}
          onClick={togglePlay}
        />

        <div
          className={`absolute bottom-0 w-full transition-opacity duration-300 ${
            showControls || showSettings
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          } bg-gradient-to-t from-black/80 to-transparent p-3 text-white flex flex-col gap-2`}
        >
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={handleSeek}
            className="w-full"
          />

          <div className="flex items-center justify-between gap-3 text-sm flex-wrap">
            <div className="flex items-center gap-3">
              <button onClick={toggleMute}>
                {muted || volume === 0 ? (
                  <SlVolumeOff size={20} />
                ) : (
                  <SlVolume2 size={20} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 hidden md:block"
              />
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={skipBackward}>
                <TbRewindBackward10 size={20} />
              </button>
              <button onClick={togglePlay}>
                {playing ? <PiPause size={20} /> : <PiPlay size={20} />}
              </button>
              <button onClick={skipForward}>
                <TbRewindForward10 size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3 relative">
              <button
                onClick={() => setTheaterMode((prev) => !prev)}
                className="hidden md:inline"
              >
                <span className="text-sm">Theater</span>
              </button>
              <button onClick={togglePiP}>
                <RiPictureInPictureLine size={20} />
              </button>
              <button onClick={toggleFullscreen}>
                {fullscreen ? (
                  <BiExitFullscreen size={20} />
                ) : (
                  <BiFullscreen size={20} />
                )}
              </button>
              <div className="relative flex align-middle">
                <button onClick={() => setShowSettings((prev) => !prev)}>
                  <IoSettingsOutline size={20} />
                </button>
                {showSettings && (
                  <div className="absolute p-1 right-0 bottom-full mb-2 bg-base-100 text-white text-sm rounded-xl shadow-md w-40 z-10 max-h-48 overflow-y-auto">
                    <div className="p-2 border-b border-gray-700">
                      <label className="block mb-1">Speed</label>
                      <select
                        value={speed}
                        onChange={changeSpeed}
                        className="w-full p-1 bg-gray-700 text-white rounded outline-none"
                      >
                        {[0.25, 0.5, 1, 1.25, 1.5, 2].map((s) => (
                          <option key={s} value={s}>
                            {s}x
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p-2 border-b border-gray-700">
                      <label className="block mb-1">Quality</label>
                      <select
                        value={selectedQuality}
                        onChange={changeQuality}
                        className="w-full bg-gray-700 text-white rounded outline-none p-1"
                      >
                        {availableQualities?.map((s, i) => (
                          <option key={i} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold">
          {video?.title || "Untitled Video"}
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6 mt-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 overflow-hidden rounded-full">
              <Link to={`/app/dashboard/single-channel/${channelDetails?._id}`}>
                <img
                  src={channelDetails?.avatar}
                  alt="Avatar"
                  className="object-cover h-full w-full"
                />
              </Link>
            </div>
            <div>
              <Link to={`/app/dashboard/single-channel/${channelDetails?._id}`}>
                <p className="font-semibold">{channelDetails?.name}</p>
              </Link>
              <p className="text-sm text-gray-400">
                {subCount?.count} subscribers
              </p>
            </div>
          </div>

          {channelDetails?._id == currentUser.data?._id ? (
            ""
          ) : (
            <div className="flex space-x-3">
              <button
                disabled={subCount.disabled}
                onClick={subscribeToggle}
                className={`text-white px-4 py-1 rounded-4xl text-md ${
                  subCount?.status
                    ? "bg-gray-800"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {subCount.status ? "Subscribed" : "Subscribe"}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-sm">
          <button
            onClick={likeToggle}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-1 rounded-4xl flex justify-center items-center gap-1"
          >
            {reviewCount.like.status ? <BiSolidLike /> : <BiLike />}
            {reviewCount.like.count}
          </button>
          <button
            onClick={dislikeToggle}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-1 rounded-4xl flex justify-center items-center gap-1"
          >
            {reviewCount.dislike.status ? <BiSolidDislike /> : <BiDislike />}
            {reviewCount.dislike.count}
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-4 py-1 rounded-4xl flex justify-center items-center gap-1">
            <IoShareSocialOutline /> Share
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-4 py-1 rounded-4xl flex justify-center items-center gap-1">
            <PiDownloadSimpleBold /> Download
          </button>
        </div>

        <div className="my-3 w-full bg-gray-700 p-4 rounded-xl">
          <div
            className={`text-sm text-gray-100 whitespace-pre-line transition-all duration-300 ${
              isExpanded ? "" : "line-clamp-3"
            }`}
          >
            <div className="font-semibold mb-2.5 text-gray-100">
              {video?.views} views &nbsp;{" "}
              {video?.createdAt &&
                formatDistanceToNow(new Date(video.createdAt), {
                  addSuffix: true,
                })}
            </div>
            {video?.description}
          </div>
          <button
            onClick={toggleExpanded}
            className="mt-2 text-gray-300 text-sm font-medium"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        </div>

        <CommentSection
          channelDetails={channelDetails}
          videoId={videoId}
          ownerId={ownerId}
        />
      </div>
    </div>
  );
};

export default SingleVideo;
