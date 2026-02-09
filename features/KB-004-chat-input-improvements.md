# KB-004: Chat-Eingabefeld und Layout-Verbesserungen

## Status: 🟢 In Progress (Tech-Design fertig)

## Zusammenfassung
Die WebUI des Kanban Boards zeigt den Chat sehr schmal an und das Eingabefeld ist nicht benutzerfreundlich. Mehrere UX-Bugs müssen behoben werden.

## User Stories

### US-1: Volle Breite nutzen
Als User möchte ich, dass der Chat-Bereich die volle verfügbare Fensterbreite nutzt, damit ich mehr Inhalt sehen kann und die Darstellung übersichtlicher ist.

### US-2: Auto-Grow Textarea
Als User möchte ich, dass das Eingabefeld automatisch wächst wenn ich viel Text schreibe, damit ich meinen gesamten Text übersichtlich sehen kann.

### US-3: Begrenzte Höhe
Als User möchte ich, dass das Eingabefeld eine maximale Höhe hat (z.B. 40% des Viewports), damit es nicht den gesamten Bildschirm verdeckt und ich noch den Chat-Verlauf sehen kann.

### US-4: Mehrzeilen-Eingabe
Als User möchte ich mit ALT+ENTER (oder Shift+ENTER) eine neue Zeile einfügen können, ohne die Nachricht abzusenden, damit ich formatierte Nachrichten schreiben kann.

### US-5: Mobile Optimierung
Als mobiler User möchte ich, dass der Chat auf Smartphones und Tablets vollständig nutzbar ist (Touch-friendly, responsive Layout).

## Acceptance Criteria

### Layout
- [ ] Chat-Container nutzt 100% der verfügbaren Breite (abzüglich sinnvoller Padding/Margins)
- [ ] Kein fest codiertes `max-width` das die Breite unnötig einschränkt
- [ ] Nachrichten-Bubbles nutzen die verfügbare Breite sinnvoll

### Textarea Auto-Grow
- [ ] Eingabefeld startet mit 1-2 Zeilen Höhe (min-height)
- [ ] Wächst automatisch wenn Text mehr Platz braucht
- [ ] Scrollt intern wenn max-height erreicht (nicht über Viewport hinaus)
- [ ] max-height: ca. 40% des Viewports oder 200-300px

### Mehrzeilen-Eingabe
- [ ] ENTER = Nachricht absenden (bestehendes Verhalten)
- [ ] ALT+ENTER ODER Shift+ENTER = Neue Zeile einfügen
- [ ] Cursor bleibt in der neuen Zeile
- [ ] Funktioniert auf Desktop-Browsern (Chrome, Firefox, Safari, Edge)

### Mobile/Responsive
- [ ] Breakpoints für Mobile (<768px) und Desktop (≥768px)
- [ ] Touch-Targets mindestens 44x44px (iOS Human Interface Guidelines)
- [ ] Keine horizontalen Scrollbars
- [ ] Viewport meta-Tag korrekt gesetzt
- [ ] Eingabefeld passt sich an Keyboard-Einblendung an (iOS/Android)

## Edge Cases

### E-1: Sehr langer Text ohne Umbrüche
- Lange Wörter/URLs sollen mit `word-break: break-word` umgebrochen werden
- Kein horizontaler Overflow

### E-2: Leeres Eingabefeld nach Absenden
- Textarea soll auf Ursprungsgröße (min-height) zurückspringen
- Fokus bleibt im Eingabefeld

### E-3: Copy-Paste von mehrzeiligem Text
- Eingefügter Text mit Zeilenumbrüchen wird korrekt angezeigt
- Auto-Grow reagiert sofort auf Paste

### E-4: Mobile Keyboard
- Wenn virtuelles Keyboard erscheint, soll das Eingabefeld sichtbar bleiben
- Chat scrollt nicht ungewollt weg

### E-5: Browser-Zoom
- Layout bleibt nutzbar bei 50%-200% Zoom

## Technische Hinweise (für Solution Architect)

### Betroffene Dateien (vermutlich)
- `/root/.openclaw/workspace/kanban/index.html` - Frontend ist komplett dort

### CSS-Ansätze
- Flexbox/Grid für responsive Layout
- `resize: none` auf Textarea (Auto-Grow ersetzt manuelles Resize)
- CSS Custom Properties für Breakpoints

### JavaScript-Ansätze
- Event-Listener für `input` Event → Auto-Grow
- Event-Listener für `keydown` → ALT/Shift+ENTER Detection
- `scrollHeight` für dynamische Höhenberechnung

## Abhängigkeiten
- Keine (eigenständiges Feature)

## Nicht im Scope
- Markdown-Preview während der Eingabe
- Emoji-Picker
- File-Upload
- @-Mentions

