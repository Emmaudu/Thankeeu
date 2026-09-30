/**
 * messageMedia.js — the single reader for a message's attachments.
 *
 * The backend stores the first attachment on the message itself
 * (`media_url` / `media_type`) and any extras as a JSON array in
 * `media_gallery`, where each entry is `{ media_url, media_type }`
 * (see messageController.js — galleryFiles.map).
 *
 * CardView's album pages used to read those entries as `{ url, type }`, so
 * every gallery photo, GIF, video and voice note rendered with
 * `src={undefined}` — a broken image. Older cards can also hold plain strings
 * or the `{url,type}` shape, so this reader accepts all three and drops
 * anything without a usable URL.
 */
export const messageMediaItems = (message) => {
  const items = [];
  if (message?.media_url) {
    items.push({ media_url: message.media_url, media_type: message.media_type || 'image' });
  }
  if (message?.media_gallery) {
    try {
      const gallery = typeof message.media_gallery === 'string'
        ? JSON.parse(message.media_gallery)
        : message.media_gallery;
      if (Array.isArray(gallery)) {
        gallery.forEach((item) => {
          if (typeof item === 'string') {
            items.push({ media_url: item, media_type: 'image' });
          } else if (item?.media_url || item?.url) {
            items.push({
              media_url: item.media_url || item.url,
              media_type: item.media_type || item.type || 'image',
            });
          }
        });
      }
    } catch {
      /* Older cards may hold malformed gallery JSON — keep the rest rendering. */
    }
  }
  return items.filter((item) => item.media_url);
};

/** True when a message carries any attachment at all. */
export const hasMessageMedia = (message) => messageMediaItems(message).length > 0;

/**
 * The gift attached to a message, or null.
 * A gift is either a cash contribution (`contributed_amount`) or a product
 * bought from a vendor (`gift_type === 'product'`). `contributed_amount` is
 * nulled by the API when the card hides amounts, so a product gift must still
 * render in that case.
 */
export const messageGift = (message) => {
  if (message?.gift_type === 'product' && message?.product_name) {
    return {
      kind: 'product',
      label: message.product_name,
      vendorSlug: message.product_vendor_slug || null,
      vendorName: message.product_vendor_name || null,
    };
  }
  if (Number(message?.contributed_amount) > 0) {
    return { kind: 'cash', amount: Number(message.contributed_amount) };
  }
  return null;
};
