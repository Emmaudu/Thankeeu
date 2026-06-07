const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const { nanoid } = require('nanoid');

const generateSlug = (recipientName, occasion) => {
  const base = `${recipientName}-${occasion}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${base}-${nanoid(6)}`;
};

const createCard = async (req, res) => {
  try {
    const {
      recipient_name, recipient_email, occasion, title, design_theme,
      background_color, is_gift_enabled, gift_type, suggested_amount,
      send_date, deadline, allow_private_messages, send_reminders, hide_amounts,
      // Member-created card extras
      company_id, created_by_member_id, notification_scope, status: reqStatus
    } = req.body;

    if (!recipient_name?.trim() || !occasion) {
      return res.status(400).json({ error: 'Recipient name and occasion are required' });
    }

    const effectiveCompanyId = req.member?.company_id || company_id;
    const effectiveMemberId = req.member?.id || created_by_member_id;
    const slug = generateSlug(recipient_name, occasion);

    const { data: card, error } = await supabase
      .from('cards')
      .insert({
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
        // Member card fields (these columns must exist in DB)
        ...(effectiveCompanyId && { company_id: effectiveCompanyId }),
        ...(effectiveMemberId && { created_by_member_id: effectiveMemberId }),
        ...(notification_scope && { notification_scope }),
      })
      .select()
      .single();

    if (error) throw error;

    // --- Notify department/company members when a member creates a card ---
    if (effectiveMemberId && effectiveCompanyId && notification_scope) {
      try {
        // Get the creator member info
        const { data: creator } = await supabase
          .from('company_members')
          .select('first_name, last_name, department, email')
          .eq('id', effectiveMemberId)
          .single();

        if (creator) {
          let memberQuery = supabase
            .from('company_members')
            .select('email, first_name, last_name, department')
            .eq('company_id', effectiveCompanyId)
            .eq('status', 'approved');

          if (notification_scope === 'department') {
            memberQuery = memberQuery.eq('department', creator.department);
          }
          // 'company_wide' — no extra filter, notify everyone

          const { data: membersToNotify } = await memberQuery;

          const signLink = `${process.env.FRONTEND_URL}/sign/${slug}`;
          const creatorFullName = `${creator.first_name} ${creator.last_name}`;

          for (const m of (membersToNotify || [])) {
            // Don't email the creator themselves
            if (m.email === creator.email) continue;
            await sendEmail({
              to: m.email,
              template: 'cardInvite',
              data: {
                creatorName: creatorFullName,
                recipientName: recipient_name,
                occasion,
                cardSlug: slug,
                giftEnabled: is_gift_enabled,
                deadline: deadline ? new Date(deadline).toLocaleDateString('en') : 'soon',
                signLink,
                scope: notification_scope === 'department' ? `${creator.department} department` : 'your company',
              }
            }).catch(() => {}); // don't fail card creation if email fails
          }
        }
      } catch (notifyErr) {
        // Log but don't fail the card creation
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
      || req.member?.id === card.created_by_member_id;
    const isRecipient = token && token === card.access_token;
    const isContributor = true;

    if (!isCreator && !isRecipient && card.status === 'draft') {
      return res.status(403).json({ error: 'Card not available yet' });
    }

    // Filter private messages for non-recipients
    if (!isRecipient && !isCreator) {
      card.messages = card.messages?.filter(m => !m.is_private) || [];
    }

    // Hide contribution amounts if configured
    if (card.hide_amounts && !isCreator) {
      card.contributions = card.contributions?.map(c => ({ ...c, amount: null }));
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

    const { data: card } = await supabase.from('cards').select('creator_id').eq('slug', slug).single();
    if (!card || card.creator_id !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });

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
    if (!card || card.creator_id !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });

    if (card.status !== 'active') {
      const { error } = await supabase.from('cards').update({ status: 'active' }).eq('slug', slug);
      if (error) throw error;
    }

    // Send invites if emails provided
    if (inviteEmails?.length) {
      const deadline = card.deadline ? new Date(card.deadline).toLocaleDateString('en') : 'soon';
      const emailJobs = inviteEmails.map(email =>
        sendEmail({
          to: email,
          template: 'cardInvite',
          data: {
            creatorName: req.user.full_name,
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

const sendCard = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: card } = await supabase.from('cards').select('*').eq('slug', slug).single();

    if (!card || card.creator_id !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });

    if (!card.recipient_email)
      return res.status(400).json({ error: 'Recipient email required to send card' });

    const { data: messages } = await supabase
      .from('messages').select('count').eq('card_id', card.id);

    await supabase.from('cards').update({
      status: 'sent', recipient_notified: true, updated_at: new Date()
    }).eq('slug', slug);

    await sendEmail({
      to: card.recipient_email,
      template: 'cardDelivery',
      data: {
        recipientName: card.recipient_name,
        occasion: card.occasion,
        cardSlug: card.slug,
        accessToken: card.access_token,
        senderCount: messages?.[0]?.count || 0,
        giftAmount: card.total_collected > 0 ? card.total_collected : null
      }
    });

    res.json({ message: 'Card sent to recipient!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send card' });
  }
};

const deleteCard = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: card } = await supabase.from('cards').select('creator_id').eq('slug', slug).single();
    if (!card || card.creator_id !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });

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
      .select('id, slug, recipient_name, occasion, title, design_theme, background_color, is_gift_enabled, gift_type, suggested_amount, total_collected, deadline, status, allow_private_messages, hide_amounts, messages(id, author_name, content, is_private, media_url, media_type, reactions, created_at), contributions(amount, contributor_name, status)')
      .eq('slug', slug)
      .in('status', ['active', 'sent'])
      .single();

    if (error || !card) return res.status(404).json({ error: 'Card not found or not active' });

    const signedCount = card.messages?.length || 0;
    const verifiedContribs = card.contributions?.filter(c => c.status === 'success') || [];
    const totalCollected = verifiedContribs.reduce((s, c) => s + (c.amount || 0), 0);

    res.json({
      ...card,
      messages: card.messages?.filter(m => !m.is_private) || [],
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
    res.status(201).json({
      message: 'Your gift claim was submitted successfully. We will process it within 24 hours.',
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

module.exports = {
  createCard, getUserCards, getCard, updateCard, activateCard, sendCard,
  deleteCard, getPublicCard, getRecipientCard, claimGift, getMemberCards
};
