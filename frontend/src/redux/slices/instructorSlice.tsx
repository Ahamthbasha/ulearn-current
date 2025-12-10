import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {type InstructorSlice} from "../slices/interface/sliceInterface"

const initialState: InstructorSlice = {
  userId: null,
  name: null,
  email: null,
  role: null,
  isBlocked: null,
  isVerified: null, // ✅ Initialize
  profilePicture: null,
};

const instructorSlice = createSlice({
  name: "instructor",
  initialState,
  reducers: {
    setInstructor: (state, action: PayloadAction<InstructorSlice>) => {
      const {
        userId,
        name,
        email,
        role,
        isBlocked,
        isVerified,
        profilePicture,
      } = action.payload;

      state.userId = userId;
      state.name = name;
      state.email = email;
      state.role = role;
      state.isBlocked = isBlocked;
      state.isVerified = isVerified; // ✅ Set value
      state.profilePicture = profilePicture;

      localStorage.setItem("instructor", JSON.stringify(state)); // ✅ Will now include isVerified
    },

    clearInstructorDetails: (state) => {
      state.userId = null;
      state.name = null;
      state.email = null;
      state.role = null;
      state.isBlocked = null;
      state.isVerified = null; // ✅ Clear it too
      state.profilePicture = null;

      localStorage.removeItem("instructor");
    },
  },
});

export const { setInstructor, clearInstructorDetails } = instructorSlice.actions;
export default instructorSlice.reducer;
