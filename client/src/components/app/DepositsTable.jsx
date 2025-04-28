/**
 * DepositsTable component displays a table of deposit transactions with filtering, searching, and pagination functionalities.
 *
 * @component
 * @example
 * return (
 *   <DepositsTable />
 * )
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @description
 * This component fetches deposit history data, allows filtering by status, searching by client ID, and paginates the results.
 * It also provides functionality to delete a deposit entry.
 *
 * @function
 * @name DepositsTable
 *
 * @property {function} addNotification - Function to add notifications.
 * @property {function} navigate - Function to navigate to different routes.
 * @property {Array} transactions - State variable to store the list of transactions.
 * @property {boolean} loading - State variable to indicate loading state.
 * @property {string} searchQuery - State variable to store the search query.
 * @property {string} filterStatus - State variable to store the filter status.
 * @property {number} currentPage - State variable to store the current page number.
 * @property {number} itemsPerPage - State variable to store the number of items per page.
 * @property {boolean} success - State variable to indicate the success of an operation.
 *
 * @function useEffect - Fetches deposit history data on component mount and when `success` state changes.
 * @function updateItemsPerPage - Updates the number of items per page based on window size.
 * @function useMemo - Filters and paginates transactions based on search query, filter status, and current page.
 * @function viewSingle - Navigates to the single transaction view.
 * @function deleteEntry - Deletes a deposit entry.
 */
import { useEffect, useState, useMemo } from "react";
import { formatToNewYorkTime } from "../assets/helpers.js";
import { MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/solid";
import FetchWithAuth from "../auth/api.js";
import { useNotification } from "../layout/NotificationHelper";
import Loader from "./subComponents/Loader.jsx";
import { useNavigate } from "react-router-dom";
import { Card } from "@material-tailwind/react";

const DepositsTable = () => {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  // State management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [success, setSuccess] = useState(false);

  // Fetch history data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await FetchWithAuth(
          `/history/deposit`,
          {
            method: "GET",
            credentials: "include",
          },
          "Failed to fetch deposit history"
        );
        if (response.failed) {
          addNotification(response.failed, "error");
        } else {
          const { history, message } = response;
          history && setTransactions(history.reverse());
          addNotification(message);
        }
      } catch (err) {
        addNotification("An error occurred", "error");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  // Update items per page based on window size
  const updateItemsPerPage = () => {
    const width = window.innerWidth;
    if (width >= 1200) {
      setItemsPerPage(12); // For large screens
    } else if (width >= 768) {
      setItemsPerPage(10); // For tablets
    } else {
      setItemsPerPage(8); // For mobile screens
    }
  };

  useEffect(() => {
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // Filter and paginate transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch = !searchQuery || transaction.user.includes(searchQuery);
      const matchesStatus = !filterStatus || transaction.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchQuery, filterStatus]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const totalItems = filteredTransactions.length;

  // Calculate total pages dynamically
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Dynamic rendering of single deposits
  const viewSingle = (transaction = {}) => {
    navigate(`/app/transactions/deposit/${encodeURIComponent(JSON.stringify(transaction))}`);
  };

  const deleteEntry = async (_id, receipt) => {
    if (!_id) {
      console.error("_id is required to delete a deposit entry");
      addNotification("Invalid request: Missing _id", "error");
      return false;
    }

    try {
      setLoading(true);
      setSuccess(false);

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
          setSuccess(true);
          addNotification(message, "success");
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

  return (
    <Card
      className='text-text-light w-full max-w-[96dvw] md:max-w-[95dvw] lg:max-w-[80dvw] rounded-md shadow-md mx-auto'
      variant='gradient'
      color='gray'>
      {/* Header Section */}
      <div className='flex flex-wrap justify-between items-center p-2 min-w-96'>
        <div>
          <h3 className='text-lg font-semibold'>Deposit History</h3>
          <p className='text-sm text-primary-light'>Overview of user transactions.</p>
        </div>
        <div className='mt-3 sm:mt-0'>
          <div className='relative w-full max-w-sm'>
            <input
              type='text'
              placeholder='Search by Client ID'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full form-input'
            />
            <MagnifyingGlassIcon className='w-4 h-4 absolute top-1/2 right-3 transform -translate-y-1/2 text-primary-light' />
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className='flex justify-start items-center space-x-4 px-4 py-2'>
        {["pending", "completed", "failed"].map((status) => (
          <label key={status} className='inline-flex items-center space-x-2'>
            <input
              type='radio'
              name='status-filter'
              value={status}
              checked={filterStatus === status}
              onChange={(e) => setFilterStatus(e.target.value)}
              className='text-primary-light focus:ring-primary-light'
            />
            <span className='text-sm capitalize'>{status}</span>
          </label>
        ))}
        <TrashIcon
          title='Clear filters'
          className='w-4 h-4 text-primary-light hover:scale-105 transition-all delay-100 hover:text-error-light duration-500'
          onClick={() => {
            setFilterStatus("");
            setSearchQuery("");
          }}
        />
      </div>

      {/* Table Section */}
      <div className='overflow-x-auto'>
        {loading ? (
          <Loader />
        ) : (
          <table className='w-full text-left text-sm'>
            <thead className='bg-primary-mild'>
              <tr>
                <th className='p-4'>Transaction ID</th>
                <th className='p-4'>Client ID</th>
                <th className='p-4'>Option</th>
                <th className='p-4'>Amount ($)</th>
                <th className='p-4'>Bonus ($)</th>
                <th className='p-4'>Status</th>
                <th className='p-4 min-w-[16rem]'>Date</th>
                <th className='p-4'>Delete</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((transaction) => (
                <tr
                  key={transaction._id}
                  className='border-b hover:bg-primary-dark'
                  onClick={() => viewSingle(transaction)}>
                  <td className='p-4'>{transaction._id}</td>
                  <td className='p-4'>{transaction.user}</td>
                  <td className='p-4 capitalize'>{transaction.option}</td>
                  <td className='p-4'>${transaction.amount.toLocaleString()}</td>
                  <td
                    className={`p-4 ${
                      transaction.bonus > 0
                        ? "text-success-dark"
                        : transaction.bonus < 0
                        ? "text-error-dark"
                        : ""
                    }`}>
                    {transaction.bonus.toLocaleString()}
                  </td>
                  <td className='p-4 capitalize'>{transaction.status}</td>
                  <td className='p-4 min-w-[16rem]'>
                    {formatToNewYorkTime(transaction.createdAt)}
                  </td>
                  <td className='py-4'>
                    <TrashIcon
                      className='h-5 w-5 hover:scale-110 transition-all cursor-pointer text-text-light mx-auto'
                      title='Delete'
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents <tr>'s onClick from firing
                        deleteEntry(transaction._id, transaction.receipt);
                      }}
                    />
                  </td>
                </tr>
              ))}
              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan='8' className='p-4 text-center'>
                    No transactions found. Keep an eye out as your financial portfolio grows!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Section */}
      <div className='flex justify-between items-center p-4'>
        <p className='text-sm'>
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
  );
};

export default DepositsTable;
