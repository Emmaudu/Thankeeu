const axios = require('axios');
const supabase = require('../utils/supabase');
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();
const { sendEmail } = require('../utils/email');
const { pushNotification, pushNotificationBulk } = require('../utils/notify');
const { nanoid } = require('nanoid');

const generateSlug = (recipientName, occasion) => {
  const base = `${recipientName}-${occasion}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${base}-${nanoid(6)}`;
};
// Helper: notify all members in a company about a card (used after HR approval)
const notifyAllCompany = async (companyId, card, slug, recipientName, occasion, title, giftEnabled, deadline, creatorName, creatorEmail, signLink) => {
  const { data: allMembers } = await supabase
    .from('company_members')
    .select('id, email, first_name, last_name')
    .eq('company_id', companyId)
    .eq('status', 'approved');

  const notifyRows = [];
  for (const m of (allMembers || [])) {
    if (m.email === creatorEmail) continue;
    notifyRows.push({
      recipient_id:   m.id,
      recipient_type: 'member',
      type:    'sign_card',
      title:   `✍️ Sign ${recipientName}'s card`,
      body:    `${creatorName} created a company-wide card for ${recipientName}. Add your message!`,
      data:    { card_slug: slug, card_title: title || `${recipientName}'s Card` },
    });
    sendEmail({ to: m.email, template: 'cardInvite', data: {
      memberName: m.first_name,
      creatorName, recipientName, occasion,
      scope: 'your entire company', signLink,
      giftEnabled,
      deadline: deadline ? new Date(deadline).toLocaleDateString('en') : 'soon',
    }}).catch(() => {});
  }
  if (notifyRows.length) await pushNotificationBulk(notifyRows);
  await supabase.from('cards').update({ scope_approved_at: new Date() }).eq('id', card.id);
};



