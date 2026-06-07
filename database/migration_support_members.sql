-- Apply this to existing databases created before team-member support was added.
ALTER TABLE support_tickets
  DROP CONSTRAINT IF EXISTS support_tickets_sender_type_check;

ALTER TABLE support_tickets
  ADD CONSTRAINT support_tickets_sender_type_check
  CHECK (sender_type IN ('user', 'company', 'member'));
