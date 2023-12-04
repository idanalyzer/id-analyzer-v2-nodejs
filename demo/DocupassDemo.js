import IdAnalyzer from "idanalyzer2"
let {Profile, Scanner, SetEndpoint, APIError, InvalidArgumentException, Docupass} = IdAnalyzer
import fs from "node:fs/promises"

try {
    // SetEndpoint('https://yourip/') //on-premise
    let d = new Docupass('GuH1YYus7ylJdWBDdhAiuSYXaAmQHZi3')
    d.throwApiException(true)
    let docuResp = await d.createDocupass("deb76a25f2404d38ac1dc2a1f355a5ef")
    await fs.writeFile("./docupass.json", JSON.stringify(docuResp))
    let docuReference = docuResp['reference']
    console.log("reference => ", docuReference)
    await fs.writeFile("./listDocupass.json", JSON.stringify(await d.listDocupass()))
    console.log("delete docupass => ", await d.deleteDocupass(docuReference))
} catch (e) {
    if(e instanceof InvalidArgumentException) {
        console.log(e.message)
    } else if(e instanceof APIError) {
        console.log(e.code, e.msg)
    } else {
        console.log(e.message)
    }
}
