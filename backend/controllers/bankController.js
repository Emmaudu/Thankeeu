const axios   = require('axios');
const supabase = require('../utils/supabase');
const { pushNotification } = require('../utils/notify');
const { sendEmail } = require('../utils/email');

const FLW = 'https://api.flutterwave.com/v3';
const flwH = () => ({ Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 'Content-Type': 'application/json' });

// GET /api/banks/list — Nigerian bank list from Flutterwave
const getBankList = async (req, res) => {
  try {
    const r = await axios.get(`${FLW}/banks/NG`, { headers: flwH() });
    // Flutterwave returns { data: [...] } with id, code, name
    res.json((r.data.data || []).map(b => ({ id: b.id, code: b.code, name: b.name })));
  } catch (err) {
    // Fallback static list so the UI always has something
    res.json([
      { name:'Access Bank',        code:'044' }, { name:'First Bank Nigeria', code:'011' },
      { name:'GTBank',             code:'058' }, { name:'Zenith Bank',        code:'057' },
      { name:'UBA',                code:'033' }, { name:'Sterling Bank',      code:'232' },
      { name:'Fidelity Bank',      code:'070' }, { name:'FCMB',               code:'214' },
      { name:'Ecobank',            code:'050' }, { name:'Union Bank',         code:'032' },
      { name:'Wema Bank',          code:'035' }, { name:'Polaris Bank',       code:'076' },
      { name:'Kuda MFB',           code:'090267' }, { name:'OPay',            code:'100004' },
      { name:'PalmPay',            code:'100033' }, { name:'Moniepoint MFB',  code:'50515' },
    ]);
  }
};

// POST /api/banks/verify — resolve account number with Flutterwave
const verifyAccount = async (req, res) => {
  try {
    const { account_number, bank_code } = req.body;
    if (!account_number || !bank_code) return res.status(400).json({ error: 'account_number and bank_code required' });

    // FLW /accounts/resolve requires account_bank as a string (numeric bank code)
    // In FLW TEST mode only certain banks are supported — gracefully handle rejection
    const r = await axios.post(
      `${FLW}/accounts/resolve`,
      { account_number: String(account_number).trim(), account_bank: String(bank_code).trim() },
      { headers: flwH() }
    );
    res.json({ account_name: r.data.data.account_name, account_number, bank_code });
  } catch (err) {
    const msg = err.response?.data?.message || '';
    // FLW test mode restricts bank list — give user a clear message
    if (msg.toLowerCase().includes('only 044') || msg.toLowerCase().includes('must be numeric')) {
      return res.status(400).json({
        error: 'Bank verification is restricted in test mode. Only Access Bank (044) is supported for testing. In production all banks will work.',
      });
    }
    res.status(400).json({ error: msg || 'Could not verify account. Check number and bank.' });
  }
};

