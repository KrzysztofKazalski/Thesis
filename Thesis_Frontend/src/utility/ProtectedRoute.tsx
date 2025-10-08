import {ReactNode, useContext} from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { user,loading } = useContext(AuthContext);

    if(loading) {
        return <>Loading</>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;