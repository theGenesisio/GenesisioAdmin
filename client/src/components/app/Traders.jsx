/**
 * Traders component that displays and manages traders.
 *
 * @component
 * @returns {JSX.Element} The rendered component.
 *
 * @example
 * return <Traders />;
 *
 * @description
 * This component fetches traders from the server and displays them.
 * Users can select an existing trader to edit or add a new trader.
 * The component shows a loader while fetching data and handles errors by displaying notifications.
 *
 * @function
 * @name Traders
 *
 * @hook
 * @name useEffect
 * @description Fetches traders when the component mounts or when the `success` state changes.
 *
 * @hook
 * @name useState
 * @description Manages the state of the component, including loading state, traders, selected details, new trader state, and success state.
 *
 * @hook
 * @name useNotification
 * @description Provides a method to add notifications.
 *
 * @param {Object} trader - The trader object.
 * @param {string} trader.name - The name of the trader.
 * @param {string} trader.address - The address of the trader.
 *
 * @returns {JSX.Element} The rendered component.
 */
import { useEffect, useState } from "react";
// import { Placeholder10 } from "../../assets/utilities";
import FetchWithAuth from "../auth/api";
import { useNotification } from "../layout/NotificationHelper";
import Loader from "./subComponents/Loader";
import { CursorArrowRaysIcon, ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/solid";
import TraderForm from "./TraderForm";
import TraderImg from "./subComponents/TraderImg";

const Traders = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [traders, setTraders] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isNewTrader, setIsNewOption] = useState(false);
  const [success, setsuccess] = useState(false);
  const { addNotification } = useNotification();
  // Fetch traders when the component mounts or `sucess` changes
  useEffect(() => {
    const fetchTraders = async () => {
      setIsLoading(true);
      setSelectedDetails(null);

      try {
        const response = await FetchWithAuth(
          "/traders",
          { method: "GET", credentials: "include" },
          "Failed to fetch traders"
        );

        if (response.failed) {
          addNotification(response.failed, "error");
        } else {
          setTraders(response.traders || []);
          addNotification(response.message);
        }
      } catch (error) {
        addNotification("An error occurred", "error");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTraders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  // Handle selecting a trader
  const handleSelectTrader = (trader) => {
    setIsNewOption(false);
    setSelectedDetails(trader);
  };
  return (
    <div className='space-y-4'>
      {/* traders */}
      <div className='w-full grid grid-cols-1 md:grid-cols-2 md:gap-2 gap-x-0 gap-y-5'>
        {isLoading ? (
          <div className='deposit-box'>
            <div className='text-lg font-semibold flex justify-center px-2 mt-6'>
              <Loader />
            </div>
          </div>
        ) : (
          traders.map((trader, index) => (
            <div
              key={trader?._id || index}
              className={`deposit-box cursor-pointer flex flex-col items-center justify-center h-full ${
                selectedDetails?._id === trader?._id
                  ? "!bg-primary-light text-text-dark shadow-lg"
                  : ""
              }`}
              onClick={() => handleSelectTrader(trader)}>
              <TraderImg imageId={trader?.imageFilename} />
              <div className='text-md lg:text-lg font-semibold px-2 mt-4 text-center'>
                <h2 className='capitalize truncate w-full'>{trader?.name}</h2>
              </div>
            </div>
          ))
        )}

        {/* Add new trader */}
        <div
          className='deposit-box flex justify-center'
          onClick={() => {
            setSelectedDetails(null);
            setIsNewOption((prev) => !prev);
          }}>
          <PlusIcon className='w-10 h-10 text-text-light my-auto' />
        </div>
      </div>

      {/* No traders available */}
      {!isLoading && traders.length === 0 && (
        <div className='w-full lg:max-w-md mx-auto lg:mx-0 bg-transparent flex flex-row justify-center lg:justify-start text-primary-light space-x-2 p-10 lg:ps-0'>
          <p className='text-sm font-semibold'>No trader currently available</p>
          <ExclamationTriangleIcon className='w-5 h-5' />
        </div>
      )}

      {/* Instructions */}
      {!selectedDetails && !isNewTrader && traders.length > 0 && (
        <div className='w-full h-[50vh] lg:max-w-md mx-auto lg:mx-0 bg-transparent flex flex-row justify-center lg:justify-start text-primary-light space-x-2 p-10 lg:ps-0'>
          <p className='text-sm font-semibold'>Select a trader to edit</p>
          <CursorArrowRaysIcon className='w-7 h-7' />
        </div>
      )}

      {/* Traders form */}
      {(selectedDetails || isNewTrader) && (
        <TraderForm detail={selectedDetails || {}} setsuccess={setsuccess} />
      )}
    </div>
  );
};

export default Traders;
