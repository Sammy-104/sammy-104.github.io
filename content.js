/* Images/videos live in dist/media/. Leave null for an empty placeholder.
   Image: { type: 'image', src: 'media/photo.jpg', alt: 'Description', caption: '...' }
   Video: { type: 'video', src: 'media/demo.mp4', poster: 'media/poster.jpg', caption: '...' } */
window.PORTFOLIO = {
  background: { src: 'media/pixel-mountains.png' },
  aboutCaptionRevision: "upload-75cd209ce6a2",
  aboutPhotos: [
  {
    "type": "image",
    "src": "media/about-01.jpg",
    "title": "class-lab.jpg",
    "alt": "A group selfie beside a tall tower made from thin sticks in a lecture hall.",
    "caption": "Making the tallest tower with spaghetti and marshmallows."
  },
  {
    "type": "image",
    "src": "media/about-02.jpg",
    "title": "open-sauce.jpg",
    "alt": "A large yellow robot-head sculpture marked Open Sauce outside an exhibition hall.",
    "caption": "Visiting open sauce in sf"
  },
  {
    "type": "image",
    "src": "media/about-03.jpg",
    "title": "yosemite.jpg",
    "alt": "A hiker with a backpack on a rocky trail beside a waterfall and granite cliffs.",
    "caption": "On the way down from half dome"
  },
  {
    "type": "image",
    "src": "media/about-04.jpg",
    "title": "top-of-half-dome.jpg",
    "alt": "A person seated on a rocky ledge overlooking a deep mountain valley.",
    "caption": "Chilling at the top of half dome"
  },
  {
    "type": "image",
    "src": "media/about-05.jpg",
    "title": "pacuare-river.jpg",
    "alt": "Kayakers paddling along a river between green forested banks.",
    "caption": "Kayaking down the Pacuare"
  },
  {
    "type": "image",
    "src": "media/about-06.jpg",
    "title": "waterfall.jpg",
    "alt": "Three people posing on rocks at the foot of a waterfall surrounded by greenery.",
    "caption": "Random waterfall in Costa Rica"
  },
  {
    "type": "image",
    "src": "media/about-07.jpg",
    "title": "on-stage.jpg",
    "alt": "Three musicians performing on stage with a keyboard, bass guitar, and electric guitar.",
    "caption": "Preforming at a charity fundraiser"
  }
],
  projects: {
    library: {
      name: 'Digital Music Library',
      filename: 'digital-music-library',
      category: 'software / organization',
      description: 'Sheet music, a little easier to find.',
      introduction: 'A digital catalogue that makes a music library easier to search and organize.',
      overview: [
        'Bring music library records into a searchable digital catalogue.',
        'Browse scores with titles, composers, and library numbers in one place.',
        'Filter the collection by name, musician, and collection.'
      ],
      notes: [
        'Started with the practical challenge of finding music in a large collection.',
        'Turned the collection into structured digital records.',
        'Built a clearer way to browse the music and find the details of a score.'
      ],
      media: [
        { type: 'image', src: 'media/library-catalogue.png', title: 'catalogue.png', alt: 'Digital Music Library catalogue with score thumbnails, titles, composers, library numbers, and collection filters.', caption: 'The catalogue: scores, composers, and filters in one place.' },
        { type: 'image', src: 'media/library-login.png', title: 'login.png', alt: 'Digital Music Library sign-in screen with the music library logo and username and password fields.', caption: 'The sign-in screen.' }
      ],
      video: null
    },
    drift: {
      name: 'Vollo',
      logo: { src: 'media/vollo-microsoft-store.png' },
      filename: 'vollo',
      category: 'app / file sharing',
      description: 'Files and messages. From your device to theirs.',
      introduction: 'A quick, simple way to share files and messages wirelessly between devices.',
      overview: [
        'Share files and messages wirelessly between devices.',
        'Let the receiver accept or decline incoming transfers.',
        'Choose whether your device is available, requires a PIN, or stays hidden.',
        'Available on the Microsoft Store.'
      ],
      notes: [
        'Keep the transfer flow simple: make accepting or declining an incoming file clear.',
        'Balance easy discovery with privacy through availability and optional PIN settings.',
        'Aim for a predictable experience across devices and operating systems.'
      ],
      media: [
        { type: 'image', src: 'media/drift-receive-dark.png', title: 'receive-dark.png', alt: 'Vollo receive screen in dark mode, showing incoming files and messages.', caption: 'Incoming files and messages, in dark mode.' },
        { type: 'image', src: 'media/vollo-microsoft-store.png', title: 'microsoft-store.png', alt: 'Vollo on the Microsoft Store, showing its blue logo, Drift Development publisher, app description, Open button, and screenshots.', caption: 'Vollo is available on the Microsoft Store.' }
      ],
      video: { type: 'video', src: 'media/drift-promo.mp4', title: 'vollo-promo.mp4', poster: 'media/drift-receive-dark.png', caption: 'A quick look at the app.' }
    }
  }
};
