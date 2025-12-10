import {Navigate,Outlet} from 'react-router-dom'

const PrivateRoute = () => {
    const isAdminAuthenticated = Boolean(localStorage.getItem("user"))

    return isAdminAuthenticated ? <Outlet /> : <Navigate to='/user/login'/>
}

export default PrivateRoute

