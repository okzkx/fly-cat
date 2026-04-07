## ADDED Requirements

### Requirement: Decoded external hyperlink targets in Markdown

The system MUST normalize Feishu `text_run` hyperlink URLs when they are percent-encoded absolute web URLs so that generated Markdown uses standard `http://` or `https://` link targets.

#### Scenario: Percent-encoded https URL is decoded for Markdown

- **WHEN** a text run's link metadata contains a percent-encoded absolute URL whose decoded form is a valid `https://` URL (for example `https%3A%2F%2Fhost%2Fpath%2F`)
- **THEN** the Markdown pipeline emits that link using the decoded `https://host/path/` target

#### Scenario: Already-canonical https URL is unchanged

- **WHEN** a text run's link metadata already begins with `https://` or `http://`
- **THEN** the pipeline preserves that URL string for Markdown emission (aside from trimming leading and trailing whitespace)
