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
    const { author_name, author_email, content, is_private, font_style,
             gift_type, product_vendor_id, product_vendor_name,
             product_id, product_name, product_price } = req.body;

    const { data: card } = await supabase
      .from('cards').select('id, status, allow_private_messages, pal_group_id, pal_member_id')
      .eq('slug', card_slug).maybeSingle();

    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.status === 'draft') return res.status(403).json({ error: 'Card is not yet active' });

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

    const msgData = {
      card_id: card.id,
      author_name,
      author_email,
      content,
      is_private: card.allow_private_messages ? parseBoolean(is_private) : false,
      media_url,
      media_type,
      ...(media_gallery && { media_gallery }),
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
            media_gallery: m_gallery, font_style: f_style, ...coreData } = msgData;

    const attempts = [
      { ...coreData, ...(m_gallery && { media_gallery: m_gallery }), font_style: font_style || 'handwritten',
        ...(g_giftType && { gift_type: g_giftType, product_vendor_id: g_vendorId, product_vendor_name: g_vendorName,
                              product_id: g_productId, product_name: g_productName, product_price: g_productPrice }) },
      { ...coreData, ...(m_gallery && { media_gallery: m_gallery }),
        ...(g_giftType && { gift_type: g_giftType, product_vendor_id: g_vendorId, product_vendor_name: g_vendorName,
                              product_id: g_productId, product_name: g_productName, product_price: g_productPrice }) },
      { ...coreData, ...(m_gallery && { media_gallery: m_gallery }), font_style: font_style || 'handwritten' },
      { ...coreData, ...(m_gallery && { media_gallery: m_gallery }) },
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
    console.error(err);
    res.status(500).json({ error: 'Failed to add message' });
  }
};

const reactToMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { emoji = 'heart', reactor_name } = req.body;

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
    const { data: msg } = await supabase.from('messages').select('card_id').eq('id', message_id).maybeSingle();
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const { data: card } = await supabase.from('cards').select('creator_id').eq('id', msg.card_id).maybeSingle();
    if (card?.creator_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    await supabase.from('messages').delete().eq('id', message_id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

const sendReply = async (req, res) => {
  try {
    const { card_slug } = req.params;
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: 'Reply message is required' });

    // Determine sender identity: logged-in user, member, or access_token recipient
    const senderId = req.user?.id || req.member?.id || null;
    const senderName = req.user?.full_name
      || (req.member ? `${req.member.first_name} ${req.member.last_name}` : null)
      || req.recipientName
      || 'The recipient';

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
              <p style="color:#1A1730;font-size:16px;line-height:1.7;margin:0;">"${content}"</p>
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

module.exports = { addMessage, reactToMessage, deleteMessage, sendReply, upload };
