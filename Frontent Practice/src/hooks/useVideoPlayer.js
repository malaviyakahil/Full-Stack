import { useEffect, useRef, useState } from "react";

const transformMap = {
  "144p": "w_256,h_144,c_scale",
  "240p": "w_426,h_240,c_scale",
  "360p": "w_640,h_360,c_scale",
  "480p": "w_854,h_480,c_scale",
  "720p": "w_1280,h_720,c_scale",
  "1080p": "w_1920,h_1080,c_scale",
};

export function useVideoPlayer(video, selectedQuality, speed = 1) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [switchingQuality, setSwitchingQuality] = useState(false);
  
  const qualityLoaderTimeout = useRef(null);
  const qualityLoaderMinimumTime = useRef(null);

  useEffect(() => {
    if (!video.video || !selectedQuality || !videoRef.current) return;

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

    videoElement.pause();
    videoElement.removeAttribute("src");
    videoElement.load();
    videoElement.src = newUrl;

    const handleLoaded = () => {
      try {
        videoElement.currentTime = savedTime;
        videoElement.playbackRate = speed;
        if (wasPlaying) {
          videoElement.play().catch((err) => console.warn("Playback error:", err));
        }
      } catch (err) {
        console.warn("Setting currentTime failed:", err);
      }

      const elapsed = Date.now() - qualityLoaderMinimumTime.current;
      const remaining = Math.max(0, 200 - elapsed);

      qualityLoaderTimeout.current = setTimeout(() => {
        setSwitchingQuality(false);
      }, remaining);

      videoElement.removeEventListener("loadeddata", handleLoaded);
    };

    videoElement.addEventListener("loadeddata", handleLoaded);
    videoElement.load();

    return () => {
      videoElement.removeEventListener("loadeddata", handleLoaded);
      clearTimeout(qualityLoaderTimeout.current);
    };
  }, [selectedQuality, video, speed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const updateMetadata = () => {
      setDuration(video.duration);
    };

    const onEnd = () => setPlaying(false);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateMetadata);
    video.addEventListener("ended", onEnd);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateMetadata);
      video.removeEventListener("ended", onEnd);
    };
  }, [video]);

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

  const handleVolumeChange = (val) => {
    const video = videoRef.current;
    video.volume = val;
    setVolume(val);
    setMuted(val === 0);
  };

  const seekTo = (progressPercent) => {
    const video = videoRef.current;
    const targetTime = (progressPercent / 100) * duration;
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
    setProgress(progressPercent);
  };

  return {
    videoRef,
    playing,
    togglePlay,
    muted,
    toggleMute,
    volume,
    handleVolumeChange,
    currentTime,
    duration,
    progress,
    seekTo,
    switchingQuality,
  };
} 
