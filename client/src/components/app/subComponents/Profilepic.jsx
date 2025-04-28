import { useState, useEffect, forwardRef } from "react";
import fetchImage from "../../auth/apiGetIMG";
import { PlaceholderProfile } from "../../../assets/utilities";
import PropTypes from "prop-types";

const Profilepic = forwardRef(({ imageId }, ref) => {
  const [image, setImage] = useState(null); // Use null for better clarity
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load the image when the component mounts or when imageId changes
  useEffect(() => {
    if (!imageId) {
      setImage(null);
      return;
    }

    const loadImage = async () => {
      try {
        const imageUrl = await fetchImage(imageId, "/image/profile-pic/");
        setImage(imageUrl || null); // Handle invalid responses
      } catch (err) {
        console.error("Error loading image:", err);
        setImage(null);
      }
    };

    loadImage();
  }, [imageId]);

  // Handle fullscreen change events
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  // Add and remove event listener for fullscreen changes
  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <img
      src={image || PlaceholderProfile}
      alt='Profile-picture'
      className={`w-full h-auto max-h-[30vh] ${isFullscreen ? "object-contain" : "object-cover"}`}
      ref={ref}
    />
  );
});

Profilepic.displayName = "Profilepic";

Profilepic.propTypes = {
  imageId: PropTypes.string.isRequired,
};

export default Profilepic;
