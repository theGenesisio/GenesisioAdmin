import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Tooltip,
  IconButton,
} from "@material-tailwind/react";
import {
  ArrowsPointingOutIcon,
  ArrowUturnLeftIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ExclamationCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { formatToNewYorkTime } from "../../assets/helpers.js";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "../../layout/NotificationHelper";
import {
  btcIcon,
  cashasppIcon,
  dogecoinIcon,
  ethIcon,
  ltcIcon,
  paypalIcon,
} from "../../assets/icons";
import Receipt from "./Receipt";
import { useEffect, useRef, useState } from "react";
import FetchWithAuth from "../../auth/api.js";

export default function SingleDeposit() {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const { transaction } = useParams();
  const parsedTransaction = JSON.parse(decodeURIComponent(transaction));

  // Function to render the appropriate icon based on the transaction option
  const renderIcon = (name) => {
    const iconMap = {
      bitcoin: btcIcon,
      ethereum: ethIcon,
      litecoin: ltcIcon,
      dogecoin: dogecoinIcon,
      cashapp: cashasppIcon,
      paypal: paypalIcon,
    };
    return iconMap[name?.toLowerCase()] || <BuildingLibraryIcon className='w-5 h-5' />;
  };

  const [amount, setAmount] = useState(parsedTransaction.amount || 0);
  const [bonus, setBonus] = useState("0.00");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const imageRef = useRef(null);

  // Calculate the bonus based on the amount
  useEffect(() => {
    const calculatedBonus = amount ? parseFloat(amount) - (parsedTransaction?.amount || 0) : 0;
    setBonus(calculatedBonus.toLocaleString());
  }, [amount, parsedTransaction]);

  // Function to copy the client ID to the clipboard
  const copyToClipboard = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(parsedTransaction.user);
      setCopied(true);
      addNotification("Address copied successfully", "success");
    } catch (err) {
      console.error(err);
      setCopied(false);
      addNotification("Failed to copy address. Please retry.", "warning");
    }
  };

  // Function to handle the update of the deposit
  const handleUpdate = async () => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/edit/deposit`,
        {
          method: "POST",
          body: JSON.stringify({
            _id: parsedTransaction._id,
            status: "completed",
            user: parsedTransaction.user,
            originalAmount: parsedTransaction.amount,
            updatedAmount: amount,
          }),
          credentials: "include",
        },
        "Failed to confirm deposit"
      );

      if (response.failed) {
        const { message, failed } = response;
        addNotification(failed, "error");
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
      addNotification("An error occurred while updating the amount", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to change the state of the deposit
  const changeState = async (status) => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/edit/deposit`,
        {
          method: "PUT",
          body: JSON.stringify({ status, _id: parsedTransaction._id }),
          credentials: "include",
        },
        "Failed to update deposit status"
      );

      if (response.failed) {
        const { message, failed } = response;
        addNotification(failed, "error");
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

  // Actions for changing the state of the deposit
  const actions = [
    {
      tooltip: "Set status as COMPLETED",
      icon: CheckCircleIcon,
      iconClass: "text-success-light",
      state: "completed",
    },
    {
      tooltip: "Set status as FAILED",
      icon: ExclamationCircleIcon,
      iconClass: "text-error-light",
      state: "failed",
    },
    {
      tooltip: "Set status as PENDING",
      icon: ClockIcon,
      iconClass: "text-warning-dark",
      state: "pending",
    },
  ];

  // Function to delete the deposit entry
  const deleteEntry = async (_id, receipt) => {
    if (!_id) {
      console.error("_id is required to delete a deposit entry");
      addNotification("Invalid request: Missing _id", "error");
      return false;
    }

    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/history/deposit`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id, receipt }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
        "Failed to delete deposit entry"
      );

      if (response.failed) {
        const { message, failed } = response;
        addNotification(failed, "error");
        addNotification(message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          navigate(-1);
        } else {
          addNotification("Delete operation was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while deleting the entry", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

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

  if (!parsedTransaction) return null;

  return (
    <Card className='w-full max-w-[96dvh] md:max-w-[26rem] shadow-lg bg-primary-default text-text-light'>
      <CardHeader floated={false} color='blue-gray'>
        <Receipt imageId={parsedTransaction?.receipt} ref={imageRef} />
        <div className='absolute inset-0 h-full w-full bg-gradient-to-tr from-transparent to-black/60' />
        <IconButton variant='text' className='!absolute top-4 left-4 scale-[200%] text-text-light'>
          {renderIcon(parsedTransaction?.option || "")}
        </IconButton>
        <IconButton
          variant='text'
          className='!absolute top-4 right-4 rounded-full'
          onClick={() => navigate(-1)}>
          <ArrowUturnLeftIcon className='text-text-light w-5 h-5' title='Go back' />
        </IconButton>
        <IconButton
          variant='text'
          className='!absolute bottom-4 right-4 rounded-full'
          title='Fullscreen'
          onClick={viewFullscreen}>
          <ArrowsPointingOutIcon className='text-text-light w-5 h-5' />
        </IconButton>
      </CardHeader>
      <CardBody>
        <div className='mb-3 flex items-center justify-between'>
          <Typography variant='h2' className='font-medium text-text-light'>
            {`$${parsedTransaction?.amount.toLocaleString()}`}
            <sup
              className={`text-sm ${
                parsedTransaction?.bonus > 0
                  ? "text-success-dark"
                  : parsedTransaction?.bonus < 0
                  ? "text-error-dark"
                  : "text-primary-light"
              }`}>
              {` ${parsedTransaction?.bonus > 0 ? "+$" : "$"}${parseFloat(
                parsedTransaction?.bonus
              ).toLocaleString()}`}
            </sup>
          </Typography>
          <IconButton variant='text' className='scale-[200%] text-text-light'>
            {renderIcon(parsedTransaction.option)}
          </IconButton>
        </div>
        <Typography className='text-sm text-primary-light'>Deposit details.</Typography>
        <div className='my-2 flex flex-col space-y-2'>
          <p>
            <strong className='text-primary-light'>Transaction ID:</strong> {parsedTransaction._id}
          </p>
          <div className='flex flex-row justify-between'>
            <p>
              <strong className='text-primary-light'>Client ID:</strong> {parsedTransaction.user}
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
            <strong className='text-primary-light'>Date:</strong>{" "}
            {formatToNewYorkTime(parsedTransaction.createdAt)}
          </p>
          <form>
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='amount'>
              Confirmation Amount
            </label>
            <input
              type='number'
              className='form-input w-full'
              placeholder='$0.00'
              id='amount'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className='mt-1'>
              <strong className='text-primary-light'>Calculated added bonus: </strong>
              <span
                className={bonus > 0 ? "text-success-dark" : bonus < 0 ? "text-error-dark" : ""}>
                {`${bonus > 0 ? "+$" : "$"}${bonus}`}
              </span>
            </p>
          </form>
        </div>
      </CardBody>
      <CardFooter>
        <div className='flex flex-row justify-between'>
          <button className='accent-btn w-full' onClick={handleUpdate} disabled={loading}>
            Confirm Deposit
          </button>
          {actions
            .filter(({ state }) => state !== parsedTransaction.status)
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
                onClick={() => deleteEntry(parsedTransaction._id, parsedTransaction.receipt)}
              />
            </span>
          </Tooltip>
        </div>
      </CardFooter>
    </Card>
  );
}
