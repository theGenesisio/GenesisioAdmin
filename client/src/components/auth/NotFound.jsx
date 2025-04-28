import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-400'>
      <div className='text-center'>
        <h1 className='text-9xl font-semibold'>404</h1>
        <hr className='w-full mx-auto my-4 border-gray-700' />
        <p className='text-xl'>NOT FOUND</p>
      </div>
      <div onClick={() => navigate(-1)} className='cursor-pointer'>
        <p className='text-l mt-2'>Go Back</p>
      </div>
    </div>
  );
};

export default NotFound;