const createCard = async (req, res) => {
  try {
    const {
      recipient_name, recipient_email, occasion, title, design_theme,
      background_color, font_style, is_gift_enabled, gift_type, suggested_amount,
      send_date, deadline, allow_private_messages, send_reminders, hide_amounts,
      // Member-created card extras
      company_id, created_by_member_id, notification_scope, status: reqStatus
    } = req.body;

    if (!recipient_name?.trim() || !occasion) {
      return res.status(400).json({ error: 'Recipient name and occasion are required' });
    }

    const effectiveCompanyId = req.member?.company_id || req.company?.id || company_id;
    const effectiveMemberId = req.member?.id || created_by_member_id;
    const slug = generateSlug(recipient_name, occasion);

    // Build insert object — font_style is optional (requires migration)
    const insertData = {
      slug,
      creator_id: req.user?.id || null,
      recipient_name: recipient_name.trim(),
      recipient_email: recipient_email?.trim() || null,
      occasion,
      title: title?.trim() || `${recipient_name}'s Card`,
      design_theme, background_color, is_gift_enabled,
      gift_type, suggested_amount,
      send_date: send_date || null,
      deadline: deadline || null,
      allow_private_messages, send_reminders, hide_amounts,
      status: reqStatus || 'draft',
      ...(effectiveCompanyId && { company_id: effectiveCompanyId }),
      ...(effectiveMemberId && { created_by_member_id: effectiveMemberId }),
      ...(notification_scope && { notification_scope }),
    };

    // Try with font_style first, fall back without if column doesn't exist
    let card, error;
    ({ data: card, error } = await supabase
      .from('cards')
      .insert({ ...insertData, font_style: font_style || 'elegant' })
      .select()
      .single());

    // If font_style column doesn't exist, retry without it
    if (error && error.message && error.message.includes('font_style')) {
      ({ data: card, error } = await supabase
        .from('cards')
        .insert(insertData)
        .select()
        .single());
    }

    if (error) throw error;

    // --- Notify members when a member or HR creates a card ---
    if ((effectiveMemberId || req.company) && effectiveCompanyId && notification_scope) {
      try {
        let creatorDept   = null;
        let creatorName   = 'Your colleague';
        let creatorEmail  = null;

        if (effectiveMemberId) {
          const { data: creator } = await supabase
            .from('company_members')
            .select('first_name, last_name, department, email')
            .eq('id', effectiveMemberId)
            .single();
          if (creator) {
            creatorDept  = creator.department;
            creatorName  = `${creator.first_name} ${creator.last_name}`;
            creatorEmail = creator.email;
          }
        } else if (req.company) {
          creatorName  = req.company.contact_person || req.company.name;
          creatorEmail = req.company.email;
        }

        const signLink = `${process.env.FRONTEND_URL || 'https://thankeeu.com'}/sign/${slug}`;

        if (notification_scope === 'department' && creatorDept) {
          // Notify only creator's department
          const { data: deptMembers } = await supabase
            .from('company_members')
            .select('id, email, first_name, last_name')
            .eq('company_id', effectiveCompanyId)
            .eq('department', creatorDept)
            .eq('status', 'approved');

          const notifyRows = [];
          for (const m of (deptMembers || [])) {
            if (m.email === creatorEmail) continue; // skip creator
            // Dashboard notification
            notifyRows.push({
              recipient_id:   m.id,
              recipient_type: 'member',
              type:    'sign_card',
              title:   `✍️ Sign ${recipient_name}'s card`,
              body:    `${creatorName} created a card for ${recipient_name}. Add your message!`,
              data:    { card_slug: slug, card_title: title || `${recipient_name}'s Card` },
            });
            // Email
            sendEmail({ to: m.email, template: 'cardInvite', data: {
              memberName: m.first_name,
              creatorName, recipientName: recipient_name, occasion,
              scope: `${creatorDept} department`, signLink,
              giftEnabled: is_gift_enabled,
              deadline: deadline ? new Date(deadline).toLocaleDateString('en') : 'soon',
            }}).catch(() => {});
          }
          if (notifyRows.length) await pushNotificationBulk(notifyRows);

        } else if (notification_scope === 'company_wide') {
          // Create a notification_approval request for HR to approve
          await supabase.from('notification_approvals').insert({
            card_id:           card.id,
            company_id:        effectiveCompanyId,
            requested_by_id:   effectiveMemberId || req.company?.id,
            requested_by_type: effectiveMemberId ? (creatorDept ? 'team_member' : 'hr') : 'hr',
            status:            req.company ? 'approved' : 'pending', // HR auto-approved
          });

          if (req.company) {
            // HR created the card — auto-approve and notify all departments now
            await notifyAllCompany(effectiveCompanyId, card, slug, recipient_name, occasion, title, is_gift_enabled, deadline, creatorName, creatorEmail, signLink);
          } else {
            // Member created — notify HR to approve
            const { data: company } = await supabase.from('companies').select('email, contact_person, name, id').eq('id', effectiveCompanyId).single();
            if (company) {
              await sendEmail({ to: company.email, template: 'cardApprovalRequest', data: {
                hrName: company.contact_person || 'HR', companyName: company.name,
                creatorName, recipientName: recipient_name, occasion,
                cardTitle: title || `${recipient_name}'s Card`, cardSlug: slug,
              }}).catch(() => {});
              // Dashboard notification for HR
              await pushNotification(company.id, 'company', 'card_approval', `🏢 Approval needed: ${recipient_name}'s card`,
                `${creatorName} wants to notify the whole company about ${recipient_name}'s ${occasion} card.`,
                { card_slug: slug, creator_name: creatorName, recipient_name });
            }
          }
        }
      } catch (notifyErr) {
        console.error('Notification error:', notifyErr);
      }
    }

    res.status(201).json(card);
  } catch (err) {
    console.error('Create card error:', err);
    res.status(500).json({ error: err.message || 'Failed to create card' });
  }
};

