import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getWishlist,
  removeFromWishlist,
  addToCart,
  getCart,
} from "../../../api/action/StudentAction";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import type { WishlistItem,CartItemDTO } from "../interface/studentInterface";
import type { ApiError } from "../../../types/interfaces/ICommon";

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [cartItemIds, setCartItemIds] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
    fetchCartItems();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await getWishlist();
      if (response.success && response.data) {
        setWishlist(response.data);
      } else {
        toast.error(response.message || "Failed to fetch wishlist");
      }
    } 
    catch (error: unknown) {
  const apiError = error as ApiError;
  toast.error(apiError.response?.data?.message || apiError.message || "Failed to fetch wishlist");
}
  };

  const fetchCartItems = async () => {
    try {
      const response = await getCart();
      if (Array.isArray(response)) {
        const ids = response.map((item: CartItemDTO) => item.itemId);
        setCartItemIds(ids);
      } else {
        toast.error("Failed to fetch cart");
      }
    } 
    catch (error: unknown) {
  const apiError = error as ApiError;
  toast.error(apiError.response?.data?.message || apiError.message || "Failed to fetch cart");
}
  };

  const handleAddToCart = async (itemId: string, type: "course" | "learningPath") => {
    try {
      await addToCart(itemId, type);
      toast.success(`${type === "course" ? "Course" : "Learning Path"} added to cart`);
      await fetchCartItems(); 
    } 
    catch (error: unknown) {
  const apiError = error as ApiError;
  toast.error(
    apiError.response?.data?.message || 
    apiError.message || 
    `Failed to add ${type === "course" ? "course" : "learning path"} to cart`
  );
}
  };

  const handleRemoveFromWishlist = async (itemId: string, type: "course" | "learningPath") => {
    try {
      const response = await removeFromWishlist(itemId, type);
      toast.success(response.message || `Removed from wishlist`);
      await fetchWishlist(); // Refresh wishlist to update the UI
    }
    catch (error: unknown) {
  const apiError = error as ApiError;
  toast.error(
    apiError.response?.data?.message || 
    apiError.message || 
    `Failed to remove ${type === "course" ? "course" : "learning path"} from wishlist`
  );
}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 flex items-center">
          ❤️ My Wishlist
        </h2>

        {wishlist.length === 0 ? (
          <div className="text-center p-6 sm:p-8 bg-white rounded-lg shadow-md mt-10">
            <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="mb-4 text-gray-600 text-lg">No items in wishlist.</p>
            <button
              onClick={() => navigate("/user/courses")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-md text-sm sm:text-base w-full sm:w-auto"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full sm:w-auto border border-gray-300 bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 sm:p-3 md:p-4 border-b text-left">Thumbnail</th>
                  <th className="p-2 sm:p-3 md:p-4 border-b text-left">Name</th>
                  <th className="p-2 sm:p-3 md:p-4 border-b text-left">Type</th>
                  <th className="p-2 sm:p-3 md:p-4 border-b text-left">Price</th>
                  <th className="p-2 sm:p-3 md:p-4 border-b text-left">Cart Action</th>
                  <th className="p-2 sm:p-3 md:p-4 border-b text-left">Wishlist Action</th>
                </tr>
              </thead>
              <tbody>
                {wishlist.map((item) => {
                  const isInCart = cartItemIds.includes(item.itemId);

                  return (
                    <tr
                      key={`${item.itemId}-${item.type}`}
                      className="hover:bg-gray-50 transition duration-300"
                    >
                      <td className="p-2 sm:p-3 md:p-4 border-b">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.name}
                          className="w-20 h-12 sm:w-24 sm:h-16 object-cover rounded-lg"
                          onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
                        />
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 border-b font-medium text-gray-800">
                        {item.name}
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 border-b text-gray-700">
                        {item.type === "course" ? "Course" : "Learning Path"}
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 border-b text-gray-700">₹{item.price.toLocaleString()}</td>
                      <td className="p-2 sm:p-3 md:p-4 border-b">
                        {isInCart ? (
                          <button
                            onClick={() => navigate("/user/cart")}
                            className="flex items-center justify-center w-full sm:w-auto px-2 py-1 sm:px-3 sm:py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-sm shadow-md transition duration-300"
                          >
                            <ShoppingCart className="mr-1 h-4 w-4" /> Go to Cart
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item.itemId, item.type)}
                            className="flex items-center justify-center w-full sm:w-auto px-2 py-1 sm:px-3 sm:py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm shadow-md transition duration-300"
                          >
                            <ShoppingCart className="mr-1 h-4 w-4" /> Add to Cart
                          </button>
                        )}
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 border-b">
                        <button
                          onClick={() => handleRemoveFromWishlist(item.itemId, item.type)}
                          className="flex items-center justify-center w-full sm:w-auto px-2 py-1 sm:px-3 sm:py-2 rounded bg-red-500 hover:bg-red-600 text-white text-sm shadow-md transition duration-300"
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;