import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import fs from 'fs'
import path from 'path'
import Mastodon from 'mastodon-api'
import AppBar from '@material-ui/core/AppBar'
import ToolBar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import Avatar from '@material-ui/core/Avatar'
import CardContent from '@material-ui/core/CardContent'
import Paper from '@material-ui/core/Paper'


// def Component App
export default class App extends Component {
  constructor(props) {
    super(props)
    this.apiUri = 'https://pawoo.net/api/v1/'
    this.loadInfo() // ファイルからアクセストークンを読み込み、APIクライアントを作成。
    this.state = {
      tootdata: '',
      timelines: []
    }
  }
  // when Component mounted
  componentDidMount () {
    this.loadTimelines()
    setInterval(() => {
      this.loadTimelines()
    }, 1000 * 30) // report every 4 sec
  }
  // make API cli
  loadInfo () {
    // get access token
    const fileToken = path.join('token.json')
    try {
      fs.statSync(fileToken)
    } catch (err) {
      window.alert('先にアクセストークンを取得してください')
      window.close()
      return
    }
    this.token = fs.readFileSync(fileToken)
    // main
    this.mstdn = new Mastodon({
      access_token: this.token,
      timeout_ms: 60 * 1000,
      api_url: this.apiUri
    })
  }
  // read timelines
  loadTimelines () {
    this.mstdn.get('timelines/home', {})
      .then(res => {
        this.setState({timelines: res.data})
      })
  }
  // when textbox update
  handleText (e) {
    this.setState({tootdata: e.target.value})
  }
  // toot
  toot (e) {
    this.mstdn.post(
      'statuses',
      {status: this.state.tootdata},
      (err, data, res) => {
        if (err) {
          console.error(err)
          return
        }
        this.setState({tootdata: ''})
        this.loadTimelines()
      }
    )
  }
  // render
  render () {
    return (
      <div>
        <AppBar position="static" color="primary">
          <ToolBar>
            <Typography variant="h5" color="inherit">
              Mastodon Client
            </Typography>
          </ToolBar>
        </AppBar>
        <TextField
          label="New Toot"
          multiline
          rows="4"
          variant="outlined"
          margin="normal"
          value={this.state.tootdata}
          onChange={e => this.handleText(e)} />
        <div/>
        <Button variant="extendedFab" color="secondary" onClick={e => this.toot(e)}>Toot</Button>
        {this.renderTimelines()}
      </div>
    )
  }
  // show timeline
  renderTimelines () {
    const lines = this.state.timelines.map(e => {
      console.log(e)
      // when boosted
      let memo = null
      if (e.reblog) {
        memo = (<p style={{backgroundColor: "#89C9FA"}}>{e.account.display_name}さんがブーストしました</p>)
        e = e.reblog
      }
      // content every toot
      return (
        <div key={e.id}>
          <Card>
            <CardHeader
              avatar={
                <Avatar src={e.account.avatar}></Avatar>
              }
              title={e.account.display_name}
            />
            <CardContent>
              <Typography component="p" variant="h6">
                {memo}
                <span dangerouslySetInnerHTML={{__html: e.content}} />
              </Typography>
            </CardContent>
          </Card>
        </div>
      )
    })
    return (
      <div>
        <div style={{marginTop: "10px"}}/>
        <Paper>
          <Typography variant="h5">Timelines</Typography>
          {lines}
        </Paper>
      </div>
    )
  }
}

// update DOM
ReactDOM.render(<App />, document.getElementById('root'))
