use crate::mcp::{
    exchange_user_access_token, fetch_user_info, refresh_user_access_token, FeishuOAuthTokenInfo,
    FeishuOpenApiClient, FeishuOpenApiConfig, McpError,
};
use crate::model::SyncSourceDocument;
use crate::storage::{
    load_manifest, remove_manifest_records, save_manifest, upsert_manifest_record,
};
use crate::sync::{
    expected_output_path, sync_document_content, sync_document_via_export, SyncPipelineError,
};
use chrono::{Local, TimeZone, Utc};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::{Component, Path, PathBuf},
    sync::Mutex,
    thread,
    time::Duration,
};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_opener::OpenerExt;
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncCounters {
    pub total: u32,
    pub processed: u32,
    pub succeeded: u32,
    pub skipped: u32,
    pub failed: u32,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncRunError {
    pub document_id: String,
    pub title: String,
    pub category: String,
    pub message: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncFailureSummary {
    pub category: String,
    pub message: String,
    pub count: u32,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncTask {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub selected_spaces: Vec<String>,
    #[serde(default)]
    pub selected_sources: Vec<SelectedSyncScope>,
    #[serde(default)]
    pub selection_summary: Option<SyncSelectionSummary>,
    #[serde(default)]
    pub selected_scope: Option<SelectedSyncScope>,
    pub output_path: String,
    pub status: String,
    pub progress: u32,
    pub counters: SyncCounters,
    pub lifecycle_state: String,
    #[serde(default)]
    pub discovered_document_ids: Vec<String>,
    pub errors: Vec<SyncRunError>,
    pub failure_summary: Option<SyncFailureSummary>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub name: String,
    pub avatar: Option<String>,
    pub email: Option<String>,
    pub user_id: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredUserSession {
    pub access_token: String,
    pub refresh_token: String,
    pub access_token_expires_at: i64,
    pub refresh_token_expires_at: i64,
    pub scope: Option<String>,
    pub user: UserInfo,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub app_id: String,
    pub app_secret: String,
    pub endpoint: String,
    pub sync_root: String,
    pub mcp_server_name: String,
    pub image_dir_name: String,
    pub wiki_space_ids: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeBaseSpace {
    pub id: String,
    pub name: String,
    pub selected: bool,
}

#[derive(Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SelectedSyncScope {
    pub kind: String,
    pub space_id: String,
    pub space_name: String,
    pub title: String,
    pub display_path: String,
    pub node_token: Option<String>,
    pub document_id: Option<String>,
    #[serde(default)]
    pub path_segments: Vec<String>,
    #[serde(default)]
    pub includes_descendants: bool,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncSelectionSummary {
    pub kind: String,
    pub space_id: String,
    pub space_name: String,
    pub title: String,
    pub display_path: String,
    pub document_count: u32,
    #[serde(default)]
    pub preview_paths: Vec<String>,
    #[serde(default)]
    pub includes_descendants: bool,
    #[serde(default)]
    pub root_count: u32,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeBaseNode {
    pub key: String,
    pub kind: String,
    pub space_id: String,
    pub space_name: String,
    pub title: String,
    pub display_path: String,
    pub node_token: String,
    pub document_id: Option<String>,
    #[serde(default)]
    pub path_segments: Vec<String>,
    /// Revision from wiki child-node list (fallback remote display before freshness).
    #[serde(default)]
    pub wiki_list_version: String,
    pub has_children: bool,
    pub is_expandable: bool,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub children: Vec<KnowledgeBaseNode>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionValidation {
    pub status: String,
    pub usable: bool,
    pub message: String,
    pub diagnostics: Option<String>,
    pub spaces_loaded: bool,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionCheckResult {
    pub user: Option<UserInfo>,
    pub spaces: Vec<KnowledgeBaseSpace>,
    pub validation: ConnectionValidation,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppBootstrap {
    pub settings: Option<AppSettings>,
    pub resolved_sync_root: Option<String>,
    pub user: Option<UserInfo>,
    pub spaces: Vec<KnowledgeBaseSpace>,
    pub connection_validation: Option<ConnectionValidation>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSyncTaskRequest {
    #[serde(default)]
    pub selected_sources: Vec<SelectedSyncScope>,
    pub output_path: String,
}

#[derive(Default)]
pub struct AppState {
    pub tasks: Mutex<Vec<SyncTask>>,
    pub running_task_ids: Mutex<HashSet<String>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeInfo {
    pub runtime: &'static str,
    pub version: &'static str,
}

fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

fn format_iso_for_task_name(value: &str) -> String {
    chrono::DateTime::parse_from_rfc3339(value)
        .map(|datetime| {
            datetime
                .with_timezone(&Local)
                .format("%Y-%m-%d %H:%M:%S")
                .to_string()
        })
        .unwrap_or_else(|_| value.to_string())
}

fn build_task_name(created_at: &str) -> String {
    format!("同步任务 - {}", format_iso_for_task_name(created_at))
}

fn now_epoch_seconds() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or(0)
}

fn parse_legacy_system_time_debug(value: &str) -> Option<String> {
    let intervals = value
        .strip_prefix("SystemTime { intervals: ")?
        .strip_suffix(" }")?
        .trim()
        .parse::<i128>()
        .ok()?;
    let unix_intervals = intervals.checked_sub(116_444_736_000_000_000)?;
    let seconds = (unix_intervals / 10_000_000) as i64;
    let nanos = ((unix_intervals % 10_000_000) * 100) as u32;
    Utc.timestamp_opt(seconds, nanos)
        .single()
        .map(|datetime| datetime.to_rfc3339())
}

fn normalize_timestamp_string(value: &str) -> String {
    if let Ok(datetime) = chrono::DateTime::parse_from_rfc3339(value) {
        return datetime.with_timezone(&Utc).to_rfc3339();
    }

    parse_legacy_system_time_debug(value).unwrap_or_else(now_iso)
}

fn normalize_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                normalized.pop();
            }
            Component::Prefix(prefix) => normalized.push(prefix.as_os_str()),
            Component::RootDir => normalized.push(component.as_os_str()),
            Component::Normal(part) => normalized.push(part),
        }
    }
    normalized
}

fn default_sync_root_base(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(path) = app.path().document_dir() {
        return Ok(path);
    }

    std::env::current_dir().map_err(|err| err.to_string())
}

fn resolve_sync_root_from_base(base: &Path, configured_path: &str) -> Result<PathBuf, String> {
    let configured = configured_path.trim();
    if configured.is_empty() {
        return Err("请输入同步目录".into());
    }

    let path = PathBuf::from(configured);
    let resolved = if path.is_absolute() {
        path
    } else {
        base.join(path)
    };

    Ok(normalize_path(&resolved))
}

fn resolve_sync_root_path(app: &AppHandle, configured_path: &str) -> Result<PathBuf, String> {
    resolve_sync_root_from_base(&default_sync_root_base(app)?, configured_path)
}

fn resolve_sync_root_string(app: &AppHandle, configured_path: &str) -> Result<String, String> {
    Ok(resolve_sync_root_path(app, configured_path)?
        .to_string_lossy()
        .replace('\\', "/"))
}

fn summarize_failure_category(category: &str) -> &'static str {
    match category {
        "auth" => "授权",
        "discovery" => "发现",
        "content-fetch" => "内容抓取",
        "markdown-render" => "Markdown 渲染",
        "image-resolution" => "图片处理",
        "filesystem-write" => "文件写入",
        _ => "未知",
    }
}

fn is_auth_message(message: &str) -> bool {
    let normalized = message.to_lowercase();
    [
        "authorization",
        "unauthorized",
        "access denied",
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

fn build_failure_summary(errors: &[SyncRunError]) -> Option<SyncFailureSummary> {
    if errors.is_empty() {
        return None;
    }

    let mut counts: HashMap<&str, u32> = HashMap::new();
    for error in errors {
        *counts.entry(error.category.as_str()).or_default() += 1;
    }

    let (dominant_category, count) = counts
        .into_iter()
        .max_by_key(|(_, count)| *count)
        .map(|(category, count)| (category.to_string(), count))?;
    let sample_error = errors
        .iter()
        .find(|error| error.category == dominant_category)
        .unwrap_or(&errors[0]);

    let message = if count == errors.len() as u32 {
        format!(
            "本次失败主要发生在{}阶段（{}项）。{}",
            summarize_failure_category(&dominant_category),
            count,
            sample_error.message
        )
    } else {
        format!(
            "本次共有 {} 项失败，主要集中在{}阶段（{}项）。{}",
            errors.len(),
            summarize_failure_category(&dominant_category),
            count,
            sample_error.message
        )
    };

    Some(SyncFailureSummary {
        category: dominant_category,
        message,
        count,
    })
}

fn settings_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    Ok(app_data_dir.join("app-settings.json"))
}

fn session_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    Ok(app_data_dir.join("auth-session.json"))
}

fn load_json_file<T>(path: PathBuf) -> Result<Option<T>, String>
where
    T: for<'de> Deserialize<'de>,
{
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(path).map_err(|err| err.to_string())?;
    let parsed = serde_json::from_str(&content).map_err(|err| err.to_string())?;
    Ok(Some(parsed))
}

fn save_json_file<T>(path: PathBuf, value: &T) -> Result<(), String>
where
    T: Serialize,
{
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    let content = serde_json::to_string_pretty(value).map_err(|err| err.to_string())?;
    fs::write(path, content).map_err(|err| err.to_string())
}

fn load_user_session(app: &AppHandle) -> Result<Option<StoredUserSession>, String> {
    load_json_file(session_file_path(app)?)
}

fn save_user_session(app: &AppHandle, session: &StoredUserSession) -> Result<(), String> {
    save_json_file(session_file_path(app)?, session)
}

fn clear_user_session(app: &AppHandle) -> Result<(), String> {
    let session_path = session_file_path(app)?;
    if session_path.exists() {
        fs::remove_file(session_path).map_err(|err| err.to_string())?;
    }
    Ok(())
}

fn tasks_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    Ok(app_data_dir.join("sync-tasks.json"))
}

fn load_tasks_from_disk(app: &AppHandle) -> Result<Vec<SyncTask>, String> {
    let file_path = tasks_file_path(app)?;
    if !file_path.exists() {
        return Ok(vec![]);
    }
    let content = fs::read_to_string(&file_path).map_err(|err| err.to_string())?;
    let mut tasks: Vec<SyncTask> = serde_json::from_str(&content).map_err(|err| err.to_string())?;
    for task in &mut tasks {
        normalize_task(task, app)?;
    }
    Ok(tasks)
}

fn save_tasks_to_disk(app: &AppHandle, tasks: &[SyncTask]) -> Result<(), String> {
    let file_path = tasks_file_path(app)?;
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    let content = serde_json::to_string_pretty(tasks).map_err(|err| err.to_string())?;
    fs::write(file_path, content).map_err(|err| err.to_string())
}

fn with_tasks<T, F>(app: &AppHandle, state: State<'_, AppState>, updater: F) -> Result<T, String>
where
    F: FnOnce(&mut Vec<SyncTask>) -> Result<T, String>,
{
    let mut tasks = state.tasks.lock().map_err(|err| err.to_string())?;
    if tasks.is_empty() {
        *tasks = load_tasks_from_disk(app)?;
    }
    let result = updater(&mut tasks)?;
    save_tasks_to_disk(app, &tasks)?;
    Ok(result)
}

fn emit_task_event(app: &AppHandle, event_name: &str, task: &SyncTask) {
    let _ = app.emit(event_name, task.clone());
}

fn build_scope_key(kind: &str, space_id: &str, identifier: &str) -> String {
    format!("{kind}:{space_id}:{identifier}")
}

fn join_display_path(space_name: &str, path_segments: &[String]) -> String {
    if path_segments.is_empty() {
        space_name.to_string()
    } else {
        format!("{space_name} / {}", path_segments.join(" / "))
    }
}

fn selected_source_key(source: &SelectedSyncScope) -> String {
    match source.kind.as_str() {
        "space" => format!("space:{}", source.space_id),
        "document" => format!(
            "document:{}:{}",
            source.space_id,
            source
                .document_id
                .clone()
                .unwrap_or_else(|| source.title.clone())
        ),
        _ => format!(
            "{}:{}:{}",
            source.kind,
            source.space_id,
            source
                .node_token
                .clone()
                .unwrap_or_else(|| source.title.clone())
        ),
    }
}

fn dedupe_selected_sources(selected_sources: &[SelectedSyncScope]) -> Vec<SelectedSyncScope> {
    let mut index_by_key: HashMap<String, usize> = HashMap::new();
    let mut deduped: Vec<SelectedSyncScope> = Vec::new();
    for source in selected_sources {
        let key = selected_source_key(source);
        if let Some(index) = index_by_key.get(&key).copied() {
            if let Some(existing) = deduped.get_mut(index) {
                if source.includes_descendants && !existing.includes_descendants {
                    *existing = source.clone();
                }
            }
        } else {
            index_by_key.insert(key, deduped.len());
            deduped.push(source.clone());
        }
    }
    deduped
}

fn source_has_covered_descendants(source: &SelectedSyncScope) -> bool {
    source.kind == "space"
        || source.kind == "folder"
        || (source.kind == "document" && source.includes_descendants)
}

fn source_covers_descendant(ancestor: &SelectedSyncScope, descendant: &SelectedSyncScope) -> bool {
    if !source_has_covered_descendants(ancestor) || ancestor.space_id != descendant.space_id {
        return false;
    }
    if selected_source_key(ancestor) == selected_source_key(descendant) {
        return false;
    }
    if ancestor.kind == "space" {
        return descendant.kind != "space";
    }
    if ancestor.kind == "document" && descendant.kind != "document" && descendant.kind != "bitable"
    {
        return false;
    }
    ancestor.path_segments.len() < descendant.path_segments.len()
        && ancestor
            .path_segments
            .iter()
            .zip(descendant.path_segments.iter())
            .all(|(ancestor_segment, descendant_segment)| ancestor_segment == descendant_segment)
}

fn normalize_selected_sources(selected_sources: &[SelectedSyncScope]) -> Vec<SelectedSyncScope> {
    let mut normalized = Vec::new();
    for source in dedupe_selected_sources(selected_sources) {
        if normalized
            .iter()
            .any(|existing| source_covers_descendant(existing, &source))
        {
            continue;
        }
        if source_has_covered_descendants(&source) {
            normalized.retain(|existing| !source_covers_descendant(&source, existing));
        }
        normalized.push(source);
    }
    normalized
}

fn legacy_selected_scope(selected_sources: &[SelectedSyncScope]) -> Option<SelectedSyncScope> {
    (selected_sources.len() == 1).then(|| selected_sources[0].clone())
}

fn build_selection_summary(
    selected_sources: &[SelectedSyncScope],
    selected_scope: Option<&SelectedSyncScope>,
    effective_document_count: Option<u32>,
) -> Option<SyncSelectionSummary> {
    let sources = dedupe_selected_sources(selected_sources);
    if sources.is_empty() {
        return selected_scope.map(|scope| SyncSelectionSummary {
            kind: scope.kind.clone(),
            space_id: scope.space_id.clone(),
            space_name: scope.space_name.clone(),
            title: scope.title.clone(),
            display_path: scope.display_path.clone(),
            document_count: u32::from(scope.kind == "document" || scope.kind == "bitable"),
            preview_paths: vec![scope.display_path.clone()],
            includes_descendants: scope.includes_descendants,
            root_count: 1,
        });
    }

    if sources.len() == 1 {
        let source = &sources[0];
        return Some(SyncSelectionSummary {
            kind: source.kind.clone(),
            space_id: source.space_id.clone(),
            space_name: source.space_name.clone(),
            title: source.title.clone(),
            display_path: source.display_path.clone(),
            document_count: effective_document_count.unwrap_or(u32::from(
                source.kind == "document" || source.kind == "bitable",
            )),
            preview_paths: vec![source.display_path.clone()],
            includes_descendants: source.includes_descendants,
            root_count: 1,
        });
    }

    let first = &sources[0];
    let all_documents = sources.iter().all(|source| source.kind == "document");
    let includes_descendants = sources.iter().any(|source| source.includes_descendants);
    let root_count = sources.len() as u32;
    Some(SyncSelectionSummary {
        kind: if all_documents {
            "multi-document".into()
        } else {
            "multi-source".into()
        },
        space_id: first.space_id.clone(),
        space_name: first.space_name.clone(),
        title: if all_documents {
            if includes_descendants {
                format!("{} 文档分支同步", first.space_name)
            } else {
                format!("{} 多文档同步", first.space_name)
            }
        } else {
            format!("{} 多来源同步", first.space_name)
        },
        display_path: if includes_descendants {
            if all_documents {
                format!("{}（已选 {} 个文档分支）", first.space_name, root_count)
            } else {
                format!("{}（已选 {} 个同步根）", first.space_name, root_count)
            }
        } else {
            if all_documents {
                format!("{}（已选 {} 篇文档）", first.space_name, root_count)
            } else {
                format!("{}（已选 {} 个同步根）", first.space_name, root_count)
            }
        },
        document_count: effective_document_count.unwrap_or(root_count),
        preview_paths: sources
            .iter()
            .take(3)
            .map(|source| source.display_path.clone())
            .collect(),
        includes_descendants,
        root_count,
    })
}

fn normalize_task(task: &mut SyncTask, app: &AppHandle) -> Result<(), String> {
    task.created_at = normalize_timestamp_string(&task.created_at);
    task.updated_at = normalize_timestamp_string(&task.updated_at);
    if task.name.contains("SystemTime") {
        task.name = build_task_name(&task.created_at);
    }
    let selected_sources = if task.selected_sources.is_empty() {
        task.selected_scope.clone().into_iter().collect::<Vec<_>>()
    } else {
        task.selected_sources.clone()
    };
    task.selected_sources = normalize_selected_sources(&selected_sources);
    if task.selected_scope.is_none() {
        task.selected_scope = legacy_selected_scope(&task.selected_sources);
    }
    task.selection_summary = task.selection_summary.clone().or_else(|| {
        build_selection_summary(
            &task.selected_sources,
            task.selected_scope.as_ref(),
            (task.counters.total > 0).then_some(task.counters.total),
        )
    });
    if !Path::new(&task.output_path).is_absolute() {
        task.output_path = resolve_sync_root_string(app, &task.output_path)?;
    }
    if task.selected_spaces.is_empty() {
        let mut unique_spaces = Vec::new();
        for source in &task.selected_sources {
            if !unique_spaces.contains(&source.space_id) {
                unique_spaces.push(source.space_id.clone());
            }
        }
        if unique_spaces.is_empty() {
            if let Some(scope) = task.selected_scope.as_ref() {
                unique_spaces.push(scope.space_id.clone());
            }
        }
        task.selected_spaces = unique_spaces;
    }
    task.failure_summary = build_failure_summary(&task.errors);
    task.counters.failed = task.errors.len() as u32;
    task.counters.succeeded = task
        .counters
        .processed
        .saturating_sub(task.counters.skipped + task.counters.failed);
    Ok(())
}

fn effective_selected_sources(task: &SyncTask) -> Vec<SelectedSyncScope> {
    if !task.selected_sources.is_empty() {
        return normalize_selected_sources(&task.selected_sources);
    }
    task.selected_scope.clone().into_iter().collect()
}

fn validate_selected_sources(
    selected_sources: &[SelectedSyncScope],
) -> Result<Vec<SelectedSyncScope>, String> {
    let normalized = normalize_selected_sources(selected_sources);
    if normalized.is_empty() {
        return Err("请先选择一个同步范围。".into());
    }

    if normalized.len() > 1 {
        let space_id = normalized[0].space_id.clone();
        if normalized.iter().any(|source| source.space_id != space_id) {
            return Err("一次只能在同一知识库内组合选择目录或文档。".into());
        }
    }

    for source in &normalized {
        if (source.kind == "document" || source.kind == "bitable")
            && source
                .document_id
                .as_deref()
                .unwrap_or("")
                .trim()
                .is_empty()
        {
            return Err("缺少文档标识，无法创建同步任务。".into());
        }
    }

    Ok(normalized)
}

fn node_kind_from_obj_type(obj_type: &str, has_children: bool) -> String {
    let normalized = obj_type.trim().to_ascii_lowercase();
    match normalized.as_str() {
        "docx" => "document",
        "wiki" | "folder" => "folder",
        "bitable" | "sheet" => "bitable",
        _ if has_children => "folder",
        _ => "bitable",
    }
    .to_string()
}

fn is_expandable_node(kind: &str, has_children: bool) -> bool {
    has_children && kind != "bitable"
}

fn clone_collapsed_nodes(nodes: &[KnowledgeBaseNode]) -> Vec<KnowledgeBaseNode> {
    nodes
        .iter()
        .map(|node| KnowledgeBaseNode {
            key: node.key.clone(),
            kind: node.kind.clone(),
            space_id: node.space_id.clone(),
            space_name: node.space_name.clone(),
            title: node.title.clone(),
            display_path: node.display_path.clone(),
            node_token: node.node_token.clone(),
            document_id: node.document_id.clone(),
            path_segments: node.path_segments.clone(),
            wiki_list_version: node.wiki_list_version.clone(),
            has_children: node.has_children,
            is_expandable: node.is_expandable,
            children: vec![],
        })
        .collect()
}

fn find_tree_node_by_token<'a>(
    nodes: &'a [KnowledgeBaseNode],
    node_token: &str,
) -> Option<&'a KnowledgeBaseNode> {
    let mut stack = nodes.iter().collect::<Vec<_>>();
    while let Some(node) = stack.pop() {
        if node.node_token == node_token {
            return Some(node);
        }
        stack.extend(node.children.iter());
    }
    None
}

#[cfg(test)]
fn make_fixture_document(
    space_id: &str,
    space_name: &str,
    node_token: &str,
    document_id: &str,
    path_segments: &[&str],
    version: &str,
    update_time: &str,
) -> SyncSourceDocument {
    let title = path_segments
        .last()
        .copied()
        .unwrap_or(document_id)
        .to_string();
    let path_segments = path_segments
        .iter()
        .map(|segment| (*segment).to_string())
        .collect::<Vec<_>>();
    SyncSourceDocument {
        document_id: document_id.into(),
        space_id: space_id.into(),
        space_name: space_name.into(),
        node_token: node_token.into(),
        title,
        version: version.into(),
        update_time: update_time.into(),
        source_path: join_display_path(space_name, &path_segments).replace(" / ", "/"),
        path_segments,
        obj_type: String::new(),
    }
}

fn fixture_space_tree(space_id: &str) -> Vec<KnowledgeBaseNode> {
    match space_id {
        "kb-eng" => vec![KnowledgeBaseNode {
            key: build_scope_key("folder", "kb-eng", "eng-guides"),
            kind: "folder".into(),
            space_id: "kb-eng".into(),
            space_name: "研发知识库".into(),
            title: "研发规范".into(),
            display_path: "研发知识库 / 研发规范".into(),
            node_token: "eng-guides".into(),
            document_id: None,
            path_segments: vec!["研发规范".into()],
            wiki_list_version: String::new(),
            has_children: true,
            is_expandable: true,
            children: vec![
                KnowledgeBaseNode {
                    key: build_scope_key("document", "kb-eng", "doc-eng-architecture"),
                    kind: "document".into(),
                    space_id: "kb-eng".into(),
                    space_name: "研发知识库".into(),
                    title: "研发架构设计".into(),
                    display_path: "研发知识库 / 研发规范 / 研发架构设计".into(),
                    node_token: "node-doc-eng-architecture".into(),
                    document_id: Some("doc-eng-architecture".into()),
                    path_segments: vec!["研发规范".into(), "研发架构设计".into()],
                    wiki_list_version: "v1".into(),
                    has_children: false,
                    is_expandable: false,
                    children: vec![],
                },
                KnowledgeBaseNode {
                    key: build_scope_key("document", "kb-eng", "doc-eng-api"),
                    kind: "document".into(),
                    space_id: "kb-eng".into(),
                    space_name: "研发知识库".into(),
                    title: "研发API概览".into(),
                    display_path: "研发知识库 / 研发规范 / 研发API概览".into(),
                    node_token: "node-doc-eng-api".into(),
                    document_id: Some("doc-eng-api".into()),
                    path_segments: vec!["研发规范".into(), "研发API概览".into()],
                    wiki_list_version: "v1".into(),
                    has_children: false,
                    is_expandable: false,
                    children: vec![],
                },
            ],
        }],
        "kb-product" => vec![KnowledgeBaseNode {
            key: build_scope_key("folder", "kb-product", "product-library"),
            kind: "folder".into(),
            space_id: "kb-product".into(),
            space_name: "产品知识库".into(),
            title: "方案库".into(),
            display_path: "产品知识库 / 方案库".into(),
            node_token: "product-library".into(),
            document_id: None,
            path_segments: vec!["方案库".into()],
            wiki_list_version: String::new(),
            has_children: true,
            is_expandable: true,
            children: vec![
                KnowledgeBaseNode {
                    key: build_scope_key("document", "kb-product", "doc-product-overview"),
                    kind: "document".into(),
                    space_id: "kb-product".into(),
                    space_name: "产品知识库".into(),
                    title: "Product Overview".into(),
                    display_path: "产品知识库 / 方案库 / Product Overview".into(),
                    node_token: "node-doc-product-overview".into(),
                    document_id: Some("doc-product-overview".into()),
                    path_segments: vec!["方案库".into(), "Product Overview".into()],
                    wiki_list_version: "v1".into(),
                    has_children: false,
                    is_expandable: false,
                    children: vec![],
                },
                KnowledgeBaseNode {
                    key: build_scope_key("document", "kb-product", "doc-product-roadmap"),
                    kind: "document".into(),
                    space_id: "kb-product".into(),
                    space_name: "产品知识库".into(),
                    title: "产品方案总览".into(),
                    display_path: "产品知识库 / 方案库 / 产品方案总览".into(),
                    node_token: "node-doc-product-roadmap".into(),
                    document_id: Some("doc-product-roadmap".into()),
                    path_segments: vec!["方案库".into(), "产品方案总览".into()],
                    wiki_list_version: "v1".into(),
                    has_children: true,
                    is_expandable: true,
                    children: vec![
                        KnowledgeBaseNode {
                            key: build_scope_key(
                                "document",
                                "kb-product",
                                "doc-product-roadmap-h1",
                            ),
                            kind: "document".into(),
                            space_id: "kb-product".into(),
                            space_name: "产品知识库".into(),
                            title: "2026 H1 路线图".into(),
                            display_path: "产品知识库 / 方案库 / 产品方案总览 / 2026 H1 路线图"
                                .into(),
                            node_token: "node-doc-product-roadmap-h1".into(),
                            document_id: Some("doc-product-roadmap-h1".into()),
                            path_segments: vec![
                                "方案库".into(),
                                "产品方案总览".into(),
                                "2026 H1 路线图".into(),
                            ],
                            wiki_list_version: "v1".into(),
                            has_children: false,
                            is_expandable: false,
                            children: vec![],
                        },
                        KnowledgeBaseNode {
                            key: build_scope_key(
                                "bitable",
                                "kb-product",
                                "bitable-product-demand-pool",
                            ),
                            kind: "bitable".into(),
                            space_id: "kb-product".into(),
                            space_name: "产品知识库".into(),
                            title: "需求池".into(),
                            display_path: "产品知识库 / 方案库 / 产品方案总览 / 需求池".into(),
                            node_token: "node-bitable-product-demand-pool".into(),
                            document_id: Some("bitable-product-demand-pool".into()),
                            path_segments: vec![
                                "方案库".into(),
                                "产品方案总览".into(),
                                "需求池".into(),
                            ],
                            wiki_list_version: "v1".into(),
                            has_children: false,
                            is_expandable: false,
                            children: vec![],
                        },
                    ],
                },
            ],
        }],
        "kb-ops" => vec![KnowledgeBaseNode {
            key: build_scope_key("document", "kb-ops", "doc-ops-playbook"),
            kind: "document".into(),
            space_id: "kb-ops".into(),
            space_name: "运维知识库".into(),
            title: "运维值班手册".into(),
            display_path: "运维知识库 / 运维值班手册".into(),
            node_token: "node-doc-ops-playbook".into(),
            document_id: Some("doc-ops-playbook".into()),
            path_segments: vec!["运维值班手册".into()],
            wiki_list_version: "v1".into(),
            has_children: false,
            is_expandable: false,
            children: vec![],
        }],
        _ => vec![],
    }
}

fn fixture_space_nodes(space_id: &str, parent_node_token: Option<&str>) -> Vec<KnowledgeBaseNode> {
    let tree = fixture_space_tree(space_id);
    match parent_node_token {
        Some(parent_node_token) => find_tree_node_by_token(&tree, parent_node_token)
            .map(|node| clone_collapsed_nodes(&node.children))
            .unwrap_or_default(),
        None => clone_collapsed_nodes(&tree),
    }
}

#[cfg(test)]
fn fixture_documents_for_scope(scope: &SelectedSyncScope) -> Vec<SyncSourceDocument> {
    match (
        scope.space_id.as_str(),
        scope.kind.as_str(),
        scope.document_id.as_deref(),
        scope.node_token.as_deref(),
    ) {
        ("kb-eng", "space", _, _) => vec![
            make_fixture_document(
                "kb-eng",
                "研发知识库",
                "node-doc-eng-architecture",
                "doc-eng-architecture",
                &["研发规范", "研发架构设计"],
                "v1",
                "2026-03-27T10:00:00Z",
            ),
            make_fixture_document(
                "kb-eng",
                "研发知识库",
                "node-doc-eng-api",
                "doc-eng-api",
                &["研发规范", "研发API概览"],
                "v2",
                "2026-03-27T10:05:00Z",
            ),
        ],
        ("kb-eng", "folder", _, Some("eng-guides")) => vec![
            make_fixture_document(
                "kb-eng",
                "研发知识库",
                "node-doc-eng-architecture",
                "doc-eng-architecture",
                &["研发规范", "研发架构设计"],
                "v1",
                "2026-03-27T10:00:00Z",
            ),
            make_fixture_document(
                "kb-eng",
                "研发知识库",
                "node-doc-eng-api",
                "doc-eng-api",
                &["研发规范", "研发API概览"],
                "v2",
                "2026-03-27T10:05:00Z",
            ),
        ],
        ("kb-eng", "document", Some("doc-eng-api"), _) => vec![make_fixture_document(
            "kb-eng",
            "研发知识库",
            "node-doc-eng-api",
            "doc-eng-api",
            &["研发规范", "研发API概览"],
            "v2",
            "2026-03-27T10:05:00Z",
        )],
        ("kb-eng", "document", Some("doc-eng-architecture"), _) => vec![make_fixture_document(
            "kb-eng",
            "研发知识库",
            "node-doc-eng-architecture",
            "doc-eng-architecture",
            &["研发规范", "研发架构设计"],
            "v1",
            "2026-03-27T10:00:00Z",
        )],
        ("kb-product", "space", _, _) | ("kb-product", "folder", _, Some("product-library")) => {
            vec![
                make_fixture_document(
                    "kb-product",
                    "产品知识库",
                    "node-doc-product-overview",
                    "doc-product-overview",
                    &["方案库", "Product Overview"],
                    "v3",
                    "2026-03-27T11:00:00Z",
                ),
                make_fixture_document(
                    "kb-product",
                    "产品知识库",
                    "node-doc-product-roadmap",
                    "doc-product-roadmap",
                    &["方案库", "产品方案总览"],
                    "v4",
                    "2026-03-27T11:05:00Z",
                ),
                make_fixture_document(
                    "kb-product",
                    "产品知识库",
                    "node-doc-product-roadmap-h1",
                    "doc-product-roadmap-h1",
                    &["方案库", "产品方案总览", "2026 H1 路线图"],
                    "v5",
                    "2026-03-27T11:10:00Z",
                ),
                SyncSourceDocument {
                    obj_type: "bitable".into(),
                    ..make_fixture_document(
                        "kb-product",
                        "产品知识库",
                        "node-bitable-product-demand-pool",
                        "bitable-product-demand-pool",
                        &["方案库", "产品方案总览", "需求池"],
                        "v6",
                        "2026-03-27T11:15:00Z",
                    )
                },
            ]
        }
        ("kb-product", "document", Some("doc-product-overview"), _) => vec![make_fixture_document(
            "kb-product",
            "产品知识库",
            "node-doc-product-overview",
            "doc-product-overview",
            &["方案库", "Product Overview"],
            "v3",
            "2026-03-27T11:00:00Z",
        )],
        ("kb-product", "document", Some("doc-product-roadmap"), _)
            if scope.includes_descendants =>
        {
            vec![
                make_fixture_document(
                    "kb-product",
                    "产品知识库",
                    "node-doc-product-roadmap",
                    "doc-product-roadmap",
                    &["方案库", "产品方案总览"],
                    "v4",
                    "2026-03-27T11:05:00Z",
                ),
                make_fixture_document(
                    "kb-product",
                    "产品知识库",
                    "node-doc-product-roadmap-h1",
                    "doc-product-roadmap-h1",
                    &["方案库", "产品方案总览", "2026 H1 路线图"],
                    "v5",
                    "2026-03-27T11:10:00Z",
                ),
                SyncSourceDocument {
                    obj_type: "bitable".into(),
                    ..make_fixture_document(
                        "kb-product",
                        "产品知识库",
                        "node-bitable-product-demand-pool",
                        "bitable-product-demand-pool",
                        &["方案库", "产品方案总览", "需求池"],
                        "v6",
                        "2026-03-27T11:15:00Z",
                    )
                },
            ]
        }
        ("kb-product", "document", Some("doc-product-roadmap"), _) => vec![make_fixture_document(
            "kb-product",
            "产品知识库",
            "node-doc-product-roadmap",
            "doc-product-roadmap",
            &["方案库", "产品方案总览"],
            "v4",
            "2026-03-27T11:05:00Z",
        )],
        ("kb-product", "bitable", Some("bitable-product-demand-pool"), _) => {
            vec![SyncSourceDocument {
                obj_type: "bitable".into(),
                ..make_fixture_document(
                    "kb-product",
                    "产品知识库",
                    "node-bitable-product-demand-pool",
                    "bitable-product-demand-pool",
                    &["方案库", "产品方案总览", "需求池"],
                    "v6",
                    "2026-03-27T11:15:00Z",
                )
            }]
        }
        ("kb-ops", "space", _, _) | ("kb-ops", "document", Some("doc-ops-playbook"), _) => {
            vec![make_fixture_document(
                "kb-ops",
                "运维知识库",
                "node-doc-ops-playbook",
                "doc-ops-playbook",
                &["运维值班手册"],
                "v1",
                "2026-03-27T12:00:00Z",
            )]
        }
        _ => vec![],
    }
}

#[cfg(test)]
fn fixture_documents_for_sources(
    selected_sources: &[SelectedSyncScope],
) -> Vec<SyncSourceDocument> {
    let mut seen = HashSet::new();
    let mut documents = Vec::new();
    for source in selected_sources {
        for document in fixture_documents_for_scope(source) {
            if seen.insert(document.document_id.clone()) {
                documents.push(document);
            }
        }
    }
    documents
}

fn app_settings_to_openapi_config(
    settings: &AppSettings,
    session: &StoredUserSession,
) -> Option<FeishuOpenApiConfig> {
    if settings.app_id.trim().is_empty()
        || settings.app_secret.trim().is_empty()
        || session.access_token.trim().is_empty()
    {
        return None;
    }

    Some(FeishuOpenApiConfig {
        endpoint: settings.endpoint.clone(),
        access_token: session.access_token.clone(),
    })
}

fn validate_settings_for_connection(settings: &AppSettings) -> Result<(), String> {
    if settings.app_id.trim().is_empty() {
        return Err("请先填写 App ID".into());
    }
    if settings.app_secret.trim().is_empty() {
        return Err("请先填写 App Secret".into());
    }
    if settings.endpoint.trim().is_empty() {
        return Err("请先填写 OpenAPI Endpoint".into());
    }
    Ok(())
}

fn build_authorize_url(settings: &AppSettings, redirect_uri: &str) -> Result<String, String> {
    validate_settings_for_connection(settings)?;
    let redirect_uri = urlencoding::encode(redirect_uri);
    let state = urlencoding::encode("desktop-login");
    let scope = urlencoding::encode(
        "docs:doc docs:document.media:download docs:document:export docx:document drive:drive drive:file drive:file:download offline_access",
    );

    Ok(format!(
        "https://passport.feishu.cn/suite/passport/oauth/authorize?client_id={}&redirect_uri={}&response_type=code&scope={}&state={}",
        settings.app_id, redirect_uri, scope, state
    ))
}

fn token_expiring(expires_at: i64) -> bool {
    expires_at <= now_epoch_seconds() + 300
}

fn build_session_from_token(token: FeishuOAuthTokenInfo, user: UserInfo) -> StoredUserSession {
    let now = now_epoch_seconds();
    StoredUserSession {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        access_token_expires_at: now + token.expires_in.max(0),
        refresh_token_expires_at: now + token.refresh_expires_in.max(0),
        scope: (!token.scope.trim().is_empty()).then_some(token.scope),
        user,
    }
}

fn refresh_session(
    settings: &AppSettings,
    session: &StoredUserSession,
) -> Result<StoredUserSession, String> {
    if session.refresh_token_expires_at <= now_epoch_seconds() {
        return Err("当前登录会话已过期，请重新授权。".into());
    }

    let token = refresh_user_access_token(
        &settings.app_id,
        &settings.app_secret,
        &session.refresh_token,
    )
    .map_err(|err| err.to_string())?;
    let user =
        fetch_user_info(&settings.endpoint, &token.access_token).map_err(|err| err.to_string())?;

    Ok(build_session_from_token(
        token,
        UserInfo {
            name: user.name,
            avatar: user.avatar,
            email: user.email,
            user_id: user.user_id,
        },
    ))
}

fn configured_space_ids(settings: &AppSettings) -> Option<Vec<String>> {
    settings
        .wiki_space_ids
        .as_ref()
        .map(|value| {
            value
                .split(',')
                .map(|item| item.trim().to_string())
                .filter(|item| !item.is_empty())
                .collect::<Vec<_>>()
        })
        .filter(|items| !items.is_empty())
}

fn build_validation(
    status: &str,
    usable: bool,
    message: impl Into<String>,
    diagnostics: Option<String>,
    spaces_loaded: bool,
) -> ConnectionValidation {
    ConnectionValidation {
        status: status.to_string(),
        usable,
        message: message.into(),
        diagnostics,
        spaces_loaded,
    }
}

fn build_connected_result(
    user: UserInfo,
    spaces: Vec<KnowledgeBaseSpace>,
    message: impl Into<String>,
    diagnostics: Option<String>,
) -> ConnectionCheckResult {
    ConnectionCheckResult {
        user: Some(user),
        spaces,
        validation: build_validation("connected-with-spaces", true, message, diagnostics, true),
    }
}

fn e2e_fixtures_enabled() -> bool {
    matches!(
        std::env::var("FLYCAT_E2E_FIXTURES").ok().as_deref(),
        Some("1") | Some("true") | Some("TRUE") | Some("yes") | Some("YES")
    )
}

fn e2e_fixture_user() -> UserInfo {
    UserInfo {
        name: "E2E Fixture User".into(),
        avatar: None,
        email: Some("fixture@example.com".into()),
        user_id: Some("ou_fixture".into()),
    }
}

fn e2e_fixture_spaces() -> Vec<KnowledgeBaseSpace> {
    to_knowledge_base_spaces(vec![
        ("kb-eng".into(), "研发知识库".into()),
        ("kb-product".into(), "产品知识库".into()),
        ("kb-ops".into(), "运维知识库".into()),
    ])
}

fn e2e_fixture_connection_check() -> ConnectionCheckResult {
    build_connected_result(
        e2e_fixture_user(),
        e2e_fixture_spaces(),
        "E2E fixture mode enabled.",
        Some("tauri-driver fixture runtime".into()),
    )
}

fn build_empty_connected_result(
    user: UserInfo,
    message: impl Into<String>,
    diagnostics: Option<String>,
) -> ConnectionCheckResult {
    ConnectionCheckResult {
        user: Some(user),
        spaces: vec![],
        validation: build_validation("connected-no-spaces", true, message, diagnostics, true),
    }
}

fn build_not_signed_in_result(message: impl Into<String>) -> ConnectionCheckResult {
    ConnectionCheckResult {
        user: None,
        spaces: vec![],
        validation: build_validation("not-signed-in", false, message, None, false),
    }
}

fn build_session_expired_result(message: impl Into<String>) -> ConnectionCheckResult {
    ConnectionCheckResult {
        user: None,
        spaces: vec![],
        validation: build_validation("session-expired", false, message, None, false),
    }
}

fn build_reauthorization_required_result(
    message: impl Into<String>,
    diagnostics: Option<String>,
) -> ConnectionCheckResult {
    ConnectionCheckResult {
        user: None,
        spaces: vec![],
        validation: build_validation(
            "reauthorization-required",
            false,
            message,
            diagnostics,
            false,
        ),
    }
}

fn to_knowledge_base_spaces(spaces: Vec<(String, String)>) -> Vec<KnowledgeBaseSpace> {
    let first_space_id = spaces.first().map(|(space_id, _)| space_id.clone());
    spaces
        .into_iter()
        .map(|(id, name)| KnowledgeBaseSpace {
            selected: first_space_id
                .as_ref()
                .map(|space_id| space_id == &id)
                .unwrap_or(false),
            id,
            name,
        })
        .collect()
}

fn is_permission_error(message: &str) -> bool {
    let normalized = message.to_lowercase();
    [
        "permission",
        "forbidden",
        "scope",
        "unauthorized",
        "permission denied",
        "access denied",
        "无权限",
        "权限",
    ]
    .iter()
    .any(|keyword| normalized.contains(keyword))
}

fn classify_discovery_error(error: &McpError, context: &str) -> ConnectionValidation {
    let diagnostics = Some(format!("{context}: {error}"));
    if is_permission_error(&error.to_string()) {
        return build_validation(
            "permission-denied",
            false,
            "连接已建立，但缺少知识库读取权限。请确认应用具备 wiki 读取权限，并已被加入目标知识空间。",
            diagnostics,
            false,
        );
    }

    match error {
        McpError::Transport(_) => build_validation(
            "request-failed",
            false,
            "知识空间加载失败，请检查 Endpoint、网络连通性和飞书接口状态后重试。",
            diagnostics,
            false,
        ),
        McpError::InvalidResponse(_) => build_validation(
            "unexpected-response",
            false,
            "知识空间接口返回了当前应用无法识别的响应格式，请检查接口兼容性。",
            diagnostics,
            false,
        ),
    }
}

fn log_discovery(stage: &str, message: &str) {
    eprintln!("[knowledge-space-discovery] {stage}: {message}");
}

fn probe_configured_spaces(
    client: &FeishuOpenApiClient,
    space_ids: &[String],
) -> Result<Vec<KnowledgeBaseSpace>, McpError> {
    let mut accessible_space_ids = Vec::new();
    let mut last_error: Option<McpError> = None;

    for space_id in space_ids {
        match client.list_child_nodes(space_id, None) {
            Ok(_) => accessible_space_ids.push(space_id.clone()),
            Err(error) => {
                log_discovery(
                    "probe_configured_spaces",
                    &format!("space_id={space_id}, error={error}"),
                );
                last_error = Some(error);
            }
        }
    }

    if accessible_space_ids.is_empty() {
        return Err(last_error.unwrap_or_else(|| {
            McpError::InvalidResponse("Configured Wiki Space IDs are not accessible".into())
        }));
    }

    Ok(to_knowledge_base_spaces(
        accessible_space_ids
            .into_iter()
            .map(|space_id| {
                let name = if space_id.chars().count() > 12 {
                    format!("知识空间 {}", &space_id[..12])
                } else {
                    format!("知识空间 {space_id}")
                };
                (space_id, name)
            })
            .collect(),
    ))
}

fn authorized_config_for_session(
    app: &AppHandle,
    settings: &AppSettings,
) -> Result<(StoredUserSession, FeishuOpenApiConfig), ConnectionCheckResult> {
    if let Err(message) = validate_settings_for_connection(settings) {
        return Err(ConnectionCheckResult {
            user: None,
            spaces: vec![],
            validation: build_validation("not-configured", false, message, None, false),
        });
    }

    let stored = match load_user_session(app) {
        Ok(Some(session)) => session,
        Ok(None) => {
            return Err(build_not_signed_in_result(
                "应用配置已保存，但当前还没有有效的飞书用户登录会话。",
            ))
        }
        Err(error) => {
            return Err(build_reauthorization_required_result(
                "读取当前登录会话失败，请重新授权。",
                Some(error),
            ))
        }
    };

    let session = if token_expiring(stored.access_token_expires_at) {
        match refresh_session(settings, &stored) {
            Ok(refreshed) => {
                let _ = save_user_session(app, &refreshed);
                refreshed
            }
            Err(error) => {
                let _ = clear_user_session(app);
                return Err(build_reauthorization_required_result(
                    "当前登录会话已过期或无法刷新，请重新授权。",
                    Some(error),
                ));
            }
        }
    } else {
        stored
    };

    match app_settings_to_openapi_config(settings, &session) {
        Some(config) => Ok((session, config)),
        None => Err(build_session_expired_result(
            "当前用户登录状态无效，请重新授权后再访问知识库。",
        )),
    }
}

fn resolve_connection_check(app: &AppHandle, settings: &AppSettings) -> ConnectionCheckResult {
    if e2e_fixtures_enabled() {
        return e2e_fixture_connection_check();
    }

    let (session, config) = match authorized_config_for_session(app, settings) {
        Ok(values) => values,
        Err(result) => return result,
    };

    let client = FeishuOpenApiClient::new(config);
    let allowed_space_ids = configured_space_ids(settings);

    match client.list_spaces() {
        Ok(spaces) => {
            log_discovery("list_spaces", &format!("loaded {} spaces", spaces.len()));
            let mut filtered = spaces
                .iter()
                .filter(|space| {
                    allowed_space_ids
                        .as_ref()
                        .map(|ids| ids.iter().any(|id| id == &space.space_id))
                        .unwrap_or(true)
                })
                .map(|space| (space.space_id.clone(), space.name.clone()))
                .collect::<Vec<_>>();

            if filtered.is_empty() {
                if let Some(space_ids) = allowed_space_ids.as_ref() {
                    match probe_configured_spaces(&client, space_ids) {
                        Ok(spaces) => {
                            return build_connected_result(
                                session.user.clone(),
                                spaces,
                                "已通过配置的 Wiki Space IDs 验证到当前登录用户可访问的知识空间。",
                                Some("list_spaces did not return configured spaces; used node probe fallback".into()),
                            );
                        }
                        Err(probe_error) => {
                            log_discovery(
                                "probe_configured_spaces",
                                &format!("fallback probe failed after list_spaces success: {probe_error}"),
                            );

                            let available_space_ids = spaces
                                .iter()
                                .map(|space| space.space_id.clone())
                                .collect::<HashSet<_>>();
                            let matched_space_ids = space_ids
                                .iter()
                                .filter(|space_id| available_space_ids.contains(*space_id))
                                .cloned()
                                .collect::<Vec<_>>();

                            if matched_space_ids.is_empty() && !spaces.is_empty() {
                                return build_empty_connected_result(
                                    session.user.clone(),
                                    format!(
                                        "当前登录用户可访问知识空间，但未发现与 `Wiki Space IDs` 匹配的知识空间：{}。",
                                        space_ids.join(", ")
                                    ),
                                    Some(format!(
                                        "loaded {} spaces, none matched configured ids",
                                        spaces.len()
                                    )),
                                );
                            }

                            return ConnectionCheckResult {
                                user: None,
                                spaces: vec![],
                                validation: classify_discovery_error(
                                    &probe_error,
                                    "configured_space_probe_after_empty_filter",
                                ),
                            };
                        }
                    }
                }

                return build_empty_connected_result(
                    session.user.clone(),
                    "当前登录用户下没有可访问的知识空间。请确认账号已加入至少一个知识空间。",
                    Some("list_spaces succeeded with zero accessible spaces".into()),
                );
            }

            filtered.sort_by(|left, right| left.1.cmp(&right.1));
            let selected_spaces = to_knowledge_base_spaces(filtered);
            let selected_space_count = selected_spaces.len();
            build_connected_result(
                session.user,
                selected_spaces,
                format!(
                    "登录校验成功，已发现 {} 个当前账号可访问的知识空间。",
                    selected_space_count
                ),
                None,
            )
        }
        Err(list_error) => {
            log_discovery("list_spaces", &format!("request failed: {list_error}"));
            if let Some(space_ids) = allowed_space_ids.as_ref() {
                match probe_configured_spaces(&client, space_ids) {
                    Ok(spaces) => {
                        return build_connected_result(
                            session.user.clone(),
                            spaces,
                            "知识空间列表接口未返回可用结果，但已通过配置的 Wiki Space IDs 验证到当前登录用户可访问空间。",
                            Some(format!("list_spaces failed before configured-id probe succeeded: {list_error}")),
                        );
                    }
                    Err(probe_error) => {
                        return ConnectionCheckResult {
                            user: None,
                            spaces: vec![],
                            validation: classify_discovery_error(
                                &probe_error,
                                &format!("list_spaces_failed_then_probe_failed; list_spaces_error={list_error}"),
                            ),
                        };
                    }
                }
            }

            ConnectionCheckResult {
                user: None,
                spaces: vec![],
                validation: classify_discovery_error(&list_error, "list_spaces"),
            }
        }
    }
}

#[cfg(test)]
#[allow(dead_code)] // test infrastructure; not yet called by any #[test]
fn build_scope_from_node(node: &KnowledgeBaseNode) -> SelectedSyncScope {
    SelectedSyncScope {
        kind: node.kind.clone(),
        space_id: node.space_id.clone(),
        space_name: node.space_name.clone(),
        title: node.title.clone(),
        display_path: node.display_path.clone(),
        node_token: Some(node.node_token.clone()),
        document_id: node.document_id.clone(),
        path_segments: node.path_segments.clone(),
        includes_descendants: node.kind == "document" && node.has_children,
    }
}

#[cfg(test)]
#[allow(dead_code)] // test infrastructure; not yet called by any #[test]
fn build_space_scope(space: &KnowledgeBaseSpace) -> SelectedSyncScope {
    SelectedSyncScope {
        kind: "space".into(),
        space_id: space.id.clone(),
        space_name: space.name.clone(),
        title: space.name.clone(),
        display_path: space.name.clone(),
        node_token: None,
        document_id: None,
        path_segments: vec![],
        includes_descendants: false,
    }
}

#[cfg(test)]
#[allow(dead_code)] // test infrastructure; not yet called by any #[test]
fn find_node_by_scope(
    nodes: &[KnowledgeBaseNode],
    scope: &SelectedSyncScope,
) -> Option<KnowledgeBaseNode> {
    let mut stack = nodes.to_vec();
    while let Some(node) = stack.pop() {
        let matches = match scope.kind.as_str() {
            "folder" => {
                node.kind == "folder"
                    && scope.node_token.as_deref() == Some(node.node_token.as_str())
            }
            "document" | "bitable" => {
                node.kind == scope.kind
                    && scope.document_id.as_deref() == node.document_id.as_deref()
                    && scope.node_token.as_deref() == Some(node.node_token.as_str())
            }
            _ => false,
        };

        if matches {
            return Some(node);
        }

        stack.extend(node.children.clone());
    }

    None
}

#[cfg(test)]
#[allow(dead_code)] // test infrastructure; not yet called by any #[test]
fn collect_fixture_documents(nodes: &[KnowledgeBaseNode], out: &mut Vec<SyncSourceDocument>) {
    for node in nodes {
        if node.kind == "document" || node.kind == "bitable" {
            if let Some(document_id) = node.document_id.as_ref() {
                out.push(make_fixture_document(
                    &node.space_id,
                    &node.space_name,
                    &node.node_token,
                    document_id,
                    &node
                        .path_segments
                        .iter()
                        .map(|segment| segment.as_str())
                        .collect::<Vec<_>>(),
                    "fixture-version",
                    "fixture-update-time",
                ));
                if let Some(last) = out.last_mut() {
                    last.obj_type = if node.kind == "bitable" {
                        "bitable".into()
                    } else {
                        "docx".into()
                    };
                }
            }
        }
        collect_fixture_documents(&node.children, out);
    }
}

fn resolve_space_name(client: &FeishuOpenApiClient, space_id: &str) -> Result<String, String> {
    client
        .list_spaces()
        .map_err(|err| err.to_string())?
        .into_iter()
        .find(|space| space.space_id == space_id)
        .map(|space| space.name)
        .ok_or_else(|| format!("未找到知识空间：{space_id}"))
}

fn resolve_path_segments_for_node(
    client: &FeishuOpenApiClient,
    space_id: &str,
    target_node_token: &str,
) -> Result<Vec<String>, String> {
    fn walk(
        client: &FeishuOpenApiClient,
        space_id: &str,
        parent_node_token: Option<&str>,
        parent_path: &[String],
        target_node_token: &str,
    ) -> Result<Option<Vec<String>>, String> {
        let nodes = client
            .list_child_nodes(space_id, parent_node_token)
            .map_err(|err| err.to_string())?;

        for node in nodes {
            let mut path_segments = parent_path.to_vec();
            path_segments.push(node.title.clone());

            if node.node_token == target_node_token {
                return Ok(Some(path_segments));
            }

            if node.has_child {
                if let Some(found) = walk(
                    client,
                    space_id,
                    Some(&node.node_token),
                    &path_segments,
                    target_node_token,
                )? {
                    return Ok(Some(found));
                }
            }
        }

        Ok(None)
    }

    walk(client, space_id, None, &[], target_node_token)?
        .ok_or_else(|| format!("未找到知识库节点：{target_node_token}"))
}

fn resolve_wiki_node_by_token(
    client: &FeishuOpenApiClient,
    space_id: &str,
    target_node_token: &str,
) -> Result<crate::mcp::FeishuWikiNode, String> {
    fn walk(
        client: &FeishuOpenApiClient,
        space_id: &str,
        parent_node_token: Option<&str>,
        target_node_token: &str,
    ) -> Result<Option<crate::mcp::FeishuWikiNode>, String> {
        let nodes = client
            .list_child_nodes(space_id, parent_node_token)
            .map_err(|err| err.to_string())?;

        for node in nodes {
            if node.node_token == target_node_token {
                return Ok(Some(node));
            }

            if node.has_child {
                if let Some(found) =
                    walk(client, space_id, Some(&node.node_token), target_node_token)?
                {
                    return Ok(Some(found));
                }
            }
        }

        Ok(None)
    }

    walk(client, space_id, None, target_node_token)?
        .ok_or_else(|| format!("未找到知识库节点：{target_node_token}"))
}

fn build_tree_nodes_from_openapi(
    client: &FeishuOpenApiClient,
    space_id: &str,
    space_name: &str,
    parent_node_token: Option<&str>,
    parent_path: &[String],
) -> Result<Vec<KnowledgeBaseNode>, String> {
    let nodes = client
        .list_child_nodes(space_id, parent_node_token)
        .map_err(|err| err.to_string())?;
    let mut result = Vec::new();

    for node in nodes {
        let mut path_segments = parent_path.to_vec();
        path_segments.push(node.title.clone());
        let kind = node_kind_from_obj_type(&node.obj_type, node.has_child);
        let is_expandable = is_expandable_node(&kind, node.has_child);
        let identifier = if kind == "document" {
            node.obj_token.clone()
        } else {
            node.node_token.clone()
        };

        result.push(KnowledgeBaseNode {
            key: build_scope_key(&kind, space_id, &identifier),
            kind,
            space_id: space_id.to_string(),
            space_name: space_name.to_string(),
            title: node.title.clone(),
            display_path: join_display_path(space_name, &path_segments),
            node_token: node.node_token.clone(),
            document_id: matches!(node.obj_type.as_str(), "docx" | "sheet" | "bitable")
                .then_some(node.obj_token.clone()),
            path_segments,
            wiki_list_version: node.version.clone(),
            has_children: node.has_child,
            is_expandable,
            children: vec![],
        });
    }

    Ok(result)
}

fn list_space_source_tree_from_openapi(
    space_id: &str,
    parent_node_token: Option<&str>,
    settings: &AppSettings,
    session: &StoredUserSession,
) -> Result<Vec<KnowledgeBaseNode>, String> {
    let config = app_settings_to_openapi_config(settings, session)
        .ok_or_else(|| "Feishu OpenAPI user session missing".to_string())?;
    let client = FeishuOpenApiClient::new(config);
    let space_name = resolve_space_name(&client, space_id)?;
    let parent_path = parent_node_token
        .map(|parent_node_token| {
            resolve_path_segments_for_node(&client, space_id, parent_node_token)
        })
        .transpose()?
        .unwrap_or_default();
    build_tree_nodes_from_openapi(
        &client,
        space_id,
        &space_name,
        parent_node_token,
        &parent_path,
    )
}

fn wiki_node_has_discovery_metadata(node: &crate::mcp::FeishuWikiNode) -> bool {
    !node.title.trim().is_empty()
        && !node.version.trim().is_empty()
        && !node.update_time.trim().is_empty()
}

fn build_sync_document_from_wiki_node(
    space_name: &str,
    path_segments: &[String],
    node: &crate::mcp::FeishuWikiNode,
) -> SyncSourceDocument {
    SyncSourceDocument {
        document_id: node.obj_token.clone(),
        space_id: node.space_id.clone(),
        space_name: space_name.to_string(),
        node_token: node.node_token.clone(),
        title: node.title.clone(),
        version: node.version.clone(),
        update_time: node.update_time.clone(),
        source_path: join_display_path(space_name, path_segments).replace(" / ", "/"),
        path_segments: path_segments.to_vec(),
        obj_type: node.obj_type.clone(),
    }
}

fn discover_documents_from_openapi(
    selected_scope: &SelectedSyncScope,
    settings: &AppSettings,
    session: &StoredUserSession,
) -> Result<Vec<SyncSourceDocument>, String> {
    let config = app_settings_to_openapi_config(settings, session)
        .ok_or_else(|| "Feishu OpenAPI user session missing".to_string())?;
    let client = FeishuOpenApiClient::new(config);

    fn collect_documents_from_child_nodes(
        client: &FeishuOpenApiClient,
        scope: &SelectedSyncScope,
        base_path: &[String],
    ) -> Result<Vec<SyncSourceDocument>, String> {
        let nodes = client
            .list_child_nodes(&scope.space_id, scope.node_token.as_deref())
            .map_err(|err| err.to_string())?;
        let mut documents = Vec::new();

        for node in nodes {
            let mut path_segments = base_path.to_vec();
            path_segments.push(node.title.clone());
            let kind = node_kind_from_obj_type(&node.obj_type, node.has_child);
            let is_expandable = is_expandable_node(&kind, node.has_child);

            if kind == "document" {
                if wiki_node_has_discovery_metadata(&node) {
                    documents.push(build_sync_document_from_wiki_node(
                        &scope.space_name,
                        &path_segments,
                        &node,
                    ));
                } else {
                    let summary = client
                        .fetch_document_summary_with_retry(&node.obj_token)
                        .map_err(|err| err.to_string())?;
                    documents.push(SyncSourceDocument {
                        document_id: node.obj_token.clone(),
                        space_id: node.space_id.clone(),
                        space_name: scope.space_name.clone(),
                        node_token: node.node_token.clone(),
                        title: summary.title,
                        version: summary.version,
                        update_time: summary.update_time,
                        source_path: join_display_path(&scope.space_name, &path_segments)
                            .replace(" / ", "/"),
                        path_segments: path_segments.clone(),
                        obj_type: node.obj_type.clone(),
                    });
                }
            } else if kind == "bitable" {
                documents.push(SyncSourceDocument {
                    document_id: node.obj_token.clone(),
                    space_id: node.space_id.clone(),
                    space_name: scope.space_name.clone(),
                    node_token: node.node_token.clone(),
                    title: node.title.clone(),
                    version: node.version.clone(),
                    update_time: node.update_time.clone(),
                    source_path: join_display_path(&scope.space_name, &path_segments)
                        .replace(" / ", "/"),
                    path_segments: path_segments.clone(),
                    obj_type: node.obj_type.clone(),
                });
            }

            if is_expandable {
                let child_scope = SelectedSyncScope {
                    kind: if kind == "document" {
                        "document".into()
                    } else {
                        "folder".into()
                    },
                    space_id: scope.space_id.clone(),
                    space_name: scope.space_name.clone(),
                    title: node.title.clone(),
                    display_path: join_display_path(&scope.space_name, &path_segments),
                    node_token: Some(node.node_token.clone()),
                    document_id: (kind == "document").then_some(node.obj_token.clone()),
                    path_segments: path_segments.clone(),
                    includes_descendants: kind == "document",
                };
                documents.extend(collect_documents_from_child_nodes(
                    client,
                    &child_scope,
                    &path_segments,
                )?);
            }
        }

        Ok(documents)
    }

    if selected_scope.kind == "document" {
        let document_id = selected_scope
            .document_id
            .as_deref()
            .ok_or_else(|| "缺少文档标识，无法创建同步任务。".to_string())?;
        let summary = client
            .fetch_document_summary_with_retry(document_id)
            .map_err(|err| err.to_string())?;
        let mut documents = vec![SyncSourceDocument {
            document_id: document_id.to_string(),
            space_id: selected_scope.space_id.clone(),
            space_name: selected_scope.space_name.clone(),
            node_token: selected_scope.node_token.clone().unwrap_or_default(),
            title: summary.title,
            version: summary.version,
            update_time: summary.update_time,
            source_path: join_display_path(
                &selected_scope.space_name,
                &selected_scope.path_segments,
            )
            .replace(" / ", "/"),
            path_segments: selected_scope.path_segments.clone(),
            obj_type: "docx".into(),
        }];
        if selected_scope.includes_descendants {
            documents.extend(collect_documents_from_child_nodes(
                &client,
                selected_scope,
                &selected_scope.path_segments,
            )?);
        }
        return Ok(documents);
    }

    if selected_scope.kind == "bitable" {
        let document_id = selected_scope
            .document_id
            .as_deref()
            .ok_or_else(|| "缺少文档标识，无法创建同步任务。".to_string())?;
        let node_token = selected_scope.node_token.as_deref().unwrap_or_default();
        let wiki_node = resolve_wiki_node_by_token(&client, &selected_scope.space_id, node_token)?;
        let path_segments = if selected_scope.path_segments.is_empty() {
            resolve_path_segments_for_node(&client, &selected_scope.space_id, node_token)?
        } else {
            selected_scope.path_segments.clone()
        };
        let source_path =
            join_display_path(&selected_scope.space_name, &path_segments).replace(" / ", "/");
        return Ok(vec![SyncSourceDocument {
            document_id: document_id.to_string(),
            space_id: selected_scope.space_id.clone(),
            space_name: selected_scope.space_name.clone(),
            node_token: node_token.to_string(),
            title: wiki_node.title,
            version: wiki_node.version,
            update_time: wiki_node.update_time,
            source_path,
            path_segments,
            obj_type: wiki_node.obj_type,
        }]);
    }

    let base_path = if selected_scope.kind == "folder" {
        selected_scope.path_segments.clone()
    } else {
        vec![]
    };
    collect_documents_from_child_nodes(&client, selected_scope, &base_path)
}

fn discover_documents_from_sources(
    selected_sources: &[SelectedSyncScope],
    settings: &AppSettings,
    session: &StoredUserSession,
) -> Result<Vec<SyncSourceDocument>, String> {
    let mut seen = HashSet::new();
    let mut documents = Vec::new();
    for source in selected_sources {
        for document in discover_documents_from_openapi(source, settings, session)? {
            if seen.insert(document.document_id.clone()) {
                documents.push(document);
            }
        }
    }
    Ok(documents)
}

fn is_document_unchanged(
    document: &SyncSourceDocument,
    output_root: &Path,
    manifest: &crate::model::SyncManifest,
) -> bool {
    let expected_output_path = expected_output_path(output_root, document)
        .to_string_lossy()
        .to_string();
    manifest.records.iter().any(|record| {
        record.document_id == document.document_id
            && record.status == "success"
            && record.version == document.version
            && record.update_time == document.update_time
            && record.source_path == document.source_path
            && record.output_path == expected_output_path
            && manifest_record_has_local_output(record)
    })
}

fn manifest_record_has_local_output(record: &crate::model::ManifestRecord) -> bool {
    Path::new(&record.output_path).is_file()
}

fn uses_export_download(document: &SyncSourceDocument, openapi_config_available: bool) -> bool {
    openapi_config_available
        && matches!(
            document.obj_type.trim().to_ascii_lowercase().as_str(),
            "sheet" | "bitable"
        )
}

#[cfg(test)]
#[allow(dead_code)] // test infrastructure; not yet called by any #[test]
fn should_retry_document(
    document: &SyncSourceDocument,
    manifest: &crate::model::SyncManifest,
) -> bool {
    manifest
        .records
        .iter()
        .any(|record| record.document_id == document.document_id && record.status == "failed")
}

fn configured_mcp_server_name(settings: Option<&AppSettings>) -> String {
    settings
        .map(|settings| settings.mcp_server_name.trim())
        .filter(|value| !value.is_empty())
        .unwrap_or("user-feishu-mcp")
        .to_string()
}

fn configured_image_dir_name(settings: Option<&AppSettings>) -> String {
    settings
        .map(|settings| settings.image_dir_name.trim())
        .filter(|value| !value.is_empty())
        .unwrap_or("_assets")
        .to_string()
}

fn classify_pipeline_failure(error: SyncPipelineError) -> SyncRunError {
    let category = if is_auth_message(&error.message) {
        "auth".to_string()
    } else {
        error.stage
    };
    SyncRunError {
        document_id: String::new(),
        title: String::new(),
        category,
        message: error.message,
    }
}

fn spawn_sync_progress(task_id: String, app: AppHandle) {
    std::thread::spawn(move || {
        let (documents, discovery_error, settings, selected_sources, selected_scope) = {
            let state = app.state::<AppState>();
            let tasks = state.tasks.lock().expect("task state poisoned");
            let selected_sources = tasks
                .iter()
                .find(|task| task.id == task_id)
                .map(effective_selected_sources)
                .or_else(|| {
                    tasks
                        .iter()
                        .find(|task| task.id == task_id)
                        .and_then(|task| {
                            task.selected_spaces.first().map(|space_id| {
                                vec![SelectedSyncScope {
                                    kind: "space".into(),
                                    space_id: space_id.clone(),
                                    space_name: space_id.clone(),
                                    title: space_id.clone(),
                                    display_path: space_id.clone(),
                                    node_token: None,
                                    document_id: None,
                                    path_segments: vec![],
                                    includes_descendants: false,
                                }]
                            })
                        })
                });
            let selected_scope = selected_sources
                .as_ref()
                .and_then(|sources| legacy_selected_scope(sources));
            drop(tasks);

            let settings: Option<AppSettings> =
                load_json_file(settings_file_path(&app).expect("settings path"))
                    .expect("settings json should load");

            match settings {
                Some(settings) => match authorized_config_for_session(&app, &settings) {
                    Ok((session, _)) => match selected_sources.as_ref() {
                        Some(sources) if !sources.is_empty() => {
                            match discover_documents_from_sources(sources, &settings, &session) {
                                Ok(documents) => (
                                    documents,
                                    None,
                                    Some(settings),
                                    Some(sources.clone()),
                                    legacy_selected_scope(sources),
                                ),
                                Err(error) => (
                                    vec![],
                                    Some(SyncRunError {
                                        document_id: String::new(),
                                        title: String::new(),
                                        category: if is_auth_message(&error) {
                                            "auth".into()
                                        } else {
                                            "discovery".into()
                                        },
                                        message: error,
                                    }),
                                    Some(settings),
                                    Some(sources.clone()),
                                    legacy_selected_scope(sources),
                                ),
                            }
                        }
                        _ => (
                            vec![],
                            Some(SyncRunError {
                                document_id: String::new(),
                                title: String::new(),
                                category: "discovery".into(),
                                message: "请先选择一个同步范围。".into(),
                            }),
                            Some(settings),
                            None,
                            None,
                        ),
                    },
                    Err(result) => (
                        vec![],
                        Some(SyncRunError {
                            document_id: String::new(),
                            title: String::new(),
                            category: "auth".into(),
                            message: result.validation.message,
                        }),
                        Some(settings),
                        selected_sources,
                        selected_scope,
                    ),
                },
                None => (
                    vec![],
                    Some(SyncRunError {
                        document_id: String::new(),
                        title: String::new(),
                        category: "auth".into(),
                        message: "请先完成飞书配置并重新登录。".into(),
                    }),
                    None,
                    selected_sources,
                    selected_scope,
                ),
            }
        };

        if documents.is_empty() {
            let mut finished_task = None;
            {
                let state = app.state::<AppState>();
                let mut tasks = state.tasks.lock().expect("task state poisoned");
                if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
                    task.selected_sources = selected_sources.clone().unwrap_or_default();
                    task.selected_scope = selected_scope.clone();
                    task.selection_summary = build_selection_summary(
                        &task.selected_sources,
                        task.selected_scope.as_ref(),
                        (task.counters.total > 0).then_some(task.counters.total),
                    );
                    task.progress = 100;
                    task.counters.total = task.counters.total.max(1);
                    task.counters.processed = task.counters.total;
                    if let Some(error) = discovery_error.clone() {
                        task.counters.failed = 1;
                        task.counters.succeeded = 0;
                        task.errors = vec![error];
                    }
                    task.failure_summary = build_failure_summary(&task.errors);
                    task.status = if task.errors.is_empty() {
                        "completed".into()
                    } else {
                        "partial-failed".into()
                    };
                    task.lifecycle_state = task.status.clone();
                    task.updated_at = now_iso();
                    finished_task = Some(task.clone());
                }
            }
            if let Some(task) = finished_task {
                {
                    let state = app.state::<AppState>();
                    let tasks = state.tasks.lock().expect("task state poisoned");
                    let _ = save_tasks_to_disk(&app, &tasks);
                }
                let event_name = if task.errors.is_empty() {
                    "sync-task-completed"
                } else {
                    "sync-task-failed"
                };
                emit_task_event(&app, event_name, &task);
            }
            let state = app.state::<AppState>();
            let mut running = state
                .running_task_ids
                .lock()
                .expect("running task state poisoned");
            running.remove(&task_id);
            return;
        }

        let output_root = {
            let state = app.state::<AppState>();
            let tasks = state.tasks.lock().expect("task state poisoned");
            tasks
                .iter()
                .find(|task| task.id == task_id)
                .map(|task| PathBuf::from(&task.output_path))
                .unwrap_or_default()
        };
        let manifest = load_manifest(&output_root).unwrap_or_default();
        let mut queued_documents = Vec::new();
        let mut skipped_documents = Vec::new();

        for document in documents {
            if is_document_unchanged(&document, &output_root, &manifest) {
                skipped_documents.push(document);
            } else {
                queued_documents.push(document);
            }
        }

        {
            let state = app.state::<AppState>();
            let mut tasks = state.tasks.lock().expect("task state poisoned");
            if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
                task.selected_sources = selected_sources.clone().unwrap_or_default();
                task.selected_scope = selected_scope.clone();
                task.selection_summary = build_selection_summary(
                    &task.selected_sources,
                    task.selected_scope.as_ref(),
                    (task.counters.total > 0).then_some(task.counters.total),
                );
                task.counters.total =
                    (queued_documents.len() + skipped_documents.len()).max(1) as u32;
                task.counters.processed = skipped_documents.len() as u32;
                task.counters.skipped = skipped_documents.len() as u32;
                task.counters.failed = 0;
                task.counters.succeeded = 0;
                task.progress = ((task.counters.processed as f32 / task.counters.total as f32)
                    * 100.0)
                    .round() as u32;
                task.lifecycle_state = "syncing".into();
                task.discovered_document_ids = queued_documents
                    .iter()
                    .chain(skipped_documents.iter())
                    .map(|d| d.document_id.clone())
                    .collect();
                task.updated_at = now_iso();
            }
        }

        // Emit progress event with total count after discovery completes
        {
            let state = app.state::<AppState>();
            let tasks = state.tasks.lock().expect("task state poisoned");
            if let Some(task) = tasks.iter().find(|task| task.id == task_id) {
                emit_task_event(&app, "sync-progress", task);
            }
        }

        if queued_documents.is_empty() {
            let mut finished_task = None;
            {
                let state = app.state::<AppState>();
                let mut tasks = state.tasks.lock().expect("task state poisoned");
                if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
                    task.progress = 100;
                    task.status = "completed".into();
                    task.lifecycle_state = "completed".into();
                    task.updated_at = now_iso();
                    finished_task = Some(task.clone());
                }
            }
            if let Some(task) = finished_task {
                {
                    let state = app.state::<AppState>();
                    let tasks = state.tasks.lock().expect("task state poisoned");
                    let _ = save_tasks_to_disk(&app, &tasks);
                }
                emit_task_event(&app, "sync-task-completed", &task);
            }
            let state = app.state::<AppState>();
            let mut running = state
                .running_task_ids
                .lock()
                .expect("running task state poisoned");
            running.remove(&task_id);
            return;
        }

        // Pre-resolve auth config once for the entire sync run
        let auth_config: Result<(String, Option<FeishuOpenApiConfig>), String> = {
            if let Some(discovery_error) = discovery_error.as_ref() {
                Err(discovery_error.message.clone())
            } else {
                match settings.as_ref() {
                    Some(s) => match authorized_config_for_session(&app, s) {
                        Ok((session, openapi_config)) => {
                            let _ = save_user_session(&app, &session);
                            Ok((
                                configured_mcp_server_name(settings.as_ref()),
                                Some(openapi_config),
                            ))
                        }
                        Err(result) => Err(result.validation.message),
                    },
                    None => Err("请先完成飞书配置并重新登录。".into()),
                }
            }
        };

        let (mcp_server_name, openapi_config) = match auth_config {
            Ok(config) => config,
            Err(msg) => {
                let state = app.state::<AppState>();
                let mut tasks = state.tasks.lock().expect("task state poisoned");
                if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
                    task.counters.failed = task.counters.total;
                    task.counters.processed = task.counters.total;
                    task.progress = 100;
                    task.errors.push(SyncRunError {
                        document_id: String::new(),
                        title: String::new(),
                        category: "auth".into(),
                        message: msg,
                    });
                    task.failure_summary = build_failure_summary(&task.errors);
                    task.status = "partial-failed".into();
                    task.lifecycle_state = "partial-failed".into();
                    task.updated_at = now_iso();
                    let task_clone = task.clone();
                    drop(tasks);
                    let state = app.state::<AppState>();
                    let tasks = state.tasks.lock().expect("task state poisoned");
                    let _ = save_tasks_to_disk(&app, &tasks);
                    emit_task_event(&app, "sync-task-failed", &task_clone);
                }
                let state = app.state::<AppState>();
                let mut running = state.running_task_ids.lock().expect("task state poisoned");
                running.remove(&task_id);
                return;
            }
        };
        let image_dir_name = configured_image_dir_name(settings.as_ref());

        // Load manifest once for batch updates
        let sync_root = {
            let state = app.state::<AppState>();
            let tasks = state.tasks.lock().expect("task state poisoned");
            tasks
                .iter()
                .find(|task| task.id == task_id)
                .map(|task| PathBuf::from(&task.output_path))
                .unwrap_or_default()
        };
        let mut manifest = load_manifest(&sync_root).unwrap_or_default();

        for (step, document) in queued_documents.iter().enumerate() {
            let step = (step + 1) as u32;
            let use_export_download = uses_export_download(document, openapi_config.is_some());
            let result = {
                if use_export_download {
                    let config = openapi_config
                        .as_ref()
                        .expect("export download requires OpenAPI config");
                    match sync_document_via_export(document, &sync_root, config, &manifest) {
                        Ok(record) => Ok(record),
                        Err(export_err) => {
                            // Export-only documents can only be synced via export;
                            // falling back to docx content path would always fail
                            // with code 1770002 (not found).
                            Err(export_err)
                        }
                    }
                } else {
                    sync_document_content(
                        document,
                        &sync_root,
                        &image_dir_name,
                        &mcp_server_name,
                        openapi_config.as_ref(),
                        &manifest,
                    )
                    .map(|(_, record)| record)
                }
            };

            {
                let state = app.state::<AppState>();
                let mut tasks = state.tasks.lock().expect("task state poisoned");
                if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
                    task.counters.processed = task.counters.skipped + step;
                    task.progress =
                        ((step as f32 / task.counters.total as f32) * 100.0).round() as u32;
                    match result {
                        Ok(record) => {
                            upsert_manifest_record(&mut manifest, record);
                        }
                        Err(error) => {
                            task.counters.failed = task.counters.failed.saturating_add(1);
                            let mut run_err = classify_pipeline_failure(error);
                            run_err.document_id = document.document_id.clone();
                            run_err.title = document.title.clone();
                            task.errors.push(run_err);
                        }
                    }
                    task.counters.succeeded = task
                        .counters
                        .processed
                        .saturating_sub(task.counters.skipped + task.counters.failed);
                    task.failure_summary = build_failure_summary(&task.errors);
                    task.updated_at = now_iso();
                }
            }

            // Save tasks and manifest to disk after every document for real-time status
            {
                let state = app.state::<AppState>();
                let tasks = state.tasks.lock().expect("task state poisoned");
                let _ = save_tasks_to_disk(&app, &tasks);
            }
            let _ = save_manifest(&sync_root, &manifest);

            // Emit progress event per document for real-time UI updates
            {
                let state = app.state::<AppState>();
                let tasks = state.tasks.lock().expect("task state poisoned");
                if let Some(task) = tasks.iter().find(|task| task.id == task_id) {
                    emit_task_event(&app, "sync-progress", task);
                }
            }
        }

        // Mark task as completed
        let state = app.state::<AppState>();
        let mut finished_task = None;
        {
            let mut tasks = state.tasks.lock().expect("task state poisoned");
            if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
                if !task.errors.is_empty() {
                    task.status = "partial-failed".into();
                    task.lifecycle_state = "partial-failed".into();
                } else {
                    task.status = "completed".into();
                    task.lifecycle_state = "completed".into();
                }
                task.failure_summary = build_failure_summary(&task.errors);
                task.updated_at = now_iso();
                finished_task = Some(task.clone());
            }
        }
        if let Some(task) = finished_task {
            {
                let state = app.state::<AppState>();
                let tasks = state.tasks.lock().expect("task state poisoned");
                let _ = save_tasks_to_disk(&app, &tasks);
            }
            let event_name = if task.errors.is_empty() {
                "sync-task-completed"
            } else {
                "sync-task-failed"
            };
            emit_task_event(&app, event_name, &task);
        }

        let state = app.state::<AppState>();
        let mut running = state
            .running_task_ids
            .lock()
            .expect("running task state poisoned");
        running.remove(&task_id);
    });
}