const getUserCards = async (req, res) => {
  try {
    const { data: cards, error } = await supabase
      .from('cards')
      .select(`*, messages(count)`)
      .eq('creator_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json((cards || []).map(card => ({
      ...card,
      signed_count: card.messages?.[0]?.count || 0,
      messages: undefined
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
};

const getCard = async (req, res) => {
  try {
    const { slug } = req.params;
    const { token } = req.query;

    const { data: card, error } = await supabase
      .from('cards')
      .select(`*, messages(*), contributions(amount, status, contributor_name)`)
      .eq('slug', slug)
      .single();

    if (error || !card) return res.status(404).json({ error: 'Card not found' });

    const isCreator = req.user?.id === card.creator_id
      || req.member?.id === card.created_by_member_id
      || (req.company?.id && card.company_id === req.company.id);
    // isRecipient: valid access_token, email match, OR card was transferred to this user
    let isRecipient = (token && token === card.access_token)
      || (req.user?.email && card.recipient_email &&
          req.user.email.toLowerCase() === card.recipient_email.toLowerCase());

    // Check received_cards table for transfers (different email case)
    if (!isRecipient && req.user?.id) {
      const { data: received } = await supabase
        .from('received_cards').select('id')
        .eq('card_id', card.id).eq('recipient_user_id', req.user.id).maybeSingle();
      if (received) isRecipient = true;
    }
    const isContributor = true;

    if (!isCreator && !isRecipient && card.status === 'draft') {
      return res.status(403).json({ error: 'Card not available yet' });
    }

    // Filter private messages for non-recipients
    if (!isRecipient && !isCreator) {
      card.messages = card.messages?.filter(m => !m.is_private) || [];
    }

    // Hide contribution amounts if configured
    if (card.hide_amounts && !isCreator && !isRecipient) {
      card.contributions = card.contributions?.map(c => ({ ...c, amount: null }));
      card.messages = card.messages?.map(message => ({ ...message, contributed_amount: null }));
    }

    res.json({ ...card, isCreator, isRecipient });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch card' });
  }
};

const updateCard = async (req, res) => {
  try {
    const { slug } = req.params;
    const updates = req.body;

    const { data: card } = await supabase.from('cards').select('creator_id, created_by_member_id, company_id').eq('slug', slug).single();
    const isOwner = (req.user && card.creator_id === req.user.id) || (req.member && card.created_by_member_id === req.member.id) || (req.company && card.company_id === req.company.id);
    if (!card || !isOwner) return res.status(403).json({ error: 'Not authorized' });

    const { data: updated, error } = await supabase
      .from('cards').update({ ...updates, updated_at: new Date() })
      .eq('slug', slug).select().single();

    if (error) throw error;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update card' });
  }
};

const activateCard = async (req, res) => {
  try {
    const { slug } = req.params;
    const { inviteEmails } = req.body;

    const { data: card } = await supabase.from('cards').select('*').eq('slug', slug).single();

    // Auth check: works for regular user, member, or HR company
    const isOwner =
      (req.user   && card.creator_id            === req.user.id)   ||
      (req.member && card.created_by_member_id  === req.member.id) ||
      (req.company && card.company_id           === req.company.id);
    if (!card || !isOwner) return res.status(403).json({ error: 'Not authorized' });

    if (card.status !== 'active') {
      const { error } = await supabase.from('cards').update({ status: 'active' }).eq('slug', slug);
      if (error) throw error;
    }

    // Resolve creator display name for invite emails
    const creatorName =
      req.user?.full_name ||
      (req.member ? `${req.member.first_name} ${req.member.last_name}`.trim() : null) ||
      req.company?.contact_person || req.company?.name || 'Someone';

    // Send invites if emails provided
    if (inviteEmails?.length) {
      const deadline = card.deadline ? new Date(card.deadline).toLocaleDateString('en') : 'soon';
      const emailJobs = inviteEmails.map(email =>
        sendEmail({
          to: email,
          template: 'cardInvite',
          data: {
            creatorName,
            recipientName: card.recipient_name,
            occasion: card.occasion,
            cardSlug: card.slug,
            giftEnabled: card.is_gift_enabled,
            deadline
          }
        })
      );

      Promise.allSettled(emailJobs).then(results => {
        const failed = results.filter(result => result.status === 'rejected');
        if (failed.length) console.error(`Failed to send ${failed.length} card invitation(s)`);
      });
    }

    res.json({ message: 'Card activated', slug });
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate card' });
  }
};

const OCCASION_EMOJI = {
  birthday: '🎂', anniversary: '💍', leaving: '👋', promotion: '🌟',
  wedding: '💒', baby_shower: '👶', retirement: '🏖️', graduation: '🎓',
  valentine: '💝', christmas: '🎄', get_well: '🌷', other: '🎉',
};

const sendCard = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: card } = await supabase.from('cards').select('*').eq('slug', slug).single();

    // Auth: regular user, team member, or HR company
    const isOwner =
      (req.user   && card.creator_id            === req.user.id)   ||
      (req.member && card.created_by_member_id  === req.member.id) ||
      (req.company && card.company_id           === req.company.id);
    if (!card || !isOwner) return res.status(403).json({ error: 'Not authorized' });

    if (!card.recipient_email)
      return res.status(400).json({ error: 'Recipient email required to send card' });

    const { data: messages } = await supabase
      .from('messages').select('count').eq('card_id', card.id);

    await supabase.from('cards').update({
      status: 'sent', recipient_notified: true, updated_at: new Date()
    }).eq('slug', slug);

    // Auto-link card to recipient's account if they already have one
    const { data: existingUser } = await supabase
      .from('users').select('id').eq('email', card.recipient_email.toLowerCase()).maybeSingle();
    if (existingUser) {
      await supabase.from('received_cards').upsert({
        card_id: card.id,
        recipient_user_id: existingUser.id,
        transferred_by: req.user?.id || req.member?.id || null,
        transferred_at: new Date(),
      }, { onConflict: 'card_id,recipient_user_id' });
    }

    await sendEmail({
      to: card.recipient_email,
      template: 'cardDelivery',
      data: {
        recipientName: card.recipient_name,
        recipientEmail: card.recipient_email,
        occasion: card.occasion.replace(/_/g, ' '),
        occasionEmoji: OCCASION_EMOJI[card.occasion] || '🎉',
        cardSlug: card.slug,
        accessToken: card.access_token,
        senderCount: messages?.[0]?.count || 0,
        giftAmount: card.total_collected > 0 ? card.total_collected : null,
        appUrl: FRONTEND_URL,
      }
    });

    res.json({ message: 'Card sent to recipient!' });
  } catch (err) {
    console.error('sendCard error:', err);
    res.status(500).json({ error: 'Failed to send card' });
  }
};

