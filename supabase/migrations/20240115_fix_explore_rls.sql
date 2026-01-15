-- 1. Aseguramos que RLS esté activo (por seguridad)
ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;

-- 2. Eliminamos políticas antiguas de lectura si existen (opcional, para limpieza)
-- DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."projects";
-- DROP POLICY IF EXISTS "Users can only see their own projects" ON "public"."projects";

-- 3. Creamos la política que permite a CUALQUIERA (autenticado o anónimo) ver todos los proyectos
CREATE POLICY "Enable read access for all users"
ON "public"."projects"
FOR SELECT
USING (true);

-- Nota: Las políticas de INSERT/UPDATE/DELETE deben mantenerse restringidas al dueño (auth.uid() = user_id)