#[tauri::command]
pub fn get_synced_document_ids(sync_root: String) -> Vec<String> {
    let path = std::path::Path::new(&sync_root);
    let manifest = crate::storage::load_manifest(path).unwrap_or_default();
    manifest
        .records
        .into_iter()
        .filter(|r| r.status == "success")
        .map(|r| r.document_id)
        .collect()
}

#[tauri::command]
pub fn get_document_sync_statuses(
    sync_root: String,
) -> std::collections::HashMap<String, crate::model::DocumentSyncStatusEntry> {
    let path = std::path::Path::new(&sync_root);
    let manifest = crate::storage::load_manifest(path).unwrap_or_default();
    let mut result = std::collections::HashMap::new();
    for record in manifest.records {
        if record.status == "success" && !manifest_record_has_local_output(&record) {
            continue;
        }
        let status = if record.status == "success" {
            "synced".to_string()
        } else {
            "failed".to_string()
        };
        result.insert(
            record.document_id,
            crate::model::DocumentSyncStatusEntry {
                status,
                last_synced_at: record.last_synced_at,
                local_feishu_version: record.version.clone(),
            },
        );
    }
    result
}

#[tauri::command]
pub fn read_synced_markdown_preview(
    sync_root: String,
    document_id: String,
) -> Result<crate::model::SyncedMarkdownPreview, String> {
    let root = Path::new(&sync_root);
    let manifest = crate::storage::load_manifest(root)?;
    let record = manifest
        .records
        .into_iter()
        .find(|r| r.document_id == document_id)
        .ok_or_else(|| "未找到该文档的同步记录".to_string())?;
    if record.status != "success" {
        return Err("该文档尚未成功同步，无法预览".to_string());
    }
    if !manifest_record_has_local_output(&record) {
        return Err("本地 Markdown 文件不存在，请先完成同步".to_string());
    }
    let markdown = fs::read_to_string(&record.output_path).map_err(|e| e.to_string())?;
    Ok(crate::model::SyncedMarkdownPreview {
        markdown,
        output_path: record.output_path,
        title: record.title,
    })
}

