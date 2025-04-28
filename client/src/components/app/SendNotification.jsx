import { useState, useEffect, useMemo } from "react";
import { useNotification } from "../layout/NotificationHelper";
import FetchWithAuth from "../auth/api";
import Loader from "./subComponents/Loader.jsx";
import { formatToNewYorkTime } from "../../assets/helpers.js";
import { TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { Card } from "@material-tailwind/react";

/**
 * SendNotification component allows users to send notifications to specified targets.
 * It includes form inputs for creating new notifications and a table for displaying notification history.
 *
 * @component
 * @example
 * return (
 *   <SendNotification />
 * )
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @function
 * @name SendNotification
 *
 * @description
 * This component provides a form for sending notifications and displays a history of sent notifications.
 * Users can specify the type, message, expiry days, and targets for the notification.
 * The component also handles fetching, sending, and deleting notifications.
 *
 * @hook
 * @name useNotification
 * @description Hook for adding notifications to the notification system.
 *
 * @hook
 * @name useState
 * @description Hook for managing component state.
 *
 * @hook
 * @name useEffect
 * @description Hook for performing side effects in the component.
 *
 * @hook
 * @name useMemo
 * @description Hook for memoizing values to optimize performance.
 *
 * @function
 * @name handleSendNotification
 * @description Sends a notification to the specified targets.
 * @param {Event} e - The form submission event.
 *
 * @function
 * @name fetchNotifications
 * @description Fetches the list of notifications from the server.
 *
 * @function
 * @name deleteNotification
 * @description Deletes a notification by its ID.
 * @param {string} id - The ID of the notification to delete.
 *
 * @function
 * @name updateItemsPerPage
 * @description Updates the number of items per page based on the window size.
 *
 * @constant
 * @name filteredNotifications
 * @description Memoized value of filtered notifications based on the search query.
 *
 * @constant
 * @name paginatedNotifications
 * @description Memoized value of paginated notifications based on the current page and items per page.
 *
 * @constant
 * @name totalPages
 * @description Memoized value of the total number of pages based on the filtered notifications and items per page.
 */
const SendNotification = () => {
  const { addNotification } = useNotification();
  const [message, setMessage] = useState("");
  const [type, setType] = useState("*");
  const [expiryDays, setExpiryDays] = useState(7);
  const [targets, setTargets] = useState("");
  const [loading, setLoading] = useState(false);
  const [invalidTargetsCount, setInvalidTargetsCount] = useState(0);
  const [matchedTargetsCount, setMatchedTargetsCount] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await FetchWithAuth(
        `/notifications`,
        {
          method: "POST",
          body: JSON.stringify({
            message: message,
            type,
            expiryDate: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
            targets: targets.split(",").map((id) => id.trim()),
          }),
          credentials: "include",
        },
        "Failed to send notification"
      );
      if (response.failed) {
        const { message, failed } = response;
        addNotification(failed, "error");
        addNotification(message, "error");
      } else {
        const { success, message, invalidTargets, matchedTargets } = response;
        if (success) {
          addNotification(message, "success");
          setMessage("");
          setType("*");
          setExpiryDays(7);
          setTargets("");
          setInvalidTargetsCount(invalidTargets);
          setMatchedTargetsCount(matchedTargets);
          fetchNotifications(); // Refresh notifications
        } else {
          addNotification("Notification sending was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while sending the notification", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/notifications`,
        {
          method: "GET",
          credentials: "include",
        },
        "Failed to fetch notifications"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { notifications, message } = response;
        notifications && setNotifications(notifications.reverse());
        addNotification(message);
      }
    } catch (err) {
      addNotification("An error occurred", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id) => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/notifications`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id: id }),
          credentials: "include",
        },
        "Failed to delete notification"
      );
      if (response.failed) {
        addNotification(response.failed, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          fetchNotifications(); // Refresh notifications
        } else {
          addNotification("Notification deletion was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while deleting the notification", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      return !searchQuery || notification.message.includes(searchQuery);
    });
  }, [notifications, searchQuery]);

  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredNotifications.slice(startIndex, endIndex);
  }, [filteredNotifications, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredNotifications.length / itemsPerPage);
  }, [filteredNotifications.length, itemsPerPage]);

  useEffect(() => {
    setTotalItems(filteredNotifications.length); // Track total items
  }, [filteredNotifications]);

  return (
    <main className='grid md:grid-cols-5 grid-cols-1 gap-4'>
      <Card
        className='profile-box flex flex-col space-y-4 col-span-1 md:col-span-2'
        variant='gradient'
        color='gray'>
        <h2 className='text-lg font-semibold mb-2'>Send Notification</h2>
        <form onSubmit={handleSendNotification} className='flex flex-col space-y-2'>
          <div>
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='type'>
              Type
            </label>
            <select
              className='form-input w-full'
              value={type}
              onChange={(e) => setType(e.target.value)}
              id='type'
              required>
              <option value='success'>Success</option>
              <option value='error'>Error</option>
              <option value='warning'>Warning</option>
              <option value='*'>Any</option>
            </select>
          </div>
          <div>
            <label
              className='block text-sm font-semibold text-text-light mb-1'
              htmlFor='expiryDays'>
              Expiry Days
            </label>
            <input
              type='number'
              className='form-input w-full'
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              id='expiryDays'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='message'>
              Message
            </label>
            <textarea
              className='form-input w-full'
              value={message}
              rows='3'
              onChange={(e) => setMessage(e.target.value)}
              id='message'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='targets'>
              Targets (comma-separated user IDs)
            </label>
            <textarea
              className='form-input w-full'
              value={targets}
              onChange={(e) => setTargets(e.target.value)}
              id='targets'
              rows='2'
              placeholder="Enter comma-separated user IDs or '*' for all users"
            />
          </div>
          <button type='submit' className='accent-btn w-full' disabled={loading}>
            {loading ? "Sending..." : "Send Notification"}
          </button>
        </form>
        <div className='mt-4 flex flex-row justify-between text-sm'>
          <p>Invalid Targets: {invalidTargetsCount}</p>
          <p>Matched Targets: {matchedTargetsCount}</p>
        </div>
      </Card>
      <Card
        className='bg-primary-default text-text-light rounded-md shadow-md md:col-span-3'
        variant='gradient'
        color='gray'>
        <div className='p-4 flex flex-col md:flex-row justify-between'>
          <h2 className='text-lg font-semibold'>Notification History</h2>
          <div className='relative w-full max-w-sm md:ml-4 mt-2 md:mt-0'>
            <input
              type='text'
              placeholder='Search by Message'
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
                  <th className='p-4 min-w-[16rem]'>Message</th>
                  <th className='p-4'>Type</th>
                  <th className='p-4 min-w-[16rem]'>Creation Date</th>
                  <th className='p-4 min-w-[16rem]'>Expiry Date</th>
                  <th className='p-4'>Targets</th>
                  <th className='p-4'>ReadBy</th>
                  <th className='p-4'>Delete</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNotifications.map((notification) => (
                  <tr key={notification._id} className='border-b hover:bg-primary-dark'>
                    <td className='p-4 min-w-[16rem]'>{notification.message}</td>
                    <td className='p-4 capitalize'>{notification.type}</td>
                    <td className='p-4 min-w-[16rem]'>
                      {formatToNewYorkTime(notification.updatedAt)}
                    </td>
                    <td className='p-4 min-w-[16rem]'>
                      {formatToNewYorkTime(notification.expiryDate)}
                    </td>
                    <td className='p-4'>
                      {notification.targets.length < 6
                        ? Array.isArray(notification.targets)
                          ? notification.targets.join(", ")
                          : notification.targets
                        : notification.targets.length}
                    </td>
                    <td className='p-4'>
                      {notification.readBy.length === 0
                        ? 0
                        : notification.readBy.length < 6
                        ? Array.isArray(notification.readBy)
                          ? notification.readBy.join(", ")
                          : notification.readBy
                        : notification.readBy.length}
                    </td>
                    <td className='p-4'>
                      <TrashIcon
                        title='Clear filters'
                        className='h-5 w-5 hover:scale-110 transition-all cursor-pointer text-text-light mx-auto'
                        onClick={() => deleteNotification(notification._id)}
                      />
                    </td>
                  </tr>
                ))}
                {paginatedNotifications.length === 0 && (
                  <tr>
                    <td colSpan='7' className='p-4 text-center'>
                      No notifications found.
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

export default SendNotification;
