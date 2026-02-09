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

## Offene Fragen

1. **Gateway-Endpoint:** Welcher OpenClaw-Endpoint nimmt Chat-Messages entgegen?
2. **Auth:** Brauchen wir einen API-Key für Gateway-Zugriff?
3. **Streaming:** Unterstützt das Gateway SSE/WebSocket für Streaming-Antworten?

## Nächster Schritt

→ Solution Architect: Tech-Design erstellen, Gateway-Integration klären

---

*Erstellt: 2026-02-09 | Agent: Requirements Engineer*
