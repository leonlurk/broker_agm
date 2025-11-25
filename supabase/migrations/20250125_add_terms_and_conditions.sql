-- Migration: Add Terms and Conditions acceptance tracking
-- Description: Adds tables and columns to track user acceptance of Terms and Conditions

-- 1. Add T&C acceptance fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS terms_version VARCHAR(20);

-- 2. Create table for T&C versions
CREATE TABLE IF NOT EXISTS public.terms_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version VARCHAR(20) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create audit table for T&C acceptances
CREATE TABLE IF NOT EXISTS public.terms_acceptance_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'accepted', 'viewed', etc.
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted ON public.profiles(terms_accepted);
CREATE INDEX IF NOT EXISTS idx_terms_versions_active ON public.terms_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_terms_audit_user ON public.terms_acceptance_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_terms_audit_version ON public.terms_acceptance_audit(terms_version);

-- 5. Enable RLS
ALTER TABLE public.terms_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_acceptance_audit ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for terms_versions (readable by all authenticated users)
CREATE POLICY IF NOT EXISTS "Users can view active T&C versions"
  ON public.terms_versions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 7. RLS Policies for terms_acceptance_audit (users can only see their own records)
CREATE POLICY IF NOT EXISTS "Users can view their own T&C audit records"
  ON public.terms_acceptance_audit
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own T&C audit records"
  ON public.terms_acceptance_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 8. Create function to record T&C acceptance
CREATE OR REPLACE FUNCTION public.accept_terms_and_conditions(
    p_user_id UUID,
    p_terms_version VARCHAR(20),
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Update profile with T&C acceptance
    UPDATE public.profiles
    SET
        terms_accepted = TRUE,
        terms_accepted_at = NOW(),
        terms_ip_address = p_ip_address,
        terms_version = p_terms_version,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Register in audit table
    INSERT INTO public.terms_acceptance_audit (
        user_id, terms_version, action, ip_address, user_agent
    ) VALUES (
        p_user_id, p_terms_version, 'accepted', p_ip_address, p_user_agent
    );

    -- Build success response
    v_result := jsonb_build_object(
        'success', TRUE,
        'accepted_at', NOW(),
        'version', p_terms_version
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Return error information
        v_result := jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM
        );
        RETURN v_result;
END;
$$;

-- 9. Grant necessary permissions
GRANT SELECT ON public.terms_versions TO authenticated;
GRANT SELECT, INSERT ON public.terms_acceptance_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_terms_and_conditions TO authenticated;

-- 10. Insert placeholder T&C (version 1.0)
INSERT INTO public.terms_versions (version, content, is_active, effective_date)
VALUES (
  '1.0',
  '# Términos y Condiciones de Uso - AGM Broker

## 1. Aceptación de los Términos

Al registrarte y utilizar los servicios de AGM Broker, aceptas estar legalmente vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no deberías utilizar nuestros servicios.

## 2. Descripción del Servicio

AGM Broker proporciona una plataforma de trading para instrumentos financieros, incluyendo pero no limitado a:
- Forex (pares de divisas)
- Metales preciosos
- Índices
- Criptomonedas
- Acciones

## 3. Elegibilidad

Para utilizar nuestros servicios, debes:
- Tener al menos 18 años de edad
- Tener capacidad legal para celebrar contratos vinculantes
- No estar restringido por ninguna sanción o ley aplicable
- Proporcionar información verdadera, precisa y completa durante el registro

## 4. Registro de Cuenta

Al crear una cuenta, te comprometes a:
- Proporcionar información precisa y actualizada
- Mantener la seguridad de tu cuenta y contraseña
- Notificar inmediatamente cualquier uso no autorizado de tu cuenta
- Ser responsable de todas las actividades que ocurran bajo tu cuenta

## 5. Riesgos del Trading

**ADVERTENCIA DE RIESGO**: El trading de instrumentos financieros conlleva un alto nivel de riesgo y puede no ser adecuado para todos los inversores. Puedes perder parte o la totalidad de tu inversión inicial.

Reconoces y aceptas que:
- El trading de apalancamiento aumenta tanto las ganancias potenciales como las pérdidas
- Los resultados pasados no garantizan resultados futuros
- Las condiciones del mercado pueden cambiar rápidamente
- Eres el único responsable de tus decisiones de trading

## 6. Depósitos y Retiros

- Todos los depósitos deben realizarse desde cuentas a tu nombre
- AGM Broker se reserva el derecho de solicitar verificación de identidad
- Los retiros se procesarán al método de pago original cuando sea posible
- Pueden aplicarse tarifas de procesamiento según el método de pago

## 7. Prohibiciones

Está estrictamente prohibido:
- Realizar actividades fraudulentas o manipulación del mercado
- Utilizar la plataforma para lavado de dinero o financiamiento del terrorismo
- Explotar errores del sistema o glitches para obtener ventajas indebidas
- Compartir o vender tu cuenta a terceros
- Utilizar bots o sistemas automatizados sin autorización expresa

## 8. Terminación de Cuenta

AGM Broker se reserva el derecho de:
- Suspender o terminar tu cuenta si violas estos términos
- Retener fondos en caso de actividad sospechosa hasta completar la investigación
- Reportar actividades ilegales a las autoridades correspondientes

## 9. Privacidad y Protección de Datos

Tu información personal será tratada conforme a nuestra Política de Privacidad. Al aceptar estos términos, consientes el procesamiento de tus datos personales según lo descrito en dicha política.

## 10. Limitación de Responsabilidad

AGM Broker no será responsable por:
- Pérdidas resultantes de fluctuaciones del mercado
- Interrupciones del servicio debido a mantenimiento o circunstancias fuera de nuestro control
- Errores en cotizaciones de precios debido a condiciones excepcionales del mercado
- Acciones de terceros proveedores de liquidez

## 11. Modificaciones de los Términos

AGM Broker se reserva el derecho de modificar estos términos en cualquier momento. Los cambios significativos serán notificados con al menos 30 días de anticipación. El uso continuado de la plataforma constituye la aceptación de los términos modificados.

## 12. Ley Aplicable y Jurisdicción

Estos términos se regirán e interpretarán de acuerdo con las leyes aplicables. Cualquier disputa se resolverá mediante arbitraje o en los tribunales competentes.

## 13. Contacto

Para preguntas sobre estos Términos y Condiciones, contacta a:
- Email: legal@agmbroker.com
- Soporte: support@agmbroker.com

---

**Última actualización**: 25 de Enero, 2025
**Versión**: 1.0

Al hacer clic en "Aceptar", confirmas que has leído, comprendido y aceptas estar legalmente vinculado por estos Términos y Condiciones.',
  TRUE,
  NOW()
)
ON CONFLICT (version) DO NOTHING;

-- 11. Add helpful comments
COMMENT ON TABLE public.terms_versions IS 'Stores different versions of Terms and Conditions';
COMMENT ON TABLE public.terms_acceptance_audit IS 'Audit trail for Terms and Conditions acceptance';
COMMENT ON FUNCTION public.accept_terms_and_conditions IS 'Records user acceptance of Terms and Conditions with IP and user agent';
