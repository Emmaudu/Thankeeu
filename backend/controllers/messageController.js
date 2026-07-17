const supabase      = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();
const { upload } = require('../utils/cloudinary');

const parseBoolean = value => value === true || value === 'true' || value === '1';

const addMessage = async (req, res) => {
  try {
    const { card_slug } = req.params;
    const { author_email, content, is_private, font_style,
             position_x, position_y, rotation, font_color, font_size, page_number,
             gift_type, product_vendor_id, product_vendor_name,
             product_id, product_name } = req.body;
    const author_name    = req.body.author_name;
    const product_price  = req.body.product_price != null ? parseFloat(req.body.product_price) : null;
    if (product_price !== null && (!isFinite(product_price) || product_price < 0))
      return res.status(400).json({ error: 'Invalid product price' });

    const { data: card } = await supabase
      .from('cards').select('id, status, allow_private_messages, pal_group_id, pal_member_id')
      .eq('slug', card_slug).maybeSingle();

    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.status === 'draft') return res.status(403).json({ error: 'Card is not yet active' });
    // 'active' and 'sent' (delivered) cards are both open for signing.
    // Only 'draft' is blocked above — no other status check needed.

    // Thankeeu Pals: only the group's own members (incl. the celebrant's
    // group owner) may sign — this enforces "signers can't exceed group size"
    // and prevents the link being shared outside the group.
    if (card.pal_group_id && author_email) {
      const cleanEmail = author_email.toLowerCase().trim();
      const { data: group } = await supabase.from('pal_groups').select('email').eq('id', card.pal_group_id).maybeSingle();
      const isOwner = group?.email?.toLowerCase() === cleanEmail;
      let isMember = isOwner;
      if (!isMember) {
        const { data: m } = await supabase.from('pal_members')
          .select('id').eq('pal_group_id', card.pal_group_id).eq('email', cleanEmail).maybeSingle();
        isMember = !!m;
      }
      if (!isMember) {
        return res.status(403).json({ error: 'This card can only be signed by members of the group it was created for.' });
      }
    }

    // Primary media file — first file named 'media', or first file of any name
    const primaryFile = req.files?.find(f => f.fieldname === 'media') || req.files?.[0] || req.file;
    let media_url = null;
    let media_type = null;

    if (primaryFile) {
      // For Cloudinary: file.path is already a full URL
      // For local storage: file.path is an absolute filesystem path; convert to web URL
      const appUrl = FRONTEND_URL;
      media_url = primaryFile.path?.startsWith('http')
        ? primaryFile.path
        : `${appUrl}/uploads/${require('path').basename(primaryFile.path)}`;
      const mime = primaryFile.mimetype;
      if (mime.startsWith('video/')) media_type = 'video';
      else if (mime.startsWith('audio/')) media_type = 'voice';
      else if (mime === 'image/gif') media_type = 'gif';
      else media_type = 'image';
    }

    // Additional gallery files
    const appUrl2 = FRONTEND_URL;
    const galleryFiles = (req.files || []).filter(f => f.fieldname !== 'media' && f.fieldname.startsWith('media_gallery'));
    const media_gallery = galleryFiles.length > 0
      ? JSON.stringify(galleryFiles.map(f => ({
          media_url: f.path?.startsWith('http')
            ? f.path
            : `${appUrl2}/uploads/${require('path').basename(f.path)}`,
          media_type: f.mimetype.startsWith('video/') ? 'video'
            : f.mimetype.startsWith('audio/') ? 'voice'
            : f.mimetype === 'image/gif' ? 'gif'
            : 'image'
        })))
      : null;

    // Sanitize message fields before storing — messages appear on card view and in emails
    const { stripHtml } = require('../utils/sanitize');
    const MAX_CONTENT = 1500;
    const cleanAuthorName = author_name
      ? String(author_name).replace(/<[^>]+>/g,'').replace(/on\w+\s*=/gi,'').trim().slice(0, 80)
      : null;
    if (!cleanAuthorName) return res.status(400).json({ error: 'Your name is required' });
    const cleanContent = content ? String(content).slice(0, MAX_CONTENT) : null;
    if (!cleanContent || !cleanContent.trim())
      return res.status(400).json({ error: 'Message content is required' });

    const msgData = {
      card_id: card.id,
      author_name: cleanAuthorName,
      author_email: author_email ? author_email.toLowerCase().trim().slice(0, 254) : null,
      signer_user_id: req.user?.id || null,
      edit_token: require('crypto').randomBytes(24).toString('hex'),
      content: cleanContent,
      is_private: card.allow_private_messages ? parseBoolean(is_private) : false,
      media_url,
      media_type,
      ...(media_gallery && { media_gallery }),
      // Album placement fields (set when signer uses album layout)
      ...(position_x != null && { position_x: parseFloat(position_x) || null }),
      ...(position_y != null && { position_y: parseFloat(position_y) || null }),
      ...(rotation   != null && { rotation:   parseFloat(rotation)   || 0 }),
      ...(font_color            && { font_color }),
      ...(font_size  != null    && { font_size:   parseInt(font_size) || 16 }),
      ...(page_number != null   && { page_number: parseInt(page_number) || 1 }),
      // Product gift fields (set when signer chooses vendor gift in SignCard)
      ...(gift_type === 'product' && {
        gift_type:           'product',
        product_vendor_id:   product_vendor_id   || null,
        product_vendor_name: product_vendor_name || null,
        product_id:          product_id          || null,
        product_name:        product_name        || null,
        product_price:       product_price ? Number(product_price) : null,
      }),
    };

    // Helper: does this error mean a column doesn't exist? (migration not yet run)
    const isMissingColumn = (e) => !!e && (
      e.code === '42703' ||
      (e.message && /column .* does not exist/i.test(e.message))
    );

    // Separate the "extra" gift columns so we can drop them gracefully if the
    // migration adding them to `messages` hasn't been run on this database yet.
    const { gift_type: g_giftType, product_vendor_id: g_vendorId, product_vendor_name: g_vendorName,
            product_id: g_productId, product_name: g_productName, product_price: g_productPrice,
            media_gallery: m_gallery, font_style: f_style,
            position_x: p_x, position_y: p_y, rotation: p_rot, font_color: p_fc,
            font_size: p_fs, page_number: p_pg,
            signer_user_id: s_uid, edit_token: e_tok,
            ...coreData } = msgData;
    const signerField = s_uid ? { signer_user_id: s_uid } : {};
    const tokenField = e_tok ? { edit_token: e_tok } : {};

    const placementFields = {
      ...(p_x   != null && { position_x: p_x }),
      ...(p_y   != null && { position_y: p_y }),
      ...(p_rot != null && { rotation:   p_rot }),
      ...(p_fc  != null && { font_color: p_fc }),
      ...(p_fs  != null && { font_size:  p_fs }),
      ...(p_pg  != null && { page_number: p_pg }),
    };
    const giftFields = g_giftType ? { gift_type: g_giftType, product_vendor_id: g_vendorId,
      product_vendor_name: g_vendorName, product_id: g_productId,
      product_name: g_productName, product_price: g_productPrice } : {};
    const galleryField = m_gallery ? { media_gallery: m_gallery } : {};

    const attempts = [
      // Full: font_style + placement + gift + gallery + signer_user_id + edit_token
      { ...coreData, ...signerField, ...tokenField, ...galleryField, font_style: font_style || 'handwritten', ...placementFields, ...giftFields },
      // Without edit_token (migration not run yet)
      { ...coreData, ...signerField, ...galleryField, font_style: font_style || 'handwritten', ...placementFields, ...giftFields },
      // Without signer_user_id (migration not run yet)
      { ...coreData, ...tokenField, ...galleryField, font_style: font_style || 'handwritten', ...placementFields, ...giftFields },
      { ...coreData, ...galleryField, font_style: font_style || 'handwritten', ...placementFields, ...giftFields },
      // Without placement columns
      { ...coreData, ...signerField, ...tokenField, ...galleryField, font_style: font_style || 'handwritten', ...giftFields },
      // Without placement + signer
      { ...coreData, ...galleryField, font_style: font_style || 'handwritten', ...giftFields },
      // Without gift columns
      { ...coreData, ...signerField, ...tokenField, ...galleryField, font_style: font_style || 'handwritten', ...placementFields },
      // Without gift + signer
      { ...coreData, ...galleryField, font_style: font_style || 'handwritten', ...placementFields },
      // Without font_style
      { ...coreData, ...signerField, ...tokenField, ...galleryField, ...placementFields, ...giftFields },
      { ...coreData, ...galleryField, ...placementFields, ...giftFields },
      // Without gallery (media_gallery column may not exist)
      { ...coreData, ...signerField, ...tokenField, font_style: font_style || 'handwritten' },
      { ...coreData, font_style: font_style || 'handwritten' },
      // Without gallery and without font_style
      { ...coreData, ...signerField, ...tokenField },
      { ...coreData },
      // Core data only — absolute minimum fallback
      coreData,
    ];

    let message, error;
    for (const attempt of attempts) {
      ({ data: message, error } = await supabase.from('messages').insert(attempt).select().maybeSingle());
      if (!error || !isMissingColumn(error)) break;
    }
    if (error) throw error;

    // If product gift, fetch vendor slug and update message (best-effort —
    // ignore failure if product_vendor_slug column doesn't exist yet)
    if (g_giftType === 'product' && g_vendorId) {
      try {
        const { data: vSlug } = await supabase.from('vendors').select('slug').eq('id', g_vendorId).maybeSingle();
        if (vSlug?.slug) {
          const { error: updErr } = await supabase.from('messages').update({ product_vendor_slug: vSlug.slug }).eq('id', message.id);
          if (!updErr) message = { ...message, product_vendor_slug: vSlug.slug };
        }
      } catch (_) { /* product_vendor_slug column may not exist yet — non-fatal */ }
    }

    // Server-side guest visitor tracking (covers all sign flows: money gift,
    // no gift, and product gift — frontend tracking is a secondary backup)
    if (String(req.body.is_guest) === 'true' && author_email) {
      try {
        const cleanEmail = author_email.toLowerCase().trim();
        const { data: alreadyUser } = await supabase.from('users').select('id').eq('email', cleanEmail).maybeSingle();
        if (!alreadyUser) {
          const { data: cardInfo } = await supabase.from('cards')
            .select('id, occasion, creator_id, users:creator_id(full_name)')
            .eq('slug', req.params.card_slug).maybeSingle();
          const { data: existingVisitor } = await supabase.from('visitors')
            .select('id').eq('email', cleanEmail).maybeSingle();
          if (existingVisitor) {
            await supabase.from('visitors').update({ full_name: author_name || undefined }).eq('id', existingVisitor.id);
          } else {
            await supabase.from('visitors').insert({
              email: cleanEmail,
              full_name: author_name?.trim() || null,
              card_id: cardInfo?.id || null,
              card_slug: req.params.card_slug,
              occasion: cardInfo?.occasion || null,
              creator_name: cardInfo?.users?.full_name || null,
              nudge_count: 0,
            });
          }
        }
      } catch (ve) { console.warn('Visitor track (visitors table):', ve.message); }
    }

    // Track guest visitors for re-engagement emails
    const isGuest = String(req.body.is_guest) === 'true';
    if (isGuest && author_email) {
      try {
        const { data: cardInfo } = await supabase.from('cards')
          .select('id, occasion').eq('slug', req.params.card_slug).maybeSingle();
        if (cardInfo) {
          await supabase.from('card_visitors').upsert({
            card_id: cardInfo.id, card_slug: req.params.card_slug,
            occasion: cardInfo.occasion, author_name, author_email, converted: false,
          }, { onConflict: 'card_id,author_email', ignoreDuplicates: true });
        }
      } catch (ve) { console.warn('Visitor track:', ve.message); }
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('[addMessage] error:', err?.message || err, '| code:', err?.code, '| detail:', err?.details || err?.hint);
    // Return the actual DB/validation error so the frontend can show something useful
    const errMsg = err?.message || err?.details || 'Failed to add message';
    res.status(500).json({ error: errMsg });
  }
};

const reactToMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const rawEmoji = req.body.emoji;
    const reactor_name = req.body.reactor_name;
    // Allowlist emoji values — prevents prototype pollution via emoji='__proto__' etc.
    const ALLOWED_EMOJIS = new Set(['heart','fire','laugh','wow','sad','clap','star','gift','pray','100']);
    const emoji = ALLOWED_EMOJIS.has(rawEmoji) ? rawEmoji : 'heart';

    const { data: message } = await supabase
      .from('messages').select('reactions').eq('id', message_id).maybeSingle();

    if (!message) return res.status(404).json({ error: 'Message not found' });

    const reactions = message.reactions || {};
    reactions[emoji] = (reactions[emoji] || 0) + 1;

    await supabase.from('messages').update({ reactions }).eq('id', message_id);
    if (reactor_name) {
      await supabase.from('reactions').insert({ message_id, reactor_name, emoji });
    }

    res.json({ reactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to react' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { data: msg } = await supabase
      .from('messages')
      .select('card_id, author_email')
      .eq('id', message_id).maybeSingle();
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const { data: card } = await supabase
      .from('cards')
      .select('creator_id, recipient_email, company_id')
      .eq('id', msg.card_id).maybeSingle();

    const isAdmin      = req.user.role === 'admin';
    const isCardOwner  = card?.creator_id === req.user.id;
    // Recipient can delete messages on their own card too
    const isRecipient  = card?.recipient_email &&
      card.recipient_email.toLowerCase() === req.user.email?.toLowerCase();
    // Message author can delete their own message
    const isAuthor = msg.author_email &&
      msg.author_email.toLowerCase() === req.user.email?.toLowerCase();

    if (!isAdmin && !isCardOwner && !isRecipient && !isAuthor)
      return res.status(403).json({ error: 'Not authorized to delete this message' });

    await supabase.from('messages').delete().eq('id', message_id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[deleteMessage]', err.message);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

const sendReply = async (req, res) => {
  try {
    const { card_slug } = req.params;
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: 'Reply message is required' });
    // Sanitize reply content before embedding in HTML email
    const { stripHtml: _sh } = require('../utils/sanitize');
    const cleanReplyContent = _sh(String(content).slice(0, 1000).trim());
    if (!cleanReplyContent) return res.status(400).json({ error: 'Reply message is required' });

    // Determine sender identity: logged-in user, member, or access_token recipient
    const senderId = req.user?.id || req.member?.id || null;
    const { stripHtml: _stripSender } = require('../utils/sanitize');
    const senderName = _stripSender(String(
      req.user?.full_name
      || (req.member ? `${req.member.first_name} ${req.member.last_name}` : null)
      || req.recipientName
      || 'The recipient'
    ).slice(0, 80));

    const { data: card } = await supabase
      .from('cards').select('id, creator_id, recipient_name, title, slug, created_by_member_id')
      .eq('slug', card_slug).maybeSingle();

    if (!card) return res.status(404).json({ error: 'Card not found' });

    // Get all unique emails of people who signed (contributors)
    const { data: messages } = await supabase
      .from('messages')
      .select('author_name, author_email')
      .eq('card_id', card.id)
      .not('author_email', 'is', null);

    const uniqueSigners = [];
    const seen = new Set();
    for (const m of (messages || [])) {
      if (m.author_email && !seen.has(m.author_email)) {
        seen.add(m.author_email);
        uniqueSigners.push({ name: m.author_name, email: m.author_email });
      }
    }

    // Send thank-you reply email to each signer
    const cardTitle = card.title || `${card.recipient_name}'s card`;
    const appUrl = FRONTEND_URL;

    const emailPromises = uniqueSigners.map(signer =>
      sendEmail({
        to: signer.email,
        subject: `${senderName} replied to "${cardTitle}" 💌`,
        html: `
          <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;">
            <div style="text-align:center;margin-bottom:20px;">
              <div style="font-size:40px;">💌</div>
              <h2 style="color:#5B4BDF;margin:8px 0;">${senderName} sent you a thank-you!</h2>
              <p style="color:#888;font-size:14px;">In response to your message on "${cardTitle}"</p>
            </div>
            <div style="background:#F5F3FF;border-radius:16px;padding:20px 24px;margin:20px 0;border-left:4px solid #7C6EFF;">
              <p style="color:#1A1730;font-size:16px;line-height:1.7;margin:0;">"${cleanReplyContent}"</p>
              <p style="color:#888;font-size:13px;margin-top:12px 0 0;">— ${senderName}</p>
            </div>
            <div style="text-align:center;margin-top:24px;">
              <a href="${appUrl}/card/${card_slug}" style="background:#6C5CE7;color:white;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">View the card</a>
            </div>
            <p style="color:#ccc;font-size:12px;text-align:center;margin-top:20px;">You signed a card on Thankeeu &middot; <a href="${appUrl}" style="color:#7C6EFF;">thankeeu.com</a></p>
          </div>`
      }).catch(e => console.warn('Reply email failed for', signer.email, e.message))
    );

    await Promise.allSettled(emailPromises);

    res.json({ message: `Thank-you reply sent to ${uniqueSigners.length} contributor${uniqueSigners.length !== 1 ? 's' : ''}!`, recipients: uniqueSigners.length });
  } catch (err) {
    console.error('sendReply error:', err);
    res.status(500).json({ error: 'Failed to send reply' });
  }
};

const updatePosition = async (req, res) => {
  try {
    const { message_id } = req.params;
    const {
      position_x, position_y, rotation, font_color, font_size, page_number, author_email,
      content, is_private, font_style, author_name, remove_media,
    } = req.body;
    const presentedToken = req.headers['x-message-edit-token'] || req.body.edit_token;

    // Authorization: original author (edit_token match) OR authenticated card creator/member
    const { data: msg } = await supabase
      .from('messages').select('id, card_id, author_email, edit_token').eq('id', message_id).maybeSingle();
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    let authorized = false;
    let isCardOwner = false;
    // 1. Authenticated card creator (user) or company/member who owns the card
    if (req.user || req.member) {
      const { data: card } = await supabase.from('cards')
        .select('creator_id, created_by_member_id, company_id').eq('id', msg.card_id).maybeSingle();
      if (req.user && card?.creator_id === req.user.id) { authorized = true; isCardOwner = true; }
      if (req.member && (card?.created_by_member_id === req.member.id || card?.company_id === req.member.company_id)) {
        authorized = true; isCardOwner = true;
      }
    }
    // 2. Original author proves identity with the opaque edit_token issued at creation —
    // NOT by email match, since a client-supplied email is trivially guessable/spoofable.
    if (!authorized && presentedToken && msg.edit_token && presentedToken === msg.edit_token) {
      authorized = true;
    }
    // 3. Legacy fallback: messages created before the edit_token column existed have
    // no token to check against. For those (and only those), fall back to the old
    // email-match behaviour so existing cards aren't permanently locked out of editing.
    if (!authorized && !msg.edit_token && author_email && msg.author_email &&
        author_email.toLowerCase().trim() === msg.author_email.toLowerCase().trim()) {
      authorized = true;
    }
    if (!authorized) return res.status(403).json({ error: 'Not authorized to edit this signature' });

    const updateData = {};
    if (position_x  != null) updateData.position_x  = parseFloat(position_x);
    if (position_y  != null) updateData.position_y  = parseFloat(position_y);
    if (rotation    != null) updateData.rotation    = parseFloat(rotation);
    if (font_color  != null) updateData.font_color  = font_color;
    if (font_size   != null) updateData.font_size   = parseInt(font_size);
    if (page_number != null) updateData.page_number = parseInt(page_number);

    // Inline content editing (notebook-style direct typing on the page).
    // Both the author and the card owner may rewrite the message text.
    if (content != null) {
      const { sanitizeText } = require('../utils/sanitize');
      try {
        updateData.content = sanitizeText(String(content), 'Message', { maxLen: 3000, required: true });
      } catch (e) {
        return res.status(400).json({ error: 'Message text is not valid' });
      }
    }
    if (font_style != null) updateData.font_style = String(font_style).slice(0, 40);
    if (is_private != null) updateData.is_private = (is_private === true || is_private === 'true');
    if (author_name != null) {
      const cleanAuthor = String(author_name).replace(/<[^>]+>/g, '').replace(/on\w+\s*=/gi, '').trim().slice(0, 80);
      if (!cleanAuthor) return res.status(400).json({ error: 'Signer name is required' });
      updateData.author_name = cleanAuthor;
    }

    // Existing signatures can replace or remove their attachment inline.
    // Reusing the create-message upload pipeline keeps validation and storage
    // consistent for images, GIFs, video and recorded audio.
    const primaryFile = req.files?.find(f => f.fieldname === 'media') || req.files?.[0] || req.file;
    if (primaryFile) {
      updateData.media_url = primaryFile.path?.startsWith('http')
        ? primaryFile.path
        : `${FRONTEND_URL}/uploads/${require('path').basename(primaryFile.path)}`;
      const mime = primaryFile.mimetype || '';
      updateData.media_type = mime.startsWith('video/') ? 'video'
        : mime.startsWith('audio/') ? 'voice'
        : mime === 'image/gif' ? 'gif'
        : 'image';
    } else if (remove_media === true || remove_media === 'true') {
      updateData.media_url = null;
      updateData.media_type = null;
      updateData.media_gallery = null;
    }

    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ error: 'No fields to update' });

    // Gracefully handle migration-not-run case for placement columns
    let { data: updated, error } = await supabase.from('messages').update(updateData).eq('id', message_id).select().single();
    if (error && (error.code === '42703' || /column .* does not exist/i.test(error.message || ''))) {
      // Retry without optional placement columns
      const { position_x: _a, position_y: _b, rotation: _c, font_color: _d, font_size: _e, page_number: _f, font_style: _g, ...core } = updateData;
      if (Object.keys(core).length === 0) {
        return res.status(422).json({ error: 'Placement columns not yet available — run migration first' });
      }
      ({ data: updated, error } = await supabase.from('messages').update(core).eq('id', message_id).select().single());
    }
    if (error) throw error;

    res.json(updated || { id: message_id, ...updateData });
  } catch (err) {
    console.error('[updatePosition]', err.message);
    res.status(500).json({ error: 'Failed to update message' });
  }
};

module.exports = { addMessage, reactToMessage, deleteMessage, sendReply, updatePosition, upload };
