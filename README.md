# Pokedex BFF (Backend)

## Configuración

1. Instala dependencias:

```bash
npm install
```

2. Usa el archivo `.env` (ya creado en este proyecto).

3. Ejecuta en desarrollo:

```bash
npm run dev
```

## Endpoints principales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/pokemon` (filtros: `name`, `type1`, `type2`, `region`, `limit`, `offset`)
- `GET /api/pokemon/:idOrName`
- `GET|POST|PATCH|DELETE /api/favorites`
- `GET|POST|PATCH|DELETE /api/teams`
- `GET /api/teams/friend/:friendId`
- `GET /api/friends`
- `POST /api/friends/add`
- `DELETE /api/friends/:friendId`
- `POST /api/friends/requests/:requesterId/accept`
- `DELETE /api/friends/requests/:requesterId`
- `GET|POST /api/battles`
- `GET /api/notifications/vapid-public-key`
- `POST /api/notifications/subscribe`
- `POST /api/notifications/send`
