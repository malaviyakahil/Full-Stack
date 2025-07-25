const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs}`;
  } else {
    return `${mins}:${secs}`;
  }
};

export default formatTime;

