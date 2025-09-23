import { Navigate } from "react-router-dom";
import { type ProtectedRouteProps } from "./interface/sessionRouter";

const AdminSessionRoute : React.FC<ProtectedRouteProps> = ({children}) => {
    const admin = JSON.parse(localStorage.getItem('admin') || 'null')

    if(admin){
        return <Navigate to='/admin/home' replace />
    }

    return children
}

export default AdminSessionRoute