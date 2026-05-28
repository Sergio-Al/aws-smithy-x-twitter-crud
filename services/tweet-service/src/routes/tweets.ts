import { Router } from "express";
import {
  CreateTweetInput,
  GetTweetInput,
  UpdateTweetInput,
  DeleteTweetInput,
  ListTweetsInput,
} from "@example/tweet-server/models/models_0";
import {
  createTweet,
  deleteTweet,
  getTweet,
  listTweets,
  updateTweet,
} from "../store/tweets";
import { respondNotFound, respondValidationError } from "../util/responses";

export const tweetsRouter = Router();

tweetsRouter.post("/tweets", (req, res) => {
  const input: CreateTweetInput = { body: req.body };
  const failures = CreateTweetInput.validate(input);
  if (failures.length > 0) return respondValidationError(res, failures);

  const tweet = createTweet({
    authorId: input.body!.authorId!,
    content: input.body!.content!,
  });
  res.status(201).json(tweet);
});

tweetsRouter.get("/tweets/:tweetId", (req, res) => {
  const input: GetTweetInput = { tweetId: req.params.tweetId };
  const failures = GetTweetInput.validate(input);
  if (failures.length > 0) return respondValidationError(res, failures);

  const tweet = getTweet(input.tweetId!);
  if (!tweet) {
    return respondNotFound(
      res,
      "example.twitter#TweetNotFoundException",
      `Tweet ${input.tweetId} not found`
    );
  }
  res.status(200).json(tweet);
});

tweetsRouter.put("/tweets/:tweetId", (req, res) => {
  const input: UpdateTweetInput = {
    tweetId: req.params.tweetId,
    body: req.body,
  };
  const failures = UpdateTweetInput.validate(input);
  if (failures.length > 0) return respondValidationError(res, failures);

  const tweet = updateTweet(input.tweetId!, input.body!.content!);
  if (!tweet) {
    return respondNotFound(
      res,
      "example.twitter#TweetNotFoundException",
      `Tweet ${input.tweetId} not found`
    );
  }
  res.status(200).json(tweet);
});

tweetsRouter.delete("/tweets/:tweetId", (req, res) => {
  const input: DeleteTweetInput = { tweetId: req.params.tweetId };
  const failures = DeleteTweetInput.validate(input);
  if (failures.length > 0) return respondValidationError(res, failures);

  const removed = deleteTweet(input.tweetId!);
  if (!removed) {
    return respondNotFound(
      res,
      "example.twitter#TweetNotFoundException",
      `Tweet ${input.tweetId} not found`
    );
  }
  res.status(204).send();
});

tweetsRouter.get("/tweets", (req, res) => {
  const pageSizeRaw = req.query.pageSize;
  const pageSize =
    typeof pageSizeRaw === "string" ? Number.parseInt(pageSizeRaw, 10) : undefined;
  const input: ListTweetsInput = {
    authorId:
      typeof req.query.authorId === "string" ? req.query.authorId : undefined,
    nextToken:
      typeof req.query.nextToken === "string" ? req.query.nextToken : undefined,
    pageSize: Number.isFinite(pageSize) ? pageSize : undefined,
  };
  const failures = ListTweetsInput.validate(input);
  if (failures.length > 0) return respondValidationError(res, failures);

  const result = listTweets(input);
  res.status(200).json(result);
});
