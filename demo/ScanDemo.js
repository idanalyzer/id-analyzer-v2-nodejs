import IdAnalyzer from "idanalyzer2"
let {Profile, Scanner, SetEndpoint, APIError, InvalidArgumentException} = IdAnalyzer
import fs from "node:fs/promises"

let scanDemo = async () => {
    try {
        // SetEndpoint('https://yourip/') //on-premise
        let profile = new Profile(Profile.SECURITY_MEDIUM)
        let s = new Scanner('GuH1YYus7ylJdWBDdhAiuSYXaAmQHZi3')
        s.throwApiException(true)
        let quickResult = await s.quickScan("05.png", "", true)
        await fs.writeFile("./quickscan.json", JSON.stringify(quickResult))
        s.setProfile(profile)
        let scanResult = await s.scan("05.png")
        await fs.writeFile("./scan.json", JSON.stringify(scanResult))
    } catch (e) {
        if(e instanceof InvalidArgumentException) {
            console.log("InvalidArgumentException => ", e.message)
        } else if(e instanceof APIError) {
            console.log("APIError => ", e.code, e.msg)
        } else {
            console.log("unknown error => ", e.message)
        }
    }
}

scanDemo()
