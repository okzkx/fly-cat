use serde::{Deserialize, Serialize};

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
    Heading { level: u8, text: String },
    Paragraph { text: String },
    Image { media_id: String, alt: String },
    OrderedList { items: Vec<String> },
    BulletList { items: Vec<String> },
    CodeBlock { language: String, code: String },
    Quote { text: String },
    Table { rows: Vec<Vec<String>> },
    Divider,
    Todo { items: Vec<(bool, String)> },
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
