import app from "ags/gtk4/app"
import Gdk from "gi://Gdk?version=4.0"
import Astal from "gi://Astal?version=4.0"
import { onCleanup } from "ags"
import Workspaces from "elements/Workspaces"
import Clock from "elements/Clock"
import Tray from "elements/Tray"
import Status from "elements/Status"
import Window from "elements/Window"

export default function Bar({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
	let win: Astal.Window
	const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

	onCleanup(() => {
		// Root components (windows) are not automatically destroyed.
		// When the monitor is disconnected from the system, this callback
		// is run from the parent <For> which allows us to destroy the window
		win.destroy()
	})

	return (
		<window
			$={(self) => (win = self)}
			visible
			namespace="my-bar"
			name={`bar-${gdkmonitor.connector}`}
			gdkmonitor={gdkmonitor}
			exclusivity={Astal.Exclusivity.EXCLUSIVE}
			anchor={TOP | LEFT | RIGHT}
			application={app}
			class="Bar"
		>
			<centerbox>
				<box $type="start">
					<Workspaces/>
					<Clock/>
					<Window/>
				</box>
				<box $type="end">
					<Tray />
					<Status/>
				</box>
			</centerbox>
		</window>
	)
}
