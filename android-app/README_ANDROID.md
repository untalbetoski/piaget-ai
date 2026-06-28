# Soy Piaget Android

App Android tipo wrapper avanzado para la plataforma `https://www.soypiaget.app`.

## Incluye

- Splash screen PIAGET.
- Icono base / marca PIAGET preparada para assets Android.
- Pantalla inicial móvil.
- Carga segura de `https://www.soypiaget.app/plataforma`.
- Detección offline.
- Botón volver de Android.
- Contenedor seguro para cámara, QR, galería y archivos.
- Soporte para abrir enlaces externos con navegador del sistema.

## Requisitos

- Node.js LTS.
- Android Studio.
- JDK compatible con Android Studio.
- SDK Android instalado.

## Instalación

Desde esta carpeta:

```bash
cd android-app
npm install
npm run add:android
npm run sync
npm run open
```

Eso abre Android Studio con el proyecto nativo.

## Compilar APK debug

```bash
cd android-app
npm run build:debug
```

APK esperado:

```txt
android/app/build/outputs/apk/debug/app-debug.apk
```

## Compilar AAB release

```bash
cd android-app
npm run build:release
```

AAB esperado:

```txt
android/app/build/outputs/bundle/release/app-release.aab
```

## Permisos Android a revisar

Después de ejecutar `npm run add:android`, abre:

```txt
android/app/src/main/AndroidManifest.xml
```

Confirma que existan permisos para:

```txt
INTERNET
ACCESS_NETWORK_STATE
CAMERA
READ_MEDIA_IMAGES
READ_MEDIA_VIDEO
READ_EXTERNAL_STORAGE para Android 12 o menor
```

También conviene declarar cámara como característica no obligatoria para que la app pueda instalarse en tablets sin cámara:

```txt
hardware.camera required=false
hardware.camera.autofocus required=false
```

## Icono Android

Para generar iconos definitivos:

1. Crea un PNG cuadrado 1024 x 1024 con el logotipo PIAGET.
2. En Android Studio abre `res`.
3. Usa `New > Image Asset`.
4. Nombre: `ic_launcher`.
5. Ajusta foreground/background.

## Splash screen nativo

Capacitor ya tiene configuración inicial en `capacitor.config.ts`.

Para un splash definitivo:

1. Genera assets Android desde Android Studio.
2. Usa fondo `#07142f`.
3. Usa el isotipo PIAGET centrado.
4. Mantén alto contraste para pantallas OLED.

## Seguridad de carga

El wrapper solo debe navegar a:

```txt
www.soypiaget.app
soypiaget.app
```

Si se necesita abrir un link externo, debe abrirse fuera de la app con Browser del sistema.

## Módulos soportados

- Plataforma general.
- Galería.
- Scanner QR.
- Comunicados.
- Carga de archivos/fotos desde formularios web.
- Cámara mediante permisos nativos.

## Siguiente fase recomendada

- Crear tema Android nativo.
- Generar iconos oficiales.
- Agregar Firebase Cloud Messaging para notificaciones push.
- Agregar deep links por rol: estudiante, familia, docente, administración.
- Preparar firma release para Google Play Console.
