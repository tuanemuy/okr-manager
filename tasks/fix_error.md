# エラーの修正

## タスク

- 以下のランタイムエラーを修正する

```
Error in searchOkrsAction: ZodError: [
  {
    "code": "invalid_value",
    "values": [
      "team",
      "personal"
    ],
    "path": [
      "type"
    ],
    "message": "Invalid option: expected one of \"team\"|\"personal\""
  }
]
    at searchOkrsAction (search.ts:30:46)
    at async SearchOkrs (SearchOkrs.tsx:30:18)
    at resolveErrorDev (react-server-dom-turbopack-client.browser.development.js:1858:46)
    at getOutlinedModel (react-server-dom-turbopack-client.browser.development.js:1342:22)
    at parseModelString (react-server-dom-turbopack-client.browser.development.js:1482:15)
    at Array.<anonymous> (react-server-dom-turbopack-client.browser.development.js:2287:18)
    at JSON.parse (<anonymous>)
    at resolveConsoleEntry (react-server-dom-turbopack-client.browser.development.js:2122:28)
    at processFullStringRow (react-server-dom-turbopack-client.browser.development.js:2263:11)
    at processFullBinaryRow (react-server-dom-turbopack-client.browser.development.js:2226:7)
    at progress (react-server-dom-turbopack-client.browser.development.js:2472:17)
    ...
```
