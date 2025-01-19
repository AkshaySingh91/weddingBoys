import React, { useEffect, useRef, useState } from "react";
import '../index.css'

const VideoPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const containerRef = useRef(null)
  const [isVolumeChanging, setIsVolumeChanging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [quality, setQuality] = useState("Auto");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [issettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSpeedSettingOpen, setIsSpeedSettingOpen] = useState(false);
  const [isQualitySettingOpen, setIsQualitySettingOpen] = useState(false);
  const [newSrc, setNewSrc] = useState("")

  const togglePlay = () => {
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
    setIsSettingsOpen(false)
    setIsSpeedSettingOpen(false)
    setIsQualitySettingOpen(false);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    if (!newVolume) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (isMuted) {
      video.volume = volume;
      setVolume(1)
    } else {
      video.volume = 0;
      setVolume(0)
    }
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (e) => {
    if (!isNaN(e.target.value)) {
      const video = videoRef.current;
      setSpeed(e.target.value);
      video.playbackRate = Number.parseFloat(e.target.value)
      setIsSpeedSettingOpen(false)
    }
  };
  const getCloudinaryVideoUrl = (src, quality) => {
    if (quality === "Auto") {
      return src.replace('/video/upload/', '/video/upload/q_auto/');
    }
    return src.replace('/video/upload/', `/video/upload/q_${quality}/`);
  };

  const handleQualityChange = (e) => {
    const selectedQuality = e.target.value;
    setQuality(selectedQuality);
    setIsQualitySettingOpen(false);
    const newSrc = getCloudinaryVideoUrl(src, selectedQuality);
    setNewSrc(newSrc);
  };
  const handleProgress = () => {
    const video = videoRef.current;
    setCurrentTime(video.currentTime);
  };

  const handleScrub = (e, isMobileView) => {
    const video = videoRef.current;
    const { left, width } = progressRef.current.getBoundingClientRect();
    const clickPos = (isMobileView ? e.touches[0].clientX : e.clientX) - left;
    const scrubTime = (clickPos / width) * video.duration;
    video.currentTime = scrubTime;  //in sec 
    setCurrentTime(scrubTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    setDuration(video.duration);
  };
  const handleLeftSkip = () => {
    const prev = (currentTime - 10) <= 0 ? 0 : currentTime - 10;
    videoRef.current.currentTime = prev
    setCurrentTime(prev)
  }
  const handleRightSkip = () => {
    const next = (currentTime + 10) >= videoRef.current.duration ? 0 : currentTime + 10;
    videoRef.current.currentTime = next
    setCurrentTime(next)
  }
  const handleIsSpeedSettingOpen = () => {
    if (isSpeedSettingOpen) {
      setIsSettingsOpen(true)
    } else {
      setIsSettingsOpen(false)
    }
    setIsSpeedSettingOpen((prev) => { return !prev })
  }
  const handleIsQualitySettingOpen = () => {
    if (isQualitySettingOpen) {
      setIsSettingsOpen(true)
    } else {
      setIsSettingsOpen(false)
    }
    setIsQualitySettingOpen((prev) => { return !prev })
  }
  const handleIsSettingOpen = () => {
    setIsSettingsOpen((prev) => !prev)
    setIsSpeedSettingOpen(false)
    setIsQualitySettingOpen(false);
  }
  const requestFullScreen = () => {
    const container = containerRef.current
    if (container.requestFullscreen) {
      setIsFullScreen(true)
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) { /* Safari */
      setIsFullScreen(true)
      container.webkitRequestFullscreen();
    } else if (container.msRequestFullscreen) { /* IE11 */
      setIsFullScreen(true)
      container.msRequestFullscreen();
    }
  }
  const exitFullScreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.webkitFullscreenElement) { /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msFullscreenElement) { /* IE11 */
      document.msExitFullscreen();
    }
    setIsFullScreen(false);
  };
  const [isDragging, setIsDragging] = useState(false);

  const handleFullscreenChange = () => {
    const isNowFullScreen = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    setIsFullScreen(!!isNowFullScreen);
  };
  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
    setNewSrc(src)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    }
  }, [isFullScreen, src])
  useEffect(() => {
    const id = setInterval(() => {
      setIsVolumeChanging(false);
      setIsSettingsOpen(false);
    }, 5000);
    return () => {
      clearInterval(id)
    }
  }, [])


  return (
    <div ref={containerRef} className={"relative bg-black lg:max-w-4xl md:max-w-2xl transition-transform duration-100  rounded-t-xl aspect-[16/9] w-full max-w-md sm:max-w-lg xl:max-w-6xl mx-auto"}>
      <video
        loop playsInline
        ref={videoRef}
        className="w-full h-full object-cover rounded-t-xl"
        onTimeUpdate={handleProgress}
        onLoadedMetadata={handleLoadedMetadata}
        src={newSrc}
        onClick={togglePlay}
        type="video/mp4"
      ></video>

      <div className={`bottom-control-panel absolute bottom-0 left-0 right-0 text-white p-1 flex lg:gap-4  item-center mb-2 mx-2 rounded-md bg-[rgba(155,155,155,0.25)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-sm border border-[rgba(255,255,255,0.18)] sm:gap-2
      ${isFullScreen ? "z-50" : ""}`}>
        <div className="duration-control flex lg:gap-2 bg-gray-500 bg-opacity-35 rounded-md bg-[rgba(0,0,0,0.87)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[2px] px-2 sm:gap-1">
          <div className="left-skip h-fit w-fit">
            <button className="flex justify-center items-center" onClick={handleLeftSkip}>
              <svg className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M860-240 500-480l360-240v480Zm-400 0L100-480l360-240v480Zm-80-240Zm400 0Zm-400 90v-180l-136 90 136 90Zm400 0v-180l-136 90 136 90Z" /></svg>
            </button>
          </div>
          <div className="play">
            {
              isPlaying ?
                <button className="flex justify-center items-center" onClick={togglePlay}>
                  <svg className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z" /></svg>
                </button>
                :
                <button className="flex justify-center items-center" onClick={togglePlay}>
                  <svg className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" /></svg>
                </button>
            }
          </div>
          <div className="right-skip">
            <button className="flex justify-center items-center" onClick={handleRightSkip}>
              <svg className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M100-240v-480l360 240-360 240Zm400 0v-480l360 240-360 240ZM180-480Zm400 0Zm-400 90 136-90-136-90v180Zm400 0 136-90-136-90v180Z" /></svg>
            </button>

          </div>
        </div>
        <div className="video-length flex items-end bg-gray-500 bg-opacity-35 rounded-md bg-[rgba(0,0,0,0.87)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[2px] px-2 pb-2 flex-auto">
          <div className="group  relative w-full h-1 bg-gray-600 rounded-md cursor-pointer hover:h-2 transition-all duration-100" ref={progressRef} onClick={handleScrub}
            onMouseMove={(e) => {
              if (isDragging) {
                handleScrub(e)
              }
            }}
            onMouseUp={() => {
              setIsDragging(false)
            }}
            onMouseDown={(e) => {
              setIsDragging(true);
            }}
            onTouchMove={(e) => {
              if (isDragging) {
                handleScrub(e, true);
              }
            }}
            onTouchStart={(e) => {
              setIsDragging(true);
            }}>
            <div style={{ width: `${currentTime / duration * 100}%` }} className={`relative current-progress h-1 bg-gray-200 rounded-md group-hover:h-2 transition-all duration-100`}
            >
              <div className="flex items-center absolute -top-8 left-full current-time-tooltip bg-black text-white w-fit rounded-lg">
                <span className='text-[12px] px-2 py-1  whitespace-nowrap'> {Number.parseInt(currentTime / 60) <= 9 ? '0' + Number.parseInt(currentTime / 60) : Number.parseInt(currentTime / 60)} : {Number.parseInt(currentTime % 60) <= 9 ? '0' + Number.parseInt(currentTime % 60) : Number.parseInt(currentTime % 60)} </span>
                <span
                  className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black"
                ></span>

              </div>
            </div>
          </div>
        </div>
        <div className="right-control relative flex items-center bg-gray-500 bg-opacity-35 rounded-md bg-[rgba(0,0,0,0.87)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[2px] px-2 lg:gap-2 sm:gap-1">
          <div className="relative speaker  h-fit w-fit transition-all duration-200">
            <button className="relative speaker-btn flex justify-center items-center" onClick={toggleMute} onMouseEnter={() => setIsVolumeChanging(true)}>
              {isMuted ?
                <svg className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M792-56 671-177q-25 16-53 27.5T560-131v-82q14-5 27.5-10t25.5-12L480-368v208L280-360H120v-240h128L56-792l56-56 736 736-56 56Zm-8-232-58-58q17-31 25.5-65t8.5-70q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 53-14.5 102T784-288ZM650-422l-90-90v-130q47 22 73.5 66t26.5 96q0 15-2.5 29.5T650-422ZM480-592 376-696l104-104v208Zm-80 238v-94l-72-72H200v80h114l86 86Zm-36-130Z" /></svg>
                : <svg className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-606l-86 86H200v80h114l86 86v-252ZM300-480Z" /></svg>
              }
            </button>
            {
              isVolumeChanging ?
                <div onMouseOut={() => setIsVolumeChanging(false)} className="absolute bottom-full left-0 volume w-full h-20 flex justify-center items-center my-5">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    orient="vertical"
                    className="h-2 w-28 transform -rotate-90  appearance-none  dark:bg-gray-700 bg-gray-400 rounded-lg cursor-pointer "
                  />
                </div> : null
            }

          </div>
          <div className="setting h-fit w-fit">
            <button className="setting-btn flex justify-center items-center" onClick={handleIsSettingOpen}>
              <svg className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" /></svg>
            </button>
            {issettingsOpen && (
              <div className="settings-wrapper absolute bottom-full right-0 h-20 flex flex-col rounded-md bg-[rgba(155,155,155,0.5)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-sm border border-[rgba(255,255,255,0.18)] my-2 w-40 justify-evenly" >
                <div className="speed-control w-full">
                  <button className="flex justify-evenly text-sm gap-2 w-full py-2 px-2 hover:bg-[rgba(155,155,155,0.4)]" onClick={handleIsSpeedSettingOpen}>
                    <span>Speed</span>
                    <span className="flex items-center">{speed} x<svg className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" /></svg></span>
                  </button>
                </div>
                <div className="quality-control w-full">
                  <button className="flex justify-evenly text-sm gap-2 w-full  py-2 px-2 hover:bg-[rgba(155,155,155,0.4)] " onClick={handleIsQualitySettingOpen}>
                    <span>Quality</span>
                    <span className="flex items-center">{quality} <svg className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" /></svg>
                    </span>
                  </button>
                </div>
              </div>
            )}
            {isSpeedSettingOpen && (
              <div className="speed-wrapper absolute bottom-full right-0 h-fit flex flex-col rounded-md bg-[rgba(155,155,155,0.5)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-sm border border-[rgba(255,255,255,0.18)] my-2 w-40 justify-evenly" >
                <button className="flex justify-between px-2 py-2 items-center text-sm" onClick={handleIsSpeedSettingOpen}>
                  <svg className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z" /></svg>
                  <span> Speed</span>
                </button>
                <div className="flex flex-col p-2 text-sm gap-1">
                  <button onClick={handleSpeedChange} className="text-left hover:bg-slate-300 hover:bg-opacity-60 px-2 rounded-md" value="0.25">0.25x</button>
                  <button onClick={handleSpeedChange} className="text-left hover:bg-slate-300 hover:bg-opacity-60 px-2 rounded-md" value="0.5">0.5x</button>
                  <button onClick={handleSpeedChange} className="text-left hover:bg-slate-300 hover:bg-opacity-60 px-2 rounded-md" value="1">Normal</button>
                  <button onClick={handleSpeedChange} className="text-left hover:bg-slate-300 hover:bg-opacity-60 px-2 rounded-md" value="1.5">1.5x</button>
                  <button onClick={handleSpeedChange} className="text-left hover:bg-slate-300 hover:bg-opacity-60 px-2 rounded-md" value="2">2x</button>
                </div>
              </div>
            )}
            {isQualitySettingOpen && (
              <div className="settings-wrapper absolute bottom-full right-0 h-fit flex flex-col rounded-md bg-[rgba(155,155,155,0.5)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-sm border border-[rgba(255,255,255,0.18)] my-2 w-40 justify-evenly" >
                <button className="back-btn flex   justify-between px-2 py-2 items-center text-sm" onClick={handleIsQualitySettingOpen}>
                  <svg className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z" /></svg>
                  <span> Quality</span>
                </button>
                <div className="quality-options flex flex-col p-2 text-sm gap-1">
                  <button onClick={handleQualityChange} className="text-left hover:bg-slate-300 hover:bg-opacity-60 px-2 rounded-md" value="Auto">Auto</button>
                  <button onClick={handleQualityChange} className="text-left hover:bg-slate-300 hover:bg-opacity-60 px-2 rounded-md" value="1080">1080p</button>
                  <button onClick={handleQualityChange} className="text-left hover:bg-slate-300 hover:bg-opacity-60 px-2 rounded-md" value="720">720p</button>
                  <button onClick={handleQualityChange} className="text-left hover:bg-slate-300 hover:bg-opacity-60 px-2 rounded-md" value="480">480p</button>
                  <button onClick={handleQualityChange} className="text-left hover:bg-slate-300 hover:bg-opacity-60 px-2 rounded-md" value="360">360p</button>
                </div>
              </div>
            )}
          </div>
          <div className="fullscreen  h-fit w-fit">
            <button className="fullscreen-btn flex justify-center items-center"
              onClick={isFullScreen ? exitFullScreen : requestFullScreen}>
              {isFullScreen ?
                <svg className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z" /></svg>
                : <svg className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z" /></svg>
              }
            </button>
          </div>

        </div>
      </div>
    </div >
  );
};

export default VideoPlayer;
