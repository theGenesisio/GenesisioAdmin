import {
  Card,
  CardBody,
  CardFooter,
  Typography,
  Tooltip,
  IconButton,
} from "@material-tailwind/react";
import {
  ArrowUturnLeftIcon,
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  DocumentDuplicateIcon,
  ExclamationCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { formatTime, formatToNewYorkTime } from "../../assets/helpers.js";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "../../layout/NotificationHelper";
import { useEffect, useState } from "react";
import FetchWithAuth from "../../auth/api.js";

export default function SingleTrade() {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const { trade } = useParams();
  const parsedTrade = JSON.parse(decodeURIComponent(trade));

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exitPrice, setexitPrice] = useState(() => {
    if (parsedTrade?.action === "buy") {
      return parsedTrade?.takeProfit || 0;
    } else if (parsedTrade?.action === "sell") {
      return parsedTrade?.stopLoss || 0;
    }
    return 0; // Default value if none of the conditions match
  });

  const [profitLoss, setprofitLoss] = useState(0);
  useEffect(() => {
    setprofitLoss(exitPrice - parsedTrade.entryPrice);
  }, [parsedTrade, exitPrice]);
  // Function to copy the client ID to the clipboard
  const copyToClipboard = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(parsedTrade.user);
      setCopied(true);
      addNotification("Address copied successfully", "success");
    } catch (err) {
      console.error(err);
      setCopied(false);
      addNotification("Failed to copy address. Please retry.", "warning");
    }
  };

  // Function to handle the update of the deposit
  const closeTrade = async () => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/edit/livetrade`,
        {
          method: "POST",
          body: JSON.stringify({
            _id: parsedTrade._id,
            status: "completed",
            exitPrice,
            profitLoss,
          }),
          credentials: "include",
        },
        "Failed to close trade"
      );

      if (response.failed) {
        const { message } = response;
        addNotification(message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          navigate(-1);
        } else {
          addNotification("Close operation was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while closing trade", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to change the state of the entry
  const changeState = async (_id, status) => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/edit/livetrade`,
        {
          method: "PUT",
          body: JSON.stringify({ status, _id }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
        "Failed to update livetrade status"
      );

      if (response.failed) {
        const { message } = response;
        addNotification(message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          navigate(-1);
        } else {
          addNotification("Update operation was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while updating the status", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  const deleteEntry = async (_id, receipt = null) => {
    // Validate input early
    if (!_id) {
      console.error("_id is required to delete entry");
      addNotification("Invalid request: Missing _id", "error");
      return false;
    }

    try {
      setLoading(true);

      // Make the DELETE request to the server
      const response = await FetchWithAuth(
        `/history/livetrade`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id, receipt }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
        "Failed to delete entry"
      );

      if (response.failed) {
        // Handle failure response
        const { message } = response;
        addNotification(message, "error");
      } else {
        // Handle success response
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          navigate(-1);
        } else {
          addNotification("Delete operation was not successful", "error");
        }
      }
    } catch (err) {
      // Handle unexpected errors
      addNotification("An error occurred while deleting the entry", "error");
      console.error("Fetch error:", err);
    } finally {
      // Reset state
      setLoading(false);
    }
  };

  // Actions for changing the state of the deposit
  const actions = [
    {
      tooltip: "Set status as COMPLETED",
      icon: CheckCircleIcon,
      iconClass: "text-success-light",
      state: "completed",
    },
    {
      tooltip: "Set status as CANCELED",
      icon: ExclamationCircleIcon,
      iconClass: "text-error-light",
      state: "canceled",
    },
    {
      tooltip: "Set status as ACTIVE",
      icon: BoltIcon,
      iconClass: "text-warning-light",
      state: "active",
    },
  ];

  if (!parsedTrade) return null;

  return (
    <Card
      className='w-full max-w-[96dvh] md:max-w-[26rem] shadow-lg text-text-light'
      variant='gradient'
      color='gray'>
      <CardBody>
        <div className='mb-3 flex flex-row items-center justify-between'>
          <Typography variant='h2' className='font-medium text-text-light'>
            {`$${parsedTrade?.entryPrice.toLocaleString()}`}
            <sup className={`text-sm ${profitLoss > 0 ? "text-success-dark" : "text-error-dark"}`}>
              {` $${parseFloat(profitLoss).toLocaleString()}`}
            </sup>
          </Typography>
          <IconButton variant='text' className='rounded-full' onClick={() => navigate(-1)}>
            <ArrowUturnLeftIcon className='text-text-light w-5 h-5' title='Go back' />
          </IconButton>
        </div>
        <Typography className='text-sm text-primary-light'>Client details.</Typography>
        <div className='my-2 flex flex-col space-y-2'>
          <div className='flex flex-row justify-between'>
            <p>
              <strong className='text-primary-light'>Client ID:</strong>{" "}
              {parsedTrade?.user?.id || "N/A"}
            </p>
            {copied ? (
              <ClipboardDocumentCheckIcon className='h-7 w-7 text-success-dark' title='Copied' />
            ) : (
              <DocumentDuplicateIcon
                className='h-5 w-5 cursor-pointer transition-transform hover:scale-110'
                title='Copy'
                onClick={copyToClipboard}
              />
            )}
          </div>
          <p>
            <strong className='text-primary-light'>Client Email:</strong>
            <span className='capitalize'>{parsedTrade?.user?.email}</span>
          </p>
          <Typography className='text-sm text-primary-light'>Trade details.</Typography>
          <p>
            <strong className='text-primary-light'>Trade ID:</strong> {parsedTrade._id}
          </p>
          <p>
            <strong className='text-primary-light'>Trade Type:</strong>
            <span className='capitalize'>{parsedTrade.type}</span>
          </p>
          <p>
            <strong className='text-primary-light'>Currency Pair:</strong>{" "}
            {parsedTrade.currencyPair}
          </p>
          <p>
            <strong className='text-primary-light'>Created At:</strong>{" "}
            {formatToNewYorkTime(parsedTrade.createdAt)}
          </p>
          <p>
            <strong className='text-primary-light'>Closed At:</strong>{" "}
            {parsedTrade.closedAt ? formatToNewYorkTime(parsedTrade.closedAt) : "N/A"}
          </p>
          <p>
            <strong className='text-primary-light'>Duration:</strong>{" "}
            {(parsedTrade?.duration && formatTime(parsedTrade?.duration)) || "N/A"}
          </p>
          <p>
            <strong className='text-primary-light'>Stop Loss:</strong>
            {" $"}
            {parsedTrade?.stopLoss ? parseFloat(parsedTrade.stopLoss).toLocaleString() : "N/A"}
          </p>
          <p>
            <strong className='text-primary-light'>Take Profit:</strong>
            {" $"}
            {parsedTrade?.takeProfit ? parseFloat(parsedTrade.takeProfit).toLocaleString() : "N/A"}
          </p>
          <p>
            <strong className='text-primary-light'>Exit Price:</strong>
            {" $"}
            {parsedTrade?.exitPrice ? parseFloat(parsedTrade.exitPrice).toLocaleString() : "N/A"}
          </p>
          <p>
            <strong className='text-primary-light'>Profit Loss:</strong>
            {" $"}
            {parsedTrade?.profitLoss ? parseFloat(parsedTrade.profitLoss).toLocaleString() : "N/A"}
          </p>

          <form className='space-y-2'>
            {/* cant be more than takeprofit for buy or less than stoploss for sell */}
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='exitPrice'>
              Set New Exit Price
            </label>
            <input
              type='number'
              className='form-input w-full'
              placeholder='$0.00'
              id='exitPrice'
              value={exitPrice}
              onChange={(e) => setexitPrice(e.target.value)}
            />
            <p>
              <strong className='text-primary-light text-sm'>Calculated Profit Loss:</strong>{" "}
              <span
                className={`text-sm ${profitLoss > 0 ? "text-success-dark" : "text-error-dark"}`}>
                ${parseFloat(profitLoss).toLocaleString()}
              </span>
            </p>
          </form>
        </div>
      </CardBody>
      <CardFooter className='pt-0'>
        <div className='flex flex-row justify-between'>
          <button className='accent-btn w-full' onClick={closeTrade} disabled={loading}>
            Close Trade
          </button>
          {actions
            .filter(({ state }) => state !== parsedTrade.status)
            .map(({ tooltip, icon: Icon, iconClass, state }) => (
              <Tooltip key={state} content={tooltip}>
                <span
                  className='cursor-pointer rounded-full p-3 transition-colors hover:opacity-70'
                  onClick={() => changeState(state)}>
                  <Icon className={`w-6 h-6 ${iconClass}`} />
                </span>
              </Tooltip>
            ))}
          <Tooltip content='DELETE'>
            <span className='cursor-pointer rounded-full p-3 transition-colors hover:opacity-70'>
              <TrashIcon
                className='w-6 h-6 text-error-dark'
                onClick={() => deleteEntry(parsedTrade._id)}
              />
            </span>
          </Tooltip>
        </div>
      </CardFooter>
    </Card>
  );
}
