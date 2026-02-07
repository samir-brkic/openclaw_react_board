# 🦞 Kanban Board Setup - Prompt für Clawdbot

Kopiere diesen Prompt und gib ihn deinem Clawdbot/openclaw Agent:

---

## Prompt für automatisches Setup:

```
Bitte installiere und konfiguriere dieses speziell für OpenClaw entwickelte Projektmanagement inkl. Kanban Board, File Explorer und Kontext-Manager von GitHub für mich. Darauf arbeiten wir zukünftig gemeinsam an unseren Softwareprojekten:

SETUP:
1. cd ~/clawd
2. git clone https://github.com/AlexPEClub/openclaw_react_board.git kanban
3. cd kanban && npm install
4. Prüfe ob in ~/clawd/projects/ bereits Projekte existieren
5. Falls ja: Führe ./update-projects.js aus um projectPath zu setzen
6. Starte den Server mit npm start (Port 3000)

KONFIGURATION:
1. Lies OPENCLAW_INTEGRATION.md und erkläre mir die wichtigsten Punkte
2. Füge in MEMORY.md folgendes hinzu:
   - Kanban Start-Befehl: cd ~/clawd/kanban && npm start
   - Hinweis auf projectPath (absolut!)
   - API Quick Commands
3. Optional: Füge in HEARTBEAT.md einen Check hinzu ob der Server läuft

ERKLÄRUNG:
- Zeige mir wie ich ein neues Projekt anlege (mit korrektem projectPath)
- Erkläre wie Feature-Specs verknüpft werden
- Zeige mir die wichtigsten API-Befehle

Bestätige jeden Schritt und zeige mir am Ende die URL zum Board.
```

---


## Nach der Installation:

Dein Agent sollte dir folgendes bestätigen:
- ✅ Server läuft auf http://localhost:3000
- ✅ MEMORY.md wurde aktualisiert
- ✅ Bestehende Projekte haben projectPath gesetzt
- ✅ Context-Files werden aus Workspace geladen

## Wichtige Hinweise für den Agent:

1. **projectPath** - IMMER absolute Pfade verwenden!
2. **Feature-Specs** - In {projekt}/specs/ ablegen mit konsistenter Benennung
3. **Context-Files** - Müssen im Workspace-Root liegen (nicht im kanban-Ordner)
4. **File Browser** - Funktioniert nur mit korrektem projectPath

## Troubleshooting-Prompts:

**File Browser zeigt nichts:**
```
Der File Browser im Kanban Board zeigt keine Dateien. 
Prüfe bitte den projectPath in tasks.json - er muss ein absoluter Pfad sein.
Nutze ggf. update-projects.js um die Pfade zu korrigieren.
```

**Context Files fehlen:**
```
Die Context-Speicher Seite zeigt keine Dateien.
Prüfe ob AGENTS.md, SOUL.md etc. im Workspace-Root liegen (nicht im kanban-Ordner).
Das Board sucht sie im Parent-Directory.
```

**Server startet nicht:**
```
Das Kanban Board startet nicht. Prüfe:
1. Ist Port 3000 frei? (lsof -i :3000)
2. Sind alle Dependencies installiert? (npm install)
3. Gibt es Fehler in der Console?
```

---

Mit diesen Prompts sollte jeder Clawdbot Agent das Board problemlos installieren können! 🦞
