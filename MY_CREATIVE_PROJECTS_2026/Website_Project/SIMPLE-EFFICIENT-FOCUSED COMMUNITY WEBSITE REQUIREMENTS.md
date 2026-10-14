

I'll create a streamlined, efficiency-focused requirements document for a basic community website. This prioritizes functionality, performance, and simplicity over visual design.

---

# 🛠️ EFFICIENCY-FOCUSED COMMUNITY WEBSITE REQUIREMENTS

## CORE PRINCIPLES

| Principle | Implementation |
|-----------|---------------|
| **Minimal Dependencies** | Fewest libraries possible |
| **Server-Side Rendering** | No SPA overhead |
| **Static Assets** | No build step complexity |
| **SQLite for Most** | Single-file database |
| **No JavaScript Required** | Progressive enhancement only |

---

## 1. TECHNOLOGY STACK (Minimal)

```
┌─────────────────────────────────────────┐
│           EFFICIENT STACK               │
├─────────────────────────────────────────┤
│  Backend: Go (stdlib) / Python (Flask)  │
│  Database: SQLite (primary)             │
│  Cache: In-memory map / SQLite          │
│  Frontend: Vanilla CSS + HTMX           │
│  Template: Go html/template / Jinja2    │
│  Server: stdlib net/http / Gunicorn     │
└─────────────────────────────────────────┘
```

| Component | Choice | Reason |
|-----------|--------|--------|
| **Language** | Go or Python | Fast, simple deployment |
| **Framework** | stdlib/Flask/Fiber | Minimal abstraction |
| **Database** | SQLite | Zero config, portable |
| **Frontend** | HTMX + vanilla CSS | 15KB total, no build |
| **Templates** | Server-rendered | No client hydration |
| **CSS** | Water.css/Pico/Milligram | Classless framework |

---

## 2. DATABASE SCHEMA (Minimal Tables)

```sql
-- 3 CORE TABLES ONLY

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,  -- bcrypt
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
    id INTEGER PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id),
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Optional: sessions table if not using JWT
CREATE TABLE sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    expires_at DATETIME
);
```

---

## 3. FILE STRUCTURE (Flat)

```
community/
├── main.go / app.py          # Single entry point
├── schema.sql                # Database setup
├── static/
│   ├── style.css            # Single stylesheet
│   ├── htmx.min.js          # 14KB, single script
│   └── favicon.ico
├── templates/
│   ├── base.html            # Layout wrapper
│   ├── index.html           # Post list
│   ├── post.html            # Single post + comments
│   ├── login.html           # Auth form
│   └── new.html             # Create post
├── db.sqlite                # Single database file
└── Dockerfile               # Optional container
```

---

## 4. ROUTES (Minimal)

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| `GET` | `/` | List posts (paginated) | No |
| `GET` | `/post/:id` | View post + comments | No |
| `GET` | `/new` | New post form | Yes |
| `POST` | `/post` | Create post | Yes |
| `POST` | `/comment` | Add comment | Yes |
| `GET` | `/login` | Login form | No |
| `POST` | `/login` | Authenticate | No |
| `POST` | `/logout` | End session | Yes |

**Total: 8 routes**

---

## 5. CORE FEATURES (Stripped Down)

### Must Have (Non-Negotiable)
- [ ] User registration/login
- [ ] Create text posts
- [ ] Comment on posts
- [ ] Pagination (20 items/page)
- [ ] Basic search (SQLite FTS)

### Explicitly Excluded
- [ ] Image uploads (use external links)
- [ ] Real-time updates (poll if needed)
- [ ] Notifications (check manually)
- [ ] User following (browse all)
- [ ] Private messages (use email)
- [ ] Admin panel (direct DB access)
- [ ] Themes (one CSS file)
- [ ] Rich text editor (textarea only)

---

## 6. HTML TEMPLATE (Base)

```html
<!-- templates/base.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ .Title }} - Community</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
</head>
<body>
    <nav>
        <a href="/"><strong>Community</strong></a>
        {{ if .User }}
            <span>Welcome, {{ .User.Username }}</span>
            <a href="/new">New Post</a>
            <button hx-post="/logout" hx-push-url="/">Logout</button>
        {{ else }}
            <a href="/login">Login</a>
        {{ end }}
    </nav>
    <hr>
    {{ template "content" . }}
</body>
</html>
```

---

## 7. DEPLOYMENT (Single Binary)

### Option A: Go Binary
```bash
# Build
go build -o community main.go

# Run
./community -port 8080 -db ./data.db

# Systemd service
[Unit]
Description=Community

[Service]
ExecStart=/opt/community/community -db /opt/community/data.db
Restart=always

[Install]
WantedBy=multi-user.target
```

