# Virtual DOE Lab

ห้องปฏิบัติการเสมือนสำหรับฝึก **การออกแบบการทดลอง (Design of Experiments, DOE)** ในวิชาวิศวกรรมอุตสาหการ
ผู้ใช้ปรับค่าปัจจัยของการทดลอง กดทดลองเพื่อดูแบบจำลองทางฟิสิกส์ทำงานแบบเคลื่อนไหว บันทึกผลลงตาราง
แล้ววิเคราะห์ผลด้วยกราฟ Main Effects / Interaction Plot ได้ในเบราว์เซอร์ทันที

ประกอบด้วยการทดลอง 4 ชุด: **Parachute**, **Paper Helicopter**, **Water Bottle Rocket** และ **Catapult**

## Links

| Deliverable | URL |
|---|---|
| Web application | https://virtual-doe-lab.vercel.app |
| Web API (base URL) | `https://virtual-doe-lab.vercel.app/api` ([docs](#web-api)) |
| Called APIs | Google OAuth 2.0, Google Drive API v3, Google Picker API ([details](#called-external-apis)) |
| Repository | https://github.com/Sszky/VirtualDOELab |


## ผู้จัดทำ

| ชื่อ | ส่วนที่รับผิดชอบ |
|---|---|
| พัชรวัฒน์ | Water Bottle Rocket, Catapult, Home page |
| ขนิษฐา | Parachute, External API (Google Drive) |
| เบญญาภา | Paper Helicopter |

## โครงสร้างโฟลเดอร์

```
VirtualDOELab/
├─ sims-v2/                 Frontend: ตัวเว็บทั้งหมด (ใช้ template เดียวกันทั้ง 4 การทดลอง)
│  ├─ index.html            หน้าแรก (Home page)
│  ├─ assets/               ไฟล์ที่ใช้ร่วมกัน: ธีม/ฟอนต์/navbar (site.css, nav.js),
│  │                        โครงหน้าการทดลอง (sim.css), ชุดไอคอน, ตัววาดภาพ isometric (iso3d.js, home-art.js),
│  │                        api.js = ตัวเชื่อมกับ backend + ดูแล Google session ชั่วคราว,
│  │                        drive.js = ปุ่มบันทึกลง Google Drive
│  ├─ parachute/
│  ├─ paperHelicopter/
│  ├─ waterBottleRocket/
│  └─ catapult/
│     (แต่ละการทดลองมี index.html, style.css, i18n.js = ข้อความไทย/อังกฤษ, app.js = การทำงานของหน้า)
├─ server/                  Backend (Node.js + Express)
│  ├─ app.js                API ทั้งหมด (/api/...)
│  ├─ sims.js               รายชื่อการทดลอง + ช่วงค่าปัจจัยที่อนุญาต
│  ├─ physics/              แบบจำลองฟิสิกส์ของทั้ง 4 การทดลอง (ย้ายมาจาก frontend)
│  ├─ google.js             แลก/ต่ออายุ token และอัปโหลดไฟล์ลง Google Drive (ใช้ Client Secret)
│  ├─ session.js            Google session ใน cookie แบบเข้ารหัส (httpOnly)
│  ├─ history.js            ประวัติการทดลอง (My sessions) + บันทึกผลทุกครั้งที่ยิง
│  ├─ identity.js           ตรวจ token ของ Clerk → ระบุเจ้าของประวัติ
│  ├─ db.js                 เชื่อม Postgres (Supabase)
│  ├─ schema.sql            สร้างตาราง (รันครั้งเดียวใน Supabase)
│  └─ dev.js                รันเว็บ + API บนเครื่องตัวเอง (npm run dev)
├─ api/index.js             จุดเข้าของ Vercel (ส่งต่อไปที่ server/app.js)
├─ vercel.json              ตั้งค่า deploy บน Vercel
└─ .env.example             ตัวอย่าง environment variables
```

เวอร์ชันแรกของแต่ละการทดลองและหน้าหลักเดิมถูกลบออกจาก repo แล้ว ยังเปิดดูได้ในประวัติ commit ก่อน `d19e163`

## การทดลองและปัจจัย

| การทดลอง | ปัจจัยที่ปรับได้ | ค่าคงที่ที่ปรับได้ | ผลตอบ (สามารถเลือกได้) |
|---|---|---|---|
| Parachute | A รูปทรงร่ม, B วัสดุ, C เส้นผ่านศูนย์กลางร่ม (30–90 cm), D ความยาวเชือก (20–80 cm) | ความสูงที่ปล่อย (10–50 m) | เวลาตก (s), ความเร็วกระทบพื้น (m/s), สัมประสิทธิ์แรงต้าน (Cd) |
| Paper Helicopter | A ความยาวใบพัด (5–15 cm), B ความกว้างใบพัด (2–6 cm), C ความยาวลำตัว (3–10 cm), D ความกว้างลำตัว (1–4 cm) | ความสูงที่ปล่อย (1–4 m) | เวลาลอยตัว (s), ความเร็วกระทบพื้น (m/s), มวล (g) |
| Water Bottle Rocket | A มุมยิง (1–89°), B จำนวนครีบ (2–8), C ปริมาณน้ำ (50–1000 mL), D แรงดัน (10–100 psi) | – | ระยะทาง (m), เวลาลอยตัว (s), ความสูงสูงสุด (m) |
| Catapult | A มุมง้าง (120–185°), B มุมยิง (90–140°), C ตำแหน่งถ้วย (20–40 cm), D ตำแหน่งหมุด (8–24 cm), E ตำแหน่งหนังยาง (14–30 cm) | – | ระยะทาง (m), เวลาลอยตัว (s), ความสูงสูงสุด (m), ตวามเร็วตอนปล่อย (m/s) |

## ความสามารถหลัก

- แบบจำลองฟิสิกส์ของแต่ละการทดลอง แสดงผลเป็นแอนิเมชันตามเวลาจริง
  - **Water Bottle Rocket:** แรงขับจากสมการ Bernoulli + การขยายตัวแบบ adiabatic ของอากาศในขวด แล้วต่อด้วยการบินอิสระที่มีแรงต้านอากาศ (อินทิเกรตด้วย RK4)
  - **Parachute:** แรงโน้มถ่วง + แรงต้านอากาศแบบกำลังสอง ค่าสัมประสิทธิ์แรงต้านขึ้นกับรูปทรง วัสดุ และความยาวเชือก
  - **Paper Helicopter:** การตกแบบหมุน (autorotation) มวลคำนวณจากพื้นที่กระดาษ (RK4)
  - **Catapult:** พลังงานยืดหยุ่นของหนังยางระหว่างมุมง้างกับมุมยิง ได้เป็นความเร็วลูกบอล แล้วคำนวณวิถีโค้งที่มีแรงต้านอากาศ (RK4)
- โหมด **Deterministic** (ผลเท่าเดิมทุกครั้ง) และ **Stochastic** (มีความคลาดเคลื่อนแบบสุ่มเหมือนการทดลองจริง)
- ตารางบันทึกผล ขยายดูได้ทุกคอลัมน์ และส่งออกเป็น **CSV**
- กราฟ **Main Effects Plot** และ **Interaction Plot** จากผลที่บันทึกไว้
- ภาษาไทย / อังกฤษ และใช้งานได้ทั้ง desktop, tablet และมือถือ

## Backend (Node.js + Express)

ส่วนที่ย้ายไปทำที่ server:

- **คำนวณฟิสิกส์ทุกการทดลอง** (รวมสัญญาณรบกวนของโหมด Stochastic) — หน้าเว็บส่งค่าปัจจัยไปที่ `POST /api/sims/<การทดลอง>/simulate`
  แล้วได้ผลกลับมาแสดงแอนิเมชัน ค่าปัจจัยที่เกินช่วงของ slider จะถูกปรับให้อยู่ในช่วงที่ server
- **Google login / Drive** — ใช้ OAuth แบบ "code" ให้ server แลก token ด้วย Client Secret
  แล้วเก็บเป็น session ใน cookie แบบเข้ารหัส (เป็นแบบชั่วคราว — ดูกติกาด้านล่าง)
  และการอัปโหลดไฟล์ CSV ทำผ่าน `POST /api/drive/upload`

ไม่มีฐานข้อมูล — ผลการทดลองอยู่ในหน่วยความจำของหน้าเว็บเท่านั้น

| สถานการณ์ | ผลการทดลอง / ค่าที่ตั้งไว้ | Google login |
|---|---|---|
| สลับไปหน้าต่าง/แอปอื่นแล้วกลับมา | ยังอยู่ | ยังอยู่ |
| ไปการทดลองอื่นหรือหน้าแรกในเว็บ (รวมปุ่ม Back) | เริ่มใหม่ | ยังอยู่ |
| รีโหลดหน้า หรือปิดแล้วเปิดเว็บใหม่ | เริ่มใหม่ | ออกจากระบบ (ครั้งหน้าต้องเลือกบัญชีและกดอนุญาตใหม่) |
| ไม่ได้ใช้งานเว็บ 1 ชั่วโมง | ยังอยู่ | ออกจากระบบ |

### รันบนเครื่องตัวเอง

```bash
npm install
cp .env.example .env      # แล้วใส่ค่าจริง (อย่า commit ไฟล์ .env)
npm run dev               # เปิด http://localhost:3000
```

ต้องใช้ Node.js 20.12 ขึ้นไป ถ้ายังไม่ได้ตั้งค่า Google ใน `.env` การทดลองยังใช้งานได้ปกติ แต่ปุ่ม "บันทึกลง Drive" จะใช้ไม่ได้

### Deploy บน Vercel

1. Import repo นี้ใน Vercel (ไม่ต้องตั้ง Build Command — `vercel.json` กำหนดให้ใช้โฟลเดอร์ `sims-v2` เป็นหน้าเว็บ และ `api/` เป็น backend)
2. ใส่ Environment Variables ตาม `.env.example`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_API_KEY`,
   `GOOGLE_APP_ID`, `SESSION_SECRET` และ `ALLOWED_ORIGINS` (ถ้าหน้าเว็บยังอยู่บน GitHub Pages)
3. ใน Google Cloud Console → Credentials → OAuth Client: เพิ่มโดเมน Vercel ใน **Authorized JavaScript origins**
4. ระหว่างที่หน้าเว็บยังอยู่บน GitHub Pages: ใส่ URL ของ Vercel ใน `VERCEL_API_URL` ที่ `sims-v2/assets/api.js`

## ประวัติการทดลอง (My sessions)

ไม่บังคับ login — **เก็บประวัติเฉพาะคนที่ Sign in ด้วย Google (Clerk)**

| ผู้ใช้ | ผลการทดลอง |
|---|---|
| ไม่ได้ login | **ไม่บันทึก** อยู่ในหน้าจนกว่าจะปิด/รีโหลด — แถบบอกว่า "Results are not saved · Sign in to keep them" และเบราว์เซอร์เตือนก่อนออกจากหน้า |
| Sign in ด้วย Google | server บันทึกให้อัตโนมัติทุกครั้งที่ยิง เปิดได้จากทุกเครื่อง |

- Sign in ตอนที่มีผลในตารางแล้ว → ผลในตารางถูกบันทึกเป็น session ใหม่ด้วย
  (server คำนวณใหม่จากค่าปัจจัย โหมด stochastic จึงได้ตัวเลขใหม่ ตารางจะแสดงตัวเลขที่บันทึกจริง)
  - Google sign in เปิดเป็น popup; ถ้าเบราว์เซอร์พาออกจากหน้าไป (redirect) ผลในตารางถูกฝากไว้ใน `sessionStorage`
    ของแท็บนั้นชั่วคราว แล้วใส่กลับ + บันทึกให้หลัง sign in เสร็จ
- **Sign out** = ล้างตาราง (ผลอยู่ในบัญชีแล้ว ไม่ค้างบนจอเครื่องที่ใช้ร่วมกัน)
- Sign in ใช้**กติกาเดียวกับ Google Drive login**: รีโหลด / ปิดแล้วเปิดเว็บใหม่ / ไม่ใช้งาน 1 ชั่วโมง / login นานเกิน 8 ชั่วโมง
  = ออกจากระบบอัตโนมัติ (เดินไปหน้าอื่นในเว็บ, ปุ่ม Back และการกลับมาจากหน้า Sign in ยัง login อยู่) — ประวัติยังอยู่ครบ sign in ใหม่ก็เปิดได้
- ปุ่ม **My sessions** (เฉพาะคนที่ sign in): เปิด / เปลี่ยนชื่อ / ลบ session, เริ่ม session ใหม่
- รีโหลดหน้าแล้วตารางเริ่มใหม่ แต่มีปุ่ม **Continue last session** ให้ทำต่อ
- กด **Clear** = เริ่ม session ใหม่ (session เดิมยังอยู่ในประวัติ)
- ผลในประวัติมาจาก server คำนวณเองเท่านั้น แก้ไขจากหน้าเว็บไม่ได้
- ต้องตั้งค่าทั้ง Supabase และ Clerk ถ้าขาดอย่างใดอย่างหนึ่ง ส่วนนี้จะไม่แสดง เว็บใช้งานได้เหมือนเดิม

### ตั้งค่า (ครั้งเดียว)

1. **Supabase** (database)
   1. สร้าง project ที่ supabase.com
   2. **SQL Editor → New query** → วางเนื้อหาไฟล์ `server/schema.sql` → **Run**
   3. **Connect → Transaction pooler** (port 6543) → คัดลอก URI แล้วใส่รหัสผ่าน database → ใส่เป็น `DATABASE_URL`
2. **Clerk** (sign in ด้วย Google)
   1. สร้าง application ที่ clerk.com แล้วเปิดเฉพาะ **Google** ใน **User & authentication → SSO connections**
   2. **API keys** → คัดลอก `CLERK_PUBLISHABLE_KEY` และ `CLERK_SECRET_KEY`
3. ใส่ค่าทั้ง 3 ใน `.env` (เครื่องตัวเอง) และ Vercel → **Settings → Environment Variables** แล้ว **Redeploy**
4. **กัน Supabase หยุดโปรเจกต์** (แพ็กเกจฟรีจะ pause ถ้าแทบไม่มีการใช้งานราว 7 วัน): `vercel.json` ตั้ง Vercel Cron ให้เรียก
   `GET /api/cron/keepalive` วันละครั้ง (03:00–03:59 เวลาไทย) ซึ่งส่ง query เล็ก ๆ 1 ครั้ง — ใส่ `CRON_SECRET`
   (สุ่มตัวอักษร/ตัวเลข อย่างน้อย 16 ตัว) ใน Vercel → Environment Variables แล้ว Redeploy; ดูผลได้ที่ Vercel → **Schedules → Cron Jobs**

> **หมายเหตุ Clerk:** ตอนนี้ใช้คีย์โหมด Development (`pk_test_…`) ซึ่งใช้กับ `vercel.app` ได้ แต่จำกัด 100 ผู้ใช้
> และไม่เหมาะกับการใช้งานจริงระยะยาว โหมด Production ของ Clerk ต้องมี **domain ของตัวเอง**
> (เช่น domain ของ KKU ในอนาคต) — ดู [Clerk: Deploy to production](https://clerk.com/docs/guides/development/deployment/production)

## Web API

Our API runs the physics of all four experiments and returns the full result as JSON. No API key is needed.

**Base URL:** `https://virtual-doe-lab.vercel.app/api` (Node.js + Express in `server/app.js`, deployed as a Vercel serverless function)

| Method | Path | Purpose | Who can use it |
|---|---|---|---|
| GET | `/api` | API index: list of endpoints, example and link to these docs | Anyone |
| GET | `/api/health` | Check that the API is up | Anyone |
| GET | `/api/sims/:sim` | Constants a client needs to draw the scene | Anyone |
| POST | `/api/sims/:sim/simulate` | Run one experiment and get the result | Anyone |
| GET, POST | `/api/auth/*`, `/api/drive/*` | Google login and Save to Drive for our own website | Our website only (needs a Google session cookie) |
| GET | `/api/history/config` | Whether experiment history is on (+ Clerk publishable key) | Anyone |
| GET, PATCH, DELETE | `/api/history`, `/api/history/:id` | List / open / rename / delete your saved sessions | Signed-in owner only (Clerk token) |
| GET | `/api/cron/keepalive` | Daily Vercel Cron: one small query so the free Supabase project is not paused | Vercel Cron only (`CRON_SECRET`) |
| POST | `/api/history/import` | Right after sign-in, save the runs already in the table (recomputed on the server) | Signed-in user |

`:sim` is one of `parachute`, `paperHelicopter`, `waterBottleRocket`, `catapult`.

### POST /api/sims/:sim/simulate

Send the factor values as a JSON body. Numbers outside the allowed range are moved to the nearest limit; `params` in the response shows the values actually used. `mode` is optional: `"deterministic"` (default, same result every time) or `"stochastic"` (random variation of about 8% SD, like a real experiment).

| `:sim` | Input fields (unit, allowed range) | Main outputs in `summary` |
|---|---|---|
| `waterBottleRocket` | `angleDeg` (°, 1–89), `fins` (2–8), `waterVolumeML` (mL, 50–1000), `pressurePSI` (psi, 10–100) | `distance` (m), `flightTime` (s), `maxAltitude` (m), `burnoutSpeed` (m/s) |
| `catapult` | `releaseDeg` (°, 120–185), `firingDeg` (°, 90–140), `cupCm` (cm, 20–40), `pinCm` (cm, 8–24), `bungeeCm` (cm, 14–30) | `distance` (m), `flightTime` (s), `maxHeight` (m), `launchSpeed` (m/s) |
| `parachute` | `shape` (`round` / `square` / `hexagon`), `material` (`plastic` / `nylon` / `paper`), `diameterCm` (cm, 30–90), `stringCm` (cm, 20–80), `heightM` (m, 10–50) | `time` (s), `impactSpeed` (m/s), `cd` |
| `paperHelicopter` | `WL` wing length (cm, 5–15), `WW` wing width (cm, 2–6), `BL` body length (cm, 3–10), `BW` body width (cm, 1–4), `heightM` (m, 1–4) | `time` (s), `impactSpeed` (m/s), `massG` (g), `cd` |

When signed in with Clerk (`Authorization: Bearer <Clerk session token>`), add `?session=new` (or `?session=<id>`) to save the run to your history; the response then includes `history: { saved, sessionId, runNo }`. Without a valid token the run is not saved (`history: { saved: false, reason: "signed-out" }`).

Every response has `summary` (results), `trajectory` (time samples for animation), `warnings` (e.g. `waterClamped`, `maxSimTimeExceeded`) and `params` (inputs used).

**Example request**

```bash
curl -X POST https://virtual-doe-lab.vercel.app/api/sims/waterBottleRocket/simulate \
  -H "Content-Type: application/json" \
  -d '{"angleDeg":45,"fins":4,"waterVolumeML":500,"pressurePSI":60,"mode":"deterministic"}'
```

```python
import requests

r = requests.post(
    "https://virtual-doe-lab.vercel.app/api/sims/waterBottleRocket/simulate",
    json={"angleDeg": 45, "fins": 4, "waterVolumeML": 500, "pressurePSI": 60},
)
print(r.json()["summary"]["distance"])  # 55.88
```

**Example response** (recorded from the API; trajectory shortened, the full response has 373 points)

```json
{
  "summary": {
    "distance": 55.881,
    "flightTime": 3.717,
    "maxAltitude": 16.695,
    "burnoutTime": 0.072,
    "burnoutSpeed": 29.184,
    "maxSpeed": 29.184
  },
  "trajectory": [
    { "t": 0, "x": 0, "y": 0, "vx": 0, "vy": 0, "phase": 1 },
    { "t": 0.01, "x": 0.013, "y": 0.012, "vx": 2.557, "vy": 2.459, "phase": 1 }
  ],
  "warnings": [],
  "params": { "angleDeg": 45, "fins": 4, "waterVolumeML": 500, "pressurePSI": 60, "mode": "deterministic" }
}
```

### Other public endpoints

- `GET /api/health` → `{"ok": true}`
- `GET /api/sims/catapult` → `{"constants": {"PIVOT_HEIGHT_M": 0.08, "TOWER_OFFSET_M": 0.02, "ARM_LENGTH_M": 0.45, "BALL_DIAM_M": 0.04, "MIN_GAP_DEG": 5}}`

### Errors

| Status | Body | When |
|---|---|---|
| 400 | `{"error": "Invalid experiment parameters."}` | A factor is missing, not a number, or not an allowed choice |
| 404 | `{"error": "Unknown experiment."}` | `:sim` is not one of the four names |
| 404 | `{"error": "Not found."}` | The path does not exist |
| 401 | `{"error": "Not signed in to Google."}` | A Drive endpoint was called without a Google session |
| 403 | `{"error": "Origin not allowed."}` | A web page on another website sent a POST |

Programs (curl, Postman, Python, Node.js, server code) can call every public endpoint. Web pages hosted on other websites are currently blocked from POST requests by the browser origin check.

### How our website uses this API

The website has no physics code: `sims-v2/assets/api.js` sends every run to `POST {API}/api/sims/<sim>/simulate` (API = `https://virtual-doe-lab.vercel.app`) and the page draws the animation, table and charts from the JSON response.

## Called external APIs

| Function (file) | External API endpoint | Input | Output |
|---|---|---|---|
| `exchangeCode(code)` (server/google.js) | `POST https://oauth2.googleapis.com/token` (Google OAuth 2.0) | One-time login code + client ID + client secret | Access token, refresh token, expiry |
| `refreshAccessToken(refreshToken)` (server/google.js) | `POST https://oauth2.googleapis.com/token` | Refresh token | New access token |
| `revoke(token)` (server/google.js) | `POST https://oauth2.googleapis.com/revoke` | Token | Access removed (on logout) |
| `uploadFile(token, {content, filename, folderId})` (server/google.js) | `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart` (Google Drive API v3) | CSV text, file name, folder ID | File `id`, `name`, `webViewLink` |
| `createFolder(token, {name})` (server/google.js) | `POST https://www.googleapis.com/drive/v3/files` (Google Drive API v3) | Folder name | Folder `id`, `name` |
| `chooseGoogleDriveFolder(token)` (sims-v2/assets/drive.js) | Google Picker API (`https://apis.google.com/js/api.js`) | Access token + API key | Chosen folder `id`, `name` |
| `requestAuthorizationCode()` (sims-v2/assets/drive.js) | Google Identity Services (`https://accounts.google.com/gsi/client`) | Client ID, scope `drive.file` | One-time authorization code |

The app only asks for the `drive.file` scope: it can see only files it creates or the folder the user picks. The client secret stays on the server (Vercel environment variable).

## Gen AI usage and learning

We used **Claude (Anthropic)**, working in the Claude app with access to this repository and our local project folder, mainly in October 2026 for the backend and Google Drive work. Claude proposed and wrote code, tested it and explained it; the team made the decisions, set up the accounts, reviewed every change and did all git commits ourselves. *(Add any other AI tools the team used for earlier parts of the project.)*

| Task | What the AI did | What we did |
|---|---|---|
| Splitting frontend and backend | Built the Express API, moved the physics to the server, checked that 100 runs matched the old results exactly | Chose Node.js + Express and Vercel, answered its questions, reviewed the diff |
| Google login and Drive | Moved OAuth to the server, built the Save dialog (My Drive, folder, new folder, rename) | Created the client secret and API key in Google Cloud, set authorized origins |
| Temporary session rules | Implemented reset on reload, keep on page change, 1 hour idle sign-out | Defined the rules we wanted |
| Bug fixing | Fixed the broken Export CSV, duplicate code, page scroll during save | Reported bugs with screenshots, tested on our laptop |
| Git and deployment | Explained branches, pull requests and Vercel step by step | Created branches, committed, opened and merged PRs #10 and #11, deployed on Vercel |
| Documentation | Drafted the API docs from the real code and real API responses | Reviewed and edited them |

**Prompt template we followed**

1. Describe the goal and constraints, e.g. *"Separate something to the backend; you can fix the code but don't commit yet, just show me first. If anything is unclear, ask me first, don't assume."*
2. Let the AI ask clarifying questions (stack, hosting, database, scope) and answer them.
3. The AI makes and tests the change, then shows a log of every file added, changed or deleted.
4. We test it ourselves, then commit and push.

The full prompt log, with our structured prompt and the AI's answers: [Prompt log (Google Doc)](https://docs.google.com/document/d/1EaSC4KV26FwChs-1XPpNAu4GFxsH8A5OWL7__fPM2Lc/edit?usp=sharing)

Our first prompt used this template, filled in for our project:

```markdown
## Context
I'm working on a web app project. Repo: https://github.com/Sszky/VirtualDOELab
Tech stack: HTML/CSS/JavaScript frontend (no framework), planned Node.js + Express backend

Current state:
- All logic currently runs in the frontend.
- Google Drive API login is already implemented.
- The app works with simulation data ("sim data") per session.

## Task 1: Advice only (no code changes)
Should I add Google session management to this project?
My requirement: each user's sim data should be stored only temporarily, not permanently.
Please give me: your recommendation, 2-3 possible approaches with pros and cons,
and how each approach fits with my existing Drive API login.

## Task 2: Move logic from frontend to backend (code changes)
1. List which functions/modules should move to the backend, with a short reason for each.
2. List what should stay in the frontend.
3. Make the code changes in the repo.

## Constraints
- Do NOT commit or push anything to git. Show me the changes first so I can review them.
- If anything is unclear, ask me before you start. Do not make assumptions.

## Output format
- Task 1: a short written recommendation
- Task 2: the list from steps 1-2, then the changed code / diff
```

The template's four parts (context, tasks, constraints, output format) made the AI ask its questions first and keep every change reviewable before it reached git.

**Reflection** *(draft: rewrite in the team's own words)*

- Asking first saved time: requiring the AI to ask before assuming caught decisions only we could make, e.g. that the session must reset on reload.
- The AI cannot do account work: Google Cloud, Vercel and passwords were done by us, with step-by-step guidance.
- Verify, don't trust: some problems only showed up in the real browser (e.g. Google's `origin_mismatch`), so our own testing was essential.
- We learned professional git practice: feature branches, clear commit messages, stacked pull requests, and keeping secrets out of the repository.
