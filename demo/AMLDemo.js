import IdAnalyzer from "../index.js"
let {AML, APIError, InvalidArgumentException} = IdAnalyzer
import fs from "node:fs/promises"

try {
    let a = new AML('GuH1YYus7ylJdWBDdhAiuSYXaAmQHZi3')
    a.throwApiException(true)

    let resp = await a.search("John Smith", "", 0, "US")
    await fs.writeFile("./amlSearch.json", JSON.stringify(resp))

    let respV3 = await a.searchV3("John Smith", "", 10, 1)
    await fs.writeFile("./amlSearchV3.json", JSON.stringify(respV3))
} catch (e) {
    if (e instanceof InvalidArgumentException) {
        console.log("InvalidArgumentException => ", e.message)
    } else if (e instanceof APIError) {
        console.log("APIError => ", e.code, e.msg)
    } else {
        console.log("unknown error => ", e.message)
    }
}
