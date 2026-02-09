# KB-004: Chat-Eingabefeld und Layout-Verbesserungen

## Status: 🔵 Planned

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
