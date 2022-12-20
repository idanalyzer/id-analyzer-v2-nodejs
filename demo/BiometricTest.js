import {Biometric, Profile} from '../lib/idanalyzer.js'
import {APIError, InvalidArgumentException} from "../lib/exception.js";

try {
    let profile = new Profile(Profile.SECURITY_MEDIUM)
    let b = new Biometric('OlZBrUWs4F60McKKKpuLKNY01XX7sm6B')
    b.throwApiException(true)
    b.setProfile(profile)
    console.log(b.verifyFace('05.jpg', '05.jpg'))
    console.log(b.verifyLiveness('05.jpg', '05.jpg'))
} catch (e) {
    if(e instanceof InvalidArgumentException) {
        console.log(e.message)
    } else if(e instanceof APIError) {
        console.log(e.code, e.msg)
    } else {
        console.log(e.message)
    }
}
