import { useState, useEffect, useMemo } from "react";
import { useNotification } from "../layout/NotificationHelper";
import FetchWithAuth from "../auth/api";
import Loader from "./subComponents/Loader.jsx";
import { formatToNewYorkTime } from "../../assets/helpers.js";
import { TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import InvestmentTable from "./subComponents/InvestmentTable.jsx";
import { Card } from "@material-tailwind/react";

/**
 * Plans component allows users to create, view, and delete investment plans.
 * It includes form inputs for creating new plans and a table for displaying existing plans.
 *
 * @component
 * @example
 * return (
 *   <Plans />
 * )
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @function
 * @name Plans
 *
 * @description
 * This component handles the creation, viewing, and deletion of investment plans.
 * It includes form inputs for creating new plans and a table for displaying existing plans.
 * The component also supports searching and pagination of plans.
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
 * @property {function} setPlans - Function to set the plans state.
 * @property {function} setSearchQuery - Function to set the search query state.
 * @property {function} setCurrentPage - Function to set the current page state.
 * @property {function} setItemsPerPage - Function to set the items per page state.
 * @property {function} setTotalItems - Function to set the total items state.
 * @property {function} updateItemsPerPage - Function to update the items per page based on screen width.
 * @property {function} handlePlans - Function to handle the creation of new plans.
 * @property {function} fetchPlans - Function to fetch existing plans.
 * @property {function} deletePlan - Function to delete a plan.
 * @property {function} filteredPlans - Memoized value of filtered plans based on search query.
 * @property {function} paginatedPlans - Memoized value of paginated plans based on current page and items per page.
 * @property {function} totalPages - Memoized value of total pages based on filtered plans and items per page.
 */
const Plans = () => {
  const { addNotification } = useNotification();
  const [name, setName] = useState("");
  const [max, setMax] = useState("");
  const [min, setMin] = useState("");
  const [ROIPercentage, setROIPercentage] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);

  const [plans, setPlans] = useState([]);
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

  const handlePlans = async (e) => {
    e.preventDefault();
    if (parseFloat(min) >= parseFloat(max)) {
      addNotification("Min value should be less than Max value", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await FetchWithAuth(
        `/plans`,
        {
          method: "POST",
          body: JSON.stringify({
            name,
            max,
            min,
            ROIPercentage,
            duration,
          }),
          credentials: "include",
        },
        "Failed to create plan"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          setName("");
          setMax("");
          setMin("");
          setROIPercentage("");
          setDuration("");
          fetchPlans(); // Refresh plans
        } else {
          addNotification("Plan creation was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while creating the plan", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/plans`,
        {
          method: "GET",
          credentials: "include",
        },
        "Failed to fetch plans"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { plans, message } = response;
        plans && setPlans(plans.reverse());
        addNotification(message);
      }
    } catch (err) {
      addNotification("An error occurred", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  const deletePlan = async (id) => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/plans`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id: id }),
          credentials: "include",
        },
        "Failed to delete plan"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          fetchPlans(); // Refresh plans
        } else {
          addNotification("Plan deletion was not successful", "error");
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
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      return !searchQuery || plan.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [plans, searchQuery]);

  const paginatedPlans = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPlans.slice(startIndex, endIndex);
  }, [filteredPlans, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredPlans.length / itemsPerPage);
  }, [filteredPlans.length, itemsPerPage]);

  useEffect(() => {
    setTotalItems(filteredPlans.length); // Track total items
  }, [filteredPlans]);

  return (
    <main className='grid md:grid-cols-5 grid-cols-1 gap-4 pb-4'>
      <Card
        className='profile-box flex flex-col space-y-4 col-span-1 md:col-span-2'
        variant='gradient'
        color='gray'>
        <h2 className='text-lg font-semibold mb-2'>Create Plan</h2>
        <form onSubmit={handlePlans} className='flex flex-col space-y-2'>
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
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='max'>
              Max($)
            </label>
            <input
              type='number'
              className='form-input w-full'
              value={max}
              onChange={(e) => setMax(e.target.value)}
              id='max'
              placeholder=''
              required
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='min'>
              Min($)
            </label>
            <input
              type='number'
              className='form-input w-full'
              value={min}
              onChange={(e) => setMin(e.target.value)}
              id='min'
              placeholder=''
              required
            />
          </div>
          <div>
            <label
              className='block text-sm font-semibold text-text-light mb-1'
              htmlFor='ROIPercentage'>
              ROI Percentage(%)
            </label>
            <input
              type='number'
              className='form-input w-full'
              value={ROIPercentage}
              onChange={(e) => setROIPercentage(e.target.value)}
              id='ROIPercentage'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='duration'>
              Duration (days)
            </label>
            <input
              type='number'
              className='form-input w-full'
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              id='duration'
              required
            />
          </div>
          <button type='submit' className='accent-btn w-full' disabled={loading}>
            {loading ? "Creating..." : "Create Plan"}
          </button>
        </form>
      </Card>
      <Card
        className='bg-primary-default text-text-light rounded-md shadow-md md:col-span-3'
        variant='gradient'
        color='gray'>
        <div className='p-4 flex flex-col md:flex-row justify-between'>
          <h2 className='text-lg font-semibold'>Available Plans</h2>
          <div className='relative w-full max-w-sm md:ml-4 mt-2 md:mt-0'>
            <input
              type='text'
              placeholder='Search by Plan Name'
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
                  <th className='p-4 text-nowrap'>Min ($)</th>
                  <th className='p-4 text-nowrap'>Max ($)</th>
                  <th className='p-4 text-nowrap'>ROI Percentage (%)</th>
                  <th className='p-4'>Duration</th>
                  <th className='p-4'>Last Updated</th>
                  <th className='p-4'>Delete</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlans.map((plan) => (
                  <tr key={plan._id} className='border-b hover:bg-primary-dark'>
                    <td className='p-4 text-nowrap'>{plan.name}</td>
                    <td className='p-4'>{parseFloat(plan.limits.min).toLocaleString()}</td>
                    <td className='p-4'>{parseFloat(plan.limits.max).toLocaleString()}</td>
                    <td className='p-4'>{plan.ROIPercentage}</td>
                    <td className='p-4'>{plan.duration}</td>
                    <td className='p-4 min-w-[16rem]'>{formatToNewYorkTime(plan.updatedAt)}</td>
                    <td className='py-4'>
                      <TrashIcon
                        title='Clear filters'
                        className='h-5 w-5 hover:scale-110 transition-all cursor-pointer text-text-light mx-auto'
                        onClick={(e) => {
                          e.stopPropagation(); // Prevents <tr>'s onClick from firing
                          deletePlan(plan._id);
                        }}
                      />
                    </td>
                  </tr>
                ))}
                {paginatedPlans.length === 0 && (
                  <tr>
                    <td colSpan='6' className='p-4 text-center'>
                      No plans found.
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
      <InvestmentTable />
    </main>
  );
};

export default Plans;
