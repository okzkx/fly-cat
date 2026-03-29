use crate::mcp::{
    fetch_openapi_with_retry, fetch_with_retry, FeishuOpenApiClient, FeishuOpenApiConfig,
    FixtureMcpClient, McpError, RawBlock, RetryPolicy,
};
use crate::model::{CanonicalBlock, CanonicalDocument, ManifestRecord, SyncManifest, SyncSourceDocument};
use crate::render::{markdown_output_path, render_markdown, source_signature, stable_hash};
use crate::storage::{load_manifest, save_manifest, upsert_manifest_record};
use chrono::Utc;
use std::{fs, path::Path, time::Duration};

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

#[derive(Clone, Debug)]
pub struct SyncPipelineError {
    pub stage: String,
    pub message: String,
}

impl std::fmt::Display for SyncPipelineError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for SyncPipelineError {}

fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

/// Map Feishu obj_type to the default export file extension.
pub fn default_extension(obj_type: &str) -> &'static str {
    match obj_type.trim().to_ascii_lowercase().as_str() {
        "doc" | "docx" => "docx",
        "sheet" | "bitable" => "xlsx",
        "mindnote" => "pdf",
        "slides" => "pptx",
        _ => "docx",
    }
}

/// Export a document via the Feishu Export Task API (server-side rendering).
/// Returns a ManifestRecord; the caller is responsible for writing it to the manifest.
pub fn sync_document_via_export(
    source_document: &SyncSourceDocument,
    sync_root: &Path,
    openapi_config: &FeishuOpenApiConfig,
    manifest: &SyncManifest,
) -> Result<ManifestRecord, SyncPipelineError> {
    let obj_type = if source_document.obj_type.is_empty() { "docx" } else { &source_document.obj_type };
    let extension = default_extension(obj_type);
    let client = FeishuOpenApiClient::new(openapi_config.clone());

    // Step 1: Create export task
    let response = client
        .create_export_task(&source_document.document_id, extension, obj_type)
        .map_err(classify_export_error)?;
    let ticket = response.ticket;

    // Step 2: Poll until done (max 60s)
    let result = loop {
        match client.get_export_task_status(&ticket, &source_document.document_id) {
            Ok(Some(result)) => break result,
            Ok(None) => std::thread::sleep(Duration::from_secs(1)),
            Err(err) => return Err(classify_export_error(err)),
        }
    };

    // Step 3: Download the exported file
    let file_bytes = client
        .download_export_file(&result.file_token)
        .map_err(classify_export_error)?;

    // Step 4: Build output path preserving directory structure
    let file_name = format!("{}.{}", source_document.title, extension);
    let output_path = if source_document.path_segments.is_empty() {
        sync_root.join(&file_name)
    } else {
        sync_root.join(source_document.path_segments.join("/")).join(&file_name)
    };
    let output_path_string = output_path.to_string_lossy().to_string();

    // Remove previous output if path changed
    if let Some(previous_output_path) = manifest
        .records
        .iter()
        .find(|record| record.document_id == source_document.document_id)
        .map(|record| record.output_path.clone())
    {
        if previous_output_path != output_path_string && Path::new(&previous_output_path).exists() {
            let _ = fs::remove_file(previous_output_path);
        }
    }

    if let Some(parent) = output_path.parent() {
        fs::create_dir_all(parent).map_err(filesystem_error)?;
    }
    fs::write(&output_path, &file_bytes).map_err(filesystem_error)?;

    let content_hash = stable_hash(&file_bytes);

    Ok(ManifestRecord {
        document_id: source_document.document_id.clone(),
        space_id: source_document.space_id.clone(),
        space_name: source_document.space_name.clone(),
        node_token: source_document.node_token.clone(),
        title: source_document.title.clone(),
        version: source_document.version.clone(),
        update_time: source_document.update_time.clone(),
        source_path: source_document.source_path.clone(),
        path_segments: source_document.path_segments.clone(),
        output_path: output_path_string,
        content_hash,
        source_signature: format!("export:{extension}"),
        status: "success".into(),
        image_assets: Vec::new(),
        last_synced_at: now_iso(),
    })
}

fn classify_export_error(error: McpError) -> SyncPipelineError {
    let message = error.to_string();
    let stage = if is_auth_related_message(&message) {
        "auth"
    } else {
        "export-task"
    };
    SyncPipelineError {
        stage: stage.into(),
        message,
    }
}

fn is_auth_related_message(message: &str) -> bool {
    let normalized = message.to_lowercase();
    [
        "access denied",
        "authorization",
        "unauthorized",
        "permission",
        "scope",
        "token",
        "登录",
        "授权",
        "权限",
    ]
    .iter()
    .any(|keyword| normalized.contains(keyword))
}

fn classify_fetch_error(error: McpError) -> SyncPipelineError {
    let message = error.to_string();
    let stage = if is_auth_related_message(&message) {
        "auth"
    } else {
        "content-fetch"
    };
    SyncPipelineError {
        stage: stage.into(),
        message,
    }
}

fn classify_render_error(error: McpError) -> SyncPipelineError {
    let message = error.to_string();
    let lower = message.to_lowercase();
    let stage = if is_auth_related_message(&message) {
        "auth"
    } else if lower.contains("image") || lower.contains("media") {
        "image-resolution"
    } else {
        "markdown-render"
    };
    SyncPipelineError {
        stage: stage.into(),
        message,
    }
}

