import { useRef, useState, useEffect } from "react";
import {
  ArrowsPointingOutIcon,
  ArrowUturnLeftIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  DocumentDuplicateIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { formatToNewYorkTime } from "../../assets/helpers.js";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "../../layout/NotificationHelper";
import { Card, CardBody, CardHeader, IconButton, Typography } from "@material-tailwind/react";
import Images from "./Images.jsx";
import Loader from "./Loader.jsx";
import FetchWithAuth from "../../auth/api.js";

const ViewKYC = () => {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const { kycDetails } = useParams();
  const imageRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [parsedKYC, setParsedKYC] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  // Parse KYC details safely
  useEffect(() => {
    try {
      setParsedKYC(JSON.parse(decodeURIComponent(kycDetails)));
    } catch (err) {
      console.error("Invalid KYC details:", err);
      addNotification("Failed to load KYC details.", "error");
      navigate(-1); // Redirect back if parsing fails
    }
  }, [kycDetails, navigate, addNotification]);

  // Fetch user details by parsedKYC.user
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!parsedKYC?.user) return;

      try {
        const response = await FetchWithAuth(
          `/user/${parsedKYC.user}`,
          {
            method: "GET",
            credentials: "include",
          },
          "Failed to fetch user details"
        );

        if (response.failed) {
          addNotification(response.message, "error");
        } else {
          const { user, message } = response;
          setUserDetails(user);
          addNotification(message, "success");
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        addNotification("An error occurred while fetching user details.", "error");
      }
    };

    fetchUserDetails();
  }, [parsedKYC, addNotification]);

  // Function to view the image gallery in fullscreen
  const viewFullscreen = () => {
    if (imageRef.current) {
      imageRef.current.requestFullscreen?.();
    }
  };

  // Function to copy the client ID to the clipboard
  const copyToClipboard = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(parsedKYC._id);
      setCopied(true);
      addNotification("KYC ID copied successfully", "success");
    } catch (err) {
      console.error(err);
      setCopied(false);
      addNotification("Failed to copy KYC ID. Please retry.", "warning");
    }
  };

  if (!parsedKYC || !userDetails) {
    return <Loader />;
  }

  return (
    <Card className='w-full max-w-[96dvh] md:max-w-[26rem] shadow-lg bg-primary-default text-text-light'>
      <CardHeader floated={false} color='transparent'>
        <Images imageIds={[parsedKYC?.frontFilename, parsedKYC?.backFilename]} ref={imageRef} />
        <div className='absolute inset-0 h-full w-full bg-gradient-to-tr from-transparent to-black/60' />
        <IconButton
          variant='text'
          className='!absolute top-4 right-4 rounded-full'
          onClick={() => navigate(-1)}
          aria-label='Go back'>
          <ArrowUturnLeftIcon className='text-text-light w-5 h-5' />
        </IconButton>
        <IconButton
          variant='text'
          className='!absolute bottom-4 right-4 rounded-full'
          onClick={viewFullscreen}
          aria-label='View fullscreen'>
          <ArrowsPointingOutIcon className='text-text-light w-5 h-5' />
        </IconButton>
      </CardHeader>
      <CardBody>
        <div className='mb-3 flex items-center justify-between'>
          <Typography variant='h2' className='font-medium text-text-light'>
            {parsedKYC.type}
          </Typography>
        </div>
        <Typography className='text-sm text-primary-light'>KYC details</Typography>
        <div className='my-2 flex flex-col space-y-2'>
          <p>
            <strong className='text-primary-light'>KYC ID:</strong> {parsedKYC._id}
          </p>
          <p>
            <strong className='text-primary-light'>Status:</strong>{" "}
            {parsedKYC?.state ? (
              <span>
                Verified{" "}
                <CheckBadgeIcon className='inline-block w-5 h-5 align-top text-success-light' />
              </span>
            ) : (
              <span>
                Unverified{" "}
                <XCircleIcon className='inline-block w-5 h-5 align-top text-error-light' />
              </span>
            )}
          </p>
          <p>
            <strong className='text-primary-light'>Created At:</strong>{" "}
            {formatToNewYorkTime(parsedKYC.createdAt)}
          </p>
          <p>
            <strong className='text-primary-light'>Updated At:</strong>{" "}
            {formatToNewYorkTime(parsedKYC.updatedAt)}
          </p>
        </div>
        <div className='my-2 flex flex-col space-y-2'>
          <Typography className='text-sm text-primary-light'>User Details</Typography>
          <div className='flex flex-row justify-between'>
            <p>
              <strong className='text-primary-light'>Client ID:</strong> {parsedKYC.user}
            </p>
            {copied ? (
              <ClipboardDocumentCheckIcon
                className='h-7 w-7 text-success-dark'
                aria-label='Copied to clipboard'
              />
            ) : (
              <DocumentDuplicateIcon
                className='h-5 w-5 cursor-pointer transition-transform hover:scale-110'
                onClick={copyToClipboard}
                aria-label='Copy to clipboard'
              />
            )}
          </div>
          <p>
            <strong className='text-primary-light'>Full Name:</strong> {userDetails.fullName}
          </p>
          <p>
            <strong className='text-primary-light'>Email:</strong> {userDetails.email}
          </p>
          <p>
            <strong className='text-primary-light'>Phone Number:</strong> {userDetails.phoneNumber}
          </p>
          <p className='capitalize'>
            <strong className='text-primary-light'>Gender:</strong> {userDetails.gender}
          </p>
          <p>
            <strong className='text-primary-light'>Country:</strong> {userDetails.country}
          </p>
        </div>
      </CardBody>
    </Card>
  );
};

export default ViewKYC;
