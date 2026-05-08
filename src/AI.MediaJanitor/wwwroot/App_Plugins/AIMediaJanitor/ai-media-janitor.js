const t = [
  {
    name: "AIMedia Janitor Entrypoint",
    alias: "AI.MediaJanitor.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-BSlTz4-p.js")
  }
], s = [
  {
    name: "AIMedia Janitor Dashboard",
    alias: "AI.MediaJanitor.Dashboard",
    type: "dashboard",
    js: () => import("./dashboard.element-BgkgedLO.js"),
    meta: {
      label: "Example Dashboard",
      pathname: "example-dashboard"
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: "Umb.Section.Content"
      }
    ]
  }
], i = "AI.MediaJanitor.Workspace.Assistant", n = "AI.MediaJanitor.MenuItem.Assistant", a = "ai-media-assistant", e = "Umb.Menu.Media", o = "Umb.Section.Media", A = [
  {
    type: "menuItem",
    kind: "link",
    alias: n,
    name: "AI Media Assistant Menu Item",
    weight: 50,
    // place after the built-in Media tree (1000) / Recycle Bin (900)
    meta: {
      label: "AI Media Assistant",
      icon: "icon-wand",
      menus: [e],
      href: `/section/media/dashboard/${a}`
    }
  }
], d = [
  {
    type: "dashboard",
    alias: i,
    name: "AI Media Assistant Dashboard",
    js: () => import("./workspace.element-CLX_2k5-.js"),
    weight: 100,
    meta: {
      label: "AI Media Assistant",
      pathname: a
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: o
      }
    ]
  }
], m = [
  ...A,
  ...d
], c = [
  ...t,
  ...s,
  ...m
];
export {
  c as manifests
};
//# sourceMappingURL=ai-media-janitor.js.map