### Option B: Python + Gunicorn
```bash
# requirements.txt
flask==3.0.0
gunicorn==21.2.0

# Run
gunicorn -w 2 -b 0.0.0.0:8080 app:app
```

### Option C: Docker (Minimal)
```dockerfile
FROM golang:1.21-alpine AS build
WORKDIR /app
COPY . .
RUN go build -o community main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=build /app/community .
EXPOSE 8080
CMD ["./community"]
```

---

## 8. RESOURCE USAGE TARGETS

| Metric | Target | Notes |
|--------|--------|-------|
| **Memory** | < 50MB | Single process |
| **CPU** | < 1% idle | No background jobs |
| **Storage** | < 10MB code | + SQLite growth |
| **Cold Start** | < 100ms | No dependency init |
| **Page Load** | < 200ms | Server-rendered |
| **Dependencies** | < 5 direct | Minimal attack surface |

---

## 9. SECURITY (Essential Only)

| Control | Implementation |
|---------|---------------|
| Password hashing | bcrypt cost 10 |
| CSRF tokens | Double-submit cookie |
| XSS prevention | Context-aware escaping |
| SQL injection | Parameterized queries |
| Rate limiting | In-memory map (100 req/min) |
| HTTPS | Reverse proxy (nginx/Caddy) |

---

## 10. MONITORING (Minimal)

```go
// Health check endpoint
GET /health -> {"status":"ok","db":"connected"}

// Log to stdout only
log.Printf("[ERROR] %v", err)

// No external monitoring
// Use systemd restart on failure
```

---

## 11. COMPLETE GO EXAMPLE (Reference Implementation)

```go
// main.go - Complete working example
package main

import (
    "database/sql"
    "html/template"
    "log"
    "net/http"
    "time"
    
    "github.com/mattn/go-sqlite3"
    "golang.org/x/crypto/bcrypt"
)

type Server struct {
    db   *sql.DB
    tmpl *template.Template
}

func main() {
    db, _ := sql.Open("sqlite3", "./community.db")
    defer db.Close()
    
    // Create tables
    db.Exec(schema)
    
    s := &Server{db: db}
    
    http.HandleFunc("/", s.index)
    http.HandleFunc("/post/", s.viewPost)
    http.HandleFunc("/new", s.newPost)
    http.HandleFunc("/login", s.login)
    
    log.Println("Server on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func (s *Server) index(w http.ResponseWriter, r *http.Request) {
    rows, _ := s.db.Query(`
        SELECT posts.id, title, users.username, created_at 
        FROM posts 
        JOIN users ON posts.user_id = users.id 
        ORDER BY created_at DESC 
        LIMIT 20
    `)
    defer rows.Close()
    
    var posts []Post
    for rows.Next() {
        var p Post
        rows.Scan(&p.ID, &p.Title, &p.Author, &p.Created)
        posts = append(posts, p)
    }
    
    s.tmpl.ExecuteTemplate(w, "index.html", posts)
}
```

---

## 12. HOSTING OPTIONS (Cheapest)

| Provider | Cost | Specs |
|----------|------|-------|
| **Hetzner CX11** | €3.79/mo | 1 vCPU, 2GB RAM |
| **DigitalOcean Droplet** | $4/mo | 512MB RAM |
| **Oracle Cloud Free** | $0 | 2 AMD cores, 1GB RAM |
| **Railway** | $5/mo | 512MB RAM |
| **Fly.io** | $2/mo | Shared CPU, 256MB |

---

## 13. DEVELOPMENT TIMELINE

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Day 1** | 4 hours | Database, auth, post creation |
| **Day 2** | 4 hours | Comments, pagination, search |
| **Day 3** | 2 hours | Polish, deploy, domain |

**Total: 10-12 hours to production**

---

## 14. COMPARISON: EFFICIENT vs STANDARD

| Aspect | This Approach | Standard Approach |
|--------|-------------|-------------------|
| **Dependencies** | 3-5 | 50-100 |
| **Build time** | 0s | 30-120s |
| **Bundle size** | 15KB | 200KB-2MB |
| **Memory** | 20-50MB | 200-500MB |
| **Files to deploy** | 1 binary | 1000+ files |
| **Database** | 1 file | Server + config |
| **CSS classes** | 0 (water.css) | 1000+ (Tailwind) |
| **Learning curve** | 1 day | 2-4 weeks |

---

This architecture prioritizes **simplicity, maintainability, and low resource usage** over feature richness. It's designed for small communities (< 10,000 users) where operational efficiency matters more than visual polish.