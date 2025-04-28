import { Card, CardBody, Typography } from "@material-tailwind/react";
import {
  ArrowTopRightOnSquareIcon,
  CheckBadgeIcon,
  IdentificationIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FetchWithAuth from "../../auth/api";
import Loader from "./Loader";
import useAuth from "../../auth/useAuth";
import { formatToNewYorkTime } from "../../../assets/helpers";

const LatestKYC = () => {
  const { admin } = useAuth();
  const [kycList, setKYCList] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchKYCData = async () => {
      try {
        setLoading(true);
        const response = await FetchWithAuth(
          `/dashboard-widget/latest-kyc?limit=3&date=${new Date(admin?.lastSeen)}`,
          {
            method: "GET",
            credentials: "include",
          },
          "Failed to fetch KYC data"
        );

        if (response.failed) {
          console.error(response.message);
        }
        const { success, message, data } = response;
        if (success) {
          setKYCList(data.reverse());
        } else {
          console.error(message);
        }
      } catch (error) {
        console.error("Error fetching KYC data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKYCData();
  }, [admin.lastSeen]); // Empty dependency array to run only on mount

  return (
    <Card className='dashboard-box flex flex-col h-full' variant='gradient' color='gray'>
      <CardBody className='p-0'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col'>
            <IdentificationIcon className='h-5 w-5' />
            <p className='text-lg font-semibold text-text-light'>New KYC(s)</p>
          </div>
          <ArrowTopRightOnSquareIcon
            className='h5 w-5'
            title='View all KYC(s)'
            onClick={() => navigate("/app/kyc")}
          />
        </div>
        <div className='divide-y divide-primary-light'>
          {loading ? (
            <Loader />
          ) : kycList.length > 0 ? (
            kycList.map(({ type, state, updatedAt }, index) => (
              <div key={index} className='flex items-center justify-between pb-3 pt-3 last:pb-0'>
                <div className='flex items-center gap-x-3'>
                  <div>
                    <Typography className='text-text-light' variant='h6'>
                      {type}
                    </Typography>
                    <Typography variant='small' color='gray'>
                      {formatToNewYorkTime(updatedAt)}
                    </Typography>
                  </div>
                </div>
                <Typography className='text-text-light' variant='h6'>
                  {state ? (
                    <span>
                      Verified{" "}
                      <CheckBadgeIcon className='inline-block w-5 h-5 align-top text-success-light' />
                    </span>
                  ) : (
                    <span>
                      Unverified{" "}
                      <XCircleIcon className='inline-block w-5 h-5 align-top text-error-light' />
                    </span>
                  )}
                </Typography>
              </div>
            ))
          ) : (
            <p className='flex items-center justify-between py-3'>No KYC records found.</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default LatestKYC;