#[tauri::command]
pub fn get_runtime_info() -> RuntimeInfo {
    RuntimeInfo {
        runtime: "tauri",
        version: env!("CARGO_PKG_VERSION"),
    }
}

#[tauri::command]
pub async fn get_app_bootstrap(app: AppHandle) -> Result<AppBootstrap, String> {
    let settings: Option<AppSettings> = load_json_file(settings_file_path(&app)?)?;
    let resolved_sync_root = settings
        .as_ref()
        .map(|settings| resolve_sync_root_string(&app, &settings.sync_root))
        .transpose()?;
    let connection_check = settings
        .as_ref()
        .map(|settings| resolve_connection_check(&app, settings));

    let user = connection_check
        .as_ref()
        .and_then(|result| result.user.clone());
    let spaces = connection_check
        .as_ref()
        .map(|result| result.spaces.clone())
        .unwrap_or_default();
    let connection_validation = connection_check.map(|result| result.validation);

    Ok(AppBootstrap {
        settings,
        resolved_sync_root,
        user,
        spaces,
        connection_validation,
    })
}

#[tauri::command]
pub fn save_app_settings(app: AppHandle, settings: AppSettings) -> Result<AppSettings, String> {
    save_json_file(settings_file_path(&app)?, &settings)?;
    Ok(settings)
}

