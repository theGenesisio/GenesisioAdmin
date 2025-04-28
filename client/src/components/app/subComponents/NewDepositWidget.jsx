/**
 * LatestDeposit Component
 * Fetches and displays the latest deposit information in a card format.
 * @module LatestDeposit
 */

import {
  ArrowLongRightIcon,
  ArrowsPointingOutIcon,
  ArrowTopRightOnSquareIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  ClipboardDocumentCheckIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/solid";
import { Card, CardHeader, CardBody, Typography, IconButton } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Receipt from "../subComponents/Receipt";
import Loader from "../subComponents/Loader.jsx";
import FetchWithAuth from "../../auth/api.js";
import useAuth from "../../auth/useAuth";
import {
  btcIcon,
  cashasppIcon,
  dogecoinIcon,
  ethIcon,
  ltcIcon,
  paypalIcon,
} from "../../assets/icons.jsx";
import { formatToNewYorkTime } from "../../assets/helpers.js";
import { useNotification } from "../../layout/NotificationHelper.jsx";

/**
 * Component to display the latest deposit details.
 * Includes loading states, error handling, and dynamic UI rendering.
 * @returns {JSX.Element} The LatestDeposit component.
 */
export default function LatestDeposit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deposit, setDeposit] = useState(null);
  const imageRef = useRef(null); // Reference for the image element
  const { admin } = useAuth();
  const [copied, setCopied] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    /**
     * Fetches the latest deposit data from the server.
     * Updates the component state with the fetched data.
     */
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await FetchWithAuth(
          `/dashboard-widget/latest-deposit?limit=1&date=${new Date(admin?.lastSeen)}`,
          {
            method: "GET",
            credentials: "include",
          },
          "Failed to fetch deposit data"
        );

        if (response.failed) {
          console.error(response.message);
        }
        const { success, message, data } = response;
        if (success) {
          setDeposit(data[0]);
        } else {
          console.error(message);
        }
      } catch (error) {
        console.error("Error fetching deposit data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [admin.lastSeen]);

  /**
   * Opens the receipt image in fullscreen mode.
   */
  const viewFullscreen = () => {
    if (imageRef.current) {
      if (imageRef.current.requestFullscreen) {
        imageRef.current.requestFullscreen();
      } else if (imageRef.current.mozRequestFullScreen) {
        imageRef.current.mozRequestFullScreen(); // Firefox
      } else if (imageRef.current.webkitRequestFullscreen) {
        imageRef.current.webkitRequestFullscreen(); // Chrome, Safari, Opera
      } else if (imageRef.current.msRequestFullscreen) {
        imageRef.current.msRequestFullscreen(); // IE/Edge
      }
    }
  };

  /**
   * Navigates to a detailed view of a single deposit.
   * @param {Object} transaction - The transaction details.
   */
  const viewSingle = (transaction = {}) => {
    navigate(`/app/transactions/deposit/${encodeURIComponent(JSON.stringify(transaction))}`);
  };

  /**
   * Copies the client ID to the clipboard.
   * @param {Event} e - The click event.
   */
  const copyToClipboard = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(deposit?.user);
      setCopied(true);
      addNotification("Address copied successfully", "success");
    } catch (err) {
      console.error(err);
      setCopied(false);
      addNotification("Failed to copy address. Please retry.", "warning");
    }
  };

  /**
   * Renders the appropriate icon based on the transaction option.
   * @param {string} name - The name of the transaction option.
   * @returns {JSX.Element} The corresponding icon element.
   */
  const renderIcon = (name) => {
    const iconMap = {
      bitcoin: btcIcon,
      ethereum: ethIcon,
      litecoin: ltcIcon,
      dogecoin: dogecoinIcon,
      cashapp: cashasppIcon,
      paypal: paypalIcon,
    };
    return iconMap[name.toLowerCase()] || <BuildingLibraryIcon className='w-5 h-5' />;
  };

  return (
    <Card className='dashboard-box flex flex-col md:flex-row !p-0' variant='gradient' color='gray'>
      <CardHeader
        shadow={false}
        floated={false}
        className='m-0 w-full md:w-2/5 shrink-0 rounded-r-none object-contain'>
        <Receipt imageId={deposit?.receipt} ref={imageRef} />
        <IconButton
          className='!absolute top-4 right-4'
          title='Open'
          onClick={() => viewSingle(deposit)}>
          <ArrowLongRightIcon className='w-5 h-5 text-text-light' />
        </IconButton>
        <IconButton
          className='!absolute bottom-4 right-4'
          title='View fullscreen'
          onClick={viewFullscreen}>
          <ArrowsPointingOutIcon className='w-5 h-5 text-text-light' />
        </IconButton>
        <span className='!absolute top-4 left-4 scale-[150%] text-text-light' title='Option'>
          {renderIcon(deposit?.option || "")}
        </span>
      </CardHeader>
      <CardBody className='w-full'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <BanknotesIcon className='h-5 w-5' />
            <Typography variant='h6' className='font-semibold text-text-light'>
              Latest Deposit
            </Typography>
          </div>
          <ArrowTopRightOnSquareIcon
            className='h-5 w-5'
            title='View all deposits'
            onClick={() => navigate("/app/deposits")}
          />
        </div>
        {loading ? (
          <Loader />
        ) : deposit ? (
          <>
            <div className='mb-3 flex items-center justify-between'>
              <Typography variant='h2' className='font-medium text-text-light'>
                {`$${deposit?.amount?.toLocaleString()}`}
                <sup
                  className={`text-sm ${
                    deposit?.bonus > 0
                      ? "text-success-dark"
                      : deposit?.bonus < 0
                      ? "text-error-dark"
                      : "text-primary-light"
                  }`}>
                  {deposit &&
                    `${deposit?.bonus > 0 ? "+$" : "$"}${parseFloat(
                      deposit?.bonus
                    ).toLocaleString()}`}
                </sup>
              </Typography>
            </div>

            <div className='my-2 flex flex-col space-y-2'>
              <p>
                <strong className='text-primary-light'>Transaction ID:</strong> {deposit._id}
              </p>
              <div className='flex flex-row justify-between'>
                <p>
                  <strong className='text-primary-light'>Client ID:</strong> {deposit.user}
                </p>
                {copied ? (
                  <ClipboardDocumentCheckIcon
                    className='h-7 w-7 text-success-dark'
                    title='Copied'
                  />
                ) : (
                  <DocumentDuplicateIcon
                    className='h-5 w-5 cursor-pointer transition-transform hover:scale-110'
                    title='Copy'
                    onClick={copyToClipboard}
                  />
                )}
              </div>
              <p>
                <strong className='text-primary-light'>Date:</strong>{" "}
                {formatToNewYorkTime(deposit.createdAt)}
              </p>
            </div>
          </>
        ) : (
          <Typography className='mt-4 text-sm'>No deposit data available.</Typography>
        )}
      </CardBody>
    </Card>
  );
}
