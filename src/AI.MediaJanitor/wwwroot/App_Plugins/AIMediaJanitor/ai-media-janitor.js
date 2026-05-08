const a = [
  {
    name: "AIMedia Janitor Entrypoint",
    alias: "AI.MediaJanitor.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-BSlTz4-p.js")
  }
], s = [], n = "AI.MediaJanitor.Workspace.Assistant", i = "AI.MediaJanitor.MenuItem.Assistant", t = "ai-media-assistant", e = "Umb.Menu.Media", o = "Umb.Section.Media", A = [
  {
    type: "menuItem",
    kind: "link",
    alias: i,
    name: "AI Media Assistant Menu Item",
    weight: 50,
    // place after the built-in Media tree (1000) / Recycle Bin (900)
    meta: {
      label: "AI Media Assistant",
      icon: "icon-wand",
      menus: [e],
      href: `/section/media/dashboard/${t}`
    }
  }
], m = [
  {
    type: "dashboard",
    alias: n,
    name: "AI Media Assistant Dashboard",
    js: () => import("./workspace.element-CgfUwEh0.js"),
    weight: 100,
    meta: {
      label: "AI Media Assistant",
      pathname: t
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: o
      }
    ]
  }
], d = [
  ...A,
  ...m
], I = [
  ...a,
  ...s,
  ...d
];
export {
  I as manifests
};
//# sourceMappingURL=ai-media-janitor.js.map
