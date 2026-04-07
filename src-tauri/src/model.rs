use serde::{Deserialize, Serialize};

/// A single styled segment of inline text.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct RichSegment {
    pub content: String,
    #[serde(default)]
    pub bold: bool,
    #[serde(default)]
    pub italic: bool,
    #[serde(default)]
    pub strikethrough: bool,
    #[serde(default)]
    pub link: Option<String>,
}

/// Rich text composed of styled segments.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct RichText {
    pub segments: Vec<RichSegment>,
}

impl RichText {
    /// Create a plain (unstyled) RichText from a string.
    pub fn plain(content: impl Into<String>) -> Self {
        Self {
            segments: vec![RichSegment {
                content: content.into(),
                bold: false,
                italic: false,
                strikethrough: false,
                link: None,
            }],
        }
    }

    /// Flatten to plain text without any styling.
    pub fn to_plain_text(&self) -> String {
        self.segments
            .iter()
            .map(|s| s.content.as_str())
            .collect()
    }

    /// Check if the text is empty.
    pub fn is_empty(&self) -> bool {
        self.segments.iter().all(|s| s.content.is_empty())
    }
}

impl From<&str> for RichText {
    fn from(value: &str) -> Self {
        RichText::plain(value)
    }
}

impl From<String> for RichText {
    fn from(value: String) -> Self {
        RichText::plain(value)
    }
}

/// One entry in an ordered or bullet list, with nesting depth for Markdown output.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ListItem {
    /// 0 = top-level item; increases for each nested list level in the Feishu block tree.
    #[serde(default)]
    pub indent: u8,
    pub text: RichText,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct SyncSourceDocument {
    pub document_id: String,
    pub space_id: String,
    #[serde(default)]
    pub space_name: String,
    #[serde(default)]
    pub node_token: String,
    pub title: String,
    #[serde(default)]
    pub version: String,
    #[serde(default)]
    pub update_time: String,
    #[serde(default)]
    pub path_segments: Vec<String>,
    #[serde(default)]
    pub source_path: String,
    #[serde(default)]
    pub obj_type: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalDocument {
    pub document_id: String,
    pub space_id: String,
    pub title: String,
    pub blocks: Vec<CanonicalBlock>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum CanonicalBlock {
    Heading { level: u8, text: RichText },
    Paragraph { text: RichText },
    Image { media_id: String, alt: String },
    OrderedList { items: Vec<ListItem> },
    BulletList { items: Vec<ListItem> },
    CodeBlock { language: String, code: String },
    Quote { text: RichText },
    Table { rows: Vec<Vec<RichText>> },
    Divider,
    Todo { items: Vec<(bool, RichText)> },
    Unknown { raw_type: String },
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ManifestRecord {
    pub document_id: String,
    pub space_id: String,
    #[serde(default)]
    pub space_name: String,
    #[serde(default)]
    pub node_token: String,
    pub title: String,
    #[serde(default)]
    pub version: String,
    #[serde(default)]
    pub update_time: String,
    #[serde(default)]
    pub source_path: String,
    #[serde(default)]
    pub path_segments: Vec<String>,
    pub output_path: String,
    pub content_hash: String,
    pub source_signature: String,
    pub status: String,
    pub image_assets: Vec<String>,
    pub last_synced_at: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct SyncManifest {
    pub records: Vec<ManifestRecord>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DocumentSyncStatusEntry {
    pub status: String,
    pub last_synced_at: String,
    /// Feishu revision stored in manifest for this document (last sync attempt).
    #[serde(default)]
    pub local_feishu_version: String,
}

/// Payload for read-only Markdown preview in the knowledge base UI.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SyncedMarkdownPreview {
    pub markdown: String,
    pub output_path: String,
    pub title: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DocumentFreshnessResult {
    pub status: String,
    pub local_version: String,
    pub remote_version: String,
    pub local_update_time: String,
    pub remote_update_time: String,
    pub error: Option<String>,
}
