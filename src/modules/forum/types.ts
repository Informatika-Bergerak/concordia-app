export type FeedComment = {
  id: string;
  authorName: string;
  timeAgo: string;
  text: string;
};

export type FeedPost = {
  id: string;
  authorName: string;
  authorMajor: string;
  timeAgo: string;
  text: string;
  tag?: string;
  hasImage: boolean;
  likes: number;
  commentCount: number;
  comments: FeedComment[];
};