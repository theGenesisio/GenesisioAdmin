import { useState, useEffect, useMemo } from "react";
import { useNotification } from "../layout/NotificationHelper";
import FetchWithAuth from "../auth/api";
import Loader from "./subComponents/Loader.jsx";
import { formatToNewYorkTime } from "../../assets/helpers.js";
import { TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { Card } from "@material-tailwind/react";

/**
 * tiers component allows users to create, view, and delete investment tiers.
 * It includes form inputs for creating new tiers and a table for displaying existing tiers.
 *
 * @component
 * @example
 * return (
 *   <tiers />
 * )
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @function
 * @name tiers
 *
 * @description
 * This component handles the creation, viewing, and deletion of investment tiers.
 * It includes form inputs for creating new tiers and a table for displaying existing tiers.
 * The component also supports searching and pagination of tiers.
 *
 * @property {function} useNotification - Custom hook for displaying notifications.
 * @property {function} FetchWithAuth - Custom function for making authenticated API requests.
 * @property {function} formatToNewYorkTime - Helper function for formatting dates to UTC string.
 * @property {function} useState - React hook for managing state.
 * @property {function} useEffect - React hook for performing side effects.
 * @property {function} useMemo - React hook for memoizing values.
 * @property {function} addNotification - Function to add notifications.
 * @property {function} setName - Function to set the name state.
 * @property {function} setMax - Function to set the max state.
 * @property {function} setMin - Function to set the min state.
 * @property {function} setROIPercentage - Function to set the ROI percentage state.
 * @property {function} setDuration - Function to set the duration state.
 * @property {function} setLoading - Function to set the loading state.
 * @property {function} settiers - Function to set the tiers state.
 * @property {function} setSearchQuery - Function to set the search query state.
 * @property {function} setCurrentPage - Function to set the current page state.
 * @property {function} setItemsPerPage - Function to set the items per page state.
 * @property {function} setTotalItems - Function to set the total items state.
 * @property {function} updateItemsPerPage - Function to update the items per page based on screen width.
 * @property {function} handletiers - Function to handle the creation of new tiers.
 * @property {function} fectchTiers - Function to fetch existing tiers.
 * @property {function} deleteTier - Function to delete a plan.
 * @property {function} filteredTiers - Memoized value of filtered tiers based on search query.
 * @property {function} paginatedtiers - Memoized value of paginated tiers based on current page and items per page.
 * @property {function} totalPages - Memoized value of total pages based on filtered tiers and items per page.
 */
const Tiers = () => {
  const { addNotification } = useNotification();
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const [tiers, settiers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const updateItemsPerPage = () => {
    const width = window.innerWidth;
    if (width >= 1200) {
      setItemsPerPage(7); // For large screens
    } else if (width >= 768) {
      setItemsPerPage(6); // For tablets
    } else {
      setItemsPerPage(10); // For mobile screens
    }
  };

  useEffect(() => {
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const handletiers = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await FetchWithAuth(
        `/tiers`,
        {
          method: "POST",
          body: JSON.stringify({
            name,
            price,
            details,
          }),
          credentials: "include",
        },
        "Failed to create tier"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          setName("");
          setDetails("");
          setPrice("");
          fectchTiers(); // Refresh tiers
        } else {
          addNotification("Tier creation was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while creating the tier", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fectchTiers = async () => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/tiers`,
        {
          method: "GET",
          credentials: "include",
        },
        "Failed to fetch tiers"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { tiers, message } = response;
        tiers && settiers(tiers.reverse());
        addNotification(message);
      }
    } catch (err) {
      addNotification("An error occurred", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  const deleteTier = async (id) => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/tiers`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id: id }),
          credentials: "include",
        },
        "Failed to delete tier"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          fectchTiers(); // Refresh tiers
        } else {
          addNotification("Tier deletion was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while deleting the plan", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fectchTiers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTiers = useMemo(() => {
    return tiers.filter((plan) => {
      return !searchQuery || plan.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [tiers, searchQuery]);

  const paginatedtiers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTiers.slice(startIndex, endIndex);
  }, [filteredTiers, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredTiers.length / itemsPerPage);
  }, [filteredTiers.length, itemsPerPage]);

  useEffect(() => {
    setTotalItems(filteredTiers.length); // Track total items
  }, [filteredTiers]);

  return (
    <main className='grid md:grid-cols-5 grid-cols-1 gap-4 pb-4'>
      <Card
        className='profile-box flex flex-col space-y-4 col-span-1 md:col-span-2'
        variant='gradient'
        color='gray'>
        <h2 className='text-lg font-semibold mb-2'>Create Investments</h2>
        <form onSubmit={handletiers} className='flex flex-col space-y-2'>
          <div>
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='name'>
              Name
            </label>
            <input
              type='text'
              className='form-input w-full'
              value={name}
              onChange={(e) => setName(e.target.value)}
              id='name'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='price'>
              Price ($)
            </label>
            <input
              type='number'
              className='form-input w-full'
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              id='price'
              placeholder='0.00'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='details'>
              Details
            </label>
            <textarea
              className='form-input w-full'
              rows='3'
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder='Enter details of this tier'
              id='details'
              required
            />
          </div>
          <button type='submit' className='accent-btn w-full' disabled={loading}>
            {loading ? "Creating..." : "Create Tier"}
          </button>
        </form>
      </Card>
      <Card
        className='bg-primary-default text-text-light rounded-md shadow-md md:col-span-3'
        variant='gradient'
        color='gray'>
        <div className='p-4 flex flex-col md:flex-row justify-between'>
          <h2 className='text-lg font-semibold'>Available Tiers</h2>
          <div className='relative w-full max-w-sm md:ml-4 mt-2 md:mt-0'>
            <input
              type='text'
              placeholder='Search by tier Name'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='form-input w-full'
            />
            <MagnifyingGlassIcon className='w-4 h-4 absolute top-1/2 right-3 transform -translate-y-1/2 text-primary-light' />
          </div>
        </div>
        <div className='overflow-x-auto'>
          {loading ? (
            <Loader />
          ) : (
            <table className='w-full text-left text-sm'>
              <thead className='bg-primary-mild'>
                <tr>
                  <th className='p-4'>Name</th>
                  <th className='p-4 text-nowrap'>Price ($)</th>
                  <th className='p-4'>Details</th>
                  <th className='p-4'>Created</th>
                  <th className='p-4'>Delete</th>
                </tr>
              </thead>
              <tbody>
                {paginatedtiers.map((plan) => (
                  <tr key={plan._id} className='border-b hover:bg-primary-dark'>
                    <td className='p-4 text-nowrap'>{plan.name}</td>
                    <td className='p-4'>{parseFloat(plan.price).toLocaleString()}</td>
                    <td className='p-4 text-wrap min-w-[16rem]'>{plan.details}</td>
                    <td className='p-4 min-w-[16rem]'>{formatToNewYorkTime(plan.createdAt)}</td>
                    <td className='py-4'>
                      <TrashIcon
                        title='Delete Tier'
                        className='h-5 w-5 hover:scale-110 transition-all cursor-pointer text-text-light mx-auto'
                        onClick={(e) => {
                          e.stopPropagation(); // Prevents <tr>'s onClick from firing
                          deleteTier(plan._id);
                        }}
                      />
                    </td>
                  </tr>
                ))}
                {paginatedtiers.length === 0 && (
                  <tr>
                    <td colSpan='5' className='p-4 text-center'>
                      No tiers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className='flex justify-between items-center p-4 text-sm'>
          <p>
            Showing <b>{(currentPage - 1) * itemsPerPage + 1}</b>-
            <b>{Math.min(currentPage * itemsPerPage, totalItems)}</b> of <b>{totalItems}</b>
          </p>
          <div className='flex space-x-2'>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className='px-3 py-1 text-sm bg-transparent border rounded hover:bg-gray-200'
              disabled={currentPage === 1}>
              Prev
            </button>
            {[...Array(totalPages).keys()].map((page) => (
              <button
                key={page + 1}
                onClick={() => setCurrentPage(page + 1)}
                className={`px-3 py-1 text-sm border rounded ${
                  currentPage === page + 1
                    ? "text-white bg-primary-light"
                    : "bg-transparent hover:bg-gray-200"
                }`}>
                {page + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className='px-3 py-1 text-sm bg-transparent border rounded hover:bg-gray-200'
              disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </div>
      </Card>
    </main>
  );
};

export default Tiers;