const deleteCard = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: card } = await supabase.from('cards').select('creator_id, created_by_member_id, company_id').eq('slug', slug).single();
    const isOwner2 = (req.user && card.creator_id === req.user.id) || (req.member && card.created_by_member_id === req.member.id) || (req.company && card.company_id === req.company.id);
    if (!card || !isOwner2) return res.status(403).json({ error: 'Not authorized' });

    await supabase.from('cards').delete().eq('slug', slug);
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete card' });
  }
};

const getPublicCard = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: card, error } = await supabase
      .from('cards')
      .select('*, messages(id, author_name, content, is_private, font_style, media_url, media_type, media_gallery, reactions, contributed_amount, payment_verified, created_at, gift_type, product_id, product_name, product_price, product_vendor_id, product_vendor_name, product_vendor_slug), contributions(amount, contributor_name, status)')
      .eq('slug', slug)
      .in('status', ['active', 'sent'])
      .single();

    if (error || !card) return res.status(404).json({ error: 'Card not found or not active' });

    const signedCount = card.messages?.length || 0;
    const verifiedContribs = card.contributions?.filter(c => c.status === 'success') || [];
    const totalCollected = verifiedContribs.reduce((s, c) => s + (c.amount || 0), 0);

    const publicMessages = (card.messages || [])
      .filter(message => !message.is_private)
      .map(message => card.hide_amounts ? { ...message, contributed_amount: null } : message);

    res.json({
      ...card,
      messages: publicMessages,
      signed_count: signedCount,
      total_collected: totalCollected,
      contributors: card.hide_amounts ? [] : verifiedContribs.map(c => c.contributor_name)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch card' });
  }
};

const getRecipientCard = async (req, res) => {
  try {
    const { slug } = req.params;
    const { token } = req.query;
    if (!token) return res.status(401).json({ error: 'Recipient token required' });

    const { data: card, error } = await supabase
      .from('cards')
      .select('*, messages(*), contributions(amount, status, contributor_name)')
      .eq('slug', slug)
      .eq('access_token', token)
      .single();

    if (error || !card) return res.status(403).json({ error: 'Invalid recipient link' });

    const verifiedContributions = (card.contributions || []).filter(c => c.status === 'success');
    const totalCollected = verifiedContributions.reduce((sum, contribution) => sum + (contribution.amount || 0), 0);
    const { data: wallet } = await supabase
      .from('contribution_wallets')
      .select('amount_to_celebrant, disbursed')
      .eq('card_id', card.id)
      .maybeSingle();
    const { data: claim } = await supabase
      .from('gift_claims')
      .select('status, claim_type, amount, created_at')
      .eq('card_id', card.id)
      .maybeSingle();

    const { access_token: _accessToken, ...recipientCard } = card;

    res.json({
      ...recipientCard,
      isRecipient: true,
      signed_count: card.messages?.length || 0,
      total_collected: totalCollected,
      claimable_amount: wallet?.amount_to_celebrant ?? totalCollected,
      gift_claim: claim || null,
      wallet_disbursed: wallet?.disbursed || false
    });
  } catch (err) {
    console.error('Recipient card error:', err);
    res.status(500).json({ error: 'Failed to fetch recipient card' });
  }
};

