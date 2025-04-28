import { useEffect, useState, useMemo } from "react";
import { MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useNotification } from "../../layout/NotificationHelper";
import Loader from "../subComponents/Loader.jsx";
import { Card } from "@material-tailwind/react";
import FetchWithAuth from "../../auth/api.js";
import { formatToNewYorkTime } from "../../assets/helpers.js";
/**
 * Fetches the user's live trade history from the server.
 * Updates the live trade state with the fetched data and handles errors or notifications.
 * @async
 * @function
 * @returns {Promise<void>}
 */

const CopyTradeTable = () => {
  const { addNotification } = useNotification();
  const [copyTrades, setCopyTrades] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [loading, setLoading] = useState(true);
  const [success, setsuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await FetchWithAuth(
          `/copy-trade`,
          { method: "GET", credentials: "include" },
          "Failed to fetch copy trades"
        );
        if (response.failed) {
          addNotification(response.failed, "error");
        } else {
          const { trades, message } = response;
          trades && setCopyTrades(trades.reverse());
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

  const updateItemsPerPage = () => {
    const width = window.innerWidth;
    if (width >= 1200) setItemsPerPage(12);
    else if (width >= 768) setItemsPerPage(10);
    else setItemsPerPage(8);
  };

  useEffect(() => {
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const filteredLiveTrades = useMemo(() => {
    return copyTrades.filter((trade) => {
      const matchesSearch =
        !searchQuery.toLowerCase() || trade.trader.name.toLowerCase().includes(searchQuery);
      return matchesSearch;
    });
  }, [copyTrades, searchQuery]);

  const paginatedCopyTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLiveTrades.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLiveTrades, currentPage, itemsPerPage]);

  const totalItems = filteredLiveTrades.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const deleteTrade = async (_id) => {
    // Validate input early
    if (!_id) {
      console.error("_id is required to delete entry");
      addNotification("Invalid request: Missing _id", "error");
      return false;
    }

    try {
      setLoading(true);
      setsuccess(false);

      // Make the DELETE request to the server
      const response = await FetchWithAuth(
        `/copy-trade`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
        "Failed to delete trade"
      );

      if (response.failed) {
        // Handle failure response
        const { message } = response;
        addNotification(message, "error");
      } else {
        // Handle success response
        const { success, message } = response;
        if (success) {
          setsuccess(true);
          addNotification(message, "success");
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

  return (
    <Card
      className='text-text-light rounded-md shadow-md md:col-span-5'
      variant='gradient'
      color='gray'>
      <div className='flex flex-wrap justify-between items-center p-2 min-w-96'>
        <div>
          <h3 className='text-lg font-semibold'>Copy Trades</h3>
          <p className='text-sm text-primary-light'>Overview of all available Copy Trades</p>
        </div>
        <div className='mt-3 sm:mt-0'>
          <div className='relative w-full max-w-sm'>
            <input
              type='text'
              placeholder='Search by Trader name'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full form-input'
            />
            <MagnifyingGlassIcon className='w-4 h-4 absolute top-1/2 right-3 transform -translate-y-1/2 text-primary-light' />
          </div>
        </div>
      </div>

      <div className='flex justify-start items-center space-x-4 px-4 py-2'>
        <TrashIcon
          title='Clear filters'
          className='w-4 h-4 text-primary-light hover:scale-105 transition-all delay-100 hover:text-error-light duration-500'
          onClick={() => {
            setSearchQuery("");
          }}
        />
      </div>

      <div className='overflow-x-auto'>
        {loading ? (
          <Loader />
        ) : (
          <table className='w-full text-left text-sm'>
            <thead className='bg-primary-mild'>
              <tr>
                <th className='p-4 max-w-[16rem] text-nowrap'>Trader</th>
                <th className='p-4'>Trade Type</th>
                <th className='p-4'>Currency Pair</th>
                <th className='p-4'>Timing (Hours)</th>
                <th className='p-4'>Action</th>
                <th className='p-4'>Entry Price</th>
                <th className='p-4'>Stop Loss</th>
                <th className='p-4'>Take Profit</th>
                <th className='p-4'>Exit Price</th>
                <th className='p-4 min-w-[16rem]'>Created At</th>
                <th className='p-4'>Delete</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCopyTrades.map((trade) => (
                <tr key={trade._id} className='border-b hover:bg-primary-dark'>
                  <td className='p-4 max-w-[16rem] text-nowrap'>{trade.trader.name}</td>
                  <td className='p-4 capitalize'>{trade.type}</td>
                  <td className='p-4'>{trade.currencyPair}</td>
                  <td className='p-4'>{trade.time}</td>
                  <td className='p-4 capitalize'>{trade.action}</td>
                  <td className='p-4'>${parseFloat(trade.entryPrice).toLocaleString()}</td>
                  <td className='p-4'>${parseFloat(trade.stopLoss).toLocaleString()}</td>
                  <td className='p-4'>${parseFloat(trade.takeProfit).toLocaleString()}</td>
                  <td className='p-4'>
                    {trade.exitPrice ? `$${parseFloat(trade.exitPrice).toLocaleString()}` : "N/A"}
                  </td>
                  <td className='p-4 min-w-[12rem]'>{formatToNewYorkTime(trade.createdAt)}</td>
                  <td className='p-4'>
                    <TrashIcon
                      title='Delete'
                      className='h-5 w-5 hover:scale-110 transition-all cursor-pointer text-text-light mx-auto'
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents <tr>'s onClick from firing
                        deleteTrade(trade._id);
                      }}
                    />
                  </td>
                </tr>
              ))}
              {paginatedCopyTrades.length === 0 && (
                <tr>
                  <td colSpan='8' className='p-4 text-center'>
                    No trades found. Keep an eye on your portfolio!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

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

export default CopyTradeTable;
