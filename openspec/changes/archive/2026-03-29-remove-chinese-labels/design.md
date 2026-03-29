## Context

The knowledge tree renders each node with an icon (CloudSyncOutlined, FolderOutlined, FileTextOutlined, TableOutlined) followed by the node title, then a colored `<Tag>` with a Chinese label indicating the node type. Both the icon and the tag convey the same information, making the tags redundant.

## Goals / Non-Goals

**Goals:**
- Remove all five Chinese type Tag labels from tree nodes
- Keep node icons and titles intact
- Reduce visual noise in the tree

**Non-Goals:**
- Changing summary text or labels elsewhere (TaskListPage, syncSelection, commands.rs)
- Changing icon styles or colors
- Adding any new labels or tooltips

## Decisions

- Simply remove the five `<Tag>` lines; no replacement UI needed since icons are sufficient
- Keep the `<Space>` wrapper as it also handles the icon-to-title gap

## Risks / Trade-offs

- Users who relied on the tag colors for quick scanning lose that signal — however, the icons already serve this purpose
- No localization concerns since we are removing Chinese text, not adding it
