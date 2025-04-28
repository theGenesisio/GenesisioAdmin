/**
 * Topup component handles the top-up functionality for users.
 * It allows users to submit top-up requests and displays a list of top-up records.
 *
 * @component
 * @example
 * return (
 *   <Topup />
 * )
 *
 * @returns {JSX.Element} The rendered Topup component.
 *
 * @function
 * @name Topup
 *
 * @description
 * - Fetches top-up records on component mount.
 * - Handles form submission for top-up requests.
 * - Filters and paginates top-up records based on search query and current page.
 * - Deletes a top-up record.
 *
 * @property {function} addNotification - Function to add notifications.
 * @property {boolean} loading - State to indicate loading status.
 * @property {string} userDetails - State to store user.
 * @property {string} amount - State to store top-up amount.
 * @property {string} description - State to store top-up description.
 * @property {Array} topupRecords - State to store top-up records.
 * @property {string} searchQuery - State to store search query.
 * @property {number} currentPage - State to store current page number.
 * @property {number} itemsPerPage - State to store number of items per page.
 * @property {Array} paginatedRecords - State to store paginated top-up records.
 * @property {number} totalItems - State to store total number of items.
 *
 * @method
 * @name updateItemsPerPage
 * @description Updates the number of items per page based on window size.
 *
 * @method
 * @name handleSubmit
 * @description Handles form submission for top-up requests.
 * @param {Event} e - The form submission event.
 *
 * @method
 * @name fetchTopupRecords
 * @description Fetches top-up records from the server.
 *
 * @method
 * @name deleteTopupRecord
 * @description Deletes a top-up record.
 * @param {string} id - The ID of the top-up record to delete.
 */
