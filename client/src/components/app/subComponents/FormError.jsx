import PropTypes from "prop-types";

const FormError = ({ err }) => {
  return <div className='text-error-dark text-sm mt-1'>{err}</div>;
};
FormError.propTypes = {
  err: PropTypes.string.isRequired,
};

export default FormError;
