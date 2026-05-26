# White-Box Current Results

## Run Date

- `2026-05-19`

## Commands

```bash
npm run test:whitebox
npm run test:mobile -- --runInBand
npm run test:backend -- --runInBand
```

## Result Summary

| Area | Test Suites | Tests | Status |
| --- | --- | --- | --- |
| Mobile white-box tests | 2 | 13 | Passed |
| Backend white-box tests | 13 | 53 | Passed |
| Total | 15 | 66 | Passed |

## Implemented Coverage

| ID | Area | What Was Tested | Test File |
| --- | --- | --- | --- |
| WB-01 | Mobile | Role-to-route mapping logic | `__tests__/mobile/authStack.logic.test.js` |
| WB-02 | Mobile | Startup fallback when storage is missing or broken | `__tests__/mobile/authStack.logic.test.js` |
| WB-03 | Mobile | Fine payment deep-link parsing | `__tests__/mobile/authStack.logic.test.js` |
| WB-04 | Mobile | Alert localization wrapper behavior | `__tests__/mobile/alertLocalization.test.js` |
| WB-05 | Backend | Missing token, invalid token, valid token, disabled account | `backend/__tests__/auth.middleware.test.js` |
| WB-06 | Backend | Role-based authorization checks | `backend/__tests__/role.middleware.test.js` |
| WB-07 | Backend | Unauthorized report creation and required field validation | `backend/__tests__/report.controller.test.js` |
| WB-08 | Backend | Multipart fallback payload normalization in report creation | `backend/__tests__/report.controller.test.js` |
| WB-09 | Backend | Counseling intake validation and normalized request creation | `backend/__tests__/counseling.controller.test.js` |
| WB-10 | Backend | Counseling slot conflict checks and successful booking path | `backend/__tests__/counseling.controller.test.js` |
| WB-11 | Backend | Donation authentication, field validation, amount validation, and create success path | `backend/__tests__/donation.controller.test.js` |
| WB-12 | Backend | Donation approve and reject status transitions | `backend/__tests__/donation.controller.test.js` |
| WB-13 | Backend | Traffic fine creation guard and payment initiation validation | `backend/__tests__/trafficPay.controller.test.js` |
| WB-14 | Backend | Traffic pending-payment guard, Stripe checkout session path, and cancel callback path | `backend/__tests__/trafficPay.controller.test.js` |
| WB-15 | Backend | User registration validation, duplicate email guard, and successful auth response | `backend/__tests__/auth.controller.test.js` |
| WB-16 | Backend | Login invalid-credential and disabled-account branches | `backend/__tests__/auth.controller.test.js` |
| WB-17 | Backend | Police-only guard plus police report assign and resolve actions | `backend/__tests__/police.controller.test.js` |
| WB-18 | Backend | Municipality report ownership checks plus take and resolve actions | `backend/__tests__/municipality.controller.test.js` |
| WB-19 | Backend | Help chat required-message validation and safe fallback response path | `backend/__tests__/helpChat.controller.test.js` |
| WB-20 | Backend | Admin dashboard stats and staff creation for supported roles | `backend/__tests__/admin.controller.test.js` |
| WB-21 | Backend | Admin-only report listing with mapped creator and assignee data | `backend/__tests__/adminReport.controller.test.js` |
| WB-22 | Backend | Report status lookup authorization and owner success path | `backend/__tests__/report.controller.test.js` |
| WB-23 | Backend | Chat message validation, conversation creation, realtime emit, and participant guard | `backend/__tests__/chat.controller.test.js` |

## Evidence To Capture For The Report

- Terminal screenshot showing mobile test command and passing result
- Terminal screenshot showing backend test command and passing result
- Terminal screenshot showing `npm run test:whitebox` passing end to end
- Optional screenshot of the test files open in the editor
- Optional screenshot of any coverage or file tree that shows the new tests

## Note

- The test runner prints a `baseline-browser-mapping` update warning before execution. This warning did not cause any test failures.
