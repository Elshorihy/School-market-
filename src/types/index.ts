import type {
  areas,
  categories,
  conversationParticipants,
  conversations,
  favorites,
  governorates,
  listingImages,
  listings,
  messages,
  notifications,
  reports,
  schools,
  sessions,
  users,
  wantedItems
} from '@/db/schema';

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Governorate = typeof governorates.$inferSelect;
export type Area = typeof areas.$inferSelect;
export type School = typeof schools.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type ListingImage = typeof listingImages.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type WantedItem = typeof wantedItems.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export interface ListingWithExtras extends Listing {
  images: { url: string; position: number }[];
  sellerName: string;
  sellerId: string;
  sellerAvatarUrl: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  governorateName: string | null;
  areaName: string | null;
  schoolName: string | null;
  isFavorite: boolean;
  openReportsCount?: number;
}
