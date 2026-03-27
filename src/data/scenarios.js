/**
 * Pre-built training scenarios for the Eddie AI Training Console.
 * Each scenario provides context and an opening message for role-play practice.
 */
const scenarios = [
  {
    id: 'red-los',
    title: 'Red LOS light on ZTE',
    description: 'Zoom Fibre client, already rebooted, red LOS light visible.',
    tags: [{ label: 'Playbook A', color: 'green' }, { label: 'Fibre-LOS', color: 'red' }],
    context: 'The client is on Zoom Fibre with a ZTE router. They have already rebooted. They can see a red LOS light on the router.',
    openingMessage: 'Hi, my internet has been down since this morning. I already tried restarting the router but it\'s still not working. There\'s a red light on the front that says LOS.'
  },
  {
    id: 'wireless-no-power',
    title: 'Wireless \u2014 no power lights',
    description: 'Wireless client, router appears dead, PoE not checked.',
    tags: [{ label: 'Playbook C', color: 'green' }, { label: 'PoE', color: 'amber' }],
    context: 'The client is on a wireless connection. Their router has no lights at all \u2014 appears completely dead. They haven\'t checked the PoE unit yet.',
    openingMessage: 'Hello, I have no internet and my router seems completely off. There are no lights on it at all.'
  },
  {
    id: 'one-laptop',
    title: 'Only the laptop has no internet',
    description: 'Phone works fine, laptop won\'t connect to Wi-Fi.',
    tags: [{ label: 'Playbook E', color: 'green' }],
    context: 'The client\'s phone and other devices work fine on Wi-Fi, but their laptop refuses to connect. They haven\'t tried restarting the laptop.',
    openingMessage: 'Hi there, my laptop can\'t connect to the internet but my phone is working fine on the same Wi-Fi. What\'s going on?'
  },
  {
    id: 'iptv-buffering',
    title: 'IPTV buffering constantly',
    description: 'IPTV is unwatchable, Netflix not tested yet.',
    tags: [{ label: 'Playbook G', color: 'green' }],
    context: 'The client uses an IPTV service that is constantly buffering and freezing. They have NOT tested any mainstream streaming services like Netflix or YouTube.',
    openingMessage: 'My IPTV is completely unwatchable \u2014 every channel keeps buffering and freezing. This has been going on for two days now.'
  },
  {
    id: 'blocked-account',
    title: 'Blocked account \u2014 non-payment',
    description: 'Account suspended in Splynx, balance R450.',
    tags: [{ label: 'Splynx check', color: 'amber' }, { label: 'Payment', color: 'red' }],
    context: 'The client\'s account shows as BLOCKED in Splynx due to non-payment. Outstanding balance is R450. The client is unaware their account has been suspended and is asking why their internet is down. If they request payment terms, Eddie must hand off to a human agent.',
    openingMessage: 'Hey, my internet just stopped working out of nowhere. Everything was fine yesterday. Can you help?'
  },
  {
    id: 'wifi-dropping',
    title: 'Wi-Fi dropping on all devices',
    description: 'Multiple devices losing connection, even next to the router.',
    tags: [{ label: 'Playbook F', color: 'green' }],
    context: 'The client says Wi-Fi keeps dropping on multiple devices \u2014 phones, laptop, and smart TV. The issue persists even when standing right next to the router.',
    openingMessage: 'Our Wi-Fi keeps dropping on every device in the house. Even when I\'m standing right next to the router it just keeps disconnecting.'
  }
];

export default scenarios;
