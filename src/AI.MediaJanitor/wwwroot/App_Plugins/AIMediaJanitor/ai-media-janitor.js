const a = [
  {
    name: "AIMedia Janitor Entrypoint",
    alias: "AI.MediaJanitor.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-BSlTz4-p.js")
  }
], i = [
  {
    name: "AIMedia Janitor Dashboard",
    alias: "AI.MediaJanitor.Dashboard",
    type: "dashboard",
    js: () => import("./dashboard.element-DdCwMsqk.js"),
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
  },
  {
    name: "Media Janitor Dashboard",
    alias: "AI.MediaJanitor.MediaDashboard",
    type: "dashboard",
    js: () => import("./media-janitor-dashboard.element-B7yo3QDB.js"),
    meta: {
      label: "Media Janitor",
      pathname: "media-janitor"
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: "Umb.Section.Media"
      }
    ]
  }
], t = [
  ...a,
  ...i
];
export {
  t as manifests
};
//# sourceMappingURL=ai-media-janitor.js.map
