const { contextBridge } = require("electron");

contextBridge.exposeInIsolatedWorld("version", {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
})