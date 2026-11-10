# 🌍 Three.js Katta Dunyo & 3D Otishma O'yini (Ultra Graphics Edition)

Three.js va WebGL texnologiyalari yordamida yaratilgan **Ulkan 3D Ochiq Dunyo**, to'laqonli **FPS / TPS Otishma Jang Rejimi (Shooter Game)** va **Kinematografik Ultra Grafika (Post-Processing & PBR)**.

---

## 🌟 Kengaytirilgan Kinematografik Grafika (Ultra Graphics)

1. **Kinematografik Post-Processing Pipeline**:
   - ✨ **UnrealBloomPass**: Lazerlar, quyosh nurlari, sehrli kristallar, qizil dron ko'zlari va portlashlarga neon jilo va yorug'lik taratish effekti beradi.
   - 🔍 **FXAA Antialiasing**: Ob'ektlarning barcha qirralarini silliqlashtirib, piksellanishni butunlay yo'qotadi.
   - 🎨 **ACES Filmic ToneMapping**: Kinolardagidek chuqur kontrast, yorug'lik balansi va ranglar korreksiyasi.

2. **Ultra-aniqlikdagi PBR va Relyef Detallari**:
   - Tosh, tog' va sohil uchun protsedural **Normal Map** va **Roughness Map** (HTML5 Canvas orqali xotirada generatsiya qilinadi).
   - Qiyaliklar (slope) va balandlikka qarab silliq o'tuvchi ko'p qatlamli biom ranglari.
   - 300x300 yuqori zichlikdagi relyef geometriyasi.

3. **Gidrodinamik Okean va Suv sathi**:
   - Ikki xil yo'nalishli to'lqin harakati va dinamik siljuvchi Normal Map.
   - Quyosh nurining suvda yaltirashi (*Specular glints*) va shaffof ko'k suv chuqurligi (*Transmission & IOR 1.333*).

4. **Atmosfera, 4K Soyalar va Quyosh nuri**:
   - **4096 x 4096 (4K)** yumshoq PCF soyalar (*PCFSoftShadowMap*).
   - Soya kamerasi o'yinchini doimo kuzatib yuradi, shuning uchun hatto ulkan dunyoda ham o'yinchi atrofidagi barcha daraxtlar va toshlarning soyalari nihoyatda tiniq ko'rinadi.
   - Quyosh atrofida yorqin nurlar guldastasi (*Sun Corona Flare*).
   - Havoda suzuvchi oltin chang va chang zarralari (*Volumetric Dust Motes*).
   - Somon Yo'li galaktikasi va 4500 ta miltillovchi yulduzlar.

5. **Dinamik Yoritishga Ega O'qlar va Portlashlar**:
   - Har bir otilgan plazma o'qi atrofidagi relyef va daraxtlarni real vaqtda yoritib uchadi (*Dynamic Bullet PointLights*).
   - Dushman portlaganda 3D zarba to'lqini (*Expanding Shockwave Ring*) va 500 tagacha fizika bilan sakrovchi olovli uchqunlar.

6. **Grafika Sifatini O'zgartirish (G tugmasi)**:
   - **ULTRA**: Bloom + FXAA + 4K Soyalar + Maksimal zarralar.
   - **HIGH**: Bloom + Standart soyalar.
   - **MEDIUM**: Kuchli bo'lmagan noutbuklar uchun maksimal FPS rejimi.

---

## 💥 Otishma O'yin Rejimi

1. **3 Xil Qurollar Arsenali**:
   - ⚡ **Plazma Avtomat (Blaster)** - `[1]` tezkor o't ochish, 32 talik magazin.
   - 🎯 **Kvant Reylgan (Railgun)** - `[2]` snayper reylgani (130 zarar).
   - 💥 **Tarqoq Shotgun (Scatter)** - `[3]` 6 ta o'q sochuvchi yaqin jang quroli.
   - **Sichqonchaning o'ng tugmasi**: Nishonga olish (ADS zoom).
   - **`R` tugmasi**: Qayta o'qlash (Reload).

2. **Sun'iy Intellektli Jangovar Dronlar (AI Enemy Drones)**:
   - O'yinchini payqash, quvish va qizil lazerlar bilan hujum qilish.
   - 3D Jon ko'rsatkichlari (*Healthbar*).
   - Halok bo'lganda tibbiy to'plamlar (HP) va o'q-dorilar tushadi.

3. **To'lqinlar (Wave Survival) va Statistika**:
   - To'lqinlar (Wave 1, 2, 3...) va to'plangan ochkolar hisobi.

---

## 🎮 Boshqaruv Tugmalari

| Tugma | Vazifasi |
|---|---|
| **Sichqoncha Chap Click** | O'q otish (*Shoot*) |
| **Sichqoncha O'ng Click** | Nishonga olish (*Aim / ADS*) |
| **1, 2, 3** yoki **G'ildirak** | Qurol tanlash (Plazma, Reylgan, Shotgun) |
| **R** | Qayta o'qlash (*Reload*) |
| **G** | **Grafika sifatini almashtirish** (ULTRA / HIGH / MEDIUM) |
| **B** | Otishma rejimini yoqish / o'chirish |
| **W, A, S, D** | Harakatlanish |
| **Shift** | Tez yugurish (*Sprint*) |
| **Space** | Sakrash / Parvozda yuqoriga |
| **C** | Cho'qqayish / Parvozda pastga |
| **F** | Uchish (Fly) / Piyoda yurish |
| **V** | 1-shaxs va 3-shaxs kamerasini almashtirish |
| **T** | Kun / Tun vaqtini tez aylantirish |

---

## 🚀 Ishga Tushirish:

1. Papkadagi **`start.bat`** fayliga 2 marta bosing (yoki `npm run dev`).
2. Brauzeringizda kinematografik grafikadan rohatlaning!
