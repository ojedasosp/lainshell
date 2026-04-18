import { createPoll } from "ags/time"
import { Accessor, With } from "ags"

export default function Clock() {
  const date: Accessor<Date> =  createPoll(new Date(), 1000, () => new Date()) 
  return (<box class="clock">
          <With value={date}>
            {(date) => <label label={
              `${date.toLocaleString('en-US', {weekday:"short"})} ${date.toLocaleString('en-US', {day:'numeric'})}, ${date.toLocaleString('en-US', {hour: 'numeric', minute:"2-digit", hour12: true})}`}/>
            }
          </With>
          </box>)
}
