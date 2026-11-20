# 🌿 Plant Care and Nursery Management System – Frontend

## 📌 Overview

The Plant Care and Nursery Management System Frontend is a modern, responsive web application developed to provide an interactive platform for customers and administrators to manage nursery-related activities.

The frontend is developed using React.js and TypeScript, with Vite as the development and build tool.

It communicates with the backend REST API to manage users, plants, products, orders, payments, suppliers, and inventory operations.

## 🛠️ Technologies Used

- React.js
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router DOM
- HTML5
- CSS3

## ✨ Main Features

### 🏠 Home Page
- Modern landing page.
- Hero section.
- Featured plants.
- New arrivals.
- Plant categories.
- Plant care tips.

### 👤 User Authentication
- User registration.
- User login.
- Email verification.
- Forgot password functionality.
- Access token management.
- Refresh token handling.
- Protected routes.

### 🌱 Plant Management
- View available plants.
- Browse plant information.
- View plant details.
- Plant category management.

### 🛒 Product Management
- View available products.
- Product information management.
- Product image display.
- Product management functionality.

### 📦 Order Management
- Place orders.
- View customer orders.
- Order history.
- Admin order management.
- Order image display.

### 🏪 Inventory Management
- Internal stock management.
- Stock purchase management.
- Stock usage management.
- Product sales management.

### 🤝 Supplier Management
- View supplier information.
- Manage supplier records.

### 👑 Super Admin Management
- User management.
- Admin management.
- Super Admin dashboard.
- User role management.

### 💳 Payment Management
- Payment interface.
- Demo payment functionality.
- Payment-related order handling.

## 🏗️ Project Structure

```text
plantcare-frontend/
│
├── public/
│
├── src/
│   ├── assets/
│   │   ├── img/
│   │   ├── hero.png
│   │   └── logo.png
│   │
│   ├── component/
│   │   ├── common/
│   │   ├── home/
│   │   ├── managementCenter/
│   │   ├── order/
│   │   ├── plant/
│   │   └── superAdmin/
│   │
│   ├── context/
│   │   └── AuthContext.tsx
│   │
│   ├── data/
│   │   ├── internalStock.ts
│   │   ├── internalStockUsage.ts
│   │   ├── orders.ts
│   │   ├── plants.ts
│   │   ├── plantType.ts
│   │   ├── product.ts
│   │   ├── productSales.ts
│   │   ├── stock.ts
│   │   ├── stockPurchase.ts
│   │   └── suppliers.ts
│   │
│   ├── hooks/
│   │   └── useAuth.ts
│   │
│   ├── pages/
│   │   ├── admin.tsx
│   │   ├── adminOrders.tsx
│   │   ├── demoPayment.tsx
│   │   ├── forgotPassword.tsx
│   │   ├── home.tsx
│   │   ├── login.tsx
│   │   ├── managementCenter.tsx
│   │   ├── myOrders.tsx
│   │   ├── orders.tsx
│   │   ├── plants.tsx
│   │   ├── plantType.tsx
│   │   ├── product.tsx
│   │   ├── register.tsx
│   │   ├── stock.tsx
│   │   ├── superAdmin.tsx
│   │   ├── suppliers.tsx
│   │   └── verifyEmail.tsx
│   │
│   ├── router/
│   │   └── index.tsx
│   │
│   ├── service/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── user.ts
│   │
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
│
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_FRONTEND_GITHUB_REPOSITORY_URL
```

Navigate to the frontend project directory:

```bash
cd plantcare-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the frontend root directory.

Add the backend API URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

For production deployment, configure `VITE_API_BASE_URL` with the deployed backend API URL.

### 4. Run the Development Server

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

## 🔗 Backend Integration

The frontend communicates with the backend using Axios.

The API service handles:

- API requests.
- Authentication headers.
- Access token management.
- Refresh token handling.
- Automatic retry after token refresh.
- API error handling.

Make sure the backend server is running before using the application.

## 🧪 Build for Production

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build application for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## 🚀 Deployment

The frontend can be deployed using platforms such as Vercel.

For production deployment:

1. Push the frontend source code to GitHub.
2. Import the GitHub repository into Vercel.
3. Configure the build settings.
4. Add the `VITE_API_BASE_URL` environment variable.
5. Deploy the application.

## 🔒 Security

- Protected routes.
- JWT-based authentication.
- Role-based access handling.
- Authentication context.
- Secure API communication.
- Access token refresh handling.

## 👩‍💻 Author

Developed as part of the Plant Care and Nursery Management System project.

## 📄 License

This project is developed for educational and software development purposes.

---

**Plant Care and Nursery Management System** 🌿

*Growing Better. Managing Smarter.*
