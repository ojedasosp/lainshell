import app from "ags/gtk4/app"

export default function Status() {
  return (
    <box class="status">
      <label class="cpu" label=" cpu" />
      <label class="memory" label=" mem" />
      <label class="disk" label=" disk" />
      <label class="network" label=" net" />
      <label class="pulseaudio" label=" vol" />
      <label class="battery" label=" bat" />
      <button class="custom-power">
        <label label=" " />
      </button>
    </box>
  )
}
