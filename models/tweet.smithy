$version: "2"

namespace example.twitter

use smithy.framework#ValidationException
use aws.protocols#restJson1

/// A simple Twitter-like API for managing tweets.
@restJson1
service TweetService {
    version: "2026-05-16"
    resources: [
        Tweet
    ]
    errors: [
        ValidationException
    ]
}

// -----------------------------------------------
// Resource
// -----------------------------------------------

resource Tweet {
    identifiers: { tweetId: TweetId }
    create: CreateTweet
    read: GetTweet
    update: UpdateTweet
    delete: DeleteTweet
    list: ListTweets
}

// -----------------------------------------------
// Scalars / simple types
// -----------------------------------------------

@pattern("^[A-Za-z0-9_-]{1,36}$")
string TweetId

@pattern("^[A-Za-z0-9_]{1,64}$")
string UserId

@length(min: 1, max: 280)
string TweetContent

// -----------------------------------------------
// Create
// -----------------------------------------------

@http(method: "POST", uri: "/tweets", code: 201)
operation CreateTweet {
    input := {
        @required
        @httpPayload
        @notProperty
        body: CreateTweetRequestBody
    }

    output := {
        @required
        @httpPayload
        @notProperty
        body: TweetResponseBody
    }

    errors: [
        ValidationException
    ]
}

structure CreateTweetRequestBody {
    @required
    authorId: UserId

    @required
    content: TweetContent
}

// -----------------------------------------------
// Read
// -----------------------------------------------

@readonly
@http(method: "GET", uri: "/tweets/{tweetId}", code: 200)
operation GetTweet {
    input := {
        @required
        @httpLabel
        tweetId: TweetId
    }

    output := {
        @required
        @httpPayload
        @notProperty
        body: TweetResponseBody
    }

    errors: [
        TweetNotFoundException
    ]
}

// -----------------------------------------------
// Update
// -----------------------------------------------

@idempotent
@http(method: "PUT", uri: "/tweets/{tweetId}", code: 200)
operation UpdateTweet {
    input := {
        @required
        @httpLabel
        tweetId: TweetId

        @required
        @httpPayload
        @notProperty
        body: UpdateTweetRequestBody
    }

    output := {
        @required
        @httpPayload
        @notProperty
        body: TweetResponseBody
    }

    errors: [
        TweetNotFoundException
        ValidationException
    ]
}

structure UpdateTweetRequestBody {
    @required
    content: TweetContent
}

// -----------------------------------------------
// Delete
// -----------------------------------------------

@idempotent
@http(method: "DELETE", uri: "/tweets/{tweetId}", code: 204)
operation DeleteTweet {
    input := {
        @required
        @httpLabel
        tweetId: TweetId
    }

    output := {}

    errors: [
        TweetNotFoundException
    ]
}

// -----------------------------------------------
// List
// -----------------------------------------------

@readonly
@paginated(inputToken: "nextToken", outputToken: "nextToken", pageSize: "pageSize", items: "items")
@http(method: "GET", uri: "/tweets", code: 200)
operation ListTweets {
    input := {
        @httpQuery("authorId")
        authorId: UserId

        @httpQuery("nextToken")
        nextToken: String

        @httpQuery("pageSize")
        pageSize: Integer
    }

    output := {
        @required
        items: TweetList

        nextToken: String
    }
}

// -----------------------------------------------
// Shared structures
// -----------------------------------------------

structure TweetResponseBody {
    @required
    tweetId: TweetId

    @required
    authorId: UserId

    @required
    content: TweetContent

    @required
    createdAt: Timestamp

    @required
    likeCount: Integer
}

list TweetList {
    member: TweetResponseBody
}

// -----------------------------------------------
// Errors
// -----------------------------------------------

@error("client")
@httpError(404)
structure TweetNotFoundException {
    @required
    message: String
}
