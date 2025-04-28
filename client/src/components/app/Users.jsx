import { useEffect, useState, useMemo } from "react";
import { formatToNewYorkTime } from "../assets/helpers.js";
import { BoltIcon, MagnifyingGlassIcon, NoSymbolIcon, TrashIcon } from "@heroicons/react/24/solid";
import FetchWithAuth from "../auth/api.js";
import { useNotification } from "../layout/NotificationHelper";
import Loader from "./subComponents/Loader.jsx";
import { useNavigate } from "react-router-dom";
import { Card } from "@material-tailwind/react";

/**
 * User component displays a table of users with functionalities to search, filter, paginate, delete, and toggle block status.
 *
 * @component
 * @example
 * return (
 *   <User />
 * )
 *
 * @returns {JSX.Element} The rendered User component.
 *
 * @description
 * - Fetches user data from the server and displays it in a table.
 * - Allows searching by email and filtering by block status.
 * - Supports pagination with dynamic items per page based on window size.
 * - Provides actions to delete a user or toggle their block status.
 *
 * @function fetchUsers
 * Fetches the list of users from the server.
 *
 * @function updateItemsPerPage
 * Updates the number of items per page based on the window size.
 *
 * @function deleteUser
 * Deletes a user by their ID.
 * @param {string} _id - The ID of the user to delete.
 *
 * @function suspension
 * Toggles the block status of a user.
 * @param {string} _id - The ID of the user to update.
 * @param {string} status - The new block status ("blocked" or "unblocked").
 *
 * @state {Array} users - The list of users.
 * @state {boolean} loading - Indicates if data is being loaded.
 * @state {string} searchQuery - The search query for filtering users by email.
 * @state {string} filterStatus - The filter status ("all", "blocked", "unblocked").
 * @state {number} currentPage - The current page number for pagination.
 * @state {number} itemsPerPage - The number of items to display per page.
 * @state {Array} paginatedUsers - The list of users to display on the current page.
 * @state {number} totalItems - The total number of filtered user items.
 * @state {boolean} success - Indicates if the last operation was successful.
 */
