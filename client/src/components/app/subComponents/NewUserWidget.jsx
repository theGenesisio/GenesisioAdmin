import { Card, CardBody, Typography } from "@material-tailwind/react";
import { ArrowTopRightOnSquareIcon, UserIcon, UsersIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../auth/useAuth";
import Loader from "./Loader";
import FetchWithAuth from "../../auth/api";

const LatestUsersWidget = () => {
  const { admin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await FetchWithAuth(
          `/dashboard-widget/latest-users?limit=5&date=${new Date(admin?.lastSeen)}`,
          {
            method: "GET",
            credentials: "include",
          },
          "Failed to fetch latest users"
        );

        if (response.failed) {
          console.error(response.message);
        }
        const { success, message, data } = response;
        if (success) {
          setUsers(data.reverse());
        } else {
          console.error(message);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [admin.lastSeen]); // Empty dependency array to run only on mount

  return (
    <Card className='dashboard-box flex flex-col h-full' variant='gradient' color='gray'>
      <CardBody className='p-0'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col'>
            <UsersIcon className='h-5 w-5' />
            <p className='text-lg font-semibold text-text-light'>New Users</p>
          </div>
          <ArrowTopRightOnSquareIcon
            className='h-5 w-5'
            title='View all users'
            onClick={() => navigate("/app/users")}
          />
        </div>
        <div className='divide-y divide-primary-light'>
          {loading ? (
            <Loader />
          ) : users.length > 0 ? (
            users.map(({ fullName, email, _id }) => (
              <div key={_id} className='flex items-center justify-between pb-3 pt-3 last:pb-0'>
                <div className='flex items-center gap-x-3'>
                  <UserIcon className='h-5 w-5' />
                  <div className='flex flex-row justify-between w-full'>
                    <div>
                      <Typography className='text-text-light' variant='h6'>
                        {fullName}
                      </Typography>
                      <Typography variant='small' color='gray'>
                        {email}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className='flex items-center justify-between py-3'>No users found.</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default LatestUsersWidget;
