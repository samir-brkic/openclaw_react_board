# KB-003: Projekt-Chat Integration mit OpenClaw

## Status: 🔵 Planned

## Übersicht

Chat-Interface im Kanban Board für direkte Kommunikation mit dem OpenClaw Agent. 
Der Agent arbeitet im Projekt-Modus mit vollem Kontext und nutzt den Agent-Workflow.

## User Stories

### Chat-Zugang
- Als User möchte ich einen "Chat" Tab im Board haben, um mit dem Agent zu kommunizieren
- Als User möchte ich aus der Task-Ansicht einen Button haben, der den Chat mit Task-Kontext öffnet
- Als User möchte ich neue Chat-Sessions starten können, um mit frischem Kontext zu arbeiten

### Kontext
- Als User möchte ich dass der Agent automatisch das aktuelle Projekt kennt
- Als User möchte ich dass der Agent den Projekt-Überblick (alle Tasks mit Status) sieht
- Als User möchte ich dass beim Öffnen aus einem Task dieser automatisch als Kontext mitgegeben wird
- Als User möchte ich Tasks im Chat erwähnen können (@KB-003) und der Agent soll den Kontext laden

### Sessions
- Als User möchte ich pro Projekt separate Chat-Sessions haben
- Als User möchte ich eine neue Session starten können (frischer Kontext)
- Als User möchte ich alte Sessions sehen und wieder öffnen können
- Als User möchte ich dass jede Session ihre eigene History hat

### Agent-Verhalten
- Als User erwarte ich dass der Agent im Projekt-Modus den Agent-Workflow nutzt
- Als User erwarte ich dass der Agent Zusammenhänge zwischen Tasks erkennt
- Als User erwarte ich formatierte Antworten (Markdown, Code-Blocks)

## Acceptance Criteria

### UI
- [ ] Neuer "Chat" Tab in der Hauptnavigation
- [ ] Chat-View mit Message-Liste und Input-Feld
- [ ] "Neue Session" Button
- [ ] Session-Switcher (Dropdown oder Liste)
- [ ] "Chat öffnen" Button in der Task-Detail-Ansicht
- [ ] Markdown-Rendering für Agent-Antworten
- [ ] Code-Blocks mit Syntax-Highlighting
- [ ] Loading-State während Agent antwortet

### Kontext-Injection
- [ ] Projekt-Info (Name, Description, Docs) wird automatisch mitgeschickt
- [ ] Projekt-Summary (alle Tasks mit ID, Titel, Status) wird mitgeschickt
- [ ] Bei Task-Kontext: vollständige Task-Details werden mitgeschickt
- [ ] Task-Mentions (@KB-003) werden erkannt und Kontext geladen

### Sessions
- [ ] Sessions werden pro Projekt gespeichert
- [ ] Jede Session hat: ID, Titel, Erstelldatum, Messages
- [ ] Neue Session startet mit leerem Chat aber vollem Projekt-Kontext
- [ ] Session-History bleibt nach Browser-Refresh erhalten
- [ ] Sessions können gelöscht werden

### API
- [ ] POST /api/projects/:id/chat/sessions - Neue Session erstellen
- [ ] GET /api/projects/:id/chat/sessions - Sessions auflisten
- [ ] GET /api/projects/:id/chat/sessions/:sessionId - Session mit Messages laden
- [ ] POST /api/projects/:id/chat/sessions/:sessionId/messages - Nachricht senden
- [ ] DELETE /api/projects/:id/chat/sessions/:sessionId - Session löschen

### OpenClaw Integration
- [ ] Messages werden an OpenClaw Gateway geroutet
- [ ] Kontext wird als System-Message mitgeschickt
- [ ] Agent-Antworten werden in Echtzeit gestreamt (oder gepollt)
- [ ] Projekt-Modus wird aktiviert (Agent nutzt Workflow)

## Edge Cases

### Session-Management
- Was passiert bei Netzwerkfehler während Senden? → Retry-Button anzeigen, Message als "failed" markieren
- Was wenn User schnell mehrere Messages sendet? → Queue, eine nach der anderen verarbeiten
- Was wenn Session sehr lang wird (>100 Messages)? → Pagination, ältere Messages nachladen

### Kontext
- Was wenn Task gelöscht wird der als Kontext dient? → Graceful handling, Hinweis anzeigen
- Was wenn Projekt-Summary sehr groß wird (>50 Tasks)? → Kompakte Summary, nur ID + Status
- Task-Mention mit ungültiger ID? → "Task nicht gefunden" Hinweis

### OpenClaw
- Was wenn Gateway nicht erreichbar? → Error-State, "Agent offline" anzeigen
- Timeout bei langer Antwort? → Timeout nach 120s, Hinweis anzeigen
- Rate-Limiting? → Hinweis "Bitte warten", Cooldown anzeigen

## Technische Anforderungen

### Frontend
- React-Komponenten: ChatView, MessageList, MessageInput, SessionSwitcher
- State-Management: Sessions + Messages im lokalen State
- Markdown-Renderer: react-markdown oder similar
- Auto-Scroll bei neuen Messages

### Backend
- Sessions in JSON-Datei speichern (wie Tasks)
- Dateistruktur: `data/chat-sessions/{projectId}/{sessionId}.json`
- OpenClaw Gateway URL aus Environment Variable

