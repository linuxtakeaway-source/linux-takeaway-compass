
# Linux TakeAway Compass MVP

Esto es una primera versión funcional:

- Página con 3 perfiles.
- Chat conectado a OpenAI API.
- Test guiado.
- Diagnóstico.
- CTA hacia producto de 12€.

## 1. Instalación local

Necesitas Node.js 18 o superior.

```bash
cd linux-takeaway-compass-mvp
cp .env.example .env
vi .env
npm install
npm start
```

Abre:

```text
http://localhost:3000
```

## 2. Configurar OpenAI

En `.env` pon:

```bash
OPENAI_API_KEY=tu_clave
OPENAI_MODEL=gpt-5-mini
PAYMENT_URL=https://tu-enlace-de-pago
```

Importante: la API key nunca va en el navegador. Va en el servidor.

## 3. Publicarlo rápido

Opciones sencillas:

### Opción A: Render

1. Sube esta carpeta a GitHub.
2. En Render crea "New Web Service".
3. Conecta el repo.
4. Build command:

```bash
npm install
```

5. Start command:

```bash
npm start
```

6. Variables de entorno:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
PAYMENT_URL=...
```

7. En Render conecta tu dominio o subdominio.

### Opción B: VPS propio

```bash
npm install
npm start
```

Luego lo pones detrás de Nginx.

## 4. CTA para YouTube

Comentario fijado:

```text
👉 Haz el test gratis y descubre tu ruta Linux:
https://linuxtakeaway.online/compass
```

## 5. Qué tocar primero

- Cambia `PAYMENT_URL`.
- Cambia textos de `public/index.html`.
- Cambia prompts en `server.js`.

