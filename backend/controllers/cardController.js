const axios = require('axios');
const supabase = require('../utils/supabase');
const { safeError } = require('../utils/paramGuard');
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
      scope: 'your entire company',
      cardSlug:  slug,   // template uses data.cardSlug, NOT signLink
      signLink,          // kept for reference but template reads cardSlug
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
      background_color, font_style, card_layout, is_gift_enabled, gift_type, suggested_amount,
      send_date, deadline, allow_private_messages, send_reminders, hide_amounts,
      // Member-created card extras
      company_id, created_by_member_id, notification_scope, status: reqStatus
    } = req.body;

    if (!recipient_name?.trim() || !occasion) {
      return res.status(400).json({ error: 'Recipient name and occasion are required' });
    }

    // Sanitize and validate all user-supplied fields
    const { sanitizeName, sanitizeText } = require('../utils/sanitize');
    const cleanRecipientName = sanitizeName(recipient_name, 'Recipient name', { required: true, maxLen: 100 });
    const cleanTitle = title?.trim()
      ? sanitizeText(title, 'Card title', { maxLen: 120 })
      : null;

    // Validate numeric fields
    const cleanSuggestedAmount = suggested_amount != null ? parseFloat(suggested_amount) : null;
    if (cleanSuggestedAmount !== null && (!isFinite(cleanSuggestedAmount) || cleanSuggestedAmount < 0 || cleanSuggestedAmount > 10_000_000))
      return res.status(400).json({ error: 'Invalid suggested gift amount' });

    // Validate date fields
    if (send_date && isNaN(new Date(send_date).getTime()))
      return res.status(400).json({ error: 'Invalid send date' });
    if (deadline && isNaN(new Date(deadline).getTime()))
      return res.status(400).json({ error: 'Invalid deadline date' });

    const effectiveCompanyId = req.member?.company_id || req.company?.id || company_id;
    const effectiveMemberId = req.member?.id || created_by_member_id;
    const slug = generateSlug(recipient_name, occasion);

    // Anonymous pre-signup draft: no authenticated owner at all. Issue a
    // separate edit-only token (distinct from access_token, which is the
    // recipient's view-link credential) so the client can prove "this is
    // my draft" on later PUT/activate calls without requiring login yet.
    const isAnonymousDraft = !req.user && !req.member && !req.company;
    const draftEditToken = isAnonymousDraft ? require('crypto').randomBytes(24).toString('hex') : null;

    // Validate card_layout
    const cleanCardLayout = (card_layout === 'album') ? 'album' : 'form';

    // Build insert object — font_style is optional (requires migration)
    const insertData = {
      slug,
      creator_id: req.user?.id || null,
      recipient_name: cleanRecipientName,
      recipient_email: recipient_email?.trim() || null,
      occasion,
      title: cleanTitle || `${cleanRecipientName}'s Card`,
      design_theme, background_color, is_gift_enabled,
      gift_type, suggested_amount,
      send_date: send_date || null,
      deadline: deadline || null,
      allow_private_messages, send_reminders, hide_amounts,
      status: reqStatus || 'draft',
      ...(effectiveCompanyId && { company_id: effectiveCompanyId }),
      ...(effectiveMemberId && { created_by_member_id: effectiveMemberId }),
      ...(notification_scope && { notification_scope }),
      ...(isAnonymousDraft && { draft_edit_token: draftEditToken, is_draft: true }),
    };

    // Try inserting with all optional columns, falling back gracefully
    const isMissingCol = (e) => !!e && (e.code === '42703' || /column .* does not exist/i.test(e.message || ''));
    let card, error;

    // Attempt 1: font_style + card_layout
    ({ data: card, error } = await supabase.from('cards')
      .insert({ ...insertData, font_style: font_style || 'elegant', card_layout: cleanCardLayout })
      .select().maybeSingle());

    // Attempt 2: font_style only (card_layout column not yet added)
    if (error && isMissingCol(error) && error.message?.includes('card_layout')) {
      ({ data: card, error } = await supabase.from('cards')
        .insert({ ...insertData, font_style: font_style || 'elegant' })
        .select().maybeSingle());
    }

    // Attempt 3: neither (font_style column not yet added)
    if (error && isMissingCol(error) && error.message?.includes('font_style')) {
      ({ data: card, error } = await supabase.from('cards')
        .insert(insertData)
        .select().maybeSingle());
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
            .maybeSingle();
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
              scope: `${creatorDept} department`,
              cardSlug:  slug,  // template uses data.cardSlug
              signLink,
              giftEnabled: is_gift_enabled,
              deadline: deadline ? new Date(deadline).toLocaleDateString('en') : 'soon',
            }}).catch(() => {});
          }
          if (notifyRows.length) await pushNotificationBulk(notifyRows);

        } else if (notification_scope === 'company_wide') {
          // Determine if creator can auto-approve company-wide notifications:
          // HR always auto-approves. Team leaders auto-approve (no HR approval needed
          // for leader cards — they have authority to notify all departments).
          // Regular team members need HR to approve.
          let creatorRole = null;
          if (effectiveMemberId) {
            const { data: creatorMember } = await supabase.from('company_members')
              .select('role').eq('id', effectiveMemberId).maybeSingle();
            creatorRole = creatorMember?.role;
          }
          const canAutoApprove = !!req.company || creatorRole === 'team_leader';

          // Record in notification_approvals
          await supabase.from('notification_approvals').insert({
            card_id:           card.id,
            company_id:        effectiveCompanyId,
            requested_by_id:   effectiveMemberId || req.company?.id,
            requested_by_type: effectiveMemberId ? (creatorRole || 'team_member') : 'hr',
            status:            canAutoApprove ? 'approved' : 'pending',
          });

          if (canAutoApprove) {
            // HR or team_leader created the card — notify all departments immediately
            await notifyAllCompany(effectiveCompanyId, card, slug, recipient_name, occasion, title, is_gift_enabled, deadline, creatorName, creatorEmail, signLink);
          } else {
            // Regular team_member created — send to HR for approval
            const { data: company } = await supabase.from('companies').select('email, contact_person, name, id').eq('id', effectiveCompanyId).maybeSingle();
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

    // Log card creation to activity log
    if (effectiveCompanyId && card) {
      const { logActivity } = require('../utils/activityLog');
      logActivity({
        company_id:  effectiveCompanyId,
        actor_id:    req.company?.id || req.member?.id || req.user?.id || effectiveCompanyId,
        actor_type:  req.actorType || (req.company ? 'hr' : req.member ? 'core_team' : 'member'),
        actor_name:  req.actorName || req.company?.name || (req.member ? `${req.member.first_name} ${req.member.last_name}`.trim() : 'Unknown'),
        action:      'created_card',
        entity_type: 'card',
        entity_id:   card.id,
        entity_name: recipient_name,
        details:     { occasion, slug: card.slug },
      }).catch(() => {});
    }

    res.status(201).json(card);
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    console.error('Create card error:', err.message);
    safeError(res, err, 'Failed to create card');
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
      .maybeSingle();

    if (error || !card) return res.status(404).json({ error: 'Card not found' });

    const isCreator = req.user?.id === card.creator_id
      || req.member?.id === card.created_by_member_id
      || (req.company?.id && card.company_id === req.company.id);
    // isRecipient: valid access_token, email match, OR card was transferred to this user
    let isRecipient = (token && token === card.access_token)
      || (req.user?.email && card.recipient_email &&
          req.user.email.toLowerCase() === card.recipient_email.toLowerCase());

    // Check received_cards table for individual user transfers
    if (!isRecipient && req.user?.id) {
      const { data: received } = await supabase
        .from('received_cards').select('id')
        .eq('card_id', card.id).eq('recipient_user_id', req.user.id).maybeSingle();
      if (received) isRecipient = true;
    }
    // Check member_received_cards for HR team member recipients
    if (!isRecipient && req.member?.id) {
      // Also check by email match
      if (card.recipient_email && req.member.email &&
          card.recipient_email.toLowerCase() === req.member.email.toLowerCase()) {
        isRecipient = true;
      }
      if (!isRecipient) {
        const { data: mReceived } = await supabase
          .from('member_received_cards').select('id')
          .eq('card_id', card.id).eq('recipient_member_id', req.member.id).maybeSingle();
        if (mReceived) isRecipient = true;
      }
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

    // access_token is the private view link's credential — only the
    // creator and the recipient should ever receive it. Strip it for
    // everyone else (e.g. colleagues viewing an active card to sign it).
    const responseCard = (isCreator || isRecipient) ? card : (() => {
      const { access_token: _accessToken, ...rest } = card;
      return rest;
    })();

    res.json({ ...responseCard, isCreator, isRecipient });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch card' });
  }
};

const updateCard = async (req, res) => {
  try {
    const { slug } = req.params;
    const { draft_edit_token: _stripToken, status: _stripStatus, ...updates } = req.body;
    const presentedToken = req.headers['x-draft-edit-token'] || req.body.draft_edit_token;

    const { data: card } = await supabase.from('cards')
      .select('creator_id, created_by_member_id, company_id, pal_group_id, draft_edit_token, is_draft')
      .eq('slug', slug).maybeSingle();
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const isOwner = (req.user && card.creator_id === req.user.id)
      || (req.member && card.created_by_member_id === req.member.id)
      || (req.company && card.company_id === req.company.id)
      || (req.palGroup && card.pal_group_id === req.palGroup.id)
      || (card.is_draft && card.draft_edit_token && presentedToken && card.draft_edit_token === presentedToken);

    if (!isOwner) return res.status(403).json({ error: 'Not authorized' });

    // Sanitize empty strings to null for date/time columns to avoid Postgres type errors
    const safeUpdates = { ...updates };
    for (const field of ['send_date', 'deadline', 'send_time', 'deadline_time']) {
      if (safeUpdates[field] === '' || safeUpdates[field] === undefined) {
        safeUpdates[field] = null;
      }
    }

    // Attempt update with all columns first; fall back gracefully if optional
    // columns (card_layout, font_style) don't exist yet in this schema version.
    let updated, error;
    ({ data: updated, error } = await supabase
      .from('cards').update({ ...safeUpdates, updated_at: new Date() })
      .eq('slug', slug).select().maybeSingle());

    if (error && (error.code === '42703' || /column .* does not exist/i.test(error.message || ''))) {
      // Unknown column — retry without it
      const { card_layout: _cl, font_style: _fs, ...saferUpdates } = safeUpdates;
      ({ data: updated, error } = await supabase
        .from('cards').update({ ...saferUpdates, updated_at: new Date() })
        .eq('slug', slug).select().maybeSingle());
    }

    if (error) {
      console.error('[updateCard] Supabase error:', error.message, '| slug:', slug, '| user:', req.user?.id);
      throw error;
    }
    res.json(updated);
  } catch (err) {
    console.error('[updateCard] error:', err.message);
    res.status(500).json({ error: 'Failed to update card' });
  }
};

const activateCard = async (req, res) => {
  try {
    const { slug } = req.params;
    const { inviteEmails } = req.body;

    const { data: card } = await supabase.from('cards').select('*').eq('slug', slug).maybeSingle();
    if (!card) return res.status(404).json({ error: 'Card not found' });

    // Auth check: works for regular user, member, HR company, or an
    // anonymous draft presenting its edit token
    const presentedToken = req.headers['x-draft-edit-token'] || req.body.draft_edit_token;
    const isOwner =
      (req.user   && card.creator_id            === req.user.id)   ||
      (req.member && card.created_by_member_id  === req.member.id) ||
      (req.company && card.company_id           === req.company.id) ||
      (card.is_draft && card.draft_edit_token && presentedToken && card.draft_edit_token === presentedToken);
    if (!isOwner) return res.status(403).json({ error: 'Not authorized' });

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
    const { data: card } = await supabase.from('cards').select('*').eq('slug', slug).maybeSingle();
    if (!card) return res.status(404).json({ error: 'Card not found' });

    // Auth: regular user, team member, or HR company
    const isOwner =
      (req.user   && card.creator_id            === req.user.id)   ||
      (req.member && card.created_by_member_id  === req.member.id) ||
      (req.company && card.company_id           === req.company.id);
    if (!isOwner) return res.status(403).json({ error: 'Not authorized' });

    if (!card.recipient_email)
      return res.status(400).json({ error: 'Recipient email required to send card' });

    const { data: messages } = await supabase
      .from('messages').select('count').eq('card_id', card.id);

    // Generate a claim_token if not already set — this goes in the email URL
    // instead of the access_token, so the internal access_token stays private
    const { data: freshCard } = await supabase.from('cards')
      .select('claim_token').eq('slug', slug).maybeSingle();
    const claimToken = freshCard?.claim_token ||
      require('crypto').randomBytes(24).toString('hex');

    await supabase.from('cards').update({
      status: 'sent', recipient_notified: true, delivered_at: new Date(), updated_at: new Date(),
      claim_token: claimToken,
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
        claimToken: claimToken,
        accessToken: card.access_token,
        senderCount: messages?.[0]?.count || 0,
        giftAmount: card.total_collected > 0 ? card.total_collected : null,
        appUrl: FRONTEND_URL,
        // See note in server.js's autoSendDueCards — company-card recipients
        // are company_members rows, so they should be routed to the team
        // member login (/member/login), not the regular user login (/login).
        isCompanyCard: !!card.company_id,
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
    const { data: card } = await supabase.from('cards').select('creator_id, created_by_member_id, company_id').eq('slug', slug).maybeSingle();
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const isOwner2 = (req.user && card.creator_id === req.user.id) || (req.member && card.created_by_member_id === req.member.id) || (req.company && card.company_id === req.company.id);
    if (!isOwner2) return res.status(403).json({ error: 'Not authorized' });

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
      .maybeSingle();

    if (error || !card) return res.status(404).json({ error: 'Card not found or not active' });

    // Real signer count = ALL messages (including private ones the viewer can't read)
    const realSignedCount = card.messages?.length || 0;

    const verifiedContribs = card.contributions?.filter(c => c.status === 'success') || [];
    const totalCollected = verifiedContribs.reduce((s, c) => s + (c.amount || 0), 0);

    // Public messages: filter out private ones from display, but keep real count
    const publicMessages = (card.messages || [])
      .filter(message => !message.is_private)
      .map(message => card.hide_amounts ? { ...message, contributed_amount: null } : message);

    const { access_token: _accessToken, draft_edit_token: _det, ...safeCard } = card;

    // When hide_amounts is true, strip total_collected and individual amounts
    const publicTotal = card.hide_amounts ? null : totalCollected;

    // Strip contributions array from public response (not needed by frontend)
    const { contributions: _contribs, ...cardWithoutContribs } = safeCard;

    res.json({
      ...cardWithoutContribs,
      messages:        publicMessages,
      signed_count:    realSignedCount,   // real count including private messages
      total_collected: publicTotal,
      contributors:    card.hide_amounts ? [] : verifiedContribs.map(c => c.contributor_name),
      contributor_count: verifiedContribs.length,
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
      .maybeSingle();

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

    // If gift already withdrawn or wallet disbursed, show 0 for total_collected
    // (the contributions rows still exist so summing them gives the pre-withdrawal total)
    const isAlreadyWithdrawn = card.gift_withdrawn || wallet?.disbursed;
    const displayTotal = isAlreadyWithdrawn ? 0 : totalCollected;

    res.json({
      ...recipientCard,
      isRecipient:      true,
      signed_count:     card.messages?.length || 0,
      total_collected:  displayTotal,
      claimable_amount: isAlreadyWithdrawn ? 0 : (wallet?.amount_to_celebrant ?? totalCollected),
      gift_claim:       claim || null,
      wallet_disbursed: wallet?.disbursed || false,
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
      .select('id, recipient_name, recipient_email, access_token, company_id, gift_withdrawn')
      .eq('slug', slug)
      .eq('access_token', token)
      .maybeSingle();
    if (cardError || !card) return res.status(403).json({ error: 'Invalid recipient link' });
    if (card.gift_withdrawn) return res.status(409).json({ error: 'This gift has already been claimed' });

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
      .select("id, amount_to_celebrant, disbursed")
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
      .maybeSingle();

    if (error) throw error;

    // Mark the gift pot as claimed immediately — this is the SAME flag
    // orderGiftCard (gift cards/airtime) checks before allowing a claim,
    // so it prevents a double-payout via the other claim route.
    await supabase.from('cards').update({
      gift_withdrawn: true, gift_withdrawn_at: new Date(),
      gift_payout_reference: claim.id, gift_payout_amount: amount,
    }).eq('id', card.id);

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
      .select('id, slug, title, recipient_name, occasion, status, total_collected, is_gift_enabled, hide_amounts, created_at, send_date, send_time, messages(count)')
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
      .select('id, title, recipient_name, occasion, is_gift_enabled, deadline, company_id, created_by_member_id, notification_scope, scope_approved_at')
      .eq('slug', slug)
      .maybeSingle();

    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.company_id !== req.company.id) return res.status(403).json({ error: 'Not your company\'s card' });
    if (card.scope_approved_at) return res.json({ message: 'Already approved — company has already been notified.' });

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
        .select('first_name, last_name, email').eq('id', card.created_by_member_id).maybeSingle();
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
    const { data, error } = await supabase.from('cards')
      .select('id, slug, title, recipient_name, recipient_email, occasion, status, total_collected, is_gift_enabled, hide_amounts, created_at, send_date, send_time, design_theme, notification_scope, scope_approved_at')
      .eq('company_id', req.company.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[company-cards] query error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch cards' });
    }
    console.log(`[company-cards] company ${req.company.id} -> found ${data?.length || 0} cards`);
    res.json(data || []);
  } catch (err) {
    console.error('[company-cards] exception:', err.message);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
};

// ── HR: get delivered cards (status=sent) ─────────────────────────────────
const getCompanyDeliveredCards = async (req, res) => {
  try {
    const { data, error } = await supabase.from('cards')
      .select('id, slug, title, recipient_name, recipient_email, occasion, status, total_collected, is_gift_enabled, hide_amounts, created_at, send_date, send_time')
      .eq('company_id', req.company.id).eq('status', 'sent')
      .order('send_date', { ascending: false });
    if (error) {
      console.error('[company-delivered] query error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch delivered cards' });
    }
    res.json(data || []);
  } catch (err) {
    console.error('[company-delivered] exception:', err.message);
    res.status(500).json({ error: 'Failed to fetch delivered cards' });
  }
};

// ── HR: get received cards ─────────────────────────────────────────────────
// "Received" means cards THIS company's automation created for its own members
// (birthday cards, work anniversary cards, etc.) that have been delivered (status=sent),
// PLUS any cards explicitly transferred to this company via the received_cards table.
// We deliberately exclude cards from OTHER companies even if the recipient email
// happens to match a member here — that would be a privacy/security leak.
const getCompanyReceivedCards = async (req, res) => {
  try {
    const companyId = req.company.id;

    // 1. Cards explicitly transferred TO this company via the received_cards table
    const { data: transfers, error: transferErr } = await supabase
      .from('received_cards')
      .select('card_id, created_at')
      .eq('recipient_user_id', companyId)
      .eq('recipient_type', 'company')
      .order('created_at', { ascending: false });
    if (transferErr) console.error('[company-received] transfers error:', transferErr.message);
    const transferIds = (transfers || []).map(t => t.card_id).filter(Boolean);

    // 2. Cards created BY this company (company_id = this company) that were
    // delivered to members (status = sent). These are the auto-created occasion
    // cards (birthday, work anniversary, etc.) that the automation fired.
    // Crucially we filter by company_id = THIS company — never show foreign cards.
    const { data: ownDelivered, error: odErr } = await supabase
      .from('cards')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'sent')
      .order('created_at', { ascending: false });
    if (odErr) console.error('[company-received] own-delivered error:', odErr.message);
    const ownDeliveredIds = (ownDelivered || []).map(c => c.id);

    const ids = [...new Set([...transferIds, ...ownDeliveredIds])];
    if (!ids.length) return res.json([]);

    const { data, error } = await supabase
      .from('cards')
      .select('id, slug, title, recipient_name, recipient_email, occasion, status, total_collected, created_at, send_date, send_time')
      .in('id', ids)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[company-received] cards error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch received cards' });
    }
    res.json(data || []);
  } catch (err) {
    console.error('[company-received] exception:', err.message);
    res.status(500).json({ error: 'Failed to fetch received cards' });
  }
};

// ── HR: transfer card to a team member ────────────────────────────────────
const transferCardToMember = async (req, res) => {
  try {
    const { slug } = req.params;
    const { member_id } = req.body;
    if (!member_id) return res.status(400).json({ error: 'member_id required' });

    const { data: card } = await supabase.from('cards').select('id, title, recipient_name').eq('slug', slug).maybeSingle();
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const { data: member } = await supabase.from('company_members')
      .select('id, email, first_name, last_name, company_id').eq('id', member_id).maybeSingle();
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

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/cards/:slug/claim-gate?claim=TOKEN
// Public — determines which auth gate to show when recipient opens email link.
// Returns: { gate, recipient_name, recipient_email, card_slug, access_token }
// gate values: 'login' | 'signup' | 'member_login' | 'member_claim'
// ═══════════════════════════════════════════════════════════════════════════
const getClaimGate = async (req, res) => {
  try {
    const { slug } = req.params;
    const claimToken = req.query.claim;
    if (!claimToken) return res.status(400).json({ error: 'claim token required' });

    // First try exact claim_token match
    let { data: card } = await supabase.from('cards')
      .select('id, slug, recipient_name, recipient_email, status, access_token, claim_token')
      .eq('slug', slug)
      .eq('claim_token', claimToken)
      .maybeSingle();

    // Fallback: the token might be the access_token (old email format) or
    // the card was sent before the claim_token migration ran.
    if (!card) {
      const { data: cardByAccess } = await supabase.from('cards')
        .select('id, slug, recipient_name, recipient_email, status, access_token, claim_token')
        .eq('slug', slug)
        .eq('access_token', claimToken)
        .maybeSingle();

      if (cardByAccess) {
        // Old format — generate and save a claim_token now so future links work
        const newClaimToken = require('crypto').randomBytes(24).toString('hex');
        await supabase.from('cards')
          .update({ claim_token: newClaimToken })
          .eq('id', cardByAccess.id)
          .is('claim_token', null); // only update if not already set
        card = cardByAccess;
      }
    }

    if (!card) return res.status(404).json({ error: 'Invalid or expired link. The card may have been sent with an older link format — please ask the card creator to resend it.' });
    if (!card.recipient_email) return res.status(400).json({ error: 'No recipient email on this card' });

    const email = card.recipient_email.toLowerCase();

    // Check for HR team member first
    const { data: member } = await supabase.from('company_members')
      .select('id, email, status, invite_accepted, password_hash')
      .ilike('email', email)
      .eq('status', 'approved')
      .maybeSingle();

    if (member) {
      const hasPassword = !!member.password_hash;
      const acceptedInvite = member.invite_accepted === true;
      return res.json({
        gate: (hasPassword && acceptedInvite) ? 'member_login' : 'member_claim',
        recipient_name: card.recipient_name,
        recipient_email: email,
        card_slug: slug,
        access_token: card.access_token,
      });
    }

    // Check for individual Thankeeu user
    const { data: user } = await supabase.from('users')
      .select('id, email')
      .ilike('email', email)
      .maybeSingle();

    if (user) {
      return res.json({
        gate: 'login',
        recipient_name: card.recipient_name,
        recipient_email: email,
        card_slug: slug,
        access_token: card.access_token,
      });
    }

    // No account — needs signup
    return res.json({
      gate: 'signup',
      recipient_name: card.recipient_name,
      recipient_email: email,
      card_slug: slug,
      access_token: card.access_token,
    });

  } catch (err) {
    console.error('getClaimGate error:', err.message);
    res.status(500).json({ error: 'Failed to check claim gate' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/cards/:slug/login-type
// Public, no token required — used only to decide WHICH login page to send
// an unauthenticated visitor to when they land on /card/:slug with no claim
// token and no session (e.g. an old bookmark, or the "sign in here" link).
// Deliberately returns the bare minimum: just enough to route correctly,
// no recipient name/email/access_token like getClaimGate exposes.
// ═══════════════════════════════════════════════════════════════════════════
const getCardLoginType = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: card } = await supabase.from('cards')
      .select('recipient_email, company_id')
      .eq('slug', slug)
      .maybeSingle();

    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (!card.company_id) return res.json({ loginType: 'individual' });

    // Company card — confirm the recipient is actually a company_members row
    // (company-wide cards like Valentine's Day are addressed to the company
    // itself, so this can't be assumed purely from company_id being set).
    if (card.recipient_email) {
      const { data: member } = await supabase.from('company_members')
        .select('id').ilike('email', card.recipient_email).maybeSingle();
      if (member) return res.json({ loginType: 'member' });
    }
    return res.json({ loginType: 'individual' });
  } catch (err) {
    console.error('getCardLoginType error:', err.message);
    res.status(500).json({ error: 'Failed to check login type' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/cards/:slug/mark-claimed  (optionalAuth — user/member may be logged in)
// Links the card to the authenticated recipient account and marks it claimed.
// ═══════════════════════════════════════════════════════════════════════════
const markClaimed = async (req, res) => {
  try {
    const { slug } = req.params;
    const { access_token: token } = req.body;
    if (!token) return res.status(400).json({ error: 'access_token required' });

    const { data: card } = await supabase.from('cards')
      .select('id, slug, recipient_email, access_token, creator_id')
      .eq('slug', slug)
      .eq('access_token', token)
      .maybeSingle();

    if (!card) return res.status(403).json({ error: 'Invalid token' });

    await supabase.from('cards')
      .update({ recipient_claimed: true, recipient_claimed_at: new Date() })
      .eq('id', card.id);

    if (req.user) {
      await supabase.from('received_cards').upsert({
        card_id: card.id,
        recipient_user_id: req.user.id,
        transferred_by: card.creator_id,
        transferred_at: new Date(),
      }, { onConflict: 'card_id,recipient_user_id' });
    }

    if (req.member) {
      await supabase.from('member_received_cards').upsert({
        card_id: card.id,
        recipient_member_id: req.member.id,
        transferred_by: card.creator_id,
        transferred_at: new Date(),
      }, { onConflict: 'card_id,recipient_member_id' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('markClaimed error:', err.message);
    res.status(500).json({ error: 'Failed to mark claimed' });
  }
};


// ═══════════════════════════════════════════════════════════════════════════
// POST /api/cards/:slug/claim-member-password
// Called by MemberClaimGate when a team member sets their password for the
// first time via the card claim flow. Uses claim_token as proof of identity.
// ═══════════════════════════════════════════════════════════════════════════
const claimMemberPassword = async (req, res) => {
  try {
    const { slug } = req.params;
    const { claim_token_value, email, password } = req.body;

    if (!claim_token_value || !email || !password)
      return res.status(400).json({ error: 'claim_token_value, email and password are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Verify claim token matches this card
    const { data: card } = await supabase.from('cards')
      .select('id, recipient_email, claim_token, access_token')
      .eq('slug', slug)
      .eq('claim_token', claim_token_value)
      .maybeSingle();

    if (!card) return res.status(403).json({ error: 'Invalid claim link' });
    if (!card.recipient_email || card.recipient_email.toLowerCase() !== email.toLowerCase())
      return res.status(403).json({ error: 'Email does not match card recipient' });

    // Find the team member (include invite_accepted in select)
    const { data: member } = await supabase.from('company_members')
      .select('id, email, company_id, status, password_hash, invite_accepted')
      .ilike('email', email)
      .maybeSingle();

    if (!member) return res.status(404).json({ error: 'No team member account found with this email' });
    if (member.status === 'rejected') return res.status(403).json({ error: 'Your account was not approved. Contact your HR admin.' });
    // If they already have a password AND already accepted invite, direct them to login
    if (member.password_hash && member.invite_accepted)
      return res.status(400).json({ error: 'Password already set. Please use the team login page.' });

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 12);

    await supabase.from('company_members')
      .update({ password_hash: hash, invite_accepted: true, status: 'approved' })
      .eq('id', member.id);

    // Issue a JWT for this member using the same structure as memberLogin
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { memberId: member.id, companyId: member.company_id, type: 'company_member' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token, member: { id: member.id, email: member.email } });
  } catch (err) {
    console.error('claimMemberPassword error:', err.message);
    res.status(500).json({ error: 'Failed to set password' });
  }
};


module.exports = {
  getCompanyCards, getCompanyDeliveredCards, getCompanyReceivedCards, transferCardToMember,
  createCard, getUserCards, getCard, updateCard, activateCard, sendCard,
  deleteCard, getPublicCard, getRecipientCard, claimGift, getMemberCards,
  getClaimGate, getCardLoginType, markClaimed, claimMemberPassword,
  approveCardScope, notifyAllCompany,
};
