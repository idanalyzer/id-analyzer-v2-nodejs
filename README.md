
# ID Analyzer NodeJS
This is a Javascript library for [ID Analyzer Identity Verification APIs](https://www.idanalyzer.com), though all the APIs can be called with without the library using simple HTTP requests as outlined in the [documentation](https://id-analyzer-v2.readme.io), you can use this library to accelerate server-side development.

We strongly discourage users to connect to ID Analyzer API endpoint directly  from client-side applications that will be distributed to end user, such as mobile app, or in-browser JavaScript. Your API key could be easily compromised, and if you are storing your customer's information inside Vault they could use your API key to fetch all your user details. Therefore, the best practice is always to implement a client side connection to your server, and call our APIs from the server-side.

## Installation
Install through npm

```bash
npm install idanalyzer2
```


## Scanner
This category supports all scanning-related functions specifically used to initiate a new identity document scan & ID face verification transaction by uploading based64-encoded images.
![Sample ID](https://www.idanalyzer.com/img/sampleid1.jpg)
```javascript
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
```

## Biometric
There are two primary functions within this class. The first one is verifyFace and the second is verifyLiveness.
```javascript
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

```

## Contract
All contract-related feature sets are available in Contract class. There are three primary functions in this class.
```javascript
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


```

## Docupass
This category supports all rapid user verification based on the ids and the face images provided.
![DocuPass Screen](https://www.idanalyzer.com/img/docupassliveflow.jpg)
```javascript
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


```

## Transaction
This function enables the developer to retrieve a single transaction record based on the provided transactionId.
```javascript
import IdAnalyzer from "idanalyzer2"
let {Profile, Transaction, SetEndpoint, APIError, InvalidArgumentException} = IdAnalyzer
import fs from "node:fs/promises"

try {
    // SetEndpoint('https://yourip/') //on-premise
    let t = new Transaction('GuH1YYus7ylJdWBDdhAiuSYXaAmQHZi3')
    t.throwApiException(true)
    await fs.writeFile("./listTransaction.json", JSON.stringify(await t.listTransaction()))
    await fs.writeFile("./getTransaction.json", JSON.stringify(await t.getTransaction("bd328fe7271745fd92629577b7eec625")))
    await fs.writeFile("./updateTransaction.json", JSON.stringify(await t.updateTransaction("bd328fe7271745fd92629577b7eec625", 'reject')))
    await fs.writeFile("./deleteTransaction.json", JSON.stringify(await t.deleteTransaction("bd328fe7271745fd92629577b7eec625")))
    await t.saveImage("e6cb3a24889485ecda073baacc5e7230045da7013d7d9c17a808c92e18b5dc8b", "test.jpg")
    await t.saveFile("firstcontract_lrRI8FpiFltN72HlxoexPbEtNbrSRUTa.pdf", "test.pdf")
    await t.exportTransaction("app.zip", [
        "27784ecdff734e2a9ade9e6fecbc5d05",
        "5d12a40ab5be4e9693812163bcc9cf85"
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

```

## Api Document
[ID Analyzer Document](https://id-analyzer-v2.readme.io/docs/nodejs)

## Demo
Check out **/demo** folder for more JS demos.

## SDK Reference
Check out [ID Analyzer NodeJS Reference](https://idanalyzer.github.io/id-analyzer-nodejs/)
