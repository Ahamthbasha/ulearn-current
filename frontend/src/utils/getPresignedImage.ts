import { API } from "../service/axios";

export const getPresignedImageUrl = async (key: string): Promise<string> => {
  try {
    const res = await API.get("/student/presigned-url", {
      params: { key },
      withCredentials: true,
    });
    return res.data.url;
  } catch (error) {
    console.error("Failed to fetch signed URL", error);
    return "";
  }
};
