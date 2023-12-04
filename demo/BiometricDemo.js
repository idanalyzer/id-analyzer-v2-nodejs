import IdAnalyzer from "idanalyzer2"
let {Profile, Biometric, SetEndpoint, APIError, InvalidArgumentException} = IdAnalyzer
import fs from "node:fs/promises"

try {
    // SetEndpoint('https://yourip/') //on-premise
    let profile = new Profile(Profile.SECURITY_MEDIUM)
    let b = new Biometric('GuH1YYus7ylJdWBDdhAiuSYXaAmQHZi3')
    b.throwApiException(true)
    b.setProfile(profile)
    await fs.writeFile("./verifyFace.json", JSON.stringify(await b.verifyFace('05.png', '05.png')))
    await fs.writeFile("./verifyLiveness.json", JSON.stringify(await b.verifyLiveness('05.png')))
} catch (e) {
    if(e instanceof InvalidArgumentException) {
        console.log(e.message)
    } else if(e instanceof APIError) {
        console.log(e.code, e.msg)
    } else {
        console.log(e.message)
    }
}
