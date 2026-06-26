/* ============================================================
   PIAGET AI — Configuración de conexión
   ------------------------------------------------------------
   Deja los valores vacíos para trabajar en MODO LOCAL
   (persistencia en el navegador con localStorage — ideal para
   demos y desarrollo).

   Para conectar tu base de datos real, crea un proyecto en
   https://supabase.com, abre Project Settings → API y pega aquí
   la URL del proyecto y la llave pública "anon".

   En producción (Vercel) estos valores los inyecta el script
   build desde las variables de entorno NEXT_PUBLIC_SUPABASE_URL
   y NEXT_PUBLIC_SUPABASE_ANON_KEY (ver README.md).
   ============================================================ */
window.PIAGET_CONFIG = {
  supabaseUrl: "",      // p.ej. "https://xxxxxxxx.supabase.co"
  supabaseKey: "",      // llave pública anon (NO la service_role)
  realtime: true,       // sincronización en vivo cuando hay Supabase

  /* Facturación con valor fiscal (Facturama vía backend serverless).
     Déjalo vacío ("") para usar el mismo dominio del deploy en Vercel
     (las funciones viven en /api/facturama/*). Pon una URL absoluta solo
     si tu backend está en otro dominio. En MODO DEMO (sin backend o sin
     credenciales) el timbrado se SIMULA y no tiene valor fiscal. */
  facturacionApiBase: ""
};
