class PeerService {
    instance;
    id;
    listeners;
    dataListener;

    init(id) {
        return new Promise((resolve, reject) => {
            import("peerjs").then(({ default: Peer }) => {
                if (this.instance) {
                    return;
                }

                this.listeners = [];
                this.id = id;
                this.instance = new Peer(id);

                this.instance.on('open', function (id) {
                    resolve(id);
                    console.log('My peer ID is: ' + id);
                    this.instance.on("connection", (conn) => {
                        console.log("NEW CONNECTION TO ME + " + conn.peer);
                        // others connect to me
                        this.listeners.push(conn);

                        // Receive messages fromt this conn
                        conn.on('data', function (data) {
                            console.log('Received', data);
                        });
                    });
                });

                this.instance.on('error', function (err) {
                    reject(err);
                    console.log("err" + err);
                });
            });
        });
    }


    init(id, callback) {
        return new Promise((resolve, reject) => {
            import("peerjs").then(({ default: Peer }) => {
                if (this.instance) {
                    return;
                }

                this.listeners = [];
                this.id = id;
                this.instance = new Peer(id);

                this.instance.on('open', function (id) {
                    resolve(id);
                    console.log('My peer ID is: ' + id);
                });

                this.instance.on("connection", (conn) => {
                    console.log("NEW CONNECTION TO ME + " + conn.peer);
                    // others connect to me
                    this.listeners.push(conn);

                    // Receive messages fromt this conn
                    var self = this;
                    conn.on('data', function (data) {
                        console.log('Received', data);
                        self.dataListener(data, conn);
                    });
                    conn.on('close', () => {
                        let gameInfo = JSON.parse(localStorage.getItem("gameInfo"));
                        if (!gameInfo.playerMap) {
                            return;
                        }
                        let curPlayer = gameInfo.playerMap.filter(player => player.peer == conn.peer);
                        console.log(`player ${curPlayer.playerName} is out`);
                        self.dataListener(`outGame:${curPlayer.playerName}`);
                    });
                });

                this.instance.on('error', function (err) {
                    reject(err);
                    console.log("err" + err);
                });
            });
        });
    }

    addConnection(conn) {
        this.listeners.push(conn);
    }

    send(message) {
        for (let index = 0; index < this.listeners.length; index++) {
            this.listeners[index].send(message);
        }
    }

    shutdown() {
        if (!this.instance) return;
        this.listeners = [];
        this.instance.disconnect();
        this.instance.destroy();
    }
}

export default new PeerService();