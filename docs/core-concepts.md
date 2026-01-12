# Core Concepts

## Flags and Variants

A **Flag** represents a feature toggle or configuration. It has a key (e.g., `new-checkout-flow`) and a type (boolean, string, number, JSON).

**Variants** are the possible values a flag can take. For a boolean flag, variants are `true` and `false`.

## Rules and Evaluation

Flags are evaluated based on **Rules**. A rule consists of **Conditions** and a **Result**.

### Conditions
Conditions check against the **Evaluation Context**. Supported operators include:
- `equals`, `contains`
- `gt`, `lt`, `gte`, `lte` (numbers)
- `in_list`, `not_in_list` (hashed lists)

### Evaluation Context
The context is a JSON object containing attributes about the user or request.
- `userId`: Unique identifier for the user (required for percentage rollouts and lists).
- `attributes`: Custom attributes (e.g., `email`, `plan`, `country`).

## Evaluation Modes

### Local Evaluation (Node.js)
The SDK fetches **Flag Definitions** (rules, lists) at initialization and evaluates flags locally. This ensures low latency and high availability.

### Remote Evaluation (React/Client-side)
The SDK sends the context to the FlagControl API, which evaluates the flags and returns the results. This keeps sensitive rules and lists secure on the server.

## Lists and Privacy

**Lists** allow targeting specific groups of users (e.g., `beta-users`).
To protect user privacy, list members are **hashed** (with a project-specific salt) before being sent to the SDK (in Local Mode). The SDK hashes the user ID from the context and checks for existence in the hashed list.
