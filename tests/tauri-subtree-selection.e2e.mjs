import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Builder, By, Capabilities, until } from "selenium-webdriver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const artifactsRoot = path.join(workspaceRoot, ".e2e-artifacts", "tauri-subtree-selection");
const toolsRoot = path.join(workspaceRoot, ".tools", "msedgedriver");
const appDataDir = path.join(process.env.APPDATA ?? "", "com.feishu-docs-sync");
const settingsPath = path.join(appDataDir, "app-settings.json");
const sessionPath = path.join(appDataDir, "auth-session.json");
const tasksPath = path.join(appDataDir, "sync-tasks.json");
const syncRoot = path.join(artifactsRoot, "sync-root");
const screenshotDir = path.join(artifactsRoot, "screenshots");
const backupDir = path.join(artifactsRoot, "backup");
const e2eTargetDir = path.join(workspaceRoot, "src-tauri", "target-e2e");
const tauriDriverPath = path.join(os.homedir(), ".cargo", "bin", process.platform === "win32" ? "tauri-driver.exe" : "tauri-driver");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const powershellCommand = process.platform === "win32" ? "powershell" : "pwsh";

let driver;
let tauriDriverProcess;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: workspaceRoot,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
    env: { ...process.env, ...options.env }
  });

  if (result.status !== 0) {
    throw new Error(
      [`Command failed: ${command} ${args.join(" ")}`, result.stdout, result.stderr].filter(Boolean).join("\n")
    );
  }

  return result.stdout?.trim() ?? "";
}

function psLiteral(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

function backupFile(filePath) {
  ensureDir(backupDir);
  if (!existsSync(filePath)) {
    return;
  }
  copyFileSync(filePath, path.join(backupDir, path.basename(filePath)));
}

function restoreFile(filePath) {
  const backupPath = path.join(backupDir, path.basename(filePath));
  if (existsSync(backupPath)) {
    copyFileSync(backupPath, filePath);
    return;
  }
  if (existsSync(filePath)) {
    rmSync(filePath, { force: true });
  }
}

function seedFixtureFiles() {
  ensureDir(appDataDir);
  ensureDir(syncRoot);

  writeFileSync(
    settingsPath,
    JSON.stringify(
      {
        appId: "fixture-app-id",
        appSecret: "fixture-app-secret",
        endpoint: "https://fixture.invalid",
        syncRoot,
        mcpServerName: "user-feishu-mcp",
        imageDirName: "images",
        wikiSpaceIds: ""
      },
      null,
      2
    )
  );

  const seededTasks = [
    {
      id: "fixture-subtree-task",
      name: "同步任务 - E2E 文档分支验证",
      selectedSpaces: ["kb-product"],
      selectedSources: [
        {
          kind: "document",
          spaceId: "kb-product",
          spaceName: "产品知识库",
          title: "产品方案总览",
          displayPath: "产品知识库 / 方案库 / 产品方案总览",
          nodeToken: "node-doc-product-roadmap",
          documentId: "doc-product-roadmap",
          pathSegments: ["方案库", "产品方案总览"],
          includesDescendants: true
        }
      ],
      selectionSummary: {
        kind: "document",
        spaceId: "kb-product",
        spaceName: "产品知识库",
        title: "产品方案总览",
        displayPath: "产品知识库 / 方案库 / 产品方案总览",
        documentCount: 2,
        previewPaths: ["产品知识库 / 方案库 / 产品方案总览"],
        includesDescendants: true,
        rootCount: 1
      },
      selectedScope: {
        kind: "document",
        spaceId: "kb-product",
        spaceName: "产品知识库",
        title: "产品方案总览",
        displayPath: "产品知识库 / 方案库 / 产品方案总览",
        nodeToken: "node-doc-product-roadmap",
        documentId: "doc-product-roadmap",
        pathSegments: ["方案库", "产品方案总览"],
        includesDescendants: true
      },
      outputPath: syncRoot,
      status: "completed",
      progress: 100,
      counters: {
        total: 2,
        processed: 2,
        succeeded: 2,
        skipped: 0,
        failed: 0
      },
      lifecycleState: "completed",
      errors: [],
      failureSummary: null,
      createdAt: "2026-03-27T15:00:00.000Z",
      updatedAt: "2026-03-27T15:01:00.000Z"
    }
  ];

  writeFileSync(tasksPath, JSON.stringify(seededTasks, null, 2));
}

function getEdgeVersion() {
  if (process.platform !== "win32") {
    throw new Error("This tauri-driver automation currently supports Windows only.");
  }

  return run(powershellCommand, [
    "-NoProfile",
    "-Command",
    "(Get-Item \"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe\").VersionInfo.FileVersion"
  ]);
}

function ensureEdgeDriver() {
  const edgeVersion = getEdgeVersion();
  const driverDir = path.join(toolsRoot, edgeVersion);
  const driverPath = path.join(driverDir, "msedgedriver.exe");

  if (existsSync(driverPath)) {
    return driverPath;
  }

  ensureDir(driverDir);
  const zipPath = path.join(driverDir, "edgedriver_win64.zip");
  const downloadUrl = `https://msedgedriver.microsoft.com/${edgeVersion}/edgedriver_win64.zip`;
  const script = [
    "$ProgressPreference = 'SilentlyContinue'",
    `Invoke-WebRequest -Uri ${psLiteral(downloadUrl)} -OutFile ${psLiteral(zipPath)}`,
    `Expand-Archive -LiteralPath ${psLiteral(zipPath)} -DestinationPath ${psLiteral(driverDir)} -Force`,
    `Remove-Item -LiteralPath ${psLiteral(zipPath)} -Force`
  ].join("; ");

  run(powershellCommand, ["-NoProfile", "-Command", script]);

  if (!existsSync(driverPath)) {
    throw new Error(`msedgedriver download succeeded but executable was not found at ${driverPath}`);
  }

  return driverPath;
}

function buildDesktopApp() {
  if (process.platform === "win32") {
    run(
      powershellCommand,
      [
        "-NoProfile",
        "-Command",
        `$env:CARGO_TARGET_DIR=${psLiteral(e2eTargetDir)}; npm run tauri build -- --debug --no-bundle`
      ],
      { stdio: "inherit" }
    );
    return;
  }

  run(npmCommand, ["run", "tauri", "build", "--", "--debug", "--no-bundle"], {
    stdio: "inherit",
    env: {
      CARGO_TARGET_DIR: e2eTargetDir
    }
  });
}

function findAppBinary() {
  const debugDir = path.join(e2eTargetDir, "debug");
  const preferred = ["FlyCat.exe", "feishu_docs_sync.exe"].map((name) => path.join(debugDir, name));

  for (const candidate of preferred) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  const discovered = readdirSync(debugDir)
    .filter((entry) => entry.endsWith(".exe") && !entry.startsWith("build-script"))
    .map((entry) => path.join(debugDir, entry));

  if (discovered.length === 0) {
    throw new Error(`No desktop application binary found in ${debugDir}`);
  }

  return discovered[0];
}

async function waitForWebDriverServer(timeoutMs = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch("http://127.0.0.1:4444/status");
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error("tauri-driver WebDriver server did not become ready in time.");
}

async function startTauriDriver(nativeDriverPath) {
  if (!existsSync(tauriDriverPath)) {
    throw new Error(`tauri-driver was not found at ${tauriDriverPath}`);
  }

  tauriDriverProcess = spawn(tauriDriverPath, ["--native-driver", nativeDriverPath], {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      FLYCAT_E2E_FIXTURES: "1"
    },
    stdio: "inherit"
  });

  tauriDriverProcess.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`tauri-driver exited with code ${code}`);
    }
  });

  await waitForWebDriverServer();
}