const claimGift = async (req, res) => {
  try {
    const { slug } = req.params;
    const { token, claim_type, bank_name, account_number, account_name } = req.body;
    const validClaimTypes = ['transfer', 'shopping', 'spa', 'flowers', 'food'];

    if (!token) return res.status(401).json({ error: 'Recipient token required' });
    if (!validClaimTypes.includes(claim_type)) {
      return res.status(400).json({ error: 'Select a valid gift option' });
    }
    if (
      claim_type === 'transfer'
      && (!bank_name?.trim() || !account_number?.trim() || !account_name?.trim())
    ) {
      return res.status(400).json({ error: 'Complete your bank details to claim by transfer' });
    }
    if (claim_type === 'transfer' && !/^\d{10}$/.test(account_number.trim())) {
      return res.status(400).json({ error: 'Enter a valid 10-digit account number' });
    }

    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id, recipient_name, recipient_email, access_token, company_id')
      .eq('slug', slug)
      .eq('access_token', token)
      .single();
    if (cardError || !card) return res.status(403).json({ error: 'Invalid recipient link' });

    const { data: existingClaim } = await supabase
      .from('gift_claims')
      .select('id, status')
      .eq('card_id', card.id)
      .maybeSingle();
    if (existingClaim) {
      return res.status(409).json({ error: `This gift already has a ${existingClaim.status} claim` });
    }

    const { data: wallet } = await supabase
      .from('contribution_wallets')
      .select('amount_to_celebrant, disbursed')
      .eq('card_id', card.id)
      .maybeSingle();
    if (wallet?.disbursed) return res.status(409).json({ error: 'This gift has already been paid out' });

    const { data: contributions, error: contributionError } = await supabase
      .from('contributions')
      .select('amount')
      .eq('card_id', card.id)
      .eq('status', 'success');
    if (contributionError) throw contributionError;

    const totalCollected = (contributions || []).reduce((sum, contribution) => sum + (contribution.amount || 0), 0);
    const amount = wallet?.amount_to_celebrant ?? totalCollected;
    if (amount <= 0) return res.status(400).json({ error: 'There is no gift balance available to claim' });

    const { data: claim, error } = await supabase
      .from('gift_claims')
      .insert({
        card_id: card.id,
        company_id: card.company_id || null,
        recipient_name: card.recipient_name,
        recipient_email: card.recipient_email,
        claim_type,
        amount,
        bank_name: claim_type === 'transfer' ? bank_name.trim() : null,
        account_number: claim_type === 'transfer' ? account_number.trim() : null,
        account_name: claim_type === 'transfer' ? account_name.trim() : null,
        status: 'pending'
      })
      .select('id, claim_type, amount, status, created_at')
      .single();

    if (error) throw error;

    // Bug 10 fix: attempt immediate FLW bank transfer for 'transfer' claim type
    if (claim_type === 'transfer') {
      const FLW = 'https://api.flutterwave.com/v3';
      const flwH = () => ({ Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 'Content-Type': 'application/json' });
      const transferRef = `TK-GIFT-CLAIM-${claim.id.slice(0,8)}-${Date.now()}`;
      try {
        // Bug 2 fix: resolve account to get bank code, then transfer
        // GiftCheckout collects account_number + bank_name but not bank_code
        // Resolve it first if bank_code not provided
        let resolvedBankCode = req.body.bank_code || '';
        if (!resolvedBankCode && req.body.bank_name) {
          // Map common bank names to FLW codes
          const BANK_MAP = {
            'access bank': '044', 'first bank': '011', 'gtbank': '058', 'guaranty trust': '058',
            'zenith bank': '057', 'uba': '033', 'fidelity bank': '070', 'fcmb': '214',
            'sterling bank': '232', 'union bank': '032', 'wema bank': '035', 'polaris bank': '076',
            'ecobank': '050', 'kuda': '090267', 'opay': '100004', 'palmpay': '100033',
            'moniepoint': '50515', 'stanbic': '221',
          };
          const nameLower = req.body.bank_name.toLowerCase();
          for (const [key, code] of Object.entries(BANK_MAP)) {
            if (nameLower.includes(key)) { resolvedBankCode = code; break; }
          }
        }
        if (!resolvedBankCode) {
          // Can't reliably make transfer without bank code — keep as pending
          throw new Error('Bank code could not be resolved. Claim saved as pending for manual processing.');
        }

        const t = await axios.post(`${FLW}/transfers`, {
          account_bank:     resolvedBankCode,
          account_number:   account_number.trim(),
          amount:           amount,
          narration:        `Thankeeu gift pot — ${card.recipient_name}`,
          currency:         'NGN',
          reference:        transferRef,
          beneficiary_name: account_name.trim(),
          debit_currency:   'NGN',
        }, { headers: flwH() });

        const transferStatus = t.data.data?.status || 'NEW';
        await supabase.from('gift_claims').update({
          status: transferStatus === 'FAILED' ? 'failed' : 'processing',
          flw_transfer_id: String(t.data.data?.id || ''),
          flw_reference:   transferRef,
          processed_at:    new Date(),
        }).eq('id', claim.id);

        if (wallet?.id) {
          await supabase.from('contribution_wallets').update({ disbursed: true, disbursed_at: new Date() }).eq('id', wallet.id);
        }

        return res.status(201).json({
          message: 'Your gift transfer has been initiated! The money typically arrives within a few minutes to hours.',
          claim: { ...claim, status: 'processing' },
        });
      } catch (transferErr) {
        // Transfer failed — keep as pending for admin to process
        console.error('Gift transfer failed:', transferErr.response?.data || transferErr.message);
        await supabase.from('gift_claims').update({
          status: 'pending',
          admin_note: `Auto-transfer failed: ${transferErr.response?.data?.message || transferErr.message}. Requires manual processing.`,
        }).eq('id', claim.id);
        // Still return success — claim is recorded, admin will process it
        return res.status(201).json({
          message: 'Your gift claim was submitted. There was a brief delay with the transfer — we will process it within 2–4 hours.',
          claim,
        });
      }
    }

    res.status(201).json({
      message: claim_type === 'transfer'
        ? 'Your gift claim was submitted. We will transfer to your account within 24 hours.'
        : `Your ${claim_type} gift was claimed! We will reach out within 24 hours to arrange delivery.`,
      claim
    });
  } catch (err) {
    console.error('Gift claim error:', err);
    res.status(500).json({ error: 'Failed to submit gift claim' });
  }
};

