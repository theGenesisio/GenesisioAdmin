import { PencilSquareIcon, UserIcon } from "@heroicons/react/24/solid";
import { WelcomeIllustration } from "../../../assets/utilities";
import useAuth from "../../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { Card } from "@material-tailwind/react";
const Welcome = () => {
  const { admin } = useAuth();
  const navigate = useNavigate();
  return (
    <Card className='dashboard-box flex flex-row relative !p-0' variant='gradient' color='gray'>
      <div className='w-2/3 p-4'>
        <h1 className='font-semibold text-2xl flex flex-col justify-start'>
          <UserIcon className='h-5 w-5' />
          {admin?.username || "Admin"}
        </h1>
        <button
          className='accent-btn w-3/4 mt-40 flex flex-row justify-evenly'
          onClick={() => navigate("/app/admins")}>
          Edit admins
          <PencilSquareIcon className='h-5 w-5' />
        </button>
      </div>
      <div className='w-1/3 relative'>
        <img
          src={WelcomeIllustration}
          alt='illustration'
          className='absolute bottom-0 right-0 object-contain w-full'
        />
      </div>
    </Card>
  );
};

export default Welcome;
