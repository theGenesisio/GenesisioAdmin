/**
 * InvestmentTable component displays a table of investment history with search, filter, and pagination functionalities.
 *
 * @component
 * @example
 * return (
 *   <InvestmentTable />
 * )
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @description
 * The InvestmentTable component fetches investment data, allows searching by user email, filtering by investment status, and paginating the results.
 * It also provides actions to update the status or delete an investment.
 *
 * @function
 * @name InvestmentTable
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
  BoltSlashIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import Loader from "./Loader";
import { Card } from "@material-tailwind/react";

const InvestmentTable = () => {
  const { addNotification } = useNotification();
  const [investmentSearchQuery, setInvestmentSearchQuery] = useState("");
  const [investmentCurrentPage, setInvestmentCurrentPage] = useState(1);
  const [investmentItemsPerPage, setInvestmentItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [investments, setInvestments] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");

  const updateItemsPerPage = () => {
    const width = window.innerWidth;
    if (width >= 1200) {
      setInvestmentItemsPerPage(10);
    } else if (width >= 768) {
      setInvestmentItemsPerPage(10);
    } else {
      setInvestmentItemsPerPage(10);
    }
  };

  useEffect(() => {
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const fetchInvestmentHistory = async () => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/investments`,
        {
          method: "GET",
          credentials: "include",
        },
        "Failed to fetch investments"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { investments, message } = response;
        investments && setInvestments(investments.reverse());
        addNotification(message);
      }
    } catch (err) {
      addNotification("An error occurred", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteInvestment = async (id) => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/investments`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id: id }),
          credentials: "include",
        },
        "Failed to delete investment"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          fetchInvestmentHistory();
        } else {
          addNotification("Investment deletion was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while deleting the investment", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const actionIcons = [
    { Icon: BoltIcon, status: "active", color: "text-success-light", title: "Activate" },
    { Icon: BoltSlashIcon, status: "expired", color: "text-warning-light", title: "Expire" },
    { Icon: ExclamationCircleIcon, status: "failed", color: "text-error-light", title: "Fail" },
    { Icon: ClockIcon, status: "pending", color: "text-warning-dark", title: "Pending" },
    { Icon: TrashIcon, action: deleteInvestment, color: "text-error-dark", title: "Delete" },
  ];

  const handleStatus = async (_id, status) => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/investments`,
        {
          method: "PUT",
          body: JSON.stringify({ status, _id }),
          credentials: "include",
        },
        "Failed to update investment status"
      );

      if (response.failed) {
        const { message, failed } = response;
        addNotification(failed, "error");
        addNotification(message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          fetchInvestmentHistory();
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
    fetchInvestmentHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredInvestments = useMemo(() => {
    return investments.filter((investment) => {
      return (
        (!investmentSearchQuery ||
          investment.user.email.toLowerCase().includes(investmentSearchQuery.toLowerCase())) &&
        (selectedStatus === "all" || investment.status === selectedStatus)
      );
    });
  }, [investments, investmentSearchQuery, selectedStatus]);

  const paginatedInvestments = useMemo(() => {
    const startIndex = (investmentCurrentPage - 1) * investmentItemsPerPage;
    const endIndex = startIndex + investmentItemsPerPage;
    return filteredInvestments.slice(startIndex, endIndex);
  }, [filteredInvestments, investmentCurrentPage, investmentItemsPerPage]);

  const investmentTotalItems = filteredInvestments.length;
  const investmentTotalPages = Math.ceil(investmentTotalItems / investmentItemsPerPage);

  return (
    <Card
      className='text-text-light rounded-md shadow-md md:col-span-5'
      variant='gradient'
      color='gray'>
      <div className='p-4 flex flex-col md:flex-row justify-between'>
        <h2 className='text-lg font-semibold'>Investment History</h2>
        <div className='relative w-full max-w-sm md:ml-4 mt-2 md:mt-0'>
          <input
            type='text'
            placeholder='Search by user email'
            value={investmentSearchQuery}
            onChange={(e) => setInvestmentSearchQuery(e.target.value)}
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
            <thead className='bg-primary-mild'>
              <tr>
                <th className='p-4'>User</th>
                <th className='p-4'>Plan</th>
                <th className='p-4 text-nowrap'>Amount ($)</th>
                <th className='p-4 text-nowrap'>Min ($)</th>
                <th className='p-4 text-nowrap'>Max ($)</th>
                <th className='p-4 text-nowrap'>ROI Percentage (%)</th>
                <th className='p-4'>Duration</th>
                <th className='p-4'>Start date</th>
                <th className='p-4'>Expiry date</th>
                <th className='p-4'>Last Updated</th>
                <th className='p-4'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvestments.map((investment) => (
                <tr key={investment._id} className='border-b hover:bg-primary-dark'>
                  <td className='p-4 text-nowrap'>{investment.user.email}</td>
                  <td className='p-4 text-nowrap'>{investment.plan.name}</td>
                  <td className='p-4'>{parseFloat(investment.amount).toLocaleString()}</td>
                  <td className='p-4'>{parseFloat(investment.plan.limits.min).toLocaleString()}</td>
                  <td className='p-4'>{parseFloat(investment.plan.limits.max).toLocaleString()}</td>
                  <td className='p-4'>{investment.plan.ROIPercentage}</td>
                  <td className='p-4'>{investment.plan.duration}</td>
                  <td className='p-4 min-w-[16rem]'>
                    {formatToNewYorkTime(investment.startDate) || "_"}
                  </td>
                  <td className='p-4 min-w-[16rem]'>
                    {formatToNewYorkTime(investment.expiryDate) || "_"}
                  </td>
                  <td className='p-4 min-w-[16rem]'>{formatToNewYorkTime(investment.updatedAt)}</td>
                  <td className='py-4 flex flex-row min-w-[16rem] justify-items-start justify-between'>
                    {actionIcons
                      .filter(({ status }) => status !== investment.status)
                      .map(({ Icon, status, action, color, title }) => (
                        <Icon
                          key={status || "delete"}
                          className={`h-5 w-5 hover:scale-110 transition-all cursor-pointer ${color} mx-auto`}
                          onClick={(e) => {
                            e.stopPropagation();
                            status ? handleStatus(investment._id, status) : action(investment._id);
                          }}
                          title={title}
                        />
                      ))}
                  </td>
                </tr>
              ))}
              {paginatedInvestments.length === 0 && (
                <tr>
                  <td colSpan='11' className='p-4 text-center'>
                    No investments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <div className='flex justify-between items-center p-4 text-sm'>
        <p>
          Showing <b>{(investmentCurrentPage - 1) * investmentItemsPerPage + 1}</b>-
          <b>{Math.min(investmentCurrentPage * investmentItemsPerPage, investmentTotalItems)}</b> of{" "}
          <b>{investmentTotalItems}</b>
        </p>
        <div className='flex space-x-2'>
          <button
            onClick={() => setInvestmentCurrentPage((prev) => Math.max(prev - 1, 1))}
            className='px-3 py-1 text-sm bg-transparent border rounded hover:bg-gray-200'
            disabled={investmentCurrentPage === 1}>
            Prev
          </button>
          {[...Array(investmentTotalPages).keys()].map((page) => (
            <button
              key={page + 1}
              onClick={() => setInvestmentCurrentPage(page + 1)}
              className={`px-3 py-1 text-sm border rounded ${
                investmentCurrentPage === page + 1
                  ? "text-white bg-primary-light"
                  : "bg-transparent hover:bg-gray-200"
              }`}>
              {page + 1}
            </button>
          ))}
          <button
            onClick={() =>
              setInvestmentCurrentPage((prev) => Math.min(prev + 1, investmentTotalPages))
            }
            className='px-3 py-1 text-sm bg-transparent border rounded hover:bg-gray-200'
            disabled={investmentCurrentPage === investmentTotalPages}>
            Next
          </button>
        </div>
      </div>
    </Card>
  );
};

export default InvestmentTable;