fn filesystem_error(err: std::io::Error) -> SyncPipelineError {
    SyncPipelineError {
        stage: "filesystem-write".into(),
        message: err.to_string(),
    }
}

fn storage_error(err: String) -> SyncPipelineError {
    SyncPipelineError {
        stage: "filesystem-write".into(),
        message: err,
    }
}

/// Fetch, render, and write a document to disk without updating the manifest.
/// Returns the write result for the caller to batch-update the manifest later.
pub fn sync_document_content(
    source_document: &SyncSourceDocument,
    sync_root: &Path,
    image_dir_name: &str,
    mcp_server_name: &str,
    openapi_config: Option<&FeishuOpenApiConfig>,
    manifest: &SyncManifest,
) -> Result<(SyncWriteResult, ManifestRecord), SyncPipelineError> {
    let canonical =
        fetch_canonical_document(&source_document.document_id, mcp_server_name, openapi_config)
            .map_err(classify_fetch_error)?;
    let output_path = markdown_output_path(sync_root, source_document);
    let markdown_dir = output_path.parent().unwrap_or(sync_root);
    let rendered = if let Some(config) = openapi_config {
        let client = FeishuOpenApiClient::new(config.clone());
        render_markdown(&canonical, markdown_dir, image_dir_name, &client).map_err(classify_render_error)?
    } else {
        let client = FixtureMcpClient::new(mcp_server_name.to_string());
        render_markdown(&canonical, markdown_dir, image_dir_name, &client).map_err(classify_render_error)?
    };
    let output_path_string = output_path.to_string_lossy().to_string();

    if let Some(parent) = output_path.parent() {
        fs::create_dir_all(parent).map_err(filesystem_error)?;
    }
    if let Some(previous_output_path) = manifest
        .records
        .iter()
        .find(|record| record.document_id == source_document.document_id)
        .map(|record| record.output_path.clone())
    {
        if previous_output_path != output_path_string && Path::new(&previous_output_path).exists() {
            let _ = fs::remove_file(previous_output_path);
        }
    }

    fs::write(&output_path, &rendered.markdown).map_err(filesystem_error)?;

    let mut written_assets = Vec::new();
    for asset in rendered.image_assets {
        let asset_path = output_path
            .parent()
            .unwrap_or(sync_root)
            .join(&asset.relative_path);
        if let Some(parent) = asset_path.parent() {
            fs::create_dir_all(parent).map_err(filesystem_error)?;
        }
        if !asset_path.exists() {
            fs::write(&asset_path, asset.bytes).map_err(filesystem_error)?;
        }
        written_assets.push(asset.relative_path);
    }

    let content_hash = stable_hash(rendered.markdown.as_bytes());
    let source_signature = source_signature(&canonical);
    let record = ManifestRecord {
        document_id: source_document.document_id.clone(),
        space_id: source_document.space_id.clone(),
        space_name: source_document.space_name.clone(),
        node_token: source_document.node_token.clone(),
        title: source_document.title.clone(),
        version: source_document.version.clone(),
        update_time: source_document.update_time.clone(),
        source_path: source_document.source_path.clone(),
        path_segments: source_document.path_segments.clone(),
        output_path: output_path_string.clone(),
        content_hash: content_hash.clone(),
        source_signature: source_signature.clone(),
        status: "success".into(),
        image_assets: written_assets.clone(),
        last_synced_at: now_iso(),
    };

    Ok((SyncWriteResult {
        output_path: output_path_string,
        image_assets: written_assets,
        content_hash,
        source_signature,
    }, record))
}

pub fn sync_document_to_disk(
    source_document: &SyncSourceDocument,
    sync_root: &Path,
    image_dir_name: &str,
    mcp_server_name: &str,
    openapi_config: Option<&FeishuOpenApiConfig>,
) -> Result<SyncWriteResult, SyncPipelineError> {
    let manifest = load_manifest(sync_root).unwrap_or_default();
    let (result, record) = sync_document_content(source_document, sync_root, image_dir_name, mcp_server_name, openapi_config, &manifest)?;
    let mut manifest = manifest;
    upsert_manifest_record(&mut manifest, record);
    save_manifest(sync_root, &manifest).map_err(storage_error)?;
    Ok(result)
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

        let source = SyncSourceDocument {
            document_id: "doc-eng-api".into(),
            space_id: "kb-eng".into(),
            space_name: "研发知识库".into(),
            node_token: "node-doc-eng-api".into(),
            title: "研发API概览".into(),
            version: "v1".into(),
            update_time: "t1".into(),
            path_segments: vec!["研发规范".into(), "研发API概览".into()],
            source_path: "研发知识库/研发规范/研发API概览".into(),
            obj_type: String::new(),
        };

        let result = sync_document_to_disk(&source, &sync_root, "_assets", "user-feishu-mcp", None)
            .expect("sync to disk should succeed");

        assert!(result.output_path.ends_with(".md"));
        assert_eq!(result.image_assets.len(), 1);
    }

    #[test]
    fn classifies_permission_fetch_failures_as_auth() {
        let error = classify_fetch_error(McpError::Transport(
            "Access denied. One of the following scopes is required".into(),
        ));

        assert_eq!(error.stage, "auth");
    }

    #[test]
    fn classifies_media_render_failures_as_image_resolution() {
        let error = classify_render_error(McpError::Transport(
            "Image resource `media-1` not found".into(),
        ));

        assert_eq!(error.stage, "image-resolution");
    }
}
