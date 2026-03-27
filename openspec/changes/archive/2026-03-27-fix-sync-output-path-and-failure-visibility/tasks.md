## 1. Backend Metadata Normalization

- [x] 1.1 Replace debug-style task timestamp generation with parseable timestamp values that render correctly in the frontend.
- [x] 1.2 Replace debug-style task names with user-readable names derived from stable time formatting.
- [x] 1.3 Add backend sync-root normalization so each task stores a trustworthy resolved output directory instead of only the raw configured relative path.

## 2. Failure Classification And Propagation

- [x] 2.1 Define a bounded failure-stage taxonomy for sync errors such as authorization, discovery, content fetch, markdown render, image handling, and filesystem write.
- [x] 2.2 Classify sync pipeline failures at the relevant backend boundaries and attach concise diagnostics to task/document failure payloads.
- [x] 2.3 Preserve enough run-level failure summary data that the UI can explain why all items in a run failed without inspecting raw logs.

## 3. Frontend Visibility Improvements

- [x] 3.1 Update the home page to show the resolved sync destination clearly rather than only an ambiguous relative path string.
- [x] 3.2 Update the task list to render valid task timestamps and trustworthy output-path information.
- [x] 3.3 Add actionable failure detail presentation in the task experience so users can see why a run or document failed and which stage failed.

## 4. Validation And Regression Coverage

- [x] 4.1 Add tests for timestamp normalization and sync-root resolution behavior.
- [x] 4.2 Add tests for stage-aware failure classification and diagnostic propagation.
- [ ] 4.3 Validate manually that a user can identify the real sync directory and distinguish repeated pipeline failures from destination-path issues in the UI.
