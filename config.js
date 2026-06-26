/* ============================================================
   PIAGET AI — Configuración de conexión
   ------------------------------------------------------------
   Conexión activa a Supabase para que la plataforma deje de
   guardar cambios únicamente en localStorage y sincronice con
   la base de datos del proyecto piaget-ai.

   Nota: se usa una llave pública/publishable de Supabase apta
   para cliente. NO usar aquí la service_role key.
   ============================================================ */
window.PIAGET_CONFIG = {
  supabaseUrl: "https://veqlmltuyouqprpoxvkt.supabase.co",
  supabaseKey: "sb_publishable_8zFqwYulJnlyPD5YHKoUbw_5cIZh58Z",
  realtime: true,
  facturacionApiBase: ""
};