#[tauri::command]
pub fn begin_user_authorization(app: AppHandle, redirect_uri: String) -> Result<String, String> {
    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    build_authorize_url(&settings, &redirect_uri)
}

#[tauri::command]
pub fn complete_user_authorization(
    app: AppHandle,
    code: String,
    redirect_uri: String,
) -> Result<ConnectionCheckResult, String> {
    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    let token =
        exchange_user_access_token(&settings.app_id, &settings.app_secret, &code, &redirect_uri)
            .map_err(|err| err.to_string())?;
    let user =
        fetch_user_info(&settings.endpoint, &token.access_token).map_err(|err| err.to_string())?;
    let session = build_session_from_token(
        token,
        UserInfo {
            name: user.name,
            avatar: user.avatar,
            email: user.email,
            user_id: user.user_id,
        },
    );
    save_user_session(&app, &session)?;
    Ok(resolve_connection_check(&app, &settings))
}

#[tauri::command]
pub fn validate_feishu_connection(app: AppHandle) -> Result<ConnectionCheckResult, String> {
    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    let result = resolve_connection_check(&app, &settings);
    Ok(result)
}

#[tauri::command]
pub async fn list_space_source_tree(
    app: AppHandle,
    space_id: String,
    parent_node_token: Option<String>,
) -> Result<Vec<KnowledgeBaseNode>, String> {
    if e2e_fixtures_enabled() {
        return Ok(fixture_space_nodes(&space_id, parent_node_token.as_deref()));
    }

    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    let (session, _) = authorized_config_for_session(&app, &settings)
        .map_err(|result| result.validation.message)?;

    let space_id = space_id.clone();
    let parent_node_token = parent_node_token.clone();
    tokio::task::spawn_blocking(move || {
        match list_space_source_tree_from_openapi(
            &space_id,
            parent_node_token.as_deref(),
            &settings,
            &session,
        ) {
            Ok(nodes) => Ok(nodes),
            Err(error) => {
                let fixtures = fixture_space_nodes(&space_id, parent_node_token.as_deref());
                if fixtures.is_empty() {
                    Err(error)
                } else {
                    Ok(fixtures)
                }
            }
        }
    })
    .await
    .map_err(|err| format!("tree loading panicked: {err}"))?
}

