import FetchWithAuth from "../auth/api";
import { Card } from "@material-tailwind/react";
import { useState, useEffect } from "react";
import { useNotification } from "../layout/NotificationHelper";
import Loader from "./subComponents/Loader.jsx";
const Signal = () => {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [userDetails, setuserDetails] = useState("");
  const [users, setUsers] = useState([]);
  const [signal, setsignal] = useState(0);
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
  // Fetch signal records on component mount
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await FetchWithAuth(
        "/signal",
        {
          method: "PUT",
          body: JSON.stringify({ userDetails, signal }),
          credentials: "include",
        },
        "Failed to set signal"
      );

      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { message } = response;
        addNotification(message, "success");
        // Reset form fields
        setuserDetails("");
        setsignal;
        fetchUsers(); // Refresh user
      }
    } catch (err) {
      console.error("Error during setting signal:", err);
      addNotification("An error occurred while setting signal", "error");
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
        <h2 className='text-lg font-semibold mb-2'>Set Signal</h2>
        <form className='flex flex-col space-y-2' onSubmit={handleSubmit}>
          {loading ? (
            <Loader />
          ) : (
            <div>
              <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='client'>
                Client
              </label>
              <select
                className='form-input w-full'
                value={JSON.stringify(userDetails)} // Ensure it's always a string
                onChange={(e) => setuserDetails(JSON.parse(e.target.value))} // Convert back to object
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
            </div>
          )}
          <div>
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='signal'>
              Signal
            </label>
            <input
              type='number'
              className='form-input w-full'
              value={signal}
              onChange={(e) => setsignal(e.target.value)}
              id='signal'
              placeholder='0'
              required
            />
          </div>
          <button
            type='submit'
            className='accent-btn w-full'
            disabled={loading || isNaN(signal) || signal === 0}>
            {loading ? "Processing..." : "Set Signal"}
          </button>
        </form>
      </Card>
    </main>
  );
};

export default Signal;