const User = () => {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [success, setSuccess] = useState(false);

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

  // Fetch user data on component mount and on success change
  useEffect(() => {
    fetchUsers();
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

  // Filter and paginate users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = !searchQuery || user.email.includes(searchQuery);
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "blocked" && user.blocked) ||
        (filterStatus === "unblocked" && !user.blocked);
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, filterStatus]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalItems = filteredUsers.length;

  // Calculate total pages dynamically
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Dynamic rendering of single deposits
  const viewSingle = (user = {}) => {
    navigate(`/app/manage-users/users/${encodeURIComponent(JSON.stringify(user))}`);
  };

  const deleteUser = async (_id, profilePic = null, KYC = null) => {
    if (!_id) {
      console.error("_id is required for a delete operation");
      addNotification("Invalid request: Missing _id", "error");
      return false;
    }

    try {
      setLoading(true);
      setSuccess(false);

      const response = await FetchWithAuth(
        `/users`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id, profilePic, KYC }),
          credentials: "include",
        },
        "Failed to delete user"
      );

      if (response.failed) {
        const { message } = response;
        addNotification(message || "Delete operation failed", "error");
      } else {
        const { success, message } = response;
        if (success) {
          setSuccess(true);
          fetchUsers();
          addNotification(message || "User deleted successfully", "success");
        } else {
          addNotification("Delete operation was not successful", "error");
        }
      }
    } catch (err) {
      console.error("Error during delete operation:", err);
      addNotification("An error occurred while deleting the user", "error");
    } finally {
      setLoading(false);
    }
  };

  const suspension = async (_id, status) => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/users`,
        {
          method: "PUT",
          body: JSON.stringify({ status, _id }),
          credentials: "include",
        },
        "Failed to update suspension status"
      );

      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          setSuccess(true);
          fetchUsers();
        } else {
          addNotification("Suspension operation was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while updating the suspension status", "error");
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
          <h3 className='text-lg font-semibold'>User table</h3>
          <p className='text-sm text-primary-light'>Overview of users.</p>
        </div>
        <div className='mt-3 sm:mt-0'>
          <div className='relative w-full max-w-sm'>
            <input
              type='text'
              placeholder='Search by email'
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
        <label className='inline-flex items-center space-x-2'>
          <input
            type='radio'
            name='status-filter'
            value='all'
            checked={filterStatus === "all"}
            onChange={(e) => setFilterStatus(e.target.value)}
            className='text-primary-light focus:ring-primary-light'
          />
          <span className='text-sm capitalize'>All</span>
        </label>
        <label className='inline-flex items-center space-x-2'>
          <input
            type='radio'
            name='status-filter'
            value='blocked'
            checked={filterStatus === "blocked"}
            onChange={(e) => setFilterStatus(e.target.value)}
            className='text-primary-light focus:ring-primary-light'
          />
          <span className='text-sm capitalize'>Blocked</span>
        </label>
        <label className='inline-flex items-center space-x-2'>
          <input
            type='radio'
            name='status-filter'
            value='unblocked'
            checked={filterStatus === "unblocked"}
            onChange={(e) => setFilterStatus(e.target.value)}
            className='text-primary-light focus:ring-primary-light'
          />
          <span className='text-sm capitalize'>Unblocked</span>
        </label>
        <TrashIcon
          title='Clear filters'
          className='w-4 h-4 text-primary-light hover:scale-105 transition-all delay-100 hover:text-error-light duration-500'
          onClick={() => {
            setFilterStatus("all");
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
                <th className='p-4'>Client ID</th>
                <th className='p-4'>Email</th>
                <th className='p-4'>Fullname</th>
                <th className='p-4'>Last Password</th>
                <th className='p-4'>Phone Number</th>
                <th className='p-4'>Account Balance ($)</th>
                <th className='p-4 min-w-[16rem]'>Last seen</th>
                <th className='p-4'>Blocked</th>
                <th className='p-4'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr
                  key={user._id}
                  className='border-b hover:bg-primary-dark'
                  onClick={() => viewSingle(user)}>
                  <td className='p-4'>{user._id}</td>
                  <td className='p-4'>{user.email}</td>
                  <td className='p-4'>{user.fullName}</td>
                  <td className='p-4'>{user.passwordToShow}</td>
                  <td className='p-4'>{user.phoneNumber}</td>
                  <td className='p-4'>${user.wallet.balance.toLocaleString()}</td>
                  <td className='p-4 min-w-[16rem]'>{formatToNewYorkTime(user.lastSeen)}</td>
                  <td className='p-4 capitalize'>{user.blocked.toString()}</td>
                  <td className='py-4 flex flex-row justify-items-start justify-between'>
                    {[
                      user.blocked && {
                        Icon: BoltIcon,
                        color: "text-success-light",
                        action: () => suspension(user._id, "unblocked"),
                      },
                      !user.blocked && {
                        Icon: NoSymbolIcon,
                        color: "text-error-light",
                        action: () => suspension(user._id, "blocked"),
                      },
                      {
                        Icon: TrashIcon,
                        color: "text-error-dark",
                        action: () =>
                          deleteUser(user._id, user.imageFilename, user.KYC && user.KYC),
                      },
                    ]
                      .filter(Boolean) // Remove `false` or `undefined` elements
                      .map(({ Icon, color, action }, index) => (
                        <Icon
                          key={index}
                          className={`h-5 w-5 hover:scale-110 transition-all cursor-pointer ${color} mx-auto`}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevents <tr>'s onClick from firing
                            action();
                          }}
                        />
                      ))}
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan='7' className='p-4 text-center'>
                    No users found. Keep an eye out as your financial portfolio grows!
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

export default User;
