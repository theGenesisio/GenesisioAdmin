import { useEffect, useState, useMemo } from "react";
import { formatToNewYorkTime } from "../../assets/helpers.js";
import { BoltIcon, MagnifyingGlassIcon, NoSymbolIcon, TrashIcon } from "@heroicons/react/24/solid";
import FetchWithAuth from "../../auth/api.js";
import { useNotification } from "../../layout/NotificationHelper";
import Loader from "./Loader.jsx";
import { Card } from "@material-tailwind/react";

/**
 * AdminsTable component displays a table of admin users with functionalities to search, filter, paginate, delete, and toggle block status.
 *
 * @component
 * @example
 * return (
 *   <AdminsTable />
 * )
 *
 * @returns {JSX.Element} The rendered AdminsTable component.
 *
 * @description
 * - Fetches admin data from the server and displays it in a table.
 * - Allows searching by username and filtering by block status.
 * - Supports pagination with dynamic items per page based on window size.
 * - Provides actions to delete an admin or toggle their block status.
 *
 * @function fetchAdmins
 * Fetches the list of admins from the server.
 *
 * @function updateItemsPerPage
 * Updates the number of items per page based on the window size.
 *
 * @function handleDeleteAdmin
 * Deletes an admin by their ID.
 * @param {string} _id - The ID of the admin to delete.
 *
 * @function handleToggleBlockStatus
 * Toggles the block status of an admin.
 * @param {string} _id - The ID of the admin to update.
 * @param {string} status - The new block status ("blocked" or "unblocked").
 *
 * @state {Array} admins - The list of admin users.
 * @state {boolean} loading - Indicates if data is being loaded.
 * @state {string} searchQuery - The search query for filtering admins by username.
 * @state {string} filterStatus - The filter status ("all", "blocked", "unblocked").
 * @state {number} currentPage - The current page number for pagination.
 * @state {number} itemsPerPage - The number of items to display per page.
 * @state {Array} paginatedAdmins - The list of admins to display on the current page.
 * @state {number} totalItems - The total number of filtered admin items.
 * @state {boolean} success - Indicates if the last operation was successful.
 */
