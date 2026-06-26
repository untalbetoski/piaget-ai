-- ============================================================
-- PIAGET AI · Esquema de base de datos (Supabase / PostgreSQL)
-- ------------------------------------------------------------
-- Cómo usar:
--   1. Crea un proyecto en https://supabase.com
--   2. Abre el SQL Editor → New query
--   3. Pega TODO este archivo y ejecuta (Run)
--   4. Copia la URL del proyecto y la llave anon (Settings → API)
--      a config.js o a las variables de entorno de Vercel.
--
-- Nota de seguridad: las políticas de abajo son PERMISIVAS para
-- facilitar la demo (acceso anónimo de lectura/escritura). En
-- producción reemplázalas por políticas basadas en auth.uid() y
-- roles (ver la sección comentada al final).
-- ============================================================

-- ---------- Tablas ----------
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text,
  avg numeric(3,1) default 0,
  att int default 100,
  risk text default 'low',
  tutor text,
  pay text default 'al día',
  created_at timestamptz default now()
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "role" text,
  dept text,
  status text default 'activo',
  created_at timestamptz default now()
);

create table if not exists processes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  progress int default 0,
  due text,
  owner text,
  created_at timestamptz default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  folio text,
  family text not null,
  concept text,
  amount int default 0,
  status text default 'pendiente',
  due text,
  created_at timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  family text not null,
  child text,
  stage text default 'Prospectos',
  score int default 50,
  owner text,
  last text default 'recién',
  created_at timestamptz default now()
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  audience text,
  status text default 'borrador',
  reach int default 0,
  "time" text,
  created_at timestamptz default now()
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  tone text default 'blue',
  icon text default 'spark',
  runs text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists activity (
  id uuid primary key default gen_random_uuid(),
  who text,
  action text,
  icon text default 'spark',
  "time" text,
  created_at timestamptz default now()
);

-- ---------- Realtime ----------
-- Habilita los cambios en vivo (postgres_changes) para estas tablas.
alter publication supabase_realtime add table
  students, staff, processes, invoices, leads, announcements, agents, activity;

-- ---------- RLS (DEMO: acceso anónimo) ----------
do $$
declare t text;
begin
  foreach t in array array['students','staff','processes','invoices','leads','announcements','agents','activity']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "demo_all" on %I;', t);
    execute format('create policy "demo_all" on %I for all using (true) with check (true);', t);
  end loop;
end $$;

-- ============================================================
-- SEED · datos de ejemplo
-- ============================================================
insert into students (name, grade, avg, att, risk, tutor, pay) values
  ('Diego Hernández','5° A',9.2,98,'low','Patricia Solís','al día'),
  ('Valentina Cruz','4° B',6.4,78,'high','Roberto Cruz','atrasado'),
  ('Mateo Jiménez','6° A',8.1,91,'low','Ana Jiménez','al día'),
  ('Regina Flores','3° C',7.0,84,'mid','Luis Flores','al día'),
  ('Santiago Ramos','5° A',5.8,71,'high','Gabriela Ramos','atrasado'),
  ('Camila Torres','2° B',9.6,99,'low','Mónica Torres','al día'),
  ('Emiliano Vega','6° B',7.4,88,'mid','Jorge Vega','al día'),
  ('Isabella Núñez','4° A',8.8,95,'low','Sofía Núñez','al día');

insert into staff (name, "role", dept, status) values
  ('Laura Méndez','Docente · Matemáticas','Académico','activo'),
  ('Carlos Ibáñez','Coordinador Primaria','Académico','activo'),
  ('Fernanda Lugo','Tesorería','Finanzas','activo'),
  ('Andrés Pacheco','Mantenimiento','Servicios','permiso'),
  ('Daniela Soto','Admisiones','CRM','activo');

