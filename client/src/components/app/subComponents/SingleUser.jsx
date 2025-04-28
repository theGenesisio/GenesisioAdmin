import { useRef, useState } from "react";
import {
  ArrowsPointingOutIcon,
  ArrowUturnLeftIcon,
  ClipboardDocumentCheckIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/solid";
import { formatToNewYorkTime } from "../../assets/helpers.js";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "../../layout/NotificationHelper";
import { Card, CardBody, CardHeader, IconButton, Typography } from "@material-tailwind/react";
import ProfilePic from "./Profilepic.jsx";

const SingleUser = () => {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const { userDetails } = useParams();
  const parsedUser = JSON.parse(decodeURIComponent(userDetails));
  const imageRef = useRef(null);
  const [copiedText, setCopiedText] = useState("");
  //   const [loading, setloading] = useState();

  // Function to view the image in fullscreen
  const viewFullscreen = () => {
    if (imageRef.current) {
      if (imageRef.current.requestFullscreen) {
        imageRef.current.requestFullscreen();
      } else if (imageRef.current.mozRequestFullScreen) {
        /* Firefox */
        imageRef.current.mozRequestFullScreen();
      } else if (imageRef.current.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        imageRef.current.webkitRequestFullscreen();
      } else if (imageRef.current.msRequestFullscreen) {
        /* IE/Edge */
        imageRef.current.msRequestFullscreen();
      }
    }
  };

  // Function to copy text to the clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      addNotification("Copied successfully", "success");
    } catch (err) {
      console.error(err);
      setCopiedText("");
      addNotification("Failed to copy text. Please retry.", "warning");
    }
  };

  if (!parsedUser) return null;

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4'>
      <Card className='w-full shadow-lg text-text-light ' variant='gradient' color='gray'>
        <CardHeader floated={false} color='blue-gray' className='m-0'>
          <ProfilePic imageId={parsedUser?.imageFilename} ref={imageRef} />
          <div className='absolute inset-0 h-full w-full bg-gradient-to-tr from-transparent to-black/60' />
          <IconButton
            variant='text'
            className='!absolute top-4 right-4 rounded-full'
            onClick={() => navigate(-1)}>
            <ArrowUturnLeftIcon className='text-text-light w-5 h-5' />
          </IconButton>
          <IconButton
            variant='text'
            className='!absolute bottom-4 right-4 rounded-full'
            onClick={viewFullscreen}>
            <ArrowsPointingOutIcon className='text-text-light w-5 h-5' />
          </IconButton>
        </CardHeader>
      </Card>
      <Card className='w-full shadow-lg text-text-light' variant='gradient' color='gray'>
        <CardBody>
          <Typography className='text-sm text-primary-light'>User Details</Typography>
          <div className='my-2 flex flex-col space-y-2'>
            <div className='flex flex-row justify-between'>
              <p>
                <strong className='text-primary-light'>Client ID:</strong> {parsedUser._id}
              </p>
              {copiedText === parsedUser._id ? (
                <ClipboardDocumentCheckIcon className='h-7 w-7 text-success-dark' />
              ) : (
                <DocumentDuplicateIcon
                  className='h-5 w-5 cursor-pointer transition-transform hover:scale-110'
                  onClick={() => copyToClipboard(parsedUser._id)}
                />
              )}
            </div>
            <p>
              <strong className='text-primary-light'>Full Name:</strong> {parsedUser.fullName}
            </p>
            <p>
              <strong className='text-primary-light'>Email:</strong> {parsedUser.email}
            </p>
            <p>
              <strong className='text-primary-light'>Phone Number:</strong> {parsedUser.phoneNumber}
            </p>
            <p className='capitalize'>
              <strong className='text-primary-light'>Gender:</strong> {parsedUser.gender}
            </p>
            <p>
              <strong className='text-primary-light'>Country:</strong> {parsedUser.country}
            </p>
          </div>
        </CardBody>
      </Card>
      <Card className='w-full shadow-lg text-text-light' variant='gradient' color='gray'>
        <CardBody>
          <Typography className='text-sm text-primary-light'>Wallet</Typography>
          <div className='my-2 flex flex-col space-y-2'>
            <p>
              <strong className='text-primary-light'>Account Balance:</strong>{" "}
              {`$${parseFloat(parsedUser.wallet.balance).toLocaleString()}`}
            </p>
            <p>
              <strong className='text-primary-light'>Total Deposit:</strong>{" "}
              {`$${parseFloat(parsedUser.wallet.totalDeposit).toLocaleString()}`}
            </p>
            <p>
              <strong className='text-primary-light'>Total Bonus:</strong>{" "}
              {`$${parseFloat(parsedUser.wallet.totalBonus).toLocaleString()}`}
            </p>
            <p>
              <strong className='text-primary-light'>Total Withdrawal:</strong>{" "}
              {`$${parseFloat(parsedUser.wallet.withdrawn).toLocaleString()}`}
            </p>
            <p>
              <strong className='text-primary-light'>Total Profits:</strong>{" "}
              {`$${parseFloat(parsedUser.wallet.profits).toLocaleString()}`}
            </p>
            <p>
              <strong className='text-primary-light'>Total Referrals:</strong>{" "}
              {`$${parseFloat(parsedUser.wallet.referral).toLocaleString()}`}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card className='w-full shadow-lg text-text-light' variant='gradient' color='gray'>
        <CardBody>
          <Typography className='text-sm text-primary-light'>Metrics and Monitoring</Typography>
          <div className='my-2 flex flex-col space-y-2'>
            <p>
              <strong className='text-primary-light'>Active:</strong>{" "}
              {parsedUser.active ? "Yes" : "No"}
            </p>
            <p>
              <strong className='text-primary-light'>Last Seen:</strong>{" "}
              {formatToNewYorkTime(parsedUser.lastSeen)}
            </p>
            <p>
              <strong className='text-primary-light'>Registered:</strong>{" "}
              {formatToNewYorkTime(parsedUser.createdAt)}
            </p>
            <p>
              <strong className='text-primary-light'>Last Updated At:</strong>{" "}
              {formatToNewYorkTime(parsedUser.updatedAt)}
            </p>
            <p>
              <strong className='text-primary-light'>Last Password Change:</strong>{" "}
              {formatToNewYorkTime(parsedUser.lastPasswordChange)}
            </p>
          </div>
        </CardBody>
      </Card>
      <Card className='w-full shadow-lg text-text-light' variant='gradient' color='gray'>
        <CardBody>
          <Typography className='text-sm text-primary-light'>Management and Others</Typography>
          <div className='my-2 flex flex-col space-y-2'>
            <div className='flex flex-row justify-between'>
              <p>
                <strong className='text-primary-light'>KYC ID:</strong> {parsedUser.KYC}
              </p>
              {copiedText === parsedUser.KYC ? (
                <ClipboardDocumentCheckIcon className='h-7 w-7 text-success-dark' />
              ) : (
                <DocumentDuplicateIcon
                  className='h-5 w-5 cursor-pointer transition-transform hover:scale-110'
                  onClick={() => copyToClipboard(parsedUser.KYC)}
                />
              )}
            </div>
            <p>
              <strong className='text-primary-light'>Blocked:</strong>{" "}
              {parsedUser.blocked ? "Yes" : "No"}
            </p>
            <p>
              <strong className='text-primary-light'>Referral Code:</strong>{" "}
              {parsedUser.referralCode || "Nil"}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default SingleUser;
