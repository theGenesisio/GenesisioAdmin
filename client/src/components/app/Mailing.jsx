/**
 * Mailing component for sending emails to specified targets.
 *
 * @component
 * @example
 * return (
 *   <Mailing />
 * )
 *
 * @returns {JSX.Element} The Mailing component.
 *
 * @description
 * This component provides a form for sending emails to specified targets. It includes fields for the subject, header, message, and targets (comma-separated email addresses). It also displays insights about the mailing process, such as the number of invalid targets, matched targets, successful emails, and failed emails.
 *
 * @function
 * @name Mailing
 *
 * @requires useState - React hook for managing state.
 * @requires useNotification - Custom hook for displaying mailLogs.
 * @requires FetchWithAuth - Custom function for making authenticated API requests.
 * @requires Card - Material Tailwind component for displaying content in a card layout.
 */
import { useEffect, useMemo, useState } from "react";
import { useNotification } from "../layout/NotificationHelper";
import FetchWithAuth from "../auth/api";
import { Card } from "@material-tailwind/react";
import { formatToNewYorkTime } from "../../assets/helpers";
import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import Loader from "./subComponents/Loader";

const Mailing = () => {
  const { addNotification } = useNotification();
  // Start with one paragraph
  const [message, setMessage] = useState([""]);
  const [subject, setSubject] = useState("");
  const [header, setHeader] = useState("");
  const [targets, setTargets] = useState("");
  const [loading, setLoading] = useState(false);
  const [invalidTargetsCount, setInvalidTargetsCount] = useState(0);
  const [matchedTargetsCount, setMatchedTargetsCount] = useState(0);
  const [successfulEmails, setSuccessfulEmails] = useState([]);
  const [failedEmails, setFailedEmails] = useState([]);
  const [mailLogs, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const handleParagraphChange = (index, value) => {
    // Update a specific paragraph while preserving the others
    const updatedMessages = [...message];
    updatedMessages[index] = value;
    setMessage(updatedMessages);
  };

  const addParagraph = () => {
    // Append an empty paragraph
    setMessage((prev) => [...prev, ""]);
  };
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
  const handleMailing = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await FetchWithAuth(
        `/mailing`,
        {
          method: "POST",
          body: JSON.stringify({
            message: message,
            subject: subject,
            header: header,
            targets: targets.split(",").map((email) => email.trim()),
          }),
          credentials: "include",
        },
        "Failed to send mail(s)"
      );

      if (response.success) {
        const { message, invalidTargets, matchedTargets, successfulEmails, failedEmails } =
          response;

        addNotification(message, "success");
        setMessage("");
        setSubject("");
        setHeader("");
        setTargets("");
        setInvalidTargetsCount(parseFloat(invalidTargets));
        setMatchedTargetsCount(matchedTargets);
        setSuccessfulEmails(successfulEmails);
        setFailedEmails(failedEmails);
      } else if (!response.success) {
        const { invalidTargets, matchedTargets, successfulEmails, failedEmails } = response;
        addNotification("Mailing operation complete without errors but not successful");
        setInvalidTargetsCount(parseFloat(invalidTargets));
        setMatchedTargetsCount(matchedTargets);
        setSuccessfulEmails(successfulEmails);
        setFailedEmails(failedEmails);
      } else {
        addNotification("Mailing was not successful", "error");
      }
    } catch (err) {
      addNotification("An error occurred while sending the mail(s)", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  const fetchMailLog = async () => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/mailing`,
        {
          method: "GET",
          credentials: "include",
        },
        "Failed to fetch mail logs"
      );
      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { mailLog, message } = response;
        mailLog && setNotifications(mailLog.reverse());
        addNotification(message);
      }
    } catch (err) {
      addNotification("An error occurred", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMailLog = async (id) => {
    try {
      setLoading(true);
      const response = await FetchWithAuth(
        `/mailing`,
        {
          method: "DELETE",
          body: JSON.stringify({ _id: id }),
          credentials: "include",
        },
        "Failed to delete mailLog"
      );
      if (response.failed) {
        addNotification(response.failed, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          fetchMailLog(); // Refresh mail logs
        } else {
          addNotification("Mail log deletion was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while deleting the mail log", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMailLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMailLogs = useMemo(() => {
    return mailLogs.filter((mailLog) => {
      return !searchQuery || mailLog.subject.includes(searchQuery);
    });
  }, [mailLogs, searchQuery]);

  const paginatedMailLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMailLogs.slice(startIndex, endIndex);
  }, [filteredMailLogs, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredMailLogs.length / itemsPerPage);
  }, [filteredMailLogs.length, itemsPerPage]);

  useEffect(() => {
    setTotalItems(filteredMailLogs.length); // Track total items
  }, [filteredMailLogs]);
  return (
    <main className='grid md:grid-cols-6 grid-cols-1 gap-4'>
      <Card
        className='profile-box flex flex-col space-y-4 col-span-1 md:col-span-2'
        variant='gradient'
        color='gray'>
        <h2 className='text-lg font-semibold mb-2'>Send Mail(s)</h2>
        <form onSubmit={handleMailing} className='flex flex-col space-y-2'>
          <div>
            <label htmlFor='subject' className='block text-sm font-semibold text-text-light mb-1'>
              Subject
            </label>
            <input
              type='text'
              className='form-input w-full'
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              id='subject'
              required
            />
          </div>
          <div>
            <label htmlFor='header' className='block text-sm font-semibold text-text-light mb-1'>
              Header
            </label>
            <input
              type='text'
              className='form-input w-full'
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              id='header'
              required
            />
          </div>
          <div>
            <label htmlFor='message' className='block text-sm font-semibold text-text-light mb-1'>
              Message
            </label>
            {message &&
              message.map((paragraph, index) => (
                <textarea
                  key={index}
                  className='form-input w-full mb-2'
                  value={paragraph}
                  rows='3'
                  onChange={(e) => handleParagraphChange(index, e.target.value)}
                  placeholder={`Paragraph ${index + 1}`}
                  required={index === 0} // require at least the first paragraph
                />
              ))}
            <button type='button' onClick={addParagraph} className='primary-btn w-full'>
              + Add Paragraph
            </button>
          </div>
          <div>
            <label htmlFor='targets' className='block text-sm font-semibold text-text-light mb-1'>
              Targets (comma-separated email addresses)
            </label>
            <textarea
              className='form-input w-full'
              value={targets}
              onChange={(e) => setTargets(e.target.value)}
              id='targets'
              rows='2'
              placeholder="Enter comma-separated email addresses or '*' for all users"
            />
          </div>
          <button type='submit' className='accent-btn w-full' disabled={loading}>
            {loading ? "Sending..." : "Send mail"}
          </button>
        </form>
        <div className='mt-4'>
          <h3 className='text-sm font-semibold'>Mailing Insights:</h3>
          <div className='flex flex-col sm:flex-row justify-between text-sm'>
            <p>Invalid Targets: {invalidTargetsCount}</p>
            <p>Matched Targets: {matchedTargetsCount}</p>
          </div>
          <p className='text-sm'>Successful Emails:</p>
          <ul className='text-sm list-disc ml-4'>
            {successfulEmails.map((email, index) => (
              <li key={index}>{email}</li>
            ))}
          </ul>
          <p className='text-sm'>Failed Emails:</p>
          <ul className='text-sm list-disc ml-4'>
            {failedEmails.map((entry, index) => (
              <li key={index}>
                {entry.email} - {entry.error}
              </li>
            ))}
          </ul>
        </div>
      </Card>
      <Card
        className='bg-primary-default text-text-light rounded-md shadow-md md:col-span-4'
        variant='gradient'
        color='gray'>
        <div className='p-4 flex flex-col md:flex-row justify-between'>
          <h2 className='text-lg font-semibold'>Mailing History</h2>
          <div className='relative w-full max-w-sm md:ml-4 mt-2 md:mt-0'>
            <input
              type='text'
              placeholder='Search by mail subject'
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
                  <th className='p-4 min-w-[16rem]'>Subject</th>
                  <th className='p-4 min-w-[16rem]'>Header</th>
                  <th className='p-4 min-w-[16rem]'>Message</th>
                  <th className='p-4'>Success</th>
                  <th className='p-4 min-w-[16rem]'>Successful emails</th>
                  <th className='p-4'>All users</th>
                  <th className='p-4 min-w-[16rem]'>Original Targets</th>
                  <th className='p-4 min-w-[16rem]'>Valid Targets</th>
                  <th className='p-4 min-w-[16rem]'>Matched Targets</th>
                  <th className='p-4 min-w-[16rem]'>Invalid Targets</th>
                  <th className='p-4 min-w-[16rem]'>Failed emails</th>
                  <th className='p-4 min-w-[16rem]'>Creation Date</th>
                  <th className='p-4'>Delete</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMailLogs.map((mailLog) => (
                  <tr key={mailLog._id} className='border-b hover:bg-primary-dark'>
                    <td className='p-4 min-w-[16rem]'>{mailLog.subject}</td>
                    <td className='p-4 capitalize'>{mailLog.header}</td>
                    <td className='p-4 min-w-[16rem]'>{mailLog.message[0] || mailLog.message}</td>
                    <td className='p-4'>
                      {mailLog.success ? (
                        <CheckCircleIcon
                          title='Successful'
                          className='h-5 w-5 hover:scale-110 transition-all cursor-help text-success-light'
                        />
                      ) : (
                        <XCircleIcon
                          title='Failed'
                          className='h-5 w-5 hover:scale-110 transition-all cursor-help text-error-light'
                        />
                      )}
                    </td>
                    <td className='p-4 min-w-[16rem]'>
                      {mailLog.successfulEmails.length === 0
                        ? 0
                        : mailLog.successfulEmails.length < 6
                        ? Array.isArray(mailLog.successfulEmails)
                          ? mailLog.successfulEmails.join(", ")
                          : mailLog.successfulEmails
                        : mailLog.successfulEmails.length}
                    </td>
                    <td className='p-4'>{mailLog.allUsers ? "TRUE" : "FALSE"}</td>
                    <td className='p-4 min-w-[16rem]'>
                      {mailLog.originalTargets.length === 0
                        ? 0
                        : mailLog.originalTargets.length < 6
                        ? Array.isArray(mailLog.originalTargets)
                          ? mailLog.originalTargets.join(", ")
                          : mailLog.originalTargets
                        : mailLog.originalTargets.length}
                    </td>

                    <td className='p-4 min-w-[16rem]'>
                      {mailLog.validTargets.length === 0
                        ? 0
                        : mailLog.validTargets.length < 6
                        ? Array.isArray(mailLog.validTargets)
                          ? mailLog.validTargets.join(", ")
                          : mailLog.validTargets
                        : mailLog.validTargets.length}
                    </td>

                    <td className='p-4 min-w-[16rem]'>
                      {mailLog.matchedTargets.length === 0
                        ? 0
                        : mailLog.matchedTargets.length < 6
                        ? Array.isArray(mailLog.matchedTargets)
                          ? mailLog.matchedTargets.join(", ")
                          : mailLog.matchedTargets
                        : mailLog.matchedTargets.length}
                    </td>

                    <td className='p-4 min-w-[16rem]'>
                      {mailLog.invalidTargets.length === 0
                        ? 0
                        : mailLog.invalidTargets.length < 6
                        ? Array.isArray(mailLog.invalidTargets)
                          ? mailLog.invalidTargets.join(", ")
                          : mailLog.invalidTargets
                        : mailLog.invalidTargets.length}
                    </td>

                    <td className='p-4 min-w-[16rem]'>
                      {mailLog.failedEmails.length === 0
                        ? 0
                        : mailLog.failedEmails.length < 6
                        ? Array.isArray(mailLog.failedEmails)
                          ? mailLog.failedEmails.join(", ")
                          : mailLog.failedEmails
                        : mailLog.failedEmails.length}
                    </td>
                    <td className='p-4 min-w-[16rem]'>{formatToNewYorkTime(mailLog.createdAt)}</td>
                    <td className='p-4'>
                      <TrashIcon
                        title='Clear filters'
                        className='h-5 w-5 hover:scale-110 transition-all cursor-pointer text-error-dark  mx-auto'
                        onClick={() => deleteMailLog(mailLog._id)}
                      />
                    </td>
                  </tr>
                ))}
                {paginatedMailLogs.length === 0 && (
                  <tr>
                    <td colSpan='12' className='p-4 text-center'>
                      No mailLogs found.
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

export default Mailing;
