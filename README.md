# OpenClaw React Board

**Version:** 1.1.1

Multi-Project Kanban Board mit integriertem File Browser und Context-Speicher. Optimiert für OpenClaw Agent-Workflows.

## Features

- **Multi-Projekt Support** - Verwalte mehrere Projekte mit eigenem Kanban Board
- **Kanban Board** - 4 Spalten: Offen, In Arbeit, Review, Erledigt
- **Task-Branch Enforcement** - Automatischer Git-Branch pro Task (Feld `branch`)
- **Requirements Template** - Pflicht-Template für Requirements + append-only Status Updates
- **FeatureSpec Pflicht** - `featureSpec` muss bei Task-Erstellung gesetzt sein
- **File Browser** - Integrierter Datei-Explorer mit Syntax Highlighting
- **Context-Speicher** - Zentrale Ablage für Workspace-Konfiguration (AGENTS.md, SOUL.md, etc.)
- **Activity Log** - Chronologische Ansicht aller Projekt-Aktivitäten
- **Agent Status Tracking** - Verfügbar/Beschäftigt basierend auf aktiven Tasks
- **Dark Theme** - GitHub-inspiriertes Design
- **Markdown Support** - Vorschau von Markdown-Dateien

## Quick Start

### Installation

```bash
git clone https://github.com/samir-brkic/openclaw_react_board.git
cd openclaw_react_board
npm install
npm start
```

Das Board läuft dann auf: http://localhost:4000

### Clawdbot/openclaw Agent Installation

Gib deinem Agent diesen Prompt:

```
cd ~/.openclaw/workspace
git clone https://github.com/AlexPEClub/openclaw_react_board.git kanban
cd kanban && npm install && ./update-projects.js
OPENCLAW_WORKSPACE=$(cd .. && pwd) npm start
```

Detaillierte Setup-Prompts findest du in `SETUP_PROMPT.md`.

### Docker

```bash
# Mit Docker Compose
docker-compose up

# Oder direkt mit Docker
docker build -t openclaw-kanban .
docker run -p 3000:3000 -v $(pwd)/data:/app/data openclaw-kanban
```

## Konfiguration

### Environment Variables

```bash
PORT=4000                                    # Server Port (default: 4000)
OPENCLAW_WORKSPACE=/data/.openclaw/workspace # Context-Files Pfad (default: /data/.openclaw/workspace)
```

### Context Files

Der Server lädt folgende Workspace-Dateien aus dem per `OPENCLAW_WORKSPACE` konfigurierten Pfad:

| Datei | Beschreibung |
|---|---|
| `MEMORY.md` | Langzeit-Gedächtnis & Notizen |
| `AGENTS.md` | Agent-Konfiguration |
| `SOUL.md` | Persönlichkeit & Verhalten |
| `USER.md` | Nutzer-Informationen |
| `TOOLS.md` | Tool-Dokumentation |
| `IDENTITY.md` | Identität |
| `HEARTBEAT.md` | Periodische Aufgaben |

Falls der Standard-Pfad nicht passt, kann er per Umgebungsvariable überschrieben werden:

```bash
OPENCLAW_WORKSPACE=/custom/path PORT=3000 node app.js
```

## Projekt-Struktur

### Erwartete Workspace-Struktur

```
~/.openclaw/workspace/       # Standard OpenClaw Workspace
├── kanban/                  # Das Kanban Board
├── projects/                # Deine Projekte (optional)
│   ├── mein-projekt/
│   │   ├── features/           # Feature Specifications
│   │   ├── docs/            # Dokumentation
│   │   └── src/             # Source Code
│   └── anderes-projekt/
├── AGENTS.md                # Bootstrap-File (automatisch injected)
├── SOUL.md                  # Bootstrap-File (automatisch injected)
├── MEMORY.md                # Langzeit-Gedächtnis
├── IDENTITY.md              # Bootstrap-File (automatisch injected)
├── USER.md                  # Bootstrap-File (automatisch injected)
├── HEARTBEAT.md             # Bootstrap-File (automatisch injected)
└── TOOLS.md                 # Bootstrap-File (automatisch injected)
```

