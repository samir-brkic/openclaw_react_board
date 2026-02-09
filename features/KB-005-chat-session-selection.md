# KB-005: Chat-Session Auswahl bei Task-Öffnung

## Status: 🔵 Planned

## Übersicht
Wenn ein User im Task-Modal "Im Chat öffnen" klickt und bereits Chat-Sessions für diesen Task existieren, soll ein Auswahl-Dialog erscheinen statt direkt eine neue Session zu erstellen.

## User Stories

### US-1: Bestehende Session fortsetzen
**Als** User  
**möchte ich** beim Öffnen eines Tasks im Chat eine bestehende Session auswählen können  
**um** den Kontext früherer Gespräche zu diesem Task fortzusetzen

### US-2: Neue Session bei Bedarf
**Als** User  
**möchte ich** auch die Option haben eine neue Session zu starten  
**um** bei Bedarf mit frischem Kontext zu arbeiten

### US-3: Schneller Zugriff ohne Sessions
**Als** User  
**möchte ich** bei Tasks ohne bestehende Sessions direkt in eine neue Session geleitet werden  
**um** nicht durch unnötige Dialoge aufgehalten zu werden

## Acceptance Criteria

### AC-1: Dialog bei bestehenden Sessions
- [ ] Wenn User "Im Chat öffnen" klickt UND Sessions für diesen Task existieren
- [ ] Zeige Modal-Dialog mit Liste der bestehenden Sessions
- [ ] Zeige Option "Neue Session starten" am Ende der Liste
- [ ] Sessions sind nach Datum sortiert (neueste zuerst)

### AC-2: Session-Info in Auswahl
- [ ] Jede Session zeigt: Titel, Erstelldatum, Anzahl Nachrichten
- [ ] Optional: Letzte Nachricht als Preview (gekürzt)

### AC-3: Direkter Start ohne Sessions
- [ ] Wenn keine Sessions für den Task existieren → direkt neue Session erstellen
- [ ] Kein Dialog anzeigen in diesem Fall

### AC-4: Auswahl-Verhalten
- [ ] Klick auf bestehende Session → öffnet diese Session
- [ ] Klick auf "Neue Session" → erstellt neue Session mit Task-Kontext
- [ ] Klick außerhalb/Escape → Dialog schließen, nichts passiert

## Edge Cases

### EC-1: Viele Sessions
- Bei mehr als 5 Sessions: Scrollbare Liste anzeigen
- Max-Höhe des Dialogs begrenzen

### EC-2: Session wurde gelöscht
- Wenn Session zwischen Laden und Klick gelöscht wurde → Fehlerbehandlung
- Fallback: Neue Session erstellen

### EC-3: Gleichzeitiger Zugriff
- Kein Problem da Sessions pro User isoliert sind

## UI/UX Design

### Dialog-Layout
```
┌─────────────────────────────────────────┐
│  💬 Chat für Task: [Task-Titel]         │
├─────────────────────────────────────────┤
│                                         │
│  Bestehende Sessions:                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📝 Session-Titel                │   │
│  │ 12.02.2026 • 8 Nachrichten      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📝 Ältere Session               │   │
│  │ 10.02.2026 • 3 Nachrichten      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ➕ Neue Session starten         │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

## Technische Anforderungen

### API
- Bestehender Endpoint `GET /api/projects/:id/chat/sessions` liefert bereits alle Sessions
- Sessions haben `taskId` Feld zur Filterung

### Frontend
- Neuer Modal-Dialog oder Wiederverwendung des bestehenden Modal-Systems
- Filter-Logik: `sessions.filter(s => s.taskId === taskId)`

## Abhängigkeiten
- Benötigt: KB-003 (Projekt-Chat Integration) - Chat-Infrastruktur

---

## Tech-Design (Solution Architect)

### Component-Struktur

```
Task Modal (bestehend)
└── "Im Chat öffnen" Button
    └── [NEU] Session-Auswahl Dialog (#sessionSelectModal)
        ├── Header: "💬 Chat für Task: [Titel]"
        ├── Session-Liste (scrollbar wenn > 5)
        │   └── Session-Karten (klickbar)
        │       ├── 📝 Session-Titel
        │       └── Datum • Anzahl Nachrichten
        ├── Trennlinie
        └── "➕ Neue Session starten" Button
```

### Ablauf-Logik

```
User klickt "Im Chat öffnen"
    │
    ▼
Lade Sessions für Projekt, filtere nach taskId
    │
    ├── 0 Sessions → Direkt neue Session erstellen (wie bisher)
    │
    └── 1+ Sessions → Zeige Session-Auswahl Dialog
              │
              ├── User wählt bestehende Session → Öffne diese
              ├── User wählt "Neue Session" → Erstelle neue
              └── User klickt außerhalb/ESC → Abbrechen
```

### Daten-Model

Bestehende Struktur, keine Änderungen:
```
Session:
- id
- title  
- taskId ← Filter-Kriterium
- messages[]
- createdAt
```

### Implementierung

1. **Neues Modal** `#sessionSelectModal` (HTML)
   - Gleicher Style wie `#taskModal`
   - Dynamisch befüllt mit Session-Liste

2. **Funktion `openTaskInChat()`** erweitern:
   ```
   - Sessions für Projekt laden
   - Filter: sessions.filter(s => s.taskId === currentTaskId)
   - Wenn 0: createChatSession() wie bisher
   - Wenn 1+: showSessionSelectModal(filteredSessions)
   ```

3. **Neue Funktion `showSessionSelectModal(sessions)`**:
   - Modal befüllen und anzeigen
   - Click-Handler für Session-Auswahl
   - Click-Handler für "Neue Session"

4. **Neue Funktion `selectExistingSession(sessionId)`**:
   - Chat-Tab öffnen
   - Session laden

### Dependencies

Keine neuen - alles mit bestehendem CSS/JS Pattern.

---

**Design Status:** ✅ Ready for Implementation
