use crate::mcp::{
    fetch_openapi_with_retry, fetch_with_retry, FeishuOpenApiClient, FeishuOpenApiConfig,
    FixtureMcpClient, McpError, RawBlock, RetryPolicy,
};
use crate::model::{CanonicalBlock, CanonicalDocument, ManifestRecord};
use crate::render::{markdown_output_path, render_markdown, source_signature, stable_hash};
use crate::storage::{load_manifest, save_manifest, upsert_manifest_record};
use std::{fs, path::Path};

fn normalize_block(raw_block: RawBlock) -> CanonicalBlock {
    match raw_block {
        RawBlock::Heading { level, text } => CanonicalBlock::Heading { level, text },
        RawBlock::Paragraph { text } => CanonicalBlock::Paragraph { text },
        RawBlock::Image { media_id, alt } => CanonicalBlock::Image { media_id, alt },
    }
}

pub fn fetch_canonical_document(
    document_id: &str,
    mcp_server_name: &str,
    openapi_config: Option<&FeishuOpenApiConfig>,
) -> Result<CanonicalDocument, McpError> {
    let retry_policy = RetryPolicy {
        max_attempts: 2,
        backoff_ms: 150,
    };

    let raw_document = if let Some(config) = openapi_config {
        let client = FeishuOpenApiClient::new(config.clone());
        fetch_openapi_with_retry(&client, document_id, &retry_policy)?
    } else {
        let client = FixtureMcpClient::new(mcp_server_name.to_string());
        fetch_with_retry(&client, document_id, &retry_policy)?
    };
    let blocks = raw_document
        .blocks
        .into_iter()
        .map(normalize_block)
        .collect::<Vec<_>>();

    Ok(CanonicalDocument {
        document_id: raw_document.document_id,
        space_id: raw_document.space_id,
        title: raw_document.title,
        blocks,
    })
}

pub struct SyncWriteResult {
    pub output_path: String,
    pub image_assets: Vec<String>,
    pub content_hash: String,
    pub source_signature: String,
}

pub fn sync_document_to_disk(
    document_id: &str,
    sync_root: &Path,
    image_dir_name: &str,
    mcp_server_name: &str,
    openapi_config: Option<&FeishuOpenApiConfig>,
) -> Result<SyncWriteResult, String> {
    let canonical =
        fetch_canonical_document(document_id, mcp_server_name, openapi_config).map_err(|err| err.to_string())?;
    let rendered = if let Some(config) = openapi_config {
        let client = FeishuOpenApiClient::new(config.clone());
        render_markdown(&canonical, sync_root, image_dir_name, &client).map_err(|err| err.to_string())?
    } else {
        let client = FixtureMcpClient::new(mcp_server_name.to_string());
        render_markdown(&canonical, sync_root, image_dir_name, &client).map_err(|err| err.to_string())?
    };
    let output_path = markdown_output_path(sync_root, &canonical);

    if let Some(parent) = output_path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    fs::write(&output_path, &rendered.markdown).map_err(|err| err.to_string())?;

    let mut written_assets = Vec::new();
    for asset in rendered.image_assets {
        let asset_path = output_path
            .parent()
            .unwrap_or(sync_root)
            .join(&asset.relative_path);
        if let Some(parent) = asset_path.parent() {
            fs::create_dir_all(parent).map_err(|err| err.to_string())?;
        }
        if !asset_path.exists() {
            fs::write(&asset_path, asset.bytes).map_err(|err| err.to_string())?;
        }
        written_assets.push(asset.relative_path);
    }

    let content_hash = stable_hash(rendered.markdown.as_bytes());
    let source_signature = source_signature(&canonical);
    let mut manifest = load_manifest(sync_root)?;
    upsert_manifest_record(
        &mut manifest,
        ManifestRecord {
            document_id: canonical.document_id.clone(),
            space_id: canonical.space_id.clone(),
            title: canonical.title.clone(),
            output_path: output_path.to_string_lossy().to_string(),
            content_hash: content_hash.clone(),
            source_signature: source_signature.clone(),
            status: "success".into(),
            image_assets: written_assets.clone(),
            last_synced_at: format!("{:?}", std::time::SystemTime::now()),
        },
    );
    save_manifest(sync_root, &manifest)?;

    Ok(SyncWriteResult {
        output_path: output_path.to_string_lossy().to_string(),
        image_assets: written_assets,
        content_hash,
        source_signature,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::CanonicalBlock;
    use std::{env, time::{SystemTime, UNIX_EPOCH}};

    #[test]
    fn maps_raw_document_to_canonical_model() {
        let document =
            fetch_canonical_document("doc-eng-api", "user-feishu-mcp", None)
                .expect("canonical fetch should succeed");

        assert_eq!(document.document_id, "doc-eng-api");
        assert_eq!(document.space_id, "kb-eng");
        assert_eq!(document.title, "研发API概览");
        assert!(matches!(document.blocks[0], CanonicalBlock::Heading { .. }));
        assert!(matches!(document.blocks[2], CanonicalBlock::Image { .. }));
    }

    #[test]
    fn syncs_document_to_disk_and_updates_manifest() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time works")
            .as_millis();
        let sync_root = env::temp_dir().join(format!("feishu-sync-output-{unique}"));

        let result = sync_document_to_disk("doc-eng-api", &sync_root, "_assets", "user-feishu-mcp", None)
            .expect("sync to disk should succeed");

        assert!(result.output_path.ends_with(".md"));
        assert_eq!(result.image_assets.len(), 1);
    }
}
