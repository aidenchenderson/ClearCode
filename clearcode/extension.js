// extension.js
const vscode = require("vscode");
const { execSync } = require("child_process");
const path = require("path");

const dirtyByFile = new Map(); // filePath -> Set(lineNumbers 0-based)
let cachedIdentity = null;
const repoCache = new Map(); // gitRoot -> repoLink

class LiveChangeTrackerViewProvider {
  constructor(outputChannelName) {
    this.outputChannelName = outputChannelName;
  }

  resolveTreeItem(element) {
    return element;
  }

  getTreeItem(element) {
    return element;
  }

  getChildren() {
    return [
      new vscode.TreeItem(
        `Output: ${this.outputChannelName}`,
        vscode.TreeItemCollapsibleState.None,
      ),
      new vscode.TreeItem(
        "Tip: Open View → Output → Live Change Tracker",
        vscode.TreeItemCollapsibleState.None,
      ),
    ];
  }
}

function tryExec(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

/**
 * Zero-input identity:
 * 1) SSH GitHub remote → username
 * 2) GitHub CLI (gh) login
 * 3) git user.name / user.email
 */
function getAutoIdentity(workspaceFolder) {
  if (cachedIdentity) return cachedIdentity;

  const remote = tryExec("git remote get-url origin", workspaceFolder);
  if (remote) {
    const m = remote.match(/^git@github\.com:([^/]+)\/.+$/);
    if (m && m[1]) {
      // remove all spaces from cachedIdentity to avoid issues with firebase keys
      cachedIdentity = m[1].replace(/\s+/g, "");
      return cachedIdentity;
    }
  }

  const ghUser = tryExec("gh api user -q .login", workspaceFolder);
  if (ghUser) {
    cachedIdentity = ghUser.replace(/\s+/g, "");
    return cachedIdentity;
  }

  const name = tryExec("git config user.name", workspaceFolder);
  const email = tryExec("git config user.email", workspaceFolder);

  cachedIdentity = (name || email || "unknown-user").replace(/\s+/g, "");
  return cachedIdentity;
}

// ---------------- REPO DETECTION ----------------

function getGitRootForFile(filePath) {
  return tryExec("git rev-parse --show-toplevel", path.dirname(filePath));
}

function normalizeGithubRemote(remoteUrl) {
  if (!remoteUrl) return null;

  // SSH: git@github.com:USER/REPO.git
  let m = remoteUrl.match(/^git@github\.com:([^/]+)\/(.+?)(\.git)?$/);
  if (m) return `https://github.com/${m[1]}/${m[2]}`;

  // HTTPS: https://github.com/USER/REPO.git
  m = remoteUrl.match(/^https:\/\/github\.com\/([^/]+)\/(.+?)(\.git)?$/);
  if (m) return `https://github.com/${m[1]}/${m[2]}`;

  return null;
}

function getRepoLinkForFile(filePath) {
  const gitRoot = getGitRootForFile(filePath);
  if (!gitRoot) return "none";

  if (repoCache.has(gitRoot)) {
    return repoCache.get(gitRoot);
  }

  const remote = tryExec("git remote get-url origin", gitRoot);
  const repoLink = normalizeGithubRemote(remote) || "none";

  repoCache.set(gitRoot, repoLink);
  return repoLink;
}

// ---------------- CHANGE TRACKING ----------------

function markDirty(filePath, line0) {
  if (!dirtyByFile.has(filePath)) dirtyByFile.set(filePath, new Set());
  dirtyByFile.get(filePath).add(line0);
}

function getOpenDocByPath(filePath) {
  return (
    vscode.workspace.textDocuments.find((d) => d.uri.fsPath === filePath) ||
    null
  );
}

// ---------------- EXTENSION LIFECYCLE ----------------
class AssignmentsProvider {
  constructor(context, identity, output, assignments, descByName = {}) {
    this.context = context;
    this.identity = identity;
    this.output = output;
    this.assignments = assignments;
    this.descByName = descByName; // <-- ADDED
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(item) {
    return item;
  }

  // NOTE: VS Code calls getChildren(element). If element is undefined -> root items.
  getChildren(element) {
    // ----- ADDED: if user expanded an assignment, show its description as a child -----
// ----- ADDED: if user expanded an assignment, show its description as children -----
if (element && element._lctType === "assignment") {
  const name = element._lctName;
  const descRaw = this.descByName?.[name] || "(No description)";

  // Wrap text into multiple lines so it doesn't get "..."
  function wrapText(text, maxLen = 70) {
    // Preserve existing newlines (split paragraphs)
    const paragraphs = String(text).split(/\r?\n/);
    const lines = [];

    for (const p of paragraphs) {
      const words = p.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        lines.push(""); // blank line between paragraphs
        continue;
      }

      let cur = "";
      for (const w of words) {
        const next = cur ? `${cur} ${w}` : w;
        if (next.length > maxLen && cur) {
          lines.push(cur);
          cur = w;
        } else {
          cur = next;
        }
      }
      if (cur) lines.push(cur);
    }

    // Avoid returning nothing
    return lines.length ? lines : ["(No description)"];
  }

  const wrapped = wrapText(descRaw, 70);

  const header = new vscode.TreeItem(
    "Description:",
    vscode.TreeItemCollapsibleState.None,
  );
  /** @type {any} */ (header)._lctType = "assignmentDescHeader";
  header.tooltip = descRaw;

  const children = wrapped.map((line) => {
    const child = new vscode.TreeItem(
      line || " ", // keep blank lines visible-ish
      vscode.TreeItemCollapsibleState.None,
    );
    /** @type {any} */ (child)._lctType = "assignmentDescLine";
    child.tooltip = descRaw; // full text on hover
    return child;
  });

  return [header, ...children];
}
// -------------------------------------------------------------------------------

    // -------------------------------------------------------------------------------

    const assignments = this.assignments;
    const assignmentIDs = ["112", "222", "332", "442"];
    this.output.appendLine(
      `User ${this.identity} has assignments: ${assignments.join(", ")}`,
    );

    return assignments.map((name) => {
      const key = `assignmentFile:${name}`;
      const currentFile = this.context.globalState.get(key, "not set");

      // CHANGED ONLY: make this item collapsible so it can drop down
      const item = new vscode.TreeItem(
        `${name}  —  ${currentFile}`,
        vscode.TreeItemCollapsibleState.Collapsed,
      );

      // ADDED: tag so getChildren(element) knows this is an assignment parent
    /** @type {any} */ (item)._lctType = "assignment";
    /** @type {any} */ (item)._lctName = name;

      item.contextValue = "assignmentItem";
      item.command = {
        command: "live.setAssignmentFile",
        title: "Set Assignment File",
        arguments: [name],
      };

      // optional: show desc on hover for the parent too
      const d = this.descByName?.[name];
      if (d) item.tooltip = d;

      return item;
    });
  }
}

async function activate(context) {
  const output = vscode.window.createOutputChannel("Live Change Tracker");

  const workspaceFolder =
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
  const identity = getAutoIdentity(workspaceFolder);
  //show the identity in the output for debugging
  output.appendLine(
    `Live Change Tracker initialized with identity: ${identity}`,
  );

  //flask call here to get the assignments for the user (send user identity, get back list of assignments)

  let assignments = [];
  let assignmentIDs = [];
  let descs = [];
  try {
    const res = await fetch(
      `http://localhost:5000/api/v1/assignments/by-github-id?identity=${encodeURIComponent(identity)}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    output.appendLine(`data from flask: ${JSON.stringify(data)}`);
    assignments = (data.assignments || []).map((a) => a.name);
    assignmentIDs = (data.assignments || []).map((a) => a.id);
    descs = (data.assignments || []).map((a) => a.desc);

  } catch (err) {
    output.appendLine(`Failed to fetch assignments: ${err.message}`);
    assignments = [];
  }

  // data.assignments is your list
    output.appendLine(descs + " is the list of descriptions");

  const ASSIGNMENTS =
    assignments.length > 0 ? assignments : ["No Assignments Found"];

    const descByName = {};
if (Array.isArray(assignments) && Array.isArray(descs)) {
  for (let i = 0; i < assignments.length; i++) {
    descByName[assignments[i]] = descs[i];
  }
}


  // --- Assignments sidebar ---
const assignmentsProvider = new AssignmentsProvider(
  context,
  identity,
  output,
  ASSIGNMENTS,
  descByName, // <-- ADDED
);

  vscode.window.registerTreeDataProvider(
    "assignmentsView",
    assignmentsProvider,
  );

  // Click Assignment 1/2/etc -> prompt for file path
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "live.setAssignmentFile",
      async (assignmentName) => {
        const key = `assignmentFile:${assignmentName}`;
        const current = context.globalState.get(key, "");

        // get all files in the workspace
        const files = await vscode.workspace.findFiles("**/*", "**/node_modules/**");

        const fileItems = files.map((f) =>
          vscode.workspace.asRelativePath(f)
        );

        const picked = await vscode.window.showQuickPick(fileItems, {
          title: `${assignmentName} file`,
          placeHolder: "Select the file for this assignment",
          ignoreFocusOut: true,
          canPickMany: false,
        });

        if (!picked) return; // user cancelled

        await context.globalState.update(key, picked);
        assignmentsProvider.refresh();
        vscode.window.showInformationMessage(
          `${assignmentName} file set to: ${picked || "not set"}`,
        );
      },
    ),
  );

  const changeListener = vscode.workspace.onDidChangeTextDocument((event) => {
    const doc = event.document;
    const filePath = doc.uri.fsPath;

    for (const change of event.contentChanges) {
      const start = change.range.start.line;
      const end = change.range.end.line;
      const insertedLines = change.text.split("\n").length - 1;

      const last = Math.min(
        doc.lineCount - 1,
        Math.max(end + insertedLines, start),
      );

      for (let line = start; line <= last; line++) {
        markDirty(filePath, line);
      }
    }
  });

  const interval = setInterval(() => {
    if (dirtyByFile.size === 0) return;

    output.appendLine(
      `\n=== ${identity} @ ${new Date().toLocaleTimeString()} ===`,
    );

    for (const [filePath, linesSet] of dirtyByFile.entries()) {
      const doc = getOpenDocByPath(filePath);
      const repoLink = getRepoLinkForFile(filePath);

      if (!doc) {
        output.appendLine(
          `${identity} | ${repoLink} | ${path.basename(filePath)} (not open)`,
        );
        continue;
      }

      const lines = Array.from(linesSet).sort((a, b) => a - b);

      for (const line0 of lines) {
        if (line0 < 0 || line0 >= doc.lineCount) continue;
        const text = doc.lineAt(line0).text;

        //push to firebase only if edited file is part of an assignment
        let assignmentWantedFiles = [];
        for (const name of assignments) {
          const key = `assignmentFile:${name}`;
          const WantedAssignmentFile = context.globalState.get(key, "not set");
          assignmentWantedFiles.push({ name, file: WantedAssignmentFile });
        }

        for (const a of assignmentWantedFiles) {
          if (a.file !== "not set" && a.file === path.basename(filePath)) {
            output.appendLine(
              `File ${a.file} is associated with assignment ${a.name}`,
            );
            //push to flask

            //asignmentIDs
            output.appendLine(
              `${identity} | ${repoLink} | ${path.basename(filePath)} : Line ${line0 + 1} → ${text}`,
            );

            const payload = {
              AssignmentID: assignmentIDs[assignments.indexOf(a.name)],
              GitHubName: identity, // or assignments/assignmentIDs
              GitHubLink: repoLink,
              FilePath: path.basename(filePath),
              LineNumber: line0 + 1,
              LineContent: text,
              updatedAt: new Date().toISOString(),
            };
            output.appendLine(
              "payload to send to flask: " + JSON.stringify(payload),
            );
            //flask send here

            async function pushToFlask(payload, output) {
              try {
                const res = await fetch(
                  "http://localhost:5000/api/v1/assignments/push",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  },
                );

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                output.appendLine("Flask response: " + JSON.stringify(data));
              } catch (err) {
                output.appendLine("Failed to push payload: " + err.message);
              }
            }
            pushToFlask(payload, output);
          }
        }
      }
    }

    dirtyByFile.clear();
    output.show(true);
  }, 60_000);

  context.subscriptions.push(changeListener);
  context.subscriptions.push({ dispose: () => clearInterval(interval) });
}

function deactivate() {}

module.exports = { activate, deactivate };
