import { createBinding, For, This } from "ags"
import app from "ags/gtk4/app"
import style from "./style.scss"
import Dashboard, { toggleDashboard } from "Dashboard"

app.start({
  css: style,
  gtkTheme: "Adwaita",
  requestHandler(request: string[], res: (r: unknown) => void) {
    if(request.includes("toggle-dashboard")) { toggleDashboard(); res("ok") }
    else res("unknown request")
  },
  main() {
    const monitors = createBinding(app, "monitors")

    return (
      <For each={monitors}>
        {(monitor) => (
          <This this={app}>
            <Dashboard gdkmonitor={monitor} />
          </This>
        )}
      </For>
    )
  },
})
