## 1. Browser-safe path helper

- [ ] 1.1 Replace the `node:crypto` dependency in `src/services/path-mapper.ts` with a synchronous browser-safe deterministic suffix helper.
- [ ] 1.2 Keep existing document and folder path mapping behavior unchanged while removing the incompatible import.

## 2. Regression coverage and validation

- [ ] 2.1 Add or update tests to cover deterministic collision suffix generation and existing path mapping behavior.
- [ ] 2.2 Validate the change with OpenSpec checks and relevant frontend test/build commands.
