// Describe current website operation and third-party services.
export const legalContent = [
  {
    slug: 'about', title: 'About Sled Games', seoTitle: 'About Sled Games — Who Makes It, How We Check the Games',
    description: 'Sled Games is an independent winter game site run by Sean. Learn how game details are checked, where the embeds come from, and how corrections are handled.',
    intro: 'Sled Games is a small, independent site about winter browser games: sledding, snowboarding, skiing, and Christmas games. One person, Sean, builds and maintains the site and is responsible for its guides.',
    published: '2026-10-09', updated: '2026-11-02',
    sections: [],
  },
  {
    slug: 'contact', title: 'Contact Us', description: 'Contact Sean, the Sled Games editor, about game issues, corrections, privacy or copyright. Find the email address and details to include in your report.',
    intro: 'Have a question or found something we should fix?',
    sections: [
      { title: 'Game and website issues', paragraphs: ['When reporting a problem, include the page URL, a brief description of what happened, and your browser and device type. If a game does not load, let us know whether the issue occurs before or after the game window appears. Please do not send passwords or sensitive account information.'] },
      { title: 'Corrections and suggestions', paragraphs: ['If you notice inaccurate game information, share the affected page and a reliable source for the correction. You can also suggest winter games for consideration. A suggestion does not guarantee publication: we need to confirm that an authorized browser embed is available.'] },
      { title: 'Privacy and copyright requests', paragraphs: ['For a privacy question, explain the relevant website interaction without including unnecessary personal details. For a copyright concern, identify the work, the affected URL, and your relationship to the rights holder. Our Copyright page lists the information that helps us review a report.'] },
    ],
  },
  {
    slug: 'privacy-policy', title: 'Privacy Policy', description: 'Read how Sled Games handles visits, comments, and contact messages, and how third-party game embeds, advertising cookies, and Google AdSense relate to privacy.',
    intro: 'Information about this website and third-party content.',
    sections: [
      { title: 'Website visits', paragraphs: ['Sled Games does not offer user accounts, payments, or subscriptions. We use Google Analytics to understand visits and use of this website. Our hosting provider may process technical request data, such as an IP address, requested URL, browser information, and request time, to deliver the website and operate its service.'] },
      { title: 'Game comments', paragraphs: ['Where commenting is available, submitting a comment sends us your chosen nickname, comment text, and the game it concerns. We store these details, submission and moderation timestamps, moderation status, and any owner reply in Cloudflare D1. New comments are held for review. Approved nicknames, comments, submission times, and owner replies are public; pending and rejected comments are available only to the site owner. Choose a nickname that does not identify you and avoid sharing personal or sensitive information.', 'Comments and replies remain stored until the site owner removes them. To request removal, use the contact address on our Contact Us page and include the game page and enough detail to identify the comment. No email address or account is required to comment.'] },
      { title: 'Comment spam prevention', paragraphs: ['When you submit a comment, we use Cloudflare Turnstile to check for automated abuse. Cloudflare processes technical and challenge data for this security check. Our comment database does not store your raw IP address with your comment. A separate rate-limit record uses a keyed hash of the IP address, request counts, and timing information to limit repeated submissions. These records expire after 24 hours and are removed by hourly cleanup, normally within 25 hours of their last update. Hosting and security providers may process request data separately to operate and protect their services.'] },
      { title: 'Messages you send us', paragraphs: ['Our contact form prepares an email draft in your browser. Preparing or copying a draft does not submit it to us. You choose whether to send it using your email app or webmail. If you email us, your message and email address are used to respond to your request and investigate the issue you report. Send only the information needed for that purpose.'] },
      { title: 'Third-party game embeds', paragraphs: ['On its game page, Sled Rider loads automatically in an iframe from AZGames at gamea.azgame.io. Other configured games may use GameDistribution or GameMonetize. Loading an iframe connects your browser to the platform, which may receive technical request data and may use cookies, local storage, analytics, or advertising technologies according to its own policies. GameDistribution embeds include the URL of the game page as a referrer parameter. Third-party practices are governed by the platform and its advertising partners.'] },
      { title: 'Google AdSense and advertising cookies', paragraphs: ['We use Google AdSense to serve advertising outside the game window. Google and its advertising partners may use cookies or similar technologies to serve, personalise and measure advertisements. You can manage cookies through your browser settings.'] },
      { title: 'Your choices', paragraphs: ['Your browser settings can restrict cookies and clear stored data. Restricting third-party storage may affect embedded games. You can avoid loading third-party game content by leaving a game page before a configured iframe loads. Use the contact address on our Contact Us page for questions about information you have sent to us.'] },
      { title: 'Changes to this page', paragraphs: ['We will update this policy when the website adds features that change how information is handled. Review this page for the current description of website operation.'] },
    ],
  },
  {
    slug: 'terms-of-use', title: 'Terms of Use', description: 'Read the terms for browsing Sled Games and using third-party game embeds, including website access, acceptable use, game availability, and publisher terms.',
    intro: 'Guidelines for using Sled Games.',
    sections: [
      { title: 'Using the website', paragraphs: ['Sled Games provides game information and access to authorized browser game embeds when available. There is no website access fee, login requirement, or subscription. Use the website for lawful personal browsing and play. Do not attempt to disrupt the service, exploit its hosting, or interfere with other visitors.'] },
      { title: 'Posting comments', paragraphs: ['Where comments are available, keep them relevant to the game and respectful of other people. Do not post spam, impersonate someone else, share private information, or submit content that infringes another person\'s rights. By submitting a comment, you allow us to store, review, and display it with your nickname and an owner reply. Comments require approval before publication. We may reject or remove comments; submitting one does not guarantee that it will appear.'] },
      { title: 'Third-party games', paragraphs: ['Games are supplied by separate developers and publishing platforms. Their terms and privacy policies apply to their services and content. We do not control their advertisements, in-game features, or availability. Follow the instructions and terms provided inside the game or by its platform.'] },
      { title: 'Availability and information', paragraphs: ['An embedded game may become unavailable because of changes at its platform. Game descriptions and instructions may change as information is verified. We do not promise uninterrupted access or compatibility with every browser or device.'] },
      { title: 'Content and intellectual property', paragraphs: ['Game names, artwork, and embedded games belong to their respective rights holders. Access through an authorized embed does not transfer ownership or grant permission to copy or redistribute game files. Contact us if you believe content on a page infringes your rights.'] },
      { title: 'Questions and updates', paragraphs: ['Use the Contact Us page to report problems or ask about these terms. We may update this page as website features change.'] },
    ],
  },
  {
    slug: 'copyright', title: 'Copyright', description: 'Read how Sled Games uses authorized game embeds and handles copyright concerns. Find the information needed to report an affected page or request a correction.',
    intro: 'Respecting the people who make the games.',
    sections: [
      { title: 'Game ownership', paragraphs: ['All game names, artwork, and third-party game content belong to their respective owners. Sled Games uses authorized publisher embeds for playable games and does not host copied game files. An embed is used under the publishing platform’s applicable permission; it does not transfer ownership of a game to this website.'] },
      { title: 'Reporting a concern', paragraphs: ['If you are a rights holder or authorized representative, send your name and contact details, identify the protected work, and provide the exact Sled Games URL that concerns you. Explain the issue and include any information that establishes your relationship to the work. Use the contact address on the Contact Us page.'] },
      { title: 'Reviewing reports', paragraphs: ['We review reports to identify the affected content and understand the requested action. Where appropriate, we can correct page information or remove an embed while the issue is investigated. We may need more information to distinguish the game provider’s content from content published on our own page.'] },
      { title: 'Publisher content', paragraphs: ['If the issue concerns the game software, in-game advertising, or content served by the platform, the developer or publishing platform may also need to be contacted. Please identify that distinction in your report when possible.'] },
    ],
  },
];
