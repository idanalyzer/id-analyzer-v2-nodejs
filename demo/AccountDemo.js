import IdAnalyzer from "../index.js"
let {Account, APIError, InvalidArgumentException} = IdAnalyzer
import fs from "node:fs/promises"

try {
    let acc = new Account('GuH1YYus7ylJdWBDdhAiuSYXaAmQHZi3')
    acc.throwApiException(true)

    let resp = await acc.getAccount()
    await fs.writeFile("./myAccount.json", JSON.stringify(resp))
} catch (e) {
    if (e instanceof InvalidArgumentException) {
        console.log("InvalidArgumentException => ", e.message)
    } else if (e instanceof APIError) {
        console.log("APIError => ", e.code, e.msg)
    } else {
        console.log("unknown error => ", e.message)
    }
}