#[tauri::command]
pub fn logout_user(app: AppHandle) -> Result<(), String> {
    clear_user_session(&app)
}

#[tauri::command]
pub fn list_sync_tasks(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<Vec<SyncTask>, String> {
    let mut tasks = state.tasks.lock().map_err(|err| err.to_string())?;
    if tasks.is_empty() {
        *tasks = load_tasks_from_disk(&app)?;
    }
    Ok(tasks.clone())
}

#[tauri::command]
pub async fn create_sync_task(
    app: AppHandle,
    request: CreateSyncTaskRequest,
    state: State<'_, AppState>,
) -> Result<SyncTask, String> {
    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    let (_session, _) = authorized_config_for_session(&app, &settings)
        .map_err(|result| result.validation.message)?;
    let selected_sources = validate_selected_sources(&request.selected_sources)?;
    let legacy_scope = legacy_selected_scope(&selected_sources);

    // Return task immediately without document discovery.
    // Discovery happens in spawn_sync_progress to avoid blocking the UI.
    let resolved_output_path = resolve_sync_root_string(&app, &request.output_path)?;
    fs::create_dir_all(&resolved_output_path).map_err(|err| err.to_string())?;
    with_tasks(&app, state, |tasks| {
        let created_at = now_iso();
        let task = SyncTask {
            id: Uuid::new_v4().to_string(),
            name: build_task_name(&created_at),
            selected_spaces: selected_sources
                .iter()
                .map(|source| source.space_id.clone())
                .collect::<HashSet<_>>()
                .into_iter()
                .collect(),
            selected_sources: selected_sources.clone(),
            selected_scope: legacy_scope.clone(),
            selection_summary: build_selection_summary(
                &selected_sources,
                legacy_scope.as_ref(),
                None,
            ),
            output_path: resolved_output_path,
            status: "pending".into(),
            progress: 0,
            counters: SyncCounters {
                total: 0,
                processed: 0,
                succeeded: 0,
                skipped: 0,
                failed: 0,
            },
            lifecycle_state: "idle".into(),
            discovered_document_ids: vec![],
            errors: vec![],
            failure_summary: None,
            created_at: created_at.clone(),
            updated_at: created_at,
        };

        tasks.insert(0, task.clone());
        Ok(task)
    })
}

#[tauri::command]
pub fn delete_sync_task(
    app: AppHandle,
    task_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_tasks(&app, state, |tasks| {
        tasks.retain(|task| task.id != task_id);
        Ok(())
    })?;
    let state = app.state::<AppState>();
    let mut running = state
        .running_task_ids
        .lock()
        .map_err(|err| err.to_string())?;
    running.remove(&task_id);
    Ok(())
}

#[tauri::command]
pub fn clear_all_sync_tasks(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    with_tasks(&app, state.clone(), |tasks| {
        tasks.clear();
        Ok(())
    })?;
    let mut running = state
        .running_task_ids
        .lock()
        .map_err(|err| err.to_string())?;
    running.clear();
    Ok(())
}

#[tauri::command]
pub fn retry_sync_task(
    task_id: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    with_tasks(&app, state.clone(), |tasks| {
        if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
            task.status = "pending".into();
            task.progress = 0;
            task.lifecycle_state = "preparing".into();
            task.counters.processed = 0;
            task.counters.failed = 0;
            task.counters.succeeded = 0;
            task.errors.clear();
            task.failure_summary = None;
            task.updated_at = now_iso();
        }
        Ok(())
    })?;
    start_sync_task(task_id, app, state)
}

