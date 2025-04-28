/**
 * Admins component for managing administrators.
 *
 * This component allows the creation of new administrators and displays
 * information about the current administrator and a table of all administrators.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered Admins component.
 *
 * @example
 * return (
 *   <Admins />
 * )
 *
 * @requires useState
 * @requires useNotification from "../layout/NotificationHelper"
 * @requires FetchWithAuth from "../auth/api"
 * @requires Card from "@material-tailwind/react"
 * @requires useAuth from "../auth/useAuth"
 * @requires AdminsTable from "./subComponents/AdminsTable.jsx"
 * @requires useForm from "react-hook-form"
 * @requires isValidPassword from "../auth/authHelpers.jsx"
 * @requires FormError from "./subComponents/FormError.jsx"
 */
import { useState } from "react";
import { useNotification } from "../layout/NotificationHelper";
import FetchWithAuth from "../auth/api";
import { Card } from "@material-tailwind/react";
import useAuth from "../auth/useAuth";
import AdminsTable from "./subComponents/AdminsTable.jsx";
import { useForm } from "react-hook-form";
import { isValidPassword } from "../auth/authHelpers.jsx";
import FormError from "./subComponents/FormError.jsx";

const Admins = () => {
  const { admin } = useAuth();
  const { addNotification } = useNotification();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);

  // Handler for form submission
  const handleAdmins = async (data) => {
    setLoading(true);
    try {
      const response = await FetchWithAuth(
        `/auth/manage-admins`,
        {
          method: "POST",
          body: JSON.stringify(data),
          credentials: "include",
        },
        "Failed to create admin"
      );

      if (response.failed) {
        addNotification(response.message, "error");
      } else {
        const { success, message } = response;
        if (success) {
          addNotification(message, "success");
          // Reset form fields
          reset();
        } else {
          addNotification("Admin creation was not successful", "error");
        }
      }
    } catch (err) {
      addNotification("An error occurred while creating the admin", "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const password = watch("password");

  return (
    <main className='grid md:grid-cols-5 grid-cols-1 gap-4 pb-2'>
      {/* Form to create new administrator */}
      <Card
        className='profile-box flex flex-col space-y-4 col-span-1 md:col-span-2'
        variant='gradient'
        color='gray'>
        <h2 className='text-lg font-semibold mb-2'>Create new Administrator</h2>
        <form onSubmit={handleSubmit(handleAdmins)} className='flex flex-col space-y-4'>
          <div>
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='username'>
              Username
            </label>
            <input
              type='text'
              className='form-input w-full'
              {...register("username", { required: "Username is required" })}
              id='username'
            />
            {errors.username && <FormError err={errors.username.message} />}
          </div>
          <div>
            <label className='block text-sm font-semibold text-text-light mb-1' htmlFor='password'>
              Password
            </label>
            <input
              type='password'
              className='form-input w-full'
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters long.",
                },
                validate: (value) => isValidPassword(value),
                maxLength: {
                  value: 40,
                  message: "Password must be at most 40 characters long.",
                },
              })}
              id='password'
            />
            {errors.password && <FormError err={errors.password.message} />}
          </div>
          <div>
            <label
              className='block text-sm font-semibold text-text-light mb-1'
              htmlFor='confirmPassword'>
              Confirm Password
            </label>
            <input
              type='password'
              className='form-input w-full'
              {...register("confirmPassword", {
                required: "Confirm Password is required",
                validate: (value) => value === password || "Passwords do not match",
              })}
              id='confirmPassword'
            />

            {errors.confirmPassword && <FormError err={errors.confirmPassword.message} />}
          </div>
          <button type='submit' className='accent-btn w-full' disabled={loading}>
            {loading ? "Creating..." : "Create admin"}
          </button>
        </form>
      </Card>
      {/* Display current administrator info */}
      <Card
        className='profile-box flex flex-col space-y-4 col-span-1 md:col-span-3'
        variant='gradient'
        color='gray'>
        <h2 className='text-lg font-semibold text-text-light mb-2'>Current Administrator Info</h2>
        <div className='space-y-4'>
          <p>
            <strong className='text-primary-light'>Username:</strong> {admin?.username}
          </p>
          <p>
            <strong className='text-primary-light'>Admin Status:</strong>{" "}
            {!admin?.blocked ? "Active" : "Blocked"}
          </p>
          <p>
            <strong className='text-primary-light'>Created:</strong> {admin?.createdAt}
          </p>
          <p>
            <strong className='text-primary-light'>Created by:</strong> {admin?.createdBy?.username}
          </p>
          {admin?.lastSeen && (
            <p>
              <strong className='text-primary-light'>Last Seen:</strong> {admin?.lastSeen}
            </p>
          )}
          <p className='text-sm text-primary-light mb-2'>Login Details</p>
          <p>
            <strong className='text-primary-light'>Last Login IP:</strong>{" "}
            {admin?.lastLoginDetails?.ipAddress}
          </p>
          <p>
            <strong className='text-primary-light'>Last Login Device:</strong>{" "}
            {admin?.lastLoginDetails?.device}
          </p>
        </div>
      </Card>
      {/* Table to display all administrators */}
      <AdminsTable />
    </main>
  );
};

export default Admins;
