-- =====================================================
-- IB AGREEMENT TRACKING FOR REGULATORY COMPLIANCE
-- =====================================================
-- Fecha: 2025-01-25
-- Descripción: Añade campos para rastrear la aceptación del acuerdo de IB
--              para cumplimiento regulatorio

-- Agregar campos al perfil de usuario para rastrear acuerdo IB
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_ib_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ib_agreement_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ib_agreement_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ib_agreement_ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS ib_agreement_version VARCHAR(20) DEFAULT '1.0';

-- Crear índice para búsquedas rápidas de IBs activos
CREATE INDEX IF NOT EXISTS idx_profiles_ib_active ON public.profiles(is_ib_active) WHERE is_ib_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_ib_agreement ON public.profiles(ib_agreement_accepted) WHERE ib_agreement_accepted = TRUE;

-- Comentarios para documentación
COMMENT ON COLUMN public.profiles.is_ib_active IS 'Indica si el usuario está activo como Introducing Broker';
COMMENT ON COLUMN public.profiles.ib_agreement_accepted IS 'Indica si el usuario aceptó el acuerdo de IB';
COMMENT ON COLUMN public.profiles.ib_agreement_accepted_at IS 'Fecha y hora cuando aceptó el acuerdo de IB';
COMMENT ON COLUMN public.profiles.ib_agreement_ip_address IS 'Dirección IP desde donde se aceptó el acuerdo';
COMMENT ON COLUMN public.profiles.ib_agreement_version IS 'Versión del acuerdo de IB aceptado';

-- Crear tabla para almacenar versiones del contrato IB
CREATE TABLE IF NOT EXISTS public.ib_agreement_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(20) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar versión placeholder del acuerdo IB
INSERT INTO public.ib_agreement_versions (version, content, is_active, effective_date)
VALUES (
    '1.0',
    '# ACUERDO DE INTRODUCING BROKER (IB)

## 1. PARTES DEL ACUERDO

Este Acuerdo de Introducing Broker (en adelante, el "Acuerdo") se celebra entre:

**AGM BROKER** (en adelante, el "Broker"), una entidad financiera autorizada y regulada, y

**EL USUARIO** (en adelante, el "IB" o "Introducing Broker"), quien acepta este acuerdo electrónicamente.

## 2. OBJETO DEL ACUERDO

El IB acepta actuar como intermediario independiente, refiriendo clientes potenciales al Broker a cambio de comisiones por las operaciones realizadas por dichos clientes referidos.

## 3. OBLIGACIONES DEL IB

3.1. **Cumplimiento Regulatorio**: El IB se compromete a cumplir con todas las leyes y regulaciones aplicables en su jurisdicción.

3.2. **Conducta Ética**: El IB actuará de manera ética y profesional en todo momento, evitando prácticas engañosas o fraudulentas.

3.3. **Información Veraz**: El IB proporcionará información precisa y completa sobre los servicios del Broker a los clientes potenciales.

3.4. **No Garantías**: El IB no garantizará rendimientos específicos ni minimizará los riesgos del trading.

3.5. **Conocimiento del Cliente (KYC)**: El IB asistirá en el proceso de verificación de identidad de los clientes referidos.

## 4. COMISIONES

4.1. **Estructura de Comisiones**: El IB recibirá comisiones según la estructura de tiers establecida por el Broker.

4.2. **Cálculo**: Las comisiones se calcularán en base al volumen de trading (lotes operados) de los clientes referidos.

4.3. **Pagos**: Las comisiones se pagarán mensualmente, sujeto a un monto mínimo de retiro.

4.4. **Retención de Impuestos**: El IB es responsable de declarar y pagar los impuestos aplicables sobre las comisiones recibidas.

## 5. RESTRICCIONES

5.1. El IB NO puede:
   - Ofrecer servicios de gestión de cuentas sin la debida autorización
   - Recibir o manejar fondos de clientes directamente
   - Tomar decisiones de trading en nombre de los clientes
   - Hacer declaraciones falsas o engañosas sobre el Broker
   - Compartir su enlace de referido de manera que viole leyes anti-spam

## 6. CONFIDENCIALIDAD

El IB mantendrá confidencial toda información propietaria del Broker y de sus clientes.

## 7. TERMINACIÓN

7.1. Cualquiera de las partes puede terminar este Acuerdo con 30 días de aviso previo por escrito.

7.2. El Broker puede terminar este Acuerdo inmediatamente si el IB viola cualquier término del mismo.

7.3. Las comisiones devengadas hasta la fecha de terminación serán pagadas según los términos del Acuerdo.

## 8. RESPONSABILIDAD

8.1. El IB actúa como contratista independiente, no como empleado o agente del Broker.

8.2. El IB es responsable de sus propias obligaciones fiscales y regulatorias.

8.3. El Broker no será responsable de las acciones u omisiones del IB.

## 9. MODIFICACIONES

El Broker se reserva el derecho de modificar este Acuerdo. Los cambios materiales serán notificados al IB con 30 días de anticipación.

## 10. LEY APLICABLE

Este Acuerdo se rige por las leyes de la jurisdicción donde el Broker está registrado.

## 11. ACEPTACIÓN ELECTRÓNICA

Al hacer clic en "Acepto" o "Confirmo", el IB reconoce que:
- Ha leído y comprendido completamente este Acuerdo
- Acepta estar vinculado por todos sus términos y condiciones
- Tiene la capacidad legal para celebrar este Acuerdo
- Su aceptación electrónica tiene la misma validez que una firma manuscrita

---

**NOTA IMPORTANTE**: Este es un contrato placeholder con fines de demostración. Debe ser revisado y personalizado por el departamento legal del Broker antes de su uso en producción.

**Versión**: 1.0
**Fecha de Vigencia**: 25 de Enero de 2025
**Última Actualización**: 25 de Enero de 2025',
    TRUE,
    '2025-01-25'
) ON CONFLICT (version) DO NOTHING;

