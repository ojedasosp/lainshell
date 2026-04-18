import AstalHyprland from "gi://AstalHyprland?version=0.1"
import { createBinding } from "ags"

export default function Window() {
  const hypr = AstalHyprland.get_default()
  return (
    <box class="window">
      <label label={createBinding(hypr,"focusedClient").as(fc => fc.title)} />
    </box>
  )
}
