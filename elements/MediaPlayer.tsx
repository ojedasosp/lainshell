import AstalMpris from "gi://AstalMpris?version=0.1"
import { createBinding, For } from "ags"
import Pango from "gi://Pango"

function PlayerCard({ player }: { player: AstalMpris.Player }) {
  const title    = createBinding(player, "title").as(t => t || "Unknown")
  const artist   = createBinding(player, "artist").as(a => a || "")
  const status   = createBinding(player, "playback_status")
  const cover    = createBinding(player, "cover_art")
  const position = createBinding(player, "position")
  const canPrev  = createBinding(player, "can_go_previous")
  const canNext  = createBinding(player, "can_go_next")
  const source   = createBinding(player, "identity").as(id => id || "Media")

  const progress = position.as(pos => {
    const len = player.length
    return len > 0 ? Math.min(pos / len, 1) : 0
  })

  const hasCover = cover.as(p => !!p)
  const noCover  = cover.as(p => !p)
  const coverFile = cover.as(p => p || "")

  return (
    <box class="player-card" orientation={1} spacing={8}>
      <box spacing={10}>
        <image class="cover-art" file={coverFile} visible={hasCover}
          widthRequest={64} heightRequest={64} />
        <box class="cover-placeholder" halign={3} valign={3} visible={noCover}>
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
