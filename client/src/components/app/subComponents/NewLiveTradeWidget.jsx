import { Card, CardBody, Typography } from "@material-tailwind/react";
import {
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FetchWithAuth from "../../auth/api";
import Loader from "./Loader";
import useAuth from "../../auth/useAuth";
import { liveTradeIcon } from "../../assets/icons";
import { formatToNewYorkTime } from "../../../assets/helpers";
const LatestLiveTrade = () => {
  const { admin } = useAuth();
  const [livetrades, setLivetrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await FetchWithAuth(
          `/dashboard-widget/latest-live-trades?limit=3&date=${new Date(admin?.lastSeen)}`,
          {
            method: "GET",
            credentials: "include",
          },
          "Failed to fetch live trade data"
        );

        if (response.failed) {
          console.error(response.message);
        }
        const { success, message, data } = response;
        if (success) {
          setLivetrades(data.reverse());
        } else {
          console.error(message);
        }
      } catch (error) {
        console.error("Error fetching live trade data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [admin.lastSeen]); // Empty dependency array to run only on mount
  const actionIcons = [
    { Icon: BoltIcon, status: "active", color: "text-warning-light", title: "Active" },
    { Icon: CheckCircleIcon, status: "completed", color: "text-success-light", title: "Completed" },
    {
      Icon: ExclamationCircleIcon,
      status: "canceled",
      color: "text-error-light",
      title: "Canceled",
    },
  ];
  return (
    <Card className='dashboard-box flex flex-col h-full' variant='gradient' color='gray'>
      <CardBody className='p-0'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col'>
            <span className='h-3 w-5 mb-2 scale-125'>{liveTradeIcon}</span>
            <p className='text-lg font-semibold text-text-light'>Latest Live Trades</p>
          </div>
          <ArrowTopRightOnSquareIcon
            className='h5 w-5'
            title='View all live trades'
            onClick={() => navigate("/app/trade")}
          />
        </div>
        <div className='divide-y divide-primary-light'>
          {loading ? (
            <Loader />
          ) : livetrades.length > 0 ? (
            livetrades.map(({ entryPrice, status, createdAt, _id }) => (
              <div key={_id} className='flex items-center justify-between pb-3 pt-3 last:pb-0'>
                <div className='flex items-center gap-x-3'>
                  <div>
                    <Typography className='text-text-light' variant='h6'>
                      ${parseFloat(entryPrice).toLocaleString()}
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
            <p className='flex items-center justify-between py-3'>No Live trades found.</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default LatestLiveTrade;
