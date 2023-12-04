import IdAnalyzer from "idanalyzer2"
let {Profile, Transaction, SetEndpoint, APIError, InvalidArgumentException} = IdAnalyzer
import fs from "node:fs/promises"

try {
    // SetEndpoint('https://yourip/') //on-premise
    let t = new Transaction('GuH1YYus7ylJdWBDdhAiuSYXaAmQHZi3')
    t.throwApiException(true)
    await fs.writeFile("./listTransaction.json", JSON.stringify(await t.listTransaction()))
    await fs.writeFile("./getTransaction.json", JSON.stringify(await t.getTransaction("bd328fe7271745fd92629577b7eec625")))
    await fs.writeFile("./updateTransaction.json", JSON.stringify(await t.updateTransaction("bd328fe7271745fd92629577b7eec625", 'reject')))
    await fs.writeFile("./deleteTransaction.json", JSON.stringify(await t.deleteTransaction("bd328fe7271745fd92629577b7eec625")))
    await t.saveImage("e6cb3a24889485ecda073baacc5e7230045da7013d7d9c17a808c92e18b5dc8b", "test.jpg")
    await t.saveFile("firstcontract_lrRI8FpiFltN72HlxoexPbEtNbrSRUTa.pdf", "test.pdf")
    await t.exportTransaction("app.zip", [
        "27784ecdff734e2a9ade9e6fecbc5d05",
        "5d12a40ab5be4e9693812163bcc9cf85"
    ], 'json')
} catch (e) {
    if(e instanceof InvalidArgumentException) {
        console.log(e.message)
    } else if(e instanceof APIError) {
        console.log(e.code, e.msg)
    } else {
        console.log(e.message)
    }
}
