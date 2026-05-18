import app from "ags/gtk4/app"
import Gdk from "gi://Gdk?version=4.0"
import Astal from "gi://Astal?version=4.0"
import GLib from "gi://GLib?version=2.0"
import { onCleanup, createBinding, For } from "ags"
import { createPoll } from "ags/time"
import { execAsync, exec } from "ags/process"
import AstalHyprland from "gi://AstalHyprland?version=0.1"
import MediaPlayer from "./elements/MediaPlayer"
import AstalTray from "gi://AstalTray?version=0.1"
import Gtk from "gi://Gtk?version=4.0"

// ── Stat readers ──────────────────────────────────────────────────────────────

let _prevIdle = 0, _prevTotal = 0

function readCpuPct(): number {
  const content = new TextDecoder().decode(GLib.file_get_contents("/proc/stat")[1])
  const nums = content.split("\n")[0].split(" ").filter(Boolean).slice(1).map(Number)
  const idle = nums[3], total = nums.reduce((a, b) => a + b, 0)
  const pct = Math.round((1 - (idle - _prevIdle) / (total - _prevTotal)) * 100)
  _prevIdle = idle; _prevTotal = total
  return pct
}

function readGpuPct(): number {
  const content = new TextDecoder().decode(GLib.file_get_contents("/sys/class/drm/card1/device/gpu_busy_percent")[1])
  return Number(content.trim())
}

function readMemPct(): number {
  const c = new TextDecoder().decode(GLib.file_get_contents("/proc/meminfo")[1])
  const lines = c.split("\n")
  const total = Number(lines.find(l => l.startsWith("MemTotal"))!.split(/\s+/)[1])
  const avail = Number(lines.find(l => l.startsWith("MemAvailable"))!.split(/\s+/)[1])
  return Math.round((1 - avail / total) * 100)
}

function readMemUsed(): string {
  const c = new TextDecoder().decode(GLib.file_get_contents("/proc/meminfo")[1])
  const lines = c.split("\n")
  const total = Number(lines.find(l => l.startsWith("MemTotal"))!.split(/\s+/)[1])
  const avail = Number(lines.find(l => l.startsWith("MemAvailable"))!.split(/\s+/)[1])
  return `${((total - avail) / 1024 / 1024).toFixed(1)}G`
}

async function readDiskPct(): Promise<number> {
  const out = await execAsync("df /home")
  const cols = out.split("\n")[1].trim().split(/\s+/)
  return Math.round(Number(cols[2]) / Number(cols[1]) * 100)
}

async function readDiskFree(): Promise<string> {
  const out = await execAsync("df /home")
  const cols = out.split("\n")[1].trim().split(/\s+/)
  return `${(Number(cols[3]) / 1024 / 1024).toFixed(0)}G free`
}

// ── Left column ───────────────────────────────────────────────────────────────

function DateTimeCard() {
  const time = createPoll("", 1000, () => GLib.DateTime.new_now_local().format("%H:%M")!)
  const date = createPoll("", 60000, () => GLib.DateTime.new_now_local().format("%A, %B %e")!)

  return (
    <box class="datetime-card card" orientation={1} spacing={4}>
      <label class="time-label" label={time(v => v)} halign={3} />
      <label class="date-label" label={date(v => v)} halign={3} />
    </box>
  )
}

function WorkspacesCard() {
  const hypr = AstalHyprland.get_default()
  const tray = AstalTray.get_default()
  const items = createBinding(tray ,"items")
  const workspaces = createBinding(hypr, "workspaces").as(
    wss => wss.filter(ws => !(ws.id >= -99 && ws.id <= -2)).sort((a, b) => a.id - b.id)
  )
  const init = (btn: Gtk.MenuButton, item: AstalTray.TrayItem) => {
    btn.menuModel = item.menuModel
    btn.insert_action_group("dbusmenu", item.actionGroup)
    item.connect("notify::action-group", () => {
      btn.insert_action_group("dbusmenu", item.actionGroup)
    })
  }


  return (
    <box class="workspaces-card card" orientation={1} spacing={6}>
      <label class="card-header" label="Workspaces" xalign={0} />
      <box class="ws-dots" spacing={4} halign={3}>
        <For each={workspaces}>
          {(ws) => (
            <button
              class={createBinding(hypr, "focused_workspace").as(fw =>
                `ws-btn${ws === fw ? " focused" : ""}`
              )}
              onClicked={() => ws.focus()}
            >
              {ws.id}
            </button>
          )}
        </For>
      </box>
      <box class="tray">
        <For each={items}>
          {(item) => (
            <menubutton $={(self) => init(self, item)}>
              <image gicon={createBinding(item, "gicon")}/>
            </menubutton>
          )}
        </For>
      </box>
    </box>
  )
}

