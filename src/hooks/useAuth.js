import { useContext } from "react";
import { AuthContext } from "../context/authContextValue";

const useAuth = () => useContext(AuthContext);

export default useAuth;
