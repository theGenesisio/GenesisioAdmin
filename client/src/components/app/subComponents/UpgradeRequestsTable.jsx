/**
 * UpgradeRequestsTable component displays a table of upgradeRequest history with search, filter, and pagination functionalities.
 *
 * @component
 * @example
 * return (
 *   <UpgradeRequestsTable />
 * )
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @description
 * The UpgradeRequestsTable component fetches upgradeRequest data, allows searching by user email, filtering by upgradeRequest status, and paginating the results.
 * It also provides actions to update the status or delete an upgradeRequest.
 *
 * @function
 * @name UpgradeRequestsTable
 *
 * @requires useEffect
 * @requires useState
 * @requires useMemo
 * @requires FetchWithAuth
 * @requires useNotification
 * @requires formatToNewYorkTime
 * @requires BoltIcon
 * @requires BoltSlashIcon
 * @requires ClockIcon
 * @requires ExclamationCircleIcon
 * @requires MagnifyingGlassIcon
 * @requires TrashIcon
 * @requires Loader
 * @requires Card
 */
import { useEffect, useState, useMemo } from "react";
import FetchWithAuth from "../../auth/api";
import { useNotification } from "../../layout/NotificationHelper";
import { formatToNewYorkTime } from "../../../assets/helpers";
import {
  BoltIcon,
  ClockIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import Loader from "./Loader";
import { Card } from "@material-tailwind/react";

const UpgradeRequestsTable = () => {
  const { addNotification } = useNotification();
  const [upgradeRequestSearchQuery, setupgradeRequestSearchQuery] = useState("");
  const [upgradeRequestCurrentPage, setupgradeRequestCurrentPage] = useState(1);
  const [upgradeRequestItemsPerPage, setupgradeRequestItemsPerPage] = useState(15);
  const [loading, setLoading] = useState(false);
  const [upgradeRequests, setupgradeRequests] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");

  const updateItemsPerPage = () => {
    const width = window.innerWidth;
    if (width >= 1200) {
      setupgradeRequestItemsPerPage(15);
    } else if (width >= 768) {
      setupgradeRequestItemsPerPage(10);
    } else {
      setupgradeRequestItemsPerPage(10);
    }
  };

  useEffect(() => {
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const fetchupgradeRequestHistory = async () => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/upgrade`,
        {
          method: "GET",
          credentials: "include",
        },
        "Failed to fetch upgradeRequests"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { requests, message } = response;
        requests && setupgradeRequests(requests.reverse());
        addNotification(message);
      }
    } catch (err) {
      addNotification("An error occurred", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteupgradeRequest = async (id) => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/upgrade`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id: id }),
          credentials: "include",
        },
        "Failed to delete upgradeRequest"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          fetchupgradeRequestHistory();
        } else {
          addNotification("Upgrade request deletion was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while deleting the upgrade request", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const actionIcons = [
    { Icon: BoltIcon, status: "active", color: "text-success-light", title: "Activate" },
    { Icon: EnvelopeIcon, status: "mailed", color: "text-warning-light", title: "Mark as mailed" },
    { Icon: ExclamationCircleIcon, status: "failed", color: "text-error-light", title: "Decline" },
    { Icon: ClockIcon, status: "pending", color: "text-warning-dark", title: "Mark as Pending" },
    { Icon: TrashIcon, action: deleteupgradeRequest, color: "text-error-dark", title: "Delete" },
  ];

  const handleStatus = async (_id, status) => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/upgrade`,
        {
          method: "PUT",
          body: JSON.stringify({ status, _id }),
          credentials: "include",
        },
        "Failed to update upgrade request status"
      );

      if (response.failed) {
        const { message, failed } = response;
        addNotification(failed, "error");
        addNotification(message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          fetchupgradeRequestHistory();
        } else {
          addNotification("Update operation was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while updating the status", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchupgradeRequestHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredupgradeRequests = useMemo(() => {
    return upgradeRequests.filter((upgradeRequest) => {
      return (
        (!upgradeRequestSearchQuery ||
          upgradeRequest.user.email
            .toLowerCase()
            .includes(upgradeRequestSearchQuery.toLowerCase())) &&
        (selectedStatus === "all" || upgradeRequest.status === selectedStatus)
      );
    });
  }, [upgradeRequests, upgradeRequestSearchQuery, selectedStatus]);

  const paginatedupgradeRequests = useMemo(() => {
    const startIndex = (upgradeRequestCurrentPage - 1) * upgradeRequestItemsPerPage;
    const endIndex = startIndex + upgradeRequestItemsPerPage;
    return filteredupgradeRequests.slice(startIndex, endIndex);
  }, [filteredupgradeRequests, upgradeRequestCurrentPage, upgradeRequestItemsPerPage]);

  const upgradeRequestTotalItems = filteredupgradeRequests.length;
  const upgradeRequestTotalPages = Math.ceil(upgradeRequestTotalItems / upgradeRequestItemsPerPage);

  return (
    <Card
      className='text-text-light rounded-md shadow-md md:col-span-5 bg-primary-default'
      >
      <div className='p-4 flex flex-col md:flex-row justify-between'>
        <h2 className='text-lg font-semibold'>Upgrade Requests</h2>
        <div className='relative w-full max-w-sm md:ml-4 mt-2 md:mt-0'>
          <input
            type='text'
            placeholder='Search by user email'
            value={upgradeRequestSearchQuery}
            onChange={(e) => setupgradeRequestSearchQuery(e.target.value)}
            className='form-input w-full'
          />
          <MagnifyingGlassIcon className='w-4 h-4 absolute top-1/2 right-3 transform -translate-y-1/2 text-primary-light' />
        </div>
      </div>

      {/* Add the radio buttons for filtering by status */}
      <div className='flex space-x-4 p-4'>
        <label>
          <input
            type='radio'
            value='all'
            checked={selectedStatus === "all"}
            onChange={() => setSelectedStatus("all")}
            className='mr-2'
          />
          All
        </label>
        <label>
          <input
            type='radio'
            value='active'
            checked={selectedStatus === "active"}
            onChange={() => setSelectedStatus("active")}
            className='mr-2'
          />
          Active
        </label>
        <label>
          <input
            type='radio'
            value='expired'
            checked={selectedStatus === "expired"}
            onChange={() => setSelectedStatus("expired")}
            className='mr-2'
          />
          Expired
        </label>
        <label>
          <input
            type='radio'
            value='failed'
            checked={selectedStatus === "failed"}
            onChange={() => setSelectedStatus("failed")}
            className='mr-2'
          />
          Failed
        </label>
        <label>
          <input
            type='radio'
            value='pending'
            checked={selectedStatus === "pending"}
            onChange={() => setSelectedStatus("pending")}
            className='mr-2'
          />
          Pending
        </label>
      </div>

      <div className='overflow-x-auto'>
        {loading ? (
          <Loader />
        ) : (
          <table className='w-full text-left text-sm'>
            <thead className='bg-primary-dark'>
              <tr>
                <th className='p-4'>User</th>
                <th className='p-4'>Tier</th>
                <th className='p-4'>Last Updated</th>
                <th className='p-4'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedupgradeRequests.map((upgradeRequest) => (
                <tr key={upgradeRequest._id} className='border-b hover:bg-primary-dark'>
                  <td className='p-4 text-nowrap'>{upgradeRequest.user.email}</td>
                  <td className='p-4 text-nowrap'>{upgradeRequest.tier.name}</td>
                  <td className='p-4 min-w-[16rem]'>
                    {formatToNewYorkTime(upgradeRequest.updatedAt)}
                  </td>
                  <td className='py-4 flex flex-row min-w-[16rem] justify-items-start justify-between'>
                    {actionIcons
                      .filter(({ status }) => status !== upgradeRequest.status)
                      .map(({ Icon, status, action, color, title }) => (
                        <Icon
                          key={status || "delete"}
                          className={`h-5 w-5 hover:scale-110 transition-all cursor-pointer ${color} mx-auto`}
                          onClick={(e) => {
                            e.stopPropagation();
                            status
                              ? handleStatus(upgradeRequest._id, status)
                              : action(upgradeRequest._id);
                          }}
                          title={title}
                        />
                      ))}
                  </td>
                </tr>
              ))}
              {paginatedupgradeRequests.length === 0 && (
                <tr>
                  <td colSpan='4' className='p-4 text-center'>
                    No Upgrade Requests Found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <div className='flex justify-between items-center p-4 text-sm'>
        <p>
          Showing <b>{(upgradeRequestCurrentPage - 1) * upgradeRequestItemsPerPage + 1}</b>-
          <b>
            {Math.min(
              upgradeRequestCurrentPage * upgradeRequestItemsPerPage,
              upgradeRequestTotalItems
            )}
          </b>{" "}
          of <b>{upgradeRequestTotalItems}</b>
        </p>
        <div className='flex space-x-2'>
          <button
            onClick={() => setupgradeRequestCurrentPage((prev) => Math.max(prev - 1, 1))}
            className='px-3 py-1 text-sm bg-transparent border rounded hover:bg-gray-200'
            disabled={upgradeRequestCurrentPage === 1}>
            Prev
          </button>
          {[...Array(upgradeRequestTotalPages).keys()].map((page) => (
            <button
              key={page + 1}
              onClick={() => setupgradeRequestCurrentPage(page + 1)}
              className={`px-3 py-1 text-sm border rounded ${
                upgradeRequestCurrentPage === page + 1
                  ? "text-white bg-primary-light"
                  : "bg-transparent hover:bg-gray-200"
              }`}>
              {page + 1}
            </button>
          ))}
          <button
            onClick={() =>
              setupgradeRequestCurrentPage((prev) => Math.min(prev + 1, upgradeRequestTotalPages))
            }
            className='px-3 py-1 text-sm bg-transparent border rounded hover:bg-gray-200'
            disabled={upgradeRequestCurrentPage === upgradeRequestTotalPages}>
            Next
          </button>
        </div>
      </div>
    </Card>
  );
};

export default UpgradeRequestsTable;
