/**
 * Page-specific long-form content for every landing page that uses the
 * homepage layout. This is what makes each page different from the homepage
 * and from its siblings (search engines rank pages on their own content, not
 * on the shared layout). Restored from the pages that ranked before the
 * redesign where the old copy was accurate; written fresh where the old page
 * only had shared template text.
 *
 * Each section: { h2, intro?, steps?: string[], items?: [title, body][], paragraphs?: string[] }
 * Plain data (no imports) so scripts/prerender.js renders the same text.
 */

export const LANDING_ARTICLES = {
  // ── Country / general group-card pages ───────────────────────────────────
  '/online-group-cards-uk': [
    { h2: 'Why UK teams use online group cards',
      paragraphs: [
        'The office leaving card used to go round in a brown envelope, and plenty of people never saw it. The colleagues working from home missed it. So did the night shift and the Manchester office. An online group card solves that. You drop one link into Teams, Slack or the office WhatsApp, and everyone signs from their own phone or laptop before the day. New to this? Here is [how an online group card works](/online-group-card).',
        'A signature can be more than a line of biro. People add a photo from the Christmas do, a GIF or a short voice note. You can pass the hat without the envelope too: colleagues chip in to a group gift by card, in pounds, as they sign.',
      ] },
    { h2: 'How it works for a UK office',
      steps: [
        'Pick a cover for the occasion (leaving, birthday, retirement, new baby or thank you) and add the recipient’s name.',
        'Post the signing link in your team channel. Nobody needs an account to sign.',
        'Switch on the gift collection if you’re clubbing together. Contributions are taken in GBP.',
        'Choose when it arrives, say 4pm on their last day, and the card lands in their inbox right on time.',
      ] },
    { h2: 'Popular UK occasions',
      items: [
        ['Leaving and farewell cards', 'Give someone a proper send off with a [leaving card the whole office signs](/cards/leaving-card), including people who moved on years ago and still want to say goodbye.'],
        ['Retirement cards', 'Mark 20 or 30 years with messages from old and current colleagues and a collection towards the present. There is more on [retirement cards for UK offices](/retirement-cards-uk).'],
        ['Maternity leave and new baby', 'A card and a group gift before their last day, signed by the entire team.'],
        ['Birthdays and work anniversaries', 'A small team can still send a big card, and nobody has to chase signatures round the building. If half your team sits across the Atlantic, see [group cards for US offices](/online-group-cards-us).'],
      ] },
  ],
  '/online-group-cards-us': [
    { h2: 'Why US teams switch to online group cards',
      paragraphs: [
        'US teams sit across offices, states and four time zones. A paper card never reaches the remote half of the team, and a Slack thread scrolls out of sight by lunchtime. An online group card keeps every coworker’s message in one place, with photos, GIFs and voice notes, and delivers it at the moment you pick. New to this? Here is [what an online group card is](/online-group-card).',
        'You pay a flat price per card, not per signer, so a farewell from 200 people costs the same as a card from five. Coworkers who want to can chip in to a group gift in USD when they sign.',
      ] },
    { h2: 'Setting one up for a coworker',
      steps: [
        'Choose a cover: farewell, birthday, promotion, work anniversary or thank you.',
        'Post the signing link in Slack, Teams or email. Signing takes about a minute and nobody has to create an account.',
        'Add a group gift if the team is pooling money for a gift card or a present.',
        'Schedule delivery in the recipient’s time zone. 9am Pacific means 9am Pacific, not 9am Eastern.',
      ] },
    { h2: 'What US teams use it for',
      items: [
        ['Farewell and goodbye cards', 'Everyone signs, including coworkers in other offices and time zones. Read more about [farewell cards for coworkers](/occasions/farewell).'],
        ['Birthdays and work anniversaries', 'You can set cards up weeks ahead, so a milestone never slips past.'],
        ['Get well soon and sympathy', 'A quiet card from the team, sent privately to their inbox. Our [get well soon cards](/cards/get-well-soon) are built for exactly this.'],
        ['Employee recognition', 'Thank you cards for a launch, a big quarter or a colleague who carried extra weight. Teams with staff up north can look at [group cards across Canada](/online-group-cards-canada).'],
      ] },
  ],
  '/online-group-cards-canada': [
    { h2: 'Group cards for teams across Canada',
      paragraphs: [
        'Canadian teams can cover six time zones, from Vancouver to St. John’s, and many people work in both English and French. With an online group card, every colleague signs from one link in the language they prefer. Messages show up exactly as written, accents included. New to this? Here is [the basics of online group cards](/online-group-card).',
        'Set delivery in the recipient’s own time zone. The card then arrives at 9am in Halifax or 9am in Calgary, not whenever the organiser happened to be online. Nobody in Winnipeg gets a card at midnight because the person who made it lives in Toronto.',
      ] },
    { h2: 'How Canadian teams run a group card',
      steps: [
        'Pick a cover: farewell, retirement, birthday, new baby or thank you.',
        'Share the link in Teams, Slack or email. Colleagues sign in English or French and never need an account.',
        'Turn on the group gift if you are collecting. People chip in by card as they sign.',
        'Schedule delivery for the right hour in the recipient’s province.',
      ] },
    { h2: 'Popular occasions in Canada',
      items: [
        ['Farewell and retirement cards', 'A proper goodbye, even for a team that works fully remote. Browse our [retirement cards for long careers](/cards/retirement).'],
        ['Bilingual teams', 'One card holds both languages, and every message stays exactly as the person typed it.'],
        ['Birthdays and milestones', 'Messages, photos and GIFs from everyone, plus a pooled gift. Here are ideas for [a team birthday card](/occasions/birthday).'],
        ['Thank you and recognition', 'Say thanks to the colleague who kept things running through a busy season. If you also have offices south of the border, see [online group cards for the US](/online-group-cards-us).'],
      ] },
  ],
  '/online-group-cards-nigeria': [
    { h2: 'One card, signed from anywhere',
      paragraphs: [
        'Friends, family and colleagues rarely live in one city now. A team can have people in three offices, and the family chat can stretch from Toronto to London to Sydney. An online group card gathers every message in one place and delivers it at the exact time you choose, in the recipient’s time zone.',
        'Everyone signs from one link shared on WhatsApp, email or Slack. They can add a photo, a GIF or a voice note, and chip in to a group gift in USD by card from any country. If most of your group is in the United States, see our page on [online group cards for US teams](/online-group-cards-us).',
      ] },
    { h2: 'How it works',
      steps: [
        'Choose a cover for the occasion and add the recipient’s name.',
        'Share one signing link. Nobody needs an account or an app to sign.',
        'Collect a group gift if you like. Contributions pool automatically.',
        'Set the delivery date and time. The card and the Memory Movie™ arrive by email.',
      ] },
    { h2: 'What people send',
      items: [
        ['Birthdays', 'A card full of messages and photos from the people who love them. See [birthday cards signed by everyone](/occasions/birthday).'],
        ['Farewells', 'A goodbye for a colleague from the entire team, remote staff included. People at home or in another branch sign from the same link.'],
        ['Weddings and new babies', 'Relatives at home and abroad celebrate together on one card, whatever country they live in.'],
        ['Thank yous and recognition', 'Say thanks properly, with a gift everyone put something towards. Start with a [group thank you card](/cards/thank-you).'],
      ] },
  ],
  '/online-group-card': [
    { h2: 'What is an online group card?',
      paragraphs: [
        'An online group card is one card that lots of people sign for one person. You share a link instead of passing paper around. Each person writes a message and can add a photo, a GIF, a video or a voice note. The recipient gets a single card with every message inside, plus a group gift if you collected one.',
        'It suits any occasion and any group. A team says goodbye with a [leaving card for a colleague](/cards/leaving-card). A family celebrates a birthday across three countries. Friends congratulate a couple on their wedding. For local details there are pages on [group cards in the UK](/online-group-cards-uk) and [group cards in Canada](/online-group-cards-canada), and one on [group cards for people in different countries](/online-group-cards-nigeria).',
      ] },
    { h2: 'How to make an online group card',
      steps: [
        'Pick a cover for the occasion and add the recipient’s name.',
        'Share the signing link by WhatsApp, email, Slack or a QR code.',
        'People sign from a phone or laptop. They don’t need an account or an app.',
        'Pay once you are ready, and choose when it is delivered.',
      ] },
    { h2: 'Why a group card beats a group chat',
      items: [
        ['Everything in one place', 'Messages don’t get buried under memes and replies. They stay together, in order, for good.'],
        ['Nobody gets missed', 'People outside the chat can still sign from the link: the aunt who never joined the group, the colleague who left last year, the friend abroad.'],
        ['Something to keep', 'A card they can open again years later, plus a Memory Movie™ made automatically.'],
        ['The gift is sorted too', 'No requests for bank transfers. Contributions pool as people sign.'],
      ] },
  ],

  // ── Wedding pages ─────────────────────────────────────────────────────────
  '/occasions/wedding': [
    { h2: 'A wedding card signed by everyone who loves them',
      paragraphs: [
        'A wedding pulls in people from every part of a couple’s life: family who flew in, colleagues, school friends and those who couldn’t come. A Thankeeu wedding card collects all their wishes in one place. Written messages, photos, GIFs and voice notes reach the couple as one keepsake.',
        'Older relatives can record a blessing in their own voice. Friends abroad sign and give from the same link. Nobody has to collect cash in envelopes, because guests add to the [pooled wedding cash gift](/wedding-cash-gift-platform) as they sign.',
        'Guests don’t need an account or an app. They open the link on their phone, write a few lines and attach whatever they like. The couple receives it at the time you choose, and a Memory Movie™ is made from everything guests added.',
        'The same card can double as [an online wedding guestbook](/online-wedding-guestbook) on the day. Put [a QR code for guest photos](/qr-code-for-wedding-photos) on the tables and the pictures land right beside the messages.',
      ] },
    { h2: 'How to send a group wedding card',
      steps: [
        'Choose a wedding cover and add the couple’s names.',
        'Send the link to family, friends and colleagues on WhatsApp or email, or print a QR code for the tables.',
        'Guests sign and, if you switch it on, contribute to the gift.',
        'Pick when it lands: the morning of the wedding, during the reception, or once they are home from the honeymoon. Colleagues organising one for a coworker can start with a [group card for the wedding](/wedding-group-card).',
      ] },
  ],
  '/wedding-group-card': [
    { h2: 'Who signs a wedding group card?',
      paragraphs: [
        'Anyone who wants to congratulate the couple can sign: the wedding party, family near and far, colleagues from both offices, friends who couldn’t travel. Each person writes their own message and can attach a photo, GIF, video or voice note. The couple receives one card with every wish inside.',
        'Teams use it a lot when a coworker gets married. So do families with half the relatives living abroad. For other ways to mark the day, see our [wedding cards and tools](/occasions/wedding).',
        'Setting one up takes a few minutes. You pick a cover, add the couple’s names and share one link on WhatsApp, email or Slack. People sign in a minute or two without an account, and the card goes out at the time you set.',
      ] },
    { h2: 'Adding a wedding gift',
      paragraphs: [
        'Switch on the gift collection and guests chip in any amount as they sign. No envelope goes round and nobody shares bank details. Contributions pool automatically, and the couple withdraws the total to their bank account after the card is delivered. Guests pay by card from any country, so relatives abroad can give as easily as colleagues down the hall. Read how the [wedding gift pot works](/wedding-cash-gift-platform).',
      ] },
    { h2: 'When to deliver it',
      items: [
        ['The morning of the wedding', 'Something to read over breakfast before the ceremony.'],
        ['At the reception', 'Put it on a screen during the speeches.'],
        ['After the honeymoon', 'A surprise waiting when they get home and have time to read every message slowly, with their [Memory Movie™ ready to watch](/memory-movie).'],
      ] },
  ],
  '/online-wedding-guestbook': [
    { h2: 'Why couples are replacing the paper guestbook',
      paragraphs: [
        'A paper guestbook gets signatures and a few rushed lines. Half the pages are hard to read, it sits by the door where most guests walk straight past, and sometimes it gets left at the venue. An online wedding guestbook lives on every guest’s phone. They sign when it suits them: at their table, or days later from another country.',
        'It holds more than words. Guests can add a photo from the day, a video or a voice note, so the couple hears the laughter and the blessings as well as reading them. Some couples use it mostly as a [voice note guest book](/wedding-voice-note-guest-book).',
        'Guests who couldn’t make it can sign from the link you send them, so the grandparent who couldn’t travel still ends up in the book. Nothing depends on one pen and one table by the door. You also end up with the words in a form you can search, share with family and read again, rather than a book in a box in the loft.',
      ] },
    { h2: 'Setting up your online guestbook',
      steps: [
        'Create your wedding card and choose a cover.',
        'Print the QR code on a sign at the entrance or on each table, and add the link to your wedding website and invitations. The same code can gather [photos from your guests](/qr-code-for-wedding-photos).',
        'Guests scan with the phone camera and sign. There is no app and no account.',
        'After the wedding you receive the guestbook as one keepsake with a Memory Movie™. It sits alongside the other [tools for your wedding day](/occasions/wedding).',
      ] },
  ],
  '/digital-wedding-guest-book': [
    { h2: 'What a digital guest book captures',
      items: [
        ['Written wishes', 'Every message is typed and easy to read. No squinting at handwriting, and no page where the ink ran after someone spilled a drink.'],
        ['Photos and videos', 'Guests attach a picture from the day or a short [video message for the couple](/wedding-video-message-book).'],
        ['Voice notes', 'Blessings and toasts in the speaker’s own voice. Couples tend to go back to these more than anything else.'],
        ['Guests who couldn’t attend', 'Anyone with the link can sign from wherever they are.'],
      ] },
    { h2: 'Digital vs paper guest book',
      paragraphs: [
        'A paper guest book is a lovely object. It only holds what fits on a page, though, and only from the people who walked past it. A digital guest book holds photos, video and voice as well as words. Guests can sign before, during and after the day, and it can’t be damaged or lost. People who were never in the room can add a page too. And if one guest writes three paragraphs, there is room for all of them. Plenty of couples keep a small paper book on a table and use the digital one for everything else.',
        'Can you print it? Everything stays saved on the card, and you can download the [Memory Movie™ of their messages](/memory-movie). So you can print your favourite messages and photos later.',
        'Setting it up works like any Thankeeu card. Create it, share the link or QR code, and guests sign from their phones. If you are still planning, our [main wedding page](/occasions/wedding) shows what else the card can do.',
      ] },
  ],
  '/wedding-voice-note-guest-book': [
    { h2: 'An audio guest book without the rented phone',
      paragraphs: [
        'An audio guest book usually means a vintage phone on a table and a queue of guests waiting to speak into it. With Thankeeu, guests record on their own phone. They scan the QR code, tap the microphone and talk. There is no hardware to rent or send back, no queue, and guests who couldn’t come can record one too.',
        'Each recording sits next to the guest’s written message and photos, and goes into the couple’s Memory Movie™. If some guests would rather be on camera, it works as a [wedding video message book](/wedding-video-message-book) as well.',
        'It suits families where the older generation would rather speak than type. A grandmother can give her blessing in her own language and her own words, and the couple can listen to it again whenever they like. Children can join in as well, which is often the part that makes the room laugh.',
      ] },
    { h2: 'Tips for more (and better) voice messages',
      steps: [
        'Put the QR code on every table, not only at one signing station, so nobody has to leave their seat to take part.',
        'Ask the MC to mention it between speeches. That is when guests feel most sentimental.',
        'Send the link to older relatives before the day so they can record somewhere quiet.',
        'Give people a prompt. “Your best advice for the couple” gets lovely answers.',
        'Keep a written option. The same card is a full [digital guest book for weddings](/digital-wedding-guest-book) and part of our [wedding card options](/occasions/wedding).',
      ] },
  ],
  '/wedding-video-message-book': [
    { h2: 'Why video wishes mean so much',
      paragraphs: [
        'A written message is lovely. A video of a grandparent raising a glass, or of a best friend who couldn’t fly in, is something the couple will replay for years. Guests record or upload a short clip from their phone, and it lands in the wedding card beside the written wishes and photos.',
        'After the wedding, every clip goes into the [Memory Movie™ we make for you](/memory-movie): a film of the day made by the people who love them. Guests who are shy on camera can leave [a recorded voice message](/wedding-voice-note-guest-book) instead.',
        'Keep clips short. Thirty seconds is plenty for a toast or a story, and short clips are easier to record at a noisy table. Relatives abroad can record at home the week before, and their video will be waiting in the card with everything else. Friends in the wedding party can gather a few surprise clips in advance and keep them quiet until the card is delivered.',
      ] },
    { h2: 'How to collect video messages',
      steps: [
        'Create the wedding card and send guests the link or QR code.',
        'Ask anyone who can’t attend to record before the day. Send them the link with a short note so they know roughly how long to talk for.',
        'At the reception, guests record from their table in under a minute. A quiet corner near the entrance works well for anyone who wants less background noise.',
        'Deliver the card when you choose, with every video in one place. It pairs well with the rest of our [wedding day features](/occasions/wedding).',
      ] },
  ],
  '/wedding-memory-book': [
    { h2: 'A memory book the guests write for you',
      paragraphs: [
        'A printed wedding memory book takes weeks of collecting, designing and chasing people for their pages. A Thankeeu memory book fills itself. You share one link and each guest adds a message, photo, voice note or video. There is nothing to lay out or print, and nobody’s contribution gets dropped because it arrived late.',
        'Once it is delivered, the couple can read every page, play every voice note and watch the Memory Movie™ that turns the book into a film. It is one of several [ways to celebrate a wedding](/occasions/wedding) on Thankeeu.',
        'It also fixes the usual problem with a printed book, where pages from people who reply late never make it in. Guests can add their page before the wedding, at their table on the day, or afterwards from home, and all of it ends up in the same place. Older relatives can speak instead of writing, which many of them prefer. The book grows as long as it needs to, with no page limit to plan around.',
      ] },
    { h2: 'What guests add',
      items: [
        ['A message', 'Advice, a memory or a blessing in their own words.'],
        ['A photo or video', 'From the day itself or from years of friendship. For a collection of pictures only, see our [online wedding photo album](/wedding-photo-album-online).'],
        ['A voice note', 'Their voice, kept for good. Hearing someone say it lands differently from reading it, especially from the older guests.'],
        ['A gift', 'Optional. Guests can add to the [couple’s cash gift fund](/wedding-cash-gift-platform) as they sign.'],
      ] },
  ],
  '/wedding-cash-gift-platform': [
    { h2: 'A cash gift with a message attached',
      paragraphs: [
        'Lots of couples would rather have cash than another toaster. Asking for it feels awkward, though, and a plain request for a bank transfer can seem cold. On Thankeeu the gift is part of the [group wedding card](/wedding-group-card). Guests write their wishes, add a photo or voice note, and chip in to the gift in the same step.',
        'Guests pay by card from any country and see every fee before they pay. The couple withdraws the pooled gift to their bank account after the card is delivered.',
        'Because the money arrives together with everyone’s messages, nobody has to keep a list of envelopes and bank transfers, or work out afterwards who sent what. Guests who can’t attend can still give, from any country, using the same link as everyone else.',
      ] },
    { h2: 'How the wedding gift pot works',
      steps: [
        'Create the wedding card and switch on the gift collection.',
        'Share the link in the invitation, on your wedding website or on WhatsApp.',
        'Guests sign and give any amount. They don’t need an account.',
        'After delivery, the couple requests a withdrawal to their bank account.',
      ] },
    { h2: 'Ideas for what the gift is for',
      items: [
        ['Honeymoon fund', 'Flights, a special dinner, a day trip somewhere new.'],
        ['First home', 'A deposit, furniture or the garden.'],
        ['Something to remember', 'A piece of art, a watch, or a weekend away. The messages that come with each gift become a [wedding memory book](/wedding-memory-book), and you can find more on our [wedding ideas and tools](/occasions/wedding) page.'],
      ] },
  ],
  '/wedding-photo-sharing-app': [
    { h2: 'A photo sharing app with nothing to install',
      paragraphs: [
        'Most wedding photo apps ask guests to download something, make an account and remember a code, and most guests give up. Thankeeu runs in the phone’s browser. Guests scan the [QR code on each table](/qr-code-for-wedding-photos) and start uploading within seconds, on iPhone or Android.',
        'Every photo goes into your shared wedding gallery and onto the [live memory wall at the reception](/wedding-memory-wall). Guests can add a message or voice note with their pictures, so you know what was going on in each shot. It sits alongside the other [Thankeeu wedding features](/occasions/wedding). Planning a wedding in Britain or America? See [wedding photo sharing in the UK](/uk-wedding-photo-sharing) and [photo sharing for US weddings](/usa-wedding-photo-sharing).',
        'Guests use the phone already in their hand. There is no code to remember and no password to reset in the middle of the dance floor. Relatives who couldn’t make it can open the same link from home and add their own photos and wishes. The couple gets everything together after the day, photos and messages side by side.',
      ] },
    { h2: 'Getting the most photos from your guests',
      steps: [
        'Place a QR code on every table and at the bar. The more places guests see it, the more they upload.',
        'Share the link before the day so guests can add photos from getting ready and travelling.',
        'Put the live wall on a screen. When people see photos appear, they join in, even the ones who said they were not going to bother.',
        'Remind guests the day after. Plenty of the best photos get uploaded on the way home, or the next morning over a slow breakfast in bed.',
      ] },
  ],
  '/wedding-photo-upload-app': [
    { h2: 'Uploading takes three taps',
      steps: [
        'The guest scans the QR code with the phone camera, or taps the link you sent.',
        'They pick photos or videos from their camera roll, one at a time or several at once.',
        'They add a message if they want to and tap send. That’s it. The whole thing takes less time than finding a pen.',
      ] },
    { h2: 'Why skipping the download matters',
      paragraphs: [
        'Every extra step loses guests: an app store, an account, a password. Uploading in the browser means grandparents, children and the guest whose phone is nearly full can all take part. Photos go straight into your wedding gallery and show up on the [venue memory wall](/wedding-memory-wall) during the reception.',
        'Guests who couldn’t attend can upload too. Send them the link and they can add their own photos and wishes from anywhere.',
        'It works the same on iPhone and Android, and videos go up as easily as photos. Nobody has to sign up or clear space for a new app. For older guests, a line on the table card such as “Point your camera here” is usually all the instruction they need. Put the same line in the invitation, so people know what the code is for before they arrive.',
        'Most people will only upload if it takes seconds, so keep the code where they already are: on the tables, at the bar, by the photo booth. For a plan that covers before, during and after the day, read [how to collect guest photos](/collect-wedding-guest-photos), or start from our [main wedding hub page](/occasions/wedding).',
      ] },
  ],
  '/collect-wedding-guest-photos': [
    { h2: 'How to collect photos from wedding guests',
      steps: [
        'Before the wedding, put the link in your invitations or on your wedding website so guests can upload photos from getting ready and travelling.',
        'On the day, place a QR code on the tables, the welcome sign and the photo booth. Our guide to [printing a wedding photo QR code](/qr-code-for-wedding-photos) covers the size.',
        'Show the live wall on a screen so guests see their photos appear. It gets everyone else going.',
        'After the wedding, share the link again. The best photos often turn up the next morning.',
      ] },
    { h2: 'Why one link beats a group chat or shared drive',
      paragraphs: [
        'Group chats compress photos and bury them under replies. Shared drives need accounts and folders that nobody keeps tidy. One Thankeeu link gathers every guest’s photos in a single [shared wedding photo gallery](/wedding-photo-gallery), together with the messages and voice notes that came with them. Nobody spends weeks chasing anyone afterwards.',
        'It is part of the [Thankeeu wedding toolkit](/occasions/wedding), so the same link can also carry messages and a gift if you want them.',
        'Give each stage of the day a job. Before the wedding the link picks up photos from getting ready and travelling. On the day the QR code does the work. Afterwards the link catches what people find in their camera rolls, and by the end of the week you have one collection instead of pictures scattered over a dozen chats. The couple can then watch the Memory Movie™ made from all of it.',
      ] },
  ],
  '/wedding-guest-photo-collection': [
    { h2: 'Stop chasing guests for photos',
      paragraphs: [
        'After most weddings, the couple spends weeks asking “can you send me your photos?” in five different group chats. With a QR code at the venue, guests share their photos on the day while their phones are already in their hands, and every shot lands in one collection.',
        'Setup takes a couple of minutes. Create the card, print the code, and guests upload from the browser with no app. Afterwards the pictures live in an [online album of your wedding](/wedding-photo-album-online), next to any messages guests left. It is one of the [wedding tools on Thankeeu](/occasions/wedding).',
        'Timing matters. Guests share most while the phone is already out: the ceremony, the speeches, the first dance. Keep the code in view at those moments. If the signal at the venue is weak, remind people they can use the same link from home the next day. A short line on the table card helps: “Scan to share your photos with us”. Guests who didn’t attend can add pictures too, if you send them the link.',
      ] },
    { h2: 'Where to put the QR code',
      items: [
        ['On every table', 'Guests upload between courses and during the speeches, while they are sitting down with the phone already out.'],
        ['The welcome sign', 'The first thing people see when they arrive. Our [QR code guide for wedding photos](/qr-code-for-wedding-photos) covers printing.'],
        ['The bar and the photo booth', 'Where the best candid photos get taken.'],
        ['In the thank you message', 'For photos guests find in their camera roll later.'],
      ] },
  ],
  '/wedding-photo-gallery': [
    { h2: 'A gallery that fills itself',
      paragraphs: [
        'Open the gallery on a TV or projector at the reception and watch it grow: the ceremony, the first dance, the aunties on the dance floor at midnight. Each photo a guest uploads appears as soon as they share it. On screen, this is your [wedding memory wall](/wedding-memory-wall).',
        'After the wedding the gallery stays on the couple’s card with every message and voice note, so photos are never split from the wishes that came with them.',
        'Guests enjoy seeing their own shot come up on the big screen, and that is what gets the quieter tables uploading. Leave it running through dinner and the dancing. Nobody has to press anything or pick what goes up. When the night ends, the photos are already in one gallery and nobody has to gather them from phones and group chats. Guests can add a message with a photo, so a picture of the dance floor might come with a note about the night. Anyone who missed the wedding can open the link later and add their own.',
      ] },
    { h2: 'Setting up your shared wedding gallery',
      steps: [
        'Create the wedding card and turn on the Live Memory Wall™.',
        'Print the [QR code for guests’ photos](/qr-code-for-wedding-photos) for your tables and signs.',
        'Open the wall on a screen at the venue for the reception. A TV by the dance floor or the projector used for speeches both work.',
        'Share the link after the day to catch the last photos. For more on planning, visit our [wedding occasion page](/occasions/wedding).',
      ] },
  ],
  '/wedding-photo-album-online': [
    { h2: 'Every guest’s angle in one album',
      paragraphs: [
        'Your photographer covers the big moments. Your guests catch everything else: the candid laughs, the dance floor, what happened behind the scenes. An online album that every guest adds to shows the day from every angle.',
        'Guests upload from the phone’s browser and can add a message with their photos. The album stays with the couple’s card for good. During the reception, the same uploads can play on a [live wall at your venue](/wedding-memory-wall).',
        'Ask guests for the moments the photographer can’t be at: the rooms where people got ready, the journey to the venue, the table at the back, the last dance. Put the link in your invitations and again in the thank you message, because many good pictures turn up a day or two later. A friend who couldn’t come can add old photos of the two of you from years back. Everything ends up in one album that the couple can open whenever they like, next to all the messages guests wrote. Nothing needs sorting by hand.',
      ] },
    { h2: 'Photographer album vs guest album',
      items: [
        ['Photographer', 'Polished, carefully chosen and focused on the key moments: the vows, the rings, the portraits and the first dance.'],
        ['Guests', 'Hundreds of candid shots from every table, including moments the photographer never saw. Here is [how guest photo collection works](/wedding-guest-photo-collection).'],
        ['Together', 'You get the complete day, so use both. The photographer’s set gives you the frames for the wall at home, and the guest album gives you everything around them. Start planning on our [page for weddings](/occasions/wedding).'],
      ] },
  ],
  '/wedding-memory-wall': [
    { h2: 'Your photographer takes the highlights. Your guests capture the rest.',
      paragraphs: [
        'The aunties on the dance floor at midnight. The best man’s face during the speech. The flower girl sneaking a bite of cake. Those photos already exist on your guests’ phones. The Wedding Memory Wall gathers them as they are taken. Put it on a screen at the venue and everyone watches the night come together as it happens.',
      ] },
    { h2: 'Set up in 2 minutes. Works all day.',
      steps: [
        'Create your wedding card and turn on the Live Memory Wall™.',
        'Print or share the QR code Thankeeu makes for you and put it where guests gather: the bar, the tables, the photo booth. Here are [tips for placing the QR code](/qr-code-for-wedding-photos).',
        'Share the link before the day so guests can upload photos from getting ready and from behind the scenes.',
        'Guests scan and upload with no app and no account, and photos show up on the wall straight away. Put it on a venue screen as a live slideshow.',
        'After the wedding, watch your Memory Movie™, built from every photo, message and video.',
      ] },
    { h2: 'Why couples choose a memory wall over a photo only tool',
      items: [
        ['Messages as well as photos', 'Guests add written wishes and voice notes to their photos, so the couple hears what each guest wanted to say.'],
        ['A gift in the same link', 'Guests can add to the [wedding cash gift](/wedding-cash-gift-platform) while they upload.'],
        ['Guests anywhere can join', 'Friends and family who couldn’t travel upload and write from wherever they are. See every [feature for your wedding](/occasions/wedding).'],
      ] },
  ],
  '/qr-code-for-wedding-photos': [
    { h2: 'From setup to live wall in four steps',
      steps: [
        'Create your wedding card. Pick the wedding occasion, turn on the Live Memory Wall™ and set your delivery date. It takes about 2 minutes.',
        'Print the QR code. Thankeeu gives you a print ready code for table cards, the welcome sign and the photo booth.',
        'Guests scan and upload. They point the phone camera at the code and pick from their camera roll, with no app and no account. It takes about 10 seconds.',
        'Watch the wall fill up. Open the [wedding memory wall on a screen](/wedding-memory-wall) or projector and each upload appears as it arrives.',
      ] },
    { h2: 'Printing your wedding QR code',
      items: [
        ['Table cards', 'A small code on each table gets the most uploads. Add a line such as “Share your photos of our day”.'],
        ['Welcome sign', 'Guests see it on arrival and start uploading from the ceremony.'],
        ['Photo booth and bar', 'Where most candid photos are taken.'],
        ['Size', 'Keep the code at least 2 cm (about 1 inch) wide with a white border so every phone can scan it. Test it with a couple of phones before you print the full batch.'],
      ] },
    { h2: 'More than a photo upload tool',
      paragraphs: [
        'Basic QR photo tools stop at pictures. With Thankeeu, guests can add a heartfelt message and a voice note to their wedding photos and put something towards the gift. The same QR code also works as [your online wedding guestbook](/online-wedding-guestbook). After the day, every contribution becomes a cinematic Memory Movie™. The code opens the same [wedding photo sharing app](/wedding-photo-sharing-app) your guests use before and after the day. See [everything we offer for weddings](/occasions/wedding).',
      ] },
  ],
  '/uk-wedding-photo-sharing': [
    { h2: 'Wedding photo sharing for UK venues',
      paragraphs: [
        'From a registry office in London to a barn in the Cotswolds or a castle in Scotland, UK weddings often have patchy signal, and guests don’t want yet another app. Wedding photo sharing with Thankeeu runs in the phone’s browser. Guests scan a QR code on the table and upload. Anything that won’t go through on the venue wifi can be added later from home.',
        'It works alongside your photographer. They cover the formal moments and your guests catch everything else. Guests can add a message with their photos and put something towards a wedding gift in pounds.',
        'Many UK weddings have a gap between the ceremony and the evening do, with guests arriving at different times. A code on the welcome sign catches the day guests and the evening guests, and relatives who couldn’t travel can add photos and wishes from the link. You don’t need to hire any equipment. If the venue has a screen or projector, that is all the live wall needs.',
      ] },
    { h2: 'Tips for UK weddings',
      steps: [
        'Add the link to your save the dates and wedding website so guests can upload from the hen and stag dos.',
        'Put the QR code on every table and on the welcome sign. Our [wedding photo QR code guide](/qr-code-for-wedding-photos) explains sizing.',
        'Ask your venue to put the [live photo wall](/wedding-memory-wall) on their screen during the reception.',
        'Send the link again in your thank you message for the last photos. There is more on our [main wedding page for couples](/occasions/wedding).',
      ] },
  ],
  '/usa-wedding-photo-sharing': [
    { h2: 'Wedding photo sharing for US couples',
      paragraphs: [
        'Your guests will take thousands of photos at the rehearsal dinner, the ceremony, the reception and the after party. Display one QR code and they can add them all to your [shared wedding gallery](/wedding-photo-gallery) from their phones, with nothing to download.',
        'Guests can add a message with their photos and contribute to your wedding gift in USD. Thankeeu works alongside your photographer and videographer and catches the candid moments they can’t, which makes wedding photo sharing in the US easy for guests of every age.',
        'US weddings often run across a whole weekend, with guests flying in from different states. One link covers all of it, from the welcome drinks to the farewell brunch. Relatives who can’t travel can open the same link at home and add their wishes and photos. Grandparents at the back table can join in as easily as the groomsmen, because there is no app and no account. Your planner only needs to print the code and set up a screen for the live wall.',
      ] },
    { h2: 'Tips for US weddings',
      steps: [
        'Put the link on your wedding website so guests can upload from the rehearsal dinner.',
        'Add the QR code to table cards, the welcome sign and the bar. See [how to print your QR code](/qr-code-for-wedding-photos).',
        'Show the live wall on a screen at the reception. Seeing their own photos appear keeps guests adding more through the evening.',
        'Include the link in your thank you notes to gather the last photos. There are more ideas on our [wedding celebrations page](/occasions/wedding).',
      ] },
  ],

  // ── Comparison pages ──────────────────────────────────────────────────────
  '/thankeeu-vs-wedtrove': [
    { h2: 'Wedtrove and Thankeeu at a glance',
      items: [
        ['Wedtrove', 'A tidy photo collection tool for weddings with QR upload, a live slideshow and unlimited guests. It suits couples who only want guest photos gathered.'],
        ['Thankeeu', 'A wedding platform that collects photos plus written wishes, voice blessings, a gift pot and a Memory Movie™, all from one QR code or link. It suits couples who want more than pictures.'],
      ] },
    { h2: 'Why couples choose Thankeeu over Wedtrove',
      items: [
        ['Messages as well as photos', 'Thankeeu collects photos alongside written messages, voice notes from elders, GIFs and a pooled gift. You see who each guest is to you, not only their selfie.'],
        ['A Memory Movie they didn’t expect', 'Every message, photo and voice blessing is put together into a [Memory Movie™ of your guests](/memory-movie), a cinematic film the couple can watch together after the wedding.'],
        ['One link collects everything', 'No separate links for photos, the gift and a [digital guest book](/digital-wedding-guest-book). Thankeeu handles all three from one.'],
      ] },
    { h2: 'When Wedtrove might suit you better',
      paragraphs: [
        'If you only want a gallery of guest photos and don’t need messages, voice notes or a gift, a photo only tool like Wedtrove does that job well. Check its website for current plans and prices.',
        'Both tools let guests upload from a QR code without installing anything, so the choice comes down to what you want at the end. To see how several apps compare on the same points, read our [roundup of wedding photo apps](/best-wedding-photo-sharing-app). Try each one with a friend before the day if you can.',
      ] },
  ],
  '/best-wedding-photo-sharing-app': [
    { h2: 'How we compared wedding photo sharing apps',
      paragraphs: [
        'We judged each app on the points couples ask us about. Can guests upload without installing anything? Is there a live display at the venue, like our [Thankeeu memory wall for venues](/wedding-memory-wall)? Can guests leave a message or voice note, and can the couple receive a gift? And at the end, do you have a folder of photos or a keepsake?',
        'GuestPix, WedUploader and Wedtrove all handle guest photo uploads well. Thankeeu also collects written wishes, voice notes and a wedding gift through the same link, and turns everything into a Memory Movie™. Our [Thankeeu and Wedtrove comparison](/thankeeu-vs-wedtrove) and [GuestPix alternative guide](/guestpix-alternative) go into more detail.',
      ] },
    { h2: 'Which app is right for you?',
      items: [
        ['You only want photos', 'Any dedicated uploader will do. Compare their storage limits and pricing.'],
        ['You want photos and messages', 'Pick a tool that lets guests attach a note to their photos. Thankeeu does, and a voice note too, so a photo of the first dance can come with a word from whoever took it.'],
        ['You want a gift too', 'Thankeeu lets guests put money towards a wedding gift while they upload.'],
        ['You want relatives abroad to join', 'Pick a tool that works from a link as well as a QR code. Family who couldn’t travel can then send photos and wishes from home, and Thankeeu lets them give to the gift too.'],
        ['You want a keepsake', 'Thankeeu’s Memory Movie™ turns every contribution into a film. Guests get in through a [QR code on the tables](/qr-code-for-wedding-photos), so nobody installs anything.'],
      ] },
    { h2: 'Comparing one app in detail',
      paragraphs: [
        'If you already have one app in mind, we wrote a page for each: how [Kululu compares for weddings](/kululu-alternative), what changes if you [switch from POV](/pov-alternative), where [GuestCam differs from Thankeeu](/guestcam-alternative) and when [WedUploader is the better pick](/weduploader-alternative). Each one says plainly when the other app suits you better.',
      ] },
  ],
};