insert into processes (name, progress, due, owner) values
  ('Reinscripciones 2026',72,'30 sep','Control Escolar'),
  ('Certificación SEP',45,'15 oct','Dirección'),
  ('Mantenimiento gimnasio',88,'22 sep','Servicios'),
  ('Auditoría de becas',30,'10 nov','Finanzas');

insert into invoices (folio, family, concept, amount, status, due) values
  ('COL-08421','Familia Hernández','Colegiatura Ago',8500,'pagado','05 ago'),
  ('COL-08422','Familia Cruz','Colegiatura Ago',7200,'vencido','05 ago'),
  ('COL-08423','Familia Ramos','Colegiatura + transporte',9800,'vencido','05 ago'),
  ('COL-08424','Familia Torres','Colegiatura Ago',8500,'pagado','05 ago'),
  ('COL-08425','Familia Vega','Inscripción 2026',14500,'pendiente','12 ago'),
  ('COL-08426','Familia Núñez','Colegiatura Ago',8500,'pagado','05 ago');

insert into leads (family, child, stage, score, owner, last) values
  ('Familia Mendoza','Aspirante a 1° Prim.','Entrevista',92,'Daniela Soto','hace 2 días'),
  ('Familia Aguilar','Aspirante a 3° Prim.','Visita / Tour',78,'Daniela Soto','hace 5 días'),
  ('Familia Reyes','Aspirante a Kínder','Contactados',64,'Pablo Lira','hace 1 día'),
  ('Familia Campos','Aspirante a 5° Prim.','Entrevista',88,'Pablo Lira','hace 11 días'),
  ('Familia Ortiz','Aspirante a 2° Prim.','Prospectos',41,'Sin asignar','hace 3 días');

insert into announcements (title, audience, status, reach, "time") values
  ('Suspensión de clases 16 de septiembre','Toda la comunidad','publicado',1284,'Hoy 08:30'),
  ('Recordatorio de pago de colegiatura','142 familias con adeudo','programado',142,'Mañana 09:00'),
  ('Junta de padres 4° grado','Padres de 4° Primaria','borrador',198,'—'),
  ('Resultados Olimpiada de Matemáticas','Comunidad académica','publicado',980,'Ayer 17:10');

insert into agents (name, description, tone, icon, runs, active) values
  ('Alerta de deserción','Monitorea asistencia y notas; avisa cuando un alumno entra en riesgo.','amber','alert','23 detecciones',true),
  ('Cobranza inteligente','Segmenta cartera vencida y dispara recordatorios personalizados.','green','wallet','142 mensajes',true),
  ('Lead scoring','Prioriza prospectos por probabilidad de inscripción.','violet','target','540 evaluados',true),
  ('Reportes automáticos','Genera y envía el reporte ejecutivo cada lunes 7:00.','blue','doc','Próx: lun 7:00',false);

insert into activity (who, action, icon, "time") values
  ('Laura Méndez','registró calificaciones de Matemáticas 5°B','book','09:42'),
  ('Tesorería','concilió 38 pagos de colegiatura','wallet','09:18'),
  ('Admisiones','movió a 6 familias a "Inscripción"','funnel','08:55');

-- ============================================================
-- PRODUCCIÓN (referencia) — políticas por rol con Supabase Auth
-- ------------------------------------------------------------
-- create policy "lectura_autenticados" on students
--   for select using (auth.role() = 'authenticated');
-- create policy "escritura_staff" on students
--   for all using (
--     exists (select 1 from staff s where s.id = auth.uid())
--   ) with check (true);
-- ============================================================


-- ============================================================
-- AUTENTICACIÓN · cuentas con contraseña cifrada (bcrypt)
-- ------------------------------------------------------------
-- El cliente NUNCA lee esta tabla (RLS sin políticas). El inicio
-- de sesión se hace por la función fn_login (SECURITY DEFINER),
-- que compara el hash y devuelve la cuenta sin exponer la clave.
-- ============================================================
create extension if not exists pgcrypto;

