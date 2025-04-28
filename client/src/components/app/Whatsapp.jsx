/**
 * Whatsapp component for managing and updating the Whatsapp number configuration.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered Whatsapp configuration component.
 *
 * @example
 * <Whatsapp />
 *
 * @description
 * This component fetches the current Whatsapp number from the server and allows the user to update it.
 * It displays the current number and the last updated timestamp. The user can input a new number and submit it to update the configuration.
 *
 * @function fetchCurrentNumber
 * Fetches the current Whatsapp number from the server.
 *
 * @function handleUpdate
 * Handles the form submission to update the Whatsapp number.
 *
 * @function showHandler
 * Toggles the visibility of the information tooltip.
 *
 * @hook useEffect
 * Fetches the current Whatsapp number when the component mounts.
 *
 * @hook useState
 * Manages the component's state, including loading status, phone number input, current number info, and tooltip visibility.
 *
 * @requires useEffect
 * @requires useState
 * @requires FetchWithAuth
 * @requires useNotification
 * @requires QuestionMarkCircleIcon
 * @requires Card
 */
import { useEffect, useState } from "react";
import FetchWithAuth from "../auth/api";
import { useNotification } from "../layout/NotificationHelper";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid";
import { Card } from "@material-tailwind/react";
import { formatToNewYorkTime } from "../../assets/helpers";

const Whatsapp = () => {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [{ number, updatedAt }, setNumberInfo] = useState({ number: "", updatedAt: "" });
  const [show, setShow] = useState(false);
  const { addNotification } = useNotification();

  const fetchCurrentNumber = async () => {
    try {
      const response = await FetchWithAuth(
        `/whatsapp`,
        {
          method: "GET",
          credentials: "include",
        },
        "Failed to open whatsapp chat"
      );
      if (response.failed) {
        const { message, failed } = response;
        addNotification(failed, "error");
        addNotification(message, "error");
      } else {
        const { number, message } = response;
        number &&
          setNumberInfo({
            number: number.number,
            updatedAt: new Date(number.updatedAt).toUTCString(),
          });
        addNotification(message);
      }
    } catch (err) {
      addNotification("An error occurred", "error");
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchCurrentNumber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/whatsapp`,
        {
          method: "PUT",
          body: JSON.stringify({ phoneNumber }),
          credentials: "include",
        },
        "Failed to update deposit status"
      );

      if (response.failed) {
        const { message, failed } = response;
        addNotification(failed, "error");
        addNotification(message, "error");
      } else {
        const { updatedNumber, message } = response;
        if (updatedNumber) {
          addNotification(message, "success");
          setNumberInfo({
            number: updatedNumber.number,
            updatedAt: new Date(updatedNumber.updatedAt).toUTCString(),
          });
        }
      }
    } catch (err) {
      addNotification("An error occurred while updating whatsapp number", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const showHandler = () => {
    setShow(!show);
  };

  return (
    <Card
      className='profile-box flex flex-col space-y-2 md:max-w-[65dvw] lg:max-w-[30dvw] w-full'
      variant='gradient'
      color='gray'>
      <h2 className='text-lg font-semibold mb-2 flex justify-between'>
        Whatsapp Configuration
        <QuestionMarkCircleIcon
          title='Info'
          className='h-5 w-5 hover:scale-110 transition-all delay-100 cursor-help'
          onClick={showHandler}
        />
      </h2>
      {show && (
        <p className='text-sm text-primary-light mb-2'>
          Enter a value that matches <code>+17620368101</code>
          <br />
          Excluding the hyphen {`(-)`}, the whitespace {`( )`} but not the country code {`+1`}
        </p>
      )}
      <p>
        <strong className='text-primary-light'>Current Whatsapp number:</strong> {number}
      </p>
      <p>
        <strong className='text-primary-light'>Updated at:</strong> {formatToNewYorkTime(updatedAt)}
      </p>
      <form onSubmit={handleUpdate} className='flex flex-col space-y-2'>
        <div>
          <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='phoneNumber'>
            New Whatsapp number
          </label>
          <input
            type='text'
            className='form-input w-full'
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.slice(0, 400))} // Controlled input with char limit
            id='phoneNumber'
            maxLength={400}
          />
        </div>
        <button className='accent-btn w-full' type='submit' disabled={loading}>
          {loading ? "Updating..." : "Update number"}
        </button>
      </form>
    </Card>
  );
};

export default Whatsapp;