async function connectWebDriver(applicationPath) {
  const capabilities = new Capabilities();
  capabilities.setBrowserName("wry");
  capabilities.set("tauri:options", {
    application: applicationPath,
    webviewOptions: {}
  });

  driver = await new Builder()
    .usingServer("http://127.0.0.1:4444/")
    .withCapabilities(capabilities)
    .build();

  await driver.wait(until.elementLocated(By.css("[data-testid='knowledge-base-tree']")), 30000);
}

function xpathLiteral(value) {
  if (!value.includes("'")) {
    return `'${value}'`;
  }
  if (!value.includes("\"")) {
    return `"${value}"`;
  }
  return `concat('${value.split("'").join("',\"'\",'")}')`;
}

async function getTreeNodeContainer(labelText) {
  const label = await driver.wait(
    until.elementLocated(
      By.xpath(`//span[@data-testid and normalize-space()=${xpathLiteral(labelText)}] | //span[normalize-space()=${xpathLiteral(labelText)}]`)
    ),
    15000
  );

  return label.findElement(By.xpath("./ancestor::span[contains(@class,'ant-tree-node-content-wrapper')]/parent::*"));
}

async function expandTreeNode(labelText) {
  const container = await getTreeNodeContainer(labelText);
  const switcher = await container.findElement(By.css(".ant-tree-switcher"));
  const switcherClass = await switcher.getAttribute("class");
  if (!switcherClass.includes("ant-tree-switcher_open") && !switcherClass.includes("ant-tree-switcher-noop")) {
    await switcher.click();
    await driver.sleep(400);
  }
}

async function toggleTreeCheckbox(labelText) {
  const container = await getTreeNodeContainer(labelText);
  const checkbox = await container.findElement(By.css(".ant-tree-checkbox"));
  await checkbox.click();
  await driver.sleep(500);
}

