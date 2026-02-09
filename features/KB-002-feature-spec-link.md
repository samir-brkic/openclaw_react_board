# KB-002: Feature-Spec Verknüpfung im Task

## Status: 🔵 Planned

## Übersicht

Tasks sollen eine sichtbare Verknüpfung zur Feature-Spec Datei haben. Aktuell existiert das Feld `featureFile` in der API, wird aber im UI nicht angezeigt.

---

## User Stories

### Als Joe (Agent)
- Als Agent möchte ich beim Laden eines Tasks automatisch die verknüpfte Feature-Spec sehen, um den vollen Kontext zu haben
- Als Agent möchte ich wissen welche Datei ich updaten muss wenn sich Requirements ändern

### Als Samir (User)
- Als User möchte ich im Task-Detail die Feature-Spec lesen können ohne den File Browser zu öffnen
- Als User möchte ich beim Erstellen eines Tasks eine Feature-Spec Datei verknüpfen können
- Als User möchte ich mit einem Klick zur Feature-Spec navigieren können

---

## Acceptance Criteria

### Task-Detail Ansicht
- [ ] Feld "Feature-Spec" wird angezeigt (falls vorhanden)
- [ ] Klick auf Dateiname öffnet File Browser mit dieser Datei
- [ ] Oder: Inhalt der Feature-Spec wird inline angezeigt (collapsible)

### Task bearbeiten
- [ ] Input-Feld für `featureFile` Pfad
- [ ] Oder: File-Picker aus dem Projekt's `features/` Ordner
- [ ] Validierung: Datei muss existieren

### Task erstellen
- [ ] Optional: Feature-Spec Pfad angeben
- [ ] Auto-Suggest basierend auf Task-Titel (z.B. "KB-002" → `features/KB-002-*.md`)

---

## Edge Cases

- Was wenn Feature-Spec Datei nicht existiert? → Warnung anzeigen, Link zum Erstellen
- Was wenn Pfad falsch ist? → Fehlermeldung "Datei nicht gefunden"
- Was wenn Task keinen Feature-Spec hat? → Feld leer, optional

---

## Technische Notizen

### Bestehendes API-Feld
```javascript
// Task-Objekt hat bereits:
{
  id: "...",
  title: "...",
  featureFile: "features/KB-002-feature-spec-link.md"  // ← existiert
}
```

### Zu implementieren
1. **TaskDetail.jsx** — `featureFile` anzeigen
2. **TaskEditor.jsx** — `featureFile` Input hinzufügen
3. **Optional:** Feature-Spec Inhalt via API laden

---

## Abhängigkeiten

- Keine (baut auf bestehendem API-Feld auf)

---

## Geschätzter Aufwand

| Komponente | Aufwand |
|------------|---------|
| Task-Detail Anzeige | 30 min |
| Task-Editor Input | 30 min |
| Inline Preview (optional) | 1-2 Stunden |

---

## Nächster Schritt

Nach Approval → Frontend Developer implementiert UI-Änderungen
