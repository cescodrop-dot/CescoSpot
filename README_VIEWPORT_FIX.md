# Viewport iOS fix

Il service worker riscrive il meta viewport nelle navigazioni prima che Safari interpreti il documento, così l'app installata riceve già `maximum-scale=1.0` e `user-scalable=no`.

Dopo il deploy è necessario chiudere e riaprire una volta la PWA affinché il nuovo service worker prenda il controllo.
