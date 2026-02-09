# KB-001: Mobile Responsive Fix - Sidebar Navigation

## Problem
Auf mobilen Geräten ist die linke Sidebar nicht sichtbar. User können nicht zwischen Projekten navigieren.

## Lösung
Hamburger-Menü Icon das die Sidebar als Overlay öffnet.

## Implementierung

### 1. CSS Media Query
- Sidebar standardmäßig hidden unter 768px
- Hamburger-Button sichtbar unter 768px
- Overlay wenn Sidebar geöffnet

### 2. State Management
- `sidebarOpen` State in App.jsx
- Toggle-Funktion für Hamburger-Click
- Schließen bei Projekt-Auswahl

## Betroffene Dateien
- `src/App.jsx` - State + Hamburger Button
- `src/App.css` - Media Queries + Overlay Styles

## Akzeptanzkriterien
- [ ] Hamburger-Icon sichtbar auf Mobile (< 768px)
- [ ] Sidebar öffnet als Overlay bei Click
- [ ] Sidebar schließt bei Projekt-Auswahl
- [ ] Desktop-Ansicht unverändert