const AdminsTable = () => {
  const { addNotification } = useNotification();
  // State management
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [success, setSuccess] = useState(false);

  // Function to fetch admins
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/auth/manage-admins`,
        {
          method: "GET",
          credentials: "include",
        },
        "Failed to fetch admins"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { admins, message } = response;
        admins && setAdmins(admins.reverse());
        addNotification(message);
      }
    } catch (err) {
      addNotification("An error occurred", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch admin data on component mount and on success change
  useEffect(() => {
    fetchAdmins();
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

  // Filter and paginate admins
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesSearch =
        !searchQuery || admin.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "blocked" && admin.blocked) ||
        (filterStatus === "unblocked" && !admin.blocked);
      return matchesSearch && matchesStatus;
    });
  }, [admins, searchQuery, filterStatus]);

  const paginatedAdmins = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAdmins.slice(startIndex, endIndex);
  }, [filteredAdmins, currentPage, itemsPerPage]);

  const totalItems = filteredAdmins.length;

  // Calculate total pages dynamically
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Handler to delete an admin
  const handleDeleteAdmin = async (_id) => {
    if (!_id) {
      console.error("_id is required for a delete operation");
      addNotification("Invalid request: Missing _id", "error");
      return false;
    }

    try {
      setLoading(true);
      setSuccess(false);

      const response = await FetchWithAuth(
        `/auth/manage-admins`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id }),
          credentials: "include",
        },
        "Failed to delete admin"
      );

      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          setSuccess(true);
          fetchAdmins();
          addNotification(message || "Admin deleted successfully", "success");
        } else {
          addNotification("Delete operation was not successful", "error");
        }
      }
    } catch (err) {
      console.error("Error during delete operation:", err);
      addNotification("An error occurred while deleting the admin", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handler to toggle admin block status
  const handleToggleBlockStatus = async (_id, status) => {
    if (!_id || !status) {
      console.error("Missing required fields for block status update");
      addNotification("Invalid request: Missing required fields", "error");
      return false;
    }

    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/auth/manage-admins`,
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
          fetchAdmins();
        } else {
          addNotification("Suspension operation was not successful", "error");
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      addNotification("An error occurred while updating the suspension status", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className='profile-box flex flex-col space-y-4 col-span-1 md:col-span-5'
      variant='gradient'
      color='gray'>
      {/* Header Section */}
      <div className='flex flex-wrap justify-between items-center p-2 min-w-96'>
        <div>
          <h3 className='text-lg font-semibold'>Admins Table</h3>
          <p className='text-sm text-primary-light'>Overview of admins.</p>
        </div>
        <div className='mt-3 sm:mt-0'>
          <div className='relative w-full max-w-sm'>
            <input
              type='text'
              placeholder='Search by username'
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
                <th className='p-4'>Admin ID</th>
                <th className='p-4 min-w-[10rem]'>Username</th>
                <th className='p-4 min-w-[10rem]'>Last seen</th>
                <th className='p-4 min-w-[10rem]'>Created by</th>
                <th className='p-4 min-w-[10rem]'>Created at</th>
                <th className='p-4 min-w-[10rem]'>Last Login OS</th>
                <th className='p-4 min-w-[10rem]'>Last Login Device</th>
                <th className='p-4 min-w-[10rem]'>Last Login Browser</th>
                <th className='p-4 min-w-[10rem]'>Last Login IP</th>
                <th className='p-4'>Blocked</th>
                <th className='p-4'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAdmins.map((admin) => (
                <tr key={admin._id} className='border-b hover:bg-primary-dark'>
                  <td className='p-4'>{admin._id}</td>
                  <td className='p-4 min-w-[10rem]'>{admin.username}</td>
                  <td className='p-4 min-w-[10rem]'>{formatToNewYorkTime(admin.lastSeen)}</td>
                  <td className='p-4 min-w-[10rem]'>{admin.createdBy.username}</td>
                  <td className='p-4 min-w-[10rem]'>{formatToNewYorkTime(admin.createdAt)}</td>
                  <td className='p-4 min-w-[10rem]'>{admin?.lastLoginDetails?.os || "N/A"}</td>
                  <td className='p-4 min-w-[10rem]'>{admin?.lastLoginDetails?.device || "N/A"}</td>
                  <td className='p-4 min-w-[10rem]'>{admin?.lastLoginDetails?.browser || "N/A"}</td>
                  <td className='p-4 min-w-[10rem]'>
                    {admin?.lastLoginDetails?.ipAddress || "N/A"}
                  </td>
                  <td className='p-4 capitalize'>{admin.blocked.toString()}</td>
                  <td className='py-4 flex flex-row justify-items-start justify-between'>
                    {[
                      admin.blocked && {
                        Icon: BoltIcon,
                        title: "Unblock",
                        color: "text-success-light",
                        action: () => handleToggleBlockStatus(admin._id, "unblocked"),
                      },
                      !admin.blocked && {
                        Icon: NoSymbolIcon,
                        title: "Block",
                        color: "text-error-light",
                        action: () => handleToggleBlockStatus(admin._id, "blocked"),
                      },
                      {
                        Icon: TrashIcon,
                        title: "Delete",
                        color: "text-error-dark",
                        action: () => handleDeleteAdmin(admin._id),
                      },
                    ]
                      .filter(Boolean) // Remove `false` or `undefined` elements
                      .map(({ Icon, color, action, title }, index) => (
                        <Icon
                          key={index}
                          title={title}
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
              {paginatedAdmins.length === 0 && (
                <tr>
                  <td colSpan='11' className='p-4 text-center'>
                    No admins found. Keep an eye out as your financial portfolio grows!
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

export default AdminsTable;
