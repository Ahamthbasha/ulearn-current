export interface WishlistItemDTO {
  itemId: string;
  name: string;
  price: number;
  thumbnailUrl: string;
  type: "course" | "learningPath";
}