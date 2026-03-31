# Tasks: fix-content-formatting

## Task 1: 修正 parse_block_from_json 的 block_type 枚举映射
- [ ] 将 block_type 2 映射为 text（原来是 heading，错误）
- [ ] 将 block_type 3-11 映射为 heading1-heading9（原来是 bullet/ordered，错误）
- [ ] 将 block_type 12 映射为 bullet（原来是 code，错误）
- [ ] 将 block_type 13 映射为 ordered（新增）
- [ ] 保持 block_type 14 为 code（原来就正确）
- [ ] 将 block_type 15 映射为 quote（原来是 code 之后未处理，错误）
- [ ] 将 block_type 16 映射为 todo（原来是 bitable，错误）
- [ ] 将 block_type 21 映射为 divider（原来是 table/divider，错误）
- [ ] 将 block_type 26 映射为 image（原来是 27/28，错误）
- [ ] 将 block_type 30 映射为 table（原来是 22，错误）
- [ ] 未知类型保留为 Unknown block

## Task 2: 修正标题块解析逻辑
- [ ] block_type 3 使用 "heading1" 键提取内容
- [ ] block_type 4 使用 "heading2" 键提取内容
- [ ] block_type 5 使用 "heading3" 键提取内容
- [ ] 依次类推到 block_type 11（heading9）
- [ ] 级别从 block_type 值减 2 推导（block_type 3 = level 1, block_type 4 = level 2, etc.）

## Task 3: 添加列表项合并逻辑
- [ ] 在 fetch_document_blocks 返回后，添加连续列表项合并步骤
- [ ] 连续的 RawBlock::BulletList 合并为单个 BulletList
- [ ] 连续的 RawBlock::OrderedList 合并为单个 OrderedList
- [ ] 连续的 RawBlock::Todo 合并为单个 Todo
- [ ] 不同类型块打断合并

## Task 4: 更新测试用例
- [ ] 更新现有 parse_block_from_json 测试中的 block_type 值
- [ ] 新增 heading3-heading9 解析测试
- [ ] 新增列表项合并测试
- [ ] 新增 quote (block_type 15) 解析测试
- [ ] 新增 todo (block_type 16) 解析测试
- [ ] 新增 divider (block_type 21) 解析测试
- [ ] 新增 image (block_type 26) 解析测试
- [ ] 新增 table (block_type 30) 解析测试
