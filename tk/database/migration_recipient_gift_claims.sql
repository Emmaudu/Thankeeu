-- Apply this to existing databases to let recipients claim gift pots themselves.
CREATE TABLE IF NOT EXISTS gift_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL UNIQUE REFERENCES cards(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('transfer', 'shopping', 'spa', 'flowers', 'food')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'rejected')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    claim_type <> 'transfer'
    OR (bank_name IS NOT NULL AND account_number IS NOT NULL AND account_name IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_gift_claims_status ON gift_claims(status);
CREATE INDEX IF NOT EXISTS idx_gift_claims_company ON gift_claims(company_id);

DROP TRIGGER IF EXISTS gift_claims_updated_at ON gift_claims;
CREATE TRIGGER gift_claims_updated_at
  BEFORE UPDATE ON gift_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