### OpenClaw Gateway
- Endpoint für Chat-Messages (zu klären: welcher Endpoint?)
- Kontext-Format definieren
- Streaming vs. Polling für Antworten

## Abhängigkeiten

- Keine Feature-Abhängigkeiten (kann unabhängig entwickelt werden)
- Benötigt: OpenClaw Gateway API-Zugang

## Offene Fragen ✅ GEKLÄRT

1. **Gateway-Endpoint:** `POST /v1/chat/completions` (OpenAI-kompatibel) ✅
2. **Auth:** Bearer Token (Gateway-Token aus Config) ✅
3. **Streaming:** SSE mit `stream: true` ✅ getestet und funktioniert

---

## Tech-Design (Solution Architect)

### OpenClaw Gateway Integration

**Endpoint:** `POST http://127.0.0.1:18789/v1/chat/completions`
**Auth:** `Authorization: Bearer <OPENCLAW_GATEWAY_TOKEN>`
**Format:** OpenAI Chat Completions API

```
Request:
{
  "model": "openclaw",
  "stream": true,
  "user": "kanban-{projectId}-{sessionId}",  // Session-Persistenz
  "messages": [
    {"role": "system", "content": "<Projekt-Kontext>"},
    {"role": "user", "content": "User-Nachricht"},
    ...
  ]
}

Response (Streaming SSE):
data: {"choices":[{"delta":{"content":"Token..."}}]}
data: {"choices":[{"delta":{"content":"..."}}]}
data: [DONE]
```

### Component-Struktur

```
App.jsx
├── Sidebar (existiert)
│   └── + "Chat" Navigation-Link
├── Routes
│   ├── Dashboard (existiert)
│   ├── Projects (existiert)
│   ├── Activities (existiert)
│   ├── ContextFiles (existiert)
│   └── + Chat (NEU)
│       └── ChatPage.jsx
│           ├── SessionSidebar
│           │   ├── SessionList
│           │   └── NewSessionButton
│           └── ChatView
│               ├── MessageList
│               │   └── Message (mit Markdown)
│               ├── TypingIndicator
│               └── MessageInput

KanbanBoard.jsx (existiert)
└── TaskDetail
    └── + "Im Chat öffnen" Button
```

### Daten-Model

**Session:**
```
Jede Chat-Session hat:
- ID (uuid)
- Projekt-ID (Zuordnung)
- Titel (automatisch aus erster Nachricht oder "Neue Session")
- Erstellt am (Timestamp)
- Messages (Array)

Gespeichert in: data/chat-sessions/{projectId}.json
```

**Message:**
```
Jede Nachricht hat:
- ID (uuid)
- Rolle (user/assistant/system)
- Inhalt (Text, Markdown)
- Timestamp
- Status (sending/sent/error)
- Task-Kontext (optional, wenn aus Task geöffnet)
```

**Kontext-Injection (System-Message):**
```
Du arbeitest im Projekt "{projektName}".

## Projekt-Beschreibung
{projektDocs}

## Tasks Übersicht
- KB-001 ✅ Mobile Responsive (done)
- KB-002 🔵 Feature-Spec Link (todo)
- KB-003 🟡 Chat Integration (in-progress)

## Aktueller Task-Fokus (falls vorhanden)
{taskDetails}

Nutze den Agent-Workflow (Requirements → Architect → Dev → QA → DevOps).
```

### Tech-Entscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| SSE Streaming | Echtzeit-Antworten, bessere UX als Polling |
| OpenAI-kompatible API | Standard-Format, einfache Integration |
| Session per `user` Feld | Gateway-native Session-Persistenz |
| JSON-Dateispeicher | Konsistent mit bestehender Tasks-Speicherung |
| react-markdown | Leichtgewichtig, gute Code-Block-Unterstützung |

### Dependencies (zu installieren)

```
- react-markdown (Markdown-Rendering)
- remark-gfm (GitHub Flavored Markdown)
- react-syntax-highlighter (Code-Highlighting)
- uuid (bereits vorhanden)
```

### API-Erweiterung (Backend)

```
Neue Endpoints in app.js:

GET  /api/projects/:id/chat/sessions
POST /api/projects/:id/chat/sessions
GET  /api/projects/:id/chat/sessions/:sessionId
POST /api/projects/:id/chat/sessions/:sessionId/messages
DELETE /api/projects/:id/chat/sessions/:sessionId

POST /api/chat/send (Proxy zu OpenClaw Gateway)
- Nimmt Message + Kontext
- Streamt SSE-Response durch
- Speichert in Session
```

### Umgebungsvariablen

```
OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=<token>
```

### Implementierungs-Reihenfolge

1. **Backend:** Chat-Session API + Gateway-Proxy
2. **Frontend:** ChatPage Grundgerüst + Routing
3. **Frontend:** MessageList + MessageInput
4. **Frontend:** Streaming-Integration
5. **Frontend:** Session-Management (Sidebar, New/Delete)
6. **Frontend:** Markdown-Rendering
7. **Integration:** "Im Chat öffnen" Button im TaskDetail
8. **Polish:** Loading-States, Error-Handling, Auto-Scroll

## Nächster Schritt

→ Frontend Developer: Implementierung starten

---

*Erstellt: 2026-02-09 | Agent: Requirements Engineer*
*Tech-Design: 2026-02-09 | Agent: Solution Architect*
