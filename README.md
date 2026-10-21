# Virtual DOE Lab

ห้องปฏิบัติการเสมือนสำหรับฝึก **การออกแบบการทดลอง (Design of Experiments, DOE)** ในวิชาวิศวกรรมอุตสาหการ
ผู้ใช้ปรับค่าปัจจัยของการทดลอง กดทดลองเพื่อดูแบบจำลองทางฟิสิกส์ทำงานแบบเคลื่อนไหว บันทึกผลลงตาราง
แล้ววิเคราะห์ผลด้วยกราฟ Main Effects / Interaction Plot ได้ในเบราว์เซอร์ทันที

ประกอบด้วยการทดลอง 4 ชุด: **Parachute**, **Paper Helicopter**, **Water Bottle Rocket** และ **Catapult**

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
│  └─ dev.js                รันเว็บ + API บนเครื่องตัวเอง (npm run dev)
├─ api/index.js             จุดเข้าของ Vercel (ส่งต่อไปที่ server/app.js)
├─ vercel.json              ตั้งค่า deploy บน Vercel
└─ .env.example             ตัวอย่าง environment variables
```

เวอร์ชันแรกของแต่ละการทดลองและหน้าหลักเดิมถูกลบออกจาก repo แล้ว ยังเปิดดูได้ในประวัติ commit ก่อน `d19e163`

## การทดลองและปัจจัย

| การทดลอง | ปัจจัยที่ปรับได้ | ค่าคงที่ที่ปรับได้ | ผลตอบ (Response) |
|---|---|---|---|
| Parachute | A รูปทรงร่ม, B วัสดุ, C เส้นผ่านศูนย์กลางร่ม (30–90 cm), D ความยาวเชือก (20–80 cm) | ความสูงที่ปล่อย (10–50 m) | เวลาตก (s) |
| Paper Helicopter | A ความยาวใบพัด (5–15 cm), B ความกว้างใบพัด (2–6 cm), C ความยาวลำตัว (3–10 cm), D ความกว้างลำตัว (1–4 cm) | ความสูงที่ปล่อย (1–4 m) | เวลาลอยตัว (s) |
| Water Bottle Rocket | A มุมยิง (1–89°), B จำนวนครีบ (2–8), C ปริมาณน้ำ (50–1000 mL), D แรงดัน (10–100 psi) | – | ระยะทาง (m) |
| Catapult | A มุมง้าง (120–185°), B มุมยิง (90–140°), C ตำแหน่งถ้วย (20–40 cm), D ตำแหน่งหมุด (8–24 cm), E ตำแหน่งหนังยาง (14–30 cm) | – | ระยะทาง (m) |

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
