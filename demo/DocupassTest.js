import {Docupass} from '../lib/idanalyzer.js'
import {APIError, InvalidArgumentException} from "../lib/exception.js";

try {
    let d = new Docupass('OlZBrUWs4F60McKKKpuLKNY01XX7sm6B')
    d.throwApiException(true)
    let docuResp = await d.createDocupass("bbd8436953ef426e98d078953f258835")
    console.log(docuResp)
    let docuReference = docuResp['reference']
    console.log(docuReference)
    console.log(await d.listDocupass())
    console.log(await d.deleteDocupass(docuReference))
} catch (e) {
    if(e instanceof InvalidArgumentException) {
        console.log(e.message)
    } else if(e instanceof APIError) {
        console.log(e.code, e.msg)
    } else {
        console.log(e.message)
    }
}
