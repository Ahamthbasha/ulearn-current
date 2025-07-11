import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
interface User {
  userId: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  isBlocked: string | null;
  profilePicture: string | null;
}

const initialState: User = {
  userId: null,
  name: null,
  email: null,
  role: null,
  isBlocked: null,
  profilePicture: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // This assumes the payload matches the shape returned by backend (e.g., username, _id, profilePicUrl)
    setUser: (
      state,
      action: PayloadAction<{
        _id: string;
        username: string;
        email: string;
        role: string;
        isBlocked: boolean | string;
        profilePicUrl: string | null;
      }>
    ) => {
      const { _id, username, email, role, isBlocked, profilePicUrl } =
        action.payload;

      state.userId = _id;
      state.name = username;
      state.email = email;
      state.role = role;
      state.isBlocked = String(isBlocked);
      state.profilePicture = profilePicUrl;

      localStorage.setItem("user", JSON.stringify(state));
    },

    clearUserDetails: (state) => {
      state.userId = null;
      state.name = null;
      state.email = null;
      state.role = null;
      state.isBlocked = null;
      state.profilePicture = null;

      localStorage.removeItem("user");
    },
  },
});

export const { setUser, clearUserDetails } = userSlice.actions;
export default userSlice.reducer;
