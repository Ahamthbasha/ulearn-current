import { useState } from "react";

const useVideoCall = () => {
    const [showVideoCallModal, setShowVideoCallModal] = useState(false);
    const [sender, setSender] = useState<string>("");
  
    const handleCall = ( email : string) => {
      console.log("Opening Video Call Modal...", email );
      setSender(email);
      setShowVideoCallModal(true);
    };
  
    const closeModal = () => {
      setShowVideoCallModal(false);
    };
  
    return { showVideoCallModal, sender, handleCall, closeModal };
  };
 
export default useVideoCall ;