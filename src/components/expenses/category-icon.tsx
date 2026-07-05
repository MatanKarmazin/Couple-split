import {
  BadgeDollarSign,
  Car,
  Clapperboard,
  HeartPulse,
  Home,
  Plane,
  Plug,
  Salad,
  ShoppingBag,
  ShoppingCart
} from "lucide-react";
import type { Category } from "@/types";

const icons = {
  Food: Salad,
  Groceries: ShoppingCart,
  Rent: Home,
  Utilities: Plug,
  Transport: Car,
  Entertainment: Clapperboard,
  Travel: Plane,
  Shopping: ShoppingBag,
  Health: HeartPulse,
  Other: BadgeDollarSign
} satisfies Record<Category, typeof Salad>;

export function CategoryIcon({ category }: { category: Category }) {
  const Icon = icons[category];
  return <Icon className="h-4 w-4" />;
}
