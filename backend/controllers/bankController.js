const axios   = require('axios');
const supabase = require('../utils/supabase');
const { pushNotification } = require('../utils/notify');
const { sendEmail } = require('../utils/email');

const PAYSTACK = 'https://api.paystack.co';
const psHeaders = () => ({ Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' });

// GET /api/banks/list — Nigerian bank list from Paystack
const getBankList = async (req, res) => {
  try {
    const r = await axios.get(`${PAYSTACK}/bank?country=nigeria&perPage=100`, { headers: psHeaders() });
    res.json(r.data.data || []);
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

// POST /api/banks/verify — verify account number with Paystack
const verifyAccount = async (req, res) => {
  try {
    const { account_number, bank_code } = req.body;
    if (!account_number || !bank_code) return res.status(400).json({ error: 'account_number and bank_code required' });

    const r = await axios.get(`${PAYSTACK}/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, { headers: psHeaders() });
    res.json({ account_name: r.data.data.account_name, account_number, bank_code });
  } catch (err) {
    res.status(400).json({ error: err.response?.data?.message || 'Could not verify account. Check number and bank.' });
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

    // Create Paystack Transfer Recipient
    let recipientCode = null;
    try {
      const r = await axios.post(`${PAYSTACK}/transferrecipient`, {
        type: 'nuban',
        name: account_name,
        account_number,
        bank_code,
        currency: 'NGN',
      }, { headers: psHeaders() });
      recipientCode = r.data.data?.recipient_code;
    } catch (e) {
      console.warn('Paystack recipient creation failed:', e.response?.data?.message);
    }

    // Upsert bank account
    const { data, error } = await supabase
      .from('bank_accounts')
      .upsert({
        owner_id:   ownerId,
        owner_type: ownerType,
        bank_code, bank_name, account_number, account_name,
        paystack_recipient_code: recipientCode,
        verified: !!recipientCode,
        is_default: true,
        updated_at: new Date(),
      }, { onConflict: 'owner_id,account_number' })
      .select()
      .single();

    if (error) throw error;

    // Mark all other accounts as non-default
    await supabase.from('bank_accounts')
      .update({ is_default: false })
      .eq('owner_id', ownerId)
      .neq('id', data.id);

    res.json({ message: 'Bank account saved!', account: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to save bank account' });
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
    const ownerId = req.user?.id || req.member?.id;
    await supabase.from('bank_accounts').delete().eq('id', req.params.id).eq('owner_id', ownerId);
    res.json({ message: 'Account removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
};

// POST /api/banks/withdraw — initiate Paystack Transfer to saved bank
const initiateWithdrawal = async (req, res) => {
  try {
    const requesterId   = req.user?.id || req.member?.id;
    const requesterType = req.user ? 'user' : 'member';
    if (!requesterId) return res.status(401).json({ error: 'Not authenticated' });

    const { amount, source_type, source_id, bank_account_id } = req.body;
    if (!amount || amount < 100) return res.status(400).json({ error: 'Minimum withdrawal is ₦100' });
    if (!source_type || !bank_account_id) return res.status(400).json({ error: 'source_type and bank_account_id required' });

    // Get bank account
    const { data: bankAccount, error: baErr } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', bank_account_id)
      .eq('owner_id', requesterId)
      .single();
    if (baErr || !bankAccount) return res.status(404).json({ error: 'Bank account not found or not yours' });
    if (!bankAccount.paystack_recipient_code) {
      return res.status(400).json({ error: 'This bank account has not been verified with Paystack. Please re-save your account details.' });
    }

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
        .single();
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
      .single();
    if (wErr) throw wErr;

    // Mark deduction as withdrawal requested
    if (source_type === 'deduction') {
      await supabase.from('deduction_requests')
        .update({ withdrawal_requested: true, withdrawal_id: withdrawal.id })
        .eq('id', source_id);
    }

    // Initiate Paystack Transfer
    const ref = `TK-WD-${Date.now()}-${withdrawal.id.slice(0,8)}`;
    let transferCode = null;
    try {
      const t = await axios.post(`${PAYSTACK}/transfer`, {
        source:    'balance',
        amount:    Math.round(amount * 100), // kobo
        recipient: bankAccount.paystack_recipient_code,
        reason:    `Thankeeu ${source_type === 'gift_pot' ? 'gift pot' : 'deduction'} withdrawal`,
        reference: ref,
      }, { headers: psHeaders() });

      transferCode = t.data.data?.transfer_code;

      // Update withdrawal record
      await supabase.from('withdrawals').update({
        status: t.data.data?.status === 'success' ? 'success' : 'processing',
        paystack_transfer_code: transferCode,
        paystack_reference:     ref,
      }).eq('id', withdrawal.id);

      // Reduce card total_collected if gift_pot
      if (source_type === 'gift_pot') {
        await supabase.from('cards')
          .update({ total_collected: supabase.raw(`total_collected - ${amount}`) })
          .eq('id', source_id);
      }

    } catch (transferErr) {
      console.error('Paystack transfer failed:', transferErr.response?.data);
      await supabase.from('withdrawals').update({
        status: 'failed',
        failure_reason: transferErr.response?.data?.message || 'Paystack transfer failed',
        paystack_reference: ref,
      }).eq('id', withdrawal.id);

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
    res.status(500).json({ error: err.message || 'Withdrawal failed' });
  }
};

module.exports = { getBankList, verifyAccount, saveBankAccount, getMyAccounts, deleteBankAccount, initiateWithdrawal };

// POST /api/banks/withdraw-gift — recipient withdraws their gift pot
const withdrawGift = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { card_slug } = req.body;
    if (!card_slug) return res.status(400).json({ error: 'card_slug is required' });

    // Verify this user is the recipient of this card (email match or received_cards entry)
    const { data: card } = await supabase
      .from('cards').select('*').eq('slug', card_slug).single();
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const { data: receivedEntry } = await supabase
      .from('received_cards')
      .select('id')
      .eq('card_id', card.id)
      .eq('recipient_user_id', userId)
      .maybeSingle();

    const { data: userInfo } = await supabase
      .from('users').select('email').eq('id', userId).single();

    const isEmailRecipient = card.recipient_email?.toLowerCase() === userInfo?.email?.toLowerCase();

    if (!receivedEntry && !isEmailRecipient) {
      return res.status(403).json({ error: 'You are not the recipient of this card' });
    }

    if ((card.total_collected || 0) <= 0) {
      return res.status(400).json({ error: 'No gift pot to withdraw' });
    }

    if (card.gift_withdrawn) {
      return res.status(400).json({ error: 'Gift pot has already been withdrawn' });
    }

    // Get recipient's saved bank account
    const { data: bank } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_default', true)
      .maybeSingle();

    if (!bank?.paystack_recipient_code) {
      return res.status(400).json({ error: 'Please add and verify your bank account in Settings before withdrawing' });
    }

    // Calculate payout: total minus 3.5% platform fee
    const gross = card.total_collected;
    const fee = Math.round(gross * 0.035);
    const net = gross - fee;

    // Initiate Paystack transfer
    const transferRef = `gift_${card.id}_${Date.now()}`;
    const r = await axios.post(`${PAYSTACK}/transfer`, {
      source: 'balance',
      amount: net * 100, // kobo
      recipient: bank.paystack_recipient_code,
      reason: `Gift pot withdrawal — ${card.title || card.recipient_name + "'s card"}`,
      reference: transferRef,
    }, { headers: psHeaders() });

    if (!r.data.status) throw new Error(r.data.message || 'Transfer initiation failed');

    // Mark as withdrawn
    await supabase.from('cards').update({
      gift_withdrawn: true,
      gift_withdrawn_at: new Date(),
      gift_payout_reference: transferRef,
      gift_payout_amount: net,
    }).eq('id', card.id);

    res.json({
      message: `₦${net.toLocaleString('en-NG')} is on its way to your account!`,
      amount: net,
      fee,
      gross,
      reference: transferRef,
    });
  } catch (err) {
    console.error('withdrawGift error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Withdrawal failed. Please try again.' });
  }
};
