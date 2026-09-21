# 14. Tree View requests asynchronous children without loading data itself

Date: 2026-09-21

## Status

Accepted. The contract applies to core, Svelte, Vue and Elements. React does
not yet ship Tree View. Virtualization remains a separate decision.

## Context

Large trees often represent remote data. Loading the complete hierarchy before
rendering delays the first useful result and can create a large DOM. The
existing Tree View can receive a controlled result forest, but an absent or
empty `children` array always means that a node is a leaf. It cannot express a
known parent whose children have not been requested yet.

Asynchronous loading and virtualization solve different problems. Loading
children on demand limits data transfer and initial work. Virtualization removes
rendered rows and can also remove the focused treeitem, so it needs separate
evidence and a separate accessibility contract.

## Decision

Tree View requests children and never fetches them.

- A node with no `children` and no `hasChildren` is a leaf.
- A node with a non-empty `children` array is a parent whose children are
  available.
- A node with `hasChildren: true` and no `children` is an unloaded parent.
- `children: []` is a loaded leaf. It never means that remote children may
  exist.
- `loading` and `loadErrors` are controlled lists of node values. They can
  describe concurrent requests.
- Expanding an unloaded parent reports one `loadChildren` request with the node
  value and a monotonically increasing request id. Elements emits the same data
  through `load-children`.
- A request is suppressed while its node is loading. Retrying a failed node
  creates a new request id.
- The design system never applies an asynchronous response. The consumer keeps
  the latest request id for each node and ignores a response whose id is no
  longer current. This prevents an older response from replacing newer data.
- Loading and failure are announced on the parent treeitem. Focus, selection
  and expansion remain stable when the consumer replaces `nodes` with the
  loaded forest.
- Right Arrow retries an expanded failed parent. The disclosure control offers
  the same pointer action. Left Arrow still collapses it.

The consumer owns transport, caching, cancellation, authorization, error
logging and the immutable replacement of `nodes`. Error copy presented by the
component comes from the shared message catalog rather than a backend response.

## Delivery order

1. Define and review the asynchronous contract.
2. Implement it in core, Svelte, Vue and Elements.
3. Verify focus, errors, retry, deduplication and concurrent requests.
4. Add the scenarios to the final A1 manual accessibility session.
5. Evaluate virtualization only with representative large trees and measured
   rendering and interaction costs.

## Consequences

Applications can load independent branches concurrently without giving the
design system network access. Request ids make response ordering explicit. An
application that does not use `hasChildren`, `loading`, `loadErrors` or the load
callback keeps the existing synchronous behavior and markup.

Virtualization is not implied by this contract. Search, filtering and paging
remain supported through controlled replacement of the current result forest.
