import { Navigate,Outlet } from "react-router-dom";

const PrivateRoute = () => {
    const isAdminAuthenticated = Boolean(localStorage.getItem('instructor'))

    return isAdminAuthenticated ? <Outlet /> : <Navigate to='/instructor/login'/>
}

export default PrivateRoute