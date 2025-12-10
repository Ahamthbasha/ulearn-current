import { Navigate,Outlet } from "react-router-dom";

const PrivateRoute = () => {
    const isAdminAuthenticated = Boolean(localStorage.getItem('admin'))

    return isAdminAuthenticated ? <Outlet/> : <Navigate to='/admin/login' />
}

export default PrivateRoute