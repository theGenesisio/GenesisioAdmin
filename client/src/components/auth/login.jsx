import { useForm } from "react-hook-form";
import { LoginGraphic, Logo } from "../../assets/utilities";
import FormError from "../app/subComponents/FormError";
import { isValidPassword } from "./authHelpers";
import { useNotification } from "../layout/NotificationHelper";
import FetchWithAuth from "./api";
import useAuth from "./useAuth";
import { Link, useNavigate } from "react-router-dom";
const Login = () => {
  const { addNotification } = useNotification();
  const { updateAdmin } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  // Handler for form submission
  const onSubmit = async (data) => {
    const response = await FetchWithAuth(
      `/auth/login`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      "Login failed"
    );
    let loginState = false;
    if (response.failed) {
      addNotification(response.message, "error");
      setTimeout(() => {
        return addNotification(response.failed, "error");
      }, 1000);
    }
    try {
      const { admin, accessToken, refreshToken, message } = response;
      loginState = accessToken && updateAdmin(admin, accessToken, refreshToken);
      accessToken && addNotification(message, "success");
    } finally {
      loginState && navigate("/app/dashboard");
    }
  };
  return (
    <div className='flex min-h-screen text-white'>
      {/* Left Image Section - Only visible on large screens */}
      <div className='hidden lg:flex w-1/2 items-center justify-center p-8 bg-primary-default'>
        <div className='relative flex flex-col items-center'>
          <img src={LoginGraphic} alt='Character' className='w-full h-full object-cover' />
        </div>
      </div>

      {/* Right Login Form Section */}
      <div className='flex flex-col w-full lg:w-1/2 items-center justify-center p-8'>
        <div className='max-w-md w-full'>
          <Link to='/' className='flex flex-col items-center lg:items-start gap-4 text-text-light'>
            <img
              src={Logo}
              alt='brand'
              className='m-0 hover:scale-105 duration-500 delay-100 transition-all w-20 h-20 object-cover'
            />
            <h2 className='text-3xl font-bold mb-6 text-center lg:text-start'>Zenith Admin</h2>
          </Link>
          <p className='text-text-light mb-6 text-center lg:text-start'>
            Please sign-in to your account.
          </p>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Username Input */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-text-light mb-1' htmlFor='username'>
                Username
              </label>
              <input
                id='username'
                type='text'
                className={`form-input w-full ${errors.username ? "border-error-dark" : ""}`}
                placeholder='Username here'
                {...register("username", {
                  required: "Username is required.",
                })}
              />
              {errors.username && <FormError err={errors.username.message} />}
            </div>

            {/* Password Input */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-text-light mb-1' htmlFor='password'>
                Password
              </label>
              <input
                id='password'
                type='password'
                className={`form-input w-full ${errors.password ? "border-error-dark" : ""}`}
                placeholder='Enter your password'
                {...register("password", {
                  required: "Password is required.",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 6 characters long.",
                  },
                  validate: (value) => isValidPassword(value),
                  maxLength: { value: 40, message: "Password must be at most 40 characters long." },
                })}
              />
              {errors.password && <FormError err={errors.password.message} />}
            </div>
            <button type='submit' className='accent-btn  w-full' disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