function PowerCard() {
  const home = GLib.get_home_dir()
  return (
      <box halign={3} valign={3}>
        <button
          class="power-btn"
          onClicked={() => execAsync(["bash", `${home}/Scripts/power-menu.sh`])}
        >
          <label label="󰐥" />
        </button>
      </box>
  )
}

// ── Center column ─────────────────────────────────────────────────────────────

function CalendarCard() {
  const cal = createPoll("", 60000, () => {
    try { return exec("cal") } catch { return exec(["cal", "-h"]) }
  })

  return (
    <box class="calendar-card card" orientation={1} spacing={8}>
      <label class="card-header" label="Calendar" xalign={0} />
      <label class="cal-text" label={cal(v => v)} xalign={0} />
    </box>
  )
}

function SysInfoCard() {
  const cpuPct  = createPoll(0,         2000, readCpuPct)
  const gpuPct  = createPoll(0,         2000, readGpuPct)
  const memPct  = createPoll(0,         2000, readMemPct)
  const memUsed = createPoll("0G",      2000, readMemUsed)
  const diskPct = createPoll(0,         5000, readDiskPct)
  const diskFree= createPoll("0G free", 5000, readDiskFree)

  return (
    <box class="sysinfo-card card" orientation={1} spacing={8}>
      <label class="card-header" label="System" xalign={0} />

      <box class="stat-row" orientation={1} spacing={3}>
        <box><label class="stat-lbl" label="CPU" hexpand xalign={0} /><label class="stat-val" label={cpuPct(v => `${v}%`)} /></box>
        <levelbar class="stat-bar cpu" value={cpuPct(v => v / 100)} />
      </box>

      <box class="stat-row" orientation={1} spacing={3}>
        <box><label class="stat-lbl" label="GPU" hexpand xalign={0} /><label class="stat-val" label={gpuPct(v => `${v}%`)} /></box>
        <levelbar class="stat-bar gpu" value={gpuPct(v => v / 100)} />
      </box>

      <box class="stat-row" orientation={1} spacing={3}>
        <box><label class="stat-lbl" label="RAM" hexpand xalign={0} /><label class="stat-val" label={memUsed(v => v)} /></box>
        <levelbar class="stat-bar mem" value={memPct(v => v / 100)} />
      </box>

      <box class="stat-row" orientation={1} spacing={3}>
        <box><label class="stat-lbl" label="DISK" hexpand xalign={0} /><label class="stat-val" label={diskFree(v => v)} /></box>
        <levelbar class="stat-bar disk" value={diskPct(v => v / 100)} />
      </box>
    </box>
  )
}

// ── Dashboard window ──────────────────────────────────────────────────────────

let _win: Astal.Window;

export function toggleDashboard() {
  _win.visible = !_win.visible;
  console.log(_win.visible)
}

export default function Dashboard({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  const { BOTTOM } = Astal.WindowAnchor

  onCleanup(() => {
    _win.destroy()
  })

  return (
    <window
      $={(self) => {_win = self}}
      visible={false}
      namespace="my-dashboard"
      name="my-dashboard"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.NORMAL}
      anchor={BOTTOM}
      application={app}
      class="Dashboard"
    >
      <box class="dashboard-inner" orientation={1} spacing={12}>

        <box class="row left-row" spacing={12}>
          <DateTimeCard />
          <WorkspacesCard />
          <box hexpand />
          <PowerCard />
        </box>

        <box class="row center-col" spacing={12}>
          <CalendarCard />
          <MediaPlayer />
        </box>

        <box class="row right-row" spacing={12}>
          <SysInfoCard />
        </box>

      </box>
    </window>
  )
}
