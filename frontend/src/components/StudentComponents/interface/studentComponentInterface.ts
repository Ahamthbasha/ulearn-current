export interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  originalPrice:number;
  discountedPrice?:number;
  duration: string;
  level: string;
  thumbnailUrl: string;
  categoryName?: string;
}

export interface CartItem {
  itemId: string;
  type:"course" | "learningPath";
  title: string;
  thumbnailUrl: string;
  price: number;
}

export interface CartItemDTO {
  itemId: string;
  type: "course" | "learningPath";
  title: string;
  price: number;
  thumbnailUrl: string;
}