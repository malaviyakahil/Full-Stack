import React, { useRef, useState, useEffect } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { SlVolume2, SlVolumeOff } from "react-icons/sl";
import { IoSettingsOutline } from "react-icons/io5";
import { RiPictureInPictureLine } from "react-icons/ri";
import { PiPause, PiPlay } from "react-icons/pi";
import { BiExitFullscreen, BiFullscreen } from "react-icons/bi";
import { TbRewindBackward10, TbRewindForward10 } from "react-icons/tb";
import { Link, useParams } from "react-router-dom";
import { BiLike, BiDislike, BiSolidDislike, BiSolidLike } from "react-icons/bi";
import { GoShareAndroid } from "react-icons/go";
import { PiDownloadSimpleBold } from "react-icons/pi";
import CommentSection from "../components/CommentSection";
import { useDispatch, useSelector } from "react-redux";
import { addToHistory } from "../store/history.slice.js";
import {
  addToLikedVideos,
  deleteFromLikedVideos,
} from "../store/likedVideos.slice.js";
import formatTime from "../utils/formatTime";
import {
  deleteReview,
  disLikeVideo,
  getVideo,
  likeVideo,
} from "../apis/video.apis.js";
import {
  getChannelDetails,
  getSubStatus,
  subscribeTo,
  unSubscribeTo,
} from "../apis/channel.apis.js";
import { getReviewStatus } from "../apis/user.apis.js";
import SpeedSelector from "../components/SpeedSelector.jsx";
import QualitySelector from "../components/QualitySelector.jsx";
import formatNumber from "../utils/formatNumber.js";

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
  const [switchingQuality, setSwitchingQuality] = useState(false);
  const qualityLoaderTimeout = useRef(null);
  const qualityLoaderMinimumTime = useRef(null);
  let [error, setError] = useState("");
  const [reviewLock, setReviewLock] = useState(false);
  const [subscribeLock, setSubscribeLock] = useState(false);

  const [isSeeking, setIsSeeking] = useState(false);
  const seekBarRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        let [videoRes, statusRes, reviewRes, detailsRes] = await Promise.all([
          getVideo(videoId),
          getSubStatus(ownerId),
          getReviewStatus(videoId),
          getChannelDetails(ownerId),
        ]);
        setSubCount({
          status: statusRes?.data,
          count: detailsRes?.data?.subs,
        });
        setVideo(videoRes?.data);
        setAvailableQualities(videoRes?.data?.availableQualities);
        setSelectedQuality(videoRes?.data?.originalQuality);
        setReviewCount({
          like: {
            count: videoRes?.data?.reviews?.Like,
            status: reviewRes?.data?.review === "Like",
          },
          dislike: {
            count: videoRes?.data?.reviews?.Dislike,
            status: reviewRes?.data?.review === "Dislike",
          },
        });
        setChannelDetails(detailsRes?.data);

        if (videoRes?.data?.history?._id) {
          dispatch(
            addToHistory({
              _id: videoRes?.data?.history?._id,
              video: {
                ...videoRes?.data,
                owner: { ...detailsRes?.data },
              },
            }),
          );
        }
      } catch (error) {
        setError(error?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!video.video || !selectedQuality || !videoRef.current) return;

    const transformMap = {
      "144p": "w_256,h_144",
      "240p": "w_426,h_240",
      "360p": "w_640,h_360",
      "480p": "w_854,h_480",
      "720p": "w_1280,h_720",
      "1080p": "w_1920,h_1080",
    };

    const [, base] = video.video.split("/upload/");
    const transform = transformMap[selectedQuality];
    const newUrl =
      selectedQuality === video.originalQuality
        ? video.video
        : `https://res.cloudinary.com/malaviyakahil/video/upload/${transform}/${base}`;

    const videoElement = videoRef.current;
    const savedTime = videoElement.currentTime;
    const wasPlaying = !videoElement.paused;

    setSwitchingQuality(true);
    qualityLoaderMinimumTime.current = Date.now();

    const handleLoadedMetadata = () => {
      try {
        // Ensure duration is updated
        setDuration(videoElement.duration);

        // Restore current time
        videoElement.currentTime = savedTime;
        videoElement.playbackRate = speed;

        if (wasPlaying) {
          videoElement.play().catch((err) => {
            console.warn("Playback failed after switching quality:", err);
          });
        }
      } catch (err) {
        console.warn("Restoring time failed:", err);
      }

      const elapsed = Date.now() - qualityLoaderMinimumTime.current;
      const remaining = Math.max(0, 200 - elapsed);

      qualityLoaderTimeout.current = setTimeout(() => {
        setSwitchingQuality(false);
      }, remaining);

      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };

    videoElement.pause();
    videoElement.src = newUrl;
    videoElement.load();
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      clearTimeout(qualityLoaderTimeout.current);
    };
  }, [selectedQuality]);

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

  const resetControlsTimer = () => {
    if (isSeeking) return; // Prevent triggering while dragging

    clearTimeout(timeoutRef.current);
    setShowControls(true);

    timeoutRef.current = setTimeout(() => {
      if (!showSettings && !isSeeking) {
        setShowControls(false);
      }
    }, 1500);
  };

  useEffect(() => {
    if (loading) return;

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
  }, [loading, showSettings, isSeeking]); // ✅ include isSeeking

  useEffect(() => {
    const seekBar = seekBarRef.current;
    if (!seekBar) return;

    const handlePointerMove = () => {
      if (!isSeeking) return;
      clearTimeout(timeoutRef.current);
      setShowControls(true);
    };

    const handlePointerUp = () => {
      setIsSeeking(false);
      timeoutRef.current = setTimeout(() => {
        if (!showSettings) {
          setShowControls(false);
        }
      }, 1500);
    };
    seekBar.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      seekBar.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [showSettings]);

  const handleSeek = (e) => {
    const video = videoRef.current;
    const wasPlaying = !video.paused;

    const inputValue = parseFloat(e.target.value);
    const clampedValue = Math.min(Math.max(inputValue, 0), 100);
    const seekTarget = (clampedValue / 100) * duration;

    setProgress(clampedValue);
    video.currentTime = seekTarget;

    if (seekTarget >= duration) {
      video.pause();
      setPlaying(false);
      return;
    }

    if (wasPlaying) {
      setTimeout(() => {
        video
          .play()
          .then(() => {
            if (video.currentTime < duration) {
              setPlaying(true);
              console.log("Play resumed");
            } else {
              video.pause();
              setPlaying(false);
            }
          })
          .catch((err) => {
            console.warn("Play error:", err);
            setPlaying(false);
          });
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

  const subscribeToggle = async () => {
    if (subscribeLock) return; // prevent rapid re-entry
    setSubscribeLock(true);

    const prevSubCount = { ...subCount };

    try {
      const updated = {
        ...subCount,
        status: !subCount.status,
        count: subCount.status ? subCount.count - 1 : subCount.count + 1,
      };

      setSubCount(updated);

      if (subCount.status) {
        await unSubscribeTo(ownerId);
      } else {
        await subscribeTo(ownerId);
      }
    } catch (error) {
      setSubCount(prevSubCount);
      setError(error?.message);
    } finally {
      // Lock duration: 500ms
      setTimeout(() => {
        setSubscribeLock(false);
      }, 500);
    }
  };

  const likeToggle = async () => {
    if (reviewLock) return; // prevent re-entry
    setReviewLock(true);
    const prevReviewCount = JSON.parse(JSON.stringify(reviewCount));
    try {
      if (reviewCount.like.status) {
        setReviewCount({
          ...reviewCount,
          like: {
            status: false,
            count: reviewCount.like.count - 1,
          },
        });
        dispatch(deleteFromLikedVideos(videoId));
        await deleteReview(videoId);
      } else {
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
        dispatch(
          addToLikedVideos({
            video: { ...video, owner: { ...channelDetails } },
          }),
        );
        await likeVideo(videoId);
      }
    } catch (error) {
      setReviewCount(prevReviewCount);
      setError(error?.message);
    } finally {
      setReviewLock(false);
    }
  };

  const dislikeToggle = async () => {
    if (reviewLock) return;
    setReviewLock(true);
    const prevReviewCount = JSON.parse(JSON.stringify(reviewCount));
    try {
      if (reviewCount.dislike.status) {
        setReviewCount({
          ...reviewCount,
          dislike: {
            status: false,
            count: reviewCount.dislike.count - 1,
          },
        });
        await deleteReview(videoId);
      } else {
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
        dispatch(deleteFromLikedVideos(video._id));
        await disLikeVideo(videoId);
      }
    } catch (error) {
      setReviewCount(prevReviewCount);
      setError(error?.message);
    } finally {
      setReviewLock(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.title || "Check out this video!",
          text: video?.description || "",
          url: window.location.href,
        });
      } catch (err) {
        console.warn("Sharing failed:", err);
      }
    } else {
      // Optional fallback
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      } catch (err) {
        alert("Unable to copy link. Please copy it manually.");
        console.error("Clipboard error:", err);
      }
    }
  };

  const getDownloadUrl = (url) => {
    if (!url.includes("/upload/")) return url;
    const [prefix, suffix] = url.split("/upload/");
    return `${prefix}/upload/fl_attachment/${suffix}`;
  };

  const handleDownload = () => {
    const downloadUrl = getDownloadUrl(video.video);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `${video.title || "video"}.mp4`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  if (loading) {
    return (
      <div className="bg-transparent max-w-6xl mx-auto py-5 animate-pulse">
        {/* Video Container */}
        <div className="relative aspect-video bg-gray-800 rounded-md overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-gradient-to-t from-black/70 to-transparent">
            <div className="h-2 bg-gray-600 rounded-full w-full mb-3" />

            <div className="flex justify-between items-center gap-4 overflow-hidden">
              {/* Left Icons */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-600 rounded" />
                <div className="w-16 h-2 bg-gray-600 rounded hidden sm:block" />
                <div className="w-20 h-2.5 bg-gray-600 rounded" />
              </div>

              {/* Center Controls */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-600 rounded-full" />
                <div className="w-5 h-5 bg-gray-600 rounded-full" />
                <div className="w-5 h-5 bg-gray-600 rounded-full" />
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-3 bg-gray-600 rounded hidden md:inline" />
                <div className="w-4 h-4 bg-gray-600 rounded" />
                <div className="w-4 h-4 bg-gray-600 rounded" />
                <div className="w-4 h-4 bg-gray-600 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mt-6 w-full sm:w-3/5 h-5 bg-gray-700 rounded" />

        {/* Channel Info */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full" />
            <div>
              <div className="w-24 h-4 bg-gray-600 rounded mb-1" />
              <div className="w-20 h-3 bg-gray-600 rounded" />
            </div>
          </div>
          <div className="w-24 h-8 bg-gray-700 rounded-full" />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="w-20 h-8 bg-gray-700 rounded-full" />
          <div className="w-24 h-8 bg-gray-700 rounded-full" />
          <div className="w-20 h-8 bg-gray-700 rounded-full" />
          <div className="w-24 h-8 bg-gray-700 rounded-full" />
        </div>

        {/* Description */}
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
    <div className="bg-transparent  max-w-6xl mx-auto py-5">
      {error && <p className="text-center text text-red-500 mb-3">{error}</p>}
      <div
        ref={containerRef}
        className={`relative w-full bg-black aspect-video max-w-screen-xl rounded-md mx-auto overflow-hidden ${
          theaterMode ? "xl:h-[80vh]" : ""
        }`}
      >
        <video ref={videoRef} className="w-full h-full transition-all" />
        {switchingQuality && (
          <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div
          className={`absolute bottom-0 w-full transition-opacity duration-300 ${
            isSeeking
              ? "opacity-100 pointer-events-auto"
              : showControls || showSettings
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
          } bg-gradient-to-t from-black/80 to-transparent p-1 px-2 md:p-3 flex flex-col gap-2`}
        >
          <input
            ref={seekBarRef}
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={Number.isFinite(progress) ? progress : 0}
            onChange={handleSeek}
            onInput={(e) => {
              const inputValue = parseFloat(e.target.value);
              const clampedValue = Math.min(Math.max(inputValue, 0), 100);

              // 🔄 Live update the slider UI
              setProgress(clampedValue);

              // ⏱ Live update the current time preview
              setCurrentTime((clampedValue / 100) * duration);
            }}
            onPointerDown={() => {
              setIsSeeking(true);
              setShowControls(true);
              clearTimeout(timeoutRef.current);
            }}
            onPointerUp={() => {
              setIsSeeking(false);
              timeoutRef.current = setTimeout(() => {
                if (!showSettings) setShowControls(false);
              }, 1500);
            }}
            style={{ accentColor: "#ffffff" }}
            className="w-full h-1 md:h-3"
          />

          <div className="flex items-center justify-between gap-3  flex-wrap">
            <div className="flex items-center gap-3">
              <button onClick={toggleMute}>
                {muted || volume === 0 ? (
                  <SlVolumeOff className="text-md md:text-xl" />
                ) : (
                  <SlVolume2 className="text-md md:text-xl" />
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
                style={{ accentColor: "#ffffff" }}
              />
              <span className="text-sm md:text-md">
                {formatTime(currentTime)} / {formatTime(duration || 0)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={skipBackward}>
                <TbRewindBackward10 className="text-md md:text-xl" />
              </button>
              <button onClick={togglePlay}>
                {playing ? (
                  <PiPause className="text-md md:text-xl" />
                ) : (
                  <PiPlay className="text-md md:text-xl" />
                )}
              </button>
              <button onClick={skipForward}>
                <TbRewindForward10 className="text-md md:text-xl" />
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
                <RiPictureInPictureLine className="text-md md:text-xl" />
              </button>
              <button onClick={toggleFullscreen}>
                {fullscreen ? (
                  <BiExitFullscreen className="text-md md:text-xl" />
                ) : (
                  <BiFullscreen className="text-md md:text-xl" />
                )}
              </button>
              <div className="relative flex align-middle">
                <button onClick={() => setShowSettings((prev) => !prev)}>
                  <IoSettingsOutline className="text-md md:text-xl" />
                </button>
                {showSettings && (
                  <div className="absolute p-1 right-0 bottom-full mb-2 bg-base-100  rounded-md w-30 md:w-40 z-10 max-h-25 md:max-h-48 text-xs">
                    <div className="p-2 border-b border-gray-700 flex gap-2 md:block ">
                      <label className="block mb-1 text-xs md:text-lg">
                        Speed
                      </label>
                      <SpeedSelector
                        currentSpeed={speed}
                        onChange={(newSpeed) => {
                          setSpeed(newSpeed);
                          if (videoRef.current) {
                            videoRef.current.playbackRate = newSpeed;
                          }
                          setShowSettings(false);
                        }}
                      />
                    </div>
                    <div className="p-2 border-gray-700 flex gap-2 items-center md:block">
                      <label className="block mb-1 text-xs md:text-lg">
                        Quality
                      </label>
                      <QualitySelector
                        selectedQuality={selectedQuality}
                        availableQualities={availableQualities}
                        onChange={(newQuality) => {
                          setSelectedQuality(newQuality);
                          setShowSettings(false);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <h2 className="text-white font-semibold text-lg md:text-xl leading-tight break-all overflow-hidden text-ellipsis line-clamp-2">
          {video?.title}
        </h2>

        <div className="flex gap-3 flex-wrap flex-row items-center space-y-3 mt-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 md:h-12 md:w-12 overflow-hidden rounded-full">
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
                <p className="font-semibold text-md md:text-xl">
                  {channelDetails?.name}
                </p>
              </Link>
              <p className=" text-gray-400">
                {formatNumber(subCount?.count)} subscribers
              </p>
            </div>
          </div>

          {channelDetails?._id == currentUser.data?._id ? (
            ""
          ) : (
            <button
              disabled={subscribeLock}
              onClick={subscribeToggle}
              className={`px-4 py-1 rounded-4xl text-sm md:text-lg ${
                subCount?.status
                  ? "bg-gray-800"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {subCount.status ? "Subscribed" : "Subscribe"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-4 items-center">
          <button
            onClick={likeToggle}
            className="bg-gray-700 hover:bg-gray-600 text-md px-3 py-0.75 md:px-4 md:py-1 rounded-md flex justify-center items-center gap-1"
          >
            {reviewCount.like.status ? <BiSolidLike /> : <BiLike />}
            {reviewCount.like.count}
          </button>
          <button
            onClick={dislikeToggle}
            className="bg-gray-700 hover:bg-gray-600 text-md px-3 py-0.75 md:px-4 md:py-1 rounded-md flex justify-center items-center gap-1"
          >
            {reviewCount.dislike.status ? <BiSolidDislike /> : <BiDislike />}
            {reviewCount.dislike.count}
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-600 text-md px-3 py-0.75 md:px-4 md:py-1 rounded-md flex justify-center items-center gap-1"
            onClick={handleShare}
          >
            <GoShareAndroid /> Share
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-600 text-md px-3 py-0.75 md:px-4 md:py-1 rounded-md flex justify-center items-center gap-1"
            onClick={handleDownload}
          >
            <PiDownloadSimpleBold /> Download
          </button>
        </div>

        <div className="my-3 w-full bg-gray-700 p-4 rounded-md">
          <div
            className={` text-gray-100 whitespace-pre-line transition-all duration-300 ${
              isExpanded ? "" : "line-clamp-3"
            }`}
          >
            <div className="font-medium mb-2.5 text-gray-300 flex gap-2">
              <span>{formatNumber(video?.views)} views</span>
              <span>
                {video?.createdAt &&
                  formatDistanceToNowStrict(new Date(video.createdAt), {
                    addSuffix: true,
                  })}
              </span>
            </div>
            <p className="leading-tight break-all">{video?.description}</p>
          </div>
          <button
            onClick={toggleExpanded}
            className="mt-2 text-gray-300 font-medium text-md"
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
