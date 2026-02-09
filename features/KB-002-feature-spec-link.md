# KB-002: Feature-Spec Verknüpfung im Task

## Status: ✅ Implementiert (QA Testing erforderlich)

## Übersicht

Tasks sollen eine sichtbare Verknüpfung zur Feature-Spec Datei haben. Das Feld `featureFile` existierte bereits in der API und wird jetzt vollständig im UI unterstützt.

---

## User Stories

### Als Joe (Agent)
- ✅ Als Agent möchte ich beim Laden eines Tasks automatisch die verknüpfte Feature-Spec sehen, um den vollen Kontext zu haben
- ✅ Als Agent möchte ich wissen welche Datei ich updaten muss wenn sich Requirements ändern

### Als Samir (User)
- ✅ Als User möchte ich im Task-Detail die Feature-Spec lesen können ohne den File Browser zu öffnen
- ✅ Als User möchte ich beim Erstellen eines Tasks eine Feature-Spec Datei verknüpfen können
- ✅ Als User möchte ich mit einem Klick zur Feature-Spec navigieren können

---

## Acceptance Criteria

### Task-Detail Ansicht
- [x] Feld "Feature-Spec" wird angezeigt (falls vorhanden)
- [x] Klick auf Dateiname öffnet File Browser mit dieser Datei
- [x] Inhalt der Feature-Spec wird im Editor angezeigt (wenn Feature-File verknüpft)

### Task bearbeiten
- [x] Input-Feld für `featureFile` Pfad
- [x] File-Picker aus dem Projekt's `features/` Ordner ("Auswählen..." Button)
- [x] Validierung: Bei nicht-existierender Datei wird Warnung angezeigt

### Task erstellen
- [x] Optional: Feature-Spec Pfad angeben
- [ ] Auto-Suggest basierend auf Task-Titel (nicht implementiert - nice-to-have)

---

## Edge Cases

- ✅ Was wenn Feature-Spec Datei nicht existiert? → Warnung "⚠ Datei nicht gefunden" in rot
- ✅ Was wenn Pfad falsch ist? → Fehlermeldung "Datei nicht gefunden"
- ✅ Was wenn Task keinen Feature-Spec hat? → Feld leer, Status "(nicht verknüpft)"

---

## Implementierte Funktionen

### Frontend (index.html)
1. **Feature-File Input im Task Modal**
   - Input-Feld mit Placeholder
   - Status-Anzeige (✓ verknüpft / nicht verknüpft / ⚠ nicht gefunden)
   - "Öffnen" Button (nur sichtbar wenn Datei verknüpft)
   - "Auswählen..." Button zum Durchsuchen des features/ Ordners

2. **Klickbares Feature-File auf dem Board**
   - Tasks mit Feature-File zeigen `📄 features/...` Link
   - Klick öffnet File Browser und lädt Datei im Editor

3. **Funktionen**
   - `openFeatureFileDirectly()` - Öffnet Feature-Datei vom Board aus
   - `openFeatureInFileBrowser()` - Öffnet Feature-Datei aus dem Modal
   - `pickFeatureFile()` - Listet .md Dateien aus features/ Ordner

### Backend (app.js)
- `POST /api/projects/:projectId/tasks` - Speichert `featureFile`
- `PUT /api/projects/:projectId/tasks/:taskId` - Aktualisiert `featureFile`
- `GET /api/projects/:id/files/*` - Lädt Dateiinhalt für Editor

---

## Bug-Fix (2026-02-09)

**Problem:** Feature-File Funktionen verwendeten falsches API-Format `/api/files?path=...`
**Lösung:** API-Aufrufe korrigiert auf `/api/projects/:id/files/...`

Geänderte Dateien:
- `kanban/index.html` - 3 API-Aufrufe korrigiert

---

## QA Testing Checklist

- [ ] Task mit Feature-File öffnen → Feature-Inhalt wird angezeigt
- [ ] "Öffnen" Button klicken → File Browser öffnet sich mit Datei
- [ ] Feature-File Link auf Board klicken → File Browser mit Datei
- [ ] "Auswählen..." Button → Liste der Feature-Dateien erscheint
- [ ] Nicht-existierende Datei verknüpfen → Warnung anzeigen
- [ ] Feature-File speichern → Feld wird in Task gespeichert

---

## Nächster Schritt

→ **User Testing** - Samir testet im Browser auf http://localhost:3000
