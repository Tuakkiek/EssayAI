# Cách Chạy Dự Án Essay AI Platform

Dự án này gồm 2 phần chính:

1. **Backend API** - Node.js/Express server
2. **Mobile App** - React Native/Expo app

---

## Yêu Cầu Trước Khi Chạy

- Node.js (v18+)
- npm hoặc yarn
- MongoDB (local hoặc cloud như MongoDB Atlas)
- Expo CLI (cho mobile app)

---

## Bước 1: Cấu Hình Backend

### 1.1. Cài đặt dependencies

```bash
cd backend-api
npm install
```

### 1.2. Tạo file .env

Tạo file `.env` trong thư mục `backend-api` với các biến môi trường cần thiết:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB (Thay bằng URI của bạn)
MONGODB_URI=mongodb://localhost:27017/essay-ai
# Hoặc dùng MongoDB Atlas: mongodb+srv://<username>:<password>@cluster.mongodb.net/essay-ai

# JWT
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Google AI (Gemini) - Optional nhưng cần cho AI scoring
GOOGLE_AI_API_KEY=your_google_ai_api_key
GOOGLE_AI_MODEL=gemini-2.0-flash

# Cloudinary - Optional cho image upload
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Sepay - Optional cho payment
SEPAY_API_TOKEN=your_sepay_token
SEPAY_BANK_ACCOUNT=70740011223344
SEPAY_BANK_ID=MBBank
SEPAY_ACCOUNT_NAME=YOUR_ACCOUNT_NAME
```

### 1.3. Chạy Backend

```bash
npm run dev
```

Backend sẽ chạy tại `http://localhost:5000`

---

## Bước 2: Chạy Mobile App (Expo)

### 2.1. Cài đặt dependencies

```bash
cd mobile-app
npm install
```

### 2.2. Cấu hình API URL

Kiểm tra file `mobile-app/src/config/api.ts` và đảm bảo API URL trỏ đến backend của bạn:

```typescript
// Ví dụ config
export const API_BASE_URL = "http://10.0.2.2:5000"; // Android Emulator
// Hoặc 'http://localhost:5000' cho iOS Simulator
```

### 2.3. Chạy Mobile App

```bash
npm start
```

Sau đó:

- Nhấn **'a'** để mở trên Android Emulator
- Nhấn **'i'** để mở trên iOS Simulator
- Hoặc quét QR code bằng điện thoại thật (cùng mạng WiFi)

---

## Các Scripts Có Sẵn

### Backend

| Command             | Mô tả                                  |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Chạy development server với hot reload |
| `npm run build`     | Build TypeScript sang JavaScript       |
| `npm start`         | Chạy production server                 |
| `npm run typecheck` | Kiểm tra TypeScript errors             |

### Mobile App

| Command           | Mô tả                     |
| ----------------- | ------------------------- |
| `npm start`       | Khởi động Expo dev server |
| `npm run android` | Chạy trên Android         |
| `npm run ios`     | Chạy trên iOS             |
| `npm run web`     | Chạy trên web             |

---

## Troubleshooting

### Lỗi kết nối MongoDB

- Đảm bảo MongoDB đang chạy
- Kiểm tra `MONGODB_URI` trong .env

### Lỗi kết nối API từ mobile

- Android Emulator dùng `10.0.2.2` thay vì `localhost`
- iOS Simulator dùng `localhost`
- Thêm `http://` prefix

### Lỗi Expo

- Chạy `npx expo install` để cài đặt lại dependencies tương thích
