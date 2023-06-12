import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Data_store } from "@/context/context";
import utils from "@/utils/utils";
import styles from '@/styles/Home.module.css';
import { Container, Form, Button } from 'react-bootstrap';

export default function Home() {
  const router = useRouter();
  const [pin, setPin] = useState();
  const { data, setData } = useContext(Data_store);

  const onCreateGameClick = () => {
    let peerId = utils.makeid();
    let gameObject = {
      hostId: peerId,
      connections: []
    };

    saveGameInfo(peerId);
    router.push(`/games/${peerId}`);
  }

  const onJoinGame = () => {
    let peerId = utils.makeid();
    // save current user name to local storage
    saveGameInfo(peerId);
    // navigate to game page
    router.push(`/games/${pin}`);
  }

  const saveGameInfo = (peerId) => {
    // save current user name to local storage
    localStorage.setItem("gameInfo", JSON.stringify({
      userId: peerId
    }));
  }

  const onPINChange = (pin) => {
    setPin(pin.target.value);
    console.log("new pin " + pin.target.value);
  }

  useEffect(() => {
    if (data == 'f5') {
      window.location.reload();
    }
  }, []);

  return (
    <div className={styles.main}>
            <Container style={{backgroundColor: 'white'}} className='p-3 rounded'>
                <Form>
                  <Form.Group className="mb-3">
                  <Button onClick={onCreateGameClick} style={{width: '100%', background: 'rgb(51, 51, 51)'}}>CREATE A GAME</Button>
                  </Form.Group>
                </Form>
                <Form>
                    <Form.Group className="mb-3">
                        <p className='text-center'>Have a room? enter PIN</p>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Control onChange={(value) => onPINChange(value)} style={{border:'0.125rem solid rgb(204, 204, 204)'}} placeholder='ENTER PIN' />
                    </Form.Group>
                    <Button onClick={onJoinGame} style={{width: '100%', background: 'rgb(51, 51, 51)'}}>ENTER</Button>
                </Form>
            </Container>
    </div>
  )
}
