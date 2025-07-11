// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { addToCart, getCart, removeFromCart } from "../../api/action/StudentAction";
// import {
//   addToWishlist,
//   removeFromWishlist,
//   courseAlreadyExistInWishlist,
// } from "../../api/action/StudentAction";
// import { Heart, ShoppingCart, XCircle } from "lucide-react";

// interface CourseCardProps {
//   id: string;
//   title: string;
//   description: string;
//   price: number;
//   duration: string;
//   level: string;
//   thumbnailUrl: string;
//   categoryName?: string;
// }

// const CourseCard: React.FC<CourseCardProps> = ({
//   id,
//   title,
//   description,
//   price,
//   duration,
//   level,
//   thumbnailUrl,
// }) => {
//   const navigate = useNavigate();
//   const [isInCart, setIsInCart] = useState(false);
//   const [isInWishlist, setIsInWishlist] = useState(false);

//   useEffect(() => {
//     const fetchStatuses = async () => {
//       try {
//         const cartRes = await getCart();
//         const existsInCart = cartRes?.data?.courses?.some((c: any) => c._id === id);
//         setIsInCart(existsInCart);

//         const wishRes = await courseAlreadyExistInWishlist(id);
//         setIsInWishlist(wishRes?.exists || false);
//       } catch (err) {
//         console.error("Failed to fetch cart/wishlist status:", err);
//       }
//     };
//     fetchStatuses();
//   }, [id]);

//   const handleAddToCart = async () => {
//     try {
//       const res = await addToCart(id);
//       toast.success(res.message || "Course added to cart");
//       setIsInCart(true);
//     } catch (error: any) {
//       toast.error(error?.response?.data?.message || "Failed to add to cart");
//     }
//   };

//   const handleRemoveFromCart = async () => {
//     try {
//       const res = await removeFromCart(id);
//       toast.success(res.message || "Course removed from cart");
//       setIsInCart(false);
//     } catch (error: any) {
//       toast.error(error?.response?.data?.message || "Failed to remove from cart");
//     }
//   };

//   const handleAddToWishlist = async () => {
//     try {
//       const res = await addToWishlist(id);
//       toast.success(res.message || "Added to wishlist");
//       setIsInWishlist(true);
//     } catch (error: any) {
//       toast.error(error?.response?.data?.message || "Failed to add to wishlist");
//     }
//   };

//   const handleRemoveFromWishlist = async () => {
//     try {
//       const res = await removeFromWishlist(id);
//       toast.success(res.message || "Removed from wishlist");
//       setIsInWishlist(false);
//     } catch (error: any) {
//       toast.error(error?.response?.data?.message || "Failed to remove from wishlist");
//     }
//   };

//   return (
//     <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border flex flex-col">
//       <div className="relative group h-48 overflow-hidden">
//         <img
//           src={thumbnailUrl}
//           alt={title}
//           className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
//         />
//       </div>
//       <div className="p-4 flex flex-col flex-grow">
//         <h3 className="text-lg font-semibold mb-1 line-clamp-1">{title}</h3>
//         <p className="text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>

//         <div className="grid grid-cols-2 text-sm text-gray-700 gap-2 mb-4">
//           <span>🕒 {duration} hrs</span>
//           <span>🎯 {level}</span>
//           <span>💰 ₹{price}</span>
//         </div>

//         <div className="flex items-center justify-between gap-2 mt-auto">
//           {isInCart ? (
//             <button
//               onClick={handleRemoveFromCart}
//               className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-md flex items-center gap-1 transition"
//             >
//               <XCircle size={16} />
//               Remove
//             </button>
//           ) : (
//             <button
//               onClick={handleAddToCart}
//               className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-md flex items-center gap-1 transition"
//             >
//               <ShoppingCart size={16} />
//               Add to Cart
//             </button>
//           )}

//           {isInWishlist ? (
//             <button
//               className="text-red-500 hover:text-red-600 transition"
//               title="Remove from Wishlist"
//               onClick={handleRemoveFromWishlist}
//             >
//               <Heart size={20} fill="currentColor" />
//             </button>
//           ) : (
//             <button
//               className="text-gray-400 hover:text-red-500 transition"
//               title="Add to Wishlist"
//               onClick={handleAddToWishlist}
//             >
//               <Heart size={20} />
//             </button>
//           )}

//           <button
//             onClick={() => navigate(`/user/course/${id}`)}
//             className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-4 rounded-md transition"
//           >
//             View Details
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CourseCard;


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  addToCart,
  getCart,
  removeFromCart,
  addToWishlist,
  removeFromWishlist,
  courseAlreadyExistInWishlist,
} from "../../api/action/StudentAction";
import { Heart, ShoppingCart, XCircle } from "lucide-react";
import { isStudentLoggedIn } from "../../utils/auth"; // ✅ import login check

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  level: string;
  thumbnailUrl: string;
  categoryName?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  description,
  price,
  duration,
  level,
  thumbnailUrl,
}) => {
  const navigate = useNavigate();
  const [isInCart, setIsInCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    if (!isStudentLoggedIn()) return;

    const fetchStatuses = async () => {
      try {
        const cartRes = await getCart();
        const existsInCart = cartRes?.data?.courses?.some((c: any) => c._id === id);
        setIsInCart(existsInCart);

        const wishRes = await courseAlreadyExistInWishlist(id);
        setIsInWishlist(wishRes?.exists || false);
      } catch (err) {
        console.error("Failed to fetch cart/wishlist status:", err);
      }
    };

    fetchStatuses();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isStudentLoggedIn()) {
      toast.info("Please log in to add courses to your cart");
      return;
    }

    try {
      const res = await addToCart(id);
      toast.success(res.message || "Course added to cart");
      setIsInCart(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add to cart");
    }
  };

  const handleRemoveFromCart = async () => {
    try {
      const res = await removeFromCart(id);
      toast.success(res.message || "Course removed from cart");
      setIsInCart(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to remove from cart");
    }
  };

  const handleAddToWishlist = async () => {
    if (!isStudentLoggedIn()) {
      toast.info("Please log in to use the wishlist");
      return;
    }

    try {
      const res = await addToWishlist(id);
      toast.success(res.message || "Added to wishlist");
      setIsInWishlist(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add to wishlist");
    }
  };

  const handleRemoveFromWishlist = async () => {
    try {
      const res = await removeFromWishlist(id);
      toast.success(res.message || "Removed from wishlist");
      setIsInWishlist(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to remove from wishlist");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border flex flex-col">
      <div className="relative group h-48 overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={title}
          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-1 line-clamp-1">{title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>

        <div className="grid grid-cols-2 text-sm text-gray-700 gap-2 mb-4">
          <span>🕒 {duration} hrs</span>
          <span>🎯 {level}</span>
          <span>💰 ₹{price}</span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-auto">
          {isInCart ? (
            <button
              onClick={handleRemoveFromCart}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-md flex items-center gap-1 transition"
            >
              <XCircle size={16} />
              Remove
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-md flex items-center gap-1 transition"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          )}

          {isInWishlist ? (
            <button
              className="text-red-500 hover:text-red-600 transition"
              title="Remove from Wishlist"
              onClick={handleRemoveFromWishlist}
            >
              <Heart size={20} fill="currentColor" />
            </button>
          ) : (
            <button
              className="text-gray-400 hover:text-red-500 transition"
              title="Add to Wishlist"
              onClick={handleAddToWishlist}
            >
              <Heart size={20} />
            </button>
          )}

          <button
            onClick={() => navigate(`/user/course/${id}`)}
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-4 rounded-md transition"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
