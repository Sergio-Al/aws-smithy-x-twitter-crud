$version: "2"

namespace example.payment

use smithy.framework#ValidationException
use aws.protocols#restJson1

// =============================================================
// Service A: Payment Gateway (HTTP-facing, publishes to RabbitMQ)
// =============================================================

/// HTTP-facing gateway that accepts payment requests and publishes them to the
/// asynchronous payment processor via RabbitMQ.
@restJson1
service PaymentGatewayService {
    version: "2026-05-27"
    operations: [
        InitiatePayment
    ]
    errors: [
        ValidationException
    ]
}

@http(method: "POST", uri: "/payments", code: 202)
operation InitiatePayment {
    input := {
        @required
        @httpPayload
        @notProperty
        body: InitiatePaymentRequestBody
    }

    output := {
        @required
        @httpPayload
        @notProperty
        body: InitiatePaymentResponseBody
    }

    errors: [
        ValidationException
    ]
}

// =============================================================
// Service B: Payment Processor (consumes RabbitMQ, persists to Postgres)
// =============================================================

/// Backend processor that reads payment events from RabbitMQ, persists them to
/// Postgres, simulates processing, and exposes a read-only HTTP API for status.
@restJson1
service PaymentProcessorService {
    version: "2026-05-27"
    operations: [
        GetPaymentStatus
    ]
    errors: [
        ValidationException
    ]
}

@readonly
@http(method: "GET", uri: "/payments/{paymentId}", code: 200)
operation GetPaymentStatus {
    input := {
        @required
        @httpLabel
        paymentId: PaymentId
    }

    output := {
        @required
        @httpPayload
        @notProperty
        body: PaymentResponseBody
    }

    errors: [
        PaymentNotFoundException
    ]
}

// =============================================================
// Shared shapes
// =============================================================

@pattern("^[A-Za-z0-9_-]{1,64}$")
string PaymentId

@pattern("^[A-Za-z0-9_]{1,64}$")
string UserId

@pattern("^[A-Za-z0-9_-]{1,36}$")
string TweetId

@pattern("^[A-Z]{3}$")
string CurrencyCode

@length(min: 1, max: 256)
string PaymentDescription

enum PaymentStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
}

// Request body for InitiatePayment (HTTP input)
structure InitiatePaymentRequestBody {
    @required
    userId: UserId

    /// Optional tweet this payment is associated with (e.g. premium post, tip).
    tweetId: TweetId

    @required
    amount: Double

    @required
    currency: CurrencyCode

    @required
    description: PaymentDescription
}

// Response body for InitiatePayment (HTTP output)
structure InitiatePaymentResponseBody {
    @required
    paymentId: PaymentId

    @required
    status: PaymentStatus
}

// Response body for GetPaymentStatus (HTTP output)
structure PaymentResponseBody {
    @required
    paymentId: PaymentId

    @required
    userId: UserId

    tweetId: TweetId

    @required
    amount: Double

    @required
    currency: CurrencyCode

    @required
    description: PaymentDescription

    @required
    status: PaymentStatus

    @required
    createdAt: Timestamp

    @required
    updatedAt: Timestamp
}

// =============================================================
// Internal contracts service — exists only to make async message
// shapes (PaymentEvent) reachable from a service so Smithy
// generates TypeScript types for them. Not exposed over HTTP in
// production; the generated client is used purely as a typed
// contracts package shared by producer and consumer.
// =============================================================

@restJson1
service PaymentContractsService {
    version: "2026-05-27"
    operations: [
        __PublishPaymentEventContract
    ]
}

@http(method: "POST", uri: "/__contracts/payment-event", code: 200)
operation __PublishPaymentEventContract {
    input := {
        @required
        @httpPayload
        @notProperty
        event: PaymentEvent
    }
    output := {}
}

/// Contract for messages published to the RabbitMQ `payment.events` queue.
/// Defined in Smithy so producer (Service A) and consumer (Service B) share a
/// single source of truth for the message envelope.
structure PaymentEvent {
    @required
    paymentId: PaymentId

    @required
    userId: UserId

    tweetId: TweetId

    @required
    amount: Double

    @required
    currency: CurrencyCode

    @required
    description: PaymentDescription

    @required
    occurredAt: Timestamp
}

// =============================================================
// Errors
// =============================================================

@error("client")
@httpError(404)
structure PaymentNotFoundException {
    @required
    message: String
}
