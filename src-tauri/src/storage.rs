use crate::model::{DocumentFreshnessResult, ManifestRecord, SyncManifest};
use rusqlite::{params, Connection};
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
};

pub fn manifest_path(sync_root: &Path) -> PathBuf {
    sync_root.join(".feishu-sync-manifest.json")
}

pub fn load_manifest(sync_root: &Path) -> Result<SyncManifest, String> {
    let path = manifest_path(sync_root);
    if !path.exists() {
        return Ok(SyncManifest::default());
    }

    let content = fs::read_to_string(path).map_err(|err| err.to_string())?;
    serde_json::from_str(&content).map_err(|err| err.to_string())
}

pub fn save_manifest(sync_root: &Path, manifest: &SyncManifest) -> Result<(), String> {
    fs::create_dir_all(sync_root).map_err(|err| err.to_string())?;
    let path = manifest_path(sync_root);
    let content = serde_json::to_string_pretty(manifest).map_err(|err| err.to_string())?;
    fs::write(path, content).map_err(|err| err.to_string())
}

pub fn upsert_manifest_record(manifest: &mut SyncManifest, record: ManifestRecord) {
    if let Some(existing) = manifest
        .records
        .iter_mut()
        .find(|existing| existing.document_id == record.document_id)
    {
        *existing = record;
        return;
    }
    manifest.records.push(record);
}

pub fn remove_manifest_records(manifest: &mut SyncManifest, document_ids: &[String]) {
    let id_set: std::collections::HashSet<&str> = document_ids.iter().map(|s| s.as_str()).collect();
    manifest
        .records
        .retain(|r| !id_set.contains(r.document_id.as_str()));
}

// === Freshness Metadata Storage ===

pub fn freshness_db_path(sync_root: &Path) -> PathBuf {
    sync_root.join(".freshness-metadata.db")
}

fn init_freshness_db(conn: &Connection) -> Result<(), String> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS freshness_metadata (
            document_id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            local_version TEXT NOT NULL,
            remote_version TEXT NOT NULL,
            local_update_time TEXT NOT NULL,
            remote_update_time TEXT NOT NULL,
            last_checked_at TEXT NOT NULL,
            error_message TEXT
        )",
        [],
    )
    .map_err(|e| format!("Failed to create freshness_metadata table: {}", e))?;
    Ok(())
}

pub fn load_all_freshness_metadata(
    sync_root: &Path,
) -> Result<HashMap<String, DocumentFreshnessResult>, String> {
    let db_path = freshness_db_path(sync_root);

    if !db_path.exists() {
        return Ok(HashMap::new());
    }

    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open freshness database: {}", e))?;

    let mut stmt = conn
        .prepare(
            "SELECT document_id, status, local_version, remote_version,
                    local_update_time, remote_update_time, last_checked_at, error_message
             FROM freshness_metadata",
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                DocumentFreshnessResult {
                    status: row.get(1)?,
                    local_version: row.get(2)?,
                    remote_version: row.get(3)?,
                    local_update_time: row.get(4)?,
                    remote_update_time: row.get(5)?,
                    error: row.get::<_, Option<String>>(7)?,
                },
            ))
        })
        .map_err(|e| format!("Failed to query freshness metadata: {}", e))?;

    let mut result = HashMap::new();
    for row in rows {
        let (document_id, freshness) = row.map_err(|e| format!("Failed to read row: {}", e))?;
        result.insert(document_id, freshness);
    }

    Ok(result)
}

pub fn save_freshness_metadata(
    sync_root: &Path,
    metadata: &HashMap<String, DocumentFreshnessResult>,
) -> Result<(), String> {
    if metadata.is_empty() {
        return Ok(());
    }

    let db_path = freshness_db_path(sync_root);
    fs::create_dir_all(sync_root).map_err(|e| format!("Failed to create sync root: {}", e))?;

    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open freshness database: {}", e))?;

    init_freshness_db(&conn)?;

    let last_checked_at = chrono::Utc::now().to_rfc3339();

    for (document_id, freshness) in metadata {
        conn.execute(
            "INSERT OR REPLACE INTO freshness_metadata
             (document_id, status, local_version, remote_version,
              local_update_time, remote_update_time, last_checked_at, error_message)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                document_id,
                freshness.status,
                freshness.local_version,
                freshness.remote_version,
                freshness.local_update_time,
                freshness.remote_update_time,
                last_checked_at,
                freshness.error,
            ],
        )
        .map_err(|e| format!("Failed to save freshness metadata: {}", e))?;
    }

    Ok(())
}

pub fn clear_freshness_metadata(sync_root: &Path, document_ids: &[String]) -> Result<(), String> {
    if document_ids.is_empty() {
        return Ok(());
    }

    let db_path = freshness_db_path(sync_root);

    if !db_path.exists() {
        return Ok(());
    }

    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open freshness database: {}", e))?;

    for document_id in document_ids {
        conn.execute(
            "DELETE FROM freshness_metadata WHERE document_id = ?1",
            params![document_id],
        )
        .map_err(|e| format!("Failed to delete freshness metadata: {}", e))?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        env,
        time::{SystemTime, UNIX_EPOCH},
    };

    #[test]
    fn saves_and_loads_manifest() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time works")
            .as_millis();
        let sync_root = env::temp_dir().join(format!("feishu-sync-manifest-{unique}"));
        let mut manifest = SyncManifest::default();
        upsert_manifest_record(
            &mut manifest,
            ManifestRecord {
                document_id: "doc-1".into(),
                space_id: "kb-eng".into(),
                space_name: "研发知识库".into(),
                node_token: "node-doc-1".into(),
                title: "Doc".into(),
                version: "v1".into(),
                update_time: "t1".into(),
                source_path: "研发知识库/Doc".into(),
                path_segments: vec!["Doc".into()],
                output_path: "a.md".into(),
                content_hash: "hash".into(),
                source_signature: "sig".into(),
                status: "success".into(),
                image_assets: vec![],
                last_synced_at: "now".into(),
            },
        );

        save_manifest(&sync_root, &manifest).expect("save manifest");
        let loaded = load_manifest(&sync_root).expect("load manifest");
        assert_eq!(loaded.records.len(), 1);
    }
}
