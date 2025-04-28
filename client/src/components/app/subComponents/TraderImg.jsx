import { useState, useEffect, forwardRef } from "react";
import fetchImage from "../../auth/apiGetIMG";
import { PlaceholderProfile } from "../../../assets/utilities";
import PropTypes from "prop-types";

const TraderImg = forwardRef(({ imageId }) => {
  const [image, setImage] = useState(null); // Use null for better clarity

  // Load the image when the component mounts or when imageId changes
  useEffect(() => {
    if (!imageId) {
      setImage(null);
      return;
    }

    const loadImage = async () => {
      try {
        const imageUrl = await fetchImage(imageId, "/image/trader/");
        setImage(imageUrl || null); // Handle invalid responses
      } catch (err) {
        console.error("Error loading image:", err);
        setImage(null);
      }
    };

    loadImage();
  }, [imageId]);
  return (
    <img
      src={image || PlaceholderProfile}
      alt='TraderImg'
      className={`w-20 h-20  object-cover rounded-full`}
    />
  );
});

TraderImg.displayName = "TraderImg";

TraderImg.propTypes = {
  imageId: PropTypes.string.isRequired,
};

export default TraderImg;
