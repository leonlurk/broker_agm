# Instrucciones para el Owner del Proyecto

## Problema
Los colaboradores no pueden eliminar usuarios debido a las restricciones de foreign key y permisos limitados.

## Soluciones (el owner debe ejecutar una de estas):

### Opción 1: Crear una función helper para colaboradores
```sql
-- El owner ejecuta esto una sola vez
CREATE OR REPLACE FUNCTION public.delete_user_for_testing(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_uuid UUID;
    deleted_count INT := 0;
BEGIN
    -- Obtener el UUID del usuario
    SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RETURN 'Usuario no encontrado: ' || user_email;
    END IF;
    
    -- Deshabilitar temporalmente las restricciones
    SET session_replication_role = 'replica';
    
    -- Eliminar de todas las tablas
    DELETE FROM public.broker_accounts WHERE user_id = user_uuid OR user_id = user_uuid::text;
    DELETE FROM public.profiles WHERE id = user_uuid;
    DELETE FROM public.users WHERE id = user_uuid;
    DELETE FROM auth.users WHERE id = user_uuid;
    
    -- Rehabilitar restricciones
    SET session_replication_role = 'origin';
    
    RETURN 'Usuario ' || user_email || ' eliminado exitosamente';
EXCEPTION
    WHEN OTHERS THEN
        SET session_replication_role = 'origin';
        RETURN 'Error al eliminar usuario: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos de ejecución a todos
GRANT EXECUTE ON FUNCTION public.delete_user_for_testing(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_for_testing(TEXT) TO anon;
```

### Opción 2: Agregar CASCADE a las foreign keys
```sql
-- Modificar las foreign keys existentes para agregar ON DELETE CASCADE
-- Esto permite que al eliminar un usuario, se eliminen automáticamente sus datos relacionados

-- Ejemplo para la tabla profiles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Repetir para cada tabla que tenga relación con auth.users
```

### Opción 3: Dar permisos temporales al colaborador
```sql
-- Dar permisos de superusuario temporal (PELIGROSO - solo para desarrollo)
GRANT postgres TO tu_usuario_colaborador;

-- Después de las pruebas, revocar el permiso
REVOKE postgres FROM tu_usuario_colaborador;
```

### Opción 4: Crear una política RLS más permisiva para desarrollo
```sql
-- Crear una política que permita a ciertos usuarios eliminar registros para testing
CREATE POLICY "Allow delete for testing" ON public.users
FOR DELETE
TO authenticated
USING (
    auth.email() IN ('email_del_colaborador@example.com', 'otro_colaborador@example.com')
);

-- Repetir para otras tablas necesarias
```

## Recomendación
La **Opción 1** es la más segura y práctica. Crea una función específica para eliminar usuarios de prueba que los colaboradores pueden usar sin comprometer la seguridad del sistema.

## Uso por el colaborador
Una vez que el owner implemente la Opción 1, los colaboradores pueden usar:

```sql
-- Para eliminar un usuario de prueba
SELECT delete_user_for_testing('leonagustp@gmail.com');
```

## Nota de Seguridad
Esta función debe usarse SOLO en desarrollo/staging, nunca en producción.