---

## Tech-Design (Solution Architect)

### Betroffene Datei
```
/root/.openclaw/workspace/kanban/index.html
```
Alles in einer Datei (Vanilla JS, kein Build-Prozess).

### Component-Struktur (IST-Zustand)

```
Chat View (#chatView)
├── Chat Sessions Sidebar (250px fest)
│   ├── Projekt-Auswahl
│   ├── Sessions-Liste
│   └── Gateway-Status
└── Chat Main Area (flex: 1)
    ├── Chat Header
    ├── Chat Messages (#chatMessages) ← Nachrichten-Bubbles hier
    └── Chat Input Form (#chatInputForm)
        ├── <input type="text"> ← PROBLEM: nur 1 Zeile!
        └── Send Button
```

### Component-Struktur (SOLL-Zustand)

```
Chat View (#chatView)
├── Chat Sessions Sidebar (250px, auf Mobile versteckbar)
└── Chat Main Area (flex: 1, volle Breite nutzen)
    ├── Chat Header
    ├── Chat Messages (#chatMessages)
    │   └── Message Bubbles (max-width: 85% ENTFERNEN oder erhöhen)
    └── Chat Input Form (#chatInputForm)
        ├── <textarea> ← NEU: ersetzt <input>
        │   └── Auto-Grow mit max-height
        └── Send Button (44x44px, Touch-friendly)
```

### Änderungen im Detail

#### 1. Input → Textarea umwandeln

**Vorher (Zeile ~1435):**
```html
<input type="text" id="chatInput" ...>
```

**Nachher:**
```html
<textarea id="chatInput" rows="1" ...></textarea>
```

#### 2. CSS-Styles für Textarea

Neue Styles im `<style>`-Block hinzufügen:

| Property | Wert | Zweck |
|----------|------|-------|
| `min-height` | `44px` | Mindestens 1 Zeile |
| `max-height` | `40vh` oder `200px` | Nicht über 40% Viewport |
| `resize` | `none` | Kein manuelles Resize |
| `overflow-y` | `auto` | Scrollbar wenn nötig |
| `line-height` | `1.5` | Lesbare Zeilenhöhe |
| `word-break` | `break-word` | Lange URLs umbrechen |

#### 3. Auto-Grow JavaScript

Neue Funktion `autoGrowTextarea()`:
- Triggert bei `input` Event
- Setzt `height = scrollHeight` 
- Respektiert `max-height`
- Reset nach Absenden (auf `min-height`)

#### 4. Keyboard-Handling

Event-Listener für `keydown`:
- **ENTER (ohne Modifier)** → Absenden
- **Shift+ENTER oder Alt+ENTER** → Neue Zeile (Default-Verhalten)

#### 5. Layout-Fixes für volle Breite

| Element | Problem | Lösung |
|---------|---------|--------|
| Message Bubbles | `max-width: 85%` | Erhöhen auf `95%` oder `100%` |
| `#chatView` | `left: 260px` fest | Responsive machen für Mobile |
| `#chatInputForm` | Padding groß | Auf Mobile reduzieren |

#### 6. Mobile Responsive (< 768px)

```
@media (max-width: 768px) {
  - Chat Sessions Sidebar: verstecken oder Hamburger-Menü
  - #chatView: left: 0 (volle Breite)
  - Padding reduzieren
  - Touch-Targets: min 44x44px
}
```

### Daten-Model

Keine Änderungen nötig - Messages-Struktur bleibt gleich.

### Dependencies

Keine neuen Packages nötig - alles mit Vanilla JS/CSS lösbar.

### Tech-Entscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| Textarea statt Input | Unterstützt Mehrzeilen nativ |
| Auto-Grow via JS | CSS `field-sizing: content` noch nicht überall supported |
| Shift+ENTER für Newline | Standard-Konvention (WhatsApp, Slack, Discord) |
| 40vh max-height | Lässt genug Platz für Chat-Verlauf |
| Kein Framework | Projekt nutzt Vanilla JS - dabei bleiben |

### Implementierungs-Reihenfolge

1. **Input → Textarea** umwandeln (HTML)
2. **CSS-Styles** für Textarea hinzufügen
3. **Auto-Grow JS** implementieren
4. **Keyboard-Handler** für Shift/Alt+ENTER
5. **Layout-Fixes** (max-width, Padding)
6. **Mobile Breakpoints** testen

### Risiken

| Risiko | Mitigation |
|--------|------------|
| iOS Safari Keyboard-Bug | `visualViewport` API nutzen |
| Firefox Auto-Grow anders | `scrollHeight` Cross-Browser testen |
| Bestehende Enter-Logik überschreiben | Alte Logik suchen und ersetzen |
