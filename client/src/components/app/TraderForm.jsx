import { useNotification } from "../layout/NotificationHelper";
import { Card } from "@material-tailwind/react";
import FormError from "./subComponents/FormError.jsx";
import { useEffect, useRef, useState } from "react";
import { getInitialAccessToken } from "../auth/authHelpers.jsx";
import PropTypes from "prop-types";
import FetchWithAuth from "../auth/api.js";
import { QuestionMarkCircleIcon, TrashIcon } from "@heroicons/react/24/solid";

const TraderForm = ({ detail, setsuccess }) => {
  const [details, setDetails] = useState(detail);
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [file, setFile] = useState(null);
  const [name, setName] = useState(detail?.name);
  const fileInputRef = useRef(null);
  const maxFileSize = 3 * 1024 * 1024; // 3MB
  // Sync details state when `detail` prop changes
  useEffect(() => {
    setDetails(detail);
    setName(detail?.name);
  }, [detail]);
  // Handle file selection and validation
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(""); // Reset errors
    setFile(null); // Reset file state

    if (selectedFile) {
      if (!["image/png", "image/jpeg"].includes(selectedFile.type)) {
        setError("Only PNG and JPEG files are allowed.");
        return;
      }
      if (selectedFile.size > maxFileSize) {
        setError("File size must be less than 3MB.");
        return;
      }
      setFile(selectedFile);
    }
  };
  // Handle upload
  const handleUpload = async () => {
    if (!file || !name) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("name", name);

    try {
      setLoading(true);
      setsuccess(false);
      const accessToken = getInitialAccessToken();
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

      const response = await fetch(`${import.meta.env.VITE_ADMIN_API_URL}/traders/`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        throw new Error("Trader Creation failed");
      }

      const data = await response.json();
      addNotification(data.message, "success");
      if (data.success) setsuccess(true);
    } catch (err) {
      console.error(err);
      addNotification("Trader Creation failed. Please try again.", "error");
      setError("Trader Creation failed. Please try again.");
    } finally {
      resetForm();
      setLoading(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    setLoading(false);
    setName("");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input value
    }
  };
  const deleteTrader = async (_id, imageFilename = null) => {
    // Validate input early
    if (!_id) {
      console.error("_id is required to delete a trader");
      addNotification("Invalid request: Missing _id", "error");
      return false; // Exit function
    }
    try {
      setLoading(true);
      setsuccess(false);

      // Make the DELETE request to the server
      const response = await FetchWithAuth(
        `/traders`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id, imageFilename }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
        "Failed to delete billing option"
      );

      if (response.failed) {
        // Handle failure response
        const { message, failed } = response;
        addNotification(failed, "error");
        addNotification(message, "error");
      } else {
        // Handle success response
        const { success, message } = response;
        if (success) {
          setsuccess(true);
          addNotification(message, "success");
        } else {
          addNotification("Delete operation was not successful", "error");
        }
      }
    } catch (err) {
      // Handle unexpected errors
      addNotification("An error occurred while deleting the trader", "error");
      console.error("Fetch error:", err);
    } finally {
      // Reset state
      setLoading(false);
    }
  };
  return (
    <main className='grid md:grid-cols-4 grid-cols-1 md:gap-2 gap-x-0 gap-y-5'>
      {/* Form to create new trader */}
      <Card
        className='profile-box flex flex-col space-y-4 col-span-1 md:col-span-2'
        variant='gradient'
        color='gray'>
        <h2 className='text-lg font-semibold mb-2'>Create/Edit Trader</h2>
        <div className='flex justify-between'>
          <h3 className='font-semibold text-2xl capitalize'>{name || "New Trader"}</h3>
          <div className='flex flex-row justify-between'>
            <QuestionMarkCircleIcon
              title='Info'
              className='h-5 w-5 hover:scale-110 transition-all cursor-help'
              onClick={() => setShowPrompt((prev) => !prev)}
            />
            <TrashIcon
              title='Delete'
              className='h-5 w-5 hover:scale-110 transition-all cursor-help text-error-light'
              onClick={() => deleteTrader(details._id, details.imageFilename)}
            />
          </div>
        </div>
        {showPrompt && (
          <p className='text-md text-primary-light mb-2'>
            Using the same name will update the existing trader with that name.
          </p>
        )}
        <form className='flex flex-col space-y-4'>
          <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='name'>
            Name
          </label>
          <input
            type='text'
            className='form-input w-full'
            value={name}
            onChange={(e) => setName(e.target.value)}
            id='name'
          />
          <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='trader-img'>
            Upload Display Image
          </label>
          <input
            type='file'
            className='form-input w-full'
            accept='.png, .jpeg'
            onChange={handleFileChange}
            ref={fileInputRef}
            id='trader-img'
          />
          <button
            className='accent-btn w-full'
            onClick={handleUpload}
            disabled={!file || loading || !name}>
            {loading ? "Creating..." : "Create Trader"}
          </button>
        </form>
        {error && <FormError err={error} />}
      </Card>
    </main>
  );
};
TraderForm.propTypes = {
  detail: PropTypes.object.isRequired,
  setsuccess: PropTypes.func.isRequired,
};
export default TraderForm;
