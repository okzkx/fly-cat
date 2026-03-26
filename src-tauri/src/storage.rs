use crate::model::{ManifestRecord, SyncManifest};
use std::{
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::{env, time::{SystemTime, UNIX_EPOCH}};

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
                title: "Doc".into(),
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
