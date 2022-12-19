import {Transaction} from '../lib/idfort.js'
import {APIError, InvalidArgumentException} from "../lib/Exception.js";

try {
    let transaction = new Transaction('OlZBrUWs4F60McKKKpuLKNY01XX7sm6B')
    transaction.throwApiException(true)
    let tid = '8f746568b114473ca4bfc0c726496538'
    console.log(await transaction.getTransaction(tid))
    console.log(await transaction.listTransaction())
    console.log(await transaction.updateTransaction(tid, 'accept'))
    console.log(await transaction.deleteTransaction(tid))
    await transaction.saveImage('4d98a216be22eac7f0f3577376e4f7ba2a6ccc7c64519b293ce2aa548cbdb20e', 'test.jpg')
    await transaction.saveFile('testsign_pKovQ3Sc6cETIUYJkTDmpEJgQ9Kb5XA7.pdf', 'tt.pdf')
    await transaction.exportTransaction('./test.zip', [
        "fd8f0fce40304210ba3911d2624cd521",
        "11223691b21a444bbd1491e621f0afa4"
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