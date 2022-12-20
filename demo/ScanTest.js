import {Profile, Scanner} from '../lib/idanalyzer.js'
import {APIError, InvalidArgumentException} from "../lib/exception.js";

try {
    let profile = new Profile(Profile.SECURITY_MEDIUM)
    let s = new Scanner('OlZBrUWs4F60McKKKpuLKNY01XX7sm6B')
    s.throwApiException(true)
    console.log(await s.quickScan("05.jpg", "", true))
    s.setProfile(profile)
    console.log(await s.scan("05.jpg"))
} catch (e) {
    if(e instanceof InvalidArgumentException) {
        console.log(e.message)
    } else if(e instanceof APIError) {
        console.log(e.code, e.msg)
    } else {
        console.log(e.message)
    }
}