#[tauri::command]
pub fn start_sync_task(
    task_id: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    authorized_config_for_session(&app, &settings).map_err(|result| result.validation.message)?;
    {
        let mut running = state
            .running_task_ids
            .lock()
            .map_err(|err| err.to_string())?;
        if !running.insert(task_id.clone()) {
            return Ok(());
        }
    }
    with_tasks(&app, state, |tasks| {
        if let Some(task) = tasks.iter_mut().find(|task| task.id == task_id) {
            task.status = "syncing".into();
            task.lifecycle_state = "discovering".into();
            task.updated_at = now_iso();
            emit_task_event(&app, "sync-status-changed", task);
        }
        Ok(())
    })?;

    spawn_sync_progress(task_id, app);

    Ok(())
}

#[tauri::command]
pub fn resume_sync_tasks(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<Vec<SyncTask>, String> {
    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    authorized_config_for_session(&app, &settings).map_err(|result| result.validation.message)?;
    {
        let mut tasks = state.tasks.lock().map_err(|err| err.to_string())?;
        if tasks.is_empty() {
            *tasks = load_tasks_from_disk(&app)?;
        }
    }
    let tasks = state.tasks.lock().map_err(|err| err.to_string())?.clone();

    let resumable: Vec<SyncTask> = tasks
        .into_iter()
        .filter(|task| task.status == "pending" || task.status == "syncing")
        .collect();

    for task in &resumable {
        if task.status == "syncing" {
            let _ = with_tasks(&app, state.clone(), |tasks| {
                if let Some(existing) = tasks.iter_mut().find(|existing| existing.id == task.id) {
                    existing.status = "pending".into();
                    existing.lifecycle_state = "preparing".into();
                    existing.updated_at = now_iso();
                }
                Ok(())
            });
        }
        let _ = start_sync_task(task.id.clone(), app.clone(), app.state::<AppState>());
    }

    Ok(resumable)
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoveSyncedDocumentsRequest {
    pub sync_root: String,
    pub document_ids: Vec<String>,
}

#[tauri::command]
pub fn remove_synced_documents(
    _app: AppHandle,
    request: RemoveSyncedDocumentsRequest,
) -> Result<u32, String> {
    let path = std::path::Path::new(&request.sync_root);
    let mut manifest = crate::storage::load_manifest(path).unwrap_or_default();

    // Collect output paths and image assets to delete
    let to_remove: Vec<(String, Vec<String>)> = request
        .document_ids
        .iter()
        .filter_map(|id| {
            manifest
                .records
                .iter()
                .find(|r| r.document_id == *id)
                .map(|r| (r.output_path.clone(), r.image_assets.clone()))
        })
        .collect();

    // Remove files
    let mut deleted_count = 0u32;
    for (output_path, image_assets) in &to_remove {
        let file_path = std::path::Path::new(output_path);
        if file_path.exists() {
            let _ = fs::remove_file(file_path);
            deleted_count += 1;
        }
        for asset in image_assets {
            let asset_path = std::path::Path::new(output_path)
                .parent()
                .unwrap_or(std::path::Path::new(&request.sync_root))
                .join(asset);
            if asset_path.exists() {
                let _ = fs::remove_file(&asset_path);
            }
        }
    }

    // Remove from manifest
    remove_manifest_records(&mut manifest, &request.document_ids);
    crate::storage::save_manifest(path, &manifest)?;

    // Clean up empty directories
    clean_empty_dirs(path);

    Ok(deleted_count)
}

/// Deletes on-disk outputs for the given document ids and clears version fields on manifest
/// rows so a subsequent sync run re-downloads content. Unlike `remove_synced_documents`,
/// manifest rows are retained.
pub(crate) fn prepare_force_repulled_documents_impl(
    sync_root: &str,
    document_ids: &[String],
) -> Result<u32, String> {
    let root = Path::new(sync_root);
    let mut manifest = crate::storage::load_manifest(root).unwrap_or_default();
    let mut touched = 0u32;

    for id in document_ids {
        let Some(record) = manifest
            .records
            .iter_mut()
            .find(|r| r.document_id == *id)
        else {
            continue;
        };

        let output_path = Path::new(&record.output_path);
        if output_path.is_file() {
            let _ = fs::remove_file(output_path);
        }
        for asset in &record.image_assets {
            let asset_path = output_path
                .parent()
                .unwrap_or(root)
                .join(asset);
            if asset_path.is_file() {
                let _ = fs::remove_file(asset_path);
            }
        }

        // Wiki tree: `Title.md` alongside `Title/` for child markdown. Stripping only the file
        // leaves `Title/` so descendants remain and sync skips them as unchanged.
        if output_path.extension().and_then(|e| e.to_str()) == Some("md") {
            if let Some(parent_dir) = output_path.parent() {
                if let Some(stem) = output_path.file_stem().and_then(|s| s.to_str()) {
                    let wiki_child_dir = parent_dir.join(stem);
                    if wiki_child_dir.is_dir() {
                        let _ = fs::remove_dir_all(&wiki_child_dir);
                    }
                }
            }
        }

        record.version.clear();
        record.update_time.clear();
        record.content_hash.clear();
        touched += 1;
    }

    crate::storage::save_manifest(root, &manifest)?;
    clean_empty_dirs(root);
    Ok(touched)
}

#[tauri::command]
pub fn prepare_force_repulled_documents(
    _app: AppHandle,
    request: RemoveSyncedDocumentsRequest,
) -> Result<u32, String> {
    prepare_force_repulled_documents_impl(&request.sync_root, &request.document_ids)
}

#[tauri::command]
pub async fn check_document_freshness(
    app: AppHandle,
    document_ids: Vec<String>,
    sync_root: String,
) -> Result<std::collections::HashMap<String, crate::model::DocumentFreshnessResult>, String> {
    if document_ids.is_empty() {
        return Ok(std::collections::HashMap::new());
    }

    let settings: AppSettings = load_json_file(settings_file_path(&app)?)?
        .ok_or_else(|| "请先在设置页保存飞书应用配置".to_string())?;
    let (_, config) = authorized_config_for_session(&app, &settings)
        .map_err(|result| result.validation.message)?;

    let client = FeishuOpenApiClient::new(config);
    let manifest =
        crate::storage::load_manifest(std::path::Path::new(&sync_root)).unwrap_or_default();

    // Minimum pause between starting consecutive docx document-summary OpenAPI calls.
    const FRESHNESS_DOCX_REQUEST_GAP_MS: u64 = 400;

    let result = tokio::task::spawn_blocking(move || {
        let mut freshness_map = std::collections::HashMap::new();
        let mut gap_before_next_docx_call = false;

        for document_id in &document_ids {
            let local_record = manifest
                .records
                .iter()
                .find(|r| r.document_id == *document_id);

            // bitable/sheet documents are synced via the export task API
            // and cannot be queried through the docx document summary API;
            // treat them as "current" since we have no lightweight freshness
            // check available for them.
            let is_export_only = local_record
                .map(|r| r.source_signature.starts_with("export:"))
                .unwrap_or(false);

            if is_export_only {
                if let Some(record) = local_record {
                    freshness_map.insert(
                        document_id.clone(),
                        crate::model::DocumentFreshnessResult {
                            status: "current".to_string(),
                            local_version: record.version.clone(),
                            remote_version: record.version.clone(),
                            local_update_time: record.update_time.clone(),
                            remote_update_time: record.update_time.clone(),
                            error: None,
                        },
                    );
                }
                continue;
            }

            if gap_before_next_docx_call {
                thread::sleep(Duration::from_millis(FRESHNESS_DOCX_REQUEST_GAP_MS));
            }

            match client.fetch_document_summary_with_retry(document_id) {
                Ok(summary) => {
                    let (
                        status,
                        local_version,
                        remote_version,
                        local_update_time,
                        remote_update_time,
                    ) = if let Some(record) = local_record {
                        if record.version == summary.version
                            && record.update_time == summary.update_time
                        {
                            (
                                "current".to_string(),
                                record.version.clone(),
                                summary.version,
                                record.update_time.clone(),
                                summary.update_time,
                            )
                        } else {
                            (
                                "updated".to_string(),
                                record.version.clone(),
                                summary.version,
                                record.update_time.clone(),
                                summary.update_time,
                            )
                        }
                    } else {
                        (
                            "new".to_string(),
                            String::new(),
                            summary.version,
                            String::new(),
                            summary.update_time,
                        )
                    };

                    freshness_map.insert(
                        document_id.clone(),
                        crate::model::DocumentFreshnessResult {
                            status,
                            local_version,
                            remote_version,
                            local_update_time,
                            remote_update_time,
                            error: None,
                        },
                    );
                }
                Err(err) => {
                    freshness_map.insert(
                        document_id.clone(),
                        crate::model::DocumentFreshnessResult {
                            status: "error".to_string(),
                            local_version: local_record
                                .map(|r| r.version.clone())
                                .unwrap_or_default(),
                            remote_version: String::new(),
                            local_update_time: local_record
                                .map(|r| r.update_time.clone())
                                .unwrap_or_default(),
                            remote_update_time: String::new(),
                            error: Some(err.to_string()),
                        },
                    );
                }
            }
            gap_before_next_docx_call = true;
        }

        freshness_map
    })
    .await
    .map_err(|err| format!("freshness check panicked: {err}"))?;

    Ok(result)
}

#[tauri::command]
pub async fn load_freshness_metadata(
    sync_root: String,
) -> Result<std::collections::HashMap<String, crate::model::DocumentFreshnessResult>, String> {
    let path = std::path::Path::new(&sync_root);
    crate::storage::load_all_freshness_metadata(path)
}

#[tauri::command]
pub async fn save_freshness_metadata(
    sync_root: String,
    metadata: std::collections::HashMap<String, crate::model::DocumentFreshnessResult>,
) -> Result<(), String> {
    let path = std::path::Path::new(&sync_root);
    crate::storage::save_freshness_metadata(path, &metadata)
}

#[tauri::command]
pub async fn align_document_sync_versions(
    sync_root: String,
    metadata: std::collections::HashMap<String, crate::model::DocumentFreshnessResult>,
    force: bool,
) -> Result<std::collections::HashMap<String, crate::model::DocumentFreshnessResult>, String> {
    let path = std::path::Path::new(&sync_root);
    crate::storage::align_manifest_versions(path, &metadata, force)
}

#[tauri::command]
pub async fn clear_freshness_metadata(
    sync_root: String,
    document_ids: Vec<String>,
) -> Result<(), String> {
    let path = std::path::Path::new(&sync_root);
    crate::storage::clear_freshness_metadata(path, &document_ids)
}

#[tauri::command]
pub fn open_workspace_folder(app: AppHandle, path: String) -> Result<(), String> {
    let workspace_path = PathBuf::from(&path);
    if !workspace_path.exists() {
        return Err(format!("path not found: {path}"));
    }
    if !workspace_path.is_file() && !workspace_path.is_dir() {
        return Err(format!("path is not a file or directory: {path}"));
    }

    app.opener()
        .open_path(workspace_path.to_string_lossy().into_owned(), None::<&str>)
        .map_err(|err| format!("failed to open workspace path: {err}"))
}

/// Remove empty directories bottom-up within the sync root.
fn clean_empty_dirs(sync_root: &Path) {
    fn is_empty_dir(p: &Path) -> bool {
        fs::read_dir(p)
            .map(|mut entries| entries.next().is_none())
            .unwrap_or(false)
    }

    fn remove_empty_recursive(dir: &Path, root: &Path) {
        if !dir.is_dir() {
            return;
        }
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    remove_empty_recursive(&path, root);
                }
            }
        }
        if dir != root && is_empty_dir(dir) {
            let _ = fs::remove_dir(dir);
        }
    }

    remove_empty_recursive(sync_root, sync_root);
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;

    fn sample_user() -> UserInfo {
        UserInfo {
            name: "测试用户".into(),
            avatar: None,
            email: None,
            user_id: Some("ou_test".into()),
        }
    }

    fn sample_space(id: &str, name: &str) -> KnowledgeBaseSpace {
        KnowledgeBaseSpace {
            id: id.into(),
            name: name.into(),
            selected: false,
        }
    }

    fn sample_document_scope(
        space_id: &str,
        space_name: &str,
        document_id: &str,
        title: &str,
    ) -> SelectedSyncScope {
        SelectedSyncScope {
            kind: "document".into(),
            space_id: space_id.into(),
            space_name: space_name.into(),
            title: title.into(),
            display_path: format!("{space_name} / {title}"),
            node_token: Some(format!("node-{document_id}")),
            document_id: Some(document_id.into()),
            path_segments: vec![title.into()],
            includes_descendants: false,
        }
    }

    fn sample_folder_scope(
        space_id: &str,
        space_name: &str,
        node_token: &str,
        title: &str,
    ) -> SelectedSyncScope {
        SelectedSyncScope {
            kind: "folder".into(),
            space_id: space_id.into(),
            space_name: space_name.into(),
            title: title.into(),
            display_path: format!("{space_name} / {title}"),
            node_token: Some(node_token.into()),
            document_id: None,
            path_segments: vec![title.into()],
            includes_descendants: false,
        }
    }

    #[test]
    fn false_negative_preflight_can_recover_when_spaces_are_accessible() {
        let recovered = build_connected_result(
            sample_user(),
            vec![sample_space("space-a", "研发知识库")],
            "已通过配置的 Wiki Space IDs 验证到可访问的知识空间。",
            Some("list_spaces failed before configured-id probe succeeded".into()),
        );

        assert_eq!(recovered.validation.status, "connected-with-spaces");
        assert!(recovered.validation.usable);
        assert_eq!(recovered.spaces.len(), 1);
    }

    #[test]
    fn permission_errors_are_classified_explicitly() {
        let validation = classify_discovery_error(
            &McpError::Transport("List spaces request failed: permission denied".into()),
            "list_spaces",
        );

        assert_eq!(validation.status, "permission-denied");
        assert!(!validation.usable);
    }

    #[test]
    fn invalid_responses_are_classified_as_unexpected_response() {
        let validation = classify_discovery_error(
            &McpError::InvalidResponse("Space list missing items".into()),
            "list_spaces",
        );

        assert_eq!(validation.status, "unexpected-response");
        assert!(!validation.usable);
    }

    #[test]
    fn empty_connected_result_is_not_treated_as_failure() {
        let result = build_empty_connected_result(
            sample_user(),
            "连接已建立，但当前账号下没有可访问的知识空间。",
            Some("list_spaces succeeded with zero accessible spaces".into()),
        );

        assert_eq!(result.validation.status, "connected-no-spaces");
        assert!(result.validation.usable);
        assert!(result.spaces.is_empty());
        assert_eq!(
            result.user.as_ref().map(|user| user.name.as_str()),
            Some("测试用户")
        );
    }

    #[test]
    fn signed_out_result_is_not_usable() {
        let result = build_not_signed_in_result("需要先登录");

        assert_eq!(result.validation.status, "not-signed-in");
        assert!(!result.validation.usable);
        assert!(result.user.is_none());
    }

    #[test]
    fn validates_same_space_multi_document_selection() {
        let selected_sources = validate_selected_sources(&[
            sample_document_scope("kb-eng", "研发知识库", "doc-a", "A"),
            sample_document_scope("kb-eng", "研发知识库", "doc-b", "B"),
            sample_document_scope("kb-eng", "研发知识库", "doc-a", "A"),
        ])
        .expect("selection should be valid");

        assert_eq!(selected_sources.len(), 2);
        assert_eq!(selected_sources[0].document_id.as_deref(), Some("doc-a"));
        assert_eq!(selected_sources[1].document_id.as_deref(), Some("doc-b"));
    }

    #[test]
    fn rejects_cross_space_multi_source_selection() {
        let result = validate_selected_sources(&[
            sample_document_scope("kb-eng", "研发知识库", "doc-a", "A"),
            sample_document_scope("kb-product", "产品知识库", "doc-b", "B"),
        ]);

        assert!(result.is_err());
        assert_eq!(
            result.err().as_deref(),
            Some("一次只能在同一知识库内组合选择目录或文档。")
        );
    }

    #[test]
    fn normalizes_overlapping_folder_and_document_selection() {
        let selected_sources = validate_selected_sources(&[
            sample_folder_scope("kb-product", "产品知识库", "product-library", "方案库"),
            SelectedSyncScope {
                display_path: "产品知识库 / 方案库 / Product Overview".into(),
                path_segments: vec!["方案库".into(), "Product Overview".into()],
                ..sample_document_scope(
                    "kb-product",
                    "产品知识库",
                    "doc-product-overview",
                    "Product Overview",
                )
            },
        ])
        .expect("selection should be valid");

        assert_eq!(selected_sources.len(), 1);
        assert_eq!(selected_sources[0].kind, "folder");
    }

    #[test]
    fn builds_multi_document_selection_summary() {
        let selected_sources = vec![
            sample_document_scope("kb-eng", "研发知识库", "doc-a", "A"),
            sample_document_scope("kb-eng", "研发知识库", "doc-b", "B"),
        ];

        let summary =
            build_selection_summary(&selected_sources, None, None).expect("summary should exist");

        assert_eq!(summary.kind, "multi-document");
        assert_eq!(summary.space_id, "kb-eng");
        assert_eq!(summary.document_count, 2);
        assert_eq!(summary.preview_paths.len(), 2);
    }

    #[test]
    fn builds_multi_source_selection_summary() {
        let selected_sources = vec![
            sample_folder_scope("kb-eng", "研发知识库", "eng-guides", "研发规范"),
            SelectedSyncScope {
                display_path: "研发知识库 / 研发规范 / 研发API概览".into(),
                path_segments: vec!["研发规范".into(), "研发API概览".into()],
                ..sample_document_scope("kb-eng", "研发知识库", "doc-eng-api", "研发API概览")
            },
        ];

        let summary = build_selection_summary(&selected_sources, None, Some(3))
            .expect("summary should exist");

        assert_eq!(summary.kind, "multi-source");
        assert_eq!(summary.space_id, "kb-eng");
        assert_eq!(summary.document_count, 3);
        assert!(summary.display_path.contains("同步根"));
    }

    #[test]
    fn builds_subtree_selection_summary_with_effective_document_count() {
        let mut selected_scope = sample_document_scope(
            "kb-product",
            "产品知识库",
            "doc-product-roadmap",
            "产品方案总览",
        );
        selected_scope.path_segments = vec!["方案库".into(), "产品方案总览".into()];
        selected_scope.includes_descendants = true;

        let summary = build_selection_summary(&[selected_scope], None, Some(2))
            .expect("summary should exist");

        assert_eq!(summary.kind, "document");
        assert!(summary.includes_descendants);
        assert_eq!(summary.document_count, 2);
        assert_eq!(summary.root_count, 1);
    }

    #[test]
    fn builds_folder_selection_summary_with_effective_document_count() {
        let summary = build_selection_summary(
            &[sample_folder_scope(
                "kb-product",
                "产品知识库",
                "product-library",
                "方案库",
            )],
            None,
            Some(3),
        )
        .expect("summary should exist");

        assert_eq!(summary.kind, "folder");
        assert_eq!(summary.document_count, 3);
        assert_eq!(summary.root_count, 1);
    }

    #[test]
    fn normalizes_legacy_system_time_debug_timestamp() {
        let normalized = normalize_timestamp_string("SystemTime { intervals: 134190038946973727 }");

        assert!(chrono::DateTime::parse_from_rfc3339(&normalized).is_ok());
    }

    #[test]
    fn resolves_relative_sync_root_against_base_path() {
        let resolved =
            resolve_sync_root_from_base(Path::new("C:/Users/test/Documents"), "./synced-docs")
                .expect("sync root should resolve");

        assert_eq!(
            resolved.to_string_lossy().replace('\\', "/"),
            "C:/Users/test/Documents/synced-docs"
        );
    }

    #[test]
    fn builds_failure_summary_from_dominant_category() {
        let errors = vec![
            SyncRunError {
                document_id: "doc-1".into(),
                title: "文档一".into(),
                category: "content-fetch".into(),
                message: "内容接口返回 400".into(),
            },
            SyncRunError {
                document_id: "doc-2".into(),
                title: "文档二".into(),
                category: "content-fetch".into(),
                message: "内容接口返回 400".into(),
            },
            SyncRunError {
                document_id: "doc-3".into(),
                title: "文档三".into(),
                category: "filesystem-write".into(),
                message: "磁盘写入失败".into(),
            },
        ];

        let summary = build_failure_summary(&errors).expect("summary should exist");

        assert_eq!(summary.category, "content-fetch");
        assert_eq!(summary.count, 2);
        assert!(summary.message.contains("内容抓取"));
    }

    #[test]
    fn fixture_tree_loading_returns_only_direct_children() {
        let root_nodes = fixture_space_nodes("kb-product", None);
        assert_eq!(root_nodes.len(), 1);
        assert_eq!(root_nodes[0].title, "方案库");
        assert!(root_nodes[0].children.is_empty());
        assert!(root_nodes[0].is_expandable);

        let level_one_nodes = fixture_space_nodes("kb-product", Some("product-library"));
        assert_eq!(level_one_nodes.len(), 2);
        assert!(level_one_nodes.iter().all(|node| node.children.is_empty()));

        let parent_document = level_one_nodes
            .iter()
            .find(|node| node.node_token == "node-doc-product-roadmap")
            .expect("parent document should exist");
        assert_eq!(parent_document.kind, "document");
        assert!(parent_document.is_expandable);

        let level_two_nodes = fixture_space_nodes("kb-product", Some("node-doc-product-roadmap"));
        assert_eq!(level_two_nodes.len(), 2);
        assert!(level_two_nodes.iter().all(|node| node.children.is_empty()));
        assert!(level_two_nodes
            .iter()
            .any(|node| node.kind == "bitable" && !node.is_expandable));
    }

    #[test]
    fn fixture_library_root_discovers_all_descendant_documents() {
        let documents = fixture_documents_for_sources(&[sample_folder_scope(
            "kb-product",
            "产品知识库",
            "product-library",
            "方案库",
        )]);

        assert_eq!(documents.len(), 4);
        assert_eq!(
            documents[0].source_path,
            "产品知识库/方案库/Product Overview"
        );
        assert_eq!(
            documents[2].source_path,
            "产品知识库/方案库/产品方案总览/2026 H1 路线图"
        );
        assert_eq!(
            documents[3].source_path,
            "产品知识库/方案库/产品方案总览/需求池"
        );
        assert_eq!(documents[3].obj_type, "bitable");
    }

    #[test]
    fn wiki_node_metadata_is_sufficient_for_discovery_queue() {
        let node = crate::mcp::FeishuWikiNode {
            space_id: "kb-product".into(),
            node_token: "node-doc-product-overview".into(),
            obj_token: "doc-product-overview".into(),
            obj_type: "docx".into(),
            title: "Product Overview".into(),
            has_child: false,
            version: "v3".into(),
            update_time: "2026-03-27T11:00:00Z".into(),
        };

        assert!(wiki_node_has_discovery_metadata(&node));

        let document = build_sync_document_from_wiki_node(
            "产品知识库",
            &["方案库".into(), "Product Overview".into()],
            &node,
        );

        assert_eq!(document.document_id, "doc-product-overview");
        assert_eq!(document.title, "Product Overview");
        assert_eq!(document.version, "v3");
        assert_eq!(document.update_time, "2026-03-27T11:00:00Z");
        assert_eq!(document.source_path, "产品知识库/方案库/Product Overview");
    }

    #[test]
    fn incomplete_wiki_node_metadata_requires_summary_fallback() {
        let node = crate::mcp::FeishuWikiNode {
            space_id: "kb-product".into(),
            node_token: "node-doc-product-overview".into(),
            obj_token: "doc-product-overview".into(),
            obj_type: "docx".into(),
            title: "Product Overview".into(),
            has_child: false,
            version: String::new(),
            update_time: "2026-03-27T11:00:00Z".into(),
        };

        assert!(!wiki_node_has_discovery_metadata(&node));
    }

    #[test]
    fn bitable_kind_is_classified_as_non_expandable_leaf() {
        assert_eq!(node_kind_from_obj_type("wiki", false), "folder");
        assert_eq!(node_kind_from_obj_type("folder", false), "folder");
        assert_eq!(node_kind_from_obj_type("bitable", false), "bitable");
        assert_eq!(node_kind_from_obj_type("sheet", false), "bitable");
        assert_eq!(node_kind_from_obj_type("unknown-leaf", false), "bitable");
        assert_eq!(node_kind_from_obj_type("unknown-folder", true), "folder");
        assert!(!is_expandable_node("bitable", true));
    }

    #[test]
    fn unchanged_check_uses_xlsx_output_for_bitable_records() {
        let document = SyncSourceDocument {
            document_id: "bitable-product-demand-pool".into(),
            space_id: "kb-product".into(),
            space_name: "产品知识库".into(),
            node_token: "node-bitable-product-demand-pool".into(),
            title: "需求池".into(),
            version: "v1".into(),
            update_time: "u1".into(),
            path_segments: vec!["方案库".into(), "产品方案总览".into(), "需求池".into()],
            source_path: "产品知识库/方案库/产品方案总览/需求池".into(),
            obj_type: "bitable".into(),
        };
        let sync_root = std::env::temp_dir().join("feishu-unchanged-bitable-test");
        let _ = fs::remove_dir_all(&sync_root);
        fs::create_dir_all(&sync_root).expect("mkdir");
        let output_path = crate::sync::expected_output_path(&sync_root, &document);
        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent).expect("mkdir parent");
        }
        fs::write(&output_path, b"x").expect("write output");

        let manifest = crate::model::SyncManifest {
            records: vec![crate::model::ManifestRecord {
                document_id: document.document_id.clone(),
                space_id: document.space_id.clone(),
                space_name: document.space_name.clone(),
                node_token: document.node_token.clone(),
                title: document.title.clone(),
                version: document.version.clone(),
                update_time: document.update_time.clone(),
                source_path: document.source_path.clone(),
                path_segments: document.path_segments.clone(),
                output_path: output_path.to_string_lossy().to_string(),
                content_hash: "hash".into(),
                source_signature: "export:xlsx".into(),
                status: "success".into(),
                image_assets: vec![],
                last_synced_at: "2026-03-30T00:00:00Z".into(),
            }],
        };

        assert!(is_document_unchanged(&document, &sync_root, &manifest));
        let _ = fs::remove_dir_all(&sync_root);
    }

    #[test]
    fn unchanged_check_false_when_output_file_missing() {
        let document = SyncSourceDocument {
            document_id: "doc-missing-file".into(),
            space_id: "kb-product".into(),
            space_name: "产品知识库".into(),
            node_token: "node-1".into(),
            title: "T".into(),
            version: "v1".into(),
            update_time: "u1".into(),
            path_segments: vec!["A".into(), "B".into()],
            source_path: "产品知识库/A/B".into(),
            obj_type: "docx".into(),
        };
        let sync_root = std::env::temp_dir().join("feishu-unchanged-missing-test");
        let _ = fs::remove_dir_all(&sync_root);
        fs::create_dir_all(&sync_root).expect("mkdir");
        let output_path = crate::sync::expected_output_path(&sync_root, &document);

        let manifest = crate::model::SyncManifest {
            records: vec![crate::model::ManifestRecord {
                document_id: document.document_id.clone(),
                space_id: document.space_id.clone(),
                space_name: document.space_name.clone(),
                node_token: document.node_token.clone(),
                title: document.title.clone(),
                version: document.version.clone(),
                update_time: document.update_time.clone(),
                source_path: document.source_path.clone(),
                path_segments: document.path_segments.clone(),
                output_path: output_path.to_string_lossy().to_string(),
                content_hash: "hash".into(),
                source_signature: "".into(),
                status: "success".into(),
                image_assets: vec![],
                last_synced_at: "2026-03-30T00:00:00Z".into(),
            }],
        };

        assert!(!is_document_unchanged(&document, &sync_root, &manifest));
        let _ = fs::remove_dir_all(&sync_root);
    }

    #[test]
    fn document_sync_statuses_skip_success_rows_when_output_is_missing() {
        let sync_root = std::env::temp_dir().join("feishu-sync-status-missing-output-test");
        let _ = fs::remove_dir_all(&sync_root);
        fs::create_dir_all(&sync_root).expect("mkdir");

        let existing_output = sync_root.join("KB").join("Kept.md");
        fs::create_dir_all(existing_output.parent().unwrap()).expect("mkdir parent");
        fs::write(&existing_output, b"kept").expect("write kept output");

        let missing_output = sync_root.join("KB").join("Missing.md");
        let failed_output = sync_root.join("KB").join("Failed.md");

        let manifest = crate::model::SyncManifest {
            records: vec![
                crate::model::ManifestRecord {
                    document_id: "doc-kept".into(),
                    space_id: "kb".into(),
                    space_name: "KB".into(),
                    node_token: "node-kept".into(),
                    title: "Kept".into(),
                    version: "v1".into(),
                    update_time: "t1".into(),
                    source_path: "KB/Kept".into(),
                    path_segments: vec![],
                    output_path: existing_output.to_string_lossy().to_string(),
                    content_hash: "h1".into(),
                    source_signature: "".into(),
                    status: "success".into(),
                    image_assets: vec![],
                    last_synced_at: "2026-04-02T00:00:00Z".into(),
                },
                crate::model::ManifestRecord {
                    document_id: "doc-missing".into(),
                    space_id: "kb".into(),
                    space_name: "KB".into(),
                    node_token: "node-missing".into(),
                    title: "Missing".into(),
                    version: "v2".into(),
                    update_time: "t2".into(),
                    source_path: "KB/Missing".into(),
                    path_segments: vec![],
                    output_path: missing_output.to_string_lossy().to_string(),
                    content_hash: "h2".into(),
                    source_signature: "".into(),
                    status: "success".into(),
                    image_assets: vec![],
                    last_synced_at: "2026-04-02T00:00:00Z".into(),
                },
                crate::model::ManifestRecord {
                    document_id: "doc-failed".into(),
                    space_id: "kb".into(),
                    space_name: "KB".into(),
                    node_token: "node-failed".into(),
                    title: "Failed".into(),
                    version: "v3".into(),
                    update_time: "t3".into(),
                    source_path: "KB/Failed".into(),
                    path_segments: vec![],
                    output_path: failed_output.to_string_lossy().to_string(),
                    content_hash: "h3".into(),
                    source_signature: "".into(),
                    status: "failed".into(),
                    image_assets: vec![],
                    last_synced_at: "2026-04-02T00:00:00Z".into(),
                },
            ],
        };
        crate::storage::save_manifest(&sync_root, &manifest).expect("save manifest");

        let statuses = get_document_sync_statuses(sync_root.to_string_lossy().to_string());
        assert_eq!(
            statuses.get("doc-kept").map(|entry| entry.status.as_str()),
            Some("synced")
        );
        assert!(!statuses.contains_key("doc-missing"));
        assert_eq!(
            statuses.get("doc-failed").map(|entry| entry.status.as_str()),
            Some("failed")
        );

        let _ = fs::remove_dir_all(&sync_root);
    }

    #[test]
    fn prepare_force_repulled_removes_file_and_clears_versions() {
        let sync_root = std::env::temp_dir().join("feishu-force-repull-test");
        let _ = fs::remove_dir_all(&sync_root);
        fs::create_dir_all(&sync_root).expect("mkdir");
        let doc_id = "doc-force-1";
        let sub = sync_root.join("kb");
        fs::create_dir_all(&sub).expect("mkdir sub");
        let out = sub.join("out.md");
        fs::write(&out, b"body").expect("write");
        let asset = sub.join("_assets").join("a.png");
        fs::create_dir_all(asset.parent().unwrap()).expect("mkdir assets");
        fs::write(&asset, b"png").expect("write asset");

        let manifest = crate::model::SyncManifest {
            records: vec![crate::model::ManifestRecord {
                document_id: doc_id.into(),
                space_id: "kb".into(),
                space_name: "KB".into(),
                node_token: "n1".into(),
                title: "T".into(),
                version: "v9".into(),
                update_time: "t9".into(),
                source_path: "KB/T".into(),
                path_segments: vec![],
                output_path: out.to_string_lossy().to_string(),
                content_hash: "h".into(),
                source_signature: "".into(),
                status: "success".into(),
                image_assets: vec!["_assets/a.png".into()],
                last_synced_at: "2026-03-30T00:00:00Z".into(),
            }],
        };
        crate::storage::save_manifest(&sync_root, &manifest).expect("save");

        let n = prepare_force_repulled_documents_impl(
            sync_root.to_str().unwrap(),
            &[doc_id.into()],
        )
        .expect("prep");
        assert_eq!(n, 1);
        assert!(!out.exists());
        assert!(!asset.exists());
        let loaded = crate::storage::load_manifest(&sync_root).expect("load");
        let r = loaded.records.iter().find(|r| r.document_id == doc_id).unwrap();
        assert!(r.version.is_empty());
        assert!(r.update_time.is_empty());
        assert!(r.content_hash.is_empty());

        let _ = fs::remove_dir_all(&sync_root);
    }

    #[test]
    fn prepare_force_repulled_removes_wiki_child_directory_next_to_markdown() {
        let sync_root = std::env::temp_dir().join("feishu-force-repull-wiki-child-test");
        let _ = fs::remove_dir_all(&sync_root);
        fs::create_dir_all(&sync_root).expect("mkdir");
        let doc_id = "doc-parent-wiki";
        let kb = sync_root.join("KB");
        let parent_md = kb.join("Parent.md");
        fs::create_dir_all(parent_md.parent().unwrap()).expect("mkdir kb");
        fs::write(&parent_md, b"parent").expect("write parent");
        let child_dir = kb.join("Parent");
        fs::create_dir_all(&child_dir).expect("mkdir child scope");
        let child_md = child_dir.join("Child.md");
        fs::write(&child_md, b"child").expect("write child");

        let manifest = crate::model::SyncManifest {
            records: vec![crate::model::ManifestRecord {
                document_id: doc_id.into(),
                space_id: "s".into(),
                space_name: "KB".into(),
                node_token: "n1".into(),
                title: "Parent".into(),
                version: "v1".into(),
                update_time: "t1".into(),
                source_path: "KB/Parent".into(),
                path_segments: vec![],
                output_path: parent_md.to_string_lossy().to_string(),
                content_hash: "h".into(),
                source_signature: "".into(),
                status: "success".into(),
                image_assets: vec![],
                last_synced_at: "2026-03-30T00:00:00Z".into(),
            }],
        };
        crate::storage::save_manifest(&sync_root, &manifest).expect("save");

        let n = prepare_force_repulled_documents_impl(sync_root.to_str().unwrap(), &[doc_id.into()])
            .expect("prep");
        assert_eq!(n, 1);
        assert!(!parent_md.exists());
        assert!(!child_md.exists());
        assert!(!child_dir.exists());

        let _ = fs::remove_dir_all(&sync_root);
    }

    #[test]
    fn bitable_sheet_obj_type_is_recognized_as_export_only() {
        // Only export-only objects should use the export download path.
        let bitable = SyncSourceDocument {
            document_id: "btbl001".into(),
            space_id: "sp1".into(),
            space_name: "KB".into(),
            node_token: "nd1".into(),
            title: "T".into(),
            version: "v1".into(),
            update_time: "u1".into(),
            path_segments: vec![],
            source_path: "KB/T".into(),
            obj_type: "bitable".into(),
        };
        let sheet = SyncSourceDocument {
            obj_type: "sheet".into(),
            ..bitable.clone()
        };
        let docx = SyncSourceDocument {
            obj_type: "docx".into(),
            ..bitable.clone()
        };

        for (doc, expected) in [
            (&bitable, true),
            (&sheet, true),
            (&docx, false),
        ] {
            assert_eq!(
                uses_export_download(doc, true),
                expected,
                "obj_type={}",
                doc.obj_type
            );
        }

        assert!(!uses_export_download(&bitable, false));
    }
}
