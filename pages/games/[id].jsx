import React, { useEffect, useState, useContext } from "react";
import { useRouter } from "next/router";
import { Data_store } from "@/context/context";
import axios from "axios";
import peerSrv from "@/utils/peer";
import utils from "@/utils/utils";
import { Container, Card, Button, Row, Col, ListGroup, Badge, Form } from 'react-bootstrap';
import styles from '@/styles/Home.module.css'

export default function Games() {
    const router = useRouter();
    const { id } = router.query;
    const [gameMode, setGameMode] = useState(0);
    const [word, setWord] = useState();
    const [hostWord, setHostWord] = useState();
    const [wordList, setWordList] = useState([]);
    const [error, setError] = useState();
    const [config, setConfig] = useState();
    const [playerName, setPlayerName] = useState();
    const [listPlayer, setListPlayer] = useState([]);
    const [curSong, setCurSong] = useState({
        name: ''
    });
    const { data, setData } = useContext(Data_store);


    var hostConn;

    const getWordTime = () => {
        let time = new Date();
        return time.getHours() + ":" + time.getMinutes();
    }

    const onWordChange = (value) => {
        setWord(value.target.value);
    }

    const sendMsg = () => {
        if (!word) {
            setError("song name must not be empty!");
            return;
        }
        setError("");
        peerSrv.send(`${hostWord.trim()} ${word.trim()}`);
    }

    const onCreateGame = () => {
        if (!word) {
            setError("song name must not be empty!");
            return;
        }
        if (!playerName) {
            setError("player name must not be empty!");
            return;
        }
        setError("Checking with Chống lương lẹo engine...");
        axios.get("/api/hello?keyword=" + encodeURI(word)).then(ret => {
            console.log(`check result for ${word} = ${ret}`);
            let youtubeRef = "https://www.youtube.com/results?search_query=" + encodeURI(word);
            if (ret.data.data == true) {
                // set hostword
                let chunk = word.split(' ');
                setData(word);
                setHostWord(chunk[chunk.length - 1]);
                setWordList([
                    (<ListGroup.Item
                        className="d-flex justify-content-between align-items-start"
                    >
                        <div className="ms-2 me-auto">
                            <h5>{word}</h5>
                            Link youtube: <a href={youtubeRef}>{youtubeRef}</a>
                        </div>
                        <Badge bg="primary" pill>
                            {getWordTime()}
                        </Badge>
                    </ListGroup.Item>),
                    ...wordList
                ]);
                let gameInfo = JSON.parse(localStorage.getItem("gameInfo"));
                gameInfo.userName = playerName + '-' + utils.makeid(3);
                gameInfo.curSong = null;
                gameInfo.curSong = word;
                localStorage.setItem("gameInfo", JSON.stringify(gameInfo));
                setCurSong({
                    name: word
                });
                setWord("");
                setConfig(true);
            } else {
                setError("Cannot find this song, please try another!")
            }
        });
    }

    const onJoinGame = () => {
        if (!playerName) {
            setError("player name must not be empty!");
            return;
        }
        setError("");
        let gameInfo = JSON.parse(localStorage.getItem("gameInfo"));
        gameInfo.userName = playerName;
        localStorage.setItem("gameInfo", JSON.stringify(gameInfo));
        setConfig(true);
        setData(""); //trigger didmount
    }

    const onOutGame = () => {
        peerSrv.shutdown();
        setData("f5");
        router.push("/");
    }

    const onFSongChange = (value) => {
        if (error) {
            setError("");
        }
        setWord(value.target.value);
    }

    const onPlayerNameChange = (value) => {
        if (error) {
            setError("");
        }
        setPlayerName(value.target.value);
    }

    const endTheGame = () => {
        localStorage.removeItem("gameInfo");
        peerSrv.shutdown();
        setData('f5');
        router.push("/");
    }

    useEffect(() => {
        if (!id && gameMode) {
            return;
        }
        // check current gameInfo
        const gameInfo = JSON.parse(localStorage.getItem("gameInfo"));
        if (!peerSrv.dataListener) {
            peerSrv.dataListener = [];
        }
        peerSrv.dataListener = (commingWord, conn) => {
            setData(commingWord);
            // need to send current game stage back
            // current song
            // current hostword
            // current champion
            if (commingWord && commingWord.startsWith("playerName:")) {
                let gameI = JSON.parse(localStorage.getItem("gameInfo"));
                if (!gameI.playerMap) {
                    gameI.playerMap = [];
                }
                gameI.playerMap.push({
                    peer: conn.peer,
                    playerName: commingWord.split('playerName:')[1]
                });
                localStorage.setItem('gameInfo', JSON.stringify(gameI));
                conn.send(`currentSong:${gameI.curSong}`);
            }
        }
        if (id == gameInfo.userId) {
            setGameMode(1); //host
            if (!config) {
                return;
            }
            // init peerjs connection
            peerSrv.init(gameInfo.userId, setHostWord);
        } else {
            setGameMode(2); //player
            if (!config) {
                return;
            }
            peerSrv.init(gameInfo.userId).then(val => {
                // connect to host
                hostConn = peerSrv.instance.connect(id);
                peerSrv.addConnection(hostConn);
                hostConn.on('error', function (err) {
                    console.log("err");
                });
                hostConn.on('open', function () {
                    // first greet
                    let gameInfo = JSON.parse(localStorage.getItem("gameInfo"));
                    peerSrv.send({
                        playerName: gameInfo.userName
                    });
                    // Receive messages from host
                    hostConn.on('data', function (data) {
                        console.log('Received', data);
                        setData(data);
                    });
                });
                hostConn.on('close', function () {
                    peerSrv.shutdown();
                    router.push("/");
                });
            });
        }
    }, []);

    useEffect(() => {
        if (data && data.startsWith('outGame:')) {
            setListPlayer(list => list.filter(player => player == (<p>{data.split('outGame:')[1]}</p>)));
            return;
        }
        if (data && data.startsWith("playerName:")) {
            let name = data.split("playerName:");
            setListPlayer([
                (<p>{name}</p>),
                ...listPlayer
            ])
            return;
        }
        if (gameMode == 2 && data && data.startsWith("currentSong:")) {
            let name = data.split("currentSong:");
            let gameInfo = JSON.parse(localStorage.getItem("gameInfo"));
            gameInfo.curSong = name[1];
            localStorage.setItem("gameInfo", JSON.stringify(gameInfo));
            setCurSong({
                name: name[1]
            })
            let chunk = name[1].split(' ');
            setHostWord(chunk[chunk.length - 1].trim());
            return;

        }
        //new word com
        if (!data || !config) return;
        if (!data.startsWith(hostWord)) {
            return;
        }

        // check with engine
        if (gameMode == 1) {
            axios.get("/api/hello?keyword=" + encodeURI(data)).then(ret => {
                console.log(`check result for ${data} = ${ret}`);
                let youtubeRef = "https://www.youtube.com/results?search_query=" + encodeURI(data);
                if (ret.data.data == true) {
                    // set hostword
                    let chunk = data.split(' ');
                    setHostWord(chunk[chunk.length - 1]);
                    setWordList([
                        (<ListGroup.Item
                            className="d-flex justify-content-between align-items-start"
                        >
                            <div className="ms-2 me-auto">
                                <h5>{data}</h5>
                                Link youtube: <a href={youtubeRef}>{youtubeRef}</a>
                            </div>
                            <Badge bg="primary" pill>
                                {getWordTime()}
                            </Badge>
                        </ListGroup.Item>),
                        ...wordList
                    ]);
                    let gameInfo = JSON.parse(localStorage.getItem("gameInfo"));
                    gameInfo.curSong = data;
                    localStorage.setItem("gameInfo", JSON.stringify(gameInfo));
                    setCurSong({
                        name: data
                    });
                    // broadcast this new song to all players
                    peerSrv.send(data);
                }
            });
        } else if (gameMode == 2) {
            // set hostword
            let chunk = data.split(' ');
            setHostWord(chunk[chunk.length - 1]);
            setCurSong({
                name: data
            });
            let youtubeRef = "https://www.youtube.com/results?search_query=" + encodeURI(data);
            setWordList([
                (<ListGroup.Item
                    className="d-flex justify-content-between align-items-start"
                >
                    <div className="ms-2 me-auto">
                        <h5>{data}</h5>
                        <a href={youtubeRef}>Link youtube</a>
                    </div>
                    <Badge bg="primary" pill>
                        {getWordTime()}
                    </Badge>
                </ListGroup.Item>),
                ...wordList
            ])
        }
    }, [data]);

    useEffect(() => {
        if (!config || peerSrv.instance) {
            return;
        }
        const gameInfo = JSON.parse(localStorage.getItem("gameInfo"));
        if (gameMode == 1) {
            // init peerjs connection
            peerSrv.init(gameInfo.userId, setHostWord);
            return;
        }
        peerSrv.init(gameInfo.userId).then(val => {
            // connect to host
            hostConn = peerSrv.instance.connect(id);
            peerSrv.addConnection(hostConn);
            hostConn.on('error', function (err) {
                console.log("err");
            });
            hostConn.on('open', function () {
                // first greet
                const greet = setTimeout(() => {
                    hostConn.send("playerName:" + gameInfo.userName);
                    clearTimeout(greet);
                }, 3000);
                // Receive messages from host
                hostConn.on('data', function (data) {
                    console.log('Received', data);
                    setData(data);
                });
            });
            hostConn.on('close', function () {
                peerSrv.shutdown();
                router.push("/");
            });
        });
    }, [config])

    if (gameMode == 1 && config) {
        return (
            <div className={styles.game}>
                <Container fluid>
                    <Row>
                        <Col>
                            <Card className="mb-3" style={{ height: '100%' }}>
                                <Card.Header>Game Board</Card.Header>
                                <Card.Body>
                                    <ListGroup className="overflow-auto" style={{ maxHeight: '50vh' }}>
                                        {wordList}
                                    </ListGroup>
                                </Card.Body>
                                <Card.Footer>
                                    <Container className="m-3">
                                        <Row>
                                            <Col md="auto" style={{ display: 'flex', alignItems: 'center' }}>
                                                <h3>{hostWord}</h3>
                                            </Col>
                                            <Col>
                                                <Form>
                                                    <Form.Group>
                                                        <Form.Control onChange={(value) => onWordChange(value)} style={{ padding: '.7rem .75rem' }} placeholder='ENTER WORD' />
                                                    </Form.Group>
                                                </Form>
                                            </Col>
                                            <Col md="auto" style={{ display: 'flex', alignItems: 'center' }}>
                                                <Button onClick={sendMsg}>KAMEHA!</Button>
                                            </Col>
                                        </Row>
                                    </Container>
                                </Card.Footer>
                            </Card>
                        </Col>
                        <Col xs lg="2">
                            <Card className="mb-3">
                                <Card.Body>
                                    <Card.Title>Champion</Card.Title>
                                    <Card.Text>
                                        <p>current song:</p><h5>{curSong.name}</h5>
                                        <p>current player: </p>
                                    </Card.Text>
                                    <Button onClick={endTheGame} variant="primary">END GAME</Button>
                                </Card.Body>
                            </Card>
                            <Card>
                                <Card.Body>
                                    <Card.Title>List players</Card.Title>
                                    <Card.Text className="overflow-auto" style={{ maxHeight: '50vh' }}>
                                        {listPlayer}
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    } else if (gameMode == 1 && !config) {
        return (<div className={styles.game}>
            <Container fluid>
                <Card className="mb-3">
                    <Card.Header>Setup Game</Card.Header>
                    <Card.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <p className='text-center'>Enter the start song name</p>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Control onChange={(value) => onFSongChange(value)} style={{ border: '0.125rem solid rgb(204, 204, 204)' }} placeholder='ENTER SONG NAME' />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <p className='text-center'>Enter player name</p>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Control onChange={(value) => onPlayerNameChange(value)} style={{ border: '0.125rem solid rgb(204, 204, 204)' }} placeholder='ENTER PLAYER NAME' />
                            </Form.Group>
                            <Button onClick={onCreateGame} style={{ width: '100%', background: 'rgb(51, 51, 51)' }}>CREATE GAME</Button>
                        </Form>
                    </Card.Body>
                    {error && <Card.Footer>
                        <p>{error}</p>
                    </Card.Footer>}
                </Card>
            </Container>
        </div>);
    }

    if (gameMode == 2 && config) {
        return (
            <div className={styles.game}>
                <Container fluid>
                    <Row>
                        <Col>
                            <Card className="mb-3" style={{ height: '100%' }}>
                                <Card.Header>Game Board</Card.Header>
                                <Card.Body>
                                    <ListGroup className="overflow-auto" style={{ maxHeight: '50vh' }}>
                                        {wordList}
                                    </ListGroup>
                                </Card.Body>
                                <Card.Footer>
                                    <Container className="m-3">
                                        <Row>
                                            <Col md="auto" style={{ display: 'flex', alignItems: 'center' }}>
                                                <h3>{hostWord}</h3>
                                            </Col>
                                            <Col>
                                                <Form>
                                                    <Form.Group>
                                                        <Form.Control onChange={(value) => onWordChange(value)} style={{ padding: '.7rem .75rem' }} placeholder='ENTER WORD' />
                                                    </Form.Group>
                                                </Form>
                                            </Col>
                                            <Col md="auto" style={{ display: 'flex', alignItems: 'center' }}>
                                                <Button onClick={sendMsg}>FIRE!</Button>
                                            </Col>
                                        </Row>
                                    </Container>
                                </Card.Footer>
                            </Card>
                        </Col>
                        <Col xs lg="2">
                            <Card className="mb-3">
                                <Card.Body>
                                    <Card.Title>Champion</Card.Title>
                                    <Card.Text>
                                        <p>current song: </p><h5>{curSong.name}</h5>
                                        <p>of player: </p>
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                            <Card>
                                <Card.Body>
                                <Button onClick={onOutGame} style={{ width: '100%', background: 'rgb(51, 51, 51)' }}>OUT GAME</Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    } else if (gameMode == 2 && !config) {
        return (<div className={styles.game}>
            <Container fluid>
                <Card className="mb-3">
                    <Card.Header>Hi Champion!</Card.Header>
                    <Card.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <p className='text-center'>Enter player name</p>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Control onChange={(value) => onPlayerNameChange(value)} style={{ border: '0.125rem solid rgb(204, 204, 204)' }} placeholder='ENTER PLAYER NAME' />
                            </Form.Group>
                            <Button onClick={onJoinGame} style={{ width: '100%', background: 'rgb(51, 51, 51)' }}>JOIN GAME</Button>
                        </Form>
                    </Card.Body>
                    {error && <Card.Footer>
                        <p>{error}</p>
                    </Card.Footer>}
                </Card>
            </Container>
        </div>);
    }

    return (
        <div className={styles.main}>
            <Container fluid>
                <p>No game here</p>
            </Container>
        </div>
    );
}