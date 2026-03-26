# LOCSA SARL — Gestion de Stock

Application web complète de gestion de stock pour **LOCSA SARL** (Energie · Service · Telecom — Maroc).

---

## Stack Technique

| Couche | Technologie |
|--------|------------|
| Frontend | React.js + Tailwind CSS |
| Backend | Spring Boot 3 + Spring Security |
| Base de données | PostgreSQL |
| Authentification | JWT (httpOnly cookies) |
| Email | Spring Mail + Gmail SMTP |
| Déploiement | Docker + Docker Compose |

---

## Fonctionnalités

### Authentification & Sécurité

- Login par **email + mot de passe**
- JWT stocké en cookie httpOnly
- Deux rôles : **ADMIN** et **USER**
- Routes protégées par rôle
- **Mot de passe oublié** : réinitialisation par email (lien valable 1 heure)
- Email de bienvenue automatique à la création d'un compte (identifiants inclus)

### Dashboard (ADMIN)

- Stock total, nombre de produits, alertes stock faible
- Statistiques par période : **Cette semaine / Ce mois / 3 mois / Cette année / Tout**
- Graphique d'activité (entrées / sorties) en courbe
- Dernières entrées et sorties
- Optimisé : requêtes batch (pas de N+1)

### Produits (ADMIN)

- Ajout, modification, suppression de produits
- Alerte visuelle sur stock faible (≤ 5)
- **Vue "Stock par ville"** : tableau croisé produit × ville (Tanger / Meknès / Casablanca)

### Entrées de Stock

- Saisie libre du nom produit (créé automatiquement s'il n'existe pas)
- Chaque user voit **uniquement ses propres** entrées
- ADMIN voit tout avec colonne "Enregistré par"
- Triées par date/heure décroissante

### Sorties de Stock

- Sélection produit depuis la liste (dropdown)
- Stock disponible affiché en temps réel
- Vérification stock suffisant avant enregistrement
- Isolation par user (chaque user voit ses sorties uniquement)
- Triées par date/heure décroissante

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
| Stock par ville | ❌ | ✅ |
| Entrées (ses données) | ✅ | ✅ (toutes) |
| Sorties (ses données) | ✅ | ✅ (toutes) |
| Inventaire (ses données) | ✅ | ✅ (tous) |
| Voir écart inventaire | ❌ | ✅ |
| Ajuster stock | ❌ | ✅ |
| Gestion utilisateurs | ❌ | ✅ |

---

## Lancement rapide

### Prérequis

- [Docker Desktop](https://www.docker.com/) installé et démarré

### 1. Cloner et démarrer

```bash
git clone https://github.com/AbahriHatim/LOCSA_Gestion_Stock.git
cd LOCSA_Gestion_Stock
docker compose up -d --build
```

Attendre ~30 secondes le temps que les containers démarrent.

| Service | URL |
|---------|-----|
| Frontend | [http://localhost](http://localhost) |
| Backend API | [http://localhost:8080](http://localhost:8080) |
| PostgreSQL | localhost:5432 |

### 2. Compte ADMIN par défaut

Au premier démarrage, un compte administrateur est créé automatiquement :

| Champ | Valeur |
|-------|--------|
| Email | `bk.moustapha@locsamaroc.ma` |
| Mot de passe | `Locsa@Maroc2026!` |
| Nom | `Moustapha BK` |

> Changez le mot de passe depuis l'interface après la première connexion.

### 3. Se connecter

Ouvrir [http://localhost](http://localhost) et se connecter avec les identifiants ci-dessus.

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
| POST | `/api/auth/login` | Connexion (email + password) |
| POST | `/api/auth/register` | Créer un utilisateur (ADMIN) |
| POST | `/api/auth/forgot-password` | Demande de réinitialisation |
| POST | `/api/auth/reset-password` | Réinitialiser le mot de passe |
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
| GET | `/api/dashboard/stock-by-product` | Stock par produit/ville |

---

## Structure du projet

```text
LOCSA/
├── backend/                  # Spring Boot
│   ├── src/main/java/com/locsa/stock/
│   │   ├── controller/       # REST Controllers
│   │   ├── service/          # Logique métier (EmailService, AuthService...)
│   │   ├── entity/           # Entités JPA (User, StockEntry, PasswordResetToken...)
│   │   ├── repository/       # Spring Data JPA
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── config/           # SecurityConfig, DataInitializer, GlobalExceptionHandler
│   │   └── security/         # JWT + Spring Security
│   └── Dockerfile
├── frontend/                 # React.js
│   ├── src/
│   │   ├── pages/            # Dashboard, Entrées, Sorties, Inventaire, ForgotPassword...
│   │   ├── components/       # Sidebar, Navbar, Footer...
│   │   ├── api/              # Appels Axios
│   │   └── context/          # AuthContext
│   └── Dockerfile
└── docker-compose.yml
```

---

## Contact

**LOCSA SARL** — Energie · Service · Telecom · Maroc
- Tél : +212 539 394 717
- Email : locsa@locsamaroc.ma
- Agences : Tanger · Casablanca
