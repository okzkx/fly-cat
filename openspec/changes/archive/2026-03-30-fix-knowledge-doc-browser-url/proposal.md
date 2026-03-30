## Why

Knowledge-tree document nodes currently launch the browser with the wrong Feishu identifier. Regular document nodes pass a tree `nodeToken` instead of the document's public `documentId`, so users can click "在浏览器打开" and land on a "page not found" result, especially for directory-like document nodes that also have descendants.

## What Changes

- Update the browser-opening flow for knowledge-tree document nodes to build Feishu document URLs from the document identifier rather than the tree node token.
- Preserve the existing bitable browser-opening behavior and failure reporting contract.
- Add focused regression coverage for document and bitable browser URL generation so subtree-capable document nodes keep opening the correct page.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tauri-desktop-runtime-and-backend`: The knowledge-tree browser action for document nodes must open the correct Feishu document URL using the document identifier, while bitable nodes continue to open their existing browser URL.

## Impact

- Frontend knowledge-tree action wiring in `src/components/HomePage.tsx`
- Browser URL helper logic in `src/utils/tauriRuntime.ts`
- Targeted regression tests for browser URL generation
- Delta spec for `tauri-desktop-runtime-and-backend`