import { Card } from "@material-tailwind/react";
import { useState, useEffect } from "react";
import FetchWithAuth from "../auth/api.js";
import { useNotification } from "../layout/NotificationHelper";
import { MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/solid";
import Loader from "./subComponents/Loader.jsx";
import { formatToNewYorkTime } from "../assets/helpers.js";

const Topup = () => {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [userDetails, setuserDetails] = useState("");
  const [users, setUsers] = useState([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [affectedBalance, setAffectedBalance] = useState("");
  const [topupRecords, setTopupRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [paginatedRecords, setPaginatedRecords] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  // Update items per page based on window size
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
  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await FetchWithAuth(
        "/topup",
        {
          method: "POST",
          body: JSON.stringify({ userDetails, amount, description, affectedBalance }),
          credentials: "include",
        },
        "Failed to top up"
      );

      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { message } = response;
        addNotification(message, "success");
        // Reset form fields
        setuserDetails("");
        setAmount("");
        setDescription("");
        setAffectedBalance("");
        fetchTopupRecords(); // Refresh top-up records
      }
    } catch (err) {
      console.error("Error during top up:", err);
      addNotification("An error occurred while topping up", "error");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch top-up records
  const fetchTopupRecords = async () => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        "/topup",
        {
          method: "GET",
          credentials: "include",
        },
        "Failed to fetch topup records"
      );

      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { topupHistory, message } = response;
        setTopupRecords(topupHistory.reverse());
        addNotification(message, "success");
      }
    } catch (err) {
      console.error("Error fetching top-up records:", err);
      addNotification("An error occurred while fetching top-up records", "error");
    } finally {
      setLoading(false);
    }
  };
  // Function to fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/users`,
        {
          method: "GET",
          credentials: "include",
        },
        "Failed to fetch users"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { users, message } = response;
        users && setUsers(users.reverse());
        addNotification(message);
      }
    } catch (err) {
      addNotification("An error occurred", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  // Fetch top-up records on component mount
  useEffect(() => {
    fetchTopupRecords();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter and paginate top-up records
  useEffect(() => {
    const filtered = topupRecords.filter((record) => {
      return !searchQuery || record.description.includes(searchQuery);
    });

    setTotalItems(filtered.length); // Track total items
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    setPaginatedRecords(paginated);
  }, [topupRecords, searchQuery, currentPage, itemsPerPage]);

  // Calculate total pages dynamically
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Function to delete a top-up record
  const deleteTopupRecord = async (id) => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/topup`,
        {
          method: "DELETE",
          body: JSON.stringify({ id }),
          credentials: "include",
        },
        "Failed to delete top-up record"
      );

      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { message } = response;
        addNotification(message, "success");
        fetchTopupRecords(); // Refresh top-up records
      }
    } catch (err) {
      console.error("Error deleting top-up record:", err);
      addNotification("An error occurred while deleting the top-up record", "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className='grid md:grid-cols-5 grid-cols-1 gap-4'>
      <Card
        className='profile-box flex flex-col space-y-4 col-span-1 md:col-span-2'
        variant='gradient'
        color='gray'>
        <h2 className='text-lg font-semibold mb-2'>Top up</h2>
        <form className='flex flex-col space-y-2' onSubmit={handleSubmit}>
          <select
            className='form-input w-full'
            value={userDetails ? JSON.stringify(userDetails) : ""} // Default to empty
            onChange={(e) => {
              const selectedValue = e.target.value;
              setuserDetails(selectedValue ? JSON.parse(selectedValue) : null); // Set null if empty
            }}
            id='client'
            required>
            <option value='' disabled>
              Select a client
            </option>
            {users.map((user) => (
              <option
                key={user._id}
                value={JSON.stringify({ userId: user._id, fullName: user.fullName })}>
                {user.fullName}
              </option>
            ))}
          </select>
          <div>
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='amount'>
              Amount($)
            </label>
            <input
              type='number'
              className='form-input w-full'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              id='amount'
              placeholder='$0.00'
              required
            />
          </div>
          <div>
            <label
              className='block text-sm font-semibold text-text-light mb-1'
              htmlFor='affectedBalance'>
              Affected Balance
            </label>
            <select
              className='form-input w-full'
              value={affectedBalance}
              onChange={(e) => setAffectedBalance(e.target.value)}
              id='affectedBalance'
              required>
              <option value='' disabled>
                Select balance to affect
              </option>
              {["balance", "totalDeposit", "totalBonus", "profits", "withdrawn", "referral"].map(
                (option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                )
              )}
            </select>
          </div>
          <div>
            <label
              className='block text-sm font-semibold text-text-light mb-1'
              htmlFor='description'>
              Description
            </label>
            <textarea
              className='form-input w-full'
              rows='3'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Enter Description'
              id='description'
              required
            />
          </div>
          <button
            type='submit'
            className='accent-btn w-full'
            disabled={loading || isNaN(amount) || amount === 0}>
            {loading ? "Processing..." : "Top Up"}
          </button>
        </form>
      </Card>
      <Card
        className='bg-primary-default text-text-light rounded-md shadow-md md:col-span-3'
        variant='gradient'
        color='gray'>
        <div className='p-4 flex flex-col md:flex-row justify-between'>
          <h2 className='text-lg font-semibold'>Top-up Records</h2>
          <div className='relative w-full max-w-sm md:ml-4 mt-2 md:mt-0'>
            <input
              type='text'
              placeholder='Search by Description'
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
                  <th className='p-4'>Client</th>
                  <th className='p-4'>Amount($)</th>
                  <th className='p-4 flex-wrap'>Description</th>
                  <th className='p-4'>Date</th>
                  <th className='p-4'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record) => (
                  <tr key={record._id} className='border-b hover:bg-primary-dark'>
                    <td className='p-4'>{record.user.fullName}</td>
                    <td
                      className={`p-4 ${
                        record.amount < 0
                          ? "text-error-dark"
                          : record.amount > 0
                          ? "text-success-dark"
                          : "text-text-light"
                      }`}>
                      {`$${parseFloat(record.amount).toLocaleString()}`}
                    </td>
                    <td className='p-4 flex-wrap'>{record.description}</td>
                    <td className='p-4'>{formatToNewYorkTime(record.createdAt)}</td>
                    <td className='p-4'>
                      <TrashIcon
                        title='Clear filters'
                        className='h-5 w-5 hover:scale-110 transition-all cursor-pointer text-text-light mx-auto'
                        onClick={() => deleteTopupRecord(record._id)}
                      />
                    </td>
                  </tr>
                ))}
                {paginatedRecords.length === 0 && (
                  <tr>
                    <td colSpan='5' className='p-4 text-center'>
                      No top-up records found.
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

export default Topup;
