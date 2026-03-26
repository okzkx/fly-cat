use serde::{Deserialize, Serialize};

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
    Unknown { raw_type: String },
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ManifestRecord {
    pub document_id: String,
    pub space_id: String,
    pub title: String,
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