-- Crear tabla de auditoría para aceptaciones de IB
CREATE TABLE IF NOT EXISTS public.ib_agreement_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    agreement_version VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'accepted', 'rejected', 'revoked'
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB, -- Información adicional como ubicación, dispositivo, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para auditoría
CREATE INDEX IF NOT EXISTS idx_ib_agreement_audit_user ON public.ib_agreement_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_ib_agreement_audit_created ON public.ib_agreement_audit(created_at DESC);

-- Función para registrar aceptación de acuerdo IB
CREATE OR REPLACE FUNCTION public.accept_ib_agreement(
    p_user_id UUID,
    p_agreement_version VARCHAR(20),
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Actualizar perfil del usuario
    UPDATE public.profiles
    SET
        ib_agreement_accepted = TRUE,
        ib_agreement_accepted_at = NOW(),
        ib_agreement_ip_address = p_ip_address,
        ib_agreement_version = p_agreement_version,
        is_ib_active = TRUE,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Registrar en auditoría
    INSERT INTO public.ib_agreement_audit (
        user_id,
        agreement_version,
        action,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        p_user_id,
        p_agreement_version,
        'accepted',
        p_ip_address,
        p_user_agent,
        jsonb_build_object(
            'accepted_at', NOW(),
            'method', 'electronic_signature'
        )
    );

    -- Retornar resultado
    SELECT jsonb_build_object(
        'success', TRUE,
        'message', 'IB Agreement accepted successfully',
        'user_id', p_user_id,
        'agreement_version', p_agreement_version,
        'accepted_at', NOW()
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.accept_ib_agreement TO authenticated;

-- Políticas RLS para ib_agreement_versions (todos pueden leer la versión activa)
ALTER TABLE public.ib_agreement_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active IB agreement"
ON public.ib_agreement_versions
FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- Políticas RLS para ib_agreement_audit (usuarios solo pueden ver su propio historial)
ALTER TABLE public.ib_agreement_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own IB agreement audit"
ON public.ib_agreement_audit
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Comentario final
COMMENT ON TABLE public.ib_agreement_versions IS 'Almacena las versiones del contrato de Introducing Broker';
COMMENT ON TABLE public.ib_agreement_audit IS 'Auditoría de aceptaciones/rechazos de acuerdos IB para cumplimiento regulatorio';
COMMENT ON FUNCTION public.accept_ib_agreement IS 'Registra la aceptación del acuerdo IB por parte de un usuario';