async function isTreeCheckboxDisabled(labelText) {
  const container = await getTreeNodeContainer(labelText);
  const checkbox = await container.findElement(By.css(".ant-tree-checkbox"));
  const checkboxClass = await checkbox.getAttribute("class");
  return checkboxClass.includes("ant-tree-checkbox-disabled");
}

async function getText(selector) {
  const element = await driver.wait(until.elementLocated(By.css(selector)), 10000);
  return element.getText();
}

async function waitForText(text, timeoutMs = 10000) {
  return driver.wait(
    until.elementLocated(By.xpath(`//*[contains(normalize-space(), ${xpathLiteral(text)})]`)),
    timeoutMs
  );
}

async function takeScreenshot(name) {
  ensureDir(screenshotDir);
  const base64 = await driver.takeScreenshot();
  writeFileSync(path.join(screenshotDir, `${name}.png`), base64, "base64");
}

async function expandTaskRow(taskName) {
  const row = await driver.findElement(
    By.xpath(`//tr[contains(@class,'ant-table-row')][.//*[contains(normalize-space(), ${xpathLiteral(taskName)})]]`)
  );
  const expandButton = await row.findElement(By.css(".ant-table-row-expand-icon"));
  await expandButton.click();
  await driver.sleep(400);
}

async function runScenarios() {
  await expandTreeNode("产品知识库");
  await waitForText("方案库");
  await expandTreeNode("方案库");
  await waitForText("Product Overview");
  await waitForText("产品方案总览");

  await toggleTreeCheckbox("Product Overview");
  assert.equal(await getText("[data-testid='selection-kind']"), "单个文档");
  assert.match(await getText("[data-testid='selection-display-path']"), /Product Overview/);
  await takeScreenshot("01-leaf-document");

  await toggleTreeCheckbox("Product Overview");
  await toggleTreeCheckbox("产品方案总览");
  assert.equal(await getText("[data-testid='selection-kind']"), "文档分支");
  assert.match(await getText("[data-testid='selection-display-path']"), /产品方案总览/);
  assert.equal(
    await driver.findElements(By.xpath("//*[contains(normalize-space(), '一键选中父子文档')]")).then((elements) => elements.length),
    0
  );
  await expandTreeNode("产品方案总览");
  await waitForText("2026 H1 路线图");
  assert.equal(await isTreeCheckboxDisabled("2026 H1 路线图"), true);
  await takeScreenshot("02-parent-subtree");

  await toggleTreeCheckbox("Product Overview");
  assert.equal(await getText("[data-testid='selection-kind']"), "多个文档分支");
  assert.match(await getText("[data-testid='selection-display-path']"), /已选 2 个文档分支/);
  await takeScreenshot("03-multi-root");

  await expandTreeNode("运维知识库");
  await waitForText("运维值班手册");
  await toggleTreeCheckbox("运维值班手册");
  await waitForText("已切换到当前知识库");
  assert.match(await getText("[data-testid='selection-display-path']"), /运维知识库/);
  await takeScreenshot("04-cross-space-switch");

  const openTasksButton = await driver.findElement(By.css("[data-testid='open-task-list']"));
  await openTasksButton.click();
  await waitForText("飞猫助手任务列表");
  await waitForText("同步任务 - E2E 文档分支验证");
  await expandTaskRow("同步任务 - E2E 文档分支验证");
  await waitForText("文档分支: 产品知识库 / 方案库 / 产品方案总览");
  await waitForText("该文档分支共解析 2 篇文档。");
  await takeScreenshot("05-task-list");
}

async function cleanup() {
  if (driver) {
    try {
      await driver.quit();
    } catch {
      // ignore cleanup failure
    }
  }

  if (tauriDriverProcess) {
    tauriDriverProcess.kill();
  }

  restoreFile(settingsPath);
  restoreFile(sessionPath);
  restoreFile(tasksPath);
}

async function main() {
  if (process.platform !== "win32") {
    throw new Error("This tauri-driver automation currently supports Windows only.");
  }

  ensureDir(artifactsRoot);
  ensureDir(backupDir);

  backupFile(settingsPath);
  backupFile(sessionPath);
  backupFile(tasksPath);
  seedFixtureFiles();

  const nativeDriverPath = ensureEdgeDriver();
  buildDesktopApp();
  const applicationPath = findAppBinary();

  await startTauriDriver(nativeDriverPath);
  await connectWebDriver(applicationPath);
  await runScenarios();

  console.log("tauri-driver subtree selection validation passed.");
}

main()
  .catch(async (error) => {
    console.error(error);
    if (driver) {
      try {
        await takeScreenshot("failure");
      } catch {
        // ignore screenshot failure
      }
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
  });
