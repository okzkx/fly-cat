## 1. Content Fetch Retry Gap

- [x] 1.1 Update the content-fetch entrypoint to use throttling-aware document-summary retrieval before loading blocks.
- [x] 1.2 Add or update focused regression coverage for content-fetch-stage `99991400` document-summary throttling.

## 2. Verification

- [x] 2.1 Run targeted backend tests covering the updated content-fetch retry path.
- [x] 2.2 Validate the OpenSpec change before moving to apply/archive.
