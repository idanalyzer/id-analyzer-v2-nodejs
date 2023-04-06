
# ID Analyzer NodeJS
This is a Javascript library for [ID Analyzer Identity Verification APIs](https://www.idanalyzer.com), though all the APIs can be called with without the library using simple HTTP requests as outlined in the [documentation](https://id-analyzer-v2.readme.io), you can use this library to accelerate server-side development.

We strongly discourage users to connect to ID Analyzer API endpoint directly  from client-side applications that will be distributed to end user, such as mobile app, or in-browser JavaScript. Your API key could be easily compromised, and if you are storing your customer's information inside Vault they could use your API key to fetch all your user details. Therefore, the best practice is always to implement a client side connection to your server, and call our APIs from the server-side.

## Installation
Install through npm

```bash
npm install idanalyzer
```


## Scanner
This category supports all scanning-related functions specifically used to initiate a new identity document scan & ID face verification transaction by uploading based64-encoded images.
![Sample ID](https://www.idanalyzer.com/img/sampleid1.jpg)
```javascript
import {Profile, Scanner, SetEndpoint} from '../lib/idanalyzer.js'
import {APIError, InvalidArgumentException} from "../lib/exception.js";

try {
    // SetEndpoint('https://yourip/') //on-premise
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
```

## Biometric
There are two primary functions within this class. The first one is verifyFace and the second is verifyLiveness.
```javascript
import {Biometric, Profile, SetEndpoint} from '../lib/idanalyzer.js'
import {APIError, InvalidArgumentException} from "../lib/exception.js";

try {
    // SetEndpoint('https://yourip/') //on-premise
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
```

## Contract
All contract-related feature sets are available in Contract class. There are three primary functions in this class.
```javascript
import {Contract, SetEndpoint} from '../lib/idanalyzer.js'
import {APIError, InvalidArgumentException} from "../lib/exception.js";

try {
    // SetEndpoint('https://yourip/') //on-premise
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

```

## Docupass
This category supports all rapid user verification based on the ids and the face images provided.
![DocuPass Screen](https://www.idanalyzer.com/img/docupassliveflow.jpg)
```javascript
import {Docupass, SetEndpoint} from '../lib/idanalyzer.js'
import {APIError, InvalidArgumentException} from "../lib/exception.js";

try {
    // SetEndpoint('https://yourip/') //on-premise
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

```

## Transaction
This function enables the developer to retrieve a single transaction record based on the provided transactionId.
```javascript
import {Transaction, SetEndpoint} from '../lib/idanalyzer.js'
import {APIError, InvalidArgumentException} from "../lib/exception.js";

try {
    // SetEndpoint('https://yourip/') //on-premise
    let t = new Transaction('OlZBrUWs4F60McKKKpuLKNY01XX7sm6B')
    t.throwApiException(true)
    console.log(await t.getTransaction("431a7cf45091420e9eaffa4e5370c896"))
    console.log(await t.listTransaction())
    console.log(await t.updateTransaction("431a7cf45091420e9eaffa4e5370c896", "review"))
    console.log(await t.deleteTransaction("431a7cf45091420e9eaffa4e5370c896"))
    await t.saveImage("846baeb7a626cb11dd65049c8792bf97e4e4284bba8e89479d65241bd9f3a3dc", "test.jpg")
    await t.saveFile("firstcontract_lrRI8FpiFltN72HlxoexPbEtNbrSRUTa.pdf", "test.pdf")
    await t.exportTransaction("app.zip", [
        "a714d58a41874326874c7ce0052717ee",
        "cb45b0898aeb4a3b8fd578f136f4fafa"
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
