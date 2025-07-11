import { Navigate } from "react-router-dom";

interface ProtectedRouteProps{
    children : React.ReactNode
}

const AdminSessionRoute : React.FC<ProtectedRouteProps> = ({children}) => {
    const admin = JSON.parse(localStorage.getItem('admin') || 'null')

    if(admin){
        return <Navigate to='/admin/home' replace />
    }

    return children
}

export default AdminSessionRoute