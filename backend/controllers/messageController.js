const supabase = require('../utils/supabase');
const { upload } = require('../utils/cloudinary');

const parseBoolean = value => value === true || value === 'true' || value === '1';

const addMessage = async (req, res) => {
  try {
    const { card_slug } = req.params;
    const { author_name, author_email, content, is_private, font_style } = req.body;

    const { data: card } = await supabase
      .from('cards').select('id, status, allow_private_messages')
      .eq('slug', card_slug).single();

    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.status === 'draft') return res.status(403).json({ error: 'Card is not yet active' });

    let media_url = null;
    let media_type = null;

    if (req.file) {
      media_url = req.file.path;
      const mime = req.file.mimetype;
      if (mime.startsWith('video/')) media_type = 'video';
      else if (mime.startsWith('audio/')) media_type = 'voice';
      else if (mime === 'image/gif') media_type = 'gif';
      else media_type = 'image';
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        card_id: card.id,
        author_name,
        author_email,
        content,
        is_private: card.allow_private_messages ? parseBoolean(is_private) : false,
        font_style: font_style || 'handwritten',
        media_url,
        media_type
      })
      .select()
      .single();

    if (error) throw error;
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
      .from('messages').select('reactions').eq('id', message_id).single();

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
    const { data: msg } = await supabase.from('messages').select('card_id').eq('id', message_id).single();
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const { data: card } = await supabase.from('cards').select('creator_id').eq('id', msg.card_id).single();
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
    const { content, media_url } = req.body;

    const { data: card } = await supabase
      .from('cards').select('id, creator_id, recipient_name')
      .eq('slug', card_slug).single();

    const { data: messages } = await supabase
      .from('messages').select('author_email').eq('card_id', card.id).not('author_email', 'is', null);

    const { sendEmail } = require('../utils/email');
    const uniqueEmails = [...new Set(messages.map(m => m.author_email).filter(Boolean))];

    res.json({ message: 'Reply sent', recipients: uniqueEmails.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reply' });
  }
};

module.exports = { addMessage, reactToMessage, deleteMessage, sendReply, upload };
