import Gun from 'gun/gun';
import Sea from 'gun/sea';
Gun.SEA = Sea;

export default GunChat = () => {

  constructor(superpeers){
    this.gun = new Gun(superpeers);
    this.publicName = null;
  }

  const join = async (username, password, publicName) => {
    if(!username || !password) return;
    this.gun.user().create(username, password, (ack) => {
      if (ack.err) {
        this.gun.user().auth(gunUsername, gunPassword);
      }
    });
    this.gun.on('auth', () => {
      this.gun.user().get('name').put(publicName)
      this.publicName = publicName;
    })
  }

  const addContact = async (username, publicName) => {
    if(!username) return;
    const gun = this.gun;
    const peerByUsername = await gun.get('~@' + username).once();
    if(!peerByUsername) return;
    const pubKey = Object.keys(peerByUsername)[1].substr(1);
    gun.user().get('contacts').get(pubKey).put({
      pubKey: pubKey,
      alias: username,
      name : publicName
    });
    gun.get(pubKey).get('invites').get('contacts').get(gun.user().is.pub).put({
      pubKey: gun.user().is.pub,
      alias: gun.user().is.alias,
      name : this.publicName
    });
  }

  const loadContacts = async (cb) => {
    if(!cb) return;
    const gun = this.gun;
    const loadedContacts = {};
    const contactsList = [];
    gun.user().get('contacts').on((contacts) => {
      if (!contacts) return;
      for (let pubKey in contacts) {
        if (pubKey === '_' || peerPub === 'null' || loadedContacts[pubKey]) continue;
        gun.user().get('contacts').get(peerPub).on((contact: any) => {
          if (!contact || !contact.name || loadedContacts[peerPub]) return;
          loadedContacts[peerPub] = true;
          let contactIndex = contactsList.length;
          contactsList.push({
            pubKey : contact.pubKey,
            alias : contact.alias,
            name : contact.name
          });
          cb(contactsList)
          //CHECK FOR NOTIFICATIONS
          gun.get('pchat').get(gun.user().is.pub).get(contact.pubKey).get('new').on((newMsgs: any) => {
            let newCount = 0;
            for (const time in newMsgs) {
              if (time === '_' || !newMsgs[time]) continue;
              newCount += 1;
            }
            contactsList[contactIndex].notifCount = newCount;
            cb(contactsList)
          });
        })
      }
    });
  }

  const loadContactInvites = async (cb) => {
    if(!cb) return;
    const gun = this.gun;
    const invitesList = []
    const loadedInvites = {};
    gun.get(gun.user()._.sea.pub).get('invites').get('contacts').on(async (contacts: any) => {
      for (let pubKey in contacts) {
        if (pubKey === '_' || pubKey === 'null' || loadedInvites[pubKey]) continue;
        gun.get(gun.user()._.sea.pub).get('invites').get('contacts').get(pubKey).once((contact: any) => {
          if(!contact || !contact.name || loadedInvites[contact.pubKey]) return;
          gun.user().get('contacts').get(peerPub).once(async (savedContact: any) => {
            if(savedContact && savedContact.name) return;
            loadedInvites[contact.pubKey] = true;
            invitesList.push({
              name: contact.name,
              pubKey: contact.pubKey,
              alias: contact.alias,
            })
            cb(invitesList)
          })
        })
      }
    });
  }

}
