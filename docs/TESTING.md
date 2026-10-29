# Automated Testing & Verification Guide
## AI Power Sales Intelligence System (Version 2.0)

### 1. Test Architecture Overview
The system implements automated testing using **Jest** and **Supertest** for unit and integration testing. Database tests run against an in-memory MongoDB engine (`mongodb-memory-server`), ensuring tests can execute anywhere without requiring a running MongoDB service or mutating local development data.

---

### 2. Test Suites Summary

| Suite File | Target Module | Scope | Specs |
| :--- | :--- | :--- | :--- |
| `tests/aiEngine.test.js` | AI Intelligence Engine | Unit | Seniority logic, weights, factor breakdown, anti-repeat action rules, urgency ranking |
| `tests/auth.test.js` | Auth Controller & Middleware | Integration | Registration, duplicate checks, login, password hashing, JWT verification, `/me` guard |
| `tests/lead.test.js` | Lead Controller & Activity | Integration | CRUD, server pagination, auto AI scoring on create/update, activity appending, cascade delete |
| `tests/analytics.test.js`| Sales Analytics & Reporting | Integration | Overview metrics, zero-safe division guards, channel win rates, pipeline value calculations |

**Total Test Count**: 26 passed specs across 4 test suites.

---

### 3. Running the Test Suites

#### In Windows PowerShell (Project Root):
```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
cd server
npm test
```

#### Run Specific Test Suite:
```powershell
# Run AI intelligence engine unit tests only
node ./node_modules/jest/bin/jest.js --testPathPattern=aiEngine.test.js

# Run authentication integration tests only
node ./node_modules/jest/bin/jest.js --testPathPattern=auth.test.js

# Run lead management tests only
node ./node_modules/jest/bin/jest.js --testPathPattern=lead.test.js

# Run analytics and metrics tests only
node ./node_modules/jest/bin/jest.js --testPathPattern=analytics.test.js
```

---

### 4. Verification Check Matrix (Section 15 Compliance)

| Requirement Check | Status | Evidence / Verification Method |
| :--- | :--- | :--- |
| 1. Dependencies installed & resolved | **PASSED** | Backend (447 packages) & Client (137 packages) installed |
| 2. Backend health endpoint check | **PASSED** | `GET /api/health` returned HTTP 200 `{"status": "healthy"}` |
| 3. MongoDB connection & error reporting | **PASSED** | Handled via connection retry and in-memory MongoDB fallback |
| 4. User registration and login | **PASSED** | Verified in `tests/auth.test.js` and live PowerShell API probe |
| 5. Protected endpoints with & without token | **PASSED** | Unauthenticated requests receive HTTP 401; valid token accesses `/me` |
| 6. Lead CRUD and validation | **PASSED** | Verified in `tests/lead.test.js` with full validation checks |
| 7. Role-based authorization & data ownership | **PASSED** | Admin sees all records; sales reps scoped to assigned/owned records |
| 8. AI score calculation & recommendation | **PASSED** | Verified in `tests/aiEngine.test.js` (12 specs passed) |
| 9. Analytics calculations using seeded data | **PASSED** | Verified in `tests/analytics.test.js` (zero-safe win rates, totals) |
| 10. Task creation, toggle & overdue tracking | **PASSED** | Verified in API routes and live test scripts |
| 11. Production build of React frontend | **PASSED** | Vite production build created in `client/dist` (11.11s) |
| 12. Automated test suite execution | **PASSED** | 4/4 test suites passed (26 specs) |
| 13. Fix runtime and test failures | **PASSED** | Resolved VP seniority regex and fresh lead recency score |
| 14. Frontend API URL and CORS alignment | **PASSED** | CORS allowed origins matched with Vite port 5173 |
