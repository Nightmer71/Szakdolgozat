# Month 8: Realtime Draft Updates (WebSocket)

## Ütemezett feladat célja

- Megvalósítani a 7. hónapban kialakított draft folyamat valós idejű frissítését.
- Draft indításra és választásra azonnal érkezzen frissítés az összes csapattagnak.
- Ettől a felhasználói élmény élőbbé válik, és megszűnnek a manuális frissítések.

## Kódmódosítások

### Backend

- `requirements.txt`: `channels==4.0.0` hozzáadva.
- `backend/settings.py`: `channels` felvéve az `INSTALLED_APPS`-ba, `ASGI_APPLICATION` beállítva, és `CHANNEL_LAYERS` in-memory implementáció.
- `backend/asgi.py`: `ProtocolTypeRouter` + `AuthMiddlewareStack` + websocket routing.
- `backend/game/routing.py`: `ws/drafts/<league_id>/` útvonal.
- `backend/game/consumers.py`: `DraftConsumer` WebSocket kapcsolat, csatlakozás végpont, aktuális `draft`/`picks`/`available_players` küldése, csoportfrissítés fogadása.
- `backend/game/views.py`: `DraftViewSet.broadcast_draft_update`, `start_draft` és `make_pick` metódusok WebSocket broadcast.

### Frontend

- `frontend/src/components/DraftPage.jsx`: WebSocket kliens beépítve draft oldalhoz, `draft.state` és `draft.update` események kezelése, automatikus UI frissítés.

## Acceptance criteria - Teljesítve

- [x] Draft beállítások és valós idejű események Node/React felé
- [x] Draft állapot automatikus frissítés a kliensen
- [x] Draft eseménykezelés: indítás, pick
- [x] Új dokumentáció: `docs/month8.md`

## Tesztelés

- Backend: manuális API teszt `create_draft -> start_draft -> make_pick` működik.
- Frontend: a DraftPage most már WebSocket frissítéseket is be tud fogadni.

## Megjegyzés

A jelenlegi bevezetés fejlesztési környezetre készült (in-memory channel layer). Termeléshez javasolt Redis csatorna réteg beállítása `channels_redis` használatával.