// Per-competitor pages share one structure but not one text.
const ALT = (name, reasons, fit) => [
  { h2: `Why couples look for a ${name} alternative`, items: reasons },
  { h2: 'How Thankeeu works across the wedding',
    items: [
      ['Before the wedding', 'Send the link or QR code with the invitation so people can add messages and photos early.'],
      ['On the day', 'Guests scan a code on the table, and the live wall plays on the venue screen.'],
      ['After the wedding', 'The couple gets everything in one card, plus the Memory Movie™.'],
    ] },
  { h2: `When ${name} might suit you better`, paragraphs: [fit] },
];

Object.assign(LANDING_ARTICLES, {
  '/guestpix-alternative': ALT('GuestPix', [
    ['They want more than a photo collection', 'GuestPix collects guest photos efficiently. Many couples then realise they also want the grandmother’s voice, the best man’s written blessing and the GIF from a college friend. Thankeeu works as a [wedding audio guest book](/wedding-voice-note-guest-book) as well as a photo tool.'],
    ['They want a cash gift without the awkwardness', 'Sending guests to a separate site for a honeymoon fund adds friction, and some never get round to it. Thankeeu puts the gift in the same place guests upload their photos.'],
    ['They want a keepsake, not only files', 'A folder of 400 photos is hard to go back to. Thankeeu turns every contribution into a Memory Movie™, and you don’t have to edit anything.'],
    ['They want voice blessings from elders', 'Hearing a grandparent years from now is something a photo can’t replace. Guests record from their own phone, in their own words.'],
  ], 'If you only need a gallery of guest photos and nothing else, GuestPix is a focused choice. Compare its current plans on its website, or see how it stacks up in our [guide to wedding photo apps](/best-wedding-photo-sharing-app).'),
  '/kululu-alternative': ALT('Kululu', [
    ['They want every kind of message captured', 'Kululu collects photos at the event, and it works well for that. Thankeeu also keeps the grandmother’s voice blessing, the best friend’s tearful written message and the GIF from the maid of honour.'],
    ['They want the gift built in', 'A separate chat for cash gifts leads to confusion and missed contributions. Thankeeu’s gift pot pools the money, and the couple withdraws it to their bank. Here is [how the wedding cash gift works](/wedding-cash-gift-platform).'],
    ['They want a Memory Movie without editing skills', 'Every photo, video, message and voice note is put together into a Memory Movie™ with music. Nobody has to sit down and edit it.'],
    ['They want guests to take part', 'Guests leave written wishes, voice blessings and GIFs as well as photos, so each person adds something of their own to the day.'],
  ], 'If your priority is an event photo feed and nothing more, Kululu may be all you need. Plenty of couples are happy with a simple feed. Compare its current features on its website, and see where it sits in our [wedding photo app comparison](/best-wedding-photo-sharing-app).'),
  '/pov-alternative': ALT('POV', [
    ['They want written messages alongside photos', 'Apps like POV capture lots of camera angles. Couples also want the words: the blessing from the father of the bride, the note from a friend who flew in.'],
    ['They want to give without another platform', 'A separate payment link means fewer people contribute, because it is one more thing to remember after the party. With Thankeeu, guests give and upload from the same QR code.'],
    ['They want voice notes as well as pictures', 'A voice note from a parent or close friend carries a weight an image can’t, and it stays in their own voice.'],
    ['They want nothing to install', 'Thankeeu runs in the phone’s browser on iPhone and Android. Guests scan, upload and they are done. See our [wedding photo upload app](/wedding-photo-upload-app) for how it works.'],
  ], 'If you love the disposable camera feel and only want photos, POV does that well. If you also want wishes, voice notes and a gift in the same place, that is where Thankeeu fits. Compare its current plans on its website, or read our look at [the best wedding photo sharing apps](/best-wedding-photo-sharing-app).'),
  '/guestcam-alternative': ALT('GuestCam', [
    ['They want memories, not only camera rolls', 'GuestCam collects photos from guests’ cameras, and it does that job. Thankeeu also collects the written wishes, voice blessings and GIFs behind those photos.'],
    ['They want cash gifts pooled automatically', 'Guests can contribute any amount while they upload. The money pools without anyone having to coordinate it, and the couple withdraws it to their bank once the card is delivered.'],
    ['They want a film to keep', 'Thankeeu turns every photo, video, message and voice note into a Memory Movie™ set to music. Read more about the [Memory Movie™ for weddings](/memory-movie).'],
    ['They send invitations on WhatsApp', 'Thankeeu’s link opens on any phone without an app, which helps when your invitations go out by WhatsApp.'],
  ], 'If you just want a shared camera roll from your guests, GuestCam is a focused option. You won’t get messages, voice notes or a gift pot, but you may not need them. Think about what you want to open again a year from now. Compare its current plans on its website, or check [our roundup of photo sharing apps](/best-wedding-photo-sharing-app).'),
  '/weduploader-alternative': ALT('WedUploader', [
    ['They want wedding wishes as well as photos', 'A photo holds a moment. A written message or voice blessing says something about a relationship. Thankeeu collects both.'],
    ['They want a cash gift option', 'A standalone photo uploader can’t collect money. Thankeeu’s gift pot handles pooled contributions from guests, who pay by card from any country.'],
    ['They want a keepsake instead of a folder', 'Instead of hundreds of files in a drive, the couple gets a card and a Memory Movie™ to watch together. It reads more like a [wedding memory book](/wedding-memory-book) than a download.'],
    ['They want the whole family to take part', 'Scan, tap, upload. Guests can add a short message on the way. Three steps with no forms or passwords, so grandparents can join in too.'],
  ], 'If all you need is a reliable way to collect guests’ photo and video files, WedUploader is built for exactly that. It keeps things simple, which some couples prefer when they already have a guest book and a gift list sorted elsewhere. Compare its current plans on its website, and see [our full app comparison](/best-wedding-photo-sharing-app) for the rest.'),
});

/** The landing config with its article attached (used by Home and prerender). */
export const withArticle = (landing) => ({ ...landing, article: landing.article || LANDING_ARTICLES[landing.path] || [] });
