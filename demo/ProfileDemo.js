import IdAnalyzer from "../index.js"
let {Profile, ProfileAPI, APIError, InvalidArgumentException} = IdAnalyzer
import fs from "node:fs/promises"

try {
    let p = new ProfileAPI('GuH1YYus7ylJdWBDdhAiuSYXaAmQHZi3')
    p.throwApiException(true)

    let cfg = new Profile(Profile.SECURITY_MEDIUM)
    cfg.decisionTrigger(1, 1)

    let created = await p.createProfile("My Onboarding Profile", cfg)
    await fs.writeFile("./createProfile.json", JSON.stringify(created))
    let profileId = created.profileId

    await p.updateProfile(profileId, "My Onboarding Profile (v2)", cfg)
    let detail = await p.getProfile(profileId)
    await fs.writeFile("./getProfile.json", JSON.stringify(detail))

    let list = await p.listProfile()
    await fs.writeFile("./listProfile.json", JSON.stringify(list))

    await p.exportProfile(profileId)
    await p.deleteProfile(profileId)
} catch (e) {
    if (e instanceof InvalidArgumentException) {
        console.log("InvalidArgumentException => ", e.message)
    } else if (e instanceof APIError) {
        console.log("APIError => ", e.code, e.msg)
    } else {
        console.log("unknown error => ", e.message)
    }
}
