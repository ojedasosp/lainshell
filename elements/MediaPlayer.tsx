import AstalMpris from "gi://AstalMpris?version=0.1"
import GLib from "gi://GLib?version=2.0"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import GdkPixbuf from "gi://GdkPixbuf?version=2.0"
import { createBinding, onCleanup, For } from "ags"
import { execAsync } from "ags/process"
import Pango from "gi://Pango"

const COVER_SIZE = 64

function PlayerCard({ player }: { player: AstalMpris.Player }) {
  const title    = createBinding(player, "title").as(t => t || "Unknown")
  const artist   = createBinding(player, "artist").as(a => a || "")
  const status   = createBinding(player, "playback_status")
  const position = createBinding(player, "position")
  const canPrev  = createBinding(player, "can_go_previous")
  const canNext  = createBinding(player, "can_go_next")
  const source   = createBinding(player, "identity").as(id => id || "Media")

  const progress = position.as(pos => {
    const len = player.length
    return len > 0 ? Math.min(pos / len, 1) : 0
  })

  let pic: Gtk.Picture | null = null
  let picBox: Gtk.Box | null = null
  let placeholder: boolean = false;

  function applyImage(path: string | null) {
    if (!pic || !picBox) return
    if (path) {
      try {
        const dpr = pic.get_scale_factor()
        const px  = COVER_SIZE * dpr
        const raw = GdkPixbuf.Pixbuf.new_from_file(path)!
        const w = raw.get_width(), h = raw.get_height()
        const r = Math.min(px / w, px / h)
        const scaled = raw.scale_simple(Math.round(w * r), Math.round(h * r), GdkPixbuf.InterpType.HYPER)!
        pic.set_paintable(Gdk.Texture.new_for_pixbuf(scaled))
        picBox.visible = true
        placeholder = false
      } catch {
        picBox.visible = false
        placeholder = true
      }
    } else {
      pic.set_paintable(null)
      picBox.visible = false
      placeholder = true
    }
  }

  function refresh() {
    const cached = player.cover_art
    if (cached) { applyImage(cached); return }
    const url = player.art_url
    if (!url) { applyImage(null); return }
    const hash = GLib.compute_checksum_for_string(GLib.ChecksumType.MD5, url, -1)
    const tmp = `/tmp/ags-cover-${hash}.png`
    if (GLib.file_test(tmp, GLib.FileTest.EXISTS)) { applyImage(tmp); return }
    execAsync(["curl", "-sf", "--max-time", "5", "-o", tmp, url])
      .then(() => applyImage(tmp))
      .catch(() => applyImage(null))
  }

  onCleanup(createBinding(player, "art_url").subscribe(refresh))

  return (
    <box class="player-card" orientation={1} spacing={8}>
      <box spacing={10}>
        <box class="cover-art" visible={false}
          widthRequest={COVER_SIZE} heightRequest={COVER_SIZE}
          $={(self: Gtk.Box) => {
            picBox = self
            pic = new Gtk.Picture()
            pic.contentFit = Gtk.ContentFit.FILL
            self.append(pic)
            refresh()
          }}
        />
        <box class="cover-placeholder" halign={3} valign={3} visible={placeholder}>
          <label label="♪" />
        </box>
        <box hexpand valign={3} orientation={1} spacing={2}>
          <label class="player-source" label={source} xalign={0} />
          <label class="player-title" label={title} xalign={0}
            ellipsize={Pango.EllipsizeMode.END} maxWidthChars={22} />
          <label class="player-artist" label={artist} xalign={0}
            ellipsize={Pango.EllipsizeMode.END} maxWidthChars={22} />
        </box>
      </box>

      <levelbar class="player-progress" value={progress} />

      <box class="player-controls" halign={3} spacing={4}>
        <button class="ctrl-btn" sensitive={canPrev} onClicked={() => player.previous()}>
          <label label="⏮" />
        </button>
        <button class="ctrl-btn ctrl-play" onClicked={() => player.play_pause()}>
          <label label={status.as(s => s === AstalMpris.PlaybackStatus.PLAYING ? "⏸" : "▶")} />
        </button>
        <button class="ctrl-btn" sensitive={canNext} onClicked={() => player.next()}>
          <label label="⏭" />
        </button>
      </box>
    </box>
  )
}

export default function MediaPlayer() {
  const mpris   = AstalMpris.get_default()
  const players = createBinding(mpris, "players")
  const active  = players.as(ps => {
    if (!ps.length) return []
    return [ps.find(p => p.playback_status === AstalMpris.PlaybackStatus.PLAYING) ?? ps[0]]
  })
  const isEmpty = players.as(ps => ps.length === 0)

  return (
    <box class="media-card card" orientation={1} spacing={6} hexpand>
      <label class="card-header" label="Now Playing" xalign={0} />
      <box class="no-media" visible={isEmpty} halign={3}>
        <label label="No media playing" />
      </box>
      <For each={active}>
        {(player) => <PlayerCard player={player} />}
      </For>
    </box>
  )
}