### Daten-Dateien

- `tasks.json` - Alle Projekte und Aufgaben
- `activity.json` - Aktivitäten-Log
- `agent-status.json` - Agent-Status (Verfügbar/Beschäftigt)

### Projekt-Schema (tasks.json)

```json
{
  "id": "proj-xxx",
  "name": "Projektname",
  "description": "Beschreibung",
  "projectPath": "/home/node/clawd/projects/mein-projekt",
  "tasks": [
    {
      "id": "task-abc12345",
      "title": "Feature Name",
      "featureSpec": "features/PROJ-1-feature-name.md",
      "branch": "task/task-abc12345-feature-name",
      "status": "todo|in-progress|review|done",
      "priority": "high|medium|low"
    }
  ]
}
```

**Wichtig**: `projectPath` muss immer ein **absoluter Pfad** sein, damit der File Browser funktioniert.

### Feature-Specs verknüpfen

Feature-Spezifikationen im `features/`-Ordner des Projekts ablegen und per **`featureSpec`** im Task verknüpfen (**Pflichtfeld**):

```
/projects/mein-projekt/features/PROJ-1-user-auth.md
```

Namenskonvention: `PROJ-{nummer}-{feature-name}.md`

## API Endpoints

```bash
# Projekte
GET    /api/projects                          # Alle Projekte abrufen
POST   /api/projects                          # Neues Projekt erstellen
GET    /api/projects/:projectId               # Einzelnes Projekt

# Tasks
POST   /api/projects/:projectId/tasks         # Task erstellen (featureSpec Pflicht)
PUT    /api/projects/:projectId/tasks/:taskId # Task aktualisieren (append-only für description)
DELETE /api/projects/:projectId/tasks/:taskId # Task löschen

# Context & Files
GET    /api/context-files                     # Context-Dateien auflisten
GET    /api/files/:projectId/*                # File Browser API

# Activity
GET    /api/activity                          # Activity Log
```

### Beispiele

```bash
# Projekt mit projectPath erstellen
curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mein Projekt",
    "description": "Beschreibung",
    "projectPath": "/home/node/clawd/projects/mein-projekt"
  }'

# Task Status ändern (append-only Update)
curl -X PUT http://localhost:4000/api/projects/{projectId}/tasks/{taskId} \
  -H "Content-Type: application/json" \
  -d '{"description": "- ✅ Implementiert XYZ\n- 🔄 Offenes Thema ABC"}'

# Task mit featureSpec erstellen (Pflicht)
curl -X POST http://localhost:4000/api/projects/{projectId}/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "User Authentication",
    "featureSpec": "features/PROJ-1-user-auth.md",
    "status": "todo",
    "priority": "high"
  }'
```

## Troubleshooting

**Server startet nicht?**
```bash
# Port prüfen
lsof -i :3000
# Process beenden falls belegt
kill -9 <PID>
```

**File Browser zeigt keine Dateien?**
- `projectPath` in tasks.json prüfen — muss ein absoluter Pfad sein
- `update-projects.js` ausführen um Pfade nachträglich zu setzen

**Context Files fehlen?**
- Dateien müssen im per `OPENCLAW_WORKSPACE` konfigurierten Pfad liegen
- Prüfen: `curl http://localhost:3000/api/context-files`

**Status wird nicht aktualisiert?**
- `agent-status.json` muss im kanban-Ordner liegen und schreibbar sein

## Contributing

Contributions sind willkommen! Siehe [CONTRIBUTING.md](CONTRIBUTING.md) für Details.

## License

MIT License — siehe [LICENSE](LICENSE).

---

Entwickelt für die OpenClaw Community.
