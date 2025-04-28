/**
 * BillingForm component handles the display and submission of billing details.
 * It allows users to input and update billing information, including uploading a QR code image.
 *
 * @component
 * @param {Object} props - The component props
 * @param {Object} props.detail - The initial billing details
 * @param {Function} props.setsuccess - Function to set the success state
 *
 * @returns {JSX.Element} The rendered BillingForm component
 *
 * @example
 * <BillingForm detail={billingDetail} setsuccess={setSuccess} />
 */
import PropTypes from "prop-types";
import { useNotification } from "../../layout/NotificationHelper";
import { useEffect, useRef, useState } from "react";
import { getInitialAccessToken } from "../../auth/authHelpers";
import FormError from "./FormError";
import { Card, CardBody, CardFooter } from "@material-tailwind/react";
import {
  ClipboardDocumentCheckIcon,
  ClipboardIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import FetchWithAuth from "../../auth/api";

const BillingForm = ({ detail, setsuccess }) => {
  const { addNotification } = useNotification();

  // Component state
  const [details, setDetails] = useState(detail);
  const [address, setAddress] = useState(detail?.address);
  const [name, setName] = useState(detail?.name);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [error, setError] = useState("");
  const [pasted, setPasted] = useState(false);

  const fileInputRef = useRef(null);
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  // Sync details state when `detail` prop changes
  useEffect(() => {
    setDetails(detail);
    setAddress(detail?.address);
    setName(detail?.name);
    setPasted(false);
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
        setError("File size must be less than 5MB.");
        return;
      }
      setFile(selectedFile);
    }
  };

  // Handle clipboard paste
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setAddress(text.trim()); // Update the state with trimmed text
        setPasted(true); // Indicate paste success
        addNotification("Address pasted successfully", "success");
      } else {
        throw new Error("Clipboard is empty");
      }
    } catch (error) {
      console.error("Clipboard paste failed:", error);
      setPasted(false);
      addNotification("Failed to paste address, please retry", "warning");
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file || !name || !address) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("address", address);
    formData.append("name", name);

    try {
      setIsUploading(true);
      setsuccess(false);

      const accessToken = getInitialAccessToken();
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

      const response = await fetch(`${import.meta.env.VITE_ADMIN_API_URL}/billing/`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      const data = await response.json();
      addNotification(data.message, "success");
      if (data.success) setsuccess(true);
    } catch (err) {
      console.error(err);
      addNotification("Update failed. Please try again.", "error");
      setError("Update failed. Please try again.");
    } finally {
      resetForm();
      setIsUploading(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    setIsUploading(false);
    setAddress("");
    setName("");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input value
    }
  };
  const deleteBillingOption = async (_id, qrCode = null) => {
    // Validate input early
    if (!_id) {
      console.error("_id is required to delete a billing option");
      addNotification("Invalid request: Missing _id", "error");
      return false; // Exit function
    }
    try {
      setIsUploading(true);
      setsuccess(false);

      // Make the DELETE request to the server
      const response = await FetchWithAuth(
        `/billing`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id, qrCode }),
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
      addNotification("An error occurred while deleting the billing option", "error");
      console.error("Fetch error:", err);
    } finally {
      // Reset state
      setIsUploading(false);
    }
  };

  return (
    <Card
      className='w-full max-w-[96dvh] md:max-w-[36rem] mx-auto md:mx-0'
      variant='gradient'
      color='gray'>
      <CardBody className='text-text-light flex flex-col space-y-2'>
        <div className='flex justify-between'>
          <h3 className='font-semibold text-2xl capitalize'>{name || "New Option"}</h3>
          <div className='flex flex-row justify-between'>
            <QuestionMarkCircleIcon
              title='Info'
              className='h-5 w-5 hover:scale-110 transition-all cursor-help'
              onClick={() => setShowPrompt((prev) => !prev)}
            />
            <TrashIcon
              title='Delete'
              className='h-5 w-5 hover:scale-110 transition-all cursor-help text-error-light'
              onClick={() => deleteBillingOption(details._id, details.qrCode)}
            />
          </div>
        </div>
        {showPrompt && (
          <p className='text-md text-primary-light mb-2'>
            Using the same name (option name) will update the existing option with that name;
            otherwise, a new billing option will be created. Ensure uniqueness of addresses/account
            numbers as duplicates won&apos;t be added as new options. A new QR Code must be uploaded
            on each update.
          </p>
        )}
        <form>
          <label
            className='flex flex-row justify-between text-sm font-semibold text-text-light mb-1'
            htmlFor='address'>
            {details.name === "bank" ? "Account Number" : "Address"}
            {pasted ? (
              <ClipboardDocumentCheckIcon className='h-7 w-7 text-success-dark' />
            ) : (
              <ClipboardIcon className='h-5 w-5 cursor-pointer' onClick={pasteFromClipboard} />
            )}
          </label>
          <input
            type='text'
            className='form-input w-full'
            value={address}
            onChange={(e) => setAddress(e.target.value)} // Controlled input
            id='address'
            placeholder='Enter or paste address'
          />
          <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='name'>
            Name
          </label>
          <input
            type='text'
            className='form-input w-full'
            value={name}
            onChange={(e) => setName(e.target.value)} // Controlled input
            id='name'
          />
          <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='receipt'>
            Upload QR Code
          </label>
          <input
            type='file'
            className='form-input w-full'
            accept='.png, .jpeg'
            onChange={handleFileChange}
            ref={fileInputRef}
            id='receipt'
          />
          {error && <FormError err={error} />}
        </form>
      </CardBody>
      <CardFooter className='pt-0 flex'>
        <button
          className='accent-btn w-full'
          onClick={handleUpload}
          disabled={!file || isUploading || !name || !address}>
          {isUploading ? "Processing..." : "Update"}
        </button>
      </CardFooter>
    </Card>
  );
};

BillingForm.propTypes = {
  detail: PropTypes.object.isRequired,
  setsuccess: PropTypes.func.isRequired,
};

export default BillingForm;
