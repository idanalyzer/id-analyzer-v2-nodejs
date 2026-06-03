import IdAnalyzer from "../index.js"
let {Webhook, APIError, InvalidArgumentException} = IdAnalyzer
import fs from "node:fs/promises"

try {
    let w = new Webhook('GuH1YYus7ylJdWBDdhAiuSYXaAmQHZi3')
    w.throwApiException(true)

    let logs = await w.listWebhook()
    await fs.writeFile("./listWebhook.json", JSON.stringify(logs))

    // await w.resendWebhook("<webhookId>")
    // await w.deleteWebhook("<webhookId>")
} catch (e) {
    if (e instanceof InvalidArgumentException) {
        console.log("InvalidArgumentException => ", e.message)
    } else if (e instanceof APIError) {
        console.log("APIError => ", e.code, e.msg)
    } else {
        console.log("unknown error => ", e.message)
    }
}
