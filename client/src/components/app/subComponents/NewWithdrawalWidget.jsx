import { Card, CardBody, Typography } from "@material-tailwind/react";
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FetchWithAuth from "../../auth/api";
import Loader from "./Loader";
import { formatToNewYorkTime } from "../../../assets/helpers";

const LatestWithdrawalRequests = () => {
  const [withdrawalRequests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await FetchWithAuth(
          `/dashboard-widget/latest-withdrawalRequests?limit=5&date=${new Date().toISOString()}`,
          {
            method: "GET",
            credentials: "include",
          },
          "Failed to fetch withdrawal requests"
        );

        if (response.failed) {
          console.error(response.message);
        }
        const { success, message, data } = response;
        if (success) {
          setRequests(data.reverse());
        } else {
          console.error(message);
        }
      } catch (error) {
        console.error("Error fetching withdrawal requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array to run only on mount

  return (
    <Card className='dashboard-box flex flex-col h-full' variant='gradient' color='gray'>
      <CardBody className='p-0'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col'>
            <DocumentTextIcon className='h-5 w-5' />
            <p className='text-lg font-semibold text-text-light'>Latest Withdrawal Requests</p>
          </div>
          <ArrowTopRightOnSquareIcon
            className='h5 w-5'
            title='View all withdrawals'
            onClick={() => navigate("/app/withdrawals")}
          />
        </div>
        <div className='divide-y divide-primary-light'>
          {loading ? (
            <Loader />
          ) : withdrawalRequests.length > 0 ? (
            withdrawalRequests.map(({ amount, status, createdAt, _id }) => (
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
                  {status === "completed" ? (
                    <CheckCircleIcon
                      className='h-5 w-5 hover:scale-110 transition-all cursor-help text-success-light'
                      title='Complete'
                    />
                  ) : status === "pending" ? (
                    <ClockIcon
                      className='h-5 w-5 hover:scale-110 transition-all cursor-help text-warning-dark'
                      title='Pending'
                    />
                  ) : status === "failed" ? (
                    <XCircleIcon
                      className='h-5 w-5 hover:scale-110 transition-all cursor-help text-error-light'
                      title='Failed'
                    />
                  ) : null}
                </Typography>
              </div>
            ))
          ) : (
            <p className='flex items-center justify-between py-3'>No withdrawal requests found.</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default LatestWithdrawalRequests;
