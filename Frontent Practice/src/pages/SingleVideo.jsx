import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { IoMdPlay, IoMdPause } from "react-icons/io";
import { MdVolumeOff, MdVolumeUp, MdFullscreen } from "react-icons/md";
import { BiLike, BiDislike, BiSolidDislike, BiSolidLike } from "react-icons/bi";
import { IoShareSocialOutline } from "react-icons/io5";
import { PiDownloadSimpleBold } from "react-icons/pi";
import CommentSection from "../components/CommentSection";

const SingleVideo = () => {
  const { ownerId, videoId } = useParams();
  const [video, setVideo] = useState({});
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  const toggleExpanded = () => setIsExpanded(!isExpanded);
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
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading || !videoRef.current) return;

    const video = videoRef.current;

    const handleMetadata = () => {
      setDuration(video.duration);
      setIsMuted(video.muted);
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(video.currentTime);
      }
    };


    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => setIsMuted(video.muted);

    video.addEventListener("loadedmetadata", handleMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);

    if (video.readyState >= 1) {
      handleMetadata();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [loading, isDragging]);

  const syncVideoState = () => {
    const video = videoRef.current;
    if (video) {
      setIsPlaying(!video.paused);
      setIsMuted(video.muted);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }

    setTimeout(syncVideoState, 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setTimeout(syncVideoState, 0);
  };

  const handleSeek = (e) => {
    const bar = progressBarRef.current;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const newTime = percent * duration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = (e) => {
    setIsDragging(false);
    handleSeek(e);
  };
  const handleMouseMove = (e) => {
    if (isDragging) {
      handleSeek(e);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  if (loading) {
    return (
      <div className="bg-transparent text-white max-w-6xl mx-auto p-5 animate-pulse">
        {/* Video Placeholder */}
        <div className="relative aspect-video bg-gray-800 rounded overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-14 h-14 bg-gray-700 rounded-full" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-4 py-2 flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-gray-600 rounded" />
              <div className="w-24 h-3 bg-gray-600 rounded" />
            </div>
            <div className="flex space-x-3 text-lg">
              <div className="w-5 h-5 bg-gray-600 rounded" />
              <div className="w-6 h-6 bg-gray-600 rounded" />
            </div>
          </div>
        </div>

        {/* Video Info Skeleton */}
        <div className="mt-6">
          <div className="w-1/2 h-6 bg-gray-700 rounded mb-4" />

          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full" />
              <div>
                <div className="w-24 h-4 bg-gray-600 rounded mb-1" />
                <div className="w-20 h-3 bg-gray-600 rounded" />
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="w-24 h-8 bg-gray-700 rounded-4xl" />
            </div>
          </div>

          {/* Interaction Buttons Skeleton */}
          <div className="flex flex-wrap gap-3 mt-4 text-sm">
            <div className="w-20 h-8 bg-gray-700 rounded-4xl" />
            <div className="w-24 h-8 bg-gray-700 rounded-4xl" />
            <div className="w-20 h-8 bg-gray-700 rounded-4xl" />
            <div className="w-24 h-8 bg-gray-700 rounded-4xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent text-white max-w-6xl mx-auto p-5">
      <div
        className="relative aspect-video bg-black rounded overflow-hidden group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          src={video?.video}
          autoPlay
        />
        <button
          onClick={togglePlay}
          className={`absolute inset-0 flex items-center justify-center bg-black/30 transition ${
            isHovering ? "opacity-100" : "opacity-0"
          }`}
        >
          {isPlaying ? (
            <IoMdPause className="text-[50px]" />
          ) : (
            <IoMdPlay className="text-[50px]" />
          )}
        </button>

        <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-4 py-2 text-sm">
          <div
            ref={progressBarRef}
            className="w-full h-1 bg-gray-600 relative cursor-pointer mb-2"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            <div
              className="h-full bg-white"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            />
          </div>

          <div className="flex flex-wrap justify-between items-center text-xs sm:text-sm">
            <div className="flex items-center space-x-4">
              <button onClick={togglePlay}>
                {isPlaying ? (
                  <IoMdPause className="size-4.5" />
                ) : (
                  <IoMdPlay className="size-4.5" />
                )}
              </button>
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex space-x-3 text-lg">
              <button onClick={toggleMute}>
                {isMuted ? (
                  <MdVolumeOff className="size-5" />
                ) : (
                  <MdVolumeUp className="size-5" />
                )}
              </button>
              <button onClick={() => videoRef.current.requestFullscreen()}>
                <MdFullscreen className="size-6" />
              </button>
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
              <img
                src={channelDetails?.avatar}
                alt="Avatar"
                className="object-cover h-full w-full"
              />
            </div>
            <div>
              <p className="font-semibold">{channelDetails?.name}</p>
              <p className="text-sm text-gray-400">
                {subCount?.count} subscribers
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              disabled={subCount.disabled}
              onClick={() => {
                if (subCount.status) {
                  setSubCount({
                    ...subCount,
                    status: false,
                    count: subCount.count - 1,
                  });
                  axios.post(
                    `http://localhost:8000/user/unsubscribe-to/${ownerId}`,
                    [],
                    { withCredentials: true },
                  );
                } else {
                  setSubCount({
                    ...subCount,
                    status: true,
                    count: subCount.count + 1,
                  });
                  axios.post(
                    `http://localhost:8000/user/subscribe-to/${ownerId}`,
                    [],
                    { withCredentials: true },
                  );
                }
              }}
              className={`text-white px-4 py-1 rounded-4xl text-md ${
                subCount?.status
                  ? "bg-gray-800"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {subCount.status ? "Subscribed" : "Subscribe"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-sm">
          <button
            onClick={() => {
              if (reviewCount.like.status) {
                setReviewCount({
                  ...reviewCount,
                  like: {
                    status: false,
                    count: reviewCount.like.count - 1,
                  },
                });
                axios.post(
                  `http://localhost:8000/video/delete-review/${videoId}`,
                  [],
                  { withCredentials: true },
                );
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
                axios.post(
                  `http://localhost:8000/video/like-video/${videoId}`,
                  [],
                  { withCredentials: true },
                );
              }
            }}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-1 rounded-4xl flex justify-center items-center gap-1"
          >
            {reviewCount.like.status ? <BiSolidLike /> : <BiLike />}
            {reviewCount.like.count}
          </button>
          <button
            onClick={() => {
              if (reviewCount.dislike.status) {
                setReviewCount({
                  ...reviewCount,
                  dislike: {
                    status: false,
                    count: reviewCount.dislike.count - 1,
                  },
                });
                axios.post(
                  `http://localhost:8000/video/delete-review/${videoId}`,
                  [],
                  { withCredentials: true },
                );
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
                axios.post(
                  `http://localhost:8000/video/dislike-video/${videoId}`,
                  [],
                  { withCredentials: true },
                );
              }
            }}
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

        <div className="my-5 w-full bg-gray-700 p-4 rounded-xl">
          <div
            className={`text-sm text-gray-100 whitespace-pre-line transition-all duration-300 ${
              isExpanded ? "" : "line-clamp-3"
            }`}
          >
        {video?.description}
          </div>
          <button
            onClick={toggleExpanded}
            className="mt-2 text-white text-sm font-medium"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        </div>

        <CommentSection videoId={videoId} ownerId={ownerId}/>
      </div>
    </div>
  );
};

export default SingleVideo;
