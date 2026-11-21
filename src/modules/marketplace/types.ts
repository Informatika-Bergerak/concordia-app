export type ListingCategory =
  | "BOOKS"
  | "ELECTRONICS"
  | "FASHION"
  | "VEHICLES"
  | "BOARDING_HOUSE"
  | "SERVICES"
  | "FOOD"
  | "OTHER";

export type ListingCondition = "NEW" | "USED";

export type ListingAvailability = "AVAILABLE" | "LIMITED" | "SOLD";

export type ListingSummary = {
  id: number;
  slug: string;
  title: string;
  price: number;
  location: string;
  photoUrl: string | null;
  category: ListingCategory;
  condition: ListingCondition;
  availability: ListingAvailability;
};

export type ListingSeller = {
  name: string;
  major: string;
};

export type ListingDetailItem = { label: string; value: string };

export type ListingDetail = ListingSummary & {
  description: string;
  specs: ListingDetailItem[];
  details: ListingDetailItem[];
  seller: ListingSeller;
  allowCod: boolean;
  allowShipping: boolean;
  postedAt: string;
};

export type ActivityItem = {
  id: number;
  slug: string;
  title: string;
  price: number;
  photoUrl: string | null;
  availability: ListingAvailability;
  /** Contoh: "Ditawarkan" atau "Disimpan". */
  action: string;
  date: string;
};

export type NotificationItem = {
  id: number;
  title?: string;
  text: string;
  date: string;
  slug?: string;
};
