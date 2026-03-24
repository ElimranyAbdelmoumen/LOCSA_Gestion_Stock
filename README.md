# LOCSA SARL — Gestion de Stock

Application web complète de gestion de stock pour **LOCSA SARL** (Energie · Service · Telecom — Maroc).

---

## Stack Technique

| Couche | Technologie |
|--------|------------|
| Frontend | React.js + Tailwind CSS |
| Backend | Spring Boot 3 + Spring Security |
| Base de données | PostgreSQL |
| Authentification | JWT |
| Déploiement | Docker + Docker Compose |

---

## Fonctionnalités

### Authentification & Rôles

- Login sécurisé avec JWT
- Deux rôles : **ADMIN** et **USER**
- Routes protégées par rôle

### Dashboard (ADMIN)

- Stock total, nombre de produits, alertes stock faible
- Statistiques par période : **Cette semaine / Ce mois / 3 mois / Cette année / Tout**
- Graphique d'activité (entrées / sorties) en courbe
- Dernières entrées et sorties

### Produits (ADMIN)

- Ajout, modification, suppression de produits
- Alerte visuelle sur stock faible (≤ 5)

### Entrées de Stock

- Saisie libre du nom produit (créé automatiquement s'il n'existe pas)
- Chaque user voit **uniquement ses propres** entrées
- ADMIN voit tout avec colonne "Enregistré par"

### Sorties de Stock

- Sélection produit depuis la liste (dropdown)
- Stock disponible affiché en temps réel
- Vérification stock suffisant avant enregistrement
- Isolation par user (chaque user voit ses sorties uniquement)

### Inventaire

- Sélection produit depuis la liste réelle
- Saisie de la quantité physique comptée
- Calcul automatique de l'écart (ADMIN uniquement)
- **USER** : ne voit pas la quantité système, ni l'écart (fiabilité du comptage)
- Ajustement du stock avec motif obligatoire (ADMIN uniquement)
- Historique isolé par user

### Multi-villes

- Villes supportées : **Meknès**, **Tanger**, **Casablanca**
- Chaque USER est assigné à une ville
- ADMIN a accès à toutes les villes

---

## Permissions par rôle

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
| Gestion sites | ❌ | ✅ |

---

## Lancement rapide

### Prérequis

- [Docker Desktop](https://www.docker.com/) installé et démarré

### 1. Cloner et démarrer

```bash
git clone https://github.com/ElimranyAbdelmoumen/LOCSA_Gestion_Stock.git
cd LOCSA_Gestion_Stock
docker compose up -d --build
```

Attendre ~30 secondes le temps que les containers démarrent.

| Service | URL |
|---------|-----|
| Frontend | [http://localhost](http://localhost) |
| Backend API | [http://localhost:8080](http://localhost:8080) |
| PostgreSQL | localhost:5432 |

### 2. Créer le premier compte ADMIN

> A faire **une seule fois** après le premier démarrage.

**Linux / Mac / Git Bash :**

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123","role":"ADMIN"}'
```

**Windows CMD :**

```cmd
curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"Admin@123\",\"role\":\"ADMIN\"}"
```

**Windows PowerShell :**

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"Admin@123","role":"ADMIN"}'
```

**Ou directement via Docker (fonctionne partout) :**

```bash
docker exec locsa_postgres psql -U locsa_user -d locsa_db -c "INSERT INTO users (username, password, role, active) VALUES ('admin', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', true);"
```

> Cette commande crée `admin` avec le mot de passe `password`. Changez-le depuis l'interface après connexion.

### 3. Se connecter

Ouvrir [http://localhost](http://localhost) et se connecter avec les credentials créés à l'étape 2.

---

## Mise à jour de l'application

Pour récupérer la dernière version et redéployer :

```bash
git pull origin main
docker compose up -d --build
```

---

## API REST

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
| GET | `/api/sites` | Liste sites |
| POST | `/api/sites` | Créer site (ADMIN) |

---

## Structure du projet

```text
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
├── deploy/
│   └── update.sh             # Script de mise à jour EC2
└── docker-compose.yml
```

---

## Développé par

**LOCSA SARL** — Energie · Service · Telecom · Maroc