create table if not exists app_accounts (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                         -- Staff | Familia | Docente | Estudiante
  name text not null,
  email text,                                 -- correo institucional (login)
  username text,                              -- usuario alterno (alumnos)
  role text not null,                         -- Dirección, Familias, Docentes, Estudiantes…
  vista text,                                 -- ruta inicial tras iniciar sesión
  status text not null default 'activo',      -- activo | invitado | suspendido
  students jsonb not null default '[]'::jsonb,-- estudiantes vinculados (familias)
  password_hash text not null,
  last_login timestamptz,
  created_at timestamptz default now()
);
create unique index if not exists app_accounts_email_idx    on app_accounts (lower(email))    where email is not null;
create unique index if not exists app_accounts_username_idx on app_accounts (lower(username)) where username is not null;

-- RLS activado y SIN políticas → la tabla no es accesible con la llave anon.
alter table app_accounts enable row level security;
revoke all on app_accounts from anon, authenticated;

-- Función de inicio de sesión: valida credenciales y registra el último acceso.
create or replace function fn_login(p_id text, p_pass text)
returns table (id uuid, kind text, name text, email text, username text, role text, vista text, status text, students jsonb)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update app_accounts a
     set last_login = now()
   where (lower(a.email) = lower(p_id) or lower(a.username) = lower(p_id))
     and a.status <> 'suspendido'
     and a.password_hash = crypt(p_pass, a.password_hash)
  returning a.id, a.kind, a.name, a.email, a.username, a.role, a.vista, a.status, a.students;
end;
$$;

grant execute on function fn_login(text, text) to anon, authenticated;

-- ---------- Cuentas de ejemplo (cámbialas / amplíalas) ----------
-- Staff / Dirección
insert into app_accounts (kind, name, email, role, vista, password_hash) values
  ('Staff','María Fernanda Ríos','direccion@jeanpiaget.mx','Dirección','home',     crypt('Direccion2026',    gen_salt('bf'))),
  ('Staff','Luis Treviño',       'tesoreria@jeanpiaget.mx','Finanzas','cobros',    crypt('Tesoreria2026',    gen_salt('bf'))),
  ('Staff','Paola Mena',     'coordinacion@jeanpiaget.mx','Coordinación','home',   crypt('Coordinacion2026', gen_salt('bf'))),
  ('Staff','Daniela Soto',    'admisiones@jeanpiaget.mx','Admisiones','pipeline',  crypt('Admisiones2026',   gen_salt('bf'))),
  ('Docente','Docente Invitado', 'docente@jeanpiaget.mx','Docentes','clases',      crypt('Docente2026',      gen_salt('bf')))
on conflict do nothing;

-- Familias (vinculadas a sus estudiantes)
insert into app_accounts (kind, name, email, role, vista, students, password_hash) values
  ('Familia','Familia Hernández','familia.hernandez@jeanpiaget.mx','Familias','boletines',
     '[{"name":"Diego Hernández","grade":"5° A"},{"name":"Mariana Hernández","grade":"1° B"}]'::jsonb, crypt('Hernandez2026', gen_salt('bf'))),
  ('Familia','Familia Cruz','familia.cruz@jeanpiaget.mx','Familias','boletines',
     '[{"name":"Valentina Cruz","grade":"4° B"}]'::jsonb, crypt('Cruz2026!', gen_salt('bf'))),
  ('Familia','Familia Torres','familia.torres@jeanpiaget.mx','Familias','boletines',
     '[{"name":"Camila Torres","grade":"2° B"}]'::jsonb, crypt('Torres2026', gen_salt('bf')))
on conflict do nothing;

-- Estudiante (acceso por usuario)
insert into app_accounts (kind, name, username, role, vista, password_hash) values
  ('Estudiante','Diego Hernández','diego.hernandez5a','Estudiantes','home', crypt('Alumno2026', gen_salt('bf')))
on conflict do nothing;
-- ============================================================
