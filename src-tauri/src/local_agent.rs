use std::collections::HashMap;
use std::net::SocketAddr;

use axum::{
    extract::{Path as AxumPath, Query, State as AxumState},
    http::{header, HeaderValue, Method, StatusCode},
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::{AllowOrigin, CorsLayer};

use tauri::{async_runtime, AppHandle, Manager};

use crate::{
    commands::{
        self, AppBootstrap, AppSettings, AppState, ConnectionCheckResult, CreateSyncTaskRequest,
        KnowledgeBaseNode, RemoveSyncedDocumentsRequest, RuntimeInfo, SyncTask,
    },
    model::{DocumentFreshnessResult, DocumentSyncStatusEntry, SyncedMarkdownPreview},
};

const DEFAULT_LOCAL_AGENT_HOST: &str = "127.0.0.1";
const DEFAULT_LOCAL_AGENT_PORT: u16 = 43127;

#[derive(Clone)]
struct LocalAgentContext {
    app: AppHandle,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AgentHealth {
    ok: bool,
    runtime: &'static str,
    version: &'static str,
    base_url: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SimpleSuccess {
    success: bool,
}

#[derive(Serialize)]
struct AgentError {
    error: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AuthBeginRequest {
    redirect_uri: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AuthCompleteRequest {
    code: String,
    redirect_uri: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TreeQuery {
    parent_node_token: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SyncRootQuery {
    sync_root: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PreviewReadRequest {
    sync_root: String,
    document_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FreshnessCheckRequest {
    document_ids: Vec<String>,
    sync_root: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FreshnessLoadRequest {
    sync_root: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FreshnessSaveRequest {
    sync_root: String,
    metadata: HashMap<String, DocumentFreshnessResult>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FreshnessAlignRequest {
    sync_root: String,
    metadata: HashMap<String, DocumentFreshnessResult>,
    force: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FreshnessClearRequest {
    sync_root: String,
    document_ids: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct OpenPathRequest {
    path: String,
}

type AgentResult<T> = Result<Json<T>, (StatusCode, Json<AgentError>)>;

fn local_agent_port() -> u16 {
    std::env::var("FLYCAT_LOCAL_AGENT_PORT")
        .ok()
        .and_then(|raw| raw.parse::<u16>().ok())
        .filter(|port| *port > 0)
        .unwrap_or(DEFAULT_LOCAL_AGENT_PORT)
}

fn local_agent_base_url() -> String {
    format!("http://{DEFAULT_LOCAL_AGENT_HOST}:{}", local_agent_port())
}

fn into_agent_error(error: String) -> (StatusCode, Json<AgentError>) {
    (StatusCode::BAD_REQUEST, Json(AgentError { error }))
}

fn success_response() -> Json<SimpleSuccess> {
    Json(SimpleSuccess { success: true })
}

fn localhost_cors() -> CorsLayer {
    CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([header::CONTENT_TYPE])
        .allow_origin(AllowOrigin::predicate(|origin: &HeaderValue, _request| {
            origin
                .to_str()
                .map(|value| {
                    value == "http://localhost"
                        || value == "https://localhost"
                        || value == "http://127.0.0.1"
                        || value == "https://127.0.0.1"
                        || value == "http://[::1]"
                        || value == "https://[::1]"
                        || value.starts_with("http://localhost:")
                        || value.starts_with("https://localhost:")
                        || value.starts_with("http://127.0.0.1:")
                        || value.starts_with("https://127.0.0.1:")
                        || value.starts_with("http://[::1]:")
                        || value.starts_with("https://[::1]:")
                })
                .unwrap_or(false)
        }))
}

fn build_router(app: AppHandle) -> Router {
    let context = LocalAgentContext { app };

    Router::new()
        .route("/api/v1/health", get(health))
        .route("/api/v1/runtime", get(runtime_info))
        .route("/api/v1/bootstrap", get(bootstrap))
        .route("/api/v1/settings", put(save_settings))
        .route("/api/v1/auth/begin", post(begin_auth))
        .route("/api/v1/auth/complete", post(complete_auth))
        .route("/api/v1/auth/validate", get(validate_auth))
        .route("/api/v1/auth/logout", post(logout))
        .route("/api/v1/spaces/{space_id}/tree", get(list_space_tree))
        .route(
            "/api/v1/tasks",
            get(list_tasks).post(create_task).delete(clear_tasks),
        )
        .route("/api/v1/tasks/resume", post(resume_tasks))
        .route("/api/v1/tasks/{task_id}/start", post(start_task))
        .route("/api/v1/tasks/{task_id}/retry", post(retry_task))
        .route("/api/v1/tasks/{task_id}", delete(delete_task))
        .route("/api/v1/synced-documents/ids", get(get_synced_document_ids))
        .route(
            "/api/v1/synced-documents/statuses",
            get(get_document_sync_statuses),
        )
        .route(
            "/api/v1/synced-documents/remove",
            post(remove_synced_documents),
        )
        .route(
            "/api/v1/synced-documents/prepare-force-repull",
            post(prepare_force_repull),
        )
        .route("/api/v1/preview/read", post(read_preview))
        .route("/api/v1/freshness/check", post(check_freshness))
        .route("/api/v1/freshness/load", post(load_freshness))
        .route("/api/v1/freshness/save", post(save_freshness))
        .route("/api/v1/freshness/align", post(align_freshness))
        .route("/api/v1/freshness/clear", post(clear_freshness))
        .route("/api/v1/system/open-path", post(open_path))
        .layer(localhost_cors())
        .with_state(context)
}

pub fn start_local_agent(app: AppHandle) {
    let bind_addr = SocketAddr::from(([127, 0, 0, 1], local_agent_port()));
    let router = build_router(app.clone());

    async_runtime::spawn(async move {
        let listener = match tokio::net::TcpListener::bind(bind_addr).await {
            Ok(listener) => listener,
            Err(error) => {
                eprintln!("local agent failed to bind {bind_addr}: {error}");
                return;
            }
        };

        if let Err(error) = axum::serve(listener, router).await {
            eprintln!("local agent stopped unexpectedly: {error}");
        }
    });
}

async fn health() -> Json<AgentHealth> {
    Json(AgentHealth {
        ok: true,
        runtime: "local-agent",
        version: env!("CARGO_PKG_VERSION"),
        base_url: local_agent_base_url(),
    })
}

async fn runtime_info() -> Json<RuntimeInfo> {
    Json(RuntimeInfo {
        runtime: "local-agent",
        version: env!("CARGO_PKG_VERSION"),
    })
}

async fn bootstrap(AxumState(context): AxumState<LocalAgentContext>) -> AgentResult<AppBootstrap> {
    commands::get_app_bootstrap(context.app)
        .await
        .map(Json)
        .map_err(into_agent_error)
}

async fn save_settings(
    AxumState(context): AxumState<LocalAgentContext>,
    Json(settings): Json<AppSettings>,
) -> AgentResult<AppSettings> {
    commands::save_app_settings(context.app, settings)
        .map(Json)
        .map_err(into_agent_error)
}

async fn begin_auth(
    AxumState(context): AxumState<LocalAgentContext>,
    Json(request): Json<AuthBeginRequest>,
) -> AgentResult<String> {
    commands::begin_user_authorization(context.app, request.redirect_uri)
        .map(Json)
        .map_err(into_agent_error)
}

async fn complete_auth(
    AxumState(context): AxumState<LocalAgentContext>,
    Json(request): Json<AuthCompleteRequest>,
) -> AgentResult<ConnectionCheckResult> {
    commands::complete_user_authorization(context.app, request.code, request.redirect_uri)
        .map(Json)
        .map_err(into_agent_error)
}

async fn validate_auth(
    AxumState(context): AxumState<LocalAgentContext>,
) -> AgentResult<ConnectionCheckResult> {
    commands::validate_feishu_connection(context.app)
        .map(Json)
        .map_err(into_agent_error)
}

async fn logout(AxumState(context): AxumState<LocalAgentContext>) -> AgentResult<SimpleSuccess> {
    commands::logout_user(context.app)
        .map(|_| success_response())
        .map_err(into_agent_error)
}

async fn list_space_tree(
    AxumState(context): AxumState<LocalAgentContext>,
    AxumPath(space_id): AxumPath<String>,
    Query(query): Query<TreeQuery>,
) -> AgentResult<Vec<KnowledgeBaseNode>> {
    commands::list_space_source_tree(context.app, space_id, query.parent_node_token)
        .await
        .map(Json)
        .map_err(into_agent_error)
}

async fn list_tasks(
    AxumState(context): AxumState<LocalAgentContext>,
) -> AgentResult<Vec<SyncTask>> {
    let app = context.app.clone();
    let state_app = app.clone();
    let state = state_app.state::<AppState>();
    commands::list_sync_tasks(app, state)
        .map(Json)
        .map_err(into_agent_error)
}

async fn create_task(
    AxumState(context): AxumState<LocalAgentContext>,
    Json(request): Json<CreateSyncTaskRequest>,
) -> AgentResult<SyncTask> {
    let app = context.app.clone();
    let state_app = app.clone();
    let state = state_app.state::<AppState>();
    commands::create_sync_task(app, request, state)
        .await
        .map(Json)
        .map_err(into_agent_error)
}

async fn start_task(
    AxumState(context): AxumState<LocalAgentContext>,
    AxumPath(task_id): AxumPath<String>,
) -> AgentResult<SimpleSuccess> {
    let app = context.app.clone();
    let state_app = app.clone();
    let state = state_app.state::<AppState>();
    commands::start_sync_task(task_id, app, state)
        .map(|_| success_response())
        .map_err(into_agent_error)
}

async fn retry_task(
    AxumState(context): AxumState<LocalAgentContext>,
    AxumPath(task_id): AxumPath<String>,
) -> AgentResult<SimpleSuccess> {
    let app = context.app.clone();
    let state_app = app.clone();
    let state = state_app.state::<AppState>();
    commands::retry_sync_task(task_id, app, state)
        .map(|_| success_response())
        .map_err(into_agent_error)
}

async fn resume_tasks(
    AxumState(context): AxumState<LocalAgentContext>,
) -> AgentResult<Vec<SyncTask>> {
    let app = context.app.clone();
    let state_app = app.clone();
    let state = state_app.state::<AppState>();
    commands::resume_sync_tasks(app, state)
        .map(Json)
        .map_err(into_agent_error)
}

async fn delete_task(
    AxumState(context): AxumState<LocalAgentContext>,
    AxumPath(task_id): AxumPath<String>,
) -> AgentResult<SimpleSuccess> {
    let app = context.app.clone();
    let state_app = app.clone();
    let state = state_app.state::<AppState>();
    commands::delete_sync_task(app, task_id, state)
        .map(|_| success_response())
        .map_err(into_agent_error)
}

async fn clear_tasks(
    AxumState(context): AxumState<LocalAgentContext>,
) -> AgentResult<SimpleSuccess> {
    let app = context.app.clone();
    let state_app = app.clone();
    let state = state_app.state::<AppState>();
    commands::clear_all_sync_tasks(app, state)
        .map(|_| success_response())
        .map_err(into_agent_error)
}

async fn get_synced_document_ids(Query(query): Query<SyncRootQuery>) -> AgentResult<Vec<String>> {
    Ok(Json(commands::get_synced_document_ids(query.sync_root)))
}

async fn get_document_sync_statuses(
    Query(query): Query<SyncRootQuery>,
) -> AgentResult<HashMap<String, DocumentSyncStatusEntry>> {
    Ok(Json(commands::get_document_sync_statuses(query.sync_root)))
}

async fn read_preview(
    Json(request): Json<PreviewReadRequest>,
) -> AgentResult<SyncedMarkdownPreview> {
    commands::read_synced_markdown_preview(request.sync_root, request.document_id)
        .map(Json)
        .map_err(into_agent_error)
}

async fn remove_synced_documents(
    AxumState(context): AxumState<LocalAgentContext>,
    Json(request): Json<RemoveSyncedDocumentsRequest>,
) -> AgentResult<u32> {
    commands::remove_synced_documents(context.app, request)
        .map(Json)
        .map_err(into_agent_error)
}

async fn prepare_force_repull(
    AxumState(context): AxumState<LocalAgentContext>,
    Json(request): Json<RemoveSyncedDocumentsRequest>,
) -> AgentResult<u32> {
    commands::prepare_force_repulled_documents(context.app, request)
        .map(Json)
        .map_err(into_agent_error)
}

async fn check_freshness(
    AxumState(context): AxumState<LocalAgentContext>,
    Json(request): Json<FreshnessCheckRequest>,
) -> AgentResult<HashMap<String, DocumentFreshnessResult>> {
    commands::check_document_freshness(context.app, request.document_ids, request.sync_root)
        .await
        .map(Json)
        .map_err(into_agent_error)
}

async fn load_freshness(
    Json(request): Json<FreshnessLoadRequest>,
) -> AgentResult<HashMap<String, DocumentFreshnessResult>> {
    commands::load_freshness_metadata(request.sync_root)
        .await
        .map(Json)
        .map_err(into_agent_error)
}

async fn save_freshness(Json(request): Json<FreshnessSaveRequest>) -> AgentResult<SimpleSuccess> {
    commands::save_freshness_metadata(request.sync_root, request.metadata)
        .await
        .map(|_| success_response())
        .map_err(into_agent_error)
}

async fn align_freshness(
    Json(request): Json<FreshnessAlignRequest>,
) -> AgentResult<HashMap<String, DocumentFreshnessResult>> {
    commands::align_document_sync_versions(request.sync_root, request.metadata, request.force)
        .await
        .map(Json)
        .map_err(into_agent_error)
}

async fn clear_freshness(Json(request): Json<FreshnessClearRequest>) -> AgentResult<SimpleSuccess> {
    commands::clear_freshness_metadata(request.sync_root, request.document_ids)
        .await
        .map(|_| success_response())
        .map_err(into_agent_error)
}

async fn open_path(
    AxumState(context): AxumState<LocalAgentContext>,
    Json(request): Json<OpenPathRequest>,
) -> AgentResult<SimpleSuccess> {
    commands::open_workspace_folder(context.app, request.path)
        .map(|_| success_response())
        .map_err(into_agent_error)
}
