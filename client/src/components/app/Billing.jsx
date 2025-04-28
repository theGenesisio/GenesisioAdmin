/**
 * Billing component that displays and manages billing options.
 *
 * @component
 * @returns {JSX.Element} The rendered component.
 *
 * @example
 * return <Billing />;
 *
 * @description
 * This component fetches billing options from the server and displays them.
 * Users can select an existing billing option to edit or add a new billing option.
 * The component shows a loader while fetching data and handles errors by displaying notifications.
 *
 * @function
 * @name Billing
 *
 * @hook
 * @name useEffect
 * @description Fetches billing options when the component mounts or when the `success` state changes.
 *
 * @hook
 * @name useState
 * @description Manages the state of the component, including loading state, billing options, selected details, new option state, and success state.
 *
 * @hook
 * @name useNotification
 * @description Provides a method to add notifications.
 *
 * @param {Object} option - The billing option object.
 * @param {string} option.name - The name of the billing option.
 * @param {string} option.address - The address of the billing option.
 *
 * @returns {JSX.Element} The rendered component.
 */
import { useEffect, useState } from "react";
import { Placeholder10 } from "../../assets/utilities";
import FetchWithAuth from "../auth/api";
import { useNotification } from "../layout/NotificationHelper";
import Loader from "./subComponents/Loader";
import {
  BuildingLibraryIcon,
  CursorArrowRaysIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import {
  btcIcon,
  cashasppIcon,
  dogecoinIcon,
  ethIcon,
  ltcIcon,
  paypalIcon,
} from "../../assets/icons";
import BillingForm from "./subComponents/BillingForm";

const Billing = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [billingOptions, setBillingOptions] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isNewOption, setIsNewOption] = useState(false);
  const [success, setsuccess] = useState(false);
  const { addNotification } = useNotification();

  // Fetch billing options when the component mounts or `sucess` changes
  useEffect(() => {
    const fetchBillingOptions = async () => {
      setIsLoading(true);
      setSelectedDetails(null);

      try {
        const response = await FetchWithAuth(
          "/billing",
          { method: "GET", credentials: "include" },
          "Failed to fetch billing options"
        );

        if (response.failed) {
          addNotification(response.failed, "error");
        } else {
          setBillingOptions(response.options || []);
          addNotification(response.message);
        }
      } catch (error) {
        addNotification("An error occurred", "error");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  // Handle selecting a billing option
  const handleSelectOption = (option) => {
    setIsNewOption(false);
    setSelectedDetails(option);
  };

  // Render icon based on the billing option name
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
    <div className='space-y-4'>
      {/* Billing options */}
      <div className='w-full grid grid-cols-1 md:grid-cols-2 md:gap-2 gap-x-0 gap-y-5'>
        {isLoading ? (
          <div className='deposit-box'>
            <div className='absolute -top-[25%] left-[35%]'>
              <img src={Placeholder10} alt='QR code' className='w-10 h-10 rounded-lg shadow-lg' />
            </div>
            <div className='text-lg font-semibold flex justify-center px-2 mt-6'>
              <Loader />
            </div>
          </div>
        ) : (
          billingOptions.map((option, index) => (
            <div
              key={option?.address || index}
              className={`deposit-box cursor-pointer ${
                selectedDetails?.address === option?.address
                  ? "!bg-primary-light text-text-dark shadow-lg"
                  : ""
              }`}
              onClick={() => handleSelectOption(option)}>
              <div className='absolute top-[50%] left-[50%]'>
                <span className='scale-[500%] flex shadow-md rounded-lg'>
                  {renderIcon(option.name)}
                </span>
              </div>
              <div className='text-md lg:text-lg font-semibold px-2 mt-6'>
                <h2 className='capitalize truncate w-full flex justify-center'>{option?.name}</h2>
              </div>
            </div>
          ))
        )}

        {/* Add new billing option */}
        <div
          className='deposit-box flex justify-center'
          onClick={() => {
            setSelectedDetails(null);
            setIsNewOption((prev) => !prev);
          }}>
          <PlusIcon className='w-10 h-10 text-text-light my-auto' />
        </div>
      </div>

      {/* No billing options available */}
      {!isLoading && billingOptions.length === 0 && (
        <div className='w-full lg:max-w-md mx-auto lg:mx-0 bg-transparent flex flex-row justify-center lg:justify-start text-primary-light space-x-2 p-10 lg:ps-0'>
          <p className='text-sm font-semibold'>No billing option currently available</p>
          <ExclamationTriangleIcon className='w-5 h-5' />
        </div>
      )}

      {/* Instructions */}
      {!selectedDetails && !isNewOption && billingOptions.length > 0 && (
        <div className='w-full h-[50vh] lg:max-w-md mx-auto lg:mx-0 bg-transparent flex flex-row justify-center lg:justify-start text-primary-light space-x-2 p-10 lg:ps-0'>
          <p className='text-sm font-semibold'>Select a billing option to edit</p>
          <CursorArrowRaysIcon className='w-7 h-7' />
        </div>
      )}

      {/* Billing form */}
      {(selectedDetails || isNewOption) && (
        <BillingForm detail={selectedDetails || {}} setsuccess={setsuccess} />
      )}
    </div>
  );
};

export default Billing;
