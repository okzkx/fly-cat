# Tasks: fix-content-formatting

## Task 1: 修正 parse_block_from_json 的 block_type 枚举映射
- [x] 将 block_type 1 映射为 page（跳过，不产生内容）
- [x] 将 block_type 2 映射为 text（原来是 heading，错误）
- [x] 将 block_type 3-11 映射为 heading1-heading9（原来是 bullet/ordered，错误）
- [x] 将 block_type 12 映射为 bullet（原来是 code，错误）
- [x] 将 block_type 13 映射为 ordered（新增）
- [x] 保持 block_type 14 为 code（原来就正确）
- [x] 将 block_type 15 映射为 quote（新增）
- [x] 将 block_type 17 映射为 todo（原来就是 17，但解析 done 状态方式需修正为 style.done）
- [x] 将 block_type 22 映射为 divider（原来是 22 同时处理 table/divider，错误）
- [x] 将 block_type 27 映射为 image（原来用 27|28，现修正为仅 27）
- [x] 将 block_type 31 映射为 table（原来是 22，错误）
- [x] 未知类型保留为 Unknown block fallback

## Task 2: 修正标题块解析逻辑
- [x] block_type 3 使用 "heading1" 键提取内容
- [x] block_type 4 使用 "heading2" 键提取内容
- [x] block_type 5 使用 "heading3" 键提取内容
- [x] 依次类推到 block_type 11（heading9）
- [x] 级别从 block_type 值减 2 推导（block_type 3 = level 1, block_type 4 = level 2, etc.）

## Task 3: 添加列表项合并逻辑
- [x] 在 fetch_document_blocks 返回后，添加连续列表项合并步骤
- [x] 连续的 RawBlock::BulletList 合并为单个 BulletList
- [x] 连续的 RawBlock::OrderedList 合并为单个 OrderedList
- [x] 连续的 RawBlock::Todo 合并为单个 Todo
- [x] 不同类型块打断合并

## Task 4: 更新测试用例
- [x] 更新现有 parse_block_from_json 测试中的 block_type 值（bullet: 3->12, ordered: 4->13, etc.）
- [x] 新增 heading 解析测试（block_type 4 = heading2 with heading2 key）
- [x] 新增列表项合并测试
- [x] 新增 quote (block_type 15) 解析测试
- [x] 修正 todo (block_type 17) 解析测试（style.done 替代 style as integer）
- [x] 修正 divider (block_type 22) 解析测试
- [x] 修正 image (block_type 27) 解析测试（去掉 28 兼容）
- [x] 修正 table (block_type 31) 解析测试
- [x] 更新嵌套块测试（heading-1: block_type 4+heading2, image-1: block_type 27, paragraph: block_type 2）

## Task 5: 更新 extract_text_from_block 辅助函数
- [x] 添加 heading1-heading9 键查找
- [x] 添加 callout 键查找
- [x] 移除旧的通用 "heading" 键查找
