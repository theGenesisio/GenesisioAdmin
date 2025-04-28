import { useState, useEffect, forwardRef } from "react";
import fetchImage from "../../auth/apiGetIMG";
import { PlaceHolder400 } from "../../../assets/utilities";
import PropTypes from "prop-types";
import { Carousel } from "@material-tailwind/react";
import Loader from "./Loader";

const Images = forwardRef(({ imageIds }, ref) => {
  const [images, setImages] = useState([]); // Store all images in an array
  const imagesToLoad = imageIds.filter(Boolean);
  // Load images when the component mounts or when imageIds change
  useEffect(() => {
    if (!imagesToLoad || imagesToLoad.length === 0) {
      setImages([]);
      return;
    }

    const loadImages = async () => {
      const loadedImages = await Promise.all(
        imagesToLoad.map(async (id) => {
          try {
            const imageUrl = await fetchImage(id, "/image/kyc/");
            return new Promise((resolve) => {
              const img = new Image();
              img.src = imageUrl || PlaceHolder400; // Use placeholder if URL fails
              img.onload = () => resolve(img.src);
              img.onerror = () => resolve(PlaceHolder400);
            });
          } catch (err) {
            console.error(`Error loading image for ID ${id}:`, err);
            return PlaceHolder400;
          }
        })
      );
      setImages(loadedImages);
    };

    loadImages();
  }, [imagesToLoad]);

  return (
    <div ref={ref} className='w-full h-full'>
      {images.length > 0 ? (
        <Carousel
          className='rounded-xl w-full h-full'
          autoplay={true} // Enable autoplay
          autoplayDelay={5000} // Set the autoplay delay to 5s
          loop={true} // Enable loop
          prevArrow={null} // Hide the previous arrow
          nextArrow={null} // Hide the next arrow
          transition={500} // Set the transition duration to 500ms
          navigation={({ setActiveIndex, activeIndex, length }) => (
            <div className='absolute bottom-4 left-2/4 z-50 flex -translate-x-2/4 gap-2'>
              {new Array(length).fill("").map((_, i) => (
                <span
                  key={i}
                  className={`block h-1 cursor-pointer rounded-2xl transition-all ${
                    activeIndex === i ? "w-8 bg-white" : "w-4 bg-white/50"
                  }`}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
          )}>
          {images.map((image, index) => (
            <img
              key={index}
              src={image || PlaceHolder400}
              alt={`KYC image ${index + 1}`}
              className='w-full h-full object-contain'
            />
          ))}
        </Carousel>
      ) : (
        <Loader />
      )}
    </div>
  );
});

Images.displayName = "Images";

Images.propTypes = {
  imageIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Images;