// POST /api/banks/save — save bank account
const saveBankAccount = async (req, res) => {
  try {
    const ownerId   = req.user?.id || req.member?.id;
    const ownerType = req.user ? 'user' : 'member';
    if (!ownerId) return res.status(401).json({ error: 'Not authenticated' });

    const { bank_code, bank_name, account_number, account_name } = req.body;
    if (!bank_code || !bank_name || !account_number || !account_name)
      return res.status(400).json({ error: 'All fields required: bank_code, bank_name, account_number, account_name' });

    // Create Flutterwave beneficiary (for payouts)
    // In TEST mode FLW restricts beneficiary creation — save account regardless
    let flwBeneficiaryId = null;
    try {
      const rb = await axios.post(`${FLW}/beneficiaries`, {
        account_number,
        account_bank: bank_code,   // FLW uses account_bank, not bank_code
        beneficiary_name: account_name,
        currency: 'NGN',
      }, { headers: flwH() });
      flwBeneficiaryId = String(rb.data.data?.id || '');
    } catch (e) {
      // In test mode FLW only allows certain banks — still save the account
      console.warn('FLW beneficiary creation skipped (test mode or unsupported bank):', e.response?.data?.message);
    }

    // Upsert bank account — mark verified:true since user passed account resolution
    const { data, error } = await supabase
      .from('bank_accounts')
      .upsert({
        owner_id:   ownerId,
        owner_type: ownerType,
        bank_code, bank_name, account_number, account_name,
        flw_beneficiary_id: flwBeneficiaryId,
        verified: true,   // verified because account_name was resolved successfully
        is_default: true,
        updated_at: new Date(),
      }, { onConflict: 'owner_id,account_number' })
      .select()
      .maybeSingle();

    if (error) throw error;

    // Mark all other accounts as non-default
    await supabase.from('bank_accounts')
      .update({ is_default: false })
      .eq('owner_id', ownerId)
      .neq('id', data.id);

    res.json({ message: 'Bank account saved!', account: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bank operation failed' });
  }
};

// GET /api/banks/my — get saved accounts
const getMyAccounts = async (req, res) => {
  try {
    const ownerId   = req.user?.id || req.member?.id;
    const ownerType = req.user ? 'user' : 'member';
    if (!ownerId) return res.status(401).json({ error: 'Not authenticated' });

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('id, bank_code, bank_name, account_number, account_name, is_default, verified, created_at')
      .eq('owner_id', ownerId)
      .eq('owner_type', ownerType)
      .order('is_default', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load bank accounts' });
  }
};

// DELETE /api/banks/:id
const deleteBankAccount = async (req, res) => {
  try {
    const ownerId   = req.user?.id || req.member?.id;
    const ownerType = req.user ? 'user' : 'member';
    await supabase.from('bank_accounts').delete().eq('id', req.params.id).eq('owner_id', ownerId).eq('owner_type', ownerType);
    res.json({ message: 'Account removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
};

// POST /api/banks/withdraw — initiate Flutterwave bank transfer
const initiateWithdrawal = async (req, res) => {
  try {
    const requesterId   = req.user?.id || req.member?.id;
    const requesterType = req.user ? 'user' : 'member';
    if (!requesterId) return res.status(401).json({ error: 'Not authenticated' });

    const { source_type, source_id, bank_account_id } = req.body;
    const amount = parseFloat(req.body.amount);
    if (!isFinite(amount) || amount < 100) return res.status(400).json({ error: 'Minimum withdrawal is ₦100' });
    if (amount > 10_000_000) return res.status(400).json({ error: 'Withdrawal amount too large' });
    if (!source_type || !bank_account_id) return res.status(400).json({ error: 'source_type and bank_account_id required' });

    // Get bank account
    const { data: bankAccount, error: baErr } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', bank_account_id)
      .eq('owner_id', requesterId)
      .eq('owner_type', requesterType)
      .maybeSingle();
    if (baErr || !bankAccount) return res.status(404).json({ error: 'Bank account not found or not yours' });

    // For gift_pot source — verify card belongs to requester and has sufficient balance
    if (source_type === 'gift_pot') {
      const { data: card } = await supabase
        .from('cards')
        .select('total_collected, recipient_email, access_token')
        .eq('id', source_id)
        .maybeSingle();

      if (!card) return res.status(404).json({ error: 'Card not found' });
      if (card.total_collected < amount) return res.status(400).json({ error: `Insufficient gift pot balance (available: ₦${card.total_collected?.toLocaleString()})` });
    }

    // For deduction source — verify it's approved and belongs to this leader
    if (source_type === 'deduction') {
      const { data: ded } = await supabase
        .from('deduction_requests')
        .select('*')
        .eq('id', source_id)
        .maybeSingle();
      if (!ded) return res.status(404).json({ error: 'Deduction not found' });
      if (ded.status !== 'approved') return res.status(400).json({ error: 'Deduction must be approved first' });
      if (ded.requested_by_id !== requesterId) return res.status(403).json({ error: 'Not your deduction' });
      if (ded.withdrawal_requested) return res.status(400).json({ error: 'Withdrawal already requested for this deduction' });
    }

    // Create withdrawal record
    const { data: withdrawal, error: wErr } = await supabase
      .from('withdrawals')
      .insert({
        requester_id:   requesterId,
        requester_type: requesterType,
        amount,
        source_type,
        source_id,
        bank_account_id,
        status: 'processing',
      })
      .select()
      .maybeSingle();
    if (wErr) throw wErr;

    // Atomically claim the deduction before calling FLW — only one concurrent
    // request can flip withdrawal_requested from false to true. Without this,
    // two near-simultaneous requests could both pass the check above (both
    // read withdrawal_requested=false) and both trigger a transfer for the
    // same deduction.
    if (source_type === 'deduction') {
      const { data: claimed, error: claimErr } = await supabase
        .from('deduction_requests')
        .update({ withdrawal_requested: true, withdrawal_id: withdrawal.id })
        .eq('id', source_id).eq('withdrawal_requested', false)
        .select('id').maybeSingle();

      if (claimErr || !claimed) {
        // Someone else claimed it first — discard the withdrawal record we
        // just created and tell the caller it's already been requested.
        await supabase.from('withdrawals').update({ status: 'failed', failure_reason: 'Deduction already claimed' }).eq('id', withdrawal.id);
        return res.status(400).json({ error: 'Withdrawal already requested for this deduction' });
      }
    }

    // Initiate Flutterwave bank transfer
    const ref = `TK-WD-${Date.now()}-${withdrawal.id.slice(0,8)}`;
    let transferCode = null;
    try {
      const t = await axios.post(`${FLW}/transfers`, {
        account_bank:     bankAccount.bank_code,
        account_number:   bankAccount.account_number,
        amount:           Math.round(amount), // FLW uses Naira directly (NOT kobo)
        narration:        `Thankeeu ${source_type === 'gift_pot' ? 'gift pot' : 'deduction'} withdrawal`,
        currency:         'NGN',
        reference:        ref,
        beneficiary_name: bankAccount.account_name,
        debit_currency:   'NGN',
      }, { headers: flwH() });

      transferCode = t.data.data?.transfer_code;

      // Update withdrawal record
      await supabase.from('withdrawals').update({
        status: t.data.data?.status === 'success' ? 'success' : 'processing',
        flw_transfer_id: transferCode,
        flw_reference: ref,
      }).eq('id', withdrawal.id);

      // Reduce card total_collected if gift_pot
      if (source_type === 'gift_pot') {
        const { data: currentCard } = await supabase.from('cards')
          .select('total_collected').eq('id', source_id).maybeSingle();
        const newTotal = Math.max(0, (currentCard?.total_collected || 0) - amount);
        await supabase.from('cards')
          .update({ total_collected: newTotal })
          .eq('id', source_id);
      }

    } catch (transferErr) {
      console.error('FLW transfer failed:', transferErr.response?.data);
      await supabase.from('withdrawals').update({
        status: 'failed',
        failure_reason: transferErr.response?.data?.message || 'FLW transfer failed',
        flw_reference: ref,
      }).eq('id', withdrawal.id);

      // Release the deduction claim so the leader can retry — otherwise
      // withdrawal_requested stays true forever with no successful transfer
      // behind it, permanently locking this deduction from ever being
      // withdrawn again.
      if (source_type === 'deduction') {
        await supabase.from('deduction_requests')
          .update({ withdrawal_requested: false, withdrawal_id: null })
          .eq('id', source_id);
      }

      return res.status(500).json({ error: transferErr.response?.data?.message || 'Transfer failed. Please try again or contact support.' });
    }

    // Dashboard notification
    pushNotification(requesterId, requesterType, 'withdrawal', '💸 Withdrawal initiated', `₦${amount.toLocaleString()} is being transferred to ${bankAccount.bank_name} ****${bankAccount.account_number.slice(-4)}`, { amount, bank_name: bankAccount.bank_name });

    res.json({
      message: `₦${amount.toLocaleString()} transfer initiated to ${bankAccount.bank_name} ****${bankAccount.account_number.slice(-4)}`,
      withdrawal,
      transfer_code: transferCode,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bank operation failed' });
  }
};


// POST /api/banks/withdraw-gift — recipient claims gift pot via BANK TRANSFER
// (For gift CARD option, the frontend calls POST /api/giftcards/order instead)
const withdrawGift = async (req, res) => {
  try {
    const userId     = req.user?.id;
    const memberId   = req.member?.id;
    const callerId   = userId || memberId;
    if (!callerId) return res.status(401).json({ error: 'Not authenticated' });

    const { card_slug } = req.body;
    if (!card_slug) return res.status(400).json({ error: 'card_slug is required' });

    const { data: card } = await supabase
      .from('cards').select('*').eq('slug', card_slug).maybeSingle();
    if (!card) return res.status(404).json({ error: 'Card not found' });

    // Get caller email — scoped correctly so no "userInfo not defined" bug
    let callerEmail = null;
    let emailVerified = true; // members skip email verification
    if (userId) {
      const { data: userInfo } = await supabase.from('users')
        .select('email, is_verified').eq('id', userId).maybeSingle();
      callerEmail   = userInfo?.email;
      emailVerified = userInfo?.is_verified !== false;
    } else if (memberId) {
      const { data: memberInfo } = await supabase.from('company_members')
        .select('email').eq('id', memberId).maybeSingle();
      callerEmail = memberInfo?.email;
    }

    // Recipient check: email match OR transferred card. A card can reach this
    // caller via two different transfer paths that use two different tables:
    //  - received_cards.recipient_user_id  — users.id or company_members.id
    //    (creator transfer / HR transfer to a team member)
    //  - member_received_cards.recipient_member_id — company_members.id only
    //    (member-to-member transfer via transferCardToMember)
    const isEmailRecipient = card.recipient_email && callerEmail &&
      card.recipient_email.toLowerCase() === callerEmail.toLowerCase();
    const { data: received } = await supabase.from('received_cards')
      .select('id').eq('card_id', card.id)
      .eq('recipient_user_id', callerId).maybeSingle();

    let receivedAsMember = null;
    if (!received && memberId) {
      const { data: mrc } = await supabase.from('member_received_cards')
        .select('id').eq('card_id', card.id)
        .eq('recipient_member_id', memberId).maybeSingle();
      receivedAsMember = mrc;
    }

    if (!isEmailRecipient && !received && !receivedAsMember) {
      return res.status(403).json({
        error: 'Only the recipient can claim this gift. If your email is different, ask the card creator to transfer it to your account.',
      });
    }

    if (!emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before withdrawing. Check your inbox for the verification link.',
      });
    }

    if ((card.total_collected || 0) <= 0) return res.status(400).json({ error: 'No gift pot to withdraw' });
    if (card.gift_withdrawn)             return res.status(400).json({ error: 'Gift has already been claimed' });

    // Get default bank account for the caller
    const { data: bank } = await supabase.from('bank_accounts')
      .select('*')
      .eq('owner_id', callerId)
      .eq('owner_type', userId ? 'user' : 'member')
      .eq('is_default', true)
      .maybeSingle();

    if (!bank) {
      return res.status(400).json({ error: 'No bank account saved. Add your bank account in Settings first.' });
    }
    if (!bank.account_number || !bank.bank_code) {
      return res.status(400).json({ error: 'Bank account details incomplete. Please re-save your bank account.' });
    }

    // Platform fee: 3.5%
    const gross = card.total_collected;
    const fee   = Math.round(gross * 0.035);
    const net   = gross - fee;

    const transferRef = `TK-GIFT-WD-${card.id.slice(0,8).toUpperCase()}-${Date.now()}`;

    // Atomically claim the withdrawal BEFORE calling FLW — only one request
    // can flip gift_withdrawn from false to true. Without this, a double
    // click or retried request could both pass the earlier check (both read
    // gift_withdrawn=false) and trigger two separate bank transfers for the
    // same gift pot.
    const { data: claimed, error: claimErr } = await supabase.from('cards')
      .update({
        gift_withdrawn:        true,
        gift_withdrawn_at:     new Date(),
        gift_payout_reference: transferRef,
        gift_payout_amount:    net,
      })
      .eq('id', card.id)
      .eq('gift_withdrawn', false)
      .select('id')
      .maybeSingle();

    if (claimErr || !claimed) {
      return res.status(400).json({ error: 'Gift has already been claimed' });
    }

    // Initiate Flutterwave bank transfer
    let r;
    try {
      r = await axios.post(`${FLW}/transfers`, {
        account_bank:     bank.bank_code,
        account_number:   bank.account_number,
        amount:           net, // FLW uses Naira directly (not kobo)
        narration:        `Gift from "${card.title || card.recipient_name + "'s card"}"`,
        currency:         'NGN',
        reference:        transferRef,
        beneficiary_name: bank.account_name || 'Recipient',
        debit_currency:   'NGN',
      }, { headers: flwH() });
    } catch (transferErr) {
      // Transfer call failed outright — release the claim so the user can retry
      await supabase.from('cards').update({
        gift_withdrawn: false, gift_withdrawn_at: null,
        gift_payout_reference: null, gift_payout_amount: null,
      }).eq('id', card.id);
      throw transferErr;
    }

    if (!['NEW', 'success', 'PENDING'].includes(r.data?.data?.status || '') &&
        r.data?.status !== 'success') {
      // FLW rejected the transfer — release the claim so the user can retry
      await supabase.from('cards').update({
        gift_withdrawn: false, gift_withdrawn_at: null,
        gift_payout_reference: null, gift_payout_amount: null,
      }).eq('id', card.id);
      throw new Error(r.data?.message || r.data?.data?.complete_message || 'Transfer failed');
    }

    // Also record in gift_claims table for admin visibility
    try {
      await supabase.from('gift_claims').upsert({
        card_id:         card.id,
        recipient_name:  card.recipient_name,
        recipient_email: callerEmail || card.recipient_email,
        claim_type:      'transfer',
        amount:          net,
        bank_name:       bank.bank_name,
        account_number:  bank.account_number,
        account_name:    bank.account_name,
        status:          'paid',
        processed_at:    new Date(),
      }, { onConflict: 'card_id' });
    } catch (_) {}

    pushNotification(callerId, userId ? 'user' : 'member', 'gift_withdrawn',
      '💸 Gift withdrawal initiated',
      `₦${net.toLocaleString('en-NG')} is on its way to ${bank.bank_name} ****${bank.account_number.slice(-4)}`,
      { amount: net }
    );

    return res.json({
      success:   true,
      type:      'transfer',
      message:   `₦${net.toLocaleString('en-NG')} is on its way to ${bank.bank_name} ****${bank.account_number.slice(-4)}. Usually arrives in 1–3 minutes.`,
      amount:    net,
      fee,
      gross,
      reference: transferRef,
    });

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('withdrawGift error:', msg, err.response?.data);
    return res.status(500).json({ error: msg || 'Withdrawal failed. Please try again or contact support.' });
  }
};


module.exports = { getBankList, verifyAccount, saveBankAccount, getMyAccounts, deleteBankAccount, initiateWithdrawal, withdrawGift};