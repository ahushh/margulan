import Head from 'next/head';
import styles from '../styles/Home.module.css';
import 'semantic-ui-css/semantic.min.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Button,
  Card,
  Checkbox,
  Container, Dimmer, Divider, Form, Grid, Header, Icon, Input, Item, Label, List, Loader, MessageSizeProp, Placeholder, Segment,
} from 'semantic-ui-react';
import Slider from '@mui/material/Slider';
import { useCallback, useEffect, useState } from 'react';
import superagent from 'superagent';
import { IChannel } from '../interfaces/Channel';
import { IMessage } from '../interfaces/Message';
import Link from '@mui/material/Link/Link';

const MessagePlaceholders = () => (<Segment raised>
  <Placeholder>
    <Placeholder.Header image>
      <Placeholder.Line />
      <Placeholder.Line />
    </Placeholder.Header>
    <Placeholder.Paragraph>
      <Placeholder.Line length='medium' />
      <Placeholder.Line length='short' />
    </Placeholder.Paragraph>
  </Placeholder>
  <Placeholder>
    <Placeholder.Header image>
      <Placeholder.Line />
      <Placeholder.Line />
    </Placeholder.Header>
    <Placeholder.Paragraph>
      <Placeholder.Line length='medium' />
      <Placeholder.Line length='short' />
    </Placeholder.Paragraph>
  </Placeholder>

  <Placeholder>
    <Placeholder.Header image>
      <Placeholder.Line />
      <Placeholder.Line />
    </Placeholder.Header>
    <Placeholder.Paragraph>
      <Placeholder.Line length='medium' />
      <Placeholder.Line length='short' />
    </Placeholder.Paragraph>
  </Placeholder>

</Segment>);
export default function Home() {
  const [channels, setChannels] = useState<IChannel[]>([]);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [relevantMessages, setRelevantMessages] = useState<IMessage[]>([]);

  const [channelInput, setChannelInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [distance, setDistance] = useState(1);
  const [certainty, setCertainty] = useState(0.5);

  const [isChannelsLoading, setIsChannelsLoading] = useState(true);
  const [isImportChannelLoading, setIsImportChannelLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isRelevantMessagesLoading, setIsRelevantMessagesLoading] = useState(false);

  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedMessage, setSelectedMessage] = useState('');
  const [searchOptions, setSeachOptions] = useState<'none' | 'certainty' | 'distance'>('none');

  const getAllChannelsHandler = useCallback(() => {
    setIsChannelsLoading(true);
    superagent.get('/api/getChannels').then(({ body: { channels } }) => {
      setChannels(channels);
      setIsChannelsLoading(false);
    })
      .catch((e) => toast('Server Error'))
      .finally(() => setIsChannelsLoading(false));
  }, []);

  const importChannelHandler = useCallback(() => {
    if (channels.map(({ name }) => name).includes(channelInput)) {
      toast('Channels is already added')
      return;
    }
    if (channelInput[0] !== '@') {
      return;
    }
    setIsImportChannelLoading(true);
    superagent.get(`/api/importChannel?channel=${channelInput}`).then(() => {
      setIsImportChannelLoading(false);
      setChannelInput('');
    })
      .then(getAllChannelsHandler)
      .catch((e) => toast('Server Error'))
      .finally(() => setIsImportChannelLoading(false));
  }, [channelInput, getAllChannelsHandler, channels]);

  const getMessagesByChannel = useCallback(() => {
    setIsMessagesLoading(true);
    superagent.get(`/api/getMessagesByChannel?channel=${selectedChannel}`).then(({ body: { messages } }) => {
      setMessages(messages);
      setRelevantMessages([]);
      setIsMessagesLoading(false);
    })
      .catch((e) => toast('Server Error'))
      .finally(() => setIsMessagesLoading(false));
  }, [selectedChannel]);

  useEffect(() => {
    if (selectedChannel !== '') {
      getMessagesByChannel();
    }
  }, [getMessagesByChannel, selectedChannel])

  const searchHandler = useCallback(() => {
    if (selectedChannel === '' || searchInput === '') {
      return;
    }
    setIsMessagesLoading(true);
    const options: any = {};
    if (searchOptions === 'certainty') {
      options.certainty = certainty
    } else if (searchOptions === 'distance') {
      options.distance = distance;
    }
    superagent.get(`/api/searchMessages`).query({ channel: selectedChannel, query: searchInput, ...options })
      .then(({ body: { messages } }) => {
        setMessages(messages);
        setIsMessagesLoading(false);
      })
      .catch((e) => toast('Server Error'))
      .finally(() => setIsMessagesLoading(false));

  }, [certainty, distance, searchInput, searchOptions, selectedChannel]);

  const searchRelevantMessagesHandler = useCallback((id: string) => {
    if (selectedChannel === '' || !id) {
      return;
    }
    setSelectedMessage(id);
    setIsRelevantMessagesLoading(true);
    const options: any = {};
    if (searchOptions === 'certainty') {
      options.certainty = certainty
    } else if (searchOptions === 'distance') {
      options.distance = distance;
    }
    superagent.get(`/api/searchRelevantMessages`).query({ channel: selectedChannel, id, ...options })
      .then(({ body: { messages } }) => {
        setRelevantMessages(messages);
        setIsRelevantMessagesLoading(false);
      })
      .catch((e) => toast('Server Error'))
      .finally(() => setIsRelevantMessagesLoading(false));

  }, [certainty, distance, searchOptions, selectedChannel]);

  useEffect(() => {
    getAllChannelsHandler();
  }, [])

  return (
    <>
      <Head>
        <title>AI Telegram Search</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header as='h1' textAlign='center' dividing>
        Telegram API & Cohere & Weaviate usage example
        <Header.Subheader>
          Context search in Telegram channels using AI
        </Header.Subheader>
      </Header>

      <Container>
        <Grid divided='vertically'>

          <Grid.Row columns={3}>
            <Grid.Column>
              <Header size='medium'>Channels</Header>
              <Input
                action={{
                  color: 'teal',
                  labelPosition: 'right',
                  icon: 'plus',
                  content: 'Import',
                  onClick: importChannelHandler,
                }}
                fluid
                value={channelInput}
                onChange={(event) => setChannelInput(event.target.value)}
                placeholder='@channel'
              />
              <label>Choose a channel to show messages of:</label>
              <Segment loading={isChannelsLoading || isImportChannelLoading} placeholder style={{ justifyContent: 'start' }}>
                {channels.length === 0 ? <Label horizontal>Import a channel e.g. <Link onClick={() => setChannelInput('@MargulanSeissembai')}>@MargulanSeissembai</Link></Label> : null}
                <List selection verticalAlign='top' divided>
                  {channels.map((channel: IChannel) => <List.Item key={channel.name} onClick={() => setSelectedChannel(channel.name)}>
                    <List.Icon name='telegram' size='large' verticalAlign='middle' />
                    <List.Content>
                      <List.Header>{channel.name}</List.Header>
                    </List.Content>
                  </List.Item>)}
                </List>
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Header size='medium'>Messages ({messages.length})</Header>
              <Input
                fluid
                icon={{
                  name: 'search', circular: true, link: true, onClick: searchHandler
                }}
                placeholder='Search in channel...'
                disabled={selectedChannel === ''}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <Segment>
                <Form>
                  <Form.Field>
                    Search Options:
                  </Form.Field>
                  <Form.Field>
                    <Checkbox
                      radio
                      label='None'
                      name='none'
                      value='none'
                      checked={searchOptions === 'none'}
                      onChange={(e, data) => setSeachOptions(data.value as any)}
                    />
                  </Form.Field>

                  <Form.Field>

                    <Checkbox
                      radio
                      label='Distance'
                      name='distance'
                      value='distance'
                      checked={searchOptions === 'distance'}
                      onChange={(e, data) => setSeachOptions(data.value as any)}
                    />
                  </Form.Field>

                  <Form.Field>

                    <Checkbox
                      radio
                      label='Certainty'
                      name='certainty'
                      value='certainty'
                      checked={searchOptions === 'certainty'}
                      onChange={(e, data) => setSeachOptions(data.value as any)}
                    />
                  </Form.Field>
                </Form>
                {searchOptions === 'distance' && <div>
                  <Slider
                    value={distance}
                    onChange={(_, value) => setDistance(value as any)}
                    step={0.025}
                    marks
                    min={0}
                    max={2}
                    valueLabelDisplay="auto"
                  />
                </div>}
                {searchOptions === 'certainty' && <div>
                  <Slider
                    value={certainty}
                    onChange={(_, value) => setCertainty(value as any)}
                    step={0.025}
                    marks
                    min={0}
                    max={1}
                    valueLabelDisplay="auto"
                  />
                </div>}
              </Segment>

              <Segment loading={isMessagesLoading} placeholder>
                {isMessagesLoading && messages.length === 0 ? <MessagePlaceholders /> : null}
                <Card.Group>
                  {messages.map((message) => <Card key={message.message_id} color={message.id === selectedMessage ? 'red' : undefined}>
                    <Card.Content>
                      <Card.Header>Message #{message.message_id}</Card.Header>
                      <Card.Meta>{selectedChannel}</Card.Meta>
                      <Card.Description>
                        #{message.text}
                      </Card.Description>
                    </Card.Content>
                    <Card.Content extra>
                      <Button basic color='blue' onClick={() => searchRelevantMessagesHandler(message.id)}>
                        Search relevant messages
                      </Button>
                    </Card.Content>
                  </Card>)}
                </Card.Group>
              </Segment>

            </Grid.Column>
            <Grid.Column >
              <Header size='medium'>Relevant Messages ({relevantMessages.length})</Header>
              <Segment loading={isRelevantMessagesLoading} placeholder >
                {isRelevantMessagesLoading && relevantMessages.length === 0
                  ? <MessagePlaceholders />
                  : null}
                <Card.Group >
                  {relevantMessages.map((message) => <Card key={message.message_id}>
                    <Card.Content>
                      <Card.Header>Message #{message.message_id}</Card.Header>
                      <Card.Meta>{selectedChannel}</Card.Meta>
                      <Card.Description>
                        #{message.text}
                      </Card.Description>
                    </Card.Content>
                  </Card>)}
                </Card.Group>
              </Segment>
            </Grid.Column>
          </Grid.Row>

        </Grid>
        <ToastContainer position='bottom-left' />
      </Container >
    </>
  );
}
