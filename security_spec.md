# Security Specification for SpendWise

## Data Invariants
1. A transaction MUST have a `userId` matching the authenticated user.
2. A budget MUST have a `userId` matching the authenticated user.
3. A profile document ID MUST match the authenticated user's UID.
4. `amount` fields MUST be non-negative numbers.
5. `type` for transitions MUST be either 'income' or 'expense'.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Creating a transaction with `userId: "attacker_id"`.
2. **Identity Spoofing (Profile)**: Attempting to write to `/profiles/other_user_id`.
3. **Ghost Fields**: Adding `isVerified: true` to a transaction.
4. **Invalid Type**: Setting `type: "investement"` (not in enum).
5. **Negative Amount**: Setting `amount: -100`.
6. **Huge Payload**: Setting `description` to a 1MB string (if limit exists).
7. **Bypass Budget**: Deleting or modifying another user's budget.
8. **PII Leak**: Querying for all profiles without a `userId` filter.
9. **Update Hijack**: Changing the `userId` of an existing transaction.
10. **State Inconsistency**: Updating `createdAt` on an existing transaction.
11. **ID Poisoning**: Using a 1.5KB string as a document ID.
12. **Unverified Auth**: Accessing data with an unverified email (if enforced).

## Test Cases (Implicit)
All above payloads MUST return `PERMISSION_DENIED`.
