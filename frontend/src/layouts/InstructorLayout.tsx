import InstructorHeader from '../components/InstructorComponents/InstructorHeader';
import { Outlet } from 'react-router-dom';

const InstructorLayout = () => {

  return(
    <>
    <InstructorHeader/>
    <Outlet/>
    </>
  )
}

export default InstructorLayout