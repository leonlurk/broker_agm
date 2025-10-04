-- Drop the old constraint
ALTER TABLE copy_relationships 
DROP CONSTRAINT copy_relationships_status_check;

-- Add the new constraint with 'inactive' included
ALTER TABLE copy_relationships 
ADD CONSTRAINT copy_relationships_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'paused'::text, 'stopped'::text]));

-- Verify the new constraint
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'copy_relationships'::regclass
  AND conname = 'copy_relationships_status_check';

-- Now test the UPDATE again
UPDATE copy_relationships
SET 
  status = 'inactive',
  updated_at = now()
WHERE id = 'b180fa07-41d5-495e-ab67-63edc747d569'
RETURNING *;
