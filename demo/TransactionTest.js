import {Transaction, SetEndpoint} from '../lib/idanalyzer.js'
import {APIError, InvalidArgumentException} from "../lib/exception.js";

try {
    // SetEndpoint('https://yourip/') //on-premise
    let t = new Transaction('OlZBrUWs4F60McKKKpuLKNY01XX7sm6B')
    t.throwApiException(true)
    console.log(await t.getTransaction("431a7cf45091420e9eaffa4e5370c896"))
    console.log(await t.listTransaction())
    console.log(await t.updateTransaction("431a7cf45091420e9eaffa4e5370c896", "review"))
    console.log(await t.deleteTransaction("431a7cf45091420e9eaffa4e5370c896"))
    await t.saveImage("846baeb7a626cb11dd65049c8792bf97e4e4284bba8e89479d65241bd9f3a3dc", "test.jpg")
    await t.saveFile("firstcontract_lrRI8FpiFltN72HlxoexPbEtNbrSRUTa.pdf", "test.pdf")
    await t.exportTransaction("app.zip", [
        "a714d58a41874326874c7ce0052717ee",
        "cb45b0898aeb4a3b8fd578f136f4fafa"
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
