import { IUser } from "../../models/userModel";
import { UserListDTO } from "../../dto/adminDTO/userListDTO";

export const toUserListDTO = (user: IUser): UserListDTO => {
  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB") 
    : "";

  return {
    _id: user._id.toString(),
    name: user.username,
    email: user.email,
    status: user.isBlocked,
    createdAt: formattedDate.replace(/\//g, "-"),
  };
};

export const toUserListDTOs = (users: IUser[]): UserListDTO[] => {
  return users.map(toUserListDTO);
};
