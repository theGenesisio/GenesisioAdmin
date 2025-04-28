import { useEffect, useState, useMemo } from "react";
import { formatToNewYorkTime } from "../assets/helpers.js";
import {
  MagnifyingGlassIcon,
  TrashIcon,
  XCircleIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/solid";
import FetchWithAuth from "../auth/api.js";
import { useNotification } from "../layout/NotificationHelper";
import Loader from "./subComponents/Loader.jsx";
import { useNavigate } from "react-router-dom";
import { Card } from "@material-tailwind/react";

/**
 * Kyc component displays a table of KYC entries with functionalities to search, filter, paginate, delete, and verify/unverify KYC entries.
 *
 * @component
 * @example
 * return (
 *   <Kyc />
 * )
 *
 * @returns {JSX.Element} The rendered Kyc component.
 *
 * @description
 * - Fetches KYC data from the server and displays it in a table.
 * - Allows searching by client ID and filtering by verification status.
 * - Supports pagination with dynamic items per page based on window size.
 * - Provides actions to delete a KYC entry or toggle its verification status.
 *
 * @function fetchKycEntries
 * Fetches the list of KYC entries from the server.
 *
 * @function updateItemsPerPage
 * Updates the number of items per page based on the window size.
 *
 * @function deleteKycEntry
 * Deletes a KYC entry by its ID.
 * @param {string} _id - The ID of the KYC entry to delete.
 *
 * @function Verification
 * Toggles the verification status of a KYC entry.
 * @param {string} _id - The ID of the KYC entry to update.
 * @param {string} state - The new verification status ("verify" or "unverify").
 *
 * @state {Array} kycEntries - The list of KYC entries.
 * @state {boolean} loading - Indicates if data is being loaded.
 * @state {string} searchQuery - The search query for filtering KYC entries by client ID.
 * @state {string} filterStatus - The filter status ("all", "Verified", "Unverified").
 * @state {number} currentPage - The current page number for pagination.
 * @state {number} itemsPerPage - The number of items to display per page.
 * @state {Array} paginatedKycEntries - The list of KYC entries to display on the current page.
 * @state {number} totalItems - The total number of filtered KYC entries.
 * @state {boolean} success - Indicates if the last operation was successful.
 */
const Kyc = () => {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [kycEntries, setKycEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [success, setSuccess] = useState(false);

  // Function to fetch KYC entries
  const fetchKycEntries = async () => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/kyc`,
        {
          method: "GET",
          credentials: "include",
        },
        "Failed to fetch KYC entries"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { kycRecords, message } = response;
        kycRecords && setKycEntries(kycRecords.reverse());
        addNotification(message);
      }
    } catch (err) {
      addNotification("An error occurred", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch KYC data on component mount and on success change
  useEffect(() => {
    fetchKycEntries();
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

  // Filter and paginate KYC entries
  const filteredKycEntries = useMemo(() => {
    return kycEntries.filter((entry) => {
      const matchesSearch = !searchQuery || entry.user.includes(searchQuery);
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "Verified" && entry.state) ||
        (filterStatus === "Unverified" && !entry.state);
      return matchesSearch && matchesStatus;
    });
  }, [kycEntries, searchQuery, filterStatus]);

  const paginatedKycEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredKycEntries.slice(startIndex, endIndex);
  }, [filteredKycEntries, currentPage, itemsPerPage]);

  const totalItems = filteredKycEntries.length;

  // Calculate total pages dynamically
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Function to delete KYC entry
  const deleteKycEntry = async (_id, frontFilename = null, backFilename = null) => {
    if (!_id) {
      console.error("_id is required for a delete operation");
      addNotification("Invalid request: Missing _id", "error");
      return false;
    }

    try {
      setLoading(true);
      setSuccess(false);

      const response = await FetchWithAuth(
        `/kyc`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id, frontFilename, backFilename }),
          credentials: "include",
        },
        "Failed to delete KYC entry"
      );

      if (response.failed) {
        addNotification(response.message || "Delete operation failed", "error");
      } else {
        const { success, message } = response;
        if (success) {
          setSuccess(true);
          fetchKycEntries(); // Refresh KYC list after successful deletion
          addNotification(message || "KYC entry deleted successfully", "success");
        } else {
          addNotification("Delete operation was not successful", "error");
        }
      }
    } catch (err) {
      console.error("Error during delete operation:", err);
      addNotification("An error occurred while deleting the KYC entry", "error");
    } finally {
      setLoading(false);
    }
  };

  // Function to verify/unverify KYC entry
  const Verification = async (_id, state) => {
    if (!_id) {
      console.error("_id is required for a verification operation");
      addNotification("Invalid request: Missing _id", "error");
      return false;
    }

    try {
      setLoading(true);
      setSuccess(false);

      const response = await FetchWithAuth(
        `/kyc`,
        {
          method: "PUT",
          body: JSON.stringify({ _id, state }),
          credentials: "include",
        },
        `Failed to ${state} KYC entry`
      );

      if (response.failed) {
        addNotification(response.message || `${state} operation failed`, "error");
      } else {
        const { success, message } = response;
        if (success) {
          setSuccess(true);
          fetchKycEntries(); // Refresh KYC list after successful verification
          addNotification(message || `KYC entry updated successfully`, "success");
        } else {
          addNotification(`${state} operation was not successful`, "error");
        }
      }
    } catch (err) {
      console.error(`Error during ${state} operation:`, err);
      addNotification(`An error occurred while ${state}ing the KYC entry`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic rendering of entries
  const viewSingle = (entry = {}) => {
    navigate(`/app/manage-users/kyc/${encodeURIComponent(JSON.stringify(entry))}`);
  };

  return (
    <Card
      className='text-text-light w-full max-w-[96dvw] md:max-w-[95dvw] lg:max-w-[80dvw] rounded-md shadow-md mx-auto'
      variant='gradient'
      color='gray'>
      {/* Header Section */}
      <div className='flex flex-wrap justify-between items-center p-2 min-w-96'>
        <div>
          <h3 className='text-lg font-semibold'>KYC Table</h3>
          <p className='text-sm text-primary-light'>Overview of KYC entries.</p>
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
            value='Verified'
            checked={filterStatus === "Verified"}
            onChange={(e) => setFilterStatus(e.target.value)}
            className='text-primary-light focus:ring-primary-light'
          />
          <span className='text-sm capitalize'>Verified</span>
        </label>
        <label className='inline-flex items-center space-x-2'>
          <input
            type='radio'
            name='status-filter'
            value='Unverified'
            checked={filterStatus === "Unverified"}
            onChange={(e) => setFilterStatus(e.target.value)}
            className='text-primary-light focus:ring-primary-light'
          />
          <span className='text-sm capitalize'>Unverified</span>
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
                <th className='p-4'>Type</th>
                <th className='p-4'>State</th>
                <th className='p-4'>Created At</th>
                <th className='p-4'>Updated At</th>
                <th className='p-4'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedKycEntries.map((entry) => (
                <tr
                  key={entry._id}
                  className='border-b hover:bg-primary-dark'
                  onClick={() => viewSingle(entry)}>
                  <td className='p-4'>{entry.user}</td>
                  <td className='p-4'>{entry.type}</td>
                  <td className='p-4 capitalize'>{entry.state ? "Verified" : "Unverified"}</td>
                  <td className='p-4'>{formatToNewYorkTime(entry.createdAt)}</td>
                  <td className='p-4'>{formatToNewYorkTime(entry.updatedAt)}</td>
                  <td className='py-4 flex flex-row justify-items-start justify-between'>
                    {entry.state ? (
                      <XCircleIcon
                        title='Unverify'
                        className='h-5 w-5 text-error-light hover:scale-110 transition-all cursor-pointer mx-auto'
                        onClick={(e) => {
                          e.stopPropagation();
                          Verification(entry._id, "unverify");
                        }}
                      />
                    ) : (
                      <CheckBadgeIcon
                        title='Verify'
                        className='h-5 w-5 text-success-light hover:scale-110 transition-all cursor-pointer mx-auto'
                        onClick={(e) => {
                          e.stopPropagation();
                          Verification(entry._id, "verify");
                        }}
                      />
                    )}
                    <TrashIcon
                      className='h-5 w-5 text-error-dark hover:scale-110 transition-all cursor-pointer mx-auto'
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteKycEntry(entry._id, entry.frontFilename, entry.backFilename);
                      }}
                    />
                  </td>
                </tr>
              ))}
              {paginatedKycEntries.length === 0 && (
                <tr>
                  <td colSpan='6' className='p-4 text-center'>
                    No KYC entries found.
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

export default Kyc;
