import { randomUUID } from "crypto";
import type { TweetResponseBody } from "@example/tweet-server/models/models_0";

/**
 * In-memory tweet store. Service A keeps tweets in process memory only;
 * persistence is intentionally out of scope (Postgres lives in Service B).
 */
const tweets = new Map<string, TweetResponseBody>();

export interface CreateTweetParams {
  authorId: string;
  content: string;
}

export function createTweet(params: CreateTweetParams): TweetResponseBody {
  const tweetId = randomUUID();
  const tweet: TweetResponseBody = {
    tweetId,
    authorId: params.authorId,
    content: params.content,
    createdAt: new Date(),
    likeCount: 0,
  };
  tweets.set(tweetId, tweet);
  return tweet;
}

export function getTweet(tweetId: string): TweetResponseBody | undefined {
  return tweets.get(tweetId);
}

export function updateTweet(
  tweetId: string,
  content: string
): TweetResponseBody | undefined {
  const existing = tweets.get(tweetId);
  if (!existing) return undefined;
  const updated: TweetResponseBody = { ...existing, content };
  tweets.set(tweetId, updated);
  return updated;
}

export function deleteTweet(tweetId: string): boolean {
  return tweets.delete(tweetId);
}

export interface ListTweetsParams {
  authorId?: string;
  nextToken?: string;
  pageSize?: number;
}

export interface ListTweetsResult {
  items: TweetResponseBody[];
  nextToken?: string;
}

export function listTweets(params: ListTweetsParams): ListTweetsResult {
  const all = [...tweets.values()];
  const filtered = params.authorId
    ? all.filter((t) => t.authorId === params.authorId)
    : all;
  const pageSize = Math.max(1, Math.min(params.pageSize ?? 50, 100));
  const startIdx = params.nextToken ? Number.parseInt(params.nextToken, 10) : 0;
  const safeStart = Number.isFinite(startIdx) && startIdx >= 0 ? startIdx : 0;
  const slice = filtered.slice(safeStart, safeStart + pageSize);
  const nextStart = safeStart + slice.length;
  return {
    items: slice,
    nextToken: nextStart < filtered.length ? String(nextStart) : undefined,
  };
}