// Get cards created by a team member (for their history tab)
const getMemberCards = async (req, res) => {
  try {
    const memberId = req.member.id;
    const { data: cards, error } = await supabase
      .from('cards')
      .select('id, slug, title, recipient_name, occasion, status, total_collected, created_at, is_gift_enabled, messages(count)')
      .eq('created_by_member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json((cards || []).map(card => ({
      ...card,
      signed_count: card.messages?.[0]?.count || 0,
      messages: undefined
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch card history' });
  }
};

// POST /api/cards/:slug/approve-scope — HR approves company-wide notification
const approveCardScope = async (req, res) => {
  try {
    if (!req.company) return res.status(403).json({ error: 'HR access required' });

    const { slug } = req.params;
    const { data: card } = await supabase
      .from('cards')
      .select('id, title, recipient_name, occasion, is_gift_enabled, deadline, company_id, created_by_member_id, notification_scope')
      .eq('slug', slug)
      .single();

    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.company_id !== req.company.id) return res.status(403).json({ error: 'Not your company\'s card' });

    // Update approval record
    await supabase.from('notification_approvals')
      .update({ status: 'approved', approved_at: new Date(), approved_by_id: req.company.id })
      .eq('card_id', card.id)
      .eq('status', 'pending');

    // Get creator info
    let creatorName  = req.company.contact_person || req.company.name;
    let creatorEmail = req.company.email;
    if (card.created_by_member_id) {
      const { data: creator } = await supabase.from('company_members')
        .select('first_name, last_name, email').eq('id', card.created_by_member_id).single();
      if (creator) { creatorName = `${creator.first_name} ${creator.last_name}`; creatorEmail = creator.email; }

      // Notify the creator that it was approved
      await pushNotification(card.created_by_member_id, 'member', 'card_approved',
        `✅ Company-wide card approved!`,
        `HR approved your card for ${card.recipient_name}. All departments have been notified.`,
        { card_slug: slug });
    }

    const signLink = `${process.env.FRONTEND_URL || 'https://thankeeu.com'}/sign/${slug}`;
    await notifyAllCompany(card.company_id, card, slug, card.recipient_name, card.occasion,
      card.title, card.is_gift_enabled, card.deadline, creatorName, creatorEmail, signLink);

    res.json({ message: `Company-wide notifications sent for ${card.recipient_name}'s card` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve card scope' });
  }
};


// ── HR: get company's own created cards ────────────────────────────────────
const getCompanyCards = async (req, res) => {
  try {
    const { data } = await supabase.from('cards')
      .select('id, slug, title, recipient_name, recipient_email, occasion, status, total_collected, created_at, send_date, design_theme, notification_scope, scope_approved_at, department')
      .eq('company_id', req.company.id)
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch cards' }); }
};

// ── HR: get delivered cards (status=sent) ─────────────────────────────────
const getCompanyDeliveredCards = async (req, res) => {
  try {
    const { data } = await supabase.from('cards')
      .select('id, slug, title, recipient_name, recipient_email, occasion, status, total_collected, created_at, send_date')
      .eq('company_id', req.company.id).eq('status', 'sent')
      .order('send_date', { ascending: false });
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch delivered cards' }); }
};

// ── HR: get received cards (transferred to HR company) ─────────────────────
const getCompanyReceivedCards = async (req, res) => {
  try {
    const { data: transfers } = await supabase.from('received_cards')
      .select('card_id, created_at')
      .eq('recipient_user_id', req.company.id)
      .eq('recipient_type', 'company')
      .order('created_at', { ascending: false });
    const ids = (transfers || []).map(t => t.card_id);
    if (!ids.length) return res.json([]);
    const { data } = await supabase.from('cards')
      .select('id, slug, title, recipient_name, occasion, status, total_collected, created_at')
      .in('id', ids);
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch received cards' }); }
};

// ── HR: transfer card to a team member ────────────────────────────────────
const transferCardToMember = async (req, res) => {
  try {
    const { slug } = req.params;
    const { member_id } = req.body;
    if (!member_id) return res.status(400).json({ error: 'member_id required' });

    const { data: card } = await supabase.from('cards').select('id, title, recipient_name').eq('slug', slug).single();
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const { data: member } = await supabase.from('company_members')
      .select('id, email, first_name, last_name, company_id').eq('id', member_id).single();
    if (!member || member.company_id !== req.company.id)
      return res.status(404).json({ error: 'Member not found in your company' });

    await supabase.from('received_cards').upsert({
      card_id: card.id, card_slug: slug,
      recipient_user_id: member_id, recipient_type: 'member',
      transferred_by: req.company.id,
    }, { onConflict: 'card_id,recipient_user_id' });

    // Activity log
    const { logActivity } = require('../utils/activityLog');
    await logActivity({
      company_id:  req.company.id,
      actor_id:    req.company.id,
      actor_type:  'hr',
      actor_name:  req.company.name || 'HR',
      action:      'transferred_card',
      entity_type: 'card',
      entity_id:   card.id,
      entity_name: card.title || `For ${card.recipient_name}`,
      details:     { to: `${member.first_name} ${member.last_name}` },
    }).catch(() => {});

    res.json({ message: `Card transferred to ${member.first_name} ${member.last_name}` });
  } catch (err) { res.status(500).json({ error: 'Transfer failed' }); }
};

module.exports = {
  getCompanyCards, getCompanyDeliveredCards, getCompanyReceivedCards, transferCardToMember,
  createCard, getUserCards, getCard, updateCard, activateCard, sendCard,
  deleteCard, getPublicCard, getRecipientCard, claimGift, getMemberCards,
  approveCardScope, notifyAllCompany,
};
