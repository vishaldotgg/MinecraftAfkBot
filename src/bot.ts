import Mineflayer from "mineflayer"
import { sleep, getRandom } from "./utils.ts"
import CONFIG from "../config.json" with { type: "json" }

let loop: NodeJS.Timeout
let bot: Mineflayer.Bot

const disconnect = (): void => {
  clearInterval(loop)
  bot?.quit?.()
  bot?.end?.()
}

const reconnect = async (): Promise<void> => {
  console.log(`Reconnecting in ${CONFIG.action.retryDelay / 1000} seconds...\n`)

  disconnect()
  await sleep(CONFIG.action.retryDelay)
  createBot()
}

const createBot = (): void => {

  bot = Mineflayer.createBot({
    host: CONFIG.client.host,
    port: +CONFIG.client.port,
    username: CONFIG.client.username
  } as const)

  bot.once("error", error => {
    console.error(`AFKBot error: ${error}`)
  })

  bot.once("kicked", raw => {
    console.error(`AFKBot kicked: ${raw}`)
  })

  bot.once("end", () => void reconnect())

  bot.once("login", () => {
    console.log(`AFKBot logged in as ${bot.username}\n`)
  })

  bot.once("spawn", () => {

    console.log("Bot spawned. Starting AFK loop.")

    // Leave after 6 hours
    setTimeout(async () => {

      console.log("6 hours completed. Leaving server...")

      disconnect()

      console.log("Waiting 1 minute before rejoining...")

      await sleep(60000)

      createBot()

    }, 6 * 60 * 60 * 1000)

    const changePos = async (): Promise<void> => {

      const action = getRandom(CONFIG.action.commands) as Mineflayer.ControlState
      const sprint = Math.random() < 0.5

      console.debug(`${action}${sprint ? " with sprint" : ""}`)

      bot.setControlState("sprint", sprint)
      bot.setControlState(action, true)

      await sleep(CONFIG.action.holdDuration)

      bot.clearControlStates()
    }

    const changeView = async (): Promise<void> => {

      const yaw = (Math.random() * Math.PI) - (0.5 * Math.PI)
      const pitch = (Math.random() * Math.PI) - (0.5 * Math.PI)

      await bot.look(yaw, pitch, false)
    }

    loop = setInterval(() => {

      changeView()
      changePos()

    }, CONFIG.action.holdDuration)

  })

}

export default (): void => {
  createBot()
}