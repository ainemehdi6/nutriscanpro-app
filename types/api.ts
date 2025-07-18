export interface User {
  id: string;
  email: string;
  name: string;
  goals?: Goals[]
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}


export type Exercise = {
  name: string;
  description: string[];
  image: string;
  video: string;
  muscle: string;
  equipment: string;
};

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
  barcode?: string;
}
export type Food = {
  id: string;
  barcode?: string;
  name: string;
  calories: number;
  carbs?: number;
  fat?: number;
  protein?: number;
  servingSize?: number;
  servingUnit?: string;
  quantity?: number;
  createdAt: string;
  updatedAt: string;
};

export type MealItem = {
  id: string;
  mealId: string;
  foodId: string;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
  food: Food;
};

export type Meal = {
  id: string;
  userId: string;
  type: MealType;
  date: string;
  createdAt: string;
  updatedAt: string;
  items: MealItem[];
  totalCalories?: number;
};

export interface AddItemRequest {
  barcode?: string;
  image?: string;
  description?: string;
  quantity?: number;
}

export interface AddItemResponse {
  success: boolean;
  addedItems?: Meal[];
  message?: string;
  totalNutrition?: 
  {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface DeleteItemResponse {
  success: boolean;
  deletedItems?: MealItem[];
  message?: string;
}

export interface AnalyseMealResponse {
  success: boolean;
  foods?: Food[];
  message?: string;
}

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';