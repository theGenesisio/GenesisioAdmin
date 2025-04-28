import { useContext } from "react";
import AuthContext from "./AuthContextHelper";

const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;
