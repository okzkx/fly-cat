## MODIFIED Requirements

### Requirement: Open Feishu documents in system browser
The application MUST open Feishu document and bitable links in the system's default browser from the desktop knowledge-tree UI, and MUST return actionable failure details when the browser launch cannot be completed.

#### Scenario: Document browser action opens a Feishu document URL
- **WHEN** the user clicks the browser action for a document node in the knowledge tree
- **THEN** the desktop runtime opens `https://feishu.cn/docx/<document-id>` in the system's default browser

#### Scenario: Subtree-capable document node opens the document page
- **WHEN** the user clicks the browser action for a document node that also has descendants in the knowledge tree
- **THEN** the desktop runtime still opens that document's Feishu `docx` page by using the node's document identifier rather than the tree node token

#### Scenario: Bitable browser action opens a Feishu bitable URL
- **WHEN** the user clicks the browser action for a bitable node in the knowledge tree
- **THEN** the desktop runtime opens `https://feishu.cn/base/<token>` in the system's default browser

#### Scenario: Browser launch failure reaches the frontend
- **WHEN** the desktop runtime cannot open the requested Feishu URL
- **THEN** the browser-opening helper returns a failed result with an error message that the frontend can show to the user
