import { Card, CardBody, Typography } from "@material-tailwind/react";
import {
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  BoltSlashIcon,
  ClockIcon,
  CubeIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FetchWithAuth from "../../auth/api";
import Loader from "./Loader";
import useAuth from "../../auth/useAuth";
import { formatToNewYorkTime } from "../../../assets/helpers";

const LatestInvestments = () => {
  const { admin } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await FetchWithAuth(
          `/dashboard-widget/latest-investments?limit=3&date=${new Date(admin?.lastSeen)}`,
          {
            method: "GET",
            credentials: "include",
          },
          "Failed to fetch investments data"
        );

        if (response.failed) {
          console.error(response.message);
        }
        const { success, message, data } = response;
        if (success) {
          setInvestments(data.reverse());
        } else {
          console.error(message);
        }
      } catch (error) {
        console.error("Error fetching investments data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [admin.lastSeen]); // Empty dependency array to run only on mount
  const actionIcons = [
    { Icon: BoltIcon, status: "active", color: "text-success-light", title: "Activate" },
    { Icon: BoltSlashIcon, status: "expired", color: "text-warning-light", title: "Expire" },
    { Icon: ExclamationCircleIcon, status: "failed", color: "text-error-light", title: "Fail" },
    { Icon: ClockIcon, status: "pending", color: "text-warning-dark", title: "Pending" },
  ];
  return (
    <Card className='dashboard-box flex flex-col h-full' variant='gradient' color='gray'>
      <CardBody className='p-0'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col'>
            <CubeIcon className='h-5 w-5' />
            <p className='text-lg font-semibold text-text-light'>Latest Investment Requests</p>
          </div>
          <ArrowTopRightOnSquareIcon
            className='h5 w-5'
            title='View all investments'
            onClick={() => navigate("/app/plans")}
          />
        </div>
        <div className='divide-y divide-primary-light'>
          {loading ? (
            <Loader />
          ) : investments.length > 0 ? (
            investments.map(({ amount, status, createdAt, _id }) => (
              <div key={_id} className='flex items-center justify-between pb-3 pt-3 last:pb-0'>
                <div className='flex items-center gap-x-3'>
                  <div>
                    <Typography className='text-text-light' variant='h6'>
                      ${parseFloat(amount).toLocaleString()}
                    </Typography>
                    <Typography variant='small' color='gray'>
                      {formatToNewYorkTime(createdAt)}
                    </Typography>
                  </div>
                </div>
                <Typography className='text-text-light' variant='h6'>
                  {actionIcons.map(({ Icon, status: iconStatus, color, title }) =>
                    status === iconStatus ? (
                      <Icon
                        key={iconStatus}
                        className={`h-5 w-5 hover:scale-110 transition-all cursor-help ${color}`}
                        title={title}
                      />
                    ) : null
                  )}
                </Typography>
              </div>
            ))
          ) : (
            <p className='flex items-center justify-between py-3'>No investments entries found.</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default LatestInvestments;
