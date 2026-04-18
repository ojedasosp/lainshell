import AstalHyprland from "gi://AstalHyprland?version=0.1"
import { createBinding, For } from "ags"

export default function Workspaces () {
  const hypr =  AstalHyprland.get_default()
  const workspaces = createBinding(hypr, "workspaces")
    .as(wss => wss.filter(ws => !(ws.id >= -99 && ws.id <= -2))
    .sort((a,b) => a.id - b.id))

  return (<box class="workspaces">
	  <For each={workspaces}>
        {(ws) => (
          <button class={createBinding(hypr,"focused_workspace").as(fw => ws === fw ? "focused" : "")} onClicked={() => ws.focus()}>
            {ws.id}
          </button>
        )}
      </For>
	  </box>)
}
