# 📦 LOCSA SARL — Gestion de Stock

Application web complète de gestion de stock pour **LOCSA SARL** (Energie · Service · Telecom — Maroc).

---

## 🚀 Stack Technique

| Couche | Technologie |
|--------|------------|
| Frontend | React.js + Tailwind CSS |
| Backend | Spring Boot 3 + Spring Security |
| Base de données | PostgreSQL |
| Authentification | JWT |
| Déploiement | Docker + Docker Compose |

---

## ✨ Fonctionnalités

### 🔐 Authentification & Rôles
- Login sécurisé avec JWT
- Deux rôles : **ADMIN** et **USER**
- Routes protégées par rôle

### 📊 Dashboard (ADMIN)
- Stock total, nombre de produits, alertes stock faible
- Statistiques par période : **Cette semaine / Ce mois / 3 mois / Cette année / Tout**
- Graphique d'activité (entrées / sorties) en courbe
- Dernières entrées et sorties

### 📦 Produits (ADMIN)
- Ajout, modification, suppression de produits
- Alerte visuelle sur stock faible (≤ 5)

### 📥 Entrées de Stock
- Saisie libre du nom produit (créé automatiquement s'il n'existe pas)
- Chaque user voit **uniquement ses propres** entrées
- ADMIN voit tout avec colonne "Enregistré par"

### 📤 Sorties de Stock
- Sélection produit depuis la liste (dropdown)
- Stock disponible affiché en temps réel
- Vérification stock suffisant avant enregistrement
- Isolation par user (chaque user voit ses sorties uniquement)

### 📋 Inventaire
- Sélection produit depuis la liste réelle
- Saisie de la quantité physique comptée
- Calcul automatique de l'écart (ADMIN uniquement)
- **USER** : ne voit pas la quantité système, ni l'écart (fiabilité du comptage)
- Ajustement du stock avec motif obligatoire (ADMIN uniquement)
- Historique isolé par user

---

## 🔐 Permissions par rôle

| Fonctionnalité | USER | ADMIN |
|----------------|------|-------|
| Dashboard | ❌ | ✅ |
| Produits | ❌ | ✅ |
| Entrées (ses données) | ✅ | ✅ (toutes) |
| Sorties (ses données) | ✅ | ✅ (toutes) |
| Inventaire (ses données) | ✅ | ✅ (tous) |
| Voir écart inventaire | ❌ | ✅ |
| Ajuster stock | ❌ | ✅ |
| Gestion utilisateurs | ❌ | ✅ |

---

## ⚡ Lancement rapide

### Prérequis
- [Docker](https://www.docker.com/) + Docker Compose

### Démarrer l'application

```bash
git clone https://github.com/ElimranyAbdelmoumen/LOCSA_Gestion_Stock.git
cd LOCSA_Gestion_Stock
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

### Créer le premier compte ADMIN

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"ADMIN"}'
```

---

## 🌐 API REST

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/register` | Inscription |
| GET | `/api/products` | Liste produits |
| POST | `/api/products` | Créer produit |
| GET | `/api/entries` | Liste entrées |
| POST | `/api/entries` | Créer entrée |
| GET | `/api/exits` | Liste sorties |
| POST | `/api/exits` | Créer sortie |
| GET | `/api/inventory` | Liste inventaires |
| POST | `/api/inventory` | Créer inventaire |
| POST | `/api/inventory/{id}/adjust` | Ajuster stock (ADMIN) |
| GET | `/api/dashboard` | KPIs globaux |
| GET | `/api/dashboard/stats?period=` | Stats par période |

---

## 🗂️ Structure du projet

```
LOCSA/
├── backend/                  # Spring Boot
│   ├── src/main/java/com/locsa/stock/
│   │   ├── controller/       # REST Controllers
│   │   ├── service/          # Logique métier
│   │   ├── entity/           # Entités JPA
│   │   ├── repository/       # Spring Data JPA
│   │   ├── dto/              # Data Transfer Objects
│   │   └── security/         # JWT + Spring Security
│   └── Dockerfile
├── frontend/                 # React.js
│   ├── src/
│   │   ├── pages/            # Dashboard, Entrées, Sorties, Inventaire...
│   │   ├── components/       # Sidebar, Navbar, Footer...
│   │   ├── api/              # Appels Axios
│   │   └── context/          # AuthContext
│   └── Dockerfile
└── docker-compose.yml
```

---

## 👥 Développé par

**LOCSA SARL** — Energie · Service · Telecom · Maroc

---

> Application développée avec ❤️ pour la gestion interne du stock de LOCSA SARL.
