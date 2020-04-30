import Gun from 'gun/gun';
import Sea from 'gun/sea';
Gun.SEA = Sea;

export default GunChat = () => {

  constructor(superpeers){
    this.gun = new Gun(superpeers);
    this.publicName = null;
  }

  const gun = this.gun;

  const join = async (username, password, publicName) => {
    if(!username || !password) return;
      gun.user().create(username, password, (ack) => {
      if (ack.err) {
        gun.user().auth(gunUsername, gunPassword);
      }
    });
    gun.on('auth', () => {
      this.gun.user().get('name').put(publicName)
      this.publicName = publicName;
    })
  }

  const addContact = async (username, publicName) => {
    if(!username) return;
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

  const acceptContactInvite(username, publicName){
    if(!username && !publicName) return;
    const peerByUsername = await gun.get('~@' + username).once();
    if(!peerByUsername) return;
    const pubKey = Object.keys(peerByUsername)[1].substr(1);
    gun.user().get('contacts').get(pubKey).put({
      pubKey: pubKey,
      alias: username,
      name : publicName
    });
    gun.get(gun.user()._.sea.pub).get('invites').get('contacts').get(pubKey).put(null, () => {
      gun.get(gun.user()._.sea.pub).get('invites').get('contacts').get(pubKey).put({null :null})
    })
  }

  const denyContactInvite(pubKey){
    if(!pubKey) return;
    gun.get(gun.user()._.sea.pub).get('invites').get('contacts').get(pubKey).put(null, () => {
      gun.get(gun.user()._.sea.pub).get('invites').get('contacts').get(pubKey).put({null :null})
    })
  }

  const sendMessageToContact(pubKey, msg){
    if(!pubKey) return;
    if(msg.length < 1) return;
    const time = Date.now();
    const otherPeer = gun.user(pubKey);
    const otherPeerKeys = await otherPeer.then();
    const otherPeerEpub = otherPeerKeys.epub;
    const sec = await Gun.SEA.secret(otherPeerEpub, gun.user()._.sea);
    const encMsg = await Gun.SEA.encrypt(msg, sec);
    gun.user().get('pchat').get(pubKey).get(time).put(JSON.stringify({
      msg: encMsg,
      time
    }))
    gun.get('pchat').get(pubKey).get(gun.user().is.pub).get('new').get(time).put(JSON.stringify({
      msg: encMsg,
      time
    }));
    gun.get('pchat').get(pubKey).get(gun.user().is.pub).get('latest').put(JSON.stringify({
      msg: JSON.stringify(encMsg),
      time
    }));
    gun.get('pchat').get(gun.user().is.pub).get(pubKey).get('latest').put(JSON.stringify({
      msg: JSON.stringify(encMsg),
      time
    }));
  }

  const loadMessagesOfContact = async (pubKey, publicName, cb) => {
    if(!pubKey || !cb) return;
    const loadedMsgs = {};
    let loadedMsgsList = []
    const otherPeer = gun.user(pubKey);
    const otherPeerKeys = await otherPeer.then();
    const otherPeerEpub = otherPeerKeys.epub;
    async function loadMsgsOf(path, name){
      path.on((msgs) => {
        if(!msgs) return;
        for (let time in msgs) {
          if(loadedMsgs[time]) continue;
          path.get(time).on(async (msgDataString: any) => {
            loadedMsgs[time] = true;
            if(!msgDataString) return;
            let msgData = msgDataString;
            if (typeof msgDataString === 'string') {
              msgData = JSON.parse(msgDataString);
            }
            if (!msgData || !msgData.msg) return;
            if (typeof msgData.msg === 'string') {
              msgData.msg = JSON.parse(msgData.msg.substr(3, msgData.msg.length));
            }
            const sec = await Gun.SEA.secret(otherPeerEpub, gun.user()._.sea);
            const decMsg: string = await Gun.SEA.decrypt(msgData.msg, sec);
            if (!decMsg) return;
            let msgIndex = loadedMsgsList.length;
            loadedMsgsList.push({
              time : msgData.time,
              msg : decMsg,
              owner : name
            })
            loadedMsgsList.sort((a, b) => {
              return a.time - b.time
            });
            cb(loadedMsgsList)
            gun.get('pchat').get(gun.user().is.pub).get(peerPubKey).get('new').put(null, () => {
              gun.get('pchat').get(gun.user().is.pub).get(peerPubKey).get('new').put({null: null});
            });
          });
        }
      })
    }
    loadMsgsOf(gun.user().get('pchat').get(pubKey));
    loadMsgsOf(gun.user(pubKey).get('pchat').get(gun.user()._.sea.pub));
  }


}
