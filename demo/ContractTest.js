import {Contract} from '../lib/idfort.js'
import {APIError, InvalidArgumentException} from "../lib/Exception.js";

try {
    let c = new Contract('OlZBrUWs4F60McKKKpuLKNY01XX7sm6B')
    c.throwApiException(true)
    let temp = await c.createTemplate('tempName', '<p>%{fullName}</p>')
    let tempId = temp['templateId']
    console.log(temp)
    console.log(tempId)

    console.log(await c.updateTemplate(tempId, "oldTemp", "<p>%{fullName}</p><p>Hello!!</p>"))
    console.log(await c.getTemplate(tempId))
    console.log(await c.listTemplate())
    console.log(await c.generate(tempId, "PDF", "", {
        'fullName': "Tian",
    }))
    console.log(await c.deleteTemplate(tempId))
} catch (e) {
    if(e instanceof InvalidArgumentException) {
        console.log(e.message)
    } else if(e instanceof APIError) {
        console.log(e.code, e.msg)
    } else {
        console.log(e.message)
    }
}