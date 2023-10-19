import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./livecam.css";

export const Livecam = () => {
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const [isCameraRunning, setIsCameraRunning] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [processedFrames, setProcessedFrames] = useState([]);

  // Function to start the camera
  const startCamera = () => {
    if (!isCameraRunning) {
      if (videoRef.current) {
        videoRef.current.play();
      }
      setIsCameraRunning(true);
      setIsFullScreen(false);
    }
  };

  // Function to stop the camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.pause();
      setIsCameraRunning(false);
      setIsFullScreen(false);
    }
  };

  // Function to toggle fullscreen mode
  const toggleFullScreen = () => {
    if (videoRef.current) {
      if (!isFullScreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        } else if (videoRef.current.mozRequestFullScreen) {
          videoRef.current.mozRequestFullScreen();
        } else if (videoRef.current.webkitRequestFullscreen) {
          videoRef.current.webkitRequestFullscreen();
        } else if (videoRef.current.msRequestFullscreen) {
          videoRef.current.msRequestFullscreen();
        }
        setIsFullScreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        setIsFullScreen(false);
      }
    }
  };

  const captureAndSendFrames = async () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext("2d");

      context.drawImage(
        videoRef.current,
        0,
        0,
        canvas.width,
        canvas.height
      );
      const imageDataUrl = canvas.toDataURL("image/jpeg");
      sendDataToBackend(imageDataUrl);
      

    }
  };

  
  const sendDataToBackend = (frames) => {
    fetch("http://localhost:5000/susactivity",{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON(frames),
    })
      .then((response) => {
  
        if (response.status === 201){
          console.log("Frames sent successfully.");
          const receivedFrames = data.frames_list; 
          setProcessedFrames(receivedFrames);
        } 
        else {
          console.error("Failed to send frames to the backend.");
        }
      })
      .catch((error) =>{
        console.error("Error sending frames:", error);
      });
  };

  // Remove the oldest frame from the processedFrames array
  const removeOldestFrame = () => {
    setProcessedFrames((frames) => frames.slice(1));
  };

  // Clear the processed frames array
  const clearProcessedFrames = () => {
    setProcessedFrames([]);
  };

  useEffect(() => {
    // Access the camera and start capturing frames
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          intervalRef.current = setInterval(captureAndSendFrames, 1000);
        }
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
      });

    // Handle double tap for toggling fullscreen
    let lastTap = 0;
    videoRef.current?.addEventListener("touchend", (event) => {
      const now = new Date().getTime();
      if (now - lastTap <= 300) {
        toggleFullScreen();
      }
      lastTap = now;
    });

    // Clear processed frames every 10 seconds (adjust as needed)
    const clearFramesInterval = setInterval(clearProcessedFrames, 10000);

    // Cleanup intervals when the component unmounts
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(clearFramesInterval);
    };
  }, []);

  return (
    <div className="livecam-container">
      <div>
        <nav>
          <div>
            <h1>ComputerVision</h1>
          </div>
          <div>
            <ul id="navbar">
              <li>
                <Link className="active" to="/landing">
                  HOME
                </Link>
              </li>
              <li>
                {isCameraRunning ? (
                  <button onClick={stopCamera}>Pause Camera</button>
                ) : (
                  <button onClick={startCamera}>Resume Camera</button>
                )}
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="video-player">
        <video
          ref={videoRef}
          autoPlay
          type="video/mp4"
          onClick={toggleFullScreen}
        ></video>
      </div>

      <div className="processed-frames">
           {processedFrames.map((frame, index) => (
           <img key={index} src={frame} alt={`Processed Frame ${index}`} />
        ))}
      </div>

    </div>
  );
};
