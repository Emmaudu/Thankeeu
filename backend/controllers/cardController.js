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

    const slug = generateSlug(recipient_name, occasion);

    const { data: card, error } = await supabase
      .from('cards')
      .insert({
        slug,
        creator_id: req.user?.id || null,
        recipient_name, recipient_email,
        occasion, title, design_theme, background_color, is_gift_enabled,
        gift_type, suggested_amount, send_date, deadline,
        allow_private_messages, send_reminders, hide_amounts,
        status: reqStatus || 'draft',
        // Member card fields (these columns must exist in DB)
        ...(company_id && { company_id }),
        ...(created_by_member_id && { created_by_member_id }),
        ...(notification_scope && { notification_scope }),
      })
      .select()
      .single();

    if (error) throw error;

    // --- Notify department/company members when a member creates a card ---
    if (created_by_member_id && company_id && notification_scope) {
      try {
        // Get the creator member info
        const { data: creator } = await supabase
          .from('company_members')
          .select('first_name, last_name, department, email')
          .eq('id', created_by_member_id)
          .single();

        if (creator) {
          let memberQuery = supabase
            .from('company_members')
            .select('email, first_name, last_name, department')
            .eq('company_id', company_id)
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
    console.error(err);
    res.status(500).json({ error: 'Failed to create card' });
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
    res.json(cards);
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

    const isCreator = req.user?.id === card.creator_id;
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

    await supabase.from('cards').update({ status: 'active' }).eq('slug', slug);

    // Send invites if emails provided
    if (inviteEmails?.length) {
      const deadline = card.deadline ? new Date(card.deadline).toLocaleDateString('en') : 'soon';
      for (const email of inviteEmails) {
        await sendEmail({
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
        });
      }
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

// Get cards created by a team member (for their history tab)
const getMemberCards = async (req, res) => {
  try {
    const memberId = req.member.id;
    const { data: cards, error } = await supabase
      .from('cards')
      .select('id, slug, title, recipient_name, occasion, status, total_collected, created_at, is_gift_enabled')
      .eq('created_by_member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(cards || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch card history' });
  }
};

module.exports = { createCard, getUserCards, getCard, updateCard, activateCard, sendCard, deleteCard, getPublicCard, getMemberCards };
