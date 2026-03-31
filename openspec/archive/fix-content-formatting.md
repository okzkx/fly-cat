# Archive: fix-content-formatting

## 摘要
修正飞书文档 block_type 枚举映射，修复文档同步时排版缺失和文本结构缺失问题。

## 问题根因
飞书 docx v1 API 的 block_type 编号与代码中的映射完全不一致：
- 代码中 block_type 1=text, 2=heading, 3=bullet, 4=ordered...
- 实际 API 中 block_type 1=page, 2=text, 3-11=heading1-9, 12=bullet, 13=ordered...

导致所有标题、列表、引用、表格等结构块被错误解析或完全丢失。

## 修复内容

### block_type 修正映射
| block_type | 旧映射 | 新映射 |
|------------|--------|--------|
| 1 | text | page (跳过) |
| 2 | heading(style) | text (段落) |
| 3-11 | bullet/ordered/code... | heading1-heading9 |
| 12 | (未映射) | bullet |
| 13 | (未映射) | ordered |
| 14 | code | code (不变) |
| 15 | (未映射) | quote |
| 17 | todo | todo (修正 done 解析) |
| 22 | table/divider | divider |
| 27 | image (含28兼容) | image |
| 31 | (未映射) | table |

### 其他修复
- 标题解析：使用 `headingN` 键替代旧的 `heading.style` 方式
- Todo done 状态：从 `style: integer` 改为 `style.done: boolean`
- 新增 `merge_consecutive_list_blocks()` 合并连续列表项
- 新增 quote (type 15) 支持

## 验证
- 63 项 Rust 测试全部通过
- 包含新增和修正的 block_type 映射测试、列表合并测试

## 归档时间
2026-03-31
