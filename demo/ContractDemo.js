import IdAnalyzer from "idanalyzer2"
let {Profile, Contract, SetEndpoint, APIError, InvalidArgumentException} = IdAnalyzer
import fs from "node:fs/promises"

try {
    // SetEndpoint('https://yourip/') //on-premise
    let c = new Contract('GuH1YYus7ylJdWBDdhAiuSYXaAmQHZi3')
    c.throwApiException(true)
    let temp = await c.createTemplate('tempName', '<p>%{fullName}</p>')
    let tempId = temp['templateId']
    console.log("temp -> ", temp)
    console.log("tempId -> ", tempId)

    await fs.writeFile("./updateTemplate.json", JSON.stringify(await c.updateTemplate(tempId, "oldTemp", "<p>%{fullName}</p><p>Hello!!</p>")))
    await fs.writeFile("./getTemplate.json", JSON.stringify(await c.getTemplate(tempId)))
    await fs.writeFile("./listTemplate.json", JSON.stringify(await c.listTemplate()))
    await fs.writeFile("./generate.json", JSON.stringify(await c.generate(tempId, "PDF", "", {
        'fullName': "Tian",
    })))
    await fs.writeFile("./listTemplate.json", JSON.stringify(await c.deleteTemplate(tempId)))
} catch (e) {
    if(e instanceof InvalidArgumentException) {
        console.log(e.message)
    } else if(e instanceof APIError) {
        console.log(e.code, e.msg)
    } else {
        console.log(e.message)
    }
}
