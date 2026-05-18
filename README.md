# Schedina — Frontend

Frontend React per la piattaforma **[Schedina](https://github.com/zaknafein83/schedina)**, un sistema di concorsi di pronostici sportivi in stile Totocalcio.

> Questo repository contiene **solo il frontend**. Per il backend (Quarkus + PostgreSQL) e la documentazione completa del progetto, vedi [zaknafein83/schedina](https://github.com/zaknafein83/schedina).

---

## Stack

| Layer | Tecnologia |
|-------|-----------|
| Framework | React 18 |
| Bundler / dev server | Vite 5 |
| Routing | React Router v6 |
| Data fetching | TanStack Query v5 |
| Form | React Hook Form |
| Styling | Tailwind CSS v3 |
| HTTP client | Axios |
| Deploy | Docker + nginx |

---

## Struttura

```
src/
├── api/
│   └── client.js          Axios + tutti gli endpoint backend
├── context/
│   └── AuthContext.jsx    Stato auth (token, user, login/logout)
├── components/
│   ├── Layout.jsx         Layout utente
│   ├── AdminLayout.jsx    Layout area admin
│   ├── ProtectedRoute.jsx Guard per rotte autenticate
│   └── ui/                Primitivi UI riutilizzabili
└── pages/
    ├── auth/              Login, Register, ForgotPassword, ResetPassword
    ├── user/              Contests, ContestDetail, MyCoupons, Notifications
    └── admin/             Dashboard, Contests, Leagues, Teams, Rules, Users
```

---

## Avvio in sviluppo

### Prerequisiti
- Node.js 20+
- Backend Schedina in esecuzione su `http://localhost:8080`

### Setup

```bash
npm install
npm run dev
```

Il dev server parte su `http://localhost:5173` con HMR attivo. Le richieste API vengono inoltrate al backend secondo la variabile `VITE_API_URL`.

---

## Variabili d'ambiente

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8080` | URL base del backend |

In sviluppo crea un file `.env.local` (ignorato da git):

```env
VITE_API_URL=http://localhost:8080
```

In produzione, quando il frontend è servito dietro lo stesso reverse proxy del backend, si usa un path relativo:

```env
VITE_API_URL=/api
```

---

## Build di produzione

```bash
npm run build      # output in dist/
npm run preview    # serve dist/ in locale per verifica
```

---

## Deploy con Docker

```bash
docker build -t schedina-frontend .
docker run -d -p 3000:80 schedina-frontend
```

Il container espone l'app su porta 80 servita da nginx. Per il deploy completo (backend + frontend + reverse proxy) vedi il [README del backend](https://github.com/zaknafein83/schedina#deploy-con-docker-compose-produzione).

---

## Licenza

[MIT](LICENSE)